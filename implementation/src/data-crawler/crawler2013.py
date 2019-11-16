import scrapy

PARTEIEN = [str(i) for i in range(1, 13)]
PARTEI_NAMEN = [
    'CSU',
    'SPD',
    'Freie Wähler',
    'Grüne',
    'FDP',
    'Die Linke',
    'ÖDP',
    'REP',
    'Bayern Partei',
    'BüSo',
    'Die Freiheit',
    'Piraten',
]

def build_url(regierungsbezirkId, partyId, pageIndex):
    return "http://www.landtagswahl2013.bayern.de/tabz1{}{:0>2}{}.html".format(regierungsbezirkId, partyId, pageIndex)


# Function for obtaining a table cell's content
def extract_cell_content(cells):
    return [c.xpath("string(.)").extract()[0].translate(str.maketrans({'\n': '', '\t': '', '-': ''})).strip() for c in cells]


class Landtagswahlen2018Spider(scrapy.Spider):
    pt_ind = 0

    name = "LW2018Spider"
    start_urls = []

    custom_settings = {
        'HTTPERROR_ALLOWED_CODES': [404],
    }

    def __init__(self, regierungsbezirkId, **kwargs):
        self.start_urls = [
            build_url(regierungsbezirkId, PARTEIEN[0], 1)
        ]
        self.regierungsbezirkId = regierungsbezirkId
        super().__init__(**kwargs)

    def parse(self, response):
        # Assume we hit 404 because no more pages exist => return content collected so far
        if response.status == 404:
            for resulting_row in response.meta.get('result', []):
                yield resulting_row

            self.pt_ind += 1
            if len(PARTEIEN) == self.pt_ind:
                return

            yield scrapy.Request(build_url(self.regierungsbezirkId, PARTEIEN[self.pt_ind], 1), meta={
                'column_names': response.meta.get('column_names', None),
                'result': response.meta.get('result', None),
                'page_index': 1
            }) 
            return

        # Find table to extract info from
        tablearr = response.xpath('.//table')
        if len(tablearr) != 2:
            print("ERROR: expected two tables on page but received " + str(len(tablearr)))
            exit(-1)
        table = tablearr[0]

        # Extract column names from header, building on previous requests
        header_cols = table.xpath(".//tr/th")
        new_column_keys = new_column_keys = list(
            filter(
                lambda x: x != "Stimmkreis" and x != "Bewerber", 
                    extract_cell_content(header_cols[6:8])
                    +
                    extract_cell_content(header_cols[1:5])
                    +
                    extract_cell_content(header_cols[8:])
                )
            )
        partyName = new_column_keys[-1]
        del new_column_keys[-1]

        column_names = response.meta.get('column_names', None)
        if column_names is None:
            # No columns exist yet => include overlapping columns
            column_names = new_column_keys
        else:
            # First six columns are repeating, truncate those            
            column_names = list(set(column_names).union(set(filter(lambda col: col not in column_names, new_column_keys))))

        # Get index for next page
        next_page_index = response.meta.get('page_index', None)
        if next_page_index is None:
            next_page_index = 1
        next_page_index = next_page_index + 1
        next_url = build_url(self.regierungsbezirkId, PARTEIEN[self.pt_ind], next_page_index)

        # Extract rows from table
        new_result = []
        for row in table.xpath(".//tr"):
            cell_content = extract_cell_content(row.xpath(".//td"))
            if len(cell_content) <= 1:
                continue

            old_content = []
            new_row_content = {}
            if len(cell_content) == len(new_column_keys):
                # Single row in dictionary format
                new_row_content = {**{
                    "regierungsbezirk-id": self.regierungsbezirkId,
                    "partei-id": PARTEIEN[self.pt_ind],
                    "partei-name": PARTEI_NAMEN[self.pt_ind] # EVTL extrahierten Parteinamen nehmen?
                    }, 
                    **{ new_column_keys[i]:cell_content[i] for i in range(0,len(new_column_keys)) }}

                old_result = response.meta.get('result', None)
                if old_result is None:
                    new_result += [new_row_content]
                    continue

                # Some rows don't have a Nr. attr (-.-)
                old_content = [content for content in old_result if content.get('Nr.', -1) == new_row_content.get('Nr.', -2) and content['partei-id'] == new_row_content['partei-id']]
            else:
                # Special case for bottom most rows
                special_row_keys = new_column_keys[1:2] + new_column_keys[4:]
                new_row_content = {**{
                    "regierungsbezirk-id": self.regierungsbezirkId,
                    "partei-id": PARTEIEN[self.pt_ind],
                    "partei-name": PARTEI_NAMEN[self.pt_ind] # EVTL extrahierten Parteinamen nehmen?
                    }, 
                    **{ special_row_keys[i]:cell_content[i] for i in range(0,len(special_row_keys)) }} 

                old_result = response.meta.get('result', None)
                if old_result is None:
                    new_result += [new_row_content]
                    continue

                old_content = [content for content in old_result if content['Name'] == new_row_content['Name'] and content['partei-id'] == new_row_content['partei-id']]


            # Add row to result (or merge/update existing)
            if len(old_content) == 0:
                # No previous entry with this id
                new_result += [new_row_content]
            else:
                # Merge content 
                row_content = {**old_content[0], **new_row_content}
                new_result += [row_content]

        # Request subsequent page and pass data to next request
        yield scrapy.Request(next_url, meta={
            'column_names': column_names,
            'result': new_result,
            'page_index': next_page_index
        })