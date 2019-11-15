import scrapy

def build_url(regierungsbezirkId, partyId, pageIndex):
    return "https://www.landtagswahl2018.bayern.de/ergebnis_einzelbewerber_{}_{}_{}.html".format(regierungsbezirkId, partyId, pageIndex)

class Landtagswahlen2018Spider(scrapy.Spider):
    name = "LW2018Spider"
    start_urls = []
    regierungsbezirkId = 0
    partyId = 0

    custom_settings = {
        'HTTPERROR_ALLOWED_CODES': [404]
    }

    def __init__(self, regierungsbezirkId, partyId, **kwargs):
        self.start_urls = [
            build_url(regierungsbezirkId, partyId, 0)
        ]
        self.regierungsbezirkId = regierungsbezirkId
        self.partyId = partyId
        super().__init__(**kwargs)

    def parse(self, response):
        # Assume we hit 404 because no more pages exist => return content collected so far
        if response.status == 404:
            for resulting_row in response.meta.get('result', []):
                yield resulting_row
            return

        # Find table to extract info from
        tablearr = response.css('#tableeinzelbewerber')
        if len(tablearr) != 1:
            print("ERROR: expected single table on page but received " + str(len(tablearr)))
            pass
        table = tablearr[0]

        # Extract column names from header, building on previous requests
        column_names = response.meta.get('column_names', None)
        new_columns = []
        if column_names is None:
            # Include all columns
            new_columns = list(filter(lambda x: x != "Stimmkreis", [x.xpath("string(.)").extract()[0] for x in table.xpath(".//thead/tr/th")]))
            column_names = new_columns
        else:
            # First six columns are repeating, truncate those
            new_columns = list(filter(lambda x: x != "Stimmkreis", [x.xpath("string(.)").extract()[0] for x in table.xpath(".//thead/tr/th")]))
            column_names = column_names + new_columns[7:]

        # Get index for next page
        next_page_index = response.meta.get('page_index', None)
        if next_page_index is None:
            next_page_index = 0
        next_page_index = next_page_index + 1
        next_url = build_url(self.regierungsbezirkId, self.partyId, next_page_index)

        # Extract rows from table
        new_result = []
        for row in table.xpath(".//tbody/tr"):
            columns = row.xpath(".//td")
            # Single row in dictionary format
            new_row_content = { new_columns[i]:columns[i].xpath("string(.)").extract()[0] for i in range(0,len(new_columns)) }
            old_result = response.meta.get('result', None)
            if old_result is None:
                new_result += [new_row_content]
                continue
            
            # Find old_row_content with matching first field (key '') and merge with new_row_content
            row_content = {**[content for content in old_result if content[''] == new_row_content['']][0], **new_row_content}
            # Update row in result
            new_result += [row_content]

        # Request subsequent page and pass data to next request
        yield scrapy.Request(next_url, meta={
            'column_names': column_names,
            'result': new_result,
            'page_index': next_page_index
        })