<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchant_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('company_name', 150);
            $table->string('cr_number', 30)->unique();
            $table->string('vat_number', 30)->nullable();
            $table->string('owner_name', 100);
            $table->string('city', 60);
            $table->string('address', 255)->nullable();
            $table->string('cr_document_path', 255)->nullable();
            $table->enum('status', ['pending', 'active', 'rejected', 'suspended'])->default('pending')->index();
            $table->string('customer_code', 30)->nullable()->unique();
            $table->string('admin_note', 255)->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_profiles');
    }
};

