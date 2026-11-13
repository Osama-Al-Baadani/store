<?php

namespace App\Domains\Auth\Requests;

use App\Domains\Auth\DTOs\LoginDTO;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'رقم الجوال مطلوب للدخول',
            'password.required' => 'كلمة المرور مطلوبة',
        ];
    }

    public function toDTO(): LoginDTO
    {
        $phone = trim((string) $this->input('phone'));
        if (str_starts_with($phone, '5')) {
            $phone = '0' . $phone;
        }

        return new LoginDTO(
            phone: $phone,
            password: (string) $this->input('password'),
            deviceName: $this->input('device_name', 'nextjs-client'),
        );
    }
}

