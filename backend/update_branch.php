<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

\App\Models\Branch::where('id', 1)->update([
    'name' => 'شركة المخازن الاقتصادية',
    'description' => 'المستودعات المركزية لتوريد الجملة',
]);

echo "Updated successfully: " . \App\Models\Branch::find(1)->name . PHP_EOL;

