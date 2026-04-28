<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // ── WhatsApp OTP ─────────────────────────────────────────────────────
    // Set WHATSAPP_PROVIDER=twilio or ultramsg in .env for production.
    // Default is "log" — prints the code to storage/logs/laravel.log.
    'whatsapp' => [
        'provider'          => env('WHATSAPP_PROVIDER', 'log'),
        // Twilio
        'twilio_sid'        => env('TWILIO_SID'),
        'twilio_token'      => env('TWILIO_AUTH_TOKEN'),
        'twilio_from'       => env('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886'),
        // UltraMsg
        'ultramsg_instance' => env('ULTRAMSG_INSTANCE'),
        'ultramsg_token'    => env('ULTRAMSG_TOKEN'),
    ],

];
