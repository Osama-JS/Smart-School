@php
    $appName = 'مدارس القيم الأهلية';
    $supportEmail = 'alqiamcivil@gmail.com';
    $effectiveDate = '2026-10-22';
    $sections = [
        'intro'       => 'مقدمة ونطاق السياسة',
        'users'       => 'فئات المستخدمين',
        'data'        => 'البيانات التي نجمعها',
        'permissions' => 'أذونات الجهاز الحساسة',
        'kids'        => 'خصوصية الطلاب والأطفال',
        'usage'       => 'أغراض استخدام البيانات',
        'sharing'     => 'مشاركة البيانات',
        'security'    => 'أمن البيانات',
        'account-deletion' => 'حذف الحساب والبيانات',
        'rights'      => 'حقوق المستخدم والتحديثات',
        'contact'     => 'التواصل معنا',
    ];
@endphp
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>سياسة الخصوصية | {{ $appName }}</title>
    <meta name="description" content="سياسة الخصوصية الرسمية لتطبيق {{ $appName }} للهاتف المحمول: البيانات التي نجمعها، أذونات الجهاز، حماية بيانات الطلاب، وحذف الحساب.">
    <meta name="theme-color" content="#325518">
    <link rel="icon" type="image/png" href="{{ asset('images/school_icon.png') }}">
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=tajawal:400,500,700,800,900&display=swap" rel="stylesheet">
    <style>
        :root {
            --p-50:#f0f7eb; --p-100:#dcefd1; --p-200:#b9dfa3; --p-300:#96cf75; --p-400:#7cbf4f;
            --p-500:#6b9b37; --p-600:#558a2a; --p-700:#437020; --p-800:#325518; --p-900:#1e3a0e;
            --a-50:#fef2f2; --a-100:#fee2e2; --a-200:#fecaca; --a-500:#cc2b2b; --a-700:#991b1b;
            --d-50:#f8f9fa; --d-100:#e9ecef; --d-200:#dee2e6; --d-300:#ced4da; --d-400:#adb5bd;
            --d-500:#6c757d; --d-600:#495057; --d-700:#343a40; --d-800:#212529; --d-900:#0f1419;
            --radius: 18px;
            --shadow-sm: 0 1px 2px rgba(15,20,25,.04), 0 2px 8px rgba(15,20,25,.04);
            --shadow-md: 0 10px 30px rgba(15,20,25,.08);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html {
            scroll-behavior: smooth;
            scroll-padding-top: 90px;
            overflow-x: hidden;
            width: 100%;
        }

        body {
            font-family: 'Tajawal', 'Segoe UI', Tahoma, sans-serif;
            background: #f4f6f1;
            color: var(--d-700);
            line-height: 1.85;
            font-size: 16px;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
            width: 100%;
            position: relative;
        }

        a { color: var(--p-700); text-decoration: none; }
        .ltr { direction: ltr; unicode-bidi: embed; display: inline-block; word-break: break-all; }

        /* ===== Progress bar ===== */
        .progress {
            position: fixed; inset: 0 0 auto 0; height: 3px; z-index: 60;
            background: linear-gradient(90deg, var(--a-500), var(--p-400));
            transform-origin: right; transform: scaleX(0);
        }

        /* ===== Top bar ===== */
        .topbar {
            position: sticky; top: 0; z-index: 50;
            background: rgba(255,255,255,.82);
            backdrop-filter: saturate(180%) blur(14px);
            border-bottom: 1px solid rgba(15,20,25,.06);
        }
        .topbar-inner {
            max-width: 1200px; margin: 0 auto; padding: 12px 24px;
            display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .brand { display: flex; align-items: center; gap: 12px; color: var(--d-900); }
        .brand img { width: 42px; height: 42px; object-fit: contain; border-radius: 12px; background: #fff; padding: 4px; box-shadow: var(--shadow-sm); }
        .brand-name { font-weight: 800; font-size: 17px; line-height: 1.2; }
        .brand-sub { font-size: 12px; color: var(--d-500); }
        .top-actions { display: flex; gap: 8px; }

        .btn {
            display: inline-flex; align-items: center; gap: 8px;
            font-family: inherit; font-size: 14px; font-weight: 700;
            padding: 10px 18px; border-radius: 12px; border: 1px solid transparent;
            cursor: pointer; transition: all .2s ease; white-space: nowrap;
        }
        .btn svg { width: 18px; height: 18px; }
        .btn-primary {
            background: linear-gradient(135deg, var(--p-500), var(--p-700));
            color: #fff; box-shadow: 0 6px 18px rgba(107,155,55,.35);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(107,155,55,.45); }
        .btn-light { background: #fff; color: var(--d-700); border-color: var(--d-200); }
        .btn-light:hover { border-color: var(--p-300); color: var(--p-700); background: var(--p-50); }

        /* ===== Hero ===== */
        .hero {
            position: relative; overflow: hidden; color: #fff;
            background:
                radial-gradient(circle at 15% 25%, rgba(124,191,79,.40) 0, transparent 42%),
                radial-gradient(circle at 85% 120%, rgba(204,43,43,.22) 0, transparent 40%),
                linear-gradient(135deg, var(--p-900) 0%, var(--p-800) 50%, var(--p-600) 100%);
        }
        .hero::before, .hero::after {
            content: ""; position: absolute; border-radius: 50%;
            border: 50px solid rgba(255,255,255,.045);
        }
        .hero::before { width: 380px; height: 380px; left: -120px; top: -140px; }
        .hero::after  { width: 260px; height: 260px; right: 8%; bottom: -170px; }
        .hero-inner {
            position: relative; z-index: 1;
            max-width: 1200px; margin: 0 auto; padding: 64px 24px 110px;
        }
        .eyebrow {
            display: inline-flex; align-items: center; gap: 8px;
            font-size: 13px; font-weight: 700;
            background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
            padding: 6px 14px; border-radius: 999px;
        }
        .eyebrow .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--p-300); box-shadow: 0 0 0 4px rgba(150,207,117,.25); }
        .hero h1 { font-size: clamp(30px, 4.6vw, 48px); font-weight: 900; line-height: 1.25; margin: 18px 0 12px; }
        .hero p.lead { font-size: 18px; color: var(--p-100); max-width: 640px; }
        .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; }
        .chip {
            font-size: 13px; font-weight: 600;
            background: rgba(15,20,25,.25); border: 1px solid rgba(255,255,255,.14);
            padding: 6px 14px; border-radius: 10px;
        }
        .chip b { color: var(--p-200); font-weight: 800; }
        .hero-stripe { position: absolute; inset: auto 0 0 0; height: 5px; background: linear-gradient(90deg, var(--a-500) 0 20%, var(--p-400) 20% 100%); z-index: 2; }

        /* ===== Highlights ===== */
        .highlights {
            position: relative; z-index: 3;
            max-width: 1200px; margin: -68px auto 0; padding: 0 24px;
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
        }
        .hl {
            background: #fff; border-radius: var(--radius); padding: 22px 20px;
            box-shadow: var(--shadow-md); border: 1px solid rgba(15,20,25,.04);
            transition: transform .25s ease, box-shadow .25s ease;
        }
        .hl:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(15,20,25,.12); }
        .hl-icon {
            width: 46px; height: 46px; border-radius: 14px; margin-bottom: 12px;
            display: flex; align-items: center; justify-content: center;
            background: var(--p-50); color: var(--p-600); border: 1px solid var(--p-100);
        }
        .hl-icon svg { width: 22px; height: 22px; }
        .hl h3 { font-size: 16px; font-weight: 800; color: var(--d-900); }
        .hl p { font-size: 13.5px; color: var(--d-500); line-height: 1.6; }

        /* ===== Layout ===== */
        .layout {
            max-width: 1200px; margin: 40px auto 0; padding: 0 24px;
            display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 32px; align-items: start;
        }
        .layout > * { min-width: 0; }

        /* TOC */
        .toc {
            position: sticky; top: 92px;
            background: #fff; border-radius: var(--radius); padding: 20px 14px;
            box-shadow: var(--shadow-sm); border: 1px solid rgba(15,20,25,.05);
        }
        .toc-title { font-size: 13px; font-weight: 800; color: var(--d-500); padding: 0 10px 10px; letter-spacing: .3px; }
        .toc ol { list-style: none; counter-reset: t; }
        .toc a {
            counter-increment: t;
            display: flex; align-items: center; gap: 10px;
            padding: 8px 10px; border-radius: 10px;
            font-size: 14px; font-weight: 600; color: var(--d-600);
            transition: all .2s ease;
        }
        .toc a::before {
            content: counter(t);
            flex-shrink: 0; width: 24px; height: 24px; border-radius: 7px;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 800;
            background: var(--d-100); color: var(--d-500); transition: all .2s ease;
        }
        .toc a:hover { background: var(--p-50); color: var(--p-700); }
        .toc a.active { background: var(--p-50); color: var(--p-800); }
        .toc a.active::before { background: var(--p-500); color: #fff; }
        .toc-extra { border-top: 1px dashed var(--d-200); margin-top: 12px; padding-top: 12px; }
        .toc-extra a::before { content: "EN"; font-size: 10px; }

        /* Sections */
        .sec {
            background: #fff; border-radius: var(--radius); padding: 30px 32px;
            margin-bottom: 18px; box-shadow: var(--shadow-sm);
            border: 1px solid rgba(15,20,25,.05);
            min-width: 0; max-width: 100%;
        }
        .layout main { min-width: 0; max-width: 100%; }
        .sec-head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .sec-num {
            flex-shrink: 0; width: 40px; height: 40px; border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, var(--p-500), var(--p-700));
            color: #fff; font-weight: 900; font-size: 16px;
            box-shadow: 0 6px 14px rgba(107,155,55,.3);
        }
        .sec h2 { font-size: 22px; font-weight: 800; color: var(--d-900); line-height: 1.35; }
        .sec p { margin-bottom: 12px; color: var(--d-600); word-break: break-word; }
        .sec strong { color: var(--d-900); }

        ul.list { list-style: none; margin: 6px 0 12px; }
        ul.list li { position: relative; padding-right: 30px; margin-bottom: 10px; color: var(--d-600); word-break: break-word; }
        ul.list li::before {
            content: ""; position: absolute; right: 0; top: 6px;
            width: 20px; height: 20px; border-radius: 6px;
            background: var(--p-50) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23558a2a' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12l5 5L20 7'/%3E%3C/svg%3E") center/12px no-repeat;
            border: 1px solid var(--p-100);
        }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .card {
            border: 1px solid var(--d-100); background: var(--d-50);
            border-radius: 14px; padding: 16px 18px; transition: all .2s ease;
        }
        .card:hover { border-color: var(--p-200); background: var(--p-50); }
        .card h3 { font-size: 16px; font-weight: 800; color: var(--p-700); margin-bottom: 2px; }
        .card p { font-size: 14.5px; margin: 0; }

        .note { border-radius: 14px; padding: 16px 20px; margin: 14px 0; border: 1px solid; word-break: break-word; }
        .note-title { display: block; font-weight: 800; margin-bottom: 4px; }
        .note-green { background: var(--p-50); border-color: var(--p-200); color: var(--p-900); }
        .note-red { background: var(--a-50); border-color: var(--a-200); color: var(--a-700); border-right: 5px solid var(--a-500); }

        /* Table */
        .table-wrap {
            overflow-x: auto;
            max-width: 100%;
            width: 100%;
            border: 1px solid var(--d-200);
            border-radius: 14px;
            margin-top: 6px;
            -webkit-overflow-scrolling: touch;
        }
        table { width: 100%; border-collapse: collapse; font-size: 14.5px; min-width: 580px; }
        th { background: var(--p-700); color: #fff; font-weight: 700; text-align: right; padding: 12px 16px; }
        td { padding: 14px 16px; vertical-align: top; border-top: 1px solid var(--d-100); color: var(--d-600); }
        tr:nth-child(even) td { background: var(--d-50); }
        .perm { font-weight: 800; color: var(--d-900); display: block; }
        .code { display: inline-block; direction: ltr; font-family: Consolas, monospace; font-size: 11.5px; background: var(--d-100); color: var(--d-600); padding: 2px 8px; border-radius: 6px; margin-top: 4px; }
        .tag { display: inline-block; font-size: 12.5px; font-weight: 700; padding: 4px 10px; border-radius: 8px; white-space: nowrap; }
        .tag-red { background: var(--a-100); color: var(--a-700); }
        .tag-green { background: var(--p-100); color: var(--p-800); }
        .tag-grey { background: var(--d-100); color: var(--d-600); }

        ol.steps { list-style: none; counter-reset: s; margin-top: 8px; }
        ol.steps li { counter-increment: s; position: relative; padding-right: 36px; margin-bottom: 10px; }
        ol.steps li::before {
            content: counter(s); position: absolute; right: 0; top: 2px;
            width: 26px; height: 26px; border-radius: 50%;
            background: var(--a-500); color: #fff; font-size: 13px; font-weight: 800;
            display: flex; align-items: center; justify-content: center;
        }

        .contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .contact-card {
            display: flex; flex-direction: column; gap: 4px;
            border: 1px solid var(--d-100); border-radius: 14px; padding: 18px;
            background: linear-gradient(180deg, #fff, var(--d-50)); color: var(--d-700);
            transition: all .2s ease;
        }
        .contact-card:hover { border-color: var(--p-300); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
        .contact-card .lbl { font-size: 13px; color: var(--d-500); font-weight: 600; }
        .contact-card .val { font-weight: 800; color: var(--p-700); word-break: break-all; }

        /* English */
        .en { direction: ltr; text-align: left; }
        .en ul.list li { padding-right: 0; padding-left: 30px; }
        .en ul.list li::before { right: auto; left: 0; }
        .en-badge { display: inline-block; font-size: 12px; font-weight: 800; color: var(--a-700); background: var(--a-50); border: 1px solid var(--a-200); border-radius: 8px; padding: 2px 10px; margin-bottom: 10px; }

        /* Download banner */
        .cta {
            position: relative; overflow: hidden;
            background: linear-gradient(135deg, var(--d-900), var(--d-800));
            color: #fff; border-radius: var(--radius); padding: 28px 32px; margin-bottom: 18px;
            display: flex; align-items: center; justify-content: space-between; gap: 20px;
            border-right: 5px solid var(--p-500);
        }
        .cta h3 { font-size: 20px; font-weight: 800; }
        .cta p { color: var(--d-400); font-size: 14.5px; margin: 0; }

        /* Footer */
        .footer { margin-top: 48px; background: var(--d-900); color: var(--d-400); font-size: 14px; }
        .footer-inner { max-width: 1200px; margin: 0 auto; padding: 24px; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .footer b { color: var(--p-400); }
        .footer a { color: var(--d-300); }
        .footer a:hover { color: var(--p-300); }

        /* Back to top */
        .to-top {
            position: fixed; left: 22px; bottom: 22px; z-index: 40;
            width: 46px; height: 46px; border-radius: 14px; border: none; cursor: pointer;
            background: var(--p-600); color: #fff; box-shadow: 0 8px 20px rgba(85,138,42,.4);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transform: translateY(12px); pointer-events: none; transition: all .25s ease;
        }
        .to-top.show { opacity: 1; transform: none; pointer-events: auto; }
        .to-top svg { width: 20px; height: 20px; }

        /* Reveal */
        .reveal { opacity: 0; transform: translateY(14px); transition: opacity .5s ease, transform .5s ease; }
        .reveal.in { opacity: 1; transform: none; }

        @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
            .reveal { opacity: 1; transform: none; transition: none; }
        }

        /* Responsive */
        @media (max-width: 1000px) {
            .layout { grid-template-columns: minmax(0, 1fr); }
            .toc { position: static; }
            .toc ol { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
            .highlights { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
            body { font-size: 15px; }
            .hero::before, .hero::after { display: none !important; }
            .brand-sub, .btn .txt-long { display: none; }
            .topbar-inner { padding: 10px 14px; }
            .btn { padding: 7px 12px; font-size: 13px; }
            .hero-inner { padding: 36px 16px 85px; }
            .hero h1 { font-size: 26px; }
            .hero p.lead { font-size: 15px; }
            .chips { gap: 6px; }
            .chip { font-size: 11.5px; padding: 4px 10px; }
            .highlights, .layout { padding: 0 12px; }
            .highlights { grid-template-columns: 1fr; gap: 8px; margin-top: -55px; }
            .hl { padding: 14px 14px; }
            .sec { padding: 20px 16px; border-radius: 14px; }
            .sec h2 { font-size: 18px; }
            .sec-num { width: 32px; height: 32px; font-size: 14px; border-radius: 8px; }
            .grid-2, .contact-grid, .toc ol { grid-template-columns: 1fr; }
            .cta { flex-direction: column; align-items: flex-start; padding: 20px 16px; }
            .to-top { left: 14px; bottom: 14px; width: 40px; height: 40px; }
        }

        @media print {
            .topbar, .toc, .to-top, .progress, .cta, .top-actions { display: none !important; }
            body { background: #fff; }
            .layout { display: block; margin-top: 20px; }
            .highlights { margin-top: 20px; }
            .sec, .hl { box-shadow: none; break-inside: avoid; }
            .reveal { opacity: 1; transform: none; }
            html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>

    <div class="progress" id="progress"></div>

    <!-- ===== Top bar ===== -->
    <header class="topbar">
        <div class="topbar-inner">
            <a href="{{ url('/') }}" class="brand" id="brand-link">
                <img src="{{ asset('images/school_logo.png') }}" alt="شعار {{ $appName }}">
                <div>
                    <div class="brand-name">{{ $appName }}</div>
                    <div class="brand-sub">نظام الإدارة المدرسية الذكي</div>
                </div>
            </a>
            <div class="top-actions">
                <a href="{{ url('/privacy-policy-print') }}" target="_blank" class="btn btn-light" id="btn-print-version">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="7"/></svg>
                    <span class="txt-long">نسخة الطباعة</span>
                </a>
                <a href="{{ asset('Smart_School_Privacy_Policy.pdf') }}" download class="btn btn-primary" id="btn-download-pdf">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>
                    <span>تحميل PDF</span>
                </a>
            </div>
        </div>
    </header>

    <!-- ===== Hero ===== -->
    <section class="hero">
        <div class="hero-inner">
            <span class="eyebrow"><span class="dot"></span> وثيقة رسمية • تطبيق الهاتف المحمول</span>
            <h1>سياسة الخصوصية<br>وحماية البيانات</h1>
            <p class="lead">نوضح هنا بشفافية ما البيانات التي يجمعها تطبيق {{ $appName }}، ولماذا نجمعها، وكيف نحميها، وما حقوقك تجاهها.</p>
            <div class="chips">
                <span class="chip">الإصدار <b>1.0</b></span>
                <span class="chip">تاريخ السريان <b>{{ $effectiveDate }}</b></span>
                <span class="chip">المنصات <b>Android • iOS</b></span>
                <span class="chip">متوافقة مع <b>Google Play • App Store</b></span>
            </div>
        </div>
        <div class="hero-stripe"></div>
    </section>

    <!-- ===== Highlights ===== -->
    <div class="highlights">
        <div class="hl reveal">
            <div class="hl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg></div>
            <h3>بدون إعلانات</h3>
            <p>بيئة تعليمية خالية من الإعلانات والمتتبعات.</p>
        </div>
        <div class="hl reveal">
            <div class="hl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg></div>
            <h3>لا بيع للبيانات</h3>
            <p>لا نبيع ولا نؤجر بياناتك لأي طرف.</p>
        </div>
        <div class="hl reveal">
            <div class="hl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg></div>
            <h3>اتصال مشفّر</h3>
            <p>جميع البيانات تنتقل عبر HTTPS / TLS.</p>
        </div>
        <div class="hl reveal">
            <div class="hl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></div>
            <h3>حذف الحساب</h3>
            <p>يحق لك طلب حذف حسابك في أي وقت.</p>
        </div>
    </div>

    <!-- ===== Layout ===== -->
    <div class="layout">

        <aside>
            <nav class="toc" aria-label="فهرس المحتويات">
                <div class="toc-title">محتويات الوثيقة</div>
                <ol>
                    @foreach ($sections as $id => $title)
                        <li><a href="#{{ $id }}" data-toc="{{ $id }}">{{ $title }}</a></li>
                    @endforeach
                </ol>
                <div class="toc-extra">
                    <a href="#english-summary" data-toc="english-summary">English Summary</a>
                </div>
            </nav>
        </aside>

        <main>

            <!-- 1 -->
            <section class="sec reveal" id="intro">
                <div class="sec-head"><span class="sec-num">1</span><h2>مقدمة ونطاق السياسة</h2></div>
                <p>
                    توضح هذه الوثيقة كيف تجمع إدارة نظام <strong>{{ $appName }}</strong> («التطبيق»، «نحن») البيانات الشخصية والأكاديمية لمستخدمي تطبيق الهاتف المحمول، وكيف تستخدمها وتحميها.
                    أُعدّت السياسة بما يتوافق مع سياسات متجر Google Play (بما فيها سياسة العائلات)، وإرشادات Apple App Store، ومبادئ حماية خصوصية الأطفال المعتمدة.
                </p>
                <div class="note note-green">
                    <span class="note-title">إقرار عام</span>
                    التطبيق أداة تعليمية وإدارية خاصة بالمؤسسة التعليمية، ولا يُستخدم لأي غرض تجاري أو إعلاني.
                </div>
            </section>

            <!-- 2 -->
            <section class="sec reveal" id="users">
                <div class="sec-head"><span class="sec-num">2</span><h2>فئات المستخدمين</h2></div>
                <div class="grid-2">
                    <div class="card"><h3>أولياء الأمور</h3><p>متابعة الحضور والغياب، الدرجات، السلوك، الواجبات، والرسوم المدرسية للأبناء.</p></div>
                    <div class="card"><h3>الطلاب</h3><p>الاطلاع على الجدول الدراسي، الواجبات، والنتائج.</p></div>
                    <div class="card"><h3>المعلمون</h3><p>رصد الحضور الصفي، إدخال الدرجات، وتحضير الدروس.</p></div>
                    <div class="card"><h3>الموظفون الإداريون</h3><p>تسجيل الحضور والانصراف ومتابعة الطلبات والمهام الإدارية.</p></div>
                </div>
            </section>

            <!-- 3 -->
            <section class="sec reveal" id="data">
                <div class="sec-head"><span class="sec-num">3</span><h2>البيانات التي نجمعها</h2></div>
                <ul class="list">
                    <li><strong>بيانات الحساب:</strong> الاسم، اسم المستخدم، البريد الإلكتروني، رقم الهاتف، وصلة القرابة بين ولي الأمر والطالب.</li>
                    <li><strong>البيانات الأكاديمية:</strong> الحضور والغياب، الدرجات والتقييمات، الملاحظات السلوكية والإنجازات، والجداول الدراسية.</li>
                    <li><strong>البيانات المالية:</strong> عرض الرسوم المستحقة والمدفوعة فقط، دون جمع أو تخزين أي بيانات بطاقات بنكية.</li>
                    <li><strong>البيانات التقنية:</strong> رمز الإشعارات (FCM Token)، نوع الجهاز وإصدار نظام التشغيل، وسجلات الأخطاء لتحسين الاستقرار.</li>
                </ul>
                <p>تُحفظ كلمات المرور مشفّرة بتشفير أحادي الاتجاه (Bcrypt) ولا يمكن لأي شخص الاطلاع عليها.</p>
            </section>

            <!-- 4 -->
            <section class="sec reveal" id="permissions">
                <div class="sec-head"><span class="sec-num">4</span><h2>أذونات الجهاز الحساسة</h2></div>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr><th style="width:27%">الإذن</th><th style="width:22%">من يُطلب منه</th><th>الغرض والضوابط</th></tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="perm">الموقع الجغرافي الدقيق</span><span class="code">ACCESS_FINE_LOCATION</span></td>
                                <td><span class="tag tag-red">الموظفون والمعلمون فقط</span></td>
                                <td>يُستخدم لحظياً عند الضغط على «تسجيل الحضور» أو «الانصراف» للتحقق من التواجد داخل نطاق المدرسة. <strong>لا يُجمع في الخلفية، ولا يُتتبّع خط السير، ولا يُطلب من الطلاب أو أولياء الأمور.</strong></td>
                            </tr>
                            <tr>
                                <td><span class="perm">الإشعارات</span><span class="code">POST_NOTIFICATIONS</span></td>
                                <td><span class="tag tag-green">جميع المستخدمين</span></td>
                                <td>تنبيهات الغياب، الدرجات الجديدة، والتعاميم المدرسية. يمكن إيقافها من إعدادات الجهاز.</td>
                            </tr>
                            <tr>
                                <td><span class="perm">الكاميرا والصور</span><span class="code">CAMERA / READ_MEDIA</span></td>
                                <td><span class="tag tag-grey">اختياري</span></td>
                                <td>فقط عندما يختار المستخدم رفع مرفق (عذر طبي، واجب، صورة شخصية). لا وصول للمعرض دون اختيار مباشر.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- 5 -->
            <section class="sec reveal" id="kids">
                <div class="sec-head"><span class="sec-num">5</span><h2>خصوصية الطلاب والأطفال</h2></div>
                <ul class="list">
                    <li>تُنشأ حسابات الطلاب من قِبل إدارة المدرسة وبموافقة ولي الأمر عند التسجيل.</li>
                    <li>لا توجد إعلانات، ولا ملفات استهداف سلوكي، ولا روابط لشبكات خارجية غير تعليمية.</li>
                    <li>التواصل محصور داخل المجتمع المدرسي المعتمد (ولي الأمر، المعلم، الإدارة).</li>
                </ul>
            </section>

            <!-- 6 -->
            <section class="sec reveal" id="usage">
                <div class="sec-head"><span class="sec-num">6</span><h2>أغراض استخدام البيانات</h2></div>
                <ul class="list">
                    <li>تمكين أولياء الأمور من متابعة المستوى الدراسي والسلوكي والمالي لأبنائهم.</li>
                    <li>إدارة الحصص والحضور الصفي والدرجات والشهادات.</li>
                    <li>التحقق من حضور الموظفين وانصرافهم.</li>
                    <li>إرسال الإشعارات والتنبيهات المدرسية.</li>
                    <li>حماية الحسابات وتحسين أداء النظام واستقراره.</li>
                </ul>
            </section>

            <!-- 7 -->
            <section class="sec reveal" id="sharing">
                <div class="sec-head"><span class="sec-num">7</span><h2>مشاركة البيانات</h2></div>
                <p>لا نبيع بيانات المستخدمين ولا نؤجرها ولا نتاجر بها. تقتصر المشاركة على:</p>
                <ul class="list">
                    <li><strong>Google Firebase Cloud Messaging:</strong> لإيصال الإشعارات إلى الأجهزة.</li>
                    <li><strong>مزوّد الاستضافة:</strong> خوادم محمية لتخزين بيانات النظام.</li>
                    <li><strong>الجهات الرسمية:</strong> عند وجود طلب قانوني ملزم فقط.</li>
                </ul>
            </section>

            <!-- 8 -->
            <section class="sec reveal" id="security">
                <div class="sec-head"><span class="sec-num">8</span><h2>أمن البيانات</h2></div>
                <div class="grid-2">
                    <div class="card"><h3>تشفير الاتصال</h3><p>جميع الطلبات عبر HTTPS / TLS.</p></div>
                    <div class="card"><h3>صلاحيات حسب الدور</h3><p>كل مستخدم يرى ما يخصه فقط (RBAC).</p></div>
                    <div class="card"><h3>جلسات آمنة</h3><p>رموز دخول مؤمّنة قابلة للإلغاء (Sanctum).</p></div>
                    <div class="card"><h3>نسخ احتياطي</h3><p>نسخ دورية لحماية البيانات من الفقدان.</p></div>
                </div>
            </section>

            <!-- 9 -->
            <section class="sec reveal" id="account-deletion">
                <div class="sec-head"><span class="sec-num">9</span><h2>حذف الحساب والبيانات</h2></div>
                <div class="note note-red">
                    <span class="note-title">كيف تطلب حذف حسابك؟</span>
                    <ol class="steps">
                        <li>من داخل التطبيق: <strong>الملف الشخصي ← الإعدادات ← طلب حذف الحساب</strong>.</li>
                        <li>أو عبر هذه الصفحة: <a href="{{ route('account.deletion') }}" class="ltr">{{ route('account.deletion') }}</a></li>
                        <li>أو بمراسلة الدعم: <a href="mailto:{{ $supportEmail }}" class="ltr">{{ $supportEmail }}</a> مع ذكر اسم المستخدم ورقم الهاتف.</li>
                    </ol>
                </div>
                <p>عند تنفيذ الطلب يُعطَّل الحساب وتُحذف بيانات الدخول ورموز الأجهزة. أما السجلات الأكاديمية والمالية الرسمية فيُحتفظ بها وفق الأنظمة التعليمية المعمول بها.</p>
            </section>

            <!-- 10 -->
            <section class="sec reveal" id="rights">
                <div class="sec-head"><span class="sec-num">10</span><h2>حقوق المستخدم والتحديثات</h2></div>
                <ul class="list">
                    <li>الاطلاع على بياناتك وطلب تصحيح أي بيانات غير دقيقة عبر إدارة المدرسة.</li>
                    <li>سحب الأذونات الاختيارية (الموقع، الكاميرا، الإشعارات) من إعدادات الجهاز في أي وقت.</li>
                    <li>عند أي تعديل جوهري على هذه السياسة سنُعلمك داخل التطبيق ونحدّث تاريخ السريان.</li>
                </ul>
            </section>

            <!-- 11 -->
            <section class="sec reveal" id="contact">
                <div class="sec-head"><span class="sec-num">11</span><h2>التواصل معنا</h2></div>
                <div class="contact-grid">
                    <a class="contact-card" href="mailto:{{ $supportEmail }}" id="contact-email">
                        <span class="lbl">البريد الإلكتروني</span>
                        <span class="val ltr">{{ $supportEmail }}</span>
                    </a>
                    <a class="contact-card" href="{{ route('privacy.policy') }}" id="contact-policy">
                        <span class="lbl">رابط السياسة</span>
                        <span class="val ltr">{{ route('privacy.policy') }}</span>
                    </a>
                    <div class="contact-card">
                        <span class="lbl">الجهة المشغّلة</span>
                        <span class="val">إدارة نظام {{ $appName }}</span>
                    </div>
                </div>
            </section>

            <!-- Download CTA -->
            <div class="cta reveal">
                <div>
                    <h3>تحتاج نسخة رسمية؟</h3>
                    <p>حمّل الوثيقة بصيغة PDF جاهزة للطباعة والتوقيع والختم.</p>
                </div>
                <a href="{{ asset('Smart_School_Privacy_Policy.pdf') }}" download class="btn btn-primary" id="btn-download-pdf-cta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>
                    تحميل PDF
                </a>
            </div>

            <!-- English -->
            <section class="sec en reveal" id="english-summary">
                <span class="en-badge">ENGLISH</span>
                <div class="sec-head"><span class="sec-num">EN</span><h2>Summary for App Store Reviewers</h2></div>
                <p>{{ $appName }} is a school management app for parents, students, teachers and staff. It contains no ads, does not sell user data, and all traffic is encrypted over HTTPS.</p>
                <ul class="list">
                    <li><strong>Precise location:</strong> staff and teachers only, used at the moment of attendance check-in/out to verify they are inside the school geofence. Never collected in the background and never requested from students or parents.</li>
                    <li><strong>Notifications:</strong> attendance alerts, grades and school announcements. Can be disabled in device settings.</li>
                    <li><strong>Camera / photos:</strong> optional, only when the user chooses to upload an attachment.</li>
                    <li><strong>Children:</strong> student accounts are created by the school with guardian consent. No ads, behavioural profiling or public social features.</li>
                    <li><strong>Account deletion:</strong> in-app (Profile → Settings → Delete account), at <a href="{{ route('account.deletion') }}">{{ route('account.deletion') }}</a>, or via <a href="mailto:{{ $supportEmail }}">{{ $supportEmail }}</a>.</li>
                </ul>
            </section>

        </main>
    </div>

    <footer class="footer">
        <div class="footer-inner">
            <span>© {{ date('Y') }} <b>{{ $appName }}</b> — جميع الحقوق محفوظة</span>
            <span>
                <a href="#intro">سياسة الخصوصية</a> •
                <a href="#account-deletion">حذف الحساب</a> •
                <a href="mailto:{{ $supportEmail }}">الدعم</a>
            </span>
        </div>
    </footer>

    <button type="button" class="to-top" id="to-top" aria-label="العودة للأعلى">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
    </button>

    <script>
        (function () {
            const progress = document.getElementById('progress');
            const toTop = document.getElementById('to-top');
            const links = document.querySelectorAll('[data-toc]');
            const targets = [...links].map(l => document.getElementById(l.dataset.toc)).filter(Boolean);

            function onScroll() {
                const h = document.documentElement;
                const ratio = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
                progress.style.transform = 'scaleX(' + ratio + ')';
                toTop.classList.toggle('show', h.scrollTop > 600);

                let current = targets[0] && targets[0].id;
                for (const t of targets) {
                    if (t.getBoundingClientRect().top <= 120) current = t.id;
                }
                links.forEach(l => l.classList.toggle('active', l.dataset.toc === current));
            }
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();

            toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

            const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
                entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
            }, { threshold: 0.08 }) : null;
            document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));
        })();
    </script>
</body>
</html>
