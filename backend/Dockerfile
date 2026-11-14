FROM php:8.2-cli

# تثبيت الإضافات الضرورية للارافيل
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    ca-certificates \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# جلب Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . /var/www/html

# تثبيت مكتبات المشروع
RUN composer install --no-dev --optimize-autoloader --no-interaction

# ضبط الصلاحيات وتجهيز مجلدات الرفع
RUN mkdir -p public/uploads/ads public/uploads/products storage/framework/sessions storage/framework/views storage/framework/cache/data storage/logs && \
    chmod -R 775 storage bootstrap/cache public/uploads

# فتح المنفذ لـ Render
EXPOSE 10000

# تشغيل التهجير والزرع الأولي (إذا كانت القاعدة فارغة) ثم تشغيل السيرفر على المنفذ الذي تطلبه Render
CMD php artisan config:clear && \
    (php artisan storage:link --force || true) && \
    php artisan migrate --force && \
    php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); if (\App\Models\User::count() === 0) { passthru("php artisan db:seed --force"); } if (! \App\Models\User::where("phone", "0500000000")->exists()) { \App\Models\User::create(["name" => "مدير النظام - المخازن الاقتصادية", "phone" => "0500000000", "email" => "admin@makhazen.com", "password" => \Illuminate\Support\Facades\Hash::make("admin123456"), "role" => \App\Enums\UserRole::ADMIN]); }' && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-10000}