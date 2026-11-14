<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $printSettings['title'] ?? 'الجدول المدرسي العام' }}</title>
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

        /* Subject Colors corresponding to the ones in React */
        .color-blue { background-image: linear-gradient(to bottom right, #eff6ff, #dbeafe); border-color: #bfdbfe; color: #1e3a8a; }
        .color-emerald { background-image: linear-gradient(to bottom right, #ecfdf5, #d1fae5); border-color: #a7f3d0; color: #064e3b; }
        .color-violet { background-image: linear-gradient(to bottom right, #f5f3ff, #ede9fe); border-color: #ddd6fe; color: #4c1d95; }
        .color-amber { background-image: linear-gradient(to bottom right, #fffbeb, #fef3c7); border-color: #fde68a; color: #78350f; }
        .color-rose { background-image: linear-gradient(to bottom right, #fff1f2, #ffe4e6); border-color: #fecdd3; color: #881337; }
        .color-cyan { background-image: linear-gradient(to bottom right, #ecfeff, #cffafe); border-color: #a5f3fc; color: #164e63; }
        .color-fuchsia { background-image: linear-gradient(to bottom right, #fdf4ff, #fae8ff); border-color: #f5d0fe; color: #701a75; }
        .color-default { background-image: linear-gradient(to bottom right, #f8fafc, #f1f5f9); border-color: #e2e8f0; color: #334155; }
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
        'title' => $printSettings['title'] ?? 'الجدول المدرسي العام',
        'departmentName' => 'الشؤون الأكاديمية والجدول المدرسي',
    ])
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- معلومات الشعبة -->
    @if($division)
    <div class="mb-4 flex flex-col gap-1 items-start text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <span>الشعبة: {{ $division->grade->name }} - {{ $division->name }}</span>
    </div>
    @endif

    <table class="w-full text-right border-collapse border border-black/20 mt-2">
        <thead>
            <tr>
                <th class="brand-bg p-2 font-bold w-24 text-center border border-black/20 text-white">اليوم / الحصة</th>
                @foreach($periods as $period)
                    <th class="brand-bg p-2 font-bold text-center border border-black/20 text-white w-32">
                        <div class="mb-1 text-[13px] font-black">{{ $period->period_name }}</div>
                        <div class="text-[10px] text-white/80 font-bold" dir="ltr">
                            {{ substr($period->start_time, 0, 5) }} - {{ substr($period->end_time, 0, 5) }}
                        </div>
                    </th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($workingDays as $day)
                <tr>
                    <td class="brand-bg p-2 font-black text-white text-center border border-black/20">
                        {{ $daysTranslation[$day] ?? $day }}
                    </td>
                    @foreach($periods as $period)
                        @php
                            $slot = collect($timetable)->first(function($t) use ($day, $period) {
                                return $t->day_of_week === $day && $t->period_id === $period->id;
                            });
                            
                            $isBreak = $period->is_break || str_contains($period->period_name, 'فسحة') || str_contains($period->period_name, 'استراحة') || str_contains($period->period_name, 'صلاة');
                        @endphp
                        
                        @if($isBreak)
                            <td class="p-0 border border-black/20 text-center">
                                <div class="w-full h-full min-h-[60px] flex items-center justify-center bg-slate-100">
                                    <span class="font-black text-black text-sm tracking-wide">{{ $period->period_name }}</span>
                                </div>
                            </td>
                        @else
                            <td class="p-0 border border-black/20">
                                @if($slot)
                                    @php
                                        $icon = $slot->subject ? $slot->subject->icon : '';
                                        $colorClass = 'color-default';
                                        if (in_array($icon, ['Calculator', 'Binary'])) $colorClass = 'color-blue';
                                        elseif (in_array($icon, ['FlaskConical', 'Dna', 'Microscope'])) $colorClass = 'color-emerald';
                                        elseif (in_array($icon, ['BookOpen', 'Languages'])) $colorClass = 'color-violet';
                                        elseif (in_array($icon, ['History', 'Globe2', 'Compass'])) $colorClass = 'color-amber';
                                        elseif (in_array($icon, ['Palette', 'Music'])) $colorClass = 'color-rose';
                                        elseif (in_array($icon, ['Monitor', 'Laptop'])) $colorClass = 'color-cyan';
                                        elseif (in_array($icon, ['Trophy', 'Activity'])) $colorClass = 'color-fuchsia';
                                    @endphp
                                    <div class="min-h-[60px] p-2 flex flex-col justify-between h-full border-l-4 {{ $colorClass }}" style="border-left-width: 4px; border-left-color: inherit;">
                                        <div class="font-black text-[12px] mb-1 leading-tight">{{ $slot->subject ? $slot->subject->name : 'بدون مادة' }}</div>
                                        <div class="flex items-center gap-1 mt-auto">
                                            <span class="text-[10px] font-bold opacity-80 truncate">{{ $slot->teacher ? $slot->teacher->name : 'لم يتم تحديد المعلم' }}</span>
                                        </div>
                                    </div>
                                @else
                                    <div class="min-h-[60px] flex items-center justify-center">
                                        <span class="text-[11px] font-bold text-slate-400">فارغ</span>
                                    </div>
                                @endif
                            </td>
                        @endif
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- التذييل والتواقيع والختم المعتمد -->
    @include('pdf.components.footer', [
        'branchId' => $branchId ?? null,
    ])
</body>
</html>
