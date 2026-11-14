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

# ضبط الصلاحيات
RUN chmod -R 775 storage bootstrap/cache

# فتح المنفذ لـ Render
EXPOSE 10000

# تشغيل التهجير (Migrations) ثم تشغيل السيرفر على المنفذ الذي تطلبه Render
CMD php artisan config:clear && \
    php artisan migrate --force && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-10000}