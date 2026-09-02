<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $printSettings['title'] ?? 'تقرير الدرجات الشهرية' }}</title>
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

    <!-- الترويسة العلوية -->
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
                <h3 class="text-[11px] font-semibold text-slate-500 pr-3.5 flex items-center gap-1.5 mt-0.5">المركز الرئيسي <span class="w-1 h-1 rounded-full bg-slate-300"></span> الشؤون الأكاديمية</h3>
                
                <div class="mt-3 pr-3 border-r-[3px] py-0.5 brand-border">
                    <h1 class="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap leading-none">
                        {{ $printSettings['title'] ?? 'تقرير الدرجات الشهرية' }}
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
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">المادة</span>
                            <span class="font-black text-slate-800 text-[11px]">{{ $subject->name }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">الصف والشعبة</span>
                            <span class="font-bold text-slate-800 text-[11px]">{{ $division->grade->name ?? '' }} - {{ $division->name }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تاريخ الطباعة</span>
                            <span class="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">{{ date('d/m/Y') }}</span>
                        </div>
                        <div class="h-px w-full bg-slate-300 my-0.5"></div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold tracking-wider">الفترة</span>
                            <span class="font-bold text-slate-800 text-[11px] tracking-wide">{{ $period->month_name }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @php
        $isMonthly = $period->period_type === 'monthly' || empty($period->period_type);
        $weeksCount = $gradeSetting->weeks_per_month ?? 4;
        $weeksData = $isMonthly ? ($period->weeks_dates ?? array_fill(0, $weeksCount, ['name' => ''])) : [];
        foreach($weeksData as $idx => &$wd) {
            if(empty($wd['name'])) $wd['name'] = 'الأسبوع ' . ($idx + 1);
        }
        $weeks = [];
        for($i=1; $i<=$weeksCount; $i++) $weeks[] = "week_$i";
    @endphp

    @if(count($enrollments) === 0)
        <div class="text-center p-8 mt-10 border border-slate-300 rounded bg-slate-50">
            <h2 class="text-xl font-bold text-slate-600">لا يوجد طلاب مسجلين في هذا الفصل.</h2>
        </div>
    @else
        <table class="w-full text-center border-collapse border border-slate-400 text-sm mt-2">
            <thead>
                <tr class="brand-bg">
                    <th class="border border-slate-400 p-2 font-bold w-8" rowspan="2">م</th>
                    <th class="border border-slate-400 p-2 font-bold w-32" rowspan="2">اسم الطالب</th>
                    
                    @foreach($weeksData as $idx => $week)
                        <th class="border border-slate-400 p-1 font-bold text-[11px]" colspan="3">
                            {{ $week['name'] }}
                        </th>
                    @endforeach
                    
                    <th class="border border-slate-400 p-1 font-bold text-[11px]" colspan="3">ملخص الشهر</th>
                    <th class="border border-slate-400 p-2 font-bold text-sm bg-black/10" rowspan="2">الإجمالي<br/>النهائي</th>
                    <th class="border border-slate-400 p-2 font-bold w-24" rowspan="2">ملاحظات</th>
                </tr>
                <tr class="bg-slate-100 text-slate-800">
                    @foreach($weeksData as $idx => $week)
                        <th class="border border-slate-400 p-1 text-[10px] font-bold">شفهي</th>
                        <th class="border border-slate-400 p-1 text-[10px] font-bold">واجب</th>
                        <th class="border border-slate-400 p-1 text-[10px] font-bold bg-slate-200">المجموع</th>
                    @endforeach
                    <th class="border border-slate-400 p-1 text-[10px] font-bold">الأسابيع</th>
                    <th class="border border-slate-400 p-1 text-[10px] font-bold">سلوك</th>
                    <th class="border border-slate-400 p-1 text-[10px] font-bold">اختبار</th>
                </tr>
            </thead>
            <tbody>
                @foreach($enrollments as $index => $enrollment)
                    @php
                        $existing = $existingGrades[$enrollment->id] ?? null;
                        $weekly = $existing ? ($existing->weekly_scores ?? []) : [];
                        $scores = $existing ? ($existing->scores ?? []) : [];
                        
                        $oralTotal = 0;
                        $hwTotal = 0;
                        
                        foreach($weeks as $w) {
                            $oralTotal += floatval($weekly[$w]['oral'] ?? 0);
                            $hwTotal += floatval($weekly[$w]['homework'] ?? 0);
                        }
                        
                        $behavior = floatval($scores['behavior'] ?? 0);
                        $exam = floatval($scores['monthly_exam'] ?? 0);
                        $note = $scores['note'] ?? '';
                        $grandTotal = $oralTotal + $hwTotal + $behavior + $exam;
                    @endphp
                    <tr>
                        <td class="border border-slate-400 p-1 font-bold text-xs">{{ $index + 1 }}</td>
                        <td class="border border-slate-400 p-1 text-right pr-2">
                            <span class="font-bold text-slate-800 text-xs">
                                {{ $enrollment->student->user->name ?? '-' }}
                            </span>
                        </td>
                        
                        @foreach($weeks as $w)
                            @php
                                $wOral = $weekly[$w]['oral'] ?? '';
                                $wHw = $weekly[$w]['homework'] ?? '';
                                $wTotal = (floatval($wOral) + floatval($wHw));
                                $wTotalDisplay = ($wOral !== '' || $wHw !== '') ? $wTotal : '';
                            @endphp
                            <td class="border border-slate-400 p-1 text-xs">{{ $wOral }}</td>
                            <td class="border border-slate-400 p-1 text-xs">{{ $wHw }}</td>
                            <td class="border border-slate-400 p-1 text-xs font-bold bg-slate-50">{{ $wTotalDisplay }}</td>
                        @endforeach
                        
                        <td class="border border-slate-400 p-1 text-xs font-bold">{{ ($oralTotal + $hwTotal) > 0 ? ($oralTotal + $hwTotal) : '' }}</td>
                        <td class="border border-slate-400 p-1 text-xs">{{ $scores['behavior'] ?? '' }}</td>
                        <td class="border border-slate-400 p-1 text-xs">{{ $scores['monthly_exam'] ?? '' }}</td>
                        <td class="border border-slate-400 p-1 text-sm font-black bg-slate-100">{{ $grandTotal > 0 ? $grandTotal : '' }}</td>
                        <td class="border border-slate-400 p-1 text-[10px] text-right truncate max-w-[100px]" title="{{ $note }}">
                            {{ $note }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Signatures -->
        <div class="flex justify-between items-end p-4 mt-8 w-full page-break-inside-avoid">
            <div class="text-center w-48">
                <h4 class="font-bold text-slate-800 mb-8">معلم المادة</h4>
                <div class="border-b border-black w-full mb-2"></div>
                <p class="text-sm text-slate-600">الاسم والتوقيع</p>
            </div>
            
            <div class="text-center w-48">
                <h4 class="font-bold text-slate-800 mb-8">الوكيل الأكاديمي</h4>
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
