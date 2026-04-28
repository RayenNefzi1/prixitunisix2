<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TransferSqliteToMysql extends Command
{
    protected $signature = 'db:transfer-to-mysql';
    protected $description = 'Transfer all data from SQLite database to MySQL database';

    public function handle(): int
    {
        $this->info('Starting database transfer from SQLite to MySQL...');

        // Exclude system tables
        $tables = DB::connection('sqlite')->select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations'");

        // Disable foreign key checks on MySQL during the transfer
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=0;');

        foreach ($tables as $tableInfo) {
            $table = $tableInfo->name;
            $this->info("Transferring table: {$table}");

            // Clear the existing data in MySQL
            DB::connection('mysql')->table($table)->truncate();

            // Fetch data from SQLite
            $rows = DB::connection('sqlite')->table($table)->get()->map(function($row) {
                $array = (array) $row;
                // Convert ISO8601 dates to MySQL datetime format
                foreach ($array as $key => $value) {
                    if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/', $value)) {
                        $array[$key] = date('Y-m-d H:i:s', strtotime($value));
                    }
                }
                return $array;
            })->toArray();

            if (empty($rows)) {
                $this->line("  - No data to transfer.");
                continue;
            }

            // Insert data into MySQL in chunks to avoid memory / query size issues
            $chunks = array_chunk($rows, 500);
            foreach ($chunks as $chunk) {
                DB::connection('mysql')->table($table)->insert($chunk);
            }

            $this->line("  - Transferred " . count($rows) . " rows.");
        }

        // Re-enable foreign key checks
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info('Database transfer completed successfully!');
        
        return Command::SUCCESS;
    }
}
