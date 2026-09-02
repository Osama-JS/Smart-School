<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $printSettings['title'] ?? 'كشف درجات ونتائج الطلاب' }}</title>
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
        
        /* العمودي للمواد */
        .vertical-text {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            height: 120px;
            margin: auto;
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
                        {{ $printSettings['title'] ?? 'كشف درجات ونتائج الطلاب' }}
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
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">الصف والشعبة</span>
                            <span class="font-bold text-slate-800 text-[11px]">{{ $divisionInfo->grade->name ?? '' }} - {{ $divisionInfo->name ?? '' }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">الفصل الدراسي</span>
                            <span class="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">{{ $semesterInfo->name ?? '' }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تاريخ الطباعة</span>
                            <span class="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">{{ date('d/m/Y') }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @if(count($studentsData) === 0)
        <div class="text-center p-8 mt-10 border border-slate-300 rounded bg-slate-50">
            <h2 class="text-xl font-bold text-slate-600">لا توجد درجات لطلاب هذه الشعبة في الفصل المحدد.</h2>
        </div>
    @else
        <table class="w-full text-center border-collapse border border-slate-400 text-sm mt-2">
            <thead>
                <tr class="brand-bg">
                    <th class="border border-slate-400 p-2 font-bold w-10">م</th>
                    <th class="border border-slate-400 p-2 font-bold w-48">اسم الطالب</th>
                    
                    @foreach($subjects as $subject)
                        <th class="border border-slate-400 p-1 font-bold">
                            <div class="vertical-text text-sm">
                                {{ $subject->name }}
                            </div>
                        </th>
                    @endforeach
                    
                    <th class="border border-slate-400 p-2 font-bold bg-black/10 w-20">المجموع</th>
                    <th class="border border-slate-400 p-2 font-bold bg-black/10 w-20">النسبة</th>
                    <th class="border border-slate-400 p-2 font-bold bg-black/10 w-20">التقدير</th>
                </tr>
                <tr class="bg-slate-100 text-slate-800">
                    <th colspan="2" class="border border-slate-400 p-2 text-right font-bold text-xs">النهاية العظمى</th>
                    
                    @foreach($subjects as $subject)
                        <th class="border border-slate-400 p-1 font-bold text-xs">
                            {{ ($subject->semester_aggregate_max ?? 0) + ($subject->final_exam_max ?? 0) ?: 100 }}
                        </th>
                    @endforeach
                    
                    <th class="border border-slate-400 p-1 font-bold text-xs">
                        {{ $studentsData[0]['max_total'] ?? 0 }}
                    </th>
                    <th class="border border-slate-400 p-1 font-bold text-xs">100%</th>
                    <th class="border border-slate-400 p-1"></th>
                </tr>
            </thead>
            <tbody>
                @foreach($studentsData as $index => $student)
                    @php
                        $percentage = $student['percentage'];
                        $isFailing = $percentage < 50;
                        
                        $estimationText = 'ضعيف';
                        if ($percentage >= 90) $estimationText = 'ممتاز';
                        elseif ($percentage >= 80) $estimationText = 'جيد جداً';
                        elseif ($percentage >= 70) $estimationText = 'جيد';
                        elseif ($percentage >= 60) $estimationText = 'مقبول';
                    @endphp
                    <tr class="{{ $isFailing ? 'bg-red-50' : '' }}">
                        <td class="border border-slate-400 p-2 font-bold text-xs">{{ $index + 1 }}</td>
                        <td class="border border-slate-400 p-2 text-right pr-2">
                            <span class="font-bold text-slate-800 text-sm">
                                {{ $student['student_name'] }}
                            </span>
                        </td>
                        
                        @foreach($subjects as $subject)
                            @php
                                $score = $student['scores'][$subject->id] ?? 0;
                                $subjectMax = ($subject->semester_aggregate_max ?? 0) + ($subject->final_exam_max ?? 0);
                                if ($subjectMax == 0) $subjectMax = 100;
                                $isSubjectFailing = $score < ($subjectMax / 2);
                            @endphp
                            <td class="border border-slate-400 p-1 font-bold text-sm {{ $isSubjectFailing ? 'text-red-700' : '' }}">
                                {{ $score > 0 ? $score : '-' }}
                            </td>
                        @endforeach
                        
                        <td class="border border-slate-400 p-1 font-bold text-sm bg-slate-50">{{ $student['total_score'] }}</td>
                        <td class="border border-slate-400 p-1 font-bold text-sm bg-slate-50 {{ $isFailing ? 'text-red-700' : '' }}">{{ $student['percentage'] }}%</td>
                        <td class="border border-slate-400 p-1 font-bold text-sm bg-slate-50 {{ $isFailing ? 'text-red-700' : '' }}">{{ $estimationText }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Signatures -->
        <div class="flex justify-between items-end p-4 mt-8 w-full page-break-inside-avoid">
            <div class="text-center w-48">
                <h4 class="font-bold text-slate-800 mb-8">معلم / مربي الصف</h4>
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
