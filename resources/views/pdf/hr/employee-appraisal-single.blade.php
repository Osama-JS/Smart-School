<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>استمارة تقييم الأداء الوظيفي - {{ $appraisal->employee->user->name ?? '' }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        body {
            font-family: 'Amiri', serif;
            background-color: white;
            color: #1e293b;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .brand-bg { background-color: {{ $brandColor ?? '#1e293b' }}; color: white; }
        .brand-border { border-color: {{ $brandColor ?? '#1e293b' }}; }
        table { page-break-inside: auto; }
        tr, .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    </style>
</head>
<body class="p-4 sm:p-6">
    @php
        $resolveSignatureSrc = function ($sig) {
            if (!$sig) return null;
            if (str_starts_with($sig, 'data:image')) return $sig;
            $storagePath = storage_path('app/public/' . ltrim($sig, '/'));
            if (file_exists($storagePath)) {
                $mime = str_ends_with(strtolower($storagePath), '.jpg') || str_ends_with(strtolower($storagePath), '.jpeg')
                    ? 'image/jpeg'
                    : 'image/png';
                return 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($storagePath));
            }
            return asset('storage/' . ltrim($sig, '/'));
        };

        $getGradeLabel = function ($score) {
            if ($score === null) return ['label' => 'قيد التقييم', 'cls' => 'bg-slate-100 text-slate-600'];
            if ($score >= 90) return ['label' => 'ممتاز', 'cls' => 'bg-emerald-50 text-emerald-700 border-emerald-200'];
            if ($score >= 80) return ['label' => 'جيد جداً', 'cls' => 'bg-blue-50 text-blue-700 border-blue-200'];
            if ($score >= 70) return ['label' => 'جيد', 'cls' => 'bg-amber-50 text-amber-700 border-amber-200'];
            if ($score >= 60) return ['label' => 'مقبول', 'cls' => 'bg-orange-50 text-orange-700 border-orange-200'];
            return ['label' => 'يحتاج تحسين', 'cls' => 'bg-rose-50 text-rose-700 border-rose-200'];
        };

        $statusLabels = [
            'pending_self' => 'بانتظار التقييم الذاتي',
            'pending_manager' => 'بانتظار تقييم المدير / اللجنة',
            'pending_hr' => 'بانتظار اعتماد الموارد البشرية',
            'completed' => 'مكتمل ومعتمد',
        ];

        $grade = $getGradeLabel($appraisal->final_score);
        $recLabel = \App\Models\EmployeeAppraisal::recommendationLabel($appraisal->final_recommendation);
        $att = $integrationData['attendance_summary'] ?? [];
        $acad = $integrationData['academic'] ?? [];
        $suggested = $integrationData['suggested_metrics'] ?? [];
    @endphp

    <!-- Header -->
    <div class="relative mb-6 pb-4 border-b-2 brand-border">
        <div class="flex justify-between items-start">
            <div class="w-[42%]">
                <p class="text-[11px] font-bold text-slate-600">الجمهورية اليمنية — وزارة التربية والتعليم والبحث العلمي</p>
                <h2 class="text-lg font-black text-slate-900 mt-1">مدارس القيم الأهلية</h2>
                <p class="text-[11px] font-semibold text-slate-500">الشؤون الإدارية والموارد البشرية</p>
                <div class="mt-3 pr-3 border-r-[3px] brand-border">
                    <h1 class="text-xl font-black text-slate-900">استمارة تقييم الأداء الوظيفي الفردية</h1>
                </div>
            </div>

            <div class="w-[16%] flex justify-center">
                <div class="w-16 h-16 flex items-center justify-center">
                    <img src="http://localhost/Smart-School/public/images/logo.png" alt="شعار المدرسة" class="w-full h-full object-contain" onerror="this.style.display='none'" />
                </div>
            </div>

            <div class="w-[42%] flex justify-end">
                <div class="w-full max-w-[230px] border border-slate-300 rounded-lg p-2.5 text-[11px] space-y-1.5 bg-slate-50/50">
                    <div class="flex justify-between">
                        <span class="text-slate-500 font-bold">رقم الاستمارة:</span>
                        <span class="font-black" dir="ltr">APP-{{ str_pad((string)$appraisal->id, 5, '0', STR_PAD_LEFT) }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500 font-bold">دورة التقييم:</span>
                        <span class="font-bold">{{ $appraisal->cycle->title ?? '—' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500 font-bold">الحالة:</span>
                        <span class="font-bold">{{ $statusLabels[$appraisal->status] ?? $appraisal->status }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500 font-bold">الدرجة النهائية:</span>
                        <span class="font-black">{{ $appraisal->final_score !== null ? $appraisal->final_score . '% (' . $grade['label'] . ')' : '—' }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Employee Info Card -->
    <div class="avoid-break mb-5 border border-slate-200 rounded-xl p-3 bg-slate-50/60">
        <div class="grid grid-cols-4 gap-3 text-xs">
            <div>
                <span class="text-slate-500 block text-[10px] font-bold">اسم الموظف</span>
                <strong class="text-slate-900">{{ $appraisal->employee->user->name ?? '—' }}</strong>
            </div>
            <div>
                <span class="text-slate-500 block text-[10px] font-bold">الرقم الوظيفي / الهوية</span>
                <strong class="text-slate-900">{{ $appraisal->employee->user->id_number ?? '—' }}</strong>
            </div>
            <div>
                <span class="text-slate-500 block text-[10px] font-bold">القسم والدرجة الوظيفية</span>
                <strong class="text-slate-900">{{ $appraisal->employee->department->name ?? '—' }} — {{ $appraisal->employee->jobGrade->name ?? '—' }}</strong>
            </div>
            <div>
                <span class="text-slate-500 block text-[10px] font-bold">المدير المباشر / القالب</span>
                <strong class="text-slate-900">{{ $appraisal->manager->user->name ?? 'الإدارة' }} ({{ $appraisal->template->title ?? 'عام' }})</strong>
            </div>
        </div>
    </div>

    <!-- 360 Snapshot Summary -->
    <div class="avoid-break mb-5 border border-slate-200 rounded-xl p-3">
        <h3 class="text-xs font-black text-slate-800 mb-2 border-b border-slate-100 pb-1">ملخص مؤشرات الأداء الفعلية (360°) خلال فترة الدورة</h3>
        <div class="grid grid-cols-5 gap-2 text-center text-xs">
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-100">
                <div class="text-[10px] text-slate-500 font-bold">الالتزام بالحضور</div>
                <div class="font-black text-slate-900">{{ $att['attendance_rate'] ?? 100 }}%</div>
                <div class="text-[9px] text-slate-500">غياب: {{ $att['absent_days'] ?? 0 }} | تأخر: {{ $att['late_days'] ?? 0 }}</div>
            </div>
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-100">
                <div class="text-[10px] text-slate-500 font-bold">المخالفات / الإنجازات</div>
                <div class="font-black text-slate-900">{{ ($integrationData['violations'] ?? collect())->count() }} / {{ ($integrationData['achievements'] ?? collect())->count() }}</div>
            </div>
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-100">
                <div class="text-[10px] text-slate-500 font-bold">التقييم الذاتي</div>
                <div class="font-black text-amber-700">{{ $appraisal->self_score !== null ? round($appraisal->self_score) . '%' : '—' }}</div>
            </div>
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-100">
                <div class="text-[10px] text-slate-500 font-bold">متوسط لجنة التقييم</div>
                <div class="font-black text-blue-700">{{ $appraisal->manager_score !== null ? $appraisal->manager_score . '%' : '—' }}</div>
            </div>
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-100">
                <div class="text-[10px] text-slate-500 font-bold">المؤشر الاسترشادي</div>
                <div class="font-black text-emerald-700">{{ $suggested['score_pct'] ?? '—' }}% ({{ $suggested['score_5'] ?? '—' }}/5)</div>
            </div>
        </div>
        @if(!empty($acad['has_academic_data']))
            <div class="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px] text-slate-700">
                <div>دفاتر التحضير المنشورة: <strong>{{ $acad['preparations_published'] ?? 0 }}/{{ $acad['preparations_total'] ?? 0 }}</strong> (متوسط: <strong>{{ $acad['preparations_avg_rating'] ?? '—' }}/5</strong>)</div>
                <div>الزيارات الصفية: <strong>{{ $acad['visits_total'] ?? 0 }}</strong> (متوسط: <strong>{{ $acad['visits_avg_score'] ?? '—' }}%</strong>)</div>
                <div>الخطط الدراسية المعتمدة: <strong>{{ $acad['study_plans_approved'] ?? 0 }}/{{ $acad['study_plans_total'] ?? 0 }}</strong></div>
            </div>
        @endif
    </div>

    <!-- Committee Evaluators -->
    @if($appraisal->evaluators && $appraisal->evaluators->count() > 0)
        <div class="avoid-break mb-5">
            <h3 class="text-xs font-black text-slate-800 mb-2">أعضاء لجنة التقييم والأوزان النسبية</h3>
            <table class="w-full text-right border-collapse border border-slate-200 text-[11px]">
                <thead>
                    <tr class="bg-slate-100 text-slate-700">
                        <th class="border border-slate-200 p-1.5">المقيّم</th>
                        <th class="border border-slate-200 p-1.5 text-center">الصفة</th>
                        <th class="border border-slate-200 p-1.5 text-center">الوزن</th>
                        <th class="border border-slate-200 p-1.5 text-center">الحالة</th>
                        <th class="border border-slate-200 p-1.5 text-center">نتيجته</th>
                        <th class="border border-slate-200 p-1.5">الملاحظات العامة</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($appraisal->evaluators as $ev)
                        <tr>
                            <td class="border border-slate-200 p-1.5 font-bold">{{ $ev->user->name ?? 'مقيّم' }}</td>
                            <td class="border border-slate-200 p-1.5 text-center">{{ \App\Models\EmployeeAppraisalEvaluator::ROLE_LABELS[$ev->role_type] ?? $ev->role_type }}</td>
                            <td class="border border-slate-200 p-1.5 text-center font-bold">{{ $ev->weight }}</td>
                            <td class="border border-slate-200 p-1.5 text-center">{{ $ev->status === 'submitted' ? 'مكتمل' : 'قيد الانتظار' }}</td>
                            <td class="border border-slate-200 p-1.5 text-center font-bold">{{ $ev->calculated_score !== null ? $ev->calculated_score . '%' : '—' }}</td>
                            <td class="border border-slate-200 p-1.5">{{ $ev->comments ?: '—' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    <!-- Criteria & Scores Table -->
    <div class="mb-5">
        <h3 class="text-xs font-black text-slate-800 mb-2">معايير التقييم والدرجات التفصيلية</h3>
        <table class="w-full text-right border-collapse border border-slate-200 text-[11px]">
            <thead>
                <tr class="brand-bg">
                    <th class="border border-slate-200 p-2 w-8 text-center">م</th>
                    <th class="border border-slate-200 p-2">المعيار والتصنيف</th>
                    <th class="border border-slate-200 p-2 text-center w-14">الوزن</th>
                    <th class="border border-slate-200 p-2 text-center w-24">الذاتي وشواهده</th>
                    <th class="border border-slate-200 p-2">تقييمات وملاحظات اللجنة</th>
                    <th class="border border-slate-200 p-2 text-center w-20">المتوسط الموزون</th>
                </tr>
            </thead>
            <tbody>
                @foreach($appraisal->scores as $idx => $scoreItem)
                    <tr>
                        <td class="border border-slate-200 p-2 text-center font-bold">{{ $idx + 1 }}</td>
                        <td class="border border-slate-200 p-2">
                            <div class="font-bold text-slate-900">{{ $scoreItem->kpi->name ?? 'معيار' }}</div>
                            <div class="text-[10px] text-slate-500">{{ $scoreItem->kpi->category ?? 'الأداء الوظيفي' }}</div>
                        </td>
                        <td class="border border-slate-200 p-2 text-center font-bold">{{ $scoreItem->kpi->weight ?? 0 }}</td>
                        <td class="border border-slate-200 p-2 text-center">
                            <div class="font-bold">{{ $scoreItem->self_score !== null ? $scoreItem->self_score . '/5' : '—' }}</div>
                            @if($scoreItem->self_note)
                                <div class="text-[10px] text-slate-500 mt-0.5">{{ $scoreItem->self_note }}</div>
                            @endif
                        </td>
                        <td class="border border-slate-200 p-2">
                            @if($scoreItem->evaluatorScores && $scoreItem->evaluatorScores->count() > 0)
                                <div class="space-y-1">
                                    @foreach($scoreItem->evaluatorScores as $es)
                                        <div class="text-[10px]">
                                            <strong>{{ $es->evaluator->user->name ?? 'مقيّم' }}</strong>
                                            ({{ \App\Models\EmployeeAppraisalEvaluator::ROLE_LABELS[$es->evaluator->role_type ?? 'committee'] ?? '' }}):
                                            <span class="font-black text-blue-700">{{ $es->score }}/5</span>
                                            @if($es->note) — <span class="text-slate-600">{{ $es->note }}</span> @endif
                                        </div>
                                    @endforeach
                                </div>
                            @elseif($scoreItem->manager_note)
                                <span class="text-[10px] text-slate-600">{{ $scoreItem->manager_note }}</span>
                            @else
                                <span class="text-slate-400">—</span>
                            @endif
                        </td>
                        <td class="border border-slate-200 p-2 text-center font-black text-slate-900">
                            {{ $scoreItem->manager_score !== null ? $scoreItem->manager_score . '/5' : '—' }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- IDP & Final Recommendation -->
    <div class="avoid-break mb-5 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
        <div class="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h3 class="font-black text-slate-800">خطة التطوير الفردية (IDP) والتوصية الإدارية النهائية</h3>
            <span class="px-2.5 py-0.5 rounded-lg font-black text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                التوصية: {{ $recLabel ?: 'غير محددة' }}
            </span>
        </div>
        <div class="grid grid-cols-3 gap-3 text-[11px]">
            <div class="bg-slate-50 rounded-lg p-2">
                <strong class="block text-emerald-700 mb-1">نقاط القوة</strong>
                <p class="text-slate-700">{{ $appraisal->strengths ?: '—' }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-2">
                <strong class="block text-amber-700 mb-1">فرص التحسين</strong>
                <p class="text-slate-700">{{ $appraisal->improvement_areas ?: '—' }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-2">
                <strong class="block text-indigo-700 mb-1">الدورات التدريبية المقترحة</strong>
                <p class="text-slate-700">{{ $appraisal->recommended_training ?: '—' }}</p>
            </div>
        </div>
        @if($appraisal->hr_comments)
            <div class="text-[11px] bg-purple-50/50 rounded-lg p-2 border border-purple-100">
                <strong class="text-purple-800">ملاحظات الموارد البشرية:</strong> {{ $appraisal->hr_comments }}
            </div>
        @endif
    </div>

    <!-- Signatures -->
    <div class="avoid-break grid grid-cols-3 gap-4 text-center text-[11px] pt-2">
        <div class="border border-slate-200 rounded-xl p-2.5">
            <div class="font-bold text-slate-500 mb-1">إقرار الموظف</div>
            <div class="h-14 flex items-center justify-center border-b border-dashed border-slate-200 mb-1">
                @if($sigSrc = $resolveSignatureSrc($appraisal->employee_signature))
                    <img src="{{ $sigSrc }}" class="max-h-12 object-contain" alt="توقيع الموظف" />
                @else
                    <span class="text-slate-400">—</span>
                @endif
            </div>
            <div class="font-bold text-slate-800">{{ $appraisal->employee->user->name ?? '—' }}</div>
        </div>

        <div class="border border-slate-200 rounded-xl p-2.5">
            <div class="font-bold text-slate-500 mb-1">اعتماد المدير / اللجنة</div>
            <div class="h-14 flex items-center justify-center border-b border-dashed border-slate-200 mb-1">
                @php
                    $committeeSig = $appraisal->evaluators?->firstWhere('signature', '!=', null)?->signature ?? $appraisal->manager_signature;
                @endphp
                @if($sigSrc = $resolveSignatureSrc($committeeSig))
                    <img src="{{ $sigSrc }}" class="max-h-12 object-contain" alt="توقيع المدير" />
                @else
                    <span class="text-slate-400">—</span>
                @endif
            </div>
            <div class="font-bold text-slate-800">{{ $appraisal->manager->user->name ?? 'لجنة التقييم' }}</div>
        </div>

        <div class="border border-slate-200 rounded-xl p-2.5">
            <div class="font-bold text-slate-500 mb-1">الاعتماد النهائي (HR)</div>
            <div class="h-14 flex items-center justify-center border-b border-dashed border-slate-200 mb-1">
                @if($sigSrc = $resolveSignatureSrc($appraisal->hr_signature))
                    <img src="{{ $sigSrc }}" class="max-h-12 object-contain" alt="توقيع الموارد البشرية" />
                @else
                    <span class="text-slate-400">—</span>
                @endif
            </div>
            <div class="font-bold text-slate-800">{{ $appraisal->hr->name ?? 'الموارد البشرية' }}</div>
        </div>
    </div>
</body>
</html>
