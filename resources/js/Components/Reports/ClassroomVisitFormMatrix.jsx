import React from 'react';

export const CLASSROOM_VISIT_ROWS = [
    {
        id: '1_a',
        domain: 'تخطيط الدرس',
        domainRowSpan: 2,
        number: '1',
        numberRowSpan: 2,
        criterion: 'يضع خطة دراسية متكاملة العناصر',
        criterionRowSpan: 2,
        indicators: ['حسب تطبيق المدرسة الإلكتروني .'],
        maxScore: 4,
    },
    {
        id: '1_b',
        domain: 'تخطيط الدرس',
        domainRowSpan: 0,
        number: '1',
        numberRowSpan: 0,
        criterion: 'يضع خطة دراسية متكاملة العناصر',
        criterionRowSpan: 0,
        indicators: [
            'يستخدم أنشطة تحفز التفكير .',
            'شمولية الأهداف بمستوياتها العليا والدنيا .',
            'السير حسب الخطة الفصلية .',
        ],
        maxScore: 6,
    },
    {
        id: '2',
        domain: 'الأداء التدريسي المباشر للمعلم',
        domainRowSpan: 9,
        number: '2',
        numberRowSpan: 1,
        criterion: 'يمهد بشكل مشوق',
        criterionRowSpan: 1,
        indicators: [
            'يبدأ الموضوع ( سؤال مثير - قصة - لغز - فكرة عامة ..... ) .',
            'يستدعي خبرات سابقة - يحفز الفضول لدى المتعلمين .',
            'تقديم فكرة عامة عن الدرس .',
        ],
        maxScore: 4,
    },
    {
        id: '3',
        domain: 'الأداء التدريسي المباشر للمعلم',
        domainRowSpan: 0,
        number: '3',
        numberRowSpan: 1,
        criterion: 'يلم بالمادة العلمية',
        criterionRowSpan: 1,
        indicators: [
            'شرح مفصل للمفاهيم والقدرة على إيصالها .',
            'دقة المعلومات وتسلسلها منطقياً - استخدام استراتيجيات مختلفة .',
            'توفير أمثلة توضيحية واضحة .',
        ],
        maxScore: 8,
    },
    {
        id: '4',
        domain: 'الأداء التدريسي المباشر للمعلم',
        domainRowSpan: 0,
        number: '4',
        numberRowSpan: 1,
        criterion: 'يستخدم طرائق تدريس قائمة على تفعيل دور المتعلم',
        criterionRowSpan: 1,
        indicators: [
            'تنظيم نقاشات جماعية - استخدام أنشطة متنوعة توجه المتعلمين لاكتشاف إجاباتهم بأنفسهم - تشجيع المتعلمين على طرح الأسئلة .',
        ],
        maxScore: 3,
    },
    {
        id: '5',
        domain: 'الأداء التدريسي المباشر للمعلم',
        domainRowSpan: 0,
        number: '5',
        numberRowSpan: 1,
        criterion: 'يربط موضوعات الدرس بالقيم والمهارات الحياتية وخبرات الطلاب',
        criterionRowSpan: 1,
        indicators: [
            'تعزيز القيم السلوكية المرتبطة بالدرس - ضرب أمثلة حياتية .',
            'تشجيع المتعلمين على تقديم أمثلة من حياتهم .',
        ],
        maxScore: 3,
    },
    {
        id: '6',
        domain: 'الأداء التدريسي المباشر للمعلم',
        domainRowSpan: 0,
        number: '6',
        numberRowSpan: 1,
        criterion: 'يستجيب لاحتياجات المتعلمين',
        criterionRowSpan: 1,
        indicators: [
            'الاستجابة لتساؤلات المتعلمين ويدعمهم بشكل فوري .',
            'استخدام أنشطة تناسب احتياجهم - تقديم دعم فردي .',
        ],
        maxScore: 6,
    },
    {
        id: '7',
        domain: 'الأداء التدريسي المباشر للمعلم',
        domainRowSpan: 0,
        number: '7',
        numberRowSpan: 1,
        criterion: 'يتمكن من إدارة الصف',
        criterionRowSpan: 1,
        indicators: [
            'تحديد قواعد صفية واضحة - ضبط صفه بشكل تربوي .',
            'التعامل مع المشكلات بطرق تربوية فعالة - يطبق العقوبات بشكل عادل - تنويع التعزيز الإيجابي .',
        ],
        maxScore: 8,
    },
    {
        id: '8',
        domain: 'الأداء التدريسي المباشر للمعلم',
        domainRowSpan: 0,
        number: '8',
        numberRowSpan: 1,
        criterion: 'يوظف مهارات الاتصال والتواصل',
        criterionRowSpan: 1,
        indicators: [
            'استخدام لغة واضحة ومفهومة - استخدام إيماءات وحركات اليد للتوضيح - النشاط والحيوية .',
        ],
        maxScore: 8,
    },
    {
        id: '9',
        domain: 'الأداء التدريسي المباشر للمعلم',
        domainRowSpan: 0,
        number: '9',
        numberRowSpan: 1,
        criterion: 'يهيئ بيئة صفية مناسبة للدرس',
        criterionRowSpan: 1,
        indicators: [
            'التأكد من تهيئة المكان وتنظيمه - التأكد من إضاءة المكان وتهويته .',
            'تهيئة جو من الراحة النفسية .',
        ],
        maxScore: 4,
    },
    {
        id: '10',
        domain: 'الأداء التدريسي المباشر للمعلم',
        domainRowSpan: 0,
        number: '10',
        numberRowSpan: 1,
        criterion: 'يوظف الوسائل والتقنيات بفاعلية',
        criterionRowSpan: 1,
        indicators: [
            'تفعيل السبورة بشكل منظم - تنويع الوسائل المستخدمة .',
            'يوظف الوسائط [ السمعية - المرئية ] - استخدام تطبيقات تعليمية .',
        ],
        maxScore: 6,
    },
    {
        id: '11',
        domain: 'فاعلية أساليب التقويم',
        domainRowSpan: 5,
        number: '11',
        numberRowSpan: 1,
        criterion: 'يقيم أعمال المتعلمين الصفية',
        criterionRowSpan: 1,
        indicators: [
            'إجراء تقييمات دورية متنوعة للدرس .',
            'استخدام سجل التقييم لتشجيع المتعلمين .',
            'إغلاق الدرس بطرق فعالة .',
        ],
        maxScore: 8,
    },
    {
        id: '12',
        domain: 'فاعلية أساليب التقويم',
        domainRowSpan: 0,
        number: '12',
        numberRowSpan: 1,
        criterion: 'يهتم بالواجبات المنزلية',
        criterionRowSpan: 1,
        indicators: [
            'تقديم تغذية فورية على الواجب السابق .',
            'تحديد الواجبات بشكل واضح .',
            'متابعة إنجاز الواجبات بشكل منتظم .',
        ],
        maxScore: 3,
    },
    {
        id: '13',
        domain: 'فاعلية أساليب التقويم',
        domainRowSpan: 0,
        number: '13',
        numberRowSpan: 1,
        criterion: 'يتابع دفاتر المتعلمين بشكل دوري',
        criterionRowSpan: 1,
        indicators: [
            'تصحيح دفاتر وإنجازات المتعلمين بشكل دوري .',
            'كتابة ملاحظات مناسبة فعالة ( تعزيز - توجيه - تاريخ ...... ) .',
        ],
        maxScore: 5,
    },
    {
        id: '14',
        domain: 'فاعلية أساليب التقويم',
        domainRowSpan: 0,
        number: '14',
        numberRowSpan: 1,
        criterion: 'المظهر العام',
        criterionRowSpan: 1,
        indicators: [
            'يلتزم بالملابس المناسبة - يولي أهمية للنظافة الشخصية - يتبع القيم المهنية في مظهره .',
        ],
        maxScore: 3,
    },
    {
        id: '15',
        domain: 'فاعلية أساليب التقويم',
        domainRowSpan: 0,
        number: '15',
        numberRowSpan: 1,
        criterion: 'يتقبل التوجيهات',
        criterionRowSpan: 1,
        indicators: [
            'يتعامل مع النقد بشكل بناء - يطلب المساعدة عند الحاجة ليستفيد من التوجيهات لتحسين أدائه .',
        ],
        maxScore: 6,
    },
    {
        id: '16',
        domain: 'التقييم الفصلي',
        domainRowSpan: 3,
        number: '16',
        numberRowSpan: 1,
        criterion: 'يضع خطة فصلية تخدم الموضوعات',
        criterionRowSpan: 1,
        indicators: [
            'تحديد الأهداف العامة بشكل واضح ومتكامل .',
            'تخصيص وقت مناسب لكل موضوع - تحديد الأنشطة التي تعزز الفهم ومرنة .',
        ],
        maxScore: 5,
        isSemester: true,
    },
    {
        id: '17',
        domain: 'التقييم الفصلي',
        domainRowSpan: 0,
        number: '17',
        numberRowSpan: 1,
        criterion: 'يعد اختبارات تحصيلية سليمة',
        criterionRowSpan: 1,
        indicators: [
            'يصمم أسئلة تقيس مستويات الفهم المختلفة .',
            'وضوح التعليمات في الاختبارات - تقديم اختبارات تشمل أسئلة مقالية وموضوعية - شمولية الاختبار .',
        ],
        maxScore: 5,
        isSemester: true,
    },
    {
        id: '18',
        domain: 'التقييم الفصلي',
        domainRowSpan: 0,
        number: '18',
        numberRowSpan: 1,
        criterion: 'يوظف نتائج التقويم في تحسين وتطوير عمليتي التعليم والتعلم',
        criterionRowSpan: 1,
        indicators: [
            'تقديم خطط علاجية للمتعلمين المتعثرين .',
            'تقديم تغذية راجعة للمتعلمين حول أدائهم .',
            'تعزيز نقاط القوة وتعديل أساليب التدريس بناءً على التقييمات .',
        ],
        maxScore: 5,
        isSemester: true,
    },
];

const VISIT_LABELS = ['الزيارة الأولى', 'الزيارة الثانية', 'الزيارة الثالثة'];
const VISIT_KEYS = ['v1', 'v2', 'v3'];

export function createInitialClassroomVisitFormData(withMock = false) {
    const scores = {};
    CLASSROOM_VISIT_ROWS.forEach((row) => {
        scores[row.id] = withMock
            ? { v1: String(Math.max(1, row.maxScore - 1)), v2: '', v3: '' }
            : { v1: '', v2: '', v3: '' };
    });

    if (withMock) {
        return {
            teacher_name: 'أحمد علي محمد',
            day: 'الأحد',
            date: '2026-11-26',
            visits: [
                { label: 'الزيارة الأولى', grade: 'السابع - أ', period: 'الثانية', lesson_title: 'المعادلات الجبرية', date: '2026-11-26' },
                { label: 'الزيارة الثانية', grade: '', period: '', lesson_title: '', date: '' },
                { label: 'الزيارة الثالثة', grade: '', period: '', lesson_title: '', date: '' },
            ],
            scores,
            qualitative: [
                { label: 'الزيارة الأولى', strengths: 'إدارة صفية متميزة وتفاعل إيجابي مع الطلاب وتوظيف السبورة بوضوح.', improvements: 'تفعيل مزيد من الوسائط التعليمية الرقمية.' },
                { label: 'الزيارة الثانية', strengths: '', improvements: '' },
                { label: 'الزيارة الثالثة', strengths: '', improvements: '' },
            ],
        };
    }

    return {
        teacher_name: '',
        day: '',
        date: '',
        visits: VISIT_LABELS.map((label) => ({
            label,
            grade: '',
            period: '',
            lesson_title: '',
            date: '',
        })),
        scores,
        qualitative: VISIT_LABELS.map((label) => ({
            label,
            strengths: '',
            improvements: '',
        })),
    };
}

export function normalizeClassroomVisitFormData(raw) {
    const base = createInitialClassroomVisitFormData(false);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return base;
    }

    const normalizedScores = { ...base.scores };
    if (raw.scores && typeof raw.scores === 'object') {
        CLASSROOM_VISIT_ROWS.forEach((row) => {
            const entry = raw.scores[row.id];
            if (entry && typeof entry === 'object') {
                normalizedScores[row.id] = {
                    v1: entry.v1 ?? '',
                    v2: entry.v2 ?? '',
                    v3: entry.v3 ?? '',
                };
            }
        });
    }

    const visits = VISIT_LABELS.map((label, idx) => {
        const src = Array.isArray(raw.visits) && raw.visits[idx] ? raw.visits[idx] : {};
        return {
            label: src.label || label,
            grade: src.grade || '',
            period: src.period || '',
            lesson_title: src.lesson_title || '',
            date: src.date || '',
        };
    });

    const qualitative = VISIT_LABELS.map((label, idx) => {
        const src = Array.isArray(raw.qualitative) && raw.qualitative[idx] ? raw.qualitative[idx] : {};
        return {
            label: src.label || label,
            strengths: src.strengths || '',
            improvements: src.improvements || '',
        };
    });

    return {
        teacher_name: raw.teacher_name || '',
        day: raw.day || '',
        date: raw.date || '',
        visits,
        scores: normalizedScores,
        qualitative,
    };
}

export function computeClassroomVisitStats(rawData) {
    const data = normalizeClassroomVisitFormData(rawData);

    return VISIT_KEYS.map((visitKey) => {
        let classroomTotal = 0;
        let classroomHasValue = false;
        let semesterTotal = 0;
        let semesterHasValue = false;

        CLASSROOM_VISIT_ROWS.forEach((row) => {
            const rawVal = data.scores[row.id]?.[visitKey];
            if (rawVal === '' || rawVal === null || rawVal === undefined) {
                return;
            }
            const num = Number(rawVal);
            if (Number.isNaN(num)) {
                return;
            }
            if (row.isSemester) {
                semesterHasValue = true;
                semesterTotal += num;
            } else {
                classroomHasValue = true;
                classroomTotal += num;
            }
        });

        const hasAny = classroomHasValue || semesterHasValue;
        const classroomPct = classroomHasValue ? Number(((classroomTotal * 100) / 85).toFixed(1)) : null;
        const grandTotal = hasAny ? Number((classroomTotal + semesterTotal).toFixed(1)) : null;

        return {
            classroomTotal: classroomHasValue ? Number(classroomTotal.toFixed(1)) : null,
            classroomPct,
            semesterTotal: semesterHasValue ? Number(semesterTotal.toFixed(1)) : null,
            grandTotal,
        };
    });
}

function VisitSectionTable({ rows, data, stats, onScoreChange = null }) {
    return (
        <div className="overflow-x-auto border border-slate-400 dark:border-slate-700 rounded-xl bg-white dark:bg-[#0f141a]">
            <table className="w-full text-right border-collapse text-xs">
                <thead>
                    <tr className="bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white border-b border-slate-400 dark:border-slate-700">
                        <th className="py-2.5 px-2 font-black border-l border-slate-400 dark:border-slate-700 text-center w-10">المجال</th>
                        <th className="py-2.5 px-2 font-black border-l border-slate-400 dark:border-slate-700 text-center w-9">م</th>
                        <th className="py-2.5 px-3 font-black border-l border-slate-400 dark:border-slate-700 text-center w-44">المعايير</th>
                        <th className="py-2.5 px-3 font-black border-l border-slate-400 dark:border-slate-700 text-center">المؤشرات</th>
                        <th className="py-2.5 px-2 font-black border-l border-slate-400 dark:border-slate-700 text-center w-14">الدرجة</th>
                        {VISIT_LABELS.map((label) => (
                            <th key={label} className="py-2.5 px-2 font-black border-l border-slate-400 dark:border-slate-700 text-center w-16">
                                {label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                    {rows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                            {row.domainRowSpan > 0 && (
                                <td
                                    rowSpan={row.domainRowSpan}
                                    className="p-2 border-l border-slate-400 dark:border-slate-700 text-center font-black bg-slate-100/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 align-middle"
                                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                                >
                                    {row.domain}
                                </td>
                            )}
                            {row.numberRowSpan > 0 && (
                                <td
                                    rowSpan={row.numberRowSpan}
                                    className="p-2 border-l border-slate-400 dark:border-slate-700 text-center font-black text-slate-800 dark:text-slate-200 align-middle"
                                >
                                    {row.number}
                                </td>
                            )}
                            {row.criterionRowSpan > 0 && (
                                <td
                                    rowSpan={row.criterionRowSpan}
                                    className="p-2.5 border-l border-slate-400 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 align-middle text-center"
                                >
                                    {row.criterion}
                                </td>
                            )}
                            <td className="p-2.5 border-l border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                                <ul className="space-y-0.5">
                                    {row.indicators.map((ind, i) => (
                                        <li key={i}>• {ind}</li>
                                    ))}
                                </ul>
                            </td>
                            <td className="p-2 border-l border-slate-400 dark:border-slate-700 text-center font-black text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/30">
                                {row.maxScore}
                            </td>
                            {VISIT_KEYS.map((visitKey) => {
                                const scoreVal = data.scores[row.id]?.[visitKey] ?? '';
                                return (
                                    <td key={visitKey} className="p-1.5 border-l border-slate-400 dark:border-slate-700 text-center align-middle">
                                        {onScoreChange ? (
                                            <input
                                                type="number"
                                                min={0}
                                                max={row.maxScore}
                                                step="0.5"
                                                value={scoreVal}
                                                onChange={(e) => onScoreChange(row.id, visitKey, e.target.value, row.maxScore)}
                                                placeholder="-"
                                                className="w-14 text-center bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-1.5 text-xs font-black text-slate-800 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none"
                                            />
                                        ) : (
                                            <span className="font-black text-slate-800 dark:text-slate-100">
                                                {scoreVal !== '' ? scoreVal : ''}
                                            </span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function ClassroomVisitFormInput({ value, onChange }) {
    const data = normalizeClassroomVisitFormData(value);
    const stats = computeClassroomVisitStats(data);
    const classroomRows = CLASSROOM_VISIT_ROWS.filter((r) => !r.isSemester);
    const semesterRows = CLASSROOM_VISIT_ROWS.filter((r) => r.isSemester);

    const updateTopField = (key, val) => {
        onChange({ ...data, [key]: val });
    };

    const updateVisitMeta = (index, key, val) => {
        const nextVisits = data.visits.map((v, i) => (i === index ? { ...v, [key]: val } : v));
        onChange({ ...data, visits: nextVisits });
    };

    const handleScoreChange = (rowId, visitKey, rawValue, maxScore) => {
        let nextVal = rawValue;
        if (rawValue !== '') {
            const parsed = parseFloat(rawValue);
            if (!Number.isNaN(parsed)) {
                nextVal = String(Math.min(Math.max(parsed, 0), maxScore));
            }
        }
        onChange({
            ...data,
            scores: {
                ...data.scores,
                [rowId]: {
                    ...(data.scores[rowId] || { v1: '', v2: '', v3: '' }),
                    [visitKey]: nextVal,
                },
            },
        });
    };

    const updateQualitative = (index, key, val) => {
        const nextQual = data.qualitative.map((q, i) => (i === index ? { ...q, [key]: val } : q));
        onChange({ ...data, qualitative: nextQual });
    };

    return (
        <div className="space-y-6">
            {/* Teacher & Form Header Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 dark:bg-[#0f141a]/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">اسم المعلم</label>
                    <input
                        type="text"
                        value={data.teacher_name}
                        onChange={(e) => updateTopField('teacher_name', e.target.value)}
                        placeholder="أدخل اسم المعلم..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:border-primary-500 outline-none dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">اليوم</label>
                    <input
                        type="text"
                        value={data.day}
                        onChange={(e) => updateTopField('day', e.target.value)}
                        placeholder="مثال: الأحد"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:border-primary-500 outline-none dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">التاريخ</label>
                    <input
                        type="date"
                        value={data.date}
                        onChange={(e) => updateTopField('date', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:border-primary-500 outline-none dark:text-white"
                    />
                </div>
            </div>

            {/* 3 Visits Metadata Rows */}
            <div className="space-y-2.5">
                <h5 className="text-xs font-black text-slate-600 dark:text-slate-300">بيانات الزيارات الصفية الثلاث</h5>
                {data.visits.map((visit, idx) => (
                    <div
                        key={visit.label}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 items-center"
                    >
                        <div className="text-xs font-black text-primary-600 dark:text-primary-400">{visit.label}</div>
                        <input
                            type="text"
                            value={visit.grade}
                            onChange={(e) => updateVisitMeta(idx, 'grade', e.target.value)}
                            placeholder="الصف..."
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary-500 dark:text-white"
                        />
                        <input
                            type="text"
                            value={visit.period}
                            onChange={(e) => updateVisitMeta(idx, 'period', e.target.value)}
                            placeholder="الحصة..."
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary-500 dark:text-white"
                        />
                        <input
                            type="text"
                            value={visit.lesson_title}
                            onChange={(e) => updateVisitMeta(idx, 'lesson_title', e.target.value)}
                            placeholder="عنوان الدرس..."
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary-500 dark:text-white"
                        />
                        <input
                            type="date"
                            value={visit.date}
                            onChange={(e) => updateVisitMeta(idx, 'date', e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary-500 dark:text-white"
                        />
                    </div>
                ))}
            </div>

            {/* Domain 1–3 Classroom Criteria Table (Items 1–15 = 85 points) */}
            <div className="space-y-2">
                <h5 className="text-xs font-black text-slate-600 dark:text-slate-300">أولاً: معايير التقييم الصفي (البنود 1–15 من 85 درجة)</h5>
                <VisitSectionTable rows={classroomRows} data={data} stats={stats} onScoreChange={handleScoreChange} />
            </div>

            {/* Percentage Calculation Banner (out of 85) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-primary-50/70 dark:bg-primary-900/15 border border-primary-200 dark:border-primary-800/40 rounded-2xl p-4 items-center">
                <div className="text-xs font-black text-primary-800 dark:text-primary-300">
                    النسبة المئوية = مجموع الدرجات × 100 / 85
                </div>
                {VISIT_LABELS.map((label, idx) => (
                    <div key={label} className="bg-white dark:bg-slate-900/60 px-3 py-2 rounded-xl border border-primary-100 dark:border-primary-800/30 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">{label}:</span>
                        <span className="font-black text-primary-600 dark:text-primary-400" dir="ltr">
                            {stats[idx].classroomTotal !== null ? `${stats[idx].classroomTotal}/85 (${stats[idx].classroomPct}%)` : '—'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Domain 4 Semester Criteria Table (Items 16–18 = 15 points) */}
            <div className="space-y-2">
                <h5 className="text-xs font-black text-slate-600 dark:text-slate-300">ثانياً: التقييم الفصلي (البنود 16–18 من 15 درجة)</h5>
                <VisitSectionTable rows={semesterRows} data={data} stats={stats} onScoreChange={handleScoreChange} />
            </div>

            {/* Grand Total Banner (100%) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-emerald-50/70 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 items-center">
                <div className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                    إجمالي بنود الاستمارة (1–18 من 100%)
                </div>
                {VISIT_LABELS.map((label, idx) => (
                    <div key={label} className="bg-white dark:bg-slate-900/60 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">{label}:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                            {stats[idx].grandTotal !== null ? `${stats[idx].grandTotal}%` : '—'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Qualitative Table: Strengths & Improvements per Visit */}
            <div className="space-y-2.5">
                <h5 className="text-xs font-black text-slate-600 dark:text-slate-300">جوانب التميز ونقاط تحتاج إلى تحسين</h5>
                <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-[#0f141a]">
                    <table className="w-full text-right border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
                                <th className="py-3 px-3 font-black text-slate-700 dark:text-slate-200 border-l border-slate-300 dark:border-slate-700 w-32 text-center">الزيارة</th>
                                <th className="py-3 px-4 font-black text-slate-700 dark:text-slate-200 border-l border-slate-300 dark:border-slate-700 text-center">جوانب التميز</th>
                                <th className="py-3 px-4 font-black text-slate-700 dark:text-slate-200 text-center">نقاط تحتاج إلى تحسين</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {data.qualitative.map((qRow, idx) => (
                                <tr key={qRow.label}>
                                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 font-black text-center text-slate-700 dark:text-slate-200 bg-slate-50/70 dark:bg-slate-800/40">
                                        {qRow.label}
                                    </td>
                                    <td className="p-2.5 border-l border-slate-300 dark:border-slate-700">
                                        <textarea
                                            rows={3}
                                            value={qRow.strengths}
                                            onChange={(e) => updateQualitative(idx, 'strengths', e.target.value)}
                                            placeholder={`جوانب التميز في ${qRow.label}...`}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary-500 dark:text-white"
                                        />
                                    </td>
                                    <td className="p-2.5">
                                        <textarea
                                            rows={3}
                                            value={qRow.improvements}
                                            onChange={(e) => updateQualitative(idx, 'improvements', e.target.value)}
                                            placeholder={`نقاط تحتاج إلى تحسين في ${qRow.label}...`}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary-500 dark:text-white"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export function ClassroomVisitFormPrintView({ value }) {
    const data = normalizeClassroomVisitFormData(value);
    const stats = computeClassroomVisitStats(data);
    const classroomRows = CLASSROOM_VISIT_ROWS.filter((r) => !r.isSemester);
    const semesterRows = CLASSROOM_VISIT_ROWS.filter((r) => r.isSemester);

    const hasAnyClassroomScore = stats.some((s) => s.classroomPct !== null);
    const hasAnyGrandScore = stats.some((s) => s.grandTotal !== null);

    return (
        <div className="space-y-4 text-slate-900 dark:text-slate-100" dir="rtl">
            {/* Teacher Info & Date Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 rounded-xl border border-slate-400 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-xs font-bold">
                <div>
                    <span className="text-slate-500">اسم المعلم: </span>
                    <span className="font-black">{data.teacher_name || '...................................'}</span>
                </div>
                <div>
                    <span className="text-slate-500">اليوم: </span>
                    <span className="font-black">{data.day || '..................'}</span>
                </div>
                <div>
                    <span className="text-slate-500">التاريخ: </span>
                    <span className="font-black" dir="ltr">{data.date || '.... / .... / 202.. م'}</span>
                </div>
            </div>

            {/* 3 Dashed Visit Rows */}
            <div className="space-y-1.5">
                {data.visits.map((visit, idx) => (
                    <div
                        key={idx}
                        className="grid grid-cols-4 gap-3 px-4 py-2 border border-dashed border-slate-500 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900/30"
                    >
                        <div>
                            <span className="text-slate-500">الصف : </span>
                            <span>{visit.grade || '...................'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">الحصة : </span>
                            <span>{visit.period || '................'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">عنوان الدرس : </span>
                            <span>{visit.lesson_title || '.........................'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">التاريخ : </span>
                            <span dir="ltr">{visit.date || '................'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Page 1 Table: Items 1–15 */}
            <VisitSectionTable rows={classroomRows} data={data} stats={stats} />

            {/* Formula Header Bar: Percentage out of 85 */}
            <div className="border border-slate-400 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/60 px-4 py-2.5 text-center rounded-xl text-xs font-black">
                {hasAnyClassroomScore ? (
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <span>النسبة المئوية = مجموع الدرجات × 100 / 85 :</span>
                        {VISIT_LABELS.map((label, idx) =>
                            stats[idx].classroomPct !== null ? (
                                <span key={label} className="text-primary-700 dark:text-primary-300">
                                    {label}: {stats[idx].classroomTotal} / 85 ({stats[idx].classroomPct}%)
                                </span>
                            ) : null
                        )}
                    </div>
                ) : (
                    <span>النسبة المئوية = مجموع الدرجات × 100 / 85 = ............. %</span>
                )}
            </div>

            {/* Page 2 Table: Semester Assessment (16–18) */}
            <VisitSectionTable rows={semesterRows} data={data} stats={stats} />

            {/* Grand Total Bar (100%) */}
            <div className="border border-slate-400 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/60 px-4 py-2.5 text-center rounded-xl text-xs font-black">
                {hasAnyGrandScore ? (
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <span>إجمالي بنود الاستمارة = مجموع الدرجات % :</span>
                        {VISIT_LABELS.map((label, idx) =>
                            stats[idx].grandTotal !== null ? (
                                <span key={label} className="text-emerald-700 dark:text-emerald-300">
                                    {label}: {stats[idx].grandTotal}%
                                </span>
                            ) : null
                        )}
                    </div>
                ) : (
                    <span>إجمالي بنود الاستمارة = مجموع الدرجات %</span>
                )}
            </div>

            {/* Strengths & Improvements Matrix (3 Visits) */}
            <div className="overflow-x-auto border border-slate-400 dark:border-slate-700 rounded-xl bg-white dark:bg-[#0f141a]">
                <table className="w-full text-right border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-200/80 dark:bg-slate-800 border-b border-slate-400 dark:border-slate-700">
                            <th className="py-2.5 px-2 font-black border-l border-slate-400 dark:border-slate-700 text-center w-12"></th>
                            <th className="py-2.5 px-4 font-black border-l border-slate-400 dark:border-slate-700 text-center w-1/2">جوانب التميز</th>
                            <th className="py-2.5 px-4 font-black text-center w-1/2">نقاط تحتاج إلى تحسين</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-400 dark:divide-slate-700">
                        {data.qualitative.map((qRow) => (
                            <tr key={qRow.label}>
                                <td
                                    className="p-2 border-l border-slate-400 dark:border-slate-700 text-center font-black bg-slate-100/70 dark:bg-slate-800/40"
                                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                                >
                                    {qRow.label}
                                </td>
                                <td className="p-3 border-l border-slate-400 dark:border-slate-700 align-top min-h-[72px] whitespace-pre-line leading-relaxed">
                                    {qRow.strengths || '\n\n'}
                                </td>
                                <td className="p-3 align-top min-h-[72px] whitespace-pre-line leading-relaxed">
                                    {qRow.improvements || '\n\n'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Official Form Signatures */}
            <div className="flex items-center justify-between pt-6 pb-2 px-8 text-sm font-black text-slate-800 dark:text-slate-200">
                <div>توقيع المعلم</div>
                <div>توقيع التوجيه</div>
            </div>
        </div>
    );
}
