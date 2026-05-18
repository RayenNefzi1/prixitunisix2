<?php

namespace App\Console\Commands;

use App\Services\ScraperService;
use Illuminate\Console\Command;

class ScrapeSites extends Command
{
    protected $signature = 'scrape:all {--tunisianet : Scrape Tunisianet only} {--tunisiteck : Scrape TunisiaTech only} {--zoom : Scrape Zoom only} {--khadraoui : Scrape Khadraoui only}';
    protected $description = 'Scrape products from all merchant websites';

    public function handle(): int
    {
        $scraper = new ScraperService();

        $tunisianet = $this->option('tunisianet');
        $tunisiteck = $this->option('tunisiteck');
        $zoom = $this->option('zoom');
        $khadraoui = $this->option('khadraoui');

        // If no specific option, scrape all
        $scrapeAll = !$tunisianet && !$tunisiteck && !$zoom && !$khadraoui;

        if ($scrapeAll || $tunisianet) {
            $this->info('Scraping Tunisianet...');
            $result = $scraper->scrapeTunisianet();
            $this->info("Tunisianet: {$result['success']} products scraped");
            if (!empty($result['errors'])) {
                foreach ($result['errors'] as $error) {
                    $this->warn($error);
                }
            }
        }

        if ($scrapeAll || $tunisiteck) {
            $this->info('Scraping TunisiaTech...');
            $result = $scraper->scrapeTunisiaTech();
            $this->info("TunisiaTech: {$result['success']} products scraped");
            if (!empty($result['errors'])) {
                foreach ($result['errors'] as $error) {
                    $this->warn($error);
                }
            }
        }

        if ($scrapeAll || $zoom) {
            $this->info('Scraping Zoom...');
            $result = $scraper->scrapeZoomInformatique();
            $this->info("Zoom: {$result['success']} products scraped");
            if (!empty($result['errors'])) {
                foreach ($result['errors'] as $error) {
                    $this->warn($error);
                }
            }
        }

        if ($scrapeAll || $khadraoui) {
            $this->info('Scraping Khadraoui...');
            $result = $scraper->scrapeKhadraoui();
            $this->info("Khadraoui: {$result['success']} products scraped");
            if (!empty($result['errors'])) {
                foreach ($result['errors'] as $error) {
                    $this->warn($error);
                }
            }
        }

        $this->info('Scraping complete!');

        return Command::SUCCESS;
    }
}