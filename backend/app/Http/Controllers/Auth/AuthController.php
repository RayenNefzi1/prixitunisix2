<?php

namespace App\Http\Controllers\Auth;
use App\Http\Controllers\Controller;

use App\Models\Client;
use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'prename' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $emailDomain = strtolower(explode('@', $data['email'])[1] ?? '');

        $forbiddenClientDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'aol.com', 'icloud.com'];
        if (in_array($emailDomain, $forbiddenClientDomains)) {
            throw ValidationException::withMessages([
                'email' => ['Pour les clients, veuillez utiliser la connexion par numéro de téléphone.'],
            ]);
        }

        $user = User::create([
            'name' => $data['name'],
            'prename' => $data['prename'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'client',
        ]);

        // Auto-create client profile
        Client::create(['user_id' => $user->id]);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Send WhatsApp welcome message (test mode)
        try {
            $wa = new WhatsAppService();
            $wa->send('+216', "Bienvenue sur PrixTunisix! {$data['name']} {$data['prename']} inscription réussie.");
        } catch (\Exception $e) {
            // Log but don't fail the request
            \Illuminate\Support\Facades\Log::warning('WhatsApp notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'user' => $this->userResource($user),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        // Clients must use phone OTP
        if ($user && $user->role === 'client') {
            throw ValidationException::withMessages([
                'email' => ['Pour les clients, veuillez utiliser la connexion par numéro de téléphone.'],
            ]);
        }

        // Admin, Employee, Merchant, Fournisseur can use email/password
        if (! $user || ! in_array($user->role, ['admin', 'employee', 'merchant', 'fournisseur'])) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        if (! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Revoke old tokens for this device
        $user->tokens()->where('name', 'auth_token')->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $this->userResource($user),
            'token' => $token,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'    => ['sometimes', 'nullable', 'string', 'max:255'],
            'prename' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email'   => ['sometimes', 'nullable', 'email', 'unique:users,email,' . $request->user()->id],
        ]);

        $request->user()->update($data);

        return response()->json($this->userResource($request->user()->fresh()));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userResource($request->user()));
    }

    private function userResource(User $user): array
    {
        return [
            'id'      => $user->id,
            'name'    => $user->name,
            'prename' => $user->prename,
            'email'   => $user->email,
            'phone'   => $user->phone,
            'role'    => $user->role,
        ];
    }
}
