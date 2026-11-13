#!/bin/sh
set -e

cd /var/www/html

# Ensure .env file exists so artisan commands work seamlessly alongside container env vars
if [ ! -f /var/www/html/.env ]; then
    touch /var/www/html/.env
fi

# Generate a runtime APP_KEY if none was provided via environment
if [ -z "${APP_KEY:-}" ]; then
    export APP_KEY="$(php -r "echo 'base64:' . base64_encode(random_bytes(32));")"
    echo "[entrypoint] Generated temporary APP_KEY because APP_KEY was empty."
fi

# Ensure writable storage, cache, and public upload directories
mkdir -p \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache \
    /var/www/html/public/uploads/ads \
    /var/www/html/public/uploads/products

chown -R www-data:www-data \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache \
    /var/www/html/public/uploads

chmod -R ug+rwX \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache \
    /var/www/html/public/uploads

# Wait for MySQL when DB_CONNECTION is mysql
if [ "${DB_CONNECTION:-mysql}" = "mysql" ]; then
    echo "[entrypoint] Waiting for MySQL at ${DB_HOST:-db}:${DB_PORT:-3306}..."
    tries=0
    until php -r '
        $host = getenv("DB_HOST") ?: "db";
        $port = getenv("DB_PORT") ?: "3306";
        $db   = getenv("DB_DATABASE") ?: "store_db";
        $user = getenv("DB_USERNAME") ?: "root";
        $pass = getenv("DB_PASSWORD") ?: "";
        try {
            new PDO("mysql:host={$host};port={$port};dbname={$db}", $user, $pass, [PDO::ATTR_TIMEOUT => 3]);
            exit(0);
        } catch (Throwable $e) {
            exit(1);
        }
    '; do
        tries=$((tries + 1))
        if [ "$tries" -ge 30 ]; then
            echo "[entrypoint] MySQL did not become ready in time."
            exit 1
        fi
        sleep 2
    done
    echo "[entrypoint] MySQL is ready."
fi

php artisan package:discover --ansi || true
php artisan config:clear || true
php artisan storage:link --force || true
php artisan migrate --force

# Seed initial catalog/users only when users table is empty
user_count="$(php -r '
    require "vendor/autoload.php";
    $app = require "bootstrap/app.php";
    $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    try {
        echo \App\Models\User::count();
    } catch (Throwable $e) {
        echo "0";
    }
')"

if [ "${user_count:-0}" = "0" ]; then
    echo "[entrypoint] Empty users table detected, running database seeders..."
    php artisan db:seed --force || true
fi

exec "$@"

