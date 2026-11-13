erDiagram
    users ||--o| merchant_profiles : "يملك (1:1)"
    users ||--o| carts : "يملك (1:1)"
    users ||--o{ orders : "يطلب (1:N)"

    branches ||--o{ products : "يحتوي (1:N)"
    branches ||--o{ orders : "يستقبل (1:N)"

    categories ||--o{ products : "يصنف (1:N)"

    products ||--o{ product_packages : "له تعبئة (1:N)"

    carts ||--o{ cart_items : "يحتوي (1:N)"
    product_packages ||--o{ cart_items : "يُضاف كـ (1:N)"

    orders ||--o{ order_items : "يحتوي على (1:N)"

    users {
        bigint id PK
        string phone UK
        string password
        string role
        string status
    }
    merchant_profiles {
        bigint id PK
        bigint user_id FK
        string store_name
        string cr_number
        string tax_number
        string address
    }
    branches {
        bigint id PK
        string name
        string logo_path
        boolean is_active
    }
    categories {
        bigint id PK
        string name
        string image_path
    }
    products {
        bigint id PK
        bigint branch_id FK
        bigint category_id FK
        string name
        string barcode
        string sku
        string image_path
    }
    product_packages {
        bigint id PK
        bigint product_id FK
        string package_type
        integer pieces_count
        decimal price_per_piece
    }
    carts {
        bigint id PK
        bigint user_id FK
    }
    cart_items {
        bigint id PK
        bigint cart_id FK
        bigint product_package_id FK
        integer quantity
    }
    orders {
        bigint id PK
        string order_number UK
        bigint user_id FK
        bigint branch_id FK
        decimal subtotal
        decimal tax_amount
        decimal total_amount
        string status
    }
    order_items {
        bigint id PK
        bigint order_id FK
        string product_name
        string sku_barcode
        string package_details
        decimal purchased_price_per_piece
        integer quantity
        decimal item_total
    }