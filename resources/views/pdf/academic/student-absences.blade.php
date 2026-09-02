<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $printSettings['title'] ?? 'تقرير غياب الطلاب' }}</title>
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
    <div class="relative mb-8 pb-4 border-b-2 brand-border">
        <div class="absolute -top-6 inset-x-0 h-1.5 opacity-100 brand-bg"></div>
        <div class="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none" style="background: linear-gradient(to bottom left, {{ $brandColor }}, transparent)"></div>
        
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
                        {{ $printSettings['title'] ?? 'تقرير غياب الطلاب' }}
                    </h1>
                </div>
            </div>

            <div class="flex flex-col items-center justify-start w-[24%] z-10">
                <div class="w-20 h-20 bg-white flex items-center justify-center p-1 relative group">
                    <img src="http://localhost/Smart-School/public/images/logo.png" alt="شعار المدرسة" class="w-full h-full object-contain filter drop-shadow-sm" onerror="this.onerror=null; this.src='http://localhost/Smart-School/public/images/school_logo.png'" />
                </div>
            </div>

            <div class="flex flex-col items-end w-[38%] z-10">
                <div class="w-full max-w-[230px] border border-slate-300 rounded-lg overflow-hidden">
                    <div class="h-1 w-full brand-bg"></div>
                    <div class="p-3 flex flex-col gap-2.5">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">رقم الوثيقة</span>
                            <span class="font-black text-slate-800 text-[11px]" dir="ltr">AC-ABS-{{ date('y') }}0{{ rand(100, 999) }}</span>
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
                            <div class="flex items-center gap-1.5 text-slate-500">
                                <span class="text-[10px] font-bold uppercase tracking-wider">التاريخ</span>
                            </div>
                            <div class="flex flex-col items-end">
                                <span class="font-bold text-[10px] text-slate-800 font-mono tracking-wider" dir="ltr">{{ isset($date) ? \Carbon\Carbon::parse($date)->format('d/m/Y') : date('d/m/Y') }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @php
        function getStatusInfo($status) {
            if ($status === 'present' || $status === 'حاضر') return ['label' => 'حاضر', 'color' => 'text-emerald-700 bg-emerald-100 border-emerald-200'];
            if ($status === 'absent' || $status === 'غائب') return ['label' => 'غائب', 'color' => 'text-rose-700 bg-rose-100 border-rose-200'];
            if ($status === 'late' || $status === 'متأخر') return ['label' => 'متأخر', 'color' => 'text-amber-700 bg-amber-100 border-amber-200'];
            if ($status === 'excused') return ['label' => 'عذر / استئذان', 'color' => 'text-slate-700 bg-slate-100 border-slate-200'];
            return ['label' => $status, 'color' => 'text-slate-700 bg-slate-100 border-slate-200'];
        }
    @endphp

    <table class="w-full text-right border-collapse border border-slate-200 mt-2">
        <thead>
            <tr class="brand-bg">
                <th class="border border-slate-200 p-2 font-bold w-12 text-center">م</th>
                <th class="border border-slate-200 p-2 font-bold">اسم الطالب</th>
                <th class="border border-slate-200 p-2 font-bold text-center">الشعبة</th>
                <th class="border border-slate-200 p-2 font-bold text-center">تاريخ الحضور</th>
                <th class="border border-slate-200 p-2 font-bold text-center w-32">الحالة</th>
            </tr>
        </thead>
        <tbody>
            @php $count = 1; @endphp
            @forelse($logs as $log)
                @php $statusInfo = getStatusInfo($log['status']); @endphp
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="border border-slate-200 p-2 text-center">{{ $count++ }}</td>
                    <td class="border border-slate-200 p-2 font-bold text-slate-800">
                        {{ $log['user']['name'] ?? 'غير معروف' }}
                    </td>
                    <td class="border border-slate-200 p-2 text-center text-sm font-semibold text-slate-600">
                        {{ $log['user']['division'] ?? '-' }}
                    </td>
                    <td class="border border-slate-200 p-2 text-center text-slate-600 font-mono tracking-tighter" dir="ltr">
                        {{ \Carbon\Carbon::parse($log['attendance_date'])->format('Y/m/d') }}
                    </td>
                    <td class="border border-slate-200 p-2 text-center">
                        <span class="inline-block px-3 py-1 rounded-lg text-sm font-black border {{ $statusInfo['color'] }}">
                            {{ $statusInfo['label'] }}
                        </span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" class="border border-slate-200 p-8 text-center text-slate-500 text-lg font-bold">
                        لا توجد بيانات متاحة
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
