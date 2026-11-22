<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>بيانات دخول الطلاب - مدارس القيم الأهلية</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 10mm 16mm 10mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: "Tajawal", "Cairo", "Segoe UI", Tahoma, Arial, sans-serif;
            background: #ffffff;
            color: #1f2937;
            direction: rtl;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .cards-list {
            display: flex;
            flex-direction: column;
            gap: 11px;
        }
        .card {
            position: relative;
            display: flex;
            flex-direction: row;
            align-items: stretch;
            border: 2px solid #5b8a2d;
            border-radius: 16px;
            background: #ffffff;
            padding: 12px 14px 12px 12px;
            min-height: 274px;
            break-inside: avoid;
            page-break-inside: avoid;
            overflow: hidden;
        }
        .card::before {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            width: 5px;
            background: linear-gradient(180deg, #63a22f 0%, #5b8a2d 65%, #dc1420 100%);
        }
        .col-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding-left: 10px;
            padding-right: 6px;
        }
        .info-top {
            display: flex;
            flex-direction: row;
            align-items: stretch;
            gap: 10px;
            border-bottom: 1px dashed #cbe0b5;
            padding-bottom: 8px;
        }
        .info-block {
            flex: 1;
        }
        .cred-panel {
            background: #f5faef;
            border: 1px solid #d5e8c2;
            border-radius: 10px;
            padding: 6px 10px;
        }
        .info-block-divider {
            width: 1.5px;
            background: linear-gradient(180deg, transparent, #63a22f, transparent);
            margin: 2px 0;
        }
        .block-title {
            text-align: center;
            color: #4d7c1f;
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 5px;
        }
        .field-row {
            display: flex;
            align-items: baseline;
            gap: 5px;
            font-size: 11.5px;
            line-height: 1.55;
            margin-bottom: 2px;
        }
        .field-label {
            color: #5b8a2d;
            font-weight: 700;
            white-space: nowrap;
        }
        .field-value {
            color: #111827;
            font-weight: 800;
        }
        .field-value-mono {
            font-family: "Consolas", "Courier New", monospace;
            font-size: 12px;
            letter-spacing: 0.3px;
            direction: ltr;
            unicode-bidi: embed;
            color: #0f172a;
        }
        .badge-missing {
            display: inline-block;
            background: #fef2f2;
            color: #dc1420;
            border: 1px solid #fecaca;
            border-radius: 4px;
            padding: 0 5px;
            font-size: 10px;
            font-weight: 700;
        }
        .notes-section {
            padding-top: 6px;
        }
        .notes-title {
            text-align: center;
            color: #dc1420;
            font-size: 12.5px;
            font-weight: 800;
            margin-bottom: 4px;
        }
        .notes-intro {
            font-size: 10.2px;
            line-height: 1.5;
            color: #1f2937;
            font-weight: 600;
            margin-bottom: 3px;
        }
        .notes-list {
            list-style: none;
            font-size: 9.8px;
            line-height: 1.48;
            color: #374151;
            font-weight: 600;
        }
        .notes-list li {
            margin-bottom: 1.5px;
        }
        .col-qr {
            width: 142px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0 10px;
            border-right: 1px dashed #d5e8c2;
        }
        .qr-frame {
            width: 118px;
            height: 118px;
            border: 2px solid #5b8a2d;
            border-radius: 12px;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            position: relative;
        }
        .qr-box {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .qr-box svg {
            width: 100%;
            height: 100%;
        }
        .store-badge {
            margin-top: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            background: #f5faef;
            border: 1px solid #cbe0b5;
            border-radius: 999px;
            padding: 5px 11px;
            font-size: 10.5px;
            font-weight: 800;
            color: #4d7c1f;
            width: 118px;
        }
        .col-brand {
            width: 134px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding-right: 10px;
            border-right: 1px dashed #d5e8c2;
            text-align: center;
        }
        .logo-wrap {
            width: 62px;
            height: 62px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 4px;
        }
        .logo-wrap img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        .school-name {
            font-size: 14px;
            font-weight: 900;
            color: #4d7c1f;
            line-height: 1.2;
            margin-bottom: 2px;
        }
        .school-tagline {
            font-size: 9px;
            font-weight: 700;
            color: #dc1420;
            margin-bottom: 6px;
        }
        .contact-heading {
            font-size: 9.5px;
            font-weight: 800;
            color: #5b8a2d;
            margin-bottom: 4px;
            border-top: 1px solid #e2efd4;
            padding-top: 4px;
            width: 100%;
        }
        .contact-item {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 5px;
            width: 100%;
            font-size: 9.5px;
            color: #374151;
            font-weight: 700;
            margin-bottom: 4px;
            text-align: right;
            direction: ltr;
        }
        .contact-icon {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            border: 2px dashed #cbe0b5;
            border-radius: 14px;
            color: #4d7c1f;
            font-size: 15px;
            font-weight: 700;
        }
    </style>
</head>
<body>
    @if($cards->isEmpty())
        <div class="empty-state">
            لا توجد بيانات طلاب مطابقة للتصفية الحالية.
        </div>
    @else
        <div class="cards-list">
            @foreach($cards as $card)
                <div class="card">
                    {{-- القسم الأيمن: البيانات الأساسية وبيانات الدخول والتنبيهات --}}
                    <div class="col-info">
                        <div class="info-top">
                            <div class="info-block">
                                <div class="block-title">البيانات الأساسية</div>
                                <div class="field-row">
                                    <span class="field-label">الاسم:</span>
                                    <span class="field-value">{{ $card['name'] }}</span>
                                </div>
                                <div class="field-row">
                                    <span class="field-label">رقم الهاتف:</span>
                                    <span class="field-value field-value-mono">{{ $card['phone'] }}</span>
                                </div>
                                <div class="field-row">
                                    <span class="field-label">الصف / الشعبة:</span>
                                    <span class="field-value">{{ $card['grade_name'] }} - {{ $card['division_name'] }}</span>
                                </div>
                            </div>

                            <div class="info-block-divider"></div>

                            <div class="info-block cred-panel">
                                <div class="block-title">بيانات تسجيل الدخول</div>
                                <div class="field-row">
                                    <span class="field-label">اسم المستخدم:</span>
                                    <span class="field-value field-value-mono">{{ $card['username'] }}</span>
                                </div>
                                <div class="field-row">
                                    <span class="field-label">كلمة المرور:</span>
                                    @if(!empty($card['password']))
                                        <span class="field-value field-value-mono">{{ $card['password'] }}</span>
                                    @else
                                        <span class="badge-missing">غير محفوظة (يلزم إعادة تعيين)</span>
                                    @endif
                                </div>
                            </div>
                        </div>

                        <div class="notes-section">
                            <div class="notes-title">تنبيهات هامة:</div>
                            <div class="notes-intro">
                                تهديكم مدارس القيم الأهلية أرق وأطيب التحايا..<br>
                                لتسهيل التواصل بين المدرسة والبيت نضع بين أيديكم تطبيق (مدرستي الذكية) الإلكتروني ولتفعيله يرجى اتباع التعليمات أدناه:
                            </div>
                            <ul class="notes-list">
                                <li>1- امسح الباركود الذي على ورقة التعليمات أو حمل البرنامج من قوقل بلاي أو أبل ستور باسم مدرستي الذكية.</li>
                                <li>2- ادخل اسم المستخدم وكلمة المرور المكتوبة على الإشعار.</li>
                                <li>- في حال كان هناك خلل في البيانات أعلاه أو واجهت أي مشكلة الرجاء التواصل مع المدرسة.</li>
                                <li>- لا تشارك بيانات الدخول مع أي شخص آخر غير الوالدين.</li>
                                <li>- التطبيق في سوق بلاي باسم (مدرستي الذكية) أو يتم تصوير الكود على اليسار وسيظهر التطبيق.</li>
                                <li>- يمكن تحميل التطبيق في هاتف الأب والأم ليسهل المتابعة.</li>
                            </ul>
                        </div>
                    </div>

                    {{-- القسم الأوسط: رمز QR وشارة تحميل التطبيق --}}
                    <div class="col-qr">
                        <div class="qr-frame">
                            <div class="qr-box" data-qr="{{ $qrTargetUrl }}"></div>
                        </div>
                        <div class="store-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M3 2.5L13.5 12L3 21.5V2.5Z" fill="#63a22f"/>
                                <path d="M13.5 12L17.2 8.6L4.8 1.6C4.1 1.2 3.3 1.5 3 2.5L13.5 12Z" fill="#84b817"/>
                                <path d="M13.5 12L3 21.5C3.3 22.4 4.1 22.8 4.8 22.4L17.2 15.4L13.5 12Z" fill="#dc1420"/>
                                <path d="M21 10.8L17.2 8.6L13.5 12L17.2 15.4L21 13.2C21.8 12.7 21.8 11.3 21 10.8Z" fill="#f59e0b"/>
                            </svg>
                            <span>تحميل التطبيق</span>
                        </div>
                    </div>

                    {{-- القسم الأيسر: الشعار وبيانات التواصل --}}
                    <div class="col-brand">
                        <div class="logo-wrap">
                            @if(file_exists(public_path('images/school_logo.png')))
                                <img src="{{ public_path('images/school_logo.png') }}" alt="شعار المدرسة">
                            @endif
                        </div>
                        <div class="school-name">مدارس القيم</div>
                        <div class="school-tagline">.. تعليمنا قيم</div>
                        <div class="contact-heading">تواصل معنا</div>

                        <div class="contact-item">
                            <span class="contact-icon">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="#4d7c1f">
                                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/>
                                </svg>
                            </span>
                            <span>{{ $card['school_phone'] }}</span>
                        </div>

                        <div class="contact-item">
                            <span class="contact-icon">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="#63a22f">
                                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.75 14.01c-.24.67-1.41 1.29-1.95 1.37-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.18-4.93-4.37-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.42.27-.29.59-.36.79-.36h.57c.18 0 .43-.07.67.51.24.59.82 2.02.89 2.17.07.15.12.32.02.51-.1.19-.15.32-.3.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.67.79 1.96.93.29.14.48.21.55.33.07.12.07.69-.17 1.36z"/>
                                </svg>
                            </span>
                            <span>{{ $card['whatsapp_phone'] }}</span>
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
    @endif

    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
    <script>
        (function () {
            if (typeof qrcode === 'undefined') return;
            var first = document.querySelector('.qr-box[data-qr]');
            if (!first) return;
            var text = first.getAttribute('data-qr') || 'https://smart-school.local';
            var qr = qrcode(0, 'M');
            qr.addData(text);
            qr.make();
            var svg = qr.createSvgTag({ cellSize: 4, margin: 0 })
                .replace(/fill="#000000"/g, 'fill="#4d7c1f"')
                .replace(/fill="black"/g, 'fill="#4d7c1f"');
            var svgDataUrl = 'data:image/svg+xml;base64,' + btoa(svg);
            var style = document.createElement('style');
            style.textContent = '.qr-box { background-image: url("' + svgDataUrl + '"); background-size: contain; background-repeat: no-repeat; background-position: center; }';
            document.head.appendChild(style);

            var img = new Image();
            img.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = 240;
                canvas.height = 240;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 240, 240);
                var pngUrl = canvas.toDataURL('image/png');
                style.textContent = '.qr-box { background-image: url("' + pngUrl + '"); background-size: contain; background-repeat: no-repeat; background-position: center; }';
            };
            img.src = svgDataUrl;
        })();
    </script>
</body>
</html>
