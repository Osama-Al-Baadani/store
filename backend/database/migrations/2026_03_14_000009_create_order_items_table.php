<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignId('package_id')->nullable()->constrained('product_packages')->nullOnDelete();

            // Historical Snapshots (لا تتغير أبداً حتى لو تغير المنتج لاحقاً)
            $table->string('product_name', 150);
            $table->string('product_code', 50);
            $table->string('barcode', 50)->nullable();
            $table->string('package_name', 100);
            $table->string('unit', 30)->default('حبة');
            $table->unsignedInteger('pack_quantity')->default(1);
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('line_total', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};

