<?php

namespace App\Domains\Auth\Actions;

use App\Domains\Auth\DTOs\RegisterMerchantDTO;
use App\Enums\CustomerStatus;
use App\Enums\UserRole;
use App\Models\MerchantProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegisterMerchantAction
{
    public function execute(RegisterMerchantDTO $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = User::create([
                'name' => $dto->ownerName,
                'phone' => $dto->phone,
                'email' => $dto->email,
                'password' => Hash::make($dto->password),
                'role' => UserRole::MERCHANT,
            ]);

            MerchantProfile::create([
                'user_id' => $user->id,
                'company_name' => $dto->companyName,
                'cr_number' => $dto->crNumber,
                'vat_number' => $dto->vatNumber,
                'owner_name' => $dto->ownerName,
                'city' => $dto->city,
                'address' => $dto->address,
                'cr_document_path' => $dto->crDocumentPath,
                'status' => CustomerStatus::PENDING,
            ]);

            return $user->load('merchantProfile');
        });
    }
}

