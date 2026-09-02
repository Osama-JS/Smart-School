<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $printSettings['title'] ?? 'كشف زيارات أولياء الأمور' }}</title>
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
                <h3 class="text-[11px] font-semibold text-slate-500 pr-3.5 flex items-center gap-1.5 mt-0.5">المركز الرئيسي <span class="w-1 h-1 rounded-full bg-slate-300"></span> إدارة شؤون الطلاب والإرشاد</h3>
                
                <div class="mt-3 pr-3 border-r-[3px] py-0.5 brand-border">
                    <h1 class="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap leading-none">
                        {{ $printSettings['title'] ?? 'كشف زيارات أولياء الأمور' }}
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
                            <span class="font-black text-slate-800 text-[11px]" dir="ltr">PV-{{ date('y') }}0{{ rand(100, 999) }}</span>
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
            <div class="text-[10px] font-bold text-slate-500">إجمالي الزيارات</div>
            <div class="text-xl font-black text-slate-800">{{ $stats['total'] ?? 0 }}</div>
        </div>
        <div class="flex-1 bg-emerald-50 border border-emerald-200 rounded p-3 text-center">
            <div class="text-[10px] font-bold text-emerald-600">زيارات مكتملة</div>
            <div class="text-xl font-black text-emerald-700">{{ $stats['completed'] ?? 0 }}</div>
        </div>
        <div class="flex-1 bg-amber-50 border border-amber-200 rounded p-3 text-center">
            <div class="text-[10px] font-bold text-amber-600">زيارات مجدولة</div>
            <div class="text-xl font-black text-amber-700">{{ $stats['scheduled'] ?? 0 }}</div>
        </div>
        <div class="flex-1 bg-blue-50 border border-blue-200 rounded p-3 text-center">
            <div class="text-[10px] font-bold text-blue-600">زيارات جارية</div>
            <div class="text-xl font-black text-blue-700">{{ $stats['in_progress'] ?? 0 }}</div>
        </div>
    </div>
    @endif

    @php
        function getStatusBadge($status) {
            $styles = [
                'مجدولة' => ['color' => 'text-amber-800 bg-amber-100 border-amber-200'],
                'جارية' => ['color' => 'text-blue-800 bg-blue-100 border-blue-200'],
                'مكتملة' => ['color' => 'text-emerald-800 bg-emerald-100 border-emerald-200'],
                'ملغاة' => ['color' => 'text-rose-800 bg-rose-100 border-rose-200']
            ];
            
            return $styles[$status] ?? ['color' => 'bg-slate-100 text-slate-800 border-slate-200'];
        }

        function getPurposeBadge($category) {
            $colors = [
                'أكاديمي' => 'bg-indigo-50 text-indigo-700 border-indigo-200',
                'سلوكي' => 'bg-amber-50 text-amber-700 border-amber-200',
                'مالي' => 'bg-emerald-50 text-emerald-700 border-emerald-200',
                'إداري/أخرى' => 'bg-slate-100 text-slate-700 border-slate-200'
            ];
            return $colors[$category] ?? 'bg-slate-100 text-slate-700 border-slate-200';
        }
    @endphp

    @if(count($visits) === 0)
        <div class="text-center p-8 mt-10 border border-slate-300 rounded bg-slate-50">
            <h2 class="text-xl font-bold text-slate-600">لا توجد زيارات مسجلة لهذه الفترة.</h2>
        </div>
    @else
        <table class="w-full text-right border-collapse border border-slate-300 text-sm mt-2">
            <thead>
                <tr class="brand-bg">
                    <th class="border border-slate-300 p-2 font-bold text-center w-8">م</th>
                    <th class="border border-slate-300 p-2 font-bold w-24">التاريخ والوقت</th>
                    <th class="border border-slate-300 p-2 font-bold w-32">اسم الزائر / الصلة</th>
                    <th class="border border-slate-300 p-2 font-bold w-40">اسم الطالب / الصف</th>
                    <th class="border border-slate-300 p-2 font-bold">غرض الزيارة</th>
                    <th class="border border-slate-300 p-2 font-bold w-28">الموظف المقابل</th>
                    <th class="border border-slate-300 p-2 font-bold text-center w-20">الحالة</th>
                    <th class="border border-slate-300 p-2 font-bold w-40">الملاحظات</th>
                    <th class="border border-slate-300 p-2 font-bold text-center w-24">توقيع الزائر</th>
                </tr>
            </thead>
            <tbody>
                @foreach($visits as $index => $visit)
                    @php 
                        $statusStyle = getStatusBadge($visit['status'])['color'];
                        $purposeStyle = getPurposeBadge($visit['purpose_category']);
                    @endphp
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="border border-slate-300 p-2 text-center font-bold">{{ $index + 1 }}</td>
                        <td class="border border-slate-300 p-2 text-center" dir="ltr">
                            <div class="font-bold text-slate-800">{{ \Carbon\Carbon::parse($visit['visit_date'])->format('Y-m-d') }}</div>
                            @if(!empty($visit['visit_time']))
                                <div class="text-xs text-slate-500 mt-1">{{ \Carbon\Carbon::parse($visit['visit_time'])->format('H:i') }}</div>
                            @endif
                        </td>
                        <td class="border border-slate-300 p-2">
                            <div class="font-bold text-slate-900">{{ $visit['visitor_name'] }}</div>
                            <div class="text-xs text-slate-600 mt-1">صلة القرابة: {{ $visit['visitor_relation'] ?? 'ولي أمر' }}</div>
                        </td>
                        <td class="border border-slate-300 p-2">
                            <div class="font-bold text-slate-900">{{ $visit['student']['user']['name'] ?? '-' }}</div>
                            <div class="text-xs text-slate-600 mt-1">
                                {{ $visit['student']['current_enrollment']['division']['grade']['name'] ?? '' }} - 
                                {{ $visit['student']['current_enrollment']['division']['name'] ?? '' }}
                            </div>
                        </td>
                        <td class="border border-slate-300 p-2">
                            <div class="mb-1">
                                <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border {{ $purposeStyle }}">
                                    {{ $visit['purpose_category'] ?? '-' }}
                                </span>
                            </div>
                            <div class="text-slate-800 text-xs">{{ $visit['purpose'] ?? '-' }}</div>
                        </td>
                        <td class="border border-slate-300 p-2 text-sm text-slate-800">
                            {{ $visit['employee']['name'] ?? '—' }}
                        </td>
                        <td class="border border-slate-300 p-2 text-center">
                            <span class="inline-block px-2 py-1 rounded text-xs font-bold border {{ $statusStyle }}">
                                {{ $visit['status'] }}
                            </span>
                        </td>
                        <td class="border border-slate-300 p-2 text-xs text-slate-700">
                            {{ $visit['notes'] ?? '—' }}
                        </td>
                        <td class="border border-slate-300 p-2 text-center"></td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Print Signatures Section -->
        <div class="flex justify-between items-end p-4 mt-12 w-full page-break-inside-avoid">
            <div class="text-center w-48">
                <h4 class="font-bold text-slate-800 mb-8">مسؤول الاستقبال / المتابع</h4>
                <div class="border-b border-black w-full mb-2"></div>
                <p class="text-sm text-slate-600">الاسم والتوقيع</p>
            </div>
            
            <div class="text-center w-48">
                <h4 class="font-bold text-slate-800 mb-8">المرشد الطلابي</h4>
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
