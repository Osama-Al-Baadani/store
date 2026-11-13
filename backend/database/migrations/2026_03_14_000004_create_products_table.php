<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('code', 50);
            $table->string('barcode', 50)->nullable()->index();
            $table->string('name', 150)->index();
            $table->text('description')->nullable();
            $table->string('image', 255)->nullable();
            $table->boolean('is_new')->default(false)->index();
            $table->boolean('is_featured')->default(false)->index();
            $table->boolean('is_coming_soon')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->integer('sort')->default(0);
            $table->timestamps();

            $table->unique(['branch_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};

