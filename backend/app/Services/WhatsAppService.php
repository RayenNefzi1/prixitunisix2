<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Send WhatsApp messages via a configurable provider.
 *
 * Supported providers (set WHATSAPP_PROVIDER in .env):
 *   log       — just writes to laravel.log  (default for local dev)
 *   twilio    — Twilio WhatsApp sandbox/production
 *   ultramsg  — UltraMsg API (popular in Tunisia)
 */
class WhatsAppService
{
    private string $provider;

    public function __construct()
    {
        $this->provider = config('services.whatsapp.provider', 'log');
    }

    /**
     * Send a text message to a WhatsApp number.
     *
     * @param  string $to   E.164 format, e.g. +21698000001
     * @param  string $body Message text
     */
    public function send(string $to, string $body): void
    {
        match ($this->provider) {
            'twilio'   => $this->sendViaTwilio($to, $body),
            'ultramsg' => $this->sendViaUltraMsg($to, $body),
            default    => $this->sendViaLog($to, $body),
        };
    }

    // ── Providers ────────────────────────────────────────────────────────

    private function sendViaLog(string $to, string $body): void
    {
        Log::info("[WhatsApp DEV] To: {$to} | {$body}");
    }

    private function sendViaTwilio(string $to, string $body): void
    {
        $sid   = config('services.whatsapp.twilio_sid');
        $token = config('services.whatsapp.twilio_token');
        $from  = config('services.whatsapp.twilio_from', 'whatsapp:+14155238886'); // sandbox default

        Http::withBasicAuth($sid, $token)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'From' => $from,
                'To'   => "whatsapp:{$to}",
                'Body' => $body,
            ])
            ->throw();
    }

    private function sendViaUltraMsg(string $to, string $body): void
    {
        $instance = config('services.whatsapp.ultramsg_instance');
        $token    = config('services.whatsapp.ultramsg_token');

        Http::asForm()
            ->post("https://api.ultramsg.com/{$instance}/messages/chat", [
                'token' => $token,
                'to'    => $to,
                'body'  => $body,
            ])
            ->throw();
    }
}
