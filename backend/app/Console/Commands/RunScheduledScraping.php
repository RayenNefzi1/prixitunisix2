<?php

namespace App\Console\Commands;

use App\Models\ScrapingScript;
use App\Models\ScrapingLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RunScheduledScraping extends Command
{
    protected $signature = 'scraping:run-scheduled';
    protected $description = 'Run all scheduled scraping scripts based on their frequency';

    public function handle(): int
    {
        $this->info('Starting scheduled scraping...');
        
        $scripts = ScrapingScript::where('status', 'active')->get();
        $results = [];
        $totalRecords = 0;
        $totalErrors = 0;

        foreach ($scripts as $script) {
            if (!$this->shouldRun($script)) {
                $this->line("Skipping {$script->name} - not due yet");
                continue;
            }

            $this->info("Running: {$script->name}");
            
            $log = ScrapingLog::create([
                'scraping_script_id' => $script->id,
                'started_at' => now(),
                'records_collected' => 0,
                'errors_count' => 0,
                'result' => 'running',
            ]);

            try {
                $result = $this->runSpider($script);
                
                $log->update([
                    'ended_at' => now(),
                    'records_collected' => $result['records'],
                    'errors_count' => $result['errors'],
                    'error_details' => $result['error_details'],
                    'result' => $result['success'] ? 'success' : 'failed',
                ]);

                $script->update(['last_run' => now()]);
                
                $totalRecords += $result['records'];
                $totalErrors += $result['errors'];
                
                $this->info("  -> {$result['records']} records, {$result['errors']} errors");
                
            } catch (\Exception $e) {
                $log->update([
                    'ended_at' => now(),
                    'errors_count' => 1,
                    'error_details' => json_encode([$e->getMessage()]),
                    'result' => 'failed',
                ]);
                
                $totalErrors += 1;
                $this->error("  -> Failed: {$e->getMessage()}");
            }
        }

        $this->newLine();
        $this->info("Scheduled scraping complete:");
        $this->info("  Total records: {$totalRecords}");
        $this->info("  Total errors: {$totalErrors}");

        return self::SUCCESS;
    }

    private function shouldRun(ScrapingScript $script): bool
    {
        if (!$script->last_run) {
            return true;
        }

        $lastRun = \Carbon\Carbon::parse($script->last_run);
        $now = now();

        return match ($script->frequency) {
            'hourly' => $lastRun->diffInMinutes($now) >= ($script->frequency_minutes ?? 60),
            'daily' => $lastRun->diffInHours($now) >= 24,
            'weekly' => $lastRun->diffInDays($now) >= 7,
            'manual' => false,
            default => false,
        };
    }

    private function runSpider(ScrapingScript $script): array
    {
        $spiderName = $this->getSpiderName($script->merchantWebsite->name ?? '');
        $scraperPath = base_path('../scraper');
        
        $command = "cd \"$scraperPath\" && scrapy crawl $spiderName 2>&1";
        
        $output = shell_exec($command);
        
        $records = 0;
        $errors = 0;
        $errorDetails = [];

        if ($output) {
            preg_match_all('/Scraped from/', $output, $matches);
            $records = count($matches[0]);
            
            if ($records === 0) {
                preg_match_all('/DEBUG: OK product#(\d+)/', $output, $productMatches);
                $records = count($productMatches[0]);
            }
            
            if ($records === 0) {
                preg_match_all('/(\d+) products? on/', $output, $productLines);
                if (!empty($productLines[0])) {
                    $records = array_sum($productLines[1] ?? []);
                }
            }
            
            preg_match_all('/\[([\w:\]]+)\] ERROR/', $output, $errorMatches);
            $errors = count($errorMatches[0]);
            
            preg_match_all('/ERROR: (.+)/', $output, $errorLines);
            foreach (array_slice($errorLines[1] ?? [], 0, 5) as $error) {
                $errorDetails[] = trim($error);
            }
        }

        return [
            'success' => $records > 0 || $errors === 0,
            'records' => $records,
            'errors' => $errors,
            'error_details' => !empty($errorDetails) ? json_encode($errorDetails) : null,
        ];
    }

    private function getSpiderName(string $merchantName): string
    {
        $name = strtolower(str_replace([' ', '-', '_'], '', $merchantName));
        
        $spiders = [
            'mytek' => 'mytek',
            'tunisianet' => 'tunisianet',
            'sfaxcomputer' => 'sfax',
            'tunsiatech' => 'tunisiatech',
            'tunisiteck' => 'tunisiatech',
            'zoominformatique' => 'zoom',
            'zoom' => 'zoom',
            'khadraouitek' => 'khadraoui',
            'khadraoui' => 'khadraoui',
        ];

        return $spiders[$name] ?? 'tunisianet';
    }
}