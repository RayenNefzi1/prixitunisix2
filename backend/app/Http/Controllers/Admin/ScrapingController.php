<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ScrapingScript;
use App\Models\ScrapingLog;
use App\Models\MerchantWebsite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessTimedOutException;

class ScrapingController extends Controller
{
    private $logPath;

    public function __construct()
    {
        $this->logPath = base_path('../scraper/scrapy_log.txt');
    }

    public function index(): JsonResponse
    {
        try {
            $scripts = ScrapingScript::with('merchantWebsite')
                ->orderByDesc('id')
                ->get();

            $websites = MerchantWebsite::where('is_active', true)->get();

            return response()->json([
                'scripts' => $scripts,
                'websites' => $websites,
            ]);
        } catch (\Exception $e) {
            Log::error('ScrapingController@index error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'merchant_website_id' => 'required|exists:merchant_websites,id',
            'name' => 'required|string|max:255',
            'target_url' => 'required|url',
            'frequency' => 'required|in:hourly,daily,weekly,manual',
            'frequency_minutes' => 'nullable|integer|min:15',
        ]);

        $script = ScrapingScript::create($validated);

        return response()->json($script, 201);
    }

    public function update(Request $request, ScrapingScript $scrapingScript): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'target_url' => 'sometimes|url',
            'frequency' => 'sometimes|in:hourly,daily,weekly,manual',
            'frequency_minutes' => 'nullable|integer|min:15',
        ]);

        $scrapingScript->update($validated);

        return response()->json($scrapingScript);
    }

    public function destroy(ScrapingScript $scrapingScript): JsonResponse
    {
        $scrapingScript->delete();

        return response()->json(null, 204);
    }

    public function toggleStatus(ScrapingScript $scrapingScript): JsonResponse
    {
        $newStatus = $scrapingScript->status === 'active' ? 'inactive' : 'active';
        $scrapingScript->update(['status' => $newStatus]);

        return response()->json($scrapingScript);
    }

    public function runScript(ScrapingScript $scrapingScript): JsonResponse
    {
        $merchantWebsite = $scrapingScript->merchantWebsite;
        
        if (!$merchantWebsite) {
            return response()->json(['error' => 'Merchant website not found'], 404);
        }

        $log = ScrapingLog::create([
            'scraping_script_id' => $scrapingScript->id,
            'started_at' => now(),
            'records_collected' => 0,
            'errors_count' => 0,
            'result' => 'running',
        ]);

        try {
            $spider = $this->getSpiderName($merchantWebsite->name);
            
            if (!$spider) {
                throw new \Exception("No spider found for merchant: {$merchantWebsite->name}");
            }

            // Clear previous log
            $logFile = base_path('../scraper/scrapy_log.txt');
            if (file_exists($logFile)) {
                unlink($logFile);
            }

            // Run spider in background - return immediately
            $scraperPath = base_path('../scraper');
            $command = "cd \"$scraperPath\" && scrapy crawl $spider --loglevel=INFO > \"$logFile\" 2>&1 &";
            
            Log::info("Starting scraper: $command");
            exec($command);

            $scrapingScript->update(['last_run' => now()]);

            return response()->json([
                'message' => 'Scraping started in background',
                'log_id' => $log->id,
                'spider' => $spider,
            ]);

        } catch (\Exception $e) {
            $log->update([
                'ended_at' => now(),
                'errors_count' => 1,
                'error_details' => json_encode([$e->getMessage()]),
                'result' => 'failed',
            ]);

            Log::error('Scraping failed: ' . $e->getMessage());

            return response()->json([
                'error' => 'Scraping failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function runAll(Request $request): JsonResponse
    {
        $merchantIds = $request->input('merchant_ids', []);
        
        $results = [];
        $scripts = ScrapingScript::where('status', 'active');
        
        if (!empty($merchantIds)) {
            $scripts = $scripts->whereIn('merchant_website_id', $merchantIds);
        }
        
        $scripts = $scripts->get();

        foreach ($scripts as $script) {
            $merchant = $script->merchantWebsite;
            
            $log = ScrapingLog::create([
                'scraping_script_id' => $script->id,
                'started_at' => now(),
                'records_collected' => 0,
                'errors_count' => 0,
                'result' => 'running',
            ]);

            try {
                $spider = $this->getSpiderName($merchant->name);
                
                if (!$spider) {
                    throw new \Exception("No spider found for merchant: {$merchant->name}");
                }

                $result = $this->runSpiderSync($spider);

                $log->update([
                    'ended_at' => now(),
                    'records_collected' => $result['records'],
                    'errors_count' => $result['errors'],
                    'error_details' => $result['error_details'],
                    'result' => $result['success'] ? 'success' : 'failed',
                ]);

                $script->update(['last_run' => now()]);

                $results[] = [
                    'script_id' => $script->id,
                    'merchant' => $merchant->name,
                    'records' => $result['records'],
                    'errors' => $result['errors'],
                    'status' => $result['success'] ? 'success' : 'failed',
                ];

            } catch (\Exception $e) {
                $log->update([
                    'ended_at' => now(),
                    'errors_count' => 1,
                    'error_details' => json_encode([$e->getMessage()]),
                    'result' => 'failed',
                ]);

                $results[] = [
                    'script_id' => $script->id,
                    'merchant' => $merchant->name ?? 'Unknown',
                    'records' => 0,
                    'errors' => 1,
                    'status' => 'failed',
                    'error' => $e->getMessage(),
                ];
            }
        }

        $totalRecords = collect($results)->sum('records');
        $totalErrors = collect($results)->sum('errors');
        $successful = collect($results)->where('status', 'success')->count();

        return response()->json([
            'message' => "Scraping complete: $successful/{$scripts->count()} successful",
            'total_records' => $totalRecords,
            'total_errors' => $totalErrors,
            'results' => $results,
        ]);
    }

    public function logs(ScrapingScript $scrapingScript): JsonResponse
    {
        $logs = ScrapingLog::where('scraping_script_id', $scrapingScript->id)
            ->orderByDesc('started_at')
            ->limit(50)
            ->get();

        return response()->json($logs);
    }

    public function allLogs(Request $request): JsonResponse
    {
        $query = ScrapingLog::with('script.merchantWebsite')
            ->orderByDesc('started_at');

        if ($request->script_id) {
            $query->where('scraping_script_id', $request->script_id);
        }

        $logs = $query->limit(100)->get();

        return response()->json($logs);
    }

    public function stats(): JsonResponse
    {
        $totalScripts = ScrapingScript::count();
        $activeScripts = ScrapingScript::where('status', 'active')->count();
        
        $last24h = ScrapingLog::where('started_at', '>=', now()->subDay())->get();
        $totalRecords = $last24h->sum('records_collected');
        $totalErrors = $last24h->sum('errors_count');
        $successfulRuns = $last24h->where('result', 'success')->count();
        $failedRuns = $last24h->where('result', 'failed')->count();

        return response()->json([
            'total_scripts' => $totalScripts,
            'active_scripts' => $activeScripts,
            'last_24h' => [
                'total_records' => $totalRecords,
                'total_errors' => $totalErrors,
                'successful_runs' => $successfulRuns,
                'failed_runs' => $failedRuns,
            ],
        ]);
    }

    private function getSpiderName(string $merchantName): ?string
    {
        $name = strtolower(str_replace([' ', '-', '_'], '', $merchantName));
        
        $spiders = [
            'mytek' => 'mytek',
            'tunisianet' => 'tunisianet',
            'sfaxcomputer' => 'sfax',
            'tunisiatech' => 'tunisiatech',
            'tunsiatech' => 'tunisiatech',
            'tunisiteck' => 'tunisiatech',
            'zoominformatique' => 'zoom',
            'zoom' => 'zoom',
            'khadraouitek' => 'khadraoui',
            'khadraoui' => 'khadraoui',
        ];

        return $spiders[$name] ?? null;
    }

    private function runSpiderSync(string $spider): array
    {
        $scraperPath = base_path('../scraper');
        $logFile = base_path('../scraper/scrapy_log.txt');
        
        // Clear previous log
        if (file_exists($logFile)) {
            unlink($logFile);
        }
        
        // Run spider in background
        $command = "cd \"$scraperPath\" && scrapy crawl $spider --loglevel=INFO > \"$logFile\" 2>&1 &";
        exec($command);
        
        // Wait for spider to start
        sleep(5);
        
        // Wait for results (up to 2 minutes)
        $maxWait = 120;
        $waited = 0;
        $records = 0;
        $errors = 0;
        $newProducts = 0;

        while ($waited < $maxWait) {
            sleep(5);
            $waited += 5;

            if (!file_exists($logFile)) {
                continue;
            }

            $logContent = file_get_contents($logFile);
            
            // Count scraped items
            $scrapedMatches = [];
            if (preg_match_all('/DEBUG: OK product#(\d+)/', $logContent, $scrapedMatches)) {
                $records = count($scrapedMatches[0]);
            }

            // Count new products
            $newMatches = [];
            if (preg_match_all('/NEW \[([^\]]+)\]/', $logContent, $newMatches)) {
                $newProducts = count($newMatches[0]);
            }

            // Count errors
            $errorMatches = [];
            if (preg_match_all('/\[([^\]]+)\] ERROR/', $logContent, $errorMatches)) {
                $errors = count($errorMatches[0]);
            }

            // Check if spider finished
            if (preg_match('/Spider closed \(finished\)/', $logContent) || 
                preg_match('/Shutting down spider/', $logContent)) {
                break;
            }

            // If we've waited 60 seconds and have records, consider it done
            if ($waited >= 60 && $records > 0) {
                break;
            }
        }

        return [
            'success' => $records > 0 || $newProducts > 0,
            'records' => $newProducts > 0 ? $newProducts : $records,
            'errors' => $errors,
            'error_details' => $errors > 0 ? json_encode(["Spider completed with $errors errors"]) : null,
        ];
    }
}