<?php

use App\Models\Branch;
use App\Models\Category;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $branch = Branch::orderBy('id')->first();
        if (!$branch) {
            return;
        }

        $parent = Category::firstOrCreate(
            [
                'branch_id' => $branch->id,
                'name' => 'العناية بالشعر',
                'parent_id' => null,
            ],
            [
                'sort' => 0,
                'is_active' => true,
            ]
        );

        $subcategories = [
            'بلسم',
            'زيوت',
            'شامبو',
            'صبغات الشعر',
            'كريمات الشعر',
            'ماسكات شعر',
            'مستلزمات تصفيف الشعر',
        ];

        foreach ($subcategories as $index => $subName) {
            Category::firstOrCreate(
                [
                    'branch_id' => $branch->id,
                    'parent_id' => $parent->id,
                    'name' => $subName,
                ],
                [
                    'sort' => $index + 1,
                    'is_active' => true,
                ]
            );
        }
    }

    public function down(): void
    {
        $parent = Category::where('name', 'العناية بالشعر')->whereNull('parent_id')->first();
        if ($parent) {
            Category::where('parent_id', $parent->id)->delete();
            $parent->delete();
        }
    }
};

