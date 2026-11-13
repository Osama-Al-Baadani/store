<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>طلبية عميل #{{ $order->order_number }}</title>
    @php
        // لون الهوية: لون المستودع المختار مع تدرجات فاتحة محسوبة
        $brand = $branch->color ?? '#68107e';
        $hex = ltrim($brand, '#');
        if (strlen($hex) !== 6) { $hex = '68107e'; }
        $rgb = [hexdec(substr($hex, 0, 2)), hexdec(substr($hex, 2, 2)), hexdec(substr($hex, 4, 2))];
        $mix = function (float $t) use ($rgb) {
            return sprintf('#%02x%02x%02x',
                (int) round($rgb[0] + (255 - $rgb[0]) * $t),
                (int) round($rgb[1] + (255 - $rgb[1]) * $t),
                (int) round($rgb[2] + (255 - $rgb[2]) * $t));
        };
        $brandColor = '#' . $hex;
        $tint = $mix(0.93);
        $tintStrong = $mix(0.82);
        $line = $mix(0.70);
        $companyName = 'شركة المخازن الاقتصادية';
    @endphp
    <style>
        body {
            font-family: 'dejavusans', sans-serif;
            direction: rtl;
            text-align: right;
            color: #1f1f2e;
            font-size: 11px;
        }
        table { border-collapse: collapse; }
        .w100 { width: 100%; }
        .header-line { border-bottom: 2px solid {{ $tintStrong }}; }
        .company { font-size: 20px; font-weight: bold; color: #1f1f2e; }
        .subtitle { font-size: 14px; font-weight: bold; color: {{ $brandColor }}; }
        .meta { font-size: 11px; color: #555566; }
        .order-no { font-size: 14px; font-weight: bold; color: {{ $brandColor }}; }
        .logo {
            text-align: center;
            width: 75px;
        }
        .logo img {
            width: 75px;
            height: auto;
        }
        .card { background-color: {{ $tint }}; border: 1px solid {{ $tintStrong }}; }
        .card td { padding: 5px 12px; font-size: 12px; }
        .lbl { font-weight: bold; color: #1f1f2e; }
        .items th {
            background-color: {{ $brandColor }};
            color: #ffffff;
            padding: 8px 5px;
            font-size: 11px;
            text-align: center;
            border: 1px solid {{ $brandColor }};
        }
        .items td {
            border: 1px solid {{ $line }};
            padding: 7px 5px;
            text-align: center;
            font-size: 11px;
        }
        .items tr.alt td { background-color: {{ $tint }}; }
        .items tr.total td { background-color: {{ $tintStrong }}; font-weight: bold; }
        .totals { background-color: {{ $tint }}; border: 1px solid {{ $tintStrong }}; }
        .totals td { padding: 6px 12px; font-size: 12px; }
        .totals .final td { font-size: 14px; font-weight: bold; color: {{ $brandColor }}; border-top: 1px solid {{ $line }}; }
        .footer { font-size: 10px; color: #777788; text-align: center; border-top: 1px solid {{ $tintStrong }}; padding-top: 8px; }
        .num { font-family: 'dejavusans', sans-serif; direction: ltr; unicode-bidi: embed; }
    </style>
</head>
<body>

{{-- ===== الرأس: الشعار + اسم الشركة + رقم الطلب والتاريخ ===== --}}
<table class="w100 header-line" cellpadding="0" cellspacing="0">
    <tr>
        <td style="width: 70%; vertical-align: top; padding-bottom: 12px;">
            <div class="company">{{ $companyName }}</div>
            <div class="subtitle">طلبية عميل — {{ $branch->name ?? '' }}</div>
            <div class="order-no">رقم الطلب: <span class="num">{{ $order->order_number }}</span></div>
        </td>
        <td style="width: 30%; vertical-align: top; padding-bottom: 12px;" align="left">
            <table cellpadding="0" cellspacing="0" style="margin-bottom: 6px;" align="left">
                <tr><td class="logo"><img src="{{ public_path('images/logo.png') }}" alt="شعار شركة المخازن الاقتصادية" /></td></tr>
            </table>
        </td>
    </tr>
    <tr>
        <td colspan="2" class="meta" style="padding-bottom: 10px;">
            التاريخ: <span class="num">{{ $order->created_at->format('Y/m/d') }}</span>م
            &nbsp;&nbsp;|&nbsp;&nbsp;
            الوقت: <span class="num">{{ $order->created_at->format('h:i A') }}</span>
        </td>
    </tr>
</table>

<div style="height: 12px;"></div>

{{-- ===== بيانات العميل ===== --}}
<table class="w100 card" cellpadding="0" cellspacing="0">
    <tr>
        <td style="width: 50%;"><span class="lbl">اسم العميل:</span> {{ $merchant->company_name ?? $order->user->name }}</td>
        <td style="width: 50%;"><span class="lbl">رقم الجوال:</span> <span class="num">{{ $order->user->phone }}</span></td>
    </tr>
    <tr>
        <td><span class="lbl">السجل التجاري:</span> <span class="num">{{ $merchant->cr_number ?? '—' }}</span></td>
        <td><span class="lbl">الرقم الضريبي:</span> <span class="num">{{ $merchant->vat_number ?? '—' }}</span></td>
    </tr>
    <tr>
        <td><span class="lbl">المستودع:</span> {{ $branch->name ?? '—' }}</td>
        <td><span class="lbl">المدينة:</span> {{ $merchant->city ?? '—' }}</td>
    </tr>
    @if($merchant?->customer_code)
    <tr>
        <td colspan="2"><span class="lbl">كود العميل:</span> <span class="num">{{ $merchant->customer_code }}</span></td>
    </tr>
    @endif
</table>

<div style="height: 14px;"></div>

{{-- ===== جدول الأصناف ===== --}}
<table class="w100 items" cellpadding="0" cellspacing="0">
    <thead>
        <tr>
            <th style="width: 5%;">م</th>
            <th style="width: 14%;">رقم الصنف</th>
            <th style="width: 20%;">رقم الباركود</th>
            <th style="width: 27%;">اسم الصنف</th>
            <th style="width: 8%;">الوحدة</th>
            <th style="width: 8%;">الكمية</th>
            <th style="width: 9%;">السعر</th>
            <th style="width: 9%;">الإجمالي</th>
        </tr>
    </thead>
    <tbody>
        @foreach($order->items as $index => $item)
        <tr class="{{ $index % 2 === 1 ? 'alt' : '' }}">
            <td><span class="num">{{ $index + 1 }}</span></td>
            <td><strong><span class="num">{{ $item->product_code }}</span></strong></td>
            <td><span class="num">{{ $item->barcode ?? '—' }}</span></td>
            <td style="text-align: right;">{{ $item->product_name }}</td>
            <td>{{ $item->unit }}</td>
            <td><strong><span class="num">{{ $item->quantity }}</span></strong></td>
            <td><span class="num">{{ number_format($item->unit_price, 2) }}</span></td>
            <td><span class="num">{{ number_format($item->line_total, 2) }}</span></td>
        </tr>
        @endforeach
        <tr class="total">
            <td colspan="5" style="text-align: left;">إجمالي القطع</td>
            <td><span class="num">{{ $order->total_quantity }}</span></td>
            <td colspan="2"></td>
        </tr>
    </tbody>
</table>

<div style="height: 14px;"></div>

{{-- ===== الإجماليات ===== --}}
<table class="w100" cellpadding="0" cellspacing="0">
    <tr>
        <td style="width: 55%;"></td>
        <td style="width: 45%;">
            <table class="w100 totals" cellpadding="0" cellspacing="0">
                <tr>
                    <td>الإجمالي قبل الضريبة:</td>
                    <td align="left"><strong><span class="num">{{ number_format($order->subtotal, 2) }}</span> ر.س</strong></td>
                </tr>
                <tr>
                    <td>ضريبة القيمة المضافة (<span class="num">{{ rtrim(rtrim(number_format($order->vat_rate, 2), '0'), '.') }}%</span>):</td>
                    <td align="left"><strong><span class="num">{{ number_format($order->vat_amount, 2) }}</span> ر.س</strong></td>
                </tr>
                <tr class="final">
                    <td>الصافي شامل الضريبة:</td>
                    <td align="left"><span class="num">{{ number_format($order->total, 2) }}</span> ر.س</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

@if($order->notes)
<div style="height: 10px;"></div>
<table class="w100 card" cellpadding="0" cellspacing="0">
    <tr><td><span class="lbl">ملاحظات:</span> {{ $order->notes }}</td></tr>
</table>
@endif

<div style="height: 26px;"></div>
<div class="footer">
    {{ $companyName }} — منصة توريد الجملة B2B &nbsp;|&nbsp; شكراً لتعاملكم معنا
</div>

</body>
</html>
