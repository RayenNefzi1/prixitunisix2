<?php

namespace App\Http\Controllers\Auth;
use App\Http\Controllers\Controller;

use App\Models\Client;
use App\Models\PhoneOtp;
use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OtpController extends Controller
{
    // Tunisian mobile numbers: 8 digits starting with 2, 4, 5, or 9
    private const TN_PHONE_REGEX = '/^\+216[2459]\d{7}$/';

    public function __construct(private WhatsAppService $whatsapp) {}

    /**
     * POST /api/auth/otp/send
     * Body: { phone: "+21698000001" }
     */
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:' . self::TN_PHONE_REGEX],
        ]);

        $phone = $data['phone'];

        // Throttle: max 3 unused codes per 10 minutes
        $recent = PhoneOtp::where('phone', $phone)
            ->where('expires_at', '>', now())
            ->whereNull('used_at')
            ->count();

        if ($recent >= 3) {
            return response()->json([
                'message' => 'Trop de tentatives. Attendez quelques minutes.',
            ], 429);
        }

        // Invalidate previous unused codes for this number
        PhoneOtp::where('phone', $phone)->whereNull('used_at')->delete();

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PhoneOtp::create([
            'phone'      => $phone,
            'code'       => $code,
            'expires_at' => now()->addMinutes(10),
        ]);

        $message = "🔐 PrixTunisix\n"
            . "Votre code de vérification est : *{$code}*\n"
            . "Valable 10 minutes. Ne le partagez pas.";

        $this->whatsapp->send($phone, $message);

        return response()->json(['message' => 'Code envoyé sur WhatsApp.']);
    }

    /**
     * POST /api/auth/otp/verify-login
     * Body: { phone: "+21698000001", code: "123456" }
     * Login only — fails if the user doesn't exist.
     */
    public function verifyLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string'],
            'code'  => ['required', 'string', 'size:6'],
        ]);

        $otp = $this->findValidOtp($data['phone'], $data['code']);

        $user = User::where('phone', $data['phone'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'phone' => ['Aucun compte trouvé pour ce numéro. Veuillez vous inscrire.'],
            ]);
        }

        $otp->update(['used_at' => now()]);

        $user->tokens()->where('name', 'auth_token')->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $this->userResource($user),
            'token' => $token,
        ]);
    }

    /**
     * POST /api/auth/otp/verify-register
     * Body: { phone, code }
     * Register only — fails if the number is already taken.
     * Name/prename are collected on the profile-setup page after registration.
     */
    public function verifyRegister(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string'],
            'code'  => ['required', 'string', 'size:6'],
        ]);

        if (User::where('phone', $data['phone'])->exists()) {
            throw ValidationException::withMessages([
                'phone' => ['Ce numéro est déjà associé à un compte. Connectez-vous.'],
            ]);
        }

        $otp = $this->findValidOtp($data['phone'], $data['code']);
        $otp->update(['used_at' => now()]);

        $user = User::create([
            'name'    => null,
            'prename' => null,
            'phone'   => $data['phone'],
            'email'   => null,
            'password'=> Str::random(40),
            'role'    => 'client',
        ]);

        Client::create(['user_id' => $user->id, 'phone' => $data['phone']]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $this->userResource($user),
            'token' => $token,
        ], 201);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private function findValidOtp(string $phone, string $code): PhoneOtp
    {
        $otp = PhoneOtp::where('phone', $phone)
            ->where('code', $code)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (! $otp || $otp->isExpired()) {
            throw ValidationException::withMessages([
                'code' => ['Code incorrect ou expiré.'],
            ]);
        }

        return $otp;
    }

    private function userResource(User $user): array
    {
        return [
            'id'      => $user->id,
            'name'    => $user->name,
            'prename' => $user->prename,
            'phone'   => $user->phone,
            'role'    => $user->role,
        ];
    }
}
