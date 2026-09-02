<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $printSettings['title'] ?? 'كشف تعهدات الطلاب' }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        
        body {
            font-family: 'Amiri', serif;
            background-color: white;
            color: #334155;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .brand-text {
            color: {{ $brandColor }};
        }

        .brand-bg {
            background-color: {{ $brandColor }};
            color: white;
        }

        .brand-border {
            border-color: {{ $brandColor }};
        }
        
        @if($watermark && $watermark !== 'none')
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 8rem;
            color: rgba(150, 150, 150, 0.15);
            z-index: 9999;
            white-space: nowrap;
            pointer-events: none;
            font-weight: bold;
        }
        @endif
        
        table {
            page-break-inside: auto;
        }
        tr {
            page-break-inside: avoid;
            page-break-after: auto;
        }
    </style>
</head>
<body class="p-4 sm:p-8">
    @if($watermark === 'confidential')
        <div class="watermark">ســـــري</div>
    @elseif($watermark === 'draft')
        <div class="watermark">مســــودة</div>
    @endif

    <!-- الترويسة العلوية الرسمية للمدرسة -->
    <div class="relative mb-6 pb-4 border-b-2 brand-border">
        <div class="absolute -top-6 inset-x-0 h-1.5 opacity-100 brand-bg"></div>
        
        <div class="flex justify-between items-start pt-4">
            <div class="flex flex-col gap-0.5 z-10 w-[38%] pt-0.5">
                <div class="flex items-center gap-2 mb-1">
                    <div class="w-1.5 h-1.5 rounded-full brand-bg"></div>
                    <h3 class="text-[11px] font-black text-slate-600 tracking-wide">الجمهورية اليمنية</h3>
                </div>
                <h3 class="text-[11px] font-bold text-slate-600 pr-3.5">وزارة التربية والتعليم والبحث العلمي</h3>
                <h2 class="text-lg font-black text-slate-900 mt-1.5 pr-3.5 leading-tight tracking-tight">مدارس القيم الأهلية</h2>
                <h3 class="text-[11px] font-semibold text-slate-500 pr-3.5 flex items-center gap-1.5 mt-0.5">المركز الرئيسي <span class="w-1 h-1 rounded-full bg-slate-300"></span> قسم التوجيه والإرشاد</h3>
                
                <div class="mt-3 pr-3 border-r-[3px] py-0.5 brand-border">
                    <h1 class="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap leading-none">
                        {{ $printSettings['title'] ?? 'كشف تعهدات الطلاب' }}
                    </h1>
                </div>
            </div>

            <div class="flex flex-col items-center justify-start w-[24%] z-10">
                <div class="w-20 h-20 bg-white flex items-center justify-center p-1 relative group">
                    <img src="http://localhost/Smart-School/public/images/logo.png" alt="شعار المدرسة" class="w-full h-full object-contain filter drop-shadow-sm" onerror="this.onerror=null; this.src='http://localhost/Smart-School/public/images/school_logo.png'" />
                </div>
            </div>

            <div class="flex flex-col items-end w-[38%] z-10">
                <div class="w-full max-w-[250px] border border-slate-300 rounded-lg overflow-hidden">
                    <div class="h-1 w-full brand-bg"></div>
                    <div class="p-3 flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">رقم الوثيقة</span>
                            <span class="font-black text-slate-800 text-[11px]" dir="ltr">PLD-{{ date('y') }}0{{ rand(100, 999) }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تاريخ الطباعة</span>
                            <span class="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">{{ date('d/m/Y') }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">العام الدراسي</span>
                            <span class="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">2026-2027</span>
                        </div>
                        <div class="h-px w-full bg-slate-300 my-0.5"></div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold tracking-wider">الفترة</span>
                            <span class="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">
                                @if(!empty($filters['start_date']) && !empty($filters['end_date']))
                                    {{ \Carbon\Carbon::parse($filters['start_date'])->format('Y/m/d') }} - {{ \Carbon\Carbon::parse($filters['end_date'])->format('Y/m/d') }}
                                @else
                                    الكل
                                @endif
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @if(($printSettings['showKPIs'] ?? true) && isset($stats))
    <div class="flex flex-wrap gap-4 mb-6">
        <div class="flex-1 bg-slate-50 border border-slate-200 rounded p-3 text-center">
            <div class="text-[10px] font-bold text-slate-500">إجمالي التعهدات</div>
            <div class="text-xl font-black text-slate-800">{{ $stats['total'] ?? 0 }}</div>
        </div>
        <div class="flex-1 bg-emerald-50 border border-emerald-200 rounded p-3 text-center">
            <div class="text-[10px] font-bold text-emerald-600">مكتمل التوقيع</div>
            <div class="text-xl font-black text-emerald-700">{{ $stats['fully_signed'] ?? 0 }}</div>
        </div>
        <div class="flex-1 bg-amber-50 border border-amber-200 rounded p-3 text-center">
            <div class="text-[10px] font-bold text-amber-600">توقيع جزئي</div>
            <div class="text-xl font-black text-amber-700">{{ $stats['partially_signed'] ?? 0 }}</div>
        </div>
        <div class="flex-1 bg-rose-50 border border-rose-200 rounded p-3 text-center">
            <div class="text-[10px] font-bold text-rose-600">غير موقع</div>
            <div class="text-xl font-black text-rose-700">{{ $stats['unsigned'] ?? 0 }}</div>
        </div>
    </div>
    @endif

    @if(count($pledges) === 0)
        <div class="text-center p-8 mt-10 border border-slate-300 rounded bg-slate-50">
            <h2 class="text-xl font-bold text-slate-600">لا توجد تعهدات مسجلة لهذه الفترة.</h2>
        </div>
    @else
        <table class="w-full text-right border-collapse border border-slate-300 text-sm mt-2">
            <thead>
                <tr class="brand-bg">
                    <th class="border border-slate-300 p-2 font-bold text-center w-10">م</th>
                    <th class="border border-slate-300 p-2 font-bold w-28">تاريخ التعهد</th>
                    <th class="border border-slate-300 p-2 font-bold w-40">اسم الطالب / الصف</th>
                    <th class="border border-slate-300 p-2 font-bold w-40">المخالفة المرتبطة</th>
                    <th class="border border-slate-300 p-2 font-bold">نص التعهد والالتزام</th>
                    <th class="border border-slate-300 p-2 font-bold text-center w-24">توقيع الطالب</th>
                    <th class="border border-slate-300 p-2 font-bold text-center w-24">توقيع ولي الأمر</th>
                    <th class="border border-slate-300 p-2 font-bold text-center w-24">توقيع المرشد</th>
                </tr>
            </thead>
            <tbody>
                @foreach($pledges as $index => $pledge)
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="border border-slate-300 p-2 text-center font-bold">{{ $index + 1 }}</td>
                        <td class="border border-slate-300 p-2 text-center font-bold text-slate-800" dir="ltr">
                            {{ \Carbon\Carbon::parse($pledge['date'])->format('Y-m-d') }}
                        </td>
                        <td class="border border-slate-300 p-2">
                            <div class="font-bold text-slate-900">{{ $pledge['student']['user']['name'] ?? '-' }}</div>
                            <div class="text-xs text-slate-600 mt-1">
                                {{ $pledge['student']['current_enrollment']['division']['grade']['name'] ?? '' }} - 
                                {{ $pledge['student']['current_enrollment']['division']['name'] ?? '' }}
                            </div>
                        </td>
                        <td class="border border-slate-300 p-2">
                            @if(isset($pledge['violation']['violation_type']['name']))
                                <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-200 bg-rose-50 text-rose-700">
                                    {{ $pledge['violation']['violation_type']['name'] }}
                                </span>
                            @else
                                <span class="text-xs text-slate-500">تعهد عام</span>
                            @endif
                        </td>
                        <td class="border border-slate-300 p-2 text-sm text-slate-800 font-semibold leading-relaxed">
                            {{ $pledge['pledge_text'] ?? '-' }}
                        </td>
                        
                        <!-- توقيع الطالب -->
                        <td class="border border-slate-300 p-2 text-center">
                            @if($pledge['is_signed_by_student'])
                                @if(!empty($pledge['student_signature_path']))
                                    <div class="w-16 h-8 mx-auto flex items-center justify-center">
                                        <img src="{{ public_path('storage/' . $pledge['student_signature_path']) }}" alt="توقيع الطالب" style="max-height: 100%; max-width: 100%; object-fit: contain;">
                                    </div>
                                @else
                                    <span class="text-[10px] text-emerald-700 font-bold">تم التوقيع</span>
                                @endif
                            @else
                                <span class="text-[10px] text-slate-400">غير موقع</span>
                            @endif
                        </td>

                        <!-- توقيع ولي الأمر -->
                        <td class="border border-slate-300 p-2 text-center">
                            @if($pledge['is_signed_by_parent'])
                                @if(!empty($pledge['parent_signature_path']))
                                    <div class="w-16 h-8 mx-auto flex items-center justify-center">
                                        <img src="{{ public_path('storage/' . $pledge['parent_signature_path']) }}" alt="توقيع ولي الأمر" style="max-height: 100%; max-width: 100%; object-fit: contain;">
                                    </div>
                                @else
                                    <span class="text-[10px] text-emerald-700 font-bold">تم التوقيع</span>
                                @endif
                            @else
                                <span class="text-[10px] text-slate-400">غير موقع</span>
                            @endif
                        </td>

                        <!-- توقيع المرشد (للطباعة) -->
                        <td class="border border-slate-300 p-2 text-center"></td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Print Signatures Section -->
        <div class="flex justify-between items-end p-4 mt-12 w-full page-break-inside-avoid">
            <div class="text-center w-48">
                <h4 class="font-bold text-slate-800 mb-8">المرشد الطلابي</h4>
                <div class="border-b border-black w-full mb-2"></div>
                <p class="text-sm text-slate-600">الاسم والتوقيع</p>
            </div>
            
            <div class="text-center w-48">
                <h4 class="font-bold text-slate-800 mb-8">وكيل شؤون الطلاب</h4>
                <div class="border-b border-black w-full mb-2"></div>
                <p class="text-sm text-slate-600">الاسم والتوقيع</p>
            </div>

            <div class="text-center w-48">
                <h4 class="font-bold text-slate-800 mb-8">مدير المدرسة / الختم</h4>
                <div class="border-b border-black w-full mb-2"></div>
                <p class="text-sm text-slate-600">الاسم والتوقيع</p>
            </div>
        </div>
    @endif
</body>
</html>
