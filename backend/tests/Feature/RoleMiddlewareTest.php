<?php

use App\Models\User;

test('unauthenticated request to protected route returns 401', function () {
    $this->getJson('/api/auth/me')
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Unauthenticated.');
});

test('client cannot access admin routes', function () {
    $client = User::factory()->create(['role' => 'client']);

    $this->actingAs($client)
        ->getJson('/api/admin/users')
        ->assertForbidden();
});

test('admin can access admin routes', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->getJson('/api/admin/users')
        ->assertOk();
});

test('employee can access admin routes', function () {
    $employee = User::factory()->employee()->create();

    $this->actingAs($employee)
        ->getJson('/api/admin/users')
        ->assertOk();
});

test('merchant cannot access client routes', function () {
    $merchant = User::factory()->merchant()->create();

    $this->actingAs($merchant)
        ->getJson('/api/client/cart')
        ->assertForbidden();
});
