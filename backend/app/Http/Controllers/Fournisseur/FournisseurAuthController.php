<?php

namespace App\Http\Controllers\Fournisseur;

use App\Http\Controllers\Controller;
use App\Models\Fournisseur;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class FournisseurAuthController extends Controller
{
    private array $forbiddenDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
        'live.com', 'msn.com', 'aol.com', 'icloud.com', 'mail.com',
        'yandex.com', 'protonmail.com', 'gmx.com', 'zoho.com'
    ];

    /**
     * Validate password in real-time
     * GET /api/fournisseur/validate-password?password=...
     */
    public function validatePassword(Request $request): JsonResponse
    {
        $password = $request->query('password');
        
        if (!$password) {
            return response()->json(['valid' => false, 'message' => 'Mot de passe requis.']);
        }

        $errors = [];
        
        if (strlen($password) < 8) {
            $errors[] = 'Le mot de passe doit contenir au moins 8 caractères.';
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Le mot de passe doit contenir au moins une majuscule.';
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Le mot de passe doit contenir au moins une minuscule.';
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Le mot de passe doit contenir au moins un chiffre.';
        }
        
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            $errors[] = 'Le mot de passe doit contenir au moins un caractère spécial.';
        }

        if (count($errors) > 0) {
            return response()->json([
                'valid' => false, 
                'message' => $errors[0],
                'errors' => $errors,
            ]);
        }

        return response()->json(['valid' => true, 'message' => 'Mot de passe valide.']);
    }

    /**
     * Validate email domain in real-time
     * GET /api/fournisseur/validate-email?email=...
     */
    public function validateEmail(Request $request): JsonResponse
    {
        $email = $request->query('email');
        
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['valid' => false, 'message' => 'Email invalide.']);
        }

        $emailDomain = strtolower(explode('@', $email)[1] ?? '');

        if (in_array($emailDomain, $this->forbiddenDomains)) {
            return response()->json([
                'valid' => false, 
                'message' => 'Veuillez utiliser un email professionnel (pas Gmail, Hotmail, Yahoo, etc.)',
                'forbidden_domain' => $emailDomain,
            ]);
        }

        return response()->json(['valid' => true, 'message' => 'Email professionnel valide.']);
    }

    /**
     * Register new fournisseur: creates user + fournisseur profile in one call
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'             => ['required', 'email', 'unique:users,email'],
            'password'          => ['required', 'confirmed', Password::min(8)],
            'company_name'      => ['required', 'string', 'max:255'],
            'company_phone'   => ['nullable', 'string', 'max:50'],
            'company_address' => ['nullable', 'string', 'max:500'],
            'merchant_url'    => ['nullable', 'url'],
            'merchant_website_id' => ['nullable', 'exists:merchant_websites,id'],
        ]);

        $emailDomain = strtolower(explode('@', $data['email'])[1] ?? '');

        if (in_array($emailDomain, $this->forbiddenDomains)) {
            throw ValidationException::withMessages([
                'email' => ['Veuillez utiliser un email professionnel (pas Gmail, Hotmail, Yahoo, etc.)'],
            ]);
        }

        $user = User::create([
            'name'     => $data['company_name'],
            'prename'  => '',
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => 'fournisseur',
        ]);

        $fournisseur = Fournisseur::create([
            'user_id'             => $user->id,
            'merchant_website_id' => $data['merchant_website_id'] ?? null,
            'company_name'        => $data['company_name'],
            'contact_email'       => $data['email'],
            'merchant_url'        => $data['merchant_url'] ?? null,
            'company_phone'       => $data['company_phone'] ?? null,
            'company_address'     => $data['company_address'] ?? null,
            'api_key'             => Fournisseur::generateApiKey(),
            'active'              => true,
        ]);

        $token = $user->createToken('fournisseur_token')->plainTextToken;

        return response()->json([
            'user'        => $this->userResource($user),
            'fournisseur' => $fournisseur->load('merchantWebsite'),
            'token'       => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || $user->role !== 'fournisseur') {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects ou compte fournisseur introuvable.'],
            ]);
        }

        if (!Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        $fournisseur = $user->fournisseur;
        
        if (!$fournisseur || !$fournisseur->active) {
            return response()->json([
                'message' => 'Votre compte fournisseur est en attente de validation.',
            ], 403);
        }

        $user->tokens()->where('name', 'fournisseur_token')->delete();
        $token = $user->createToken('fournisseur_token')->plainTextToken;

        return response()->json([
            'user'        => $this->userResource($user),
            'fournisseur' => $fournisseur,
            'token'       => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    private function userResource(User $user): array
    {
        return [
            'id'       => $user->id,
            'name'     => $user->name,
            'prename'  => $user->prename,
            'email'    => $user->email,
            'role'     => $user->role,
        ];
    }
}