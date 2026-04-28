import scrapy


class OfferItem(scrapy.Item):
    """Represents a raw scraped product offer before matching."""
    raw_title            = scrapy.Field()
    price                = scrapy.Field()   # float, TND
    merchant_url         = scrapy.Field()
    image_url            = scrapy.Field()
    is_available         = scrapy.Field()   # bool
    merchant_website_id  = scrapy.Field()   # int FK to merchant_websites
    scraped_at           = scrapy.Field()   # ISO datetime string
    scraped_reference    = scrapy.Field()   # manufacturer reference e.g. "82LX00EAFG"
    specifications       = scrapy.Field()   # dict of normalized spec keys → values
