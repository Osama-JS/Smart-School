<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>محضر اجتماع - {{ $meeting->title }}</title>
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
                <h3 class="text-[11px] font-semibold text-slate-500 pr-3.5 flex items-center gap-1.5 mt-0.5">المركز الرئيسي <span class="w-1 h-1 rounded-full bg-slate-300"></span> الشؤون الإدارية</h3>
                
                <div class="mt-3 pr-3 border-r-[3px] py-0.5 brand-border">
                    <h1 class="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap leading-none">
                        محضر اجتماع: {{ $meeting->title }}
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
                            <span class="font-black text-slate-800 text-[11px]" dir="ltr">MR-{{ date('y') }}-{{ str_pad($meeting->id, 4, '0', STR_PAD_LEFT) }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تاريخ الطباعة</span>
                            <span class="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">{{ date('d/m/Y') }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">العام الدراسي</span>
                            <span class="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">2026-2027</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Meeting Info -->
    <div class="grid grid-cols-4 gap-4 mb-8">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p class="text-xs text-slate-500 mb-1 font-bold">التاريخ</p>
            <p class="text-slate-800 font-bold" dir="ltr">
                @php $dateObj = \Carbon\Carbon::parse($meeting->date); @endphp
                {{ $dateObj->format('Y-m-d') }}
            </p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p class="text-xs text-slate-500 mb-1 font-bold">الوقت</p>
            <p class="text-slate-800 font-bold" dir="ltr">
                @php
                    $timeVal = $meeting->time;
                    if ($timeVal) {
                        $timeObj = is_string($timeVal) ? \Carbon\Carbon::parse($timeVal) : $timeVal;
                        echo $timeObj->format('h:i A');
                    }
                @endphp
            </p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p class="text-xs text-slate-500 mb-1 font-bold">النوع</p>
            <p class="text-slate-800 font-bold">
                {{ $meeting->type === 'online' ? 'عن بعد' : 'حضوري' }}
            </p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p class="text-xs text-slate-500 mb-1 font-bold">المنسق</p>
            <p class="text-slate-800 font-bold">
                {{ $meeting->supervisor ? $meeting->supervisor->name : '-' }}
            </p>
        </div>
    </div>

    <!-- Details Sections -->
    <div class="space-y-6">
        <div>
            <h3 class="text-lg font-bold brand-text mb-2 flex items-center gap-2">
                <span class="w-6 h-6 rounded brand-bg text-white flex items-center justify-center text-sm">1</span>
                جدول الأعمال
            </h3>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                @if($meeting->agendas && count($meeting->agendas) > 0)
                    <ul class="list-disc list-inside space-y-2 text-slate-800 font-medium">
                        @foreach($meeting->agendas as $agenda)
                            <li>{{ $agenda }}</li>
                        @endforeach
                    </ul>
                @else
                    <p class="text-slate-500 text-sm">لم يتم تحديد جدول أعمال.</p>
                @endif
            </div>
        </div>

        <div>
            <h3 class="text-lg font-bold brand-text mb-2 flex items-center gap-2">
                <span class="w-6 h-6 rounded brand-bg text-white flex items-center justify-center text-sm">2</span>
                القرارات والنتائج (Outcomes)
            </h3>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                @if($meeting->outcomes)
                    <div class="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">{!! $meeting->outcomes !!}</div>
                @else
                    <p class="text-slate-500 text-sm">لم يتم تدوين قرارات أو نتائج بعد.</p>
                @endif
            </div>
        </div>

        <div>
            <h3 class="text-lg font-bold brand-text mb-2 flex items-center gap-2">
                <span class="w-6 h-6 rounded brand-bg text-white flex items-center justify-center text-sm">3</span>
                التوصيات (Recommendations)
            </h3>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                @if($meeting->recommendations)
                    <div class="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">{!! $meeting->recommendations !!}</div>
                @else
                    <p class="text-slate-500 text-sm">لم يتم تدوين توصيات بعد.</p>
                @endif
            </div>
        </div>

        <div>
            <h3 class="text-lg font-bold brand-text mb-2 flex items-center gap-2 mt-4">
                <span class="w-6 h-6 rounded brand-bg text-white flex items-center justify-center text-sm">4</span>
                كشف الحضور والغياب
            </h3>
            <table class="w-full text-right border-collapse border border-slate-200 mt-2">
                <thead>
                    <tr class="brand-bg">
                        <th class="border border-slate-200 p-2 font-bold w-12 text-center">م</th>
                        <th class="border border-slate-200 p-2 font-bold">الاسم</th>
                        <th class="border border-slate-200 p-2 font-bold text-center">حالة الحضور</th>
                    </tr>
                </thead>
                <tbody>
                    @php $count = 1; @endphp
                    @forelse($meeting->participants as $participant)
                        <tr class="hover:bg-slate-50 transition-colors">
                            <td class="border border-slate-200 p-2 text-center">{{ $count++ }}</td>
                            <td class="border border-slate-200 p-2 font-bold text-slate-800">{{ $participant->user ? $participant->user->name : 'غير معروف' }}</td>
                            <td class="border border-slate-200 p-2 text-center">
                                @if($participant->attendance_status === 'attended')
                                    <span class="text-emerald-600 font-bold">حاضر</span>
                                @elseif($participant->attendance_status === 'absent')
                                    <span class="text-rose-600 font-bold">غائب</span>
                                @else
                                    <span class="text-amber-600 font-bold">قيد الانتظار</span>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="3" class="border border-slate-200 p-6 text-center text-slate-500">لا يوجد مدعوين لهذا الاجتماع</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        
        <!-- Signatures Section -->
        <div class="mt-16 grid grid-cols-3 gap-8 text-center px-8">
            <div>
                <p class="font-bold text-slate-600 mb-8">أمين سر الاجتماع</p>
                <p class="border-b-2 border-slate-300 w-32 mx-auto"></p>
            </div>
            <div>
                <p class="font-bold text-slate-600 mb-8">رئيس الاجتماع (المنسق)</p>
                <p class="text-slate-800 font-bold mb-2">{{ $meeting->supervisor ? $meeting->supervisor->name : '' }}</p>
                <p class="border-b-2 border-slate-300 w-32 mx-auto"></p>
            </div>
            <div>
                <p class="font-bold text-slate-600 mb-8">مدير المدرسة</p>
                <p class="border-b-2 border-slate-300 w-32 mx-auto"></p>
            </div>
        </div>

    </div>
</body>
</html>
