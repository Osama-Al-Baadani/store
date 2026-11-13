<?php

namespace App\Domains\Auth\Requests;

use App\Domains\Auth\DTOs\RegisterMerchantDTO;
use Illuminate\Foundation\Http\FormRequest;

class RegisterMerchantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'min:3', 'max:150'],
            'cr_number' => ['required', 'string', 'regex:/^\d{10}$/', 'unique:merchant_profiles,cr_number'],
            'vat_number' => ['nullable', 'string', 'regex:/^3\d{13}3$/'],
            'owner_name' => ['required', 'string', 'min:3', 'max:100'],
            'phone' => ['required', 'string', 'regex:/^(05\d{8}|5\d{8})$/', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:6'],
            'city' => ['required', 'string', 'max:60'],
            'address' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:150', 'unique:users,email'],
            'cr_document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'company_name.required' => 'اسم المنشأة مطلوب',
            'cr_number.required' => 'رقم السجل التجاري مطلوب',
            'cr_number.regex' => 'رقم السجل التجاري يجب أن يتكون من 10 أرقام',
            'cr_number.unique' => 'رقم السجل التجاري مسجل مسبقاً',
            'vat_number.regex' => 'الرقم الضريبي يجب أن يكون 15 رقماً ويبدأ وينتهي بالرقم 3',
            'owner_name.required' => 'اسم المسؤول مطلوب',
            'phone.required' => 'رقم الجوال مطلوب',
            'phone.regex' => 'صيغة رقم الجوال غير صحيحة (مثال: 05xxxxxxxx)',
            'phone.unique' => 'رقم الجوال مسجل مسبقاً',
            'password.required' => 'كلمة المرور مطلوبة',
            'password.min' => 'كلمة المرور يجب ألا تقل عن 6 خانات',
            'city.required' => 'المدينة مطلوبة',
            'cr_document.max' => 'حجم ملف السجل التجاري يجب ألا يتجاوز 5 ميجابايت',
        ];
    }

    public function toDTO(?string $crDocPath = null): RegisterMerchantDTO
    {
        $phone = $this->input('phone');
        if (str_starts_with($phone, '5')) {
            $phone = '0' . $phone;
        }

        return new RegisterMerchantDTO(
            companyName: (string) $this->input('company_name'),
            crNumber: (string) $this->input('cr_number'),
            vatNumber: $this->input('vat_number') ? (string) $this->input('vat_number') : null,
            ownerName: (string) $this->input('owner_name'),
            phone: $phone,
            password: (string) $this->input('password'),
            city: (string) $this->input('city'),
            address: $this->input('address') ? (string) $this->input('address') : null,
            email: $this->input('email') ? (string) $this->input('email') : null,
            crDocumentPath: $crDocPath,
        );
    }
}

