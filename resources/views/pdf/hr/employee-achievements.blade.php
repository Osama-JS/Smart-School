<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $printSettings['title'] ?? 'تقرير إنجازات الموظفين' }}</title>
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
                <h3 class="text-[11px] font-semibold text-slate-500 pr-3.5 flex items-center gap-1.5 mt-0.5">المركز الرئيسي <span class="w-1 h-1 rounded-full bg-slate-300"></span> الموارد البشرية</h3>
                
                <div class="mt-3 pr-3 border-r-[3px] py-0.5 brand-border">
                    <h1 class="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap leading-none">
                        {{ $printSettings['title'] ?? 'تقرير إنجازات الموظفين' }}
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
                            <span class="font-black text-slate-800 text-[11px]" dir="ltr">HR-{{ date('y') }}0{{ rand(100, 999) }}</span>
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
                                <span class="text-[10px] font-bold uppercase tracking-wider">الفترة</span>
                            </div>
                            <div class="flex flex-col items-end">
                                <span class="font-bold text-[10px] text-slate-800 font-mono tracking-wider" dir="ltr">{{ $periodStart ? \Carbon\Carbon::parse($periodStart)->format('d/m/Y') : 'بداية' }}</span>
                                <span class="font-bold text-[10px] text-slate-800 font-mono tracking-wider" dir="ltr">{{ $periodEnd ? \Carbon\Carbon::parse($periodEnd)->format('d/m/Y') : 'اليوم' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- الإحصائيات (KPIs) -->
    @if(isset($printSettings['showKPIs']) && $printSettings['showKPIs'])
    <div class="grid grid-cols-3 gap-3 mb-8">
        <div class="bg-white border border-slate-300 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 bottom-0 w-1 opacity-80 brand-bg"></div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style="background-color: {{ $brandColor }}15; color: {{ $brandColor }}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
            </div>
            <div>
                <p class="text-slate-500 text-[11px] font-bold mb-0.5">إجمالي الإنجازات</p>
                <p class="text-lg font-black leading-none text-slate-800">{{ $kpis['total_achievements'] ?? 0 }}</p>
            </div>
        </div>
        
        <div class="bg-white border border-slate-300 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 bottom-0 w-1 opacity-80 brand-bg"></div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style="background-color: {{ $brandColor }}15; color: {{ $brandColor }}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div>
                <p class="text-slate-500 text-[11px] font-bold mb-0.5">إجمالي النقاط المكتسبة</p>
                <p class="text-lg font-black leading-none text-emerald-600">{{ $kpis['total_points'] ?? 0 }}</p>
            </div>
        </div>
        
        <div class="bg-white border border-slate-300 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 bottom-0 w-1 opacity-80 brand-bg"></div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style="background-color: {{ $brandColor }}15; color: {{ $brandColor }}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div>
                <p class="text-slate-500 text-[11px] font-bold mb-0.5">موظفين متميزين</p>
                <p class="text-lg font-black leading-none text-primary-600">{{ $kpis['unique_achievers'] ?? 0 }}</p>
            </div>
        </div>
    </div>
    @endif

    <table class="w-full text-right border-collapse border border-slate-200 mt-2">
        <thead>
            <tr class="brand-bg">
                <th class="border border-slate-200 p-2 font-bold w-12 text-center">م</th>
                <th class="border border-slate-200 p-2 font-bold">اسم الموظف</th>
                <th class="border border-slate-200 p-2 font-bold text-center">القسم</th>
                <th class="border border-slate-200 p-2 font-bold text-center">تاريخ الإنجاز</th>
                <th class="border border-slate-200 p-2 font-bold text-center">نوع الإنجاز</th>
                <th class="border border-slate-200 p-2 font-bold text-center">النقاط</th>
                <th class="border border-slate-200 p-2 font-bold text-center">التفاصيل</th>
            </tr>
        </thead>
        <tbody>
            @php $count = 1; @endphp
            @forelse($employeesData as $employee)
                @foreach($employee['records'] as $record)
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="border border-slate-200 p-2 text-center">{{ $count++ }}</td>
                        <td class="border border-slate-200 p-2 font-semibold">{{ $employee['employee_name'] }}</td>
                        <td class="border border-slate-200 p-2 text-center font-bold text-slate-700">{{ $employee['department'] ?: '-' }}</td>
                        <td class="border border-slate-200 p-2 text-center text-slate-600 font-mono tracking-tighter" dir="ltr">
                            {{ \Carbon\Carbon::parse($record['achievement_date'])->format('d/m/Y') }}
                        </td>
                        <td class="border border-slate-200 p-2 text-center font-bold text-primary-700">{{ $record['type_name'] }}</td>
                        <td class="border border-slate-200 p-2 text-center">
                            <span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                +{{ $record['points'] }}
                            </span>
                        </td>
                        <td class="border border-slate-200 p-2 text-center text-xs text-slate-500 max-w-[150px] truncate" title="{{ $record['details'] }}">{{ $record['details'] ?: '-' }}</td>
                    </tr>
                @endforeach
            @empty
                <tr>
                    <td colspan="7" class="border border-slate-200 p-8 text-center text-slate-500 text-lg">
                        لا توجد بيانات متاحة
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
