import scrapy
import re
import json

class PriceChecker(scrapy.Spider):
    name = 'price_check'
    start_urls = ['https://www.twenty.tn/en/1249-abmusic776-alesis-harmony-32']

    def parse(self, response):
        text = response.text
        
        # Look for JSON-LD structured data
        scripts = response.css('script::text').getall()
        for i, script in enumerate(scripts):
            if 'price' in script.lower() and 'product' in script.lower():
                print(f'Script {i} has price:', script[:500])
        
        # Look for price in data attributes
        price_attrs = response.css('[data-price]::attr(data-price)').get()
        print('data-price attr:', price_attrs)
        
        # Check product schema
        schema = response.css('[type=application/ld+json]::text').get()
        if schema:
            try:
                data = json.loads(schema)
                print('Schema:', json.dumps(data, indent=2)[:500])
            except:
                pass
        
        # Look for any price text
        price_text = response.css('.price::text').getall()
        print('Price text:', price_text)

from scrapy.crawler import CrawlerProcess
process = CrawlerProcess()
process.crawl(PriceChecker)
process.start()