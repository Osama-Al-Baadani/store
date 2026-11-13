<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name', 100); // e.g. "شد 600 حبة", "كرتون 240 حبة"
            $table->string('unit', 30)->default('حبة'); // حبة، شد، كرتون، باكت
            $table->unsignedInteger('pack_quantity')->default(1); // كم حبة داخل هذا الشد
            $table->unsignedInteger('step_quantity')->default(1); // أقل كمية ومضاعفات الزيادة
            $table->decimal('unit_price', 10, 2); // سعر الحبة (غير شامل الضريبة)
            $table->decimal('old_price', 10, 2)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_packages');
    }
};

