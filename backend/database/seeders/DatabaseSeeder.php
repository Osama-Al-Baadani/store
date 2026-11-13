<?php

namespace Database\Seeders;

use App\Enums\CustomerStatus;
use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Category;
use App\Models\MerchantProfile;
use App\Models\Product;
use App\Models\ProductPackage;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. المستخدمين المبدئيين - تاجر معتمد
        $merchantUser = User::create([
            'name' => 'لمسه',
            'phone' => '0579621870',
            'email' => 'lamsa@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::MERCHANT,
        ]);

        MerchantProfile::create([
            'user_id' => $merchantUser->id,
            'company_name' => 'مؤسسة لمسة للتجارة والتوريد',
            'cr_number' => '1010123456',
            'vat_number' => '300123456700003',
            'owner_name' => 'لمسه',
            'city' => 'الرياض',
            'address' => 'حي البطحاء - مجمع الجملة التجاري',
            'status' => CustomerStatus::ACTIVE,
            'customer_code' => 'CUS-3640',
            'approved_at' => now(),
        ]);

        // تاجر 2: قيد المراجعة والاعتماد
        $pendingMerchantUser = User::create([
            'name' => 'سعود الشمري',
            'phone' => '0551122334',
            'email' => 'saud@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::MERCHANT,
        ]);

        MerchantProfile::create([
            'user_id' => $pendingMerchantUser->id,
            'company_name' => 'شركة أفق التجارة المحدودة',
            'cr_number' => '1010987654',
            'vat_number' => '300987654300003',
            'owner_name' => 'سعود الشمري',
            'city' => 'الرياض',
            'address' => 'حي السلي - شارع هارون الرشيد',
            'status' => CustomerStatus::PENDING,
            'customer_code' => 'CUS-9812',
            'approved_at' => null,
        ]);

        User::create([
            'name' => 'مدير النظام - المخازن الاقتصادية',
            'phone' => '0500000000',
            'email' => 'admin@makhazen.com',
            'password' => Hash::make('admin123456'),
            'role' => UserRole::ADMIN,
        ]);

        // 2. مستودعات شركة المخازن الاقتصادية المعتمدة
        $badeeaWarehouse = Branch::create([
            'name' => 'مستودع البديعة المركزي',
            'code' => 'badeea',
            'description' => 'المستودع الرئيسي - توريد فوري بالحبة لمنطقة غرب وجنوب الرياض',
            'color' => '#b47820',
            'is_active' => true,
            'sort' => 1,
        ]);

        $aziziaWarehouse = Branch::create([
            'name' => 'مستودع العزيزية للتوريد',
            'code' => 'azizia',
            'description' => 'مستودع التجهيز السريع والشحن المباشر - الرياض حي العزيزية',
            'color' => '#c28b38',
            'is_active' => true,
            'sort' => 2,
        ]);

        $sulayWarehouse = Branch::create([
            'name' => 'مستودع السلي للتوزيع الرئيسي',
            'code' => 'sulay',
            'description' => 'مستودع الجملة الكبرى وتوريد الكميات الضخمة - مخرج 18 السلي',
            'color' => '#854d0e',
            'is_active' => true,
            'sort' => 3,
        ]);

        // ==========================================
        // 3. أقسام مستودع البديعة المركزي (12 قسماً شاملاً)
        // ==========================================
        $categoriesData = [
            ['name' => 'أدوات عناية بالحواجب', 'sort' => 1],
            ['name' => 'مكائن وشفرات حلاقة', 'sort' => 2],
            ['name' => 'العناية بالأظافر والقدمين', 'sort' => 3],
            ['name' => 'بنس وإكسسوارات شعر', 'sort' => 4],
            ['name' => 'مستلزمات الصالونات والمشاغل', 'sort' => 5],
            ['name' => 'العناية بالبشرة والوجه', 'sort' => 6],
            ['name' => 'شمع وأجهزة إزالة الشعر', 'sort' => 7],
            ['name' => 'فرش وأمشاط التصفيف', 'sort' => 8],
            ['name' => 'مستلزمات الحمام والمساج', 'sort' => 9],
            ['name' => 'مرايا وإكسسوارات التجميل', 'sort' => 10],
            ['name' => 'مناشف ومريلات استخدام واحد', 'sort' => 11],
            ['name' => 'معقمات ومطهرات العناية', 'sort' => 12],
        ];

        $badeeaCats = [];
        foreach ($categoriesData as $cat) {
            $badeeaCats[$cat['name']] = Category::create([
                'branch_id' => $badeeaWarehouse->id,
                'name' => $cat['name'],
                'sort' => $cat['sort'],
                'is_active' => true,
            ]);
        }

        // ==========================================
        // 4. أصناف مستودع البديعة لكل قسم
        // ==========================================
        $productsData = [
            // 1. أدوات عناية بالحواجب
            [
                'cat' => 'أدوات عناية بالحواجب',
                'code' => 'AM-683',
                'barcode' => '6920254286835',
                'name' => 'موس حواجب CINEMA Plus أزرق',
                'desc' => 'شفرات تنظيف الحواجب عالية الجودة للاستخدام اليومي',
                'is_new' => true,
                'price' => 3.33,
                'old_price' => 3.80,
                'pack_qty' => 12,
                'unit' => 'شد',
            ],
            [
                'cat' => 'أدوات عناية بالحواجب',
                'code' => 'AM-0111',
                'barcode' => '6956726822829',
                'name' => 'أمواس حواجب ملونة CINEMA Plus (طقم 3 حبات)',
                'desc' => 'طقم أمواس حواجب بألوان متعددة وشفرة يابانية مقاومة للصدأ',
                'is_new' => false,
                'price' => 4.00,
                'old_price' => null,
                'pack_qty' => 12,
                'unit' => 'شد',
            ],
            [
                'cat' => 'أدوات عناية بالحواجب',
                'code' => 'AM-0422',
                'barcode' => '6956726820422',
                'name' => 'ملقط حواجب ستانلس ستيل مائل احترافي',
                'desc' => 'ملقط دقيق برأس مائل مخصص للمشاغل ومراكز التجميل',
                'is_new' => false,
                'price' => 5.25,
                'old_price' => 6.00,
                'pack_qty' => 24,
                'unit' => 'كرتون',
            ],

            // 2. مكائن وشفرات حلاقة
            [
                'cat' => 'مكائن وشفرات حلاقة',
                'code' => 'SH-1020',
                'barcode' => '6920231020101',
                'name' => 'ماكينة حلاقة VGR احترافية شحن سريع',
                'desc' => 'ماكينة حلاقة وتشذيب الرأس واللحية بمحرك توربو وبطارية ليثيوم',
                'is_new' => true,
                'price' => 45.00,
                'old_price' => 55.00,
                'pack_qty' => 6,
                'unit' => 'كرتون',
            ],
            [
                'cat' => 'مكائن وشفرات حلاقة',
                'code' => 'SH-3040',
                'barcode' => '6920231030402',
                'name' => 'شفرات حلاقة دوركو DORCO حبة كاملة (باكيت 100 شفرة)',
                'desc' => 'شفرات حلاقة دوركو بلاتينيوم الأصلية للصالونات',
                'is_new' => false,
                'price' => 18.50,
                'old_price' => 21.00,
                'pack_qty' => 20,
                'unit' => 'طرد',
            ],
            [
                'cat' => 'مكائن وشفرات حلاقة',
                'code' => 'SH-5080',
                'barcode' => '6920231050803',
                'name' => 'أمواس حلاقة استخدام واحد برأس مزدوج (كيس 50 حبة)',
                'desc' => 'موس حلاقة فردي برأس مزدوج وشريط مرطب',
                'is_new' => false,
                'price' => 14.00,
                'old_price' => 16.50,
                'pack_qty' => 10,
                'unit' => 'شد',
            ],

            // 3. العناية بالأظافر والقدمين
            [
                'cat' => 'العناية بالأظافر والقدمين',
                'code' => 'AM-069',
                'barcode' => '6920230000691',
                'name' => 'مبرد قدم بديكير مزدوج CINEMA Plus',
                'desc' => 'مبرد بديكير لعناية فائقة وتنعيم الكعبين - عبوة صوالين',
                'is_new' => false,
                'price' => 4.17,
                'old_price' => 4.75,
                'pack_qty' => 12,
                'unit' => 'شد',
            ],
            [
                'cat' => 'العناية بالأظافر والقدمين',
                'code' => 'NL-201',
                'barcode' => '6920230020104',
                'name' => 'قصاصة أظافر استيل كبيرة مع مبرد مدمج',
                'desc' => 'قصاصة أظافر قوية من الستانلس ستيل المقاوم للصدأ',
                'is_new' => true,
                'price' => 3.50,
                'old_price' => null,
                'pack_qty' => 24,
                'unit' => 'كرتون',
            ],
            [
                'cat' => 'العناية بالأظافر والقدمين',
                'code' => 'NL-505',
                'barcode' => '6920230050505',
                'name' => 'طقم فواصل أصابع إسفنجية للبديكير (100 زوج)',
                'desc' => 'فواصل أصابع القدم الإسفنجية للمشاغل وصالونات التجميل',
                'is_new' => false,
                'price' => 12.00,
                'old_price' => 15.00,
                'pack_qty' => 10,
                'unit' => 'شد',
            ],

            // 4. بنس وإكسسوارات شعر
            [
                'cat' => 'بنس وإكسسوارات شعر',
                'code' => 'HR-101',
                'barcode' => '6920230110106',
                'name' => 'بنس شعر سوداء مجوفة 5 سم (علبة نص كيلو)',
                'desc' => 'بنس شعر حديد كربونية مرنة لتثبيت التسريحات والتسريحة الخليجية',
                'is_new' => false,
                'price' => 16.00,
                'old_price' => 18.50,
                'pack_qty' => 12,
                'unit' => 'كرتون',
            ],
            [
                'cat' => 'بنس وإكسسوارات شعر',
                'code' => 'HR-205',
                'barcode' => '6920230120507',
                'name' => 'مشابك تقسيم الشعر بلاستيك كروكودايل (طقم 12 حبة)',
                'desc' => 'كلبسات تمساح قوية لمسك خصلات الشعر أثناء السشوار والصبغة',
                'is_new' => true,
                'price' => 8.50,
                'old_price' => 10.00,
                'pack_qty' => 24,
                'unit' => 'شد',
            ],
            [
                'cat' => 'بنس وإكسسوارات شعر',
                'code' => 'HR-310',
                'barcode' => '6920230131008',
                'name' => 'مطاطات شعر سيليكون صغيرة شفافة (كيس 1000 حبة)',
                'desc' => 'مطاطات مرنة غير قابلة للقطع لتسريحات الأطفال والعرائس',
                'is_new' => false,
                'price' => 6.50,
                'old_price' => null,
                'pack_qty' => 50,
                'unit' => 'طرد',
            ],

            // 5. مستلزمات الصالونات والمشاغل
            [
                'cat' => 'مستلزمات الصالونات والمشاغل',
                'code' => 'SL-401',
                'barcode' => '6920230140109',
                'name' => 'ورق رقبة حلاقة صحي مطاطي (طقم 5 رولات)',
                'desc' => 'رول ياقات حلاقة مانع لتسرب الشعر والماء مع شريط لاصق ذاتي',
                'is_new' => false,
                'price' => 13.50,
                'old_price' => 16.00,
                'pack_qty' => 10,
                'unit' => 'كرتون',
            ],
            [
                'cat' => 'مستلزمات الصالونات والمشاغل',
                'code' => 'SL-502',
                'barcode' => '6920230150210',
                'name' => 'وعاء خلط الصبغة مع فرشتين سيليكون وشعيرات',
                'desc' => 'صحن صبغة متدرج مدرج بالمل مع فرشتين لتوزيع متجانس للون',
                'is_new' => true,
                'price' => 5.00,
                'old_price' => 6.50,
                'pack_qty' => 24,
                'unit' => 'شد',
            ],

            // 6. العناية بالبشرة والوجه
            [
                'cat' => 'العناية بالبشرة والوجه',
                'code' => 'SK-110',
                'barcode' => '6920230161011',
                'name' => 'قطن إزالة مكياج دائري ناعم 100% قطن (عبوة 100 قطعة)',
                'desc' => 'أقراص قطنية مزدوجة الوجه لتنظيف البشرة وتطبيق التونر',
                'is_new' => false,
                'price' => 4.50,
                'old_price' => 5.50,
                'pack_qty' => 36,
                'unit' => 'كرتون',
            ],
            [
                'cat' => 'العناية بالبشرة والوجه',
                'code' => 'SK-220',
                'barcode' => '6920230162212',
                'name' => 'أقنعة كولاجين للوجه مضغوطة ترطيب عميق (كيس 50 قناع)',
                'desc' => 'شيت ماسك جاف ينقع بالسيروم ويتمدد لمقاس الوجه فورياً',
                'is_new' => true,
                'price' => 11.00,
                'old_price' => 14.00,
                'pack_qty' => 20,
                'unit' => 'شد',
            ],

            // 7. شمع وأجهزة إزالة الشعر
            [
                'cat' => 'شمع وأجهزة إزالة الشعر',
                'code' => 'WX-100',
                'barcode' => '6920230171013',
                'name' => 'حبيبات شمع إيطالي صلب لإزالة الشعر 1 كجم - لافندر',
                'desc' => 'شمع فيلم حار منخفض الحرارة لطيف على البشرة الحساسة والمناطق الحساسة',
                'is_new' => true,
                'price' => 32.00,
                'old_price' => 38.00,
                'pack_qty' => 10,
                'unit' => 'كرتون',
            ],
            [
                'cat' => 'شمع وأجهزة إزالة الشعر',
                'code' => 'WX-300',
                'barcode' => '6920230173014',
                'name' => 'أعواد خشبية لفرد الشمع مقاس كبير (باكيت 100 عود)',
                'desc' => 'خافض لسان خشبي طبي ناعم الحواف لتطبيق الشمع بدقة وسرعة',
                'is_new' => false,
                'price' => 4.00,
                'old_price' => null,
                'pack_qty' => 50,
                'unit' => 'طرد',
            ],

            // 8. فرش وأمشاط التصفيف
            [
                'cat' => 'فرش وأمشاط التصفيف',
                'code' => 'BR-101',
                'barcode' => '6920230181015',
                'name' => 'فرشاة استشوار حرارية سيراميك مقاس 45 مم',
                'desc' => 'أسطوانة سيراميك ألومنيوم تحافظ على الحرارة وتمنع تطاير الشعر',
                'is_new' => false,
                'price' => 18.00,
                'old_price' => 22.00,
                'pack_qty' => 12,
                'unit' => 'شد',
            ],
            [
                'cat' => 'فرش وأمشاط التصفيف',
                'code' => 'BR-202',
                'barcode' => '6920230182016',
                'name' => 'مشط ذيل كربوني لتقسيم الشعر ومقاوم للحرارة',
                'desc' => 'مشط بوز معدني رفيع جداً مخصص لسحب الخصلات والهايلايت',
                'is_new' => true,
                'price' => 4.75,
                'old_price' => null,
                'pack_qty' => 24,
                'unit' => 'كرتون',
            ],

            // 9. مستلزمات الحمام والمساج
            [
                'cat' => 'مستلزمات الحمام والمساج',
                'code' => 'BT-101',
                'barcode' => '6920230191017',
                'name' => 'ليفة مغربية كيس أصلية درجة أولى خشنة',
                'desc' => 'كيس حمام مغربي كريب أصلي للتقشير العميق وإزالة الجلد الميت',
                'is_new' => false,
                'price' => 6.00,
                'old_price' => 7.50,
                'pack_qty' => 20,
                'unit' => 'شد',
            ],
            [
                'cat' => 'مستلزمات الحمام والمساج',
                'code' => 'BT-303',
                'barcode' => '6920230193018',
                'name' => 'صابون بلدي مغربي بزيت الزيتون 5 كجم عبوة مشاغل',
                'desc' => 'صابون أسود طبيعي غني بفيتامين E لتهيئة البشرة للحمام المغربي',
                'is_new' => true,
                'price' => 48.00,
                'old_price' => 56.00,
                'pack_qty' => 4,
                'unit' => 'طرد',
            ],

            // 10. مرايا وإكسسوارات التجميل
            [
                'cat' => 'مرايا وإكسسوارات التجميل',
                'code' => 'MR-101',
                'barcode' => '6920230201019',
                'name' => 'مرآة يد دائرية بمقبض لصالونات الحلاقة مقاس 25 سم',
                'desc' => 'مرآة خلفية خفيفة الوزن بإطار مانع للصدمات لعرض خلفية الرأس للزبون',
                'is_new' => false,
                'price' => 12.50,
                'old_price' => 15.00,
                'pack_qty' => 12,
                'unit' => 'كرتون',
            ],
            [
                'cat' => 'مرايا وإكسسوارات التجميل',
                'code' => 'MR-205',
                'barcode' => '6920230202020',
                'name' => 'إسفنجات مكياج بيوتي بلندر ميني (برطمان 24 حبة)',
                'desc' => 'إسفنجات دمعة ناعمة خالية من اللاتكس لتوزيع كريم الأساس والكونسيلر',
                'is_new' => true,
                'price' => 19.00,
                'old_price' => 24.00,
                'pack_qty' => 12,
                'unit' => 'شد',
            ],

            // 11. مناشف ومريلات استخدام واحد
            [
                'cat' => 'مناشف ومريلات استخدام واحد',
                'code' => 'TW-101',
                'barcode' => '6920230211021',
                'name' => 'مناشف استخدام واحد قطنية 40×70 سم (كيس 50 حبة)',
                'desc' => 'مناشف صحية معقمة وفائقة الامتصاص بديل المناشف القماشية للصالونات',
                'is_new' => false,
                'price' => 19.50,
                'old_price' => 23.00,
                'pack_qty' => 10,
                'unit' => 'طرد',
            ],
            [
                'cat' => 'مناشف ومريلات استخدام واحد',
                'code' => 'TW-202',
                'barcode' => '6920230212022',
                'name' => 'مريلة حلاقة نايلون كبار استخدام واحد (كيس 100 حبة)',
                'desc' => 'كاب حلاقة بلاستيك واقي ضد الماء والصبغات والشعر المتطاير',
                'is_new' => false,
                'price' => 14.00,
                'old_price' => null,
                'pack_qty' => 15,
                'unit' => 'كرتون',
            ],

            // 12. معقمات ومطهرات العناية
            [
                'cat' => 'معقمات ومطهرات العناية',
                'code' => 'SN-101',
                'barcode' => '6920230221023',
                'name' => 'بخاخ تعقيم أدوات الحلاقة والمكائن 5 في 1 كول كير 400 مل',
                'desc' => 'يبرد وينظف ويعقم ويزيت ويمنع الصدأ لشفرات ومكائن الحلاقة فورياً',
                'is_new' => true,
                'price' => 22.00,
                'old_price' => 26.50,
                'pack_qty' => 12,
                'unit' => 'كرتون',
            ],
            [
                'cat' => 'معقمات ومطهرات العناية',
                'code' => 'SN-303',
                'barcode' => '6920230223024',
                'name' => 'كحول طبي معقم 70% بخاخ 500 مل للأسطح والأدوات',
                'desc' => 'مطهر ومعقم سريع الجفاف ومعتمد لصالونات ومراكز التجميل',
                'is_new' => false,
                'price' => 7.50,
                'old_price' => 9.00,
                'pack_qty' => 24,
                'unit' => 'كرتون',
            ],
        ];

        foreach ($productsData as $index => $item) {
            $catId = $badeeaCats[$item['cat']]->id;
            $p = Product::create([
                'branch_id' => $badeeaWarehouse->id,
                'category_id' => $catId,
                'code' => $item['code'],
                'barcode' => $item['barcode'],
                'name' => $item['name'],
                'description' => $item['desc'],
                'is_new' => $item['is_new'],
                'is_featured' => true,
                'is_active' => true,
                'sort' => $index + 1,
            ]);

            ProductPackage::create([
                'product_id' => $p->id,
                'name' => $item['unit'],
                'unit' => $item['unit'],
                'pack_quantity' => $item['pack_qty'],
                'step_quantity' => 1,
                'unit_price' => $item['price'],
                'old_price' => $item['old_price'],
                'is_default' => true,
                'is_active' => true,
            ]);
        }

        // ==========================================
        // 5. أقسام وأصناف مستودع العزيزية للتوريد
        // ==========================================
        $aziziaCatsData = [
            ['name' => 'مستلزمات الصالونات ومراكز التجميل', 'sort' => 1],
            ['name' => 'شفرات ومكائن حلاقة رجالية', 'sort' => 2],
            ['name' => 'العناية بالبشرة والجسم', 'sort' => 3],
            ['name' => 'مناشف ومستهلكات أحادية الاستخدام', 'sort' => 4],
        ];

        $azCats = [];
        foreach ($aziziaCatsData as $c) {
            $azCats[$c['name']] = Category::create([
                'branch_id' => $aziziaWarehouse->id,
                'name' => $c['name'],
                'sort' => $c['sort'],
                'is_active' => true,
            ]);
        }

        $pAz1 = Product::create([
            'branch_id' => $aziziaWarehouse->id,
            'category_id' => $azCats['مستلزمات الصالونات ومراكز التجميل']->id,
            'code' => 'AZ-901',
            'barcode' => '6920239010012',
            'name' => 'مناشف استخدام واحد قطنية فاخرة 40×80 سم',
            'description' => 'مناشف صالونات ومشاغل صحية معقمة وفائقة الامتصاص',
            'is_new' => true,
            'is_featured' => true,
            'is_active' => true,
            'sort' => 1,
        ]);
        ProductPackage::create([
            'product_id' => $pAz1->id,
            'name' => 'شد',
            'unit' => 'شد',
            'pack_quantity' => 50,
            'step_quantity' => 1,
            'unit_price' => 1.85,
            'old_price' => 2.20,
            'is_default' => true,
            'is_active' => true,
        ]);

        $pAz2 = Product::create([
            'branch_id' => $aziziaWarehouse->id,
            'category_id' => $azCats['شفرات ومكائن حلاقة رجالية']->id,
            'code' => 'AZ-905',
            'barcode' => '6920239010055',
            'name' => 'شفرات جيليت بلو 2 بلس (كيس 24 شفرة)',
            'description' => 'شفرات حلاقة أصلية بشريط صبار مرطب',
            'is_new' => false,
            'is_featured' => true,
            'is_active' => true,
            'sort' => 2,
        ]);
        ProductPackage::create([
            'product_id' => $pAz2->id,
            'name' => 'باكيت',
            'unit' => 'باكيت',
            'pack_quantity' => 24,
            'step_quantity' => 1,
            'unit_price' => 1.25,
            'old_price' => 1.50,
            'is_default' => true,
            'is_active' => true,
        ]);

        // ==========================================
        // 6. أقسام وأصناف مستودع السلي للتوزيع الرئيسي
        // ==========================================
        $catSulay1 = Category::create([
            'branch_id' => $sulayWarehouse->id,
            'name' => 'أصناف التوزيع والكراتين الكبرى',
            'sort' => 1,
            'is_active' => true,
        ]);

        $pSl1 = Product::create([
            'branch_id' => $sulayWarehouse->id,
            'category_id' => $catSulay1->id,
            'code' => 'SL-1002',
            'barcode' => '6920239050099',
            'name' => 'موس حواجب CINEMA Plus - كرتون توريد رئيسي',
            'description' => 'كراتين توريد للموزعين الكبار ومحلات الجملة (50 درزن)',
            'is_new' => false,
            'is_featured' => true,
            'is_active' => true,
            'sort' => 1,
        ]);
        ProductPackage::create([
            'product_id' => $pSl1->id,
            'name' => 'كرتون رئيسي',
            'unit' => 'كرتون',
            'pack_quantity' => 600,
            'step_quantity' => 1,
            'unit_price' => 2.45,
            'old_price' => 2.90,
            'is_default' => true,
            'is_active' => true,
        ]);
    }
}
