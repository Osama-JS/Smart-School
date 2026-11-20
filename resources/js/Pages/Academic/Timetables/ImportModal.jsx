import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
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
    Grid3x3,
    ListChecks,
    Loader2,
    ShieldCheck,
} from 'lucide-react';
import {
    DAYS_TRANSLATION,
    downloadFlatTimetableTemplate,
    downloadGridTimetableTemplate,
    downloadTimetableErrorReport,
    flattenGradesFromSections,
    getAllowedPeriodsForGrade,
    parseTimetableFile,
    validateTimetableRows,
} from '@/Utils/timetableExcel';

const PAGE_SIZE = 50;

export default function ImportModal({
    show,
    onClose,
    initialYearId = '',
    initialSemesterId = '',
    initialSectionId = '',
    initialGradeId = '',
    initialDivisionId = '',
    onImported,
}) {
    const { auth } = usePage().props;
    const schoolName = auth?.user?.branch?.name || 'المدارس الذكية';
    const fileInputRef = useRef(null);

    const [step, setStep] = useState(1);
    const [sourceTab, setSourceTab] = useState('file'); // 'file' | 'clone'
    const [isDragging, setIsDragging] = useState(false);
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [isValidatingServer, setIsValidatingServer] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [contextData, setContextData] = useState(null);
    const [targetYearId, setTargetYearId] = useState(initialYearId || '');
    const [targetSemesterId, setTargetSemesterId] = useState(initialSemesterId || '');

    const [rawRows, setRawRows] = useState([]);
    const [sourceSummary, setSourceSummary] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'valid' | 'warning' | 'error'
    const [divisionFilter, setDivisionFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'
    const [replaceScope, setReplaceScope] = useState('file_divisions'); // 'file_divisions' | 'division' | 'grade' | 'section' | 'branch'
    const [replaceScopeId, setReplaceScopeId] = useState('');

    // Clone tab state
    const [cloneSemesterId, setCloneSemesterId] = useState('');
    const [cloneScopeType, setCloneScopeType] = useState('all'); // 'all' | 'section' | 'grade' | 'division'
    const [cloneScopeId, setCloneScopeId] = useState('');

    // Step 3 server dry-run validation result
    const [serverCheck, setServerCheck] = useState(null);
    const [serverCheckError, setServerCheckError] = useState('');

    const fetchContext = async (semesterIdParam = null) => {
        setIsLoadingContext(true);
        try {
            const response = await window.axios.get(route('academic.timetable.import.context'), {
                params: semesterIdParam ? { semester_id: semesterIdParam } : {},
            });
            const data = response.data;
            setContextData(data);

            const resolvedSemesterId = semesterIdParam || data.target_semester_id || '';
            if (resolvedSemesterId) {
                setTargetSemesterId(String(resolvedSemesterId));
                const ownerYear = (data.academic_years || []).find((y) =>
                    (y.semesters || []).some((s) => String(s.id) === String(resolvedSemesterId))
                );
                if (ownerYear) {
                    setTargetYearId(String(ownerYear.id));
                }
            }

            if (data.other_semesters?.length > 0) {
                setCloneSemesterId((prev) =>
                    prev && data.other_semesters.some((s) => String(s.id) === String(prev))
                        ? prev
                        : String(data.other_semesters[0].id)
                );
            } else {
                setCloneSemesterId('');
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'تعذر تحميل بيانات الاستيراد',
                text: err?.response?.data?.message || 'حدث خطأ أثناء جلب بيانات الشعب والحصص.',
                confirmButtonText: 'حسناً',
            });
        } finally {
            setIsLoadingContext(false);
        }
    };

    useEffect(() => {
        if (!show) return;
        const initSem = initialSemesterId ? String(initialSemesterId) : '';
        if (initialYearId) setTargetYearId(String(initialYearId));
        if (initSem) setTargetSemesterId(initSem);

        if (initialDivisionId) {
            setReplaceScope('file_divisions');
            setReplaceScopeId(String(initialDivisionId));
        } else if (initialGradeId) {
            setReplaceScopeId(String(initialGradeId));
        } else if (initialSectionId) {
            setReplaceScopeId(String(initialSectionId));
        }

        fetchContext(initSem || null);
    }, [show]);

    const academicYears = contextData?.academic_years || [];
    const availableSemesters = useMemo(() => {
        const year = academicYears.find((y) => String(y.id) === String(targetYearId));
        return year?.semesters || [];
    }, [academicYears, targetYearId]);

    const selectedSemesterName = useMemo(() => {
        const yr = academicYears.find((y) => String(y.id) === String(targetYearId));
        const sem = availableSemesters.find((s) => String(s.id) === String(targetSemesterId));
        if (yr && sem) return `${yr.name} - ${sem.name}`;
        return sem?.name || '';
    }, [academicYears, availableSemesters, targetYearId, targetSemesterId]);

    const sections = contextData?.sections || [];
    const grades = useMemo(() => flattenGradesFromSections(sections), [sections]);
    const periods = contextData?.periods || [];
    const subjects = contextData?.subjects || [];
    const teachers = contextData?.teachers || [];
    const workingDays = contextData?.working_days || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const daysTranslation = contextData?.days_translation || DAYS_TRANSLATION;
    const existingSlots = contextData?.existing_slots || [];
    const otherSemesters = contextData?.other_semesters || [];

    const allDivisionsList = useMemo(() => {
        const list = [];
        grades.forEach((g) => {
            (g.divisions || []).forEach((d) => {
                list.push({
                    id: d.id,
                    label: `${g.name} - ${d.name}`,
                    grade_id: g.id,
                    section_id: g.section_id,
                });
            });
        });
        return list;
    }, [grades]);

    const validationContext = useMemo(
        () => ({
            sections,
            grades,
            periods,
            subjects,
            teachers,
            working_days: workingDays,
            existing_slots: existingSlots,
            division_subject_teachers: contextData?.division_subject_teachers || [],
        }),
        [sections, grades, periods, subjects, teachers, workingDays, existingSlots, contextData]
    );

    const validationResult = useMemo(() => {
        return validateTimetableRows(rawRows, validationContext, {
            mode: importMode,
            scope: replaceScope,
            scopeId: replaceScopeId ? Number(replaceScopeId) : null,
        });
    }, [rawRows, validationContext, importMode, replaceScope, replaceScopeId]);

    const validatedRows = validationResult.rows;
    const stats = validationResult.stats;

    const displayedRows = useMemo(() => {
        return validatedRows.filter((row) => {
            if (statusFilter !== 'all' && row.status !== statusFilter) return false;
            if (divisionFilter && String(row.division_id) !== String(divisionFilter)) return false;
            return true;
        });
    }, [validatedRows, statusFilter, divisionFilter]);

    const totalPages = Math.max(1, Math.ceil(displayedRows.length / PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedRows = useMemo(() => {
        const start = (safeCurrentPage - 1) * PAGE_SIZE;
        return displayedRows.slice(start, start + PAGE_SIZE);
    }, [displayedRows, safeCurrentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, divisionFilter]);

    const readyItems = useMemo(() => {
        return validatedRows
            .filter((r) => r.status !== 'error')
            .map((r) => ({
                row_number: Number(r.sourceRowNumber) || 1,
                division_id: Number(r.division_id),
                day_of_week: r.day_of_week,
                period_id: Number(r.period_id),
                subject_id: Number(r.subject_id),
                teacher_id: Number(r.teacher_id),
            }));
    }, [validatedRows]);

    const buildPayload = () => ({
        semester_id: Number(targetSemesterId),
        mode: importMode,
        scope: importMode === 'replace' ? replaceScope : 'file_divisions',
        scope_id:
            importMode === 'replace' && ['division', 'grade', 'section'].includes(replaceScope) && replaceScopeId
                ? Number(replaceScopeId)
                : null,
        items: readyItems,
    });

    // Server dry-run check whenever user enters Step 3 or changes mode/scope
    useEffect(() => {
        if (!show || step !== 3) return;
        if (!targetSemesterId || readyItems.length === 0) {
            setServerCheck(null);
            setServerCheckError('');
            return;
        }
        if (importMode === 'replace' && ['division', 'grade', 'section'].includes(replaceScope) && !replaceScopeId) {
            setServerCheck(null);
            setServerCheckError('يرجى تحديد الهدف لنطاق الاستبدال المختار.');
            return;
        }

        let cancelled = false;
        const runDryValidation = async () => {
            setIsValidatingServer(true);
            setServerCheckError('');
            try {
                const res = await window.axios.post(route('academic.timetable.import.validate'), buildPayload());
                if (!cancelled) {
                    setServerCheck(res.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setServerCheck(null);
                    const msg =
                        err?.response?.data?.message ||
                        Object.values(err?.response?.data?.errors || {}).flat()[0] ||
                        'تعذر التحقق على الخادم.';
                    setServerCheckError(msg);
                }
            } finally {
                if (!cancelled) {
                    setIsValidatingServer(false);
                }
            }
        };

        runDryValidation();
        return () => {
            cancelled = true;
        };
    }, [show, step, targetSemesterId, importMode, replaceScope, replaceScopeId, readyItems]);

    const resetWizard = () => {
        setStep(1);
        setRawRows([]);
        setSourceSummary('');
        setStatusFilter('all');
        setDivisionFilter('');
        setCurrentPage(1);
        setServerCheck(null);
        setServerCheckError('');
        setIsParsing(false);
        setIsCloning(false);
        setIsValidatingServer(false);
        setIsSubmitting(false);
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetWizard();
        onClose();
    };

    const handleTargetYearChange = (newYearId) => {
        setTargetYearId(newYearId);
        const year = academicYears.find((y) => String(y.id) === String(newYearId));
        const firstSem = year?.semesters?.find((s) => s.is_active) || year?.semesters?.[0];
        if (firstSem) {
            setTargetSemesterId(String(firstSem.id));
            fetchContext(String(firstSem.id));
        } else {
            setTargetSemesterId('');
        }
    };

    const handleTargetSemesterChange = (newSemId) => {
        setTargetSemesterId(newSemId);
        if (newSemId) {
            fetchContext(newSemId);
        }
    };

    const handleDownloadFlatTemplate = async (withExisting = false) => {
        if (!contextData) return;
        await downloadFlatTimetableTemplate({
            sections,
            periods,
            subjects,
            teachers,
            workingDays,
            daysTranslation,
            existingSlots: withExisting ? existingSlots : null,
            schoolName,
            semesterName: selectedSemesterName,
        });
    };

    const handleDownloadGridTemplate = async (withExisting = false) => {
        if (!contextData) return;
        await downloadGridTimetableTemplate({
            sections,
            periods,
            subjects,
            teachers,
            workingDays,
            daysTranslation,
            existingSlots: withExisting ? existingSlots : null,
            divisionIds: null,
            schoolName,
            semesterName: selectedSemesterName,
        });
    };

    const handleProcessFile = async (file) => {
        if (!file || !contextData) return;
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
            const parsed = await parseTimetableFile(file, validationContext);
            if (!parsed.rows || parsed.rows.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'الملف فارغ',
                    text: 'لم يتم العثور على حصص قابلة للاستيراد في الملف المرفوع.',
                    confirmButtonText: 'حسناً',
                });
                return;
            }
            const formatLabel =
                parsed.format === 'grid' ? 'شبكي' : parsed.format === 'flat' ? 'مسطّح' : 'مختلط';
            setRawRows(parsed.rows);
            setSourceSummary(`ملف: ${file.name} (${parsed.rows.length} حصة - ${formatLabel})`);
            setStatusFilter('all');
            setDivisionFilter('');
            setCurrentPage(1);
            setStep(2);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'تعذر قراءة الملف',
                text: err?.message || 'تأكد من سلامة ملف Excel أو استخدم القالب المعتمد.',
                confirmButtonText: 'حسناً',
            });
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCloneFromSemester = async () => {
        if (!cloneSemesterId) {
            Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'يرجى اختيار الفصل المرجعي أولاً.' });
            return;
        }

        let divisionIds = [];
        if (cloneScopeType === 'division' && cloneScopeId) {
            divisionIds = [Number(cloneScopeId)];
        } else if (cloneScopeType === 'grade' && cloneScopeId) {
            const g = grades.find((gr) => String(gr.id) === String(cloneScopeId));
            divisionIds = (g?.divisions || []).map((d) => Number(d.id));
        } else if (cloneScopeType === 'section' && cloneScopeId) {
            grades
                .filter((gr) => String(gr.section_id) === String(cloneScopeId))
                .forEach((gr) => (gr.divisions || []).forEach((d) => divisionIds.push(Number(d.id))));
        }

        setIsCloning(true);
        try {
            const res = await window.axios.get(route('academic.timetable.import.clone-source'), {
                params: {
                    source_semester_id: cloneSemesterId,
                    ...(divisionIds.length > 0 ? { division_ids: divisionIds } : {}),
                },
            });
            const slots = res.data?.slots || [];
            if (slots.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'لا توجد حصص',
                    text: 'لا توجد حصص مسجلة في الفصل المختار ضمن النطاق المحدد.',
                });
                return;
            }

            const mapped = slots.map((s, idx) => ({
                rowKey: `clone_${idx}_${Math.random().toString(36).slice(2, 7)}`,
                sourceRowNumber: idx + 1,
                sheetName: 'Clone',
                grade_id: s.grade_id || '',
                raw_grade: s.raw_grade || '',
                division_id: s.division_id || '',
                raw_division: s.raw_division || '',
                day_of_week: s.day_of_week || '',
                raw_day: s.raw_day || '',
                period_id: s.period_id || '',
                raw_period: s.raw_period || '',
                period_is_break: false,
                period_out_of_group: false,
                subject_id: s.subject_id || '',
                raw_subject: s.raw_subject || '',
                teacher_id: s.teacher_id || '',
                raw_teacher: s.raw_teacher || '',
                teacher_ambiguous: false,
                teacher_candidates: [],
            }));

            const semLabel = otherSemesters.find((s) => String(s.id) === String(cloneSemesterId))?.name || '';
            setRawRows(mapped);
            setSourceSummary(`نسخ من: ${semLabel} (${mapped.length} حصة)`);
            setStatusFilter('all');
            setDivisionFilter('');
            setCurrentPage(1);
            setStep(2);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'تعذر جلب الحصص',
                text: err?.response?.data?.message || 'حدث خطأ أثناء جلب جدول الفصل المرجعي.',
            });
        } finally {
            setIsCloning(false);
        }
    };

    const updateRowField = (rowKey, updater) => {
        setRawRows((prev) =>
            prev.map((r) => {
                if (r.rowKey !== rowKey) return r;
                return typeof updater === 'function' ? updater(r) : { ...r, ...updater };
            })
        );
    };

    const handleRowGradeChange = (rowKey, newGradeId) => {
        const gradeObj = grades.find((g) => String(g.id) === String(newGradeId));
        const allowedPeriods = getAllowedPeriodsForGrade(gradeObj, periods, false);

        updateRowField(rowKey, (row) => {
            const keepPeriod = allowedPeriods.some((p) => String(p.id) === String(row.period_id));
            return {
                ...row,
                grade_id: newGradeId ? Number(newGradeId) : '',
                raw_grade: '',
                division_id: gradeObj?.divisions?.length === 1 ? Number(gradeObj.divisions[0].id) : '',
                raw_division: '',
                period_id: keepPeriod ? row.period_id : '',
                period_is_break: false,
                period_out_of_group: false,
            };
        });
    };

    const deleteRow = (rowKey) => {
        setRawRows((prev) => prev.filter((r) => r.rowKey !== rowKey));
    };

    const addEmptyRow = () => {
        const defaultGrade = grades[0];
        const defaultDiv = defaultGrade?.divisions?.[0];
        const defaultPeriod = getAllowedPeriodsForGrade(defaultGrade, periods, false)[0];

        setRawRows((prev) => [
            {
                rowKey: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                sourceRowNumber: prev.length + 1,
                sheetName: 'Manual',
                grade_id: defaultGrade?.id || '',
                raw_grade: '',
                division_id: defaultDiv?.id || '',
                raw_division: '',
                day_of_week: workingDays[0] || 'Sunday',
                raw_day: '',
                period_id: defaultPeriod?.id || '',
                raw_period: '',
                period_is_break: false,
                period_out_of_group: false,
                subject_id: '',
                raw_subject: '',
                teacher_id: '',
                raw_teacher: '',
                teacher_ambiguous: false,
                teacher_candidates: [],
            },
            ...prev,
        ]);
        setCurrentPage(1);
    };

    const handleReplaceScopeChange = (newScope) => {
        setReplaceScope(newScope);
        if (newScope === 'division') {
            setReplaceScopeId(initialDivisionId || String(allDivisionsList[0]?.id || ''));
        } else if (newScope === 'grade') {
            setReplaceScopeId(initialGradeId || String(grades[0]?.id || ''));
        } else if (newScope === 'section') {
            setReplaceScopeId(initialSectionId || String(sections[0]?.id || ''));
        } else {
            setReplaceScopeId('');
        }
    };

    const submitImport = async () => {
        if (readyItems.length === 0 || !serverCheck?.valid) return;

        if (importMode === 'replace' && (serverCheck?.summary?.will_delete || 0) > 0) {
            const confirmResult = await Swal.fire({
                icon: 'warning',
                title: 'تأكيد استبدال الجدول',
                html: `سيتم حذف <b>${serverCheck.summary.will_delete}</b> حصة حالية في النطاق المحدد واستبدالها بـ <b>${readyItems.length}</b> حصة جديدة.<br/>هل تريد المتابعة؟`,
                showCancelButton: true,
                confirmButtonText: 'نعم، استبدال وحفظ',
                cancelButtonText: 'تراجع',
                confirmButtonColor: '#e11d48',
            });
            if (!confirmResult.isConfirmed) return;
        }

        setIsSubmitting(true);
        router.post(route('academic.timetable.import'), buildPayload(), {
            preserveScroll: true,
            onSuccess: (page) => {
                setIsSubmitting(false);
                onImported?.(page?.props?.flash?.success);
                resetWizard();
                onClose();
            },
            onError: (errors) => {
                setIsSubmitting(false);
                const msgs = Object.values(errors || {}).flat().filter(Boolean);
                Swal.fire({
                    icon: 'error',
                    title: 'تعذر اعتماد الاستيراد',
                    html: msgs.length > 0 ? msgs.slice(0, 8).join('<br/>') : 'حدث خطأ أثناء حفظ البيانات.',
                    confirmButtonText: 'حسناً',
                });
            },
        });
    };

    const stepLabels = [
        { num: 1, title: 'مصدر البيانات' },
        { num: 2, title: 'المعاينة والتصحيح' },
        { num: 3, title: 'التحقق والاعتماد' },
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
                                {/* Header */}
                                <div className="px-6 py-5 bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                                            <FileSpreadsheet size={24} />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-xl font-black text-slate-800 dark:text-white">
                                                مركز استيراد وتصدير الجداول الدراسية
                                            </Dialog.Title>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                                استيراد من Excel/CSV (مسطّح أو شبكي) أو نسخ من فصل سابق مع فحص فوري للتعارضات
                                            </p>
                                        </div>
                                    </div>

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

                                {/* Body */}
                                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                                    {isLoadingContext && !contextData ? (
                                        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
                                            <Loader2 size={32} className="animate-spin text-primary-500" />
                                            <span className="text-sm font-bold">جاري تحميل بيانات الفصول والشعب والحصص...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* STEP 1 */}
                                            {step === 1 && (
                                                <div className="space-y-5">
                                                    {/* Target Year & Semester */}
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5">
                                                                السنة الدراسية المستهدفة
                                                            </label>
                                                            <select
                                                                value={targetYearId}
                                                                onChange={(e) => handleTargetYearChange(e.target.value)}
                                                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-bold"
                                                            >
                                                                {academicYears.map((y) => (
                                                                    <option key={y.id} value={y.id}>
                                                                        {y.name} {y.is_active ? '(نشطة)' : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5">
                                                                الفصل الدراسي المستهدف
                                                            </label>
                                                            <select
                                                                value={targetSemesterId}
                                                                onChange={(e) => handleTargetSemesterChange(e.target.value)}
                                                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-bold"
                                                            >
                                                                {availableSemesters.map((s) => (
                                                                    <option key={s.id} value={s.id}>
                                                                        {s.name} {s.is_active ? '(نشط)' : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Source Mode Tabs */}
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
                                                            نسخ من فصل دراسي سابق ({otherSemesters.length})
                                                        </button>
                                                    </div>

                                                    {sourceTab === 'file' ? (
                                                        <div className="space-y-5">
                                                            {/* Smart Templates & Backup Card */}
                                                            <div className="bg-gradient-to-l from-emerald-50 to-teal-50/60 dark:from-emerald-950/30 dark:to-slate-800/60 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                                <div className="space-y-1">
                                                                    <h4 className="font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                                                                        <Sparkles size={18} className="text-emerald-600" />
                                                                        القوالب الذكية والنسخ الاحتياطي لبيانات فرعك
                                                                    </h4>
                                                                    <p className="text-xs font-semibold text-emerald-800/80 dark:text-emerald-200/70 leading-relaxed">
                                                                        اختر القالب المسطّح (صف لكل حصة مع قوائم منسدلة) أو القالب الشبكي (ورقة لكل شعبة)، أو صدّر الجدول الحالي كنسخة احتياطية.
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        disabled={!contextData}
                                                                        onClick={() => handleDownloadFlatTemplate(false)}
                                                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all"
                                                                    >
                                                                        <ListChecks size={15} />
                                                                        قالب مسطّح (.xlsx)
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={!contextData}
                                                                        onClick={() => handleDownloadGridTemplate(false)}
                                                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-teal-600/20 transition-all"
                                                                    >
                                                                        <Grid3x3 size={15} />
                                                                        قالب شبكي للشعب (.xlsx)
                                                                    </button>
                                                                    {existingSlots.length > 0 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDownloadFlatTemplate(true)}
                                                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 rounded-xl text-xs font-black transition-all"
                                                                        >
                                                                            <Download size={15} />
                                                                            تصدير الحالي ({existingSlots.length})
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Drag & Drop */}
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
                                                                onClick={() => !isParsing && fileInputRef.current?.click()}
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
                                                                    {isParsing
                                                                        ? 'جاري تحليل الملف ومطابقة الحصص والمعلمين...'
                                                                        : 'اسحب ملف الجدول هنا أو اضغط للاختيار'}
                                                                </h4>
                                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                                    يدعم Excel (.xlsx) و CSV (.csv) — يكتشف تلقائياً الصيغة المسطّحة أو الشبكية (المادة / المعلم)
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 space-y-5">
                                                            {otherSemesters.length === 0 ? (
                                                                <div className="text-center py-8 space-y-2">
                                                                    <Copy size={34} className="mx-auto text-slate-400" />
                                                                    <p className="font-bold text-slate-600 dark:text-slate-300">
                                                                        لا توجد فصول دراسية أخرى تحتوي على جداول محفوظة في هذا الفرع.
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                        <div>
                                                                            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
                                                                                الفصل المرجعي (المصدر)
                                                                            </label>
                                                                            <select
                                                                                value={cloneSemesterId}
                                                                                onChange={(e) => setCloneSemesterId(e.target.value)}
                                                                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-bold"
                                                                            >
                                                                                {otherSemesters.map((s) => (
                                                                                    <option key={s.id} value={s.id}>
                                                                                        {s.name} ({s.slots_count} حصة)
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
                                                                                نطاق النسخ
                                                                            </label>
                                                                            <select
                                                                                value={cloneScopeType}
                                                                                onChange={(e) => {
                                                                                    setCloneScopeType(e.target.value);
                                                                                    setCloneScopeId('');
                                                                                }}
                                                                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-bold"
                                                                            >
                                                                                <option value="all">جميع شعب الفرع</option>
                                                                                <option value="section">قسم محدد</option>
                                                                                <option value="grade">صف محدد</option>
                                                                                <option value="division">شعبة محددة</option>
                                                                            </select>
                                                                        </div>
                                                                        {cloneScopeType !== 'all' && (
                                                                            <div>
                                                                                <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
                                                                                    تحديد الهدف
                                                                                </label>
                                                                                <select
                                                                                    value={cloneScopeId}
                                                                                    onChange={(e) => setCloneScopeId(e.target.value)}
                                                                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-bold"
                                                                                >
                                                                                    <option value="">اختر...</option>
                                                                                    {cloneScopeType === 'section' &&
                                                                                        sections.map((sec) => (
                                                                                            <option key={sec.id} value={sec.id}>
                                                                                                {sec.name}
                                                                                            </option>
                                                                                        ))}
                                                                                    {cloneScopeType === 'grade' &&
                                                                                        grades.map((g) => (
                                                                                            <option key={g.id} value={g.id}>
                                                                                                {g.name}
                                                                                            </option>
                                                                                        ))}
                                                                                    {cloneScopeType === 'division' &&
                                                                                        allDivisionsList.map((d) => (
                                                                                            <option key={d.id} value={d.id}>
                                                                                                {d.label}
                                                                                            </option>
                                                                                        ))}
                                                                                </select>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex justify-end">
                                                                        <button
                                                                            type="button"
                                                                            disabled={isCloning}
                                                                            onClick={handleCloneFromSemester}
                                                                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/20 disabled:opacity-60"
                                                                        >
                                                                            {isCloning ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                                                                            جلب ومعاينة الحصص
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* STEP 2 */}
                                            {step === 2 && (
                                                <div className="space-y-4">
                                                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs font-black text-slate-500 dark:text-slate-400 ml-1">
                                                                {sourceSummary}
                                                            </span>
                                                            {[
                                                                { key: 'all', label: `الكل (${stats.total})`, activeCls: 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900', idleCls: 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
                                                                { key: 'valid', label: `جاهز (${stats.valid})`, activeCls: 'bg-emerald-600 text-white border-emerald-600', idleCls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30' },
                                                                { key: 'warning', label: `تنبيهات (${stats.warning})`, activeCls: 'bg-amber-500 text-white border-amber-500', idleCls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30' },
                                                                { key: 'error', label: `أخطاء (${stats.error})`, activeCls: 'bg-rose-600 text-white border-rose-600', idleCls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30' },
                                                            ].map((pill) => (
                                                                <button
                                                                    key={pill.key}
                                                                    type="button"
                                                                    onClick={() => setStatusFilter(pill.key)}
                                                                    className={`px-3 py-1 rounded-lg text-xs font-black border ${
                                                                        statusFilter === pill.key ? pill.activeCls : pill.idleCls
                                                                    }`}
                                                                >
                                                                    {pill.label}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <select
                                                                value={divisionFilter}
                                                                onChange={(e) => setDivisionFilter(e.target.value)}
                                                                className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-bold px-3 py-1.5"
                                                            >
                                                                <option value="">كل الشعب</option>
                                                                {allDivisionsList.map((d) => (
                                                                    <option key={d.id} value={d.id}>
                                                                        {d.label}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            <div className="inline-flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setImportMode('merge')}
                                                                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                                                        importMode === 'merge' ? 'bg-primary-600 text-white' : 'text-slate-500'
                                                                    }`}
                                                                >
                                                                    دمج
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setImportMode('replace')}
                                                                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                                                        importMode === 'replace' ? 'bg-rose-600 text-white' : 'text-slate-500'
                                                                    }`}
                                                                >
                                                                    استبدال
                                                                </button>
                                                            </div>

                                                            {(stats.error > 0 || stats.warning > 0) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => downloadTimetableErrorReport(validatedRows, validationContext)}
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
                                                                >
                                                                    <Download size={14} />
                                                                    تقرير الأخطاء
                                                                </button>
                                                            )}

                                                            <button
                                                                type="button"
                                                                onClick={addEmptyRow}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300"
                                                            >
                                                                <Plus size={14} />
                                                                إضافة صف
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Editable Preview Table */}
                                                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                                                        <div className="overflow-x-auto max-h-[48vh]">
                                                            <table className="w-full text-xs text-right border-collapse">
                                                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-10">
                                                                    <tr>
                                                                        <th className="p-2.5 font-black text-center">#</th>
                                                                        <th className="p-2.5 font-black min-w-[110px]">الحالة</th>
                                                                        <th className="p-2.5 font-black min-w-[140px]">الصف</th>
                                                                        <th className="p-2.5 font-black min-w-[110px]">الشعبة</th>
                                                                        <th className="p-2.5 font-black min-w-[110px]">اليوم</th>
                                                                        <th className="p-2.5 font-black min-w-[145px]">الحصة</th>
                                                                        <th className="p-2.5 font-black min-w-[145px]">المادة</th>
                                                                        <th className="p-2.5 font-black min-w-[175px]">المعلم</th>
                                                                        <th className="p-2.5 font-black text-center">حذف</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                    {paginatedRows.length === 0 ? (
                                                                        <tr>
                                                                            <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                                                                                لا توجد صفوف مطابقة للتصفية الحالية.
                                                                            </td>
                                                                        </tr>
                                                                    ) : (
                                                                        paginatedRows.map((row) => {
                                                                            const gradeObj = grades.find((g) => String(g.id) === String(row.grade_id));
                                                                            const gradeDivisions = gradeObj?.divisions || [];
                                                                            const gradePeriods = getAllowedPeriodsForGrade(gradeObj, periods, false);
                                                                            const rowBg =
                                                                                row.status === 'error'
                                                                                    ? 'bg-rose-50/50 dark:bg-rose-950/20'
                                                                                    : row.status === 'warning'
                                                                                      ? 'bg-amber-50/40 dark:bg-amber-950/15'
                                                                                      : 'bg-white dark:bg-slate-900';

                                                                            return (
                                                                                <React.Fragment key={row.rowKey}>
                                                                                    <tr className={rowBg}>
                                                                                        <td className="p-2 text-center font-bold text-slate-400">
                                                                                            {row.sourceRowNumber}
                                                                                        </td>
                                                                                        <td className="p-2 align-top">
                                                                                            <div className="flex flex-col gap-1 items-start">
                                                                                                {row.status === 'valid' && (
                                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-black">
                                                                                                        <CheckCircle2 size={12} /> جاهز
                                                                                                    </span>
                                                                                                )}
                                                                                                {row.status === 'warning' && (
                                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-black">
                                                                                                        <AlertTriangle size={12} /> تنبيه
                                                                                                    </span>
                                                                                                )}
                                                                                                {row.status === 'error' && (
                                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 font-black">
                                                                                                        <AlertCircle size={12} /> خطأ
                                                                                                    </span>
                                                                                                )}
                                                                                                {row.willOverwrite && (
                                                                                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 text-[10px] font-black">
                                                                                                        تحديث
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="p-2 align-top">
                                                                                            <select
                                                                                                value={row.grade_id || ''}
                                                                                                onChange={(e) => handleRowGradeChange(row.rowKey, e.target.value)}
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
                                                                                            <select
                                                                                                value={row.division_id || ''}
                                                                                                onChange={(e) =>
                                                                                                    updateRowField(row.rowKey, {
                                                                                                        division_id: e.target.value ? Number(e.target.value) : '',
                                                                                                        raw_division: '',
                                                                                                    })
                                                                                                }
                                                                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold px-2 py-1.5"
                                                                                            >
                                                                                                <option value="">الشعبة...</option>
                                                                                                {gradeDivisions.map((d) => (
                                                                                                    <option key={d.id} value={d.id}>
                                                                                                        {d.name}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </select>
                                                                                        </td>
                                                                                        <td className="p-2 align-top">
                                                                                            <select
                                                                                                value={row.day_of_week || ''}
                                                                                                onChange={(e) =>
                                                                                                    updateRowField(row.rowKey, {
                                                                                                        day_of_week: e.target.value,
                                                                                                        raw_day: '',
                                                                                                    })
                                                                                                }
                                                                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold px-2 py-1.5"
                                                                                            >
                                                                                                <option value="">اليوم...</option>
                                                                                                {workingDays.map((day) => (
                                                                                                    <option key={day} value={day}>
                                                                                                        {daysTranslation[day] || day}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </select>
                                                                                        </td>
                                                                                        <td className="p-2 align-top">
                                                                                            <select
                                                                                                value={row.period_id || ''}
                                                                                                onChange={(e) =>
                                                                                                    updateRowField(row.rowKey, {
                                                                                                        period_id: e.target.value ? Number(e.target.value) : '',
                                                                                                        raw_period: '',
                                                                                                        period_is_break: false,
                                                                                                        period_out_of_group: false,
                                                                                                    })
                                                                                                }
                                                                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold px-2 py-1.5"
                                                                                            >
                                                                                                <option value="">الحصة...</option>
                                                                                                {gradePeriods.map((p) => (
                                                                                                    <option key={p.id} value={p.id}>
                                                                                                        {p.period_name} ({p.start_time})
                                                                                                    </option>
                                                                                                ))}
                                                                                            </select>
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
                                                                                                <option value="">المادة...</option>
                                                                                                {subjects.map((s) => (
                                                                                                    <option key={s.id} value={s.id}>
                                                                                                        {s.name}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </select>
                                                                                        </td>
                                                                                        <td className="p-2 align-top">
                                                                                            <select
                                                                                                value={row.teacher_id || ''}
                                                                                                onChange={(e) =>
                                                                                                    updateRowField(row.rowKey, {
                                                                                                        teacher_id: e.target.value ? Number(e.target.value) : '',
                                                                                                        raw_teacher: '',
                                                                                                        teacher_ambiguous: false,
                                                                                                        teacher_candidates: [],
                                                                                                    })
                                                                                                }
                                                                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold px-2 py-1.5"
                                                                                            >
                                                                                                <option value="">المعلم...</option>
                                                                                                {teachers.map((t) => (
                                                                                                    <option key={t.id} value={t.id}>
                                                                                                        {t.display_name || t.name}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </select>
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
                                                                                            <td colSpan={9} className="px-3 pb-2 pt-0">
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
                                                                        })
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {totalPages > 1 && (
                                                            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                                                                <span className="text-slate-500">
                                                                    صفحة {safeCurrentPage} من {totalPages} (عرض {paginatedRows.length} من {displayedRows.length})
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        disabled={safeCurrentPage <= 1}
                                                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                                        className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                                                                    >
                                                                        السابق
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={safeCurrentPage >= totalPages}
                                                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                                        className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                                                                    >
                                                                        التالي
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* STEP 3 */}
                                            {step === 3 && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                            <p className="text-xs font-bold text-slate-500">الحصص المقبولة للحفظ</p>
                                                            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                                                                {readyItems.length}{' '}
                                                                <span className="text-xs font-bold text-slate-400">/ {stats.total}</span>
                                                            </p>
                                                        </div>
                                                        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
                                                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">الشعب المشمولة</p>
                                                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                                                                {stats.divisionsCount}
                                                            </p>
                                                        </div>
                                                        <div className="bg-amber-50/70 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                                                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">تنبيهات غير مانعة</p>
                                                            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                                                                {stats.warning}
                                                            </p>
                                                        </div>
                                                        <div className="bg-rose-50/70 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/50">
                                                            <p className="text-xs font-bold text-rose-700 dark:text-rose-300">صفوف مستبعدة (أخطاء)</p>
                                                            <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                                                                {stats.error}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Mode & Scope */}
                                                    <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
                                                        <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                                            <Layers size={16} className="text-primary-500" />
                                                            آلية التطبيق على الجدول الدراسي ({selectedSemesterName})
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
                                                                <div className="font-black text-sm text-slate-800 dark:text-white">
                                                                    دمج ذكي مع الجدول الحالي (Merge)
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    يحتفظ ببقية الحصص الحالية، ويضيف الجديد أو يحدّث الخانات المتطابقة فقط (الخلايا الفارغة في القالب الشبكي لا تحذف الحصص الحالية).
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
                                                                <div className="font-black text-sm text-slate-800 dark:text-white">
                                                                    استبدال ضمن نطاق محدد (Replace)
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    يمسح الحصص السابقة داخل النطاق المختار ثم يعتمد الحصص المستوردة فقط.
                                                                </p>
                                                            </label>
                                                        </div>

                                                        {importMode === 'replace' && (
                                                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5">
                                                                        نطاق الاستبدال
                                                                    </label>
                                                                    <select
                                                                        value={replaceScope}
                                                                        onChange={(e) => handleReplaceScopeChange(e.target.value)}
                                                                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-bold"
                                                                    >
                                                                        <option value="file_divisions">الشعب الواردة في الملف فقط</option>
                                                                        <option value="division">شعبة محددة</option>
                                                                        <option value="grade">صف كامل</option>
                                                                        <option value="section">قسم كامل</option>
                                                                        <option value="branch">كامل الفرع</option>
                                                                    </select>
                                                                </div>

                                                                {['division', 'grade', 'section'].includes(replaceScope) && (
                                                                    <div>
                                                                        <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5">
                                                                            الهدف المطلوب استبداله
                                                                        </label>
                                                                        <select
                                                                            value={replaceScopeId}
                                                                            onChange={(e) => setReplaceScopeId(e.target.value)}
                                                                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-bold"
                                                                        >
                                                                            <option value="">اختر...</option>
                                                                            {replaceScope === 'division' &&
                                                                                allDivisionsList.map((d) => (
                                                                                    <option key={d.id} value={d.id}>
                                                                                        {d.label}
                                                                                    </option>
                                                                                ))}
                                                                            {replaceScope === 'grade' &&
                                                                                grades.map((g) => (
                                                                                    <option key={g.id} value={g.id}>
                                                                                        {g.name}
                                                                                    </option>
                                                                                ))}
                                                                            {replaceScope === 'section' &&
                                                                                sections.map((sec) => (
                                                                                    <option key={sec.id} value={sec.id}>
                                                                                        {sec.name}
                                                                                    </option>
                                                                                ))}
                                                                        </select>
                                                                    </div>
                                                                )}

                                                                {replaceScope === 'branch' && (
                                                                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl p-3 text-xs font-bold">
                                                                        <AlertTriangle size={18} className="shrink-0" />
                                                                        تحذير: سيؤدي هذا الخيار إلى مسح جداول جميع شعب الفرع لهذا الفصل الدراسي بالكامل.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Server Dry-Run Validation Result */}
                                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <ShieldCheck size={18} className="text-primary-600" />
                                                            <h5 className="font-black text-sm text-slate-800 dark:text-white">
                                                                نتيجة الفحص النهائي على الخادم
                                                            </h5>
                                                        </div>

                                                        {isValidatingServer ? (
                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                                <Loader2 size={16} className="animate-spin text-primary-500" />
                                                                جاري التحقق من التعارضات والصلاحيات على الخادم...
                                                            </div>
                                                        ) : serverCheckError ? (
                                                            <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                                                {serverCheckError}
                                                            </div>
                                                        ) : serverCheck ? (
                                                            serverCheck.valid ? (
                                                                <div className="space-y-3">
                                                                    <div className="flex flex-wrap items-center gap-3 text-xs font-black">
                                                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                                                            <CheckCircle2 size={14} /> جاهز للاعتماد والحفظ
                                                                        </span>
                                                                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                                                            إضافة جديدة: {serverCheck.summary.will_insert}
                                                                        </span>
                                                                        <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                                                                            تحديث حصة: {serverCheck.summary.will_update}
                                                                        </span>
                                                                        <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300">
                                                                            حذف بالاستبدال: {serverCheck.summary.will_delete}
                                                                        </span>
                                                                    </div>
                                                                    {serverCheck.warnings?.length > 0 && (
                                                                        <div className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800/40 max-h-28 overflow-y-auto space-y-1">
                                                                            {serverCheck.warnings.slice(0, 8).map((w, i) => (
                                                                                <div key={i}>• {w.message}</div>
                                                                            ))}
                                                                            {serverCheck.warnings.length > 8 && (
                                                                                <div>... و{serverCheck.warnings.length - 8} تنبيهات أخرى.</div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-800/40 max-h-40 overflow-y-auto space-y-1">
                                                                    {(serverCheck.row_errors || []).map((err, i) => (
                                                                        <div key={i}>• {err.message}</div>
                                                                    ))}
                                                                </div>
                                                            )
                                                        ) : (
                                                            <p className="text-xs font-bold text-slate-400">لا توجد حصص صالحة للفحص.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Footer */}
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
                                                disabled={readyItems.length === 0}
                                                onClick={() => setStep(3)}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-primary-600 hover:bg-primary-700 text-white shadow-md disabled:opacity-50"
                                            >
                                                التالي: الفحص والاعتماد ({readyItems.length})
                                                <ArrowLeft size={15} />
                                            </button>
                                        )}

                                        {step === 3 && (
                                            <button
                                                type="button"
                                                disabled={
                                                    isSubmitting ||
                                                    isValidatingServer ||
                                                    readyItems.length === 0 ||
                                                    !serverCheck?.valid
                                                }
                                                onClick={submitImport}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                                {isSubmitting ? 'جاري الحفظ...' : 'اعتماد وحفظ الجدول'}
                                            </button>
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
