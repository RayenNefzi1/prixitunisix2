<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Check price alerts every hour
Schedule::command('alerts:check-price')->hourly();

// Run scheduled scraping daily at midnight
Schedule::command('scraping:run-scheduled')->daily();
