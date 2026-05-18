# PrixTunisix - Multi-Merchant Price Comparator

## Project Overview

**PrixTunisix** is a comprehensive price comparison platform for Tunisia that aggregates product prices from multiple e-commerce merchants into a unified catalog. The platform enables consumers to find the best deals across different online shops while providing merchants with a channel to showcase their products.

### Key Features

- **Multi-Merchant Aggregation**: Products and prices from multiple online stores
- **Smart Product Matching**: Automatic matching of similar products across different merchants
- **Price Alerts**: Users can set target prices and receive notifications
- **Favorites & Wishlists**: Save products for later comparison
- **AI-Powered Chatbot**: Natural language product search and recommendations
- **Supplier Portal**: Dedicated interface for merchants to manage their products
- **Admin Dashboard**: Complete system management and analytics

---

## Technology Stack

- **Framework**: Laravel 13 (PHP 8.3+)
- **Authentication**: Laravel Sanctum (API tokens)
- **Database**: MySQL/PostgreSQL
- **API Architecture**: RESTful JSON API
- **Testing**: Pest PHP
- **Code Quality**: Laravel Pint

---

## System Architecture

### User Roles

| Role | Description |
|------|-------------|
| **Guest** | Unauthenticated users who can browse products and search |
| **Client** | Registered users who can save favorites, create wishlists, set price alerts |
| **Merchant** | Business users who manage their offers and subscriptions |
| **Fournisseur** | Suppliers who provide product data via API |
| **Employee** | Internal staff who review product matches |
| **Admin** | System administrators with full control |

---

## Database Models (ER Diagram)

```mermaid
erDiagram
    User {
        bigint id PK
        string name
        string prename
        string email
        string phone
        boolean phone_verified
        datetime phone_verified_at
        string password
        string role
    }

    Client {
        bigint id PK
        bigint user_id FK
        string phone
    }

    Merchant {
        bigint id PK
        bigint user_id FK
        string company_name
        text address
        string phone
        string website
        boolean is_verified
        datetime verified_at
    }

    MerchantWebsite {
        bigint id PK
        string name
        string slug
        string base_url
        string logo_url
        boolean is_active
    }

    Fournisseur {
        bigint id PK
        bigint user_id FK
        bigint merchant_website_id FK
        string company_name
        text description
        string contact_email
        string api_key
        boolean active
        string merchant_url
        string company_phone
        text company_address
        string logo_url
    }

    Employee {
        bigint id PK
        bigint user_id FK
        string position
    }

    Product {
        bigint id PK
        string name
        string slug
        string reference
        text description
        string image_url
        boolean is_validated
        bigint category_id FK
        bigint brand_id FK
        json specifications
    }

    Category {
        bigint id PK
        string name
        string slug
        string code
        text description
        bigint parent_id FK
    }

    Brand {
        bigint id PK
        string name
        string slug
        string logo_url
    }

    Offer {
        bigint id PK
        bigint product_id FK
        bigint merchant_id FK
        bigint merchant_website_id FK
        string raw_title
        string scraped_reference
        float price
        boolean is_available
        string merchant_url
        string image_url
        datetime scraped_at
    }

    PriceHistory {
        bigint id PK
        bigint offer_id FK
        float price
        datetime recorded_at
    }

    Discount {
        bigint id PK
        bigint offer_id FK
        float value
        string type
        float original_price
        float discounted_price
        datetime start_date
        datetime end_date
        boolean is_active
    }

    PriceAlert {
        bigint id PK
        bigint client_id FK
        bigint product_id FK
        float target_price
        boolean is_active
        datetime triggered_at
    }

    Wishlist {
        bigint id PK
        bigint client_id FK
        string name
    }

    WishlistItem {
        bigint id PK
        bigint wishlist_id FK
        bigint product_id FK
    }

    Favorite {
        bigint client_id PK
        bigint product_id PK
        datetime created_at
    }

    Subscription {
        bigint id PK
        bigint merchant_id FK
        string plan
        date start_date
        date end_date
        string status
    }

    ScrapingScript {
        bigint id PK
        bigint merchant_website_id FK
        string name
        string target_url
        string frequency
        int frequency_minutes
        string status
        datetime last_run
    }

    ProductMatch {
        bigint id PK
        bigint offer_id FK
        bigint product_id FK
        float confidence_score
        string status
        bigint reviewed_by FK
        datetime reviewed_at
    }

    User ||--o| Client : "has one"
    User ||--o| Merchant : "has one"
    User ||--o| Employee : "has one"
    User ||--o| Fournisseur : "has one"
    Client ||--o{ PriceAlert : "creates"
    Client ||--o{ Wishlist : "creates"
    Client ||--o| Favorite : "has"
    Merchant ||--o{ Offer : "creates"
    Merchant ||--o{ Subscription : "has"
    MerchantWebsite ||--o{ Offer : "has"
    MerchantWebsite ||--o{ ScrapingScript : "has"
    Fournisseur ||--o| FournisseurSubscription : "has"
    Product ||--o{ Offer : "has"
    Product ||--o{ PriceAlert : "has"
    Product ||--o{ WishlistItem : "in"
    Product ||--o| Favorite : "in"
    Product ||--o{ ProductMatch : "matched in"
    Category ||--o{ Category : "parent"
    Category ||--o{ Product : "contains"
    Brand ||--o{ Product : "has"
    Offer ||--o{ PriceHistory : "tracked by"
    Offer ||--o| Discount : "has"
    Offer ||--o{ ProductMatch : "matches"
    Wishlist ||--o{ WishlistItem : "contains"
    WishlistItem }o--|| Product : "references"
    Subscription }o--|| Merchant : "belongs to"
    ScrapingScript }o--|| MerchantWebsite : "belongs to"
    ProductMatch }o--|| Offer : "references"
    ProductMatch }o--|| Product : "references"
    ProductMatch }o--|| Employee : "reviewed by"
```

---

## API Endpoints

### Public Routes

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/otp/send` - Send OTP code
- `POST /api/auth/otp/verify-login` - Verify OTP for login
- `POST /api/auth/otp/verify-register` - Verify OTP for registration

#### Catalog
- `GET /api/categories` - List categories
- `GET /api/categories/{category}` - Category details
- `GET /api/brands` - List brands
- `GET /api/brands/{brand}` - Brand details
- `GET /api/products` - List products
- `GET /api/products/{product}` - Product details
- `GET /api/products/{product}/offers` - Product offers

#### Search
- `GET /api/search/suggestions` - Search suggestions
- `GET /api/search/results` - Search results
- `GET /api/search/filters` - Search filters

#### Fournisseur
- `POST /api/fournisseur/register` - Supplier registration
- `POST /api/fournisseur/login` - Supplier login
- `POST /api/fournisseur/track-click` - Track clicks (public)
- `POST /api/fournisseur/record-view` - Record product views (public)

### Authenticated Routes (Sanctum Token)

#### Client Features
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user info
- `PATCH /api/auth/profile` - Update profile
- `GET /api/client/dashboard` - Client dashboard with stats
- `POST /api/client/track-view` - Track product view

#### Wishlists
- `GET /api/client/wishlists` - List wishlists
- `POST /api/client/wishlists` - Create wishlist
- `DELETE /api/client/wishlists/{wishlist}` - Delete wishlist
- `POST /api/client/wishlists/{wishlist}/items` - Add item
- `DELETE /api/client/wishlists/{wishlist}/items/{item}` - Remove item

#### Price Alerts
- `GET /api/client/alerts` - List alerts
- `POST /api/client/alerts` - Create alert

#### Favorites
- `GET /api/favorites` - List favorites
- `POST /api/favorites` - Add favorite
- `POST /api/favorites/toggle` - Toggle favorite
- `DELETE /api/favorites/{productId}` - Remove favorite

#### Merchant Routes
- `GET /api/merchant/profile` - Merchant profile
- `PUT /api/merchant/profile` - Update profile
- `GET /api/merchant/offers` - List offers
- `POST /api/merchant/offers` - Create offer
- `PUT /api/merchant/offers/{offer}` - Update offer
- `DELETE /api/merchant/offers/{offer}` - Delete offer

#### Admin Routes
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/{user}/role` - Update user role
- `GET /api/admin/fournisseurs` - List fournisseurs
- `PUT /api/admin/fournisseurs/{fournisseur}/toggle` - Toggle status
- `GET /api/admin/subscriptions` - List subscriptions
- `GET /api/admin/alerts` - List price alerts
- `GET /api/admin/product-matches` - Product matches list
- `PUT /api/admin/product-matches/{productMatch}` - Review match
- `GET /api/admin/analytics/clicks` - Click analytics

---

## Core Features

### 1. Product Catalog Management

- Hierarchical categories with parent/child relationships
- Brand management with logos
- Product validation workflow
- Product specifications (stored as JSON)

### 2. Price Comparison

- Multiple offers per product from different merchants
- Price history tracking
- Active discount display
- Lowest price calculation

### 3. Smart Matching

- Automatic product matching using confidence scoring
- Employee review workflow for matches
- Manual override capability

### 4. Client Features

- **Favorites**: Quick-save products (many-to-many)
- **Wishlists**: Organized saved products
- **Price Alerts**: Target price notifications
- **Product Views**: Track browsing history
- **AI Suggestions**: Personalized recommendations

### 5. Fournisseur Portal

- API key-based authentication
- Product submission
- Click/view tracking
- Subscription management
- Dashboard with analytics

### 6. Admin Functions

- User role management
- Merchant verification
- Content moderation (categories, brands, products)
- System analytics

---

## Services

### WhatsApp Service

Supports multiple providers for notifications:
- **log** (default for development)
- **twilio** - Twilio WhatsApp
- **ultramsg** - UltraMsg API (popular in Tunisia)

Configuration via `.env`:
```
WHATSAPP_PROVIDER=ultramsg
ULTRAMSG_INSTANCE=your_instance
ULTRAMSG_TOKEN=your_token
```

---

## Scheduled Commands

- `price:alerts` - Check and trigger price alerts
- `offers:match` - Match scraped offers to products

---

## Project Structure

```
backend/
├── app/
│   ├── Console/Commands/        # Artisan commands
│   ├── Http/
│   │   ├── Controllers/         # API controllers
│   │   ├── Middleware/          # Role middleware
│   │   └── Requests/            # Form requests
│   ├── Models/                  # Eloquent models
│   ├── Providers/               # Service providers
│   ├── Services/                # Business services
│   ├── Observers/               # Model observers
│   ├── Rules/                   # Validation rules
│   └── Support/                 # Helper classes
├── config/                      # Configuration files
├── database/
│   ├── migrations/              # Database migrations
│   ├── seeders/                 # Seed data
│   └── factories/               # Model factories
├── routes/                      # Route definitions
└── tests/                      # Test files
```

---

## Getting Started

### Installation

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Running Tests

```bash
composer test
```

### Code Quality

```bash
composer lint
```

---

## Security Features

- Password hashing (bcrypt)
- Phone verification via OTP
- Role-based access control
- API key authentication for suppliers
- Sanctum token-based API authentication

---

## License

MIT License