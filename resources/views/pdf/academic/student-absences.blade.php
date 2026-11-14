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

    <!-- الترويسة الموحدة القابلة للتخصيص من الإدارة -->
    @include('pdf.components.header', [
        'title' => $printSettings['title'] ?? 'تقرير غياب الطلاب',
        'departmentName' => 'الشؤون الأكاديمية والطلاب',
        'date' => $date ?? null,
    ])

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

    <!-- التذييل والتواقيع والختم المعتمد -->
    @include('pdf.components.footer', [
        'branchId' => $branchId ?? null,
    ])
</body>
</html>
