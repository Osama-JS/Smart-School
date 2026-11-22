<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>بطاقات بيانات دخول الموظفين</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

        body {
            font-family: 'Cairo', 'Tahoma', sans-serif;
            background-color: #ffffff;
            color: #1e293b;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .card-box {
            position: relative;
            overflow: hidden;
            border: 1.8px solid #63a22f;
            border-radius: 18px;
            padding: 14px 16px 12px 16px;
            background: #ffffff;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .card-top-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(to left, #5b8a2d 0%, #84b817 65%, #dc1420 100%);
        }

        .section-title {
            color: #4d7c1f;
            font-weight: 900;
            font-size: 12.5px;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }

        .section-dot {
            width: 6px;
            height: 6px;
            border-radius: 9999px;
            background-color: #dc1420;
            display: inline-block;
        }

        .field-label {
            color: #4d7c1f;
            font-weight: 800;
        }

        .cred-panel {
            background-color: #f6faee;
            border: 1px solid #d5e7b5;
            border-radius: 12px;
            padding: 7px 10px;
        }

        .mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            direction: ltr;
            unicode-bidi: embed;
        }

        .qr-wrapper svg {
            width: 94px !important;
            height: 94px !important;
            display: block;
        }
    </style>
</head>
<body class="p-2">
    <div class="space-y-4">
        @forelse($employeesList as $idx => $emp)
            <div class="card-box">
                <div class="card-top-bar"></div>

                <div class="flex items-stretch gap-4 pt-0.5">
                    <!-- الجانب الأيمن: البيانات الأساسية + بيانات الدخول + التنبيهات -->
                    <div class="flex-1 min-w-0 flex flex-col justify-between">
                        <!-- الصف العلوي: البيانات الأساسية | بيانات تسجيل الدخول -->
                        <div class="grid grid-cols-2 gap-3 pb-2 border-b border-slate-200">
                            <!-- البيانات الأساسية -->
                            <div class="pl-2 border-l border-slate-200 flex flex-col justify-center">
                                <div class="section-title">
                                    <span class="section-dot"></span>
                                    <span>البيانات الأساسية</span>
                                </div>
                                <div class="space-y-1 text-[11.5px]">
                                    <div class="flex items-baseline gap-1.5">
                                        <span class="field-label shrink-0">الاسم:</span>
                                        <span class="font-black text-slate-900 truncate">{{ $emp['name'] }}</span>
                                    </div>
                                    <div class="flex items-baseline gap-1.5">
                                        <span class="field-label shrink-0">رقم الهاتف:</span>
                                        <span class="font-bold text-slate-800 mono">{{ $emp['phone'] ?: '—' }}</span>
                                    </div>
                                    <div class="flex items-baseline gap-1.5 text-[10px] text-slate-600">
                                        <span class="font-bold text-[#4d7c1f]">القسم:</span>
                                        <span class="font-bold truncate">{{ $emp['department'] }} • {{ $emp['role'] }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- بيانات تسجيل الدخول -->
                            <div class="cred-panel flex flex-col justify-center">
                                <div class="section-title">
                                    <span class="section-dot"></span>
                                    <span>بيانات تسجيل الدخول</span>
                                </div>
                                <div class="space-y-1.5 text-[11.5px]">
                                    <div class="flex items-center justify-between gap-2 bg-white px-2.5 py-1 rounded-lg border border-[#dcebc2]">
                                        <span class="field-label shrink-0">اسم المستخدم:</span>
                                        <span class="font-black text-slate-900 mono">{{ $emp['username'] ?: '—' }}</span>
                                    </div>
                                    <div class="flex items-center justify-between gap-2 bg-white px-2.5 py-1 rounded-lg border border-[#dcebc2]">
                                        <span class="field-label shrink-0">كلمة المرور:</span>
                                        @if(!empty($emp['password']))
                                            <span class="font-black text-[#111827] mono">{{ $emp['password'] }}</span>
                                        @else
                                            <span class="font-bold text-[#dc1420] text-[10px]">غير محفوظة</span>
                                        @endif
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- تنبيهات هامة -->
                        <div class="pt-2">
                            <div class="flex items-center justify-center gap-1.5 mb-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-[#dc1420]"></span>
                                <span class="text-[#dc1420] font-black text-[12px]">تنبيهات هامة:</span>
                            </div>
                            <div class="text-[10.2px] leading-[1.6] text-slate-700 font-semibold space-y-0.5">
                                <p>تهديكم <strong class="text-[#4d7c1f]">مدارس القيم الأهلية</strong> أرق وأطيب التحايا..</p>
                                <p>لتسهيل العمل الإداري والأكاديمي نضع بين أيديكم حسابكم في النظام الإلكتروني، ولتفعيله يرجى اتباع التعليمات أدناه:</p>
                                <p>1- امسح الباركود على اليسار أو افتح رابط البوابة الإلكترونية للدخول إلى حسابك.</p>
                                <p>2- أدخل اسم المستخدم وكلمة المرور المكتوبة في البطاقة أعلاه.</p>
                                <p>- في حال كان هناك خلل في البيانات أعلاه أو واجهت أي مشكلة الرجاء التواصل مع الإدارة.</p>
                                <p>- لا تشارك بيانات الدخول الخاصة بك مع أي شخص آخر حفاظاً على سرية حسابك.</p>
                            </div>
                        </div>
                    </div>

                    <!-- الجانب الأيسر: QR + شعار المدرسة وبيانات التواصل -->
                    <div class="w-[218px] shrink-0 flex items-center justify-between gap-2.5 pr-3 border-r border-slate-200">
                        <!-- QR + زر التحميل/الدخول -->
                        <div class="flex flex-col items-center gap-2">
                            <div class="p-1.5 rounded-xl border-2 border-[#63a22f] bg-[#fafdf5] qr-wrapper shadow-sm" data-qr-url="{{ $loginUrl }}"></div>
                            <div class="w-full px-2.5 py-1 rounded-lg bg-[#f6faee] border border-[#cde3a7] flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-[#3f6718]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
                                    <path fill="#34a853" d="M3 2.5v19l10.5-9.5z"/>
                                    <path fill="#4285f4" d="M13.5 12L3 2.5l14.2 8.1z"/>
                                    <path fill="#fbbc05" d="M17.2 10.6L13.5 12l3.7 1.4 3.3-1.9c.7-.4.7-1.4 0-1.8z"/>
                                    <path fill="#ea4335" d="M13.5 12L3 21.5l14.2-8.1z"/>
                                </svg>
                                <span>تحميل التطبيق</span>
                            </div>
                        </div>

                        <!-- شعار المدرسة والتواصل -->
                        <div class="flex-1 flex flex-col items-center text-center">
                            <img src="http://localhost/Smart-School/public/images/school_logo.png" alt="شعار مدارس القيم الأهلية" class="w-16 h-16 object-contain mb-1" onerror="this.onerror=null; this.src='http://localhost/Smart-School/public/images/logo.png'" />
                            <div class="text-[9.5px] font-black text-[#dc1420] mb-1">.. تعليمنا قيم</div>
                            <div class="text-[9.5px] font-extrabold text-[#4d7c1f] border-t border-slate-200 pt-1 w-full mb-1">تواصل معنا</div>

                            <div class="space-y-1 text-[9px] text-slate-700 font-bold w-full">
                                <div class="flex items-center justify-center gap-1">
                                    <span class="mono">{{ $emp['branch_phone'] }}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5b8a2d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                </div>
                                <div class="flex items-center justify-center gap-1">
                                    <span class="mono">{{ $emp['branch_phone'] }}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        @empty
            <div class="p-8 text-center text-slate-500 font-bold border border-slate-200 rounded-2xl">
                لا توجد بيانات موظفين مطابقة.
            </div>
        @endforelse
    </div>

    <script>
        (function () {
            if (typeof qrcode === 'undefined') return;
            document.querySelectorAll('.qr-wrapper').forEach(function (el) {
                var url = el.getAttribute('data-qr-url') || window.location.origin;
                var qr = qrcode(0, 'M');
                qr.addData(url);
                qr.make();
                var svgTag = qr.createSvgTag({ cellSize: 3, margin: 0 });
                svgTag = svgTag.replace(/fill="#000000"/g, 'fill="#4d7c1f"').replace(/fill="black"/g, 'fill="#4d7c1f"');
                el.innerHTML = svgTag;
            });
        })();
    </script>
</body>
</html>
