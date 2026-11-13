<?php

namespace App\Domains\Auth\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserAuthResource extends JsonResource
{
    protected ?string $token;

    public function __construct($resource, ?string $token = null)
    {
        parent::__construct($resource);
        $this->token = $token;
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
            'merchant_profile' => new MerchantProfileResource($this->whenLoaded('merchantProfile')),
            $this->mergeWhen($this->token !== null, [
                'token' => $this->token,
                'token_type' => 'Bearer',
            ]),
        ];
    }
}

