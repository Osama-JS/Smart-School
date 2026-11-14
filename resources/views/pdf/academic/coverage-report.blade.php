<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $printSettings['title'] ?? 'تقرير التغطية والاحتياط' }}</title>
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

    <!-- الترويسة الموحدة القابلة للتخصيص من الإدارة -->
    @include('pdf.components.header', [
        'title' => $printSettings['title'] ?? 'تقرير سجلات التغطية والاحتياط',
        'departmentName' => 'الشؤون الأكاديمية والجدول المدرسي',
    ])

    <!-- الإحصائيات (KPIs) -->
    @if(isset($printSettings['showKPIs']) && $printSettings['showKPIs'])
    <div class="grid grid-cols-4 gap-3 mb-8">
        <div class="bg-white border border-slate-300 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 bottom-0 w-1 opacity-80 brand-bg"></div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mr-1 text-emerald-500" style="background-color: rgba(16, 185, 129, 0.1);">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div>
                <p class="text-slate-500 text-[11px] font-bold mb-0.5">اليوم</p>
                <p class="text-lg font-black leading-none text-emerald-600">{{ $stats['today'] ?? 0 }}</p>
            </div>
        </div>
        
        <div class="bg-white border border-slate-300 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 bottom-0 w-1 opacity-80 brand-bg"></div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mr-1 text-primary-500" style="background-color: {{ $brandColor }}15; color: {{ $brandColor }}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            </div>
            <div>
                <p class="text-slate-500 text-[11px] font-bold mb-0.5">هذا الأسبوع</p>
                <p class="text-lg font-black leading-none text-primary-600">{{ $stats['this_week'] ?? 0 }}</p>
            </div>
        </div>
        
        <div class="bg-white border border-slate-300 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 bottom-0 w-1 opacity-80 brand-bg"></div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mr-1 text-indigo-500" style="background-color: rgba(99, 102, 241, 0.1);">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
            </div>
            <div>
                <p class="text-slate-500 text-[11px] font-bold mb-0.5">هذا الشهر</p>
                <p class="text-lg font-black leading-none text-indigo-600">{{ $stats['this_month'] ?? 0 }}</p>
            </div>
        </div>
        
        <div class="bg-white border border-slate-300 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 bottom-0 w-1 opacity-80 brand-bg"></div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mr-1 text-amber-500" style="background-color: rgba(245, 158, 11, 0.1);">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </div>
            <div>
                <p class="text-slate-500 text-[11px] font-bold mb-0.5">إجمالي السجلات</p>
                <p class="text-lg font-black leading-none text-amber-600">{{ $stats['total'] ?? 0 }}</p>
            </div>
        </div>
    </div>
    @endif

    <table class="w-full text-right border-collapse border border-slate-200 mt-2">
        <thead>
            <tr class="brand-bg">
                <th class="border border-slate-200 p-2 font-bold text-center w-8">م</th>
                <th class="border border-slate-200 p-2 font-bold text-center">التاريخ</th>
                <th class="border border-slate-200 p-2 font-bold text-center">الحصة</th>
                <th class="border border-slate-200 p-2 font-bold text-center">الشعبة</th>
                <th class="border border-slate-200 p-2 font-bold text-center">المعلم الغائب</th>
                <th class="border border-slate-200 p-2 font-bold text-center">المعلم البديل</th>
                <th class="border border-slate-200 p-2 font-bold text-center">نوع التغطية</th>
                <th class="border border-slate-200 p-2 font-bold text-center">الحالة</th>
            </tr>
        </thead>
        <tbody>
            @php $count = 1; @endphp
            @forelse($coverages as $coverage)
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="border border-slate-200 p-2 text-center text-sm">{{ $count++ }}</td>
                    <td class="border border-slate-200 p-2 text-center font-bold text-slate-800">
                        {{ \Carbon\Carbon::parse($coverage->coverage_date)->translatedFormat('l, d/m/Y') }}
                    </td>
                    <td class="border border-slate-200 p-2 text-center">
                        <div class="font-bold text-slate-800">{{ $coverage->period ? $coverage->period->period_name : '' }}</div>
                        @if($coverage->period)
                        <div class="text-[10px] text-slate-500 font-mono" dir="ltr">
                            {{ substr($coverage->period->start_time, 0, 5) }} - {{ substr($coverage->period->end_time, 0, 5) }}
                        </div>
                        @endif
                    </td>
                    <td class="border border-slate-200 p-2 text-center font-semibold text-slate-700">
                        @if($coverage->division)
                            {{ $coverage->division->grade->section->name }} / {{ $coverage->division->name }}
                        @else
                            -
                        @endif
                    </td>
                    <td class="border border-slate-200 p-2 text-center font-bold text-rose-700">
                        {{ $coverage->absentTeacher ? $coverage->absentTeacher->name : '-' }}
                    </td>
                    <td class="border border-slate-200 p-2 text-center font-bold text-emerald-700">
                        {{ $coverage->substituteTeacher ? $coverage->substituteTeacher->name : '-' }}
                    </td>
                    <td class="border border-slate-200 p-2 text-center">
                        @if($coverage->coverage_type === 'substitution')
                            <span class="text-primary-700 font-bold text-xs">نيابة عن</span>
                        @elseif($coverage->coverage_type === 'free')
                            <span class="text-amber-700 font-bold text-xs">حصة حرة</span>
                        @elseif($coverage->coverage_type === 'merged')
                            <span class="text-indigo-700 font-bold text-xs">دمج فصل</span>
                        @else
                            <span class="text-slate-700 font-bold text-xs">{{ $coverage->coverage_type }}</span>
                        @endif
                    </td>
                    <td class="border border-slate-200 p-2 text-center">
                        @if($coverage->substitute_notified)
                            <span class="text-emerald-600 font-bold text-xs">أُبلغ</span>
                        @else
                            <span class="text-amber-600 font-bold text-xs">لم يُبلَّغ</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="border border-slate-200 p-8 text-center text-slate-500 text-lg">
                        لا توجد سجلات تغطية واحتياط
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- التذييل والتواقيع والختم المعتمد -->
    @include('pdf.components.footer', [
        'branchId' => $branchId ?? null,
    ])
</body>
</html>
