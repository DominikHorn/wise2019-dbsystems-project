import scrapy
from parteien import PARTEIEN

def build_url(regierungsbezirkId, partyId, pageIndex):
    url = "https://www.landtagswahl2018.bayern.de/ergebnis_einzelbewerber_{}_{}_{}.html".format(regierungsbezirkId, partyId, pageIndex)
    print("Requesting:", url)
    return url

class Landtagswahlen2018Spider(scrapy.Spider):
    pt_ind = 0

    name = "LW2018Spider"
    start_urls = []

    custom_settings = {
        'HTTPERROR_ALLOWED_CODES': [404],
    }

    def __init__(self, regierungsbezirkId, **kwargs):
        self.start_urls = [
            build_url(regierungsbezirkId, PARTEIEN[0].id, 0)
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

            yield scrapy.Request(build_url(self.regierungsbezirkId, PARTEIEN[self.pt_ind].id, 0), meta={
                'column_names': response.meta.get('column_names', None),
                'result': [],
                'page_index': 0
            }) 
            return

        # Find table to extract info from
        tablearr = response.css('#tableeinzelbewerber')
        if len(tablearr) != 1:
            print("ERROR: expected single table on page but received " + str(len(tablearr)))
            exit(-1)
        table = tablearr[0]

        # Extract column names from header, building on previous requests
        column_names = response.meta.get('column_names', None)
        new_columns = ['Nr.'] + list(filter(lambda x: x != "Stimmkreis", [x.xpath("string(.)").extract()[0] for x in table.xpath(".//thead/tr/th")]))[1:]
        if column_names is None:
            # No columns exist yet => include overlapping columns
            column_names = new_columns
        else:
            # First six columns are repeating, truncate those            
            column_names = list(set(column_names).union(set(filter(lambda col: col not in column_names and col != '', new_columns))))

        # Get index for next page
        next_page_index = response.meta.get('page_index', None)
        if next_page_index is None:
            next_page_index = 0
        next_page_index = next_page_index + 1
        next_url = build_url(self.regierungsbezirkId, PARTEIEN[self.pt_ind].id, next_page_index)

        # Extract rows from table
        new_result = []
        for row in table.xpath(".//tbody/tr"):
            columns = row.xpath(".//td")
            # Single row in dictionary format
            new_row_content = {**{
                "regierungsbezirk-id": self.regierungsbezirkId,
                "partei-id": PARTEIEN[self.pt_ind].id,
                "partei-name": PARTEIEN[self.pt_ind].name
                }, 
                **{ new_columns[i]:columns[i].xpath("string(.)").extract()[0] for i in range(0,len(new_columns)) }}
            old_result = response.meta.get('result', None)
            if old_result is None:
                new_result += [new_row_content]
                continue

            # Find old_row_content with matching id and party and merge with new_row_content
            old_content = []
            if new_row_content['Nr.'] == '':
                # Special case for bottom most rows
                old_content = [content for content in old_result if content['Name'] == new_row_content['Name'] and content['partei-id'] == new_row_content['partei-id']]
            else:
                old_content = [content for content in old_result if content['Nr.'] == new_row_content['Nr.'] and content['partei-id'] == new_row_content['partei-id']]
                
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