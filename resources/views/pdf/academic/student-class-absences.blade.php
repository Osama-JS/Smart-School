<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $printSettings['title'] ?? 'تقرير الغياب بالحصص' }}</title>
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
                <h3 class="text-[11px] font-semibold text-slate-500 pr-3.5 flex items-center gap-1.5 mt-0.5">المركز الرئيسي <span class="w-1 h-1 rounded-full bg-slate-300"></span> الشؤون الأكاديمية والطلاب</h3>
                
                <div class="mt-3 pr-3 border-r-[3px] py-0.5 brand-border">
                    <h1 class="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap leading-none">
                        {{ $printSettings['title'] ?? 'تقرير الغياب بالحصص' }}
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
                            <span class="font-black text-slate-800 text-[11px]" dir="ltr">AC-C-ABS-{{ date('y') }}0{{ rand(100, 999) }}</span>
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
                            <span class="text-[10px] text-slate-500 font-bold tracking-wider">تاريخ التقرير</span>
                            <span class="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">{{ isset($filters['date']) ? \Carbon\Carbon::parse($filters['date'])->format('Y/m/d') : date('Y/m/d') }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold tracking-wider">الشعبة</span>
                            <span class="font-bold text-slate-800 text-[11px]">{{ collect($divisions)->firstWhere('id', $filters['division_id'])['grade']['name'] ?? '' }} - {{ collect($divisions)->firstWhere('id', $filters['division_id'])['name'] ?? 'غير محدد' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @php
        function getStatusInfo($status) {
            if ($status === 'present' || $status === 'حاضر') return ['label' => 'حاضر', 'color' => 'text-emerald-700 bg-emerald-100'];
            if ($status === 'absent' || $status === 'غائب') return ['label' => 'غائب', 'color' => 'text-rose-700 bg-rose-100'];
            if ($status === 'late' || $status === 'متأخر') return ['label' => 'متأخر', 'color' => 'text-amber-700 bg-amber-100'];
            if ($status === 'excused') return ['label' => 'عذر', 'color' => 'text-slate-700 bg-slate-100'];
            return ['label' => 'غير محدد', 'color' => 'text-slate-500 bg-slate-50'];
        }
    @endphp

    @if(empty($filters['division_id']))
        <div class="text-center p-8 mt-10">
            <h2 class="text-xl font-bold text-slate-600">يرجى تحديد الشعبة لعرض التقرير.</h2>
        </div>
    @elseif(count($students) === 0)
        <div class="text-center p-8 mt-10 border border-slate-300 rounded bg-slate-50">
            <h2 class="text-xl font-bold text-slate-600">لا يوجد طلاب في هذه الشعبة.</h2>
        </div>
    @else
        <table class="w-full text-right border-collapse border border-slate-300 text-xs mt-2">
            <thead>
                <tr class="brand-bg">
                    <th class="border border-slate-300 p-2 font-bold whitespace-nowrap text-center">م</th>
                    <th class="border border-slate-300 p-2 font-bold whitespace-nowrap w-48">الطالب</th>
                    <th class="border border-slate-300 p-2 font-bold whitespace-nowrap text-center">الغياب اليومي</th>
                    @foreach($periods as $period)
                        <th class="border border-slate-300 p-2 font-bold whitespace-nowrap text-center">
                            {{ collect($period)->get('period_name') }}
                            @php
                                $slot = isset($timetable) ? collect($timetable)->firstWhere('period_id', collect($period)->get('id')) : null;
                            @endphp
                            @if($slot)
                                <div class="text-[9px] font-normal border-t border-white/30 pt-1 mt-1 text-center truncate">
                                    {{ $slot['subject']['name'] ?? 'فراغ' }}
                                </div>
                            @endif
                        </th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @php $count = 1; @endphp
                @foreach($students as $student)
                    @php $dailyStatus = getStatusInfo($student['daily_status']); @endphp
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="border border-slate-300 p-2 text-center font-bold">{{ $count++ }}</td>
                        <td class="border border-slate-300 p-2">
                            <div class="font-bold text-slate-800">{{ $student['name'] }}</div>
                        </td>
                        <td class="border border-slate-300 p-2 text-center border-l-2 border-l-slate-400">
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-black {{ $dailyStatus['color'] }}">
                                {{ $dailyStatus['label'] }}
                            </span>
                        </td>
                        @foreach($periods as $period)
                            @php
                                $periodData = collect($student['periods'])->firstWhere('period_id', collect($period)->get('id'));
                            @endphp
                            <td class="border border-slate-300 p-2 text-center">
                                @if($periodData)
                                    @php $statusInfo = getStatusInfo($periodData['status']); @endphp
                                    <span class="inline-block px-2 py-0.5 rounded text-[10px] font-black {{ $statusInfo['color'] }}">
                                        {{ $statusInfo['label'] }}
                                    </span>
                                @else
                                    <span class="text-slate-300 font-bold">-</span>
                                @endif
                            </td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif
</body>
</html>
