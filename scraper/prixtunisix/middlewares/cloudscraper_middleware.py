"""
Custom downloader middleware that uses cloudscraper to bypass Cloudflare protection.
"""
import scrapy
from scrapy.http import HtmlResponse
import cloudscraper


class CloudscraperMiddleware:
    """Middleware to handle Cloudflare-protected sites using cloudscraper."""

    def __init__(self):
        self.scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'desktop': True
            }
        )

    @classmethod
    def from_crawler(cls, crawler):
        return cls()

    def process_request(self, request, spider):
        if not any(domain in request.url for domain in ['wiki.tn']):
            return None

        spider.logger.info(f"Using cloudscraper for: {request.url}")

        try:
            response = self.scraper.get(request.url, timeout=30)
            
            headers = dict(response.headers)
            headers.pop('Content-Encoding', None)
            
            return HtmlResponse(
                url=request.url,
                body=response.text,
                encoding='utf-8',
                status=response.status_code,
                headers=headers
            )
        except Exception as e:
            spider.logger.error(f"Cloudscraper error for {request.url}: {e}")
            return None