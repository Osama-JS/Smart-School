<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $printSettings['title'] ?? 'كشف استدعاء أولياء الأمور' }}</title>
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
                <h3 class="text-[11px] font-semibold text-slate-500 pr-3.5 flex items-center gap-1.5 mt-0.5">المركز الرئيسي <span class="w-1 h-1 rounded-full bg-slate-300"></span> قسم التوجيه والإرشاد الطلابي</h3>
                
                <div class="mt-3 pr-3 border-r-[3px] py-0.5 brand-border">
                    <h1 class="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap leading-none">
                        {{ $printSettings['title'] ?? 'كشف استدعاء أولياء الأمور' }}
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
                            <span class="font-black text-slate-800 text-[11px]" dir="ltr">PS-{{ date('y') }}0{{ rand(100, 999) }}</span>
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

    @php
        function getStatusBadge($status) {
            $statuses = [
                'scheduled' => ['label' => 'مجدول', 'color' => 'text-blue-800 bg-blue-100'],
                'attended' => ['label' => 'تم الحضور', 'color' => 'text-emerald-800 bg-emerald-100'],
                'no_show' => ['label' => 'لم يحضر', 'color' => 'text-rose-800 bg-rose-100'],
                'cancelled' => ['label' => 'ملغى', 'color' => 'text-slate-800 bg-slate-100']
            ];
            
            $s = $statuses[$status] ?? ['label' => $status, 'color' => 'text-gray-800 bg-gray-100'];
            return $s;
        }
    @endphp

    @if(count($summons) === 0)
        <div class="text-center p-8 mt-10 border border-slate-300 rounded bg-slate-50">
            <h2 class="text-xl font-bold text-slate-600">لا توجد استدعاءات مسجلة لهذه الفترة.</h2>
        </div>
    @else
        <table class="w-full text-right border-collapse border border-slate-300 text-sm mt-2">
            <thead>
                <tr class="brand-bg">
                    <th class="border border-slate-300 p-2 font-bold text-center w-12">م</th>
                    <th class="border border-slate-300 p-2 font-bold w-24">تاريخ الاستدعاء</th>
                    <th class="border border-slate-300 p-2 font-bold w-48">اسم الطالب</th>
                    <th class="border border-slate-300 p-2 font-bold w-32">الصف / الشعبة</th>
                    <th class="border border-slate-300 p-2 font-bold">سبب الاستدعاء</th>
                    <th class="border border-slate-300 p-2 font-bold text-center w-24">الحالة</th>
                    <th class="border border-slate-300 p-2 font-bold text-center w-32">توقيع ولي الأمر</th>
                </tr>
            </thead>
            <tbody>
                @foreach($summons as $index => $summon)
                    @php $statusInfo = getStatusBadge($summon['status']); @endphp
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="border border-slate-300 p-2 text-center font-bold">{{ $index + 1 }}</td>
                        <td class="border border-slate-300 p-2" dir="ltr">
                            <div class="font-bold text-slate-800 text-right">{{ \Carbon\Carbon::parse($summon['summon_date'])->format('Y-m-d') }}</div>
                        </td>
                        <td class="border border-slate-300 p-2">
                            <div class="font-bold text-slate-900">{{ $summon['student']['user']['name'] ?? 'غير معروف' }}</div>
                        </td>
                        <td class="border border-slate-300 p-2">
                            {{ $summon['student']['active_enrollment']['division']['grade']['name'] ?? '' }} - 
                            {{ $summon['student']['active_enrollment']['division']['name'] ?? '' }}
                        </td>
                        <td class="border border-slate-300 p-2">
                            @if(isset($summon['violation']['violation_type']['name']))
                                <div class="text-xs font-bold text-rose-600 mb-1">
                                    مخالفة: {{ $summon['violation']['violation_type']['name'] }}
                                </div>
                            @endif
                            <div class="text-slate-800">{{ $summon['reason'] }}</div>
                        </td>
                        <td class="border border-slate-300 p-2 text-center">
                            <span class="inline-block px-2 py-1 rounded text-xs font-bold {{ $statusInfo['color'] }}">
                                {{ $statusInfo['label'] }}
                            </span>
                        </td>
                        <td class="border border-slate-300 p-2 text-center"></td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Print Footer / Signatures -->
        <div class="flex justify-between items-end p-4 mt-12 w-full page-break-inside-avoid">
            <div class="text-center w-48">
                <h4 class="font-bold text-slate-800 mb-8">المرشد الطلابي</h4>
                <div class="border-b border-black w-full mb-2"></div>
                <p class="text-sm text-slate-600">الاسم والتوقيع</p>
            </div>
            
            <div class="text-center w-48">
                <h4 class="font-bold text-slate-800 mb-8">مدير المدرسة</h4>
                <div class="border-b border-black w-full mb-2"></div>
                <p class="text-sm text-slate-600">الختم والتوقيع</p>
            </div>
        </div>
    @endif
</body>
</html>
