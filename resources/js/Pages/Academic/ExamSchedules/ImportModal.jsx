import React, { useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import {
    X,
    Upload,
    FileSpreadsheet,
    Download,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Copy,
    ArrowLeft,
    ArrowRight,
    Trash2,
    Save,
    Layers,
    Sparkles,
    Plus,
    Calendar,
} from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import {
    buildClonedScheduleRows,
    downloadExamScheduleTemplate,
    expandImportRowsToScheduleItems,
    parseExamScheduleFile,
    validateImportRows,
} from '@/Utils/examScheduleExcel';

export default function ImportModal({
    show,
    onClose,
    examSchedule,
    grades = [],
    subjects = [],
    teachers = [],
    holidays = [],
    existingItems = [],
    previousSchedules = [],
    onApplyToStudio,
    onSuccessToast,
}) {
    const { logo_url, auth } = usePage().props;
    const schoolName = auth?.user?.branch?.name || 'المدارس الذكية';

    const fileInputRef = useRef(null);
    const [step, setStep] = useState(1);
    const [sourceTab, setSourceTab] = useState('file'); // 'file' | 'clone'
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Parsed / Editable rows
    const [rawRows, setRawRows] = useState([]);
    const [sourceSummary, setSourceSummary] = useState('');
    const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'valid' | 'warning' | 'error'

    // Clone tab state
    const [cloneScheduleId, setCloneScheduleId] = useState('');
    const [cloneStartDate, setCloneStartDate] = useState(
        examSchedule?.period?.fill_start_date
            ? String(examSchedule.period.fill_start_date).slice(0, 10)
            : dayjs().add(1, 'day').format('YYYY-MM-DD')
    );
    const [skipWeekends, setSkipWeekends] = useState(true);
    const [skipHolidays, setSkipHolidays] = useState(true);

    const validationResult = useMemo(() => {
        return validateImportRows(rawRows, {
            grades,
            subjects,
            teachers,
            holidays,
            existingItems,
            mode: importMode,
        });
    }, [rawRows, grades, subjects, teachers, holidays, existingItems, importMode]);

    const validatedRows = validationResult.rows;
    const stats = validationResult.stats;

    const displayedRows = useMemo(() => {
        if (statusFilter === 'all') return validatedRows;
        return validatedRows.filter((r) => r.status === statusFilter);
    }, [validatedRows, statusFilter]);

    const expandedReadyItems = useMemo(() => {
        return expandImportRowsToScheduleItems(validatedRows, { grades, subjects, teachers });
    }, [validatedRows, grades, subjects, teachers]);

    const resetWizard = () => {
        setStep(1);
        setRawRows([]);
        setSourceSummary('');
        setStatusFilter('all');
        setIsParsing(false);
        setIsSubmitting(false);
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetWizard();
        onClose();
    };

    const handleDownloadTemplate = async () => {
        await downloadExamScheduleTemplate({
            examSchedule,
            grades,
            subjects,
            teachers,
            holidays,
            existingItems: null,
            schoolName,
        });
    };

    const handleProcessFile = async (file) => {
        if (!file) return;
        const lower = file.name.toLowerCase();
        if (!lower.endsWith('.xlsx') && !lower.endsWith('.csv')) {
            Swal.fire({
                icon: 'error',
                title: 'صيغة غير مدعومة',
                text: 'يرجى رفع ملف Excel (.xlsx) أو CSV (.csv) فقط.',
                confirmButtonText: 'حسناً',
            });
            return;
        }

        setIsParsing(true);
        try {
            const parsed = await parseExamScheduleFile(file, { grades, subjects, teachers });
            if (!parsed.rows || parsed.rows.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'الملف فارغ',
                    text: 'لم يتم العثور على صفوف اختبارات قابلة للاستيراد في الملف المرفوع.',
                    confirmButtonText: 'حسناً',
                });
                return;
            }
            setRawRows(parsed.rows);
            setSourceSummary(`ملف: ${file.name} (${parsed.rows.length} صف)`);
            setStatusFilter('all');
            setStep(2);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'تعذر قراءة الملف',
                text: err?.message || 'تأكد من سلامة ملف Excel أو استخدم القالب الذكي.',
                confirmButtonText: 'حسناً',
            });
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleClonePreview = () => {
        const source = previousSchedules.find((s) => String(s.id) === String(cloneScheduleId));
        if (!source) {
            Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'يرجى اختيار الجدول المرجعي أولاً.' });
            return;
        }
        if (!cloneStartDate) {
            Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'يرجى تحديد تاريخ بداية الاختبارات للجدول الجديد.' });
            return;
        }

        const clonedRows = buildClonedScheduleRows(source, cloneStartDate, {
            holidays,
            skipWeekends,
            skipHolidays,
        });

        if (clonedRows.length === 0) {
            Swal.fire({ icon: 'warning', title: 'لا توجد مواد', text: 'الجدول المختار لا يحتوي على اختبارات قابلة للنسخ.' });
            return;
        }

        setRawRows(clonedRows);
        setSourceSummary(`نسخ من: ${source.title} (بداية من ${cloneStartDate})`);
        setStatusFilter('all');
        setStep(2);
    };

    const updateRowField = (rowKey, updater) => {
        setRawRows((prev) =>
            prev.map((r) => {
                if (r.rowKey !== rowKey) return r;
                return typeof updater === 'function' ? updater(r) : { ...r, ...updater };
            })
        );
    };

    const handleGradeChange = (rowKey, newGradeId) => {
        const gradeObj = grades.find((g) => String(g.id) === String(newGradeId));
        const allDivIds = (gradeObj?.divisions || []).map((d) => d.id);
        updateRowField(rowKey, {
            grade_id: newGradeId ? Number(newGradeId) : '',
            raw_grade: '',
            division_ids: allDivIds,
            all_divisions: allDivIds.length > 0,
            unmatched_divisions: [],
        });
    };

    const toggleRowDivision = (rowKey, divId) => {
        updateRowField(rowKey, (row) => {
            const current = (row.division_ids || []).map(Number);
            const target = Number(divId);
            const next = current.includes(target)
                ? current.filter((id) => id !== target)
                : [...current, target];
            return {
                ...row,
                division_ids: next,
                unmatched_divisions: [],
            };
        });
    };

    const selectAllRowDivisions = (rowKey, gradeObj) => {
        const allDivIds = (gradeObj?.divisions || []).map((d) => d.id);
        updateRowField(rowKey, {
            division_ids: allDivIds,
            all_divisions: true,
            unmatched_divisions: [],
        });
    };

    const addRowProctor = (rowKey, proctorId) => {
        if (!proctorId) return;
        const numId = Number(proctorId);
        updateRowField(rowKey, (row) => {
            const current = (row.proctor_ids || []).map(Number);
            if (current.includes(numId)) return row;
            return {
                ...row,
                proctor_ids: [...current, numId],
                unmatched_proctors: [],
            };
        });
    };

    const removeRowProctor = (rowKey, proctorId) => {
        const numId = Number(proctorId);
        updateRowField(rowKey, (row) => ({
            ...row,
            proctor_ids: (row.proctor_ids || []).filter((id) => Number(id) !== numId),
        }));
    };

    const deleteRow = (rowKey) => {
        setRawRows((prev) => prev.filter((r) => r.rowKey !== rowKey));
    };

    const addEmptyRow = () => {
        const defaultGrade = grades[0];
        setRawRows((prev) => [
            ...prev,
            {
                rowKey: `manual_${Date.now()}`,
                sourceRowNumber: prev.length + 1,
                exam_date: examSchedule?.period?.fill_start_date
                    ? String(examSchedule.period.fill_start_date).slice(0, 10)
                    : dayjs().add(1, 'day').format('YYYY-MM-DD'),
                raw_date: '',
                grade_id: defaultGrade?.id || '',
                raw_grade: '',
                division_ids: (defaultGrade?.divisions || []).map((d) => d.id),
                all_divisions: true,
                unmatched_divisions: [],
                subject_id: '',
                raw_subject: '',
                start_time: '08:00',
                raw_start_time: '',
                end_time: '09:30',
                raw_end_time: '',
                room: '',
                proctor_ids: [],
                unmatched_proctors: [],
                syllabus: '',
            },
        ]);
    };

    const applyToDesigner = () => {
        if (expandedReadyItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'لا توجد صفوف صالحة',
                text: 'يرجى تصحيح الأخطاء أو إضافة اختبار واحد صالح على الأقل.',
            });
            return;
        }
        onApplyToStudio(expandedReadyItems, importMode);
        handleClose();
    };

    const saveDirectlyToDatabase = () => {
        if (expandedReadyItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'لا توجد صفوف صالحة',
                text: 'يرجى تصحيح الأخطاء أو إضافة اختبار واحد صالح على الأقل.',
            });
            return;
        }

        setIsSubmitting(true);
        router.post(
            route('academic.exam-schedules.import', examSchedule.id),
            {
                mode: importMode,
                items: expandedReadyItems.map((i) => ({
                    division_id: i.division_id,
                    subject_id: i.subject_id,
                    exam_date: i.exam_date,
                    start_time: i.start_time || null,
                    end_time: i.end_time || null,
                    room: i.room || null,
                    proctor_ids: i.proctor_ids || [],
                    syllabus: i.syllabus || '',
                })),
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    onSuccessToast?.(page?.props?.flash?.success || 'تم استيراد وحفظ الجدول بنجاح!');
                    setIsSubmitting(false);
                    resetWizard();
                    onClose();
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const msgs = Object.values(errors || {}).flat().filter(Boolean);
                    Swal.fire({
                        icon: 'error',
                        title: 'تعذر حفظ الاستيراد',
                        text: msgs.length > 0 ? msgs.join('\n') : 'تحقق من تعارضات المراقبين أو صحة الأوقات.',
                        confirmButtonText: 'حسناً',
                    });
                },
            }
        );
    };

    const stepLabels = [
        { num: 1, title: 'مصدر البيانات' },
        { num: 2, title: 'المعاينة والتصحيح الذكي' },
        { num: 3, title: 'الاعتماد والتطبيق' },
    ];

    return (
        <Transition appear show={show} as={React.Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={handleClose}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto" dir="rtl">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 text-right shadow-2xl transition-all border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
                                {/* Modal Header */}
                                <div className="px-6 py-5 bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                                            <FileSpreadsheet size={24} />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-xl font-black text-slate-800 dark:text-white">
                                                مركز استيراد جداول الاختبارات
                                            </Dialog.Title>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                                استيراد من ملف Excel / CSV أو النسخ الذكي من جدول سابق مع معاينة وتصحيح فوري
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3-Step Stepper */}
                                    <div className="flex items-center gap-2">
                                        {stepLabels.map((s, idx) => (
                                            <React.Fragment key={s.num}>
                                                <div
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                                        step === s.num
                                                            ? 'bg-primary-600 text-white shadow-sm'
                                                            : step > s.num
                                                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                                    }`}
                                                >
                                                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
                                                        {step > s.num ? '✓' : s.num}
                                                    </span>
                                                    <span className="hidden sm:inline">{s.title}</span>
                                                </div>
                                                {idx < stepLabels.length - 1 && (
                                                    <span className="text-slate-300 dark:text-slate-700">←</span>
                                                )}
                                            </React.Fragment>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="mr-2 w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                                    {/* STEP 1: Source Selection */}
                                    {step === 1 && (
                                        <div className="space-y-6">
                                            {/* Mode Tabs */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-2xl">
                                                <button
                                                    type="button"
                                                    onClick={() => setSourceTab('file')}
                                                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black transition-all ${
                                                        sourceTab === 'file'
                                                            ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                                    }`}
                                                >
                                                    <Upload size={18} />
                                                    استيراد من ملف Excel / CSV
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSourceTab('clone')}
                                                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black transition-all ${
                                                        sourceTab === 'clone'
                                                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                                    }`}
                                                >
                                                    <Copy size={18} />
                                                    النسخ الذكي من جدول سابق ({previousSchedules.length})
                                                </button>
                                            </div>

                                            {sourceTab === 'file' ? (
                                                <div className="space-y-5">
                                                    {/* Smart Template Card */}
                                                    <div className="bg-gradient-to-l from-emerald-50 to-teal-50/60 dark:from-emerald-950/30 dark:to-slate-800/60 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="space-y-1">
                                                            <h4 className="font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                                                                <Sparkles size={18} className="text-emerald-600" />
                                                                القالب الذكي المخصّص لبيانات فرعك
                                                            </h4>
                                                            <p className="text-xs font-semibold text-emerald-800/80 dark:text-emerald-200/70 leading-relaxed">
                                                                ملف Excel جاهز يحتوي على قوائم منسدلة بأسماء صفوف ومواد ومعلمي مدرستك، مع أمثلة توضيحية لتفادي أخطاء الكتابة.
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleDownloadTemplate}
                                                            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                                                        >
                                                            <Download size={18} />
                                                            تحميل القالب الذكي (.xlsx)
                                                        </button>
                                                    </div>

                                                    {/* Drag & Drop Zone */}
                                                    <div
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            setIsDragging(true);
                                                        }}
                                                        onDragLeave={() => setIsDragging(false)}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            setIsDragging(false);
                                                            const file = e.dataTransfer?.files?.[0];
                                                            if (file) handleProcessFile(file);
                                                        }}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className={`cursor-pointer border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
                                                            isDragging
                                                                ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-900/20 scale-[1.01]'
                                                                : 'border-slate-300 dark:border-slate-700 hover:border-primary-400 bg-slate-50/60 dark:bg-slate-800/30'
                                                        }`}
                                                    >
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept=".xlsx,.csv"
                                                            className="hidden"
                                                            onChange={(e) => handleProcessFile(e.target.files?.[0])}
                                                        />
                                                        <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-4">
                                                            <Upload size={30} className={isParsing ? 'animate-bounce' : ''} />
                                                        </div>
                                                        <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1">
                                                            {isParsing ? 'جاري تحليل الملف ومطابقة البيانات...' : 'اسحب ملف الجدول هنا أو اضغط للاختيار'}
                                                        </h4>
                                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                            الصيغ المدعومة: Excel (.xlsx) و CSV (.csv) — يدعم كتابة "الكل" في الشعبة وتعدد المراقبين بفاصلة
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 space-y-5">
                                                    {previousSchedules.length === 0 ? (
                                                        <div className="text-center py-8 space-y-2">
                                                            <Calendar size={36} className="mx-auto text-slate-400" />
                                                            <p className="font-bold text-slate-600 dark:text-slate-300">لا توجد جداول اختبارات سابقة تحتوي على مواد في هذا الفرع.</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                                <div>
                                                                    <label className="block text-sm font-black text-slate-700 dark:text-slate-200 mb-2">
                                                                        اختر الجدول المرجعي
                                                                    </label>
                                                                    <SelectInput
                                                                        value={cloneScheduleId}
                                                                        onChange={(v) => setCloneScheduleId(v || '')}
                                                                        options={previousSchedules.map((s) => ({
                                                                            value: s.id,
                                                                            label: `${s.title} (${s.items?.length || 0} لجنة/مادة)`,
                                                                        }))}
                                                                        placeholder="اختر جدولاً سابقاً..."
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-black text-slate-700 dark:text-slate-200 mb-2">
                                                                        تاريخ بداية الاختبارات الجديدة
                                                                    </label>
                                                                    <FlatpickrInput
                                                                        value={cloneStartDate}
                                                                        onChange={(val) => setCloneStartDate(val)}
                                                                        placeholder="اختر تاريخ البداية..."
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-6 pt-1">
                                                                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-200">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={skipWeekends}
                                                                        onChange={(e) => setSkipWeekends(e.target.checked)}
                                                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                                    />
                                                                    تخطي عطلة نهاية الأسبوع تلقائياً (الجمعة والسبت)
                                                                </label>
                                                                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-200">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={skipHolidays}
                                                                        onChange={(e) => setSkipHolidays(e.target.checked)}
                                                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                                    />
                                                                    تخطي الإجازات الرسمية المسجلة ({holidays.length})
                                                                </label>
                                                            </div>

                                                            <div className="flex justify-end pt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleClonePreview}
                                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/20 transition-all"
                                                                >
                                                                    <Copy size={17} />
                                                                    معاينة الجدول مع إزاحة التواريخ
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* STEP 2: Interactive Preview & Live Fix */}
                                    {step === 2 && (
                                        <div className="space-y-4">
                                            {/* Top Bar: Source + KPIs + Mode Toggle */}
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 ml-2">
                                                        {sourceSummary}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setStatusFilter('all')}
                                                        className={`px-3 py-1 rounded-lg text-xs font-black border ${
                                                            statusFilter === 'all'
                                                                ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900'
                                                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        الكل ({stats.total})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setStatusFilter('valid')}
                                                        className={`px-3 py-1 rounded-lg text-xs font-black border ${
                                                            statusFilter === 'valid'
                                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                                                        }`}
                                                    >
                                                        جاهز ({stats.valid})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setStatusFilter('warning')}
                                                        className={`px-3 py-1 rounded-lg text-xs font-black border ${
                                                            statusFilter === 'warning'
                                                                ? 'bg-amber-500 text-white border-amber-500'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                                                        }`}
                                                    >
                                                        تنبيهات ({stats.warning})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setStatusFilter('error')}
                                                        className={`px-3 py-1 rounded-lg text-xs font-black border ${
                                                            statusFilter === 'error'
                                                                ? 'bg-rose-600 text-white border-rose-600'
                                                                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                                                        }`}
                                                    >
                                                        أخطاء ({stats.error})
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="inline-flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                                        <button
                                                            type="button"
                                                            onClick={() => setImportMode('merge')}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                                                importMode === 'merge'
                                                                    ? 'bg-primary-600 text-white'
                                                                    : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                        >
                                                            دمج مع الحالي
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setImportMode('replace')}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                                                importMode === 'replace'
                                                                    ? 'bg-rose-600 text-white'
                                                                    : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                        >
                                                            استبدال الكل
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={addEmptyRow}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300"
                                                    >
                                                        <Plus size={14} />
                                                        صف جديد
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Editable Preview Table */}
                                            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                                                <div className="overflow-x-auto max-h-[48vh]">
                                                    <table className="w-full text-xs text-right border-collapse">
                                                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-10">
                                                            <tr>
                                                                <th className="p-2.5 font-black">الحالة</th>
                                                                <th className="p-2.5 font-black min-w-[130px]">التاريخ</th>
                                                                <th className="p-2.5 font-black min-w-[130px]">الصف</th>
                                                                <th className="p-2.5 font-black min-w-[160px]">الشعب</th>
                                                                <th className="p-2.5 font-black min-w-[140px]">المادة</th>
                                                                <th className="p-2.5 font-black min-w-[100px]">من</th>
                                                                <th className="p-2.5 font-black min-w-[100px]">إلى</th>
                                                                <th className="p-2.5 font-black min-w-[110px]">القاعة</th>
                                                                <th className="p-2.5 font-black min-w-[180px]">المراقبون</th>
                                                                <th className="p-2.5 font-black min-w-[140px]">المقرر</th>
                                                                <th className="p-2.5 font-black text-center">حذف</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {displayedRows.map((row) => {
                                                                const gradeObj = grades.find((g) => String(g.id) === String(row.grade_id));
                                                                const gradeDivisions = gradeObj?.divisions || [];
                                                                const rowBg =
                                                                    row.status === 'error'
                                                                        ? 'bg-rose-50/50 dark:bg-rose-950/20'
                                                                        : row.status === 'warning'
                                                                          ? 'bg-amber-50/40 dark:bg-amber-950/15'
                                                                          : 'bg-white dark:bg-slate-900';

                                                                return (
                                                                    <React.Fragment key={row.rowKey}>
                                                                        <tr className={rowBg}>
                                                                            <td className="p-2 align-top">
                                                                                {row.status === 'valid' && (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-black">
                                                                                        <CheckCircle2 size={12} /> جاهز
                                                                                    </span>
                                                                                )}
                                                                                {row.status === 'warning' && (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-black">
                                                                                        <AlertTriangle size={12} /> تنبيه
                                                                                    </span>
                                                                                )}
                                                                                {row.status === 'error' && (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 font-black">
                                                                                        <AlertCircle size={12} /> خطأ
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-2 align-top">
                                                                                <input
                                                                                    type="date"
                                                                                    value={row.exam_date || ''}
                                                                                    onChange={(e) =>
                                                                                        updateRowField(row.rowKey, {
                                                                                            exam_date: e.target.value,
                                                                                            raw_date: e.target.value,
                                                                                        })
                                                                                    }
                                                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold px-2 py-1.5"
                                                                                />
                                                                            </td>
                                                                            <td className="p-2 align-top">
                                                                                <select
                                                                                    value={row.grade_id || ''}
                                                                                    onChange={(e) => handleGradeChange(row.rowKey, e.target.value)}
                                                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold px-2 py-1.5"
                                                                                >
                                                                                    <option value="">اختر الصف...</option>
                                                                                    {grades.map((g) => (
                                                                                        <option key={g.id} value={g.id}>
                                                                                            {g.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </td>
                                                                            <td className="p-2 align-top">
                                                                                {gradeDivisions.length > 0 ? (
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => selectAllRowDivisions(row.rowKey, gradeObj)}
                                                                                            className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                                                                                row.division_ids.length === gradeDivisions.length
                                                                                                    ? 'bg-primary-600 text-white border-primary-600'
                                                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                                                                                            }`}
                                                                                        >
                                                                                            الكل
                                                                                        </button>
                                                                                        {gradeDivisions.map((d) => {
                                                                                            const active = row.division_ids.includes(d.id);
                                                                                            return (
                                                                                                <button
                                                                                                    key={d.id}
                                                                                                    type="button"
                                                                                                    onClick={() => toggleRowDivision(row.rowKey, d.id)}
                                                                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                                                                        active
                                                                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                                                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                                                                    }`}
                                                                                                >
                                                                                                    {d.name}
                                                                                                </button>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-slate-400">حدد الصف</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-2 align-top">
                                                                                <select
                                                                                    value={row.subject_id || ''}
                                                                                    onChange={(e) =>
                                                                                        updateRowField(row.rowKey, {
                                                                                            subject_id: e.target.value ? Number(e.target.value) : '',
                                                                                            raw_subject: '',
                                                                                        })
                                                                                    }
                                                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold px-2 py-1.5"
                                                                                >
                                                                                    <option value="">اختر المادة...</option>
                                                                                    {subjects.map((s) => (
                                                                                        <option key={s.id} value={s.id}>
                                                                                            {s.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </td>
                                                                            <td className="p-2 align-top">
                                                                                <input
                                                                                    type="time"
                                                                                    value={row.start_time || ''}
                                                                                    onChange={(e) =>
                                                                                        updateRowField(row.rowKey, {
                                                                                            start_time: e.target.value,
                                                                                            raw_start_time: '',
                                                                                        })
                                                                                    }
                                                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold px-1.5 py-1.5"
                                                                                />
                                                                            </td>
                                                                            <td className="p-2 align-top">
                                                                                <input
                                                                                    type="time"
                                                                                    value={row.end_time || ''}
                                                                                    onChange={(e) =>
                                                                                        updateRowField(row.rowKey, {
                                                                                            end_time: e.target.value,
                                                                                            raw_end_time: '',
                                                                                        })
                                                                                    }
                                                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold px-1.5 py-1.5"
                                                                                />
                                                                            </td>
                                                                            <td className="p-2 align-top">
                                                                                <input
                                                                                    type="text"
                                                                                    value={row.room || ''}
                                                                                    onChange={(e) => updateRowField(row.rowKey, { room: e.target.value })}
                                                                                    placeholder="القاعة..."
                                                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold px-2 py-1.5"
                                                                                />
                                                                            </td>
                                                                            <td className="p-2 align-top space-y-1">
                                                                                <div className="flex flex-wrap gap-1">
                                                                                    {(row.proctor_ids || []).map((pid) => {
                                                                                        const teacherObj = teachers.find((t) => Number(t.id) === Number(pid));
                                                                                        return (
                                                                                            <span
                                                                                                key={pid}
                                                                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold"
                                                                                            >
                                                                                                {teacherObj?.name?.split(' ').slice(0, 2).join(' ') || `#${pid}`}
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => removeRowProctor(row.rowKey, pid)}
                                                                                                    className="hover:text-rose-500"
                                                                                                >
                                                                                                    ×
                                                                                                </button>
                                                                                            </span>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                                <select
                                                                                    value=""
                                                                                    onChange={(e) => addRowProctor(row.rowKey, e.target.value)}
                                                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-[11px] font-bold px-2 py-1"
                                                                                >
                                                                                    <option value="">+ إضافة مراقب...</option>
                                                                                    {teachers
                                                                                        .filter((t) => !(row.proctor_ids || []).map(Number).includes(Number(t.id)))
                                                                                        .map((t) => (
                                                                                            <option key={t.id} value={t.id}>
                                                                                                {t.name}
                                                                                            </option>
                                                                                        ))}
                                                                                </select>
                                                                            </td>
                                                                            <td className="p-2 align-top">
                                                                                <input
                                                                                    type="text"
                                                                                    value={row.syllabus || ''}
                                                                                    onChange={(e) => updateRowField(row.rowKey, { syllabus: e.target.value })}
                                                                                    placeholder="المقرر..."
                                                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold px-2 py-1.5"
                                                                                />
                                                                            </td>
                                                                            <td className="p-2 align-top text-center">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => deleteRow(row.rowKey)}
                                                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                                                                    title="حذف الصف"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                        {(row.errors.length > 0 || row.warnings.length > 0) && (
                                                                            <tr className={rowBg}>
                                                                                <td colSpan={11} className="px-3 pb-2 pt-0">
                                                                                    <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                                                                                        {row.errors.map((err, i) => (
                                                                                            <span key={`e-${i}`} className="text-rose-600 dark:text-rose-400">
                                                                                                • {err}
                                                                                            </span>
                                                                                        ))}
                                                                                        {row.warnings.map((warn, i) => (
                                                                                            <span key={`w-${i}`} className="text-amber-600 dark:text-amber-400">
                                                                                                • {warn}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: Mode & Apply Confirmation */}
                                    {step === 3 && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                    <p className="text-xs font-bold text-slate-500">صفوف الملف المقبولة</p>
                                                    <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                                                        {stats.valid + stats.warning} <span className="text-xs font-bold text-slate-400">/ {stats.total}</span>
                                                    </p>
                                                </div>
                                                <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
                                                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">إجمالي لجان الشعب الناتجة</p>
                                                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                                                        {expandedReadyItems.length}
                                                    </p>
                                                </div>
                                                <div className="bg-amber-50/70 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">صفوف بها تنبيهات</p>
                                                    <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{stats.warning}</p>
                                                </div>
                                                <div className="bg-rose-50/70 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/50">
                                                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300">صفوف مستبعدة (أخطاء)</p>
                                                    <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{stats.error}</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
                                                <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                                    <Layers size={16} className="text-primary-500" />
                                                    آلية التطبيق على الجدول الحالي
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <label
                                                        onClick={() => setImportMode('merge')}
                                                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                                                            importMode === 'merge'
                                                                ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
                                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                                        }`}
                                                    >
                                                        <div className="font-black text-sm text-slate-800 dark:text-white">دمج ذكي مع الجدول الحالي (Merge)</div>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            يحتفظ بالاختبارات الموجودة ويضيف الجديد، مع تحديث الاختبارات المتطابقة في نفس الشعبة والمادة والتاريخ دون تكرار.
                                                        </p>
                                                    </label>
                                                    <label
                                                        onClick={() => setImportMode('replace')}
                                                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                                                            importMode === 'replace'
                                                                ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-900/20'
                                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                                        }`}
                                                    >
                                                        <div className="font-black text-sm text-slate-800 dark:text-white">استبدال الجدول بالكامل (Replace)</div>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            يمسح كافة الاختبارات الحالية في هذا الجدول ويعتمد البيانات المستوردة فقط.
                                                        </p>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                                    <div>
                                        {step > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setStep(step - 1)}
                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                                            >
                                                <ArrowRight size={15} />
                                                السابق
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                                        >
                                            إلغاء
                                        </button>

                                        {step === 2 && (
                                            <button
                                                type="button"
                                                disabled={expandedReadyItems.length === 0}
                                                onClick={() => setStep(3)}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-primary-600 hover:bg-primary-700 text-white shadow-md disabled:opacity-50"
                                            >
                                                التالي: خيارات التطبيق
                                                <ArrowLeft size={15} />
                                            </button>
                                        )}

                                        {step === 3 && (
                                            <>
                                                <button
                                                    type="button"
                                                    disabled={isSubmitting || expandedReadyItems.length === 0}
                                                    onClick={applyToDesigner}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 disabled:opacity-50"
                                                >
                                                    <Layers size={15} />
                                                    إدراج في شاشة التصميم (للمراجعة)
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isSubmitting || expandedReadyItems.length === 0}
                                                    onClick={saveDirectlyToDatabase}
                                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                                >
                                                    <Save size={15} />
                                                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ مباشر كمسودة في قاعدة البيانات'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
