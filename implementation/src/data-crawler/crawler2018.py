import scrapy

class Landtagswahlen2018Spider(scrapy.Spider):
    name = "LW2018Spider"
    start_urls = []

    def __init__(self, regierungsbezirkId=901, partyId=1, **kwargs):
        self.start_urls = [
            "https://www.landtagswahl2018.bayern.de/ergebnis_einzelbewerber_{}_{}_{}.html".format(regierungsbezirkId, partyId, x)
            for x in range(0,1)
        ]
        super().__init__(**kwargs)

    def parse(self, response):
        # Find table to extract info from
        tablearr = response.css('#tableeinzelbewerber')
        if len(tablearr) != 1:
            print("ERROR: expected single table on page but received " + len(tablearr))
            pass
        table = tablearr[0]

        # Extract column names from table header
        column_names = list(filter(lambda x: x != "Stimmkreis", [x.xpath("string(.)").extract()[0] for x in table.xpath(".//thead/tr/th")]))

        # Extract rows from table
        for row in table.xpath(".//tbody/tr"):
            columns = row.xpath(".//td")
            yield { column_names[i]:columns[i].xpath("string(.)").extract() for i in range(0,len(column_names)) }