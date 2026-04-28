<?php

use App\Models\Client;
use App\Models\User;

test('user can register and receives token', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Ben Ahmed',
        'prename' => 'Mohamed',
        'email' => 'test@example.com',
        'password' => 'Password@123',
        'password_confirmation' => 'Password@123',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['user' => ['id', 'name', 'prename', 'email', 'role'], 'token']);

    expect($response->json('user.role'))->toBe('client');
    expect(Client::where('user_id', $response->json('user.id'))->exists())->toBeTrue();
});

test('register fails with invalid data', function () {
    $response = $this->postJson('/api/auth/register', [
        'email' => 'not-an-email',
        'password' => '123',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Validation failed.');
});

test('register fails with duplicate email', function () {
    User::factory()->create(['email' => 'dup@example.com']);

    $this->postJson('/api/auth/register', [
        'name' => 'A',
        'prename' => 'B',
        'email' => 'dup@example.com',
        'password' => 'Password@123',
        'password_confirmation' => 'Password@123',
    ])->assertUnprocessable();
});

test('user can login and receives token', function () {
    User::factory()->create(['email' => 'login@example.com']);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'login@example.com',
        'password' => 'password',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['user', 'token']);
});

test('login fails with wrong password', function () {
    User::factory()->create(['email' => 'bad@example.com']);

    $this->postJson('/api/auth/login', [
        'email' => 'bad@example.com',
        'password' => 'wrongpassword',
    ])->assertUnprocessable();
});

test('authenticated user can fetch their profile', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/auth/me')
        ->assertOk()
        ->assertJsonPath('email', $user->email);
});

test('unauthenticated me returns 401', function () {
    $this->getJson('/api/auth/me')
        ->assertUnauthorized();
});

test('user can logout', function () {
    $user = User::factory()->create();
    $token = $user->createToken('auth_token')->plainTextToken;

    $this->withToken($token)
        ->postJson('/api/auth/logout')
        ->assertOk();

    // Token record should be deleted from the database
    expect($user->tokens()->count())->toBe(0);
});
