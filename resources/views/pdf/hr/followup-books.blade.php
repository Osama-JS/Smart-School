<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $printSettings['title'] ?? 'تقرير رفع دفتر المتابعة وانضباط التحضير' }}</title>
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

        @media print {
            .no-print {
                display: none !important;
            }
            body {
                padding: 0.5rem !important;
                background-color: white !important;
            }
        }
    </style>
</head>
<body class="p-4 sm:p-8">
    @if(isset($autoPrint) && $autoPrint)
    <div class="no-print fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 text-white backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-xs font-bold border border-slate-700/80">
        <span class="flex items-center gap-2">📄 جاهز للطباعة أو الحفظ كملف PDF</span>
        <button onclick="window.print()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer">
            🖨️ طباعة / حفظ PDF
        </button>
        <button onclick="if(window.opener){window.close();}else if(window.history.length>1){window.history.back();}else{window.location.href='/hr/reports/followup-books';}" class="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer">
            ✕ إغلاق
        </button>
    </div>
    <script>
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.print();
            }, 600);
        });
    </script>
    @endif

    @if($watermark === 'confidential')
        <div class="watermark">ســـــري</div>
    @elseif($watermark === 'draft')
        <div class="watermark">مســــودة</div>
    @endif

    <!-- الترويسة الموحدة القابلة للتخصيص من الإدارة -->
    @include('pdf.components.header', [
        'title' => $printSettings['title'] ?? 'تقرير رفع دفتر المتابعة وانضباط التحضير',
        'departmentName' => 'الشؤون الأكاديمية والمتابعة',
        'startDate' => $periodStart ?? null,
        'endDate' => $periodEnd ?? null,
    ])
    </div>

    <!-- الإحصائيات (KPIs) -->
    @if(isset($printSettings['showKPIs']) && $printSettings['showKPIs'])
    <div class="grid grid-cols-4 gap-3 mb-8">
        <div class="bg-white border border-slate-300 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 bottom-0 w-1 opacity-80 brand-bg"></div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style="background-color: {{ $brandColor }}15; color: {{ $brandColor }}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div>
                <p class="text-slate-500 text-[11px] font-bold mb-0.5">التحضيرات المنجزة</p>
                <p class="text-lg font-black leading-none text-slate-800">{{ $kpis['total_published'] ?? 0 }}</p>
            </div>
        </div>
        
        <div class="bg-white border border-slate-300 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 bottom-0 w-1 opacity-80 brand-bg"></div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style="background-color: {{ $brandColor }}15; color: {{ $brandColor }}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div>
                <p class="text-slate-500 text-[11px] font-bold mb-0.5">تحضيرات متأخرة</p>
                <p class="text-lg font-black leading-none text-slate-800">{{ $kpis['total_late'] ?? 0 }}</p>
            </div>
        </div>
        
        <div class="bg-white border border-slate-300 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 bottom-0 w-1 opacity-80 brand-bg"></div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style="background-color: {{ $brandColor }}15; color: {{ $brandColor }}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <div>
                <p class="text-slate-500 text-[11px] font-bold mb-0.5">التقصير (غير محضر)</p>
                <p class="text-lg font-black leading-none text-slate-800">{{ $kpis['total_negligence'] ?? 0 }}</p>
            </div>
        </div>
        
        <div class="bg-white border border-slate-300 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 bottom-0 w-1 opacity-80 brand-bg"></div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style="background-color: {{ $brandColor }}15; color: {{ $brandColor }}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="overflow-hidden">
                <p class="text-slate-500 text-[11px] font-bold mb-0.5 truncate">المعلمين المخالفين</p>
                <p class="text-lg font-black leading-none text-slate-800">{{ $kpis['unique_teachers'] ?? 0 }}</p>
            </div>
        </div>
    </div>
    @endif

    <table class="w-full text-right border-collapse border border-slate-200 mt-2">
        <thead>
            <tr class="brand-bg">
                <th class="border border-slate-200 p-2 font-bold w-12 text-center">م</th>
                <th class="border border-slate-200 p-2 font-bold">اسم المعلم</th>
                <th class="border border-slate-200 p-2 font-bold text-center">الحصص المستهدفة</th>
                <th class="border border-slate-200 p-2 font-bold text-center">تم التحضير</th>
                <th class="border border-slate-200 p-2 font-bold text-center">تحضير متأخر</th>
                <th class="border border-slate-200 p-2 font-bold text-center">غير محضر (تقصير)</th>
            </tr>
        </thead>
        <tbody>
            @php $count = 1; @endphp
            @forelse($teachersData as $teacher)
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="border border-slate-200 p-2 text-center">{{ $count++ }}</td>
                    <td class="border border-slate-200 p-2 font-semibold">{{ $teacher['name'] }}</td>
                    <td class="border border-slate-200 p-2 text-center font-bold text-slate-700">{{ $teacher['total_weekly_lessons'] }}</td>
                    <td class="border border-slate-200 p-2 text-center font-bold text-emerald-600">{{ $teacher['published_preparations'] }}</td>
                    <td class="border border-slate-200 p-2 text-center font-bold text-amber-600">{{ $teacher['late_uploads'] }}</td>
                    <td class="border border-slate-200 p-2 text-center font-bold text-rose-600">{{ $teacher['negligence'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="border border-slate-200 p-8 text-center text-slate-500 text-lg">
                        لا توجد بيانات متاحة
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
