<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;

// ── Categories ────────────────────────────────────────────────────────────

test('anyone can list categories', function () {
    Category::factory()->count(3)->create();

    $this->getJson('/api/categories')
        ->assertOk()
        ->assertJsonCount(3);
});

test('admin can create a category', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/categories', [
            'name' => 'Electronique',
            'slug' => 'electronique',
        ])
        ->assertCreated()
        ->assertJsonPath('slug', 'electronique');
});

test('client cannot create a category', function () {
    $client = User::factory()->create(); // role=client by default

    $this->actingAs($client)
        ->postJson('/api/admin/categories', [
            'name' => 'Test',
            'slug' => 'test',
        ])
        ->assertForbidden();
});

// ── Brands ────────────────────────────────────────────────────────────────

test('anyone can list brands', function () {
    Brand::factory()->count(2)->create();

    $this->getJson('/api/brands')
        ->assertOk()
        ->assertJsonCount(2);
});

// ── Products ──────────────────────────────────────────────────────────────

test('anyone can list validated products', function () {
    $cat = Category::factory()->create();

    Product::factory()->create(['is_validated' => true,  'category_id' => $cat->id]);
    Product::factory()->create(['is_validated' => false, 'category_id' => $cat->id]);

    $this->getJson('/api/products')
        ->assertOk()
        ->assertJsonCount(1, 'data'); // paginated
});

test('product search filters by name', function () {
    $cat = Category::factory()->create();

    Product::factory()->create(['name' => 'HP Laptop',   'slug' => 'hp-laptop',   'is_validated' => true, 'category_id' => $cat->id]);
    Product::factory()->create(['name' => 'Dell Desktop', 'slug' => 'dell-desktop', 'is_validated' => true, 'category_id' => $cat->id]);

    $this->getJson('/api/products?q=HP')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('admin can create a product', function () {
    $admin = User::factory()->admin()->create();
    $cat = Category::factory()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/products', [
            'name' => 'Test Product',
            'slug' => 'test-product',
            'category_id' => $cat->id,
        ])
        ->assertCreated()
        ->assertJsonPath('is_validated', false);
});
