import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';

import Pagination from '@/Components/Pagination';
import InputLabel from '@/Components/InputLabel';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import {
    BookOpen,
    Plus,
    Edit,
    Trash,
    Calendar,
    Filter,
    LayoutGrid,
    List,
    X,
    FileText,
    CheckCircle,
    Clock,
    Target,
    Sparkles,
    Layers,
    Wrench,
    ClipboardCheck,
    Copy,
    Eye,
    Star,
    MessageSquare,
    BookMarked,
    Hash,
    TrendingUp,
    Activity,
    Heart,
    Brain,
    Award,
    Paperclip,
    Upload,
    Download,
    File,
} from 'lucide-react';
import Swal from 'sweetalert2';

const DEFAULT_STRATEGIES = [
    'الحوار والمناقشة',
    'التعلم التعاوني',
    'العصف الذهني',
    'حل المشكلات',
    'التعلم النشط',
    'التعلم باللعب',
    'الاستقصاء والاكتشاف',
    'الفصل المقلوب',
    'التعليم المتمايز',
    'خرائط المفاهيم',
];

const DEFAULT_AIDS = [
    'الكتاب المدرسي',
    'السبورة الذكية',
    'عرض تقديمي (PowerPoint)',
    'بطاقات تعليمية',
    'أوراق عمل',
    'مقطع فيديو تعليمي',
    'مجسمات ونماذج',
    'المختبر / تجارب عملية',
    'تطبيقات رقمية تفاعلية',
];

const CURRICULUM_PROGRESS_PRESETS = [
    'مطابق للخطة',
    'متقدم عن الخطة',
    'متأخر عن الخطة',
];

const ACTIVITIES_CHIPS = [
    'نشاط فردي',
    'نشاط مجموعات عمل',
    'حل أوراق عمل',
    'مسابقة صفية',
    'تجربة عملية',
    'تمثيل أدوار',
];

const BEHAVIORAL_VALUE_CHIPS = [
    'الأمانة والصدق',
    'التعاون والعمل الجماعي',
    'احترام الوقت والنظام',
    'إتقان العمل',
    'النظافة والمحافظة على الممتلكات',
    'احترام المعلم والزملاء',
];

const ACQUIRED_SKILLS_CHIPS = [
    'التفكير الناقد',
    'حل المشكلات',
    'الاستنتاج والتحليل',
    'التواصل والحوار',
    'التطبيق العملي',
    'الدقة والتركيز',
];

const REINFORCEMENTS_CHIPS = [
    'تشجيع لفظي وثناء',
    'نقاط تميز / نجوم',
    'لوحة الشرف',
    'شهادات شكر',
    'تعزيز جماعي للمجموعات',
];

const DAY_ALIASES = {
    sunday: ['sunday', 'الأحد', 'الاحد', '0'],
    monday: ['monday', 'الاثنين', 'الإثنين', '1'],
    tuesday: ['tuesday', 'الثلاثاء', '2'],
    wednesday: ['wednesday', 'الأربعاء', 'الاربعاء', '3'],
    thursday: ['thursday', 'الخميس', '4'],
    friday: ['friday', 'الجمعة', '5'],
    saturday: ['saturday', 'السبت', '6'],
};

const emptyFormState = {
    lesson_title: '',
    unit_title: '',
    page_numbers: '',
    curriculum_progress: 'مطابق للخطة',
    subject_id: '',
    grade_id: '',
    division_id: '',
    period_id: '',
    preparation_date: '',
    learning_objectives: '',
    warm_up: '',
    teaching_strategies: [],
    educational_aids: [],
    educational_activities: '',
    behavioral_value: '',
    acquired_skills: '',
    topics_covered: '',
    assessment_methods: '',
    reinforcements: '',
    notes: '',
    homework: '',
    existing_attachments: [],
    new_attachments: [],
    status: 'draft',
};

const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getProgressBadgeStyle = (progress) => {
    if (!progress) return '';
    if (progress.includes('متأخر')) {
        return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
    }
    if (progress.includes('متقدم')) {
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300';
    }
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
};

export default function Index({ auth, preparations, grades, subjects, schedules = [], filters }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isDuplicateMode, setIsDuplicateMode] = useState(false);
    const [viewingPrep, setViewingPrep] = useState(null);
    const [customStrategy, setCustomStrategy] = useState('');
    const [customAid, setCustomAid] = useState('');
    const [viewMode, setViewMode] = useState('cards');

    const { data, setData, post, delete: destroy, transform, processing, errors, reset, clearErrors } = useForm(emptyFormState);

    const normalizeDate = (value) => {
        if (!value) return '';
        return String(value).slice(0, 10);
    };

    const isAdminUser = Boolean(auth?.user?.is_super_admin || auth?.permissions?.includes('إدارة النظام'));

    const openModal = (preparation = null, duplicate = false) => {
        clearErrors();
        setCustomStrategy('');
        setCustomAid('');

        if (preparation && preparation.id) {
            if (duplicate) {
                setEditingId(null);
                setIsDuplicateMode(true);
                setData({
                    ...emptyFormState,
                    unit_title: preparation.unit_title || '',
                    lesson_title: preparation.lesson_title || '',
                    page_numbers: preparation.page_numbers || '',
                    curriculum_progress: preparation.curriculum_progress || 'مطابق للخطة',
                    learning_objectives: preparation.learning_objectives || '',
                    warm_up: preparation.warm_up || '',
                    teaching_strategies: Array.isArray(preparation.teaching_strategies) ? [...preparation.teaching_strategies] : [],
                    educational_aids: Array.isArray(preparation.educational_aids) ? [...preparation.educational_aids] : [],
                    educational_activities: preparation.educational_activities || '',
                    behavioral_value: preparation.behavioral_value || '',
                    acquired_skills: preparation.acquired_skills || '',
                    topics_covered: preparation.topics_covered || '',
                    assessment_methods: preparation.assessment_methods || '',
                    reinforcements: preparation.reinforcements || '',
                    homework: preparation.homework || '',
                    notes: preparation.notes || '',
                    existing_attachments: [],
                    new_attachments: [],
                    status: 'draft',
                });
            } else {
                setEditingId(preparation.id);
                setIsDuplicateMode(false);
                setData({
                    lesson_title: preparation.lesson_title || '',
                    unit_title: preparation.unit_title || '',
                    page_numbers: preparation.page_numbers || '',
                    curriculum_progress: preparation.curriculum_progress || 'مطابق للخطة',
                    subject_id: preparation.subject_id || '',
                    grade_id: preparation.grade_id || '',
                    division_id: preparation.division_id || '',
                    period_id: preparation.period_id || '',
                    preparation_date: normalizeDate(preparation.preparation_date),
                    learning_objectives: preparation.learning_objectives || '',
                    warm_up: preparation.warm_up || '',
                    teaching_strategies: Array.isArray(preparation.teaching_strategies) ? preparation.teaching_strategies : [],
                    educational_aids: Array.isArray(preparation.educational_aids) ? preparation.educational_aids : [],
                    educational_activities: preparation.educational_activities || '',
                    behavioral_value: preparation.behavioral_value || '',
                    acquired_skills: preparation.acquired_skills || '',
                    topics_covered: preparation.topics_covered || '',
                    assessment_methods: preparation.assessment_methods || '',
                    reinforcements: preparation.reinforcements || '',
                    notes: preparation.notes || '',
                    homework: preparation.homework || '',
                    existing_attachments: Array.isArray(preparation.attachments) ? preparation.attachments : [],
                    new_attachments: [],
                    status: preparation.status || 'draft',
                });
            }
        } else {
            setEditingId(null);
            setIsDuplicateMode(false);
            setData({ ...emptyFormState });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        setData({ ...emptyFormState });
        setEditingId(null);
        setIsDuplicateMode(false);
        setCustomStrategy('');
        setCustomAid('');
    };

    const getAvailableSessions = (dateStr) => {
        if (!dateStr) return [];
        const cleanDate = normalizeDate(dateStr);
        const parts = cleanDate.split('-');
        if (parts.length !== 3) return [];
        const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = dayNames[date.getDay()];
        const aliases = DAY_ALIASES[dayKey] || [dayKey];

        return schedules.filter((s) => s.day_of_week && aliases.includes(s.day_of_week.trim().toLowerCase()));
    };

    const availableSessions = getAvailableSessions(data.preparation_date);

    const handleSessionChange = (v) => {
        const periodId = v || '';

        if (periodId) {
            const session = availableSessions.find((s) => String(s.period_id) === String(periodId));
            if (session) {
                setData((prev) => ({
                    ...prev,
                    period_id: periodId,
                    subject_id: session.subject_id || '',
                    grade_id: session.division?.grade_id || '',
                    division_id: session.division_id || '',
                }));
                return;
            }
        }

        setData((prev) => ({
            ...prev,
            period_id: '',
            subject_id: '',
            grade_id: '',
            division_id: '',
        }));
    };

    const toggleArrayItem = (field, item) => {
        const current = Array.isArray(data[field]) ? data[field] : [];
        if (current.includes(item)) {
            setData(field, current.filter((v) => v !== item));
        } else {
            setData(field, [...current, item]);
        }
    };

    const addCustomChip = (field, inputValue, clearInput) => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;
        const current = Array.isArray(data[field]) ? data[field] : [];
        if (!current.includes(trimmed)) {
            setData(field, [...current, trimmed]);
        }
        clearInput('');
    };

    const appendQuickText = (field, chip) => {
        const current = (data[field] || '').trim();
        if (!current) {
            setData(field, chip);
            return;
        }
        const parts = current.split(/[،,\n]+/).map((p) => p.trim()).filter(Boolean);
        if (parts.includes(chip)) return;
        setData(field, `${current}، ${chip}`);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setData('new_attachments', [...(data.new_attachments || []), ...files]);
        e.target.value = '';
    };

    const removeExistingAttachment = (index) => {
        setData(
            'existing_attachments',
            (data.existing_attachments || []).filter((_, idx) => idx !== index)
        );
    };

    const removeNewAttachment = (index) => {
        setData(
            'new_attachments',
            (data.new_attachments || []).filter((_, idx) => idx !== index)
        );
    };

    const submitWithStatus = (targetStatus) => {
        setData('status', targetStatus);
        transform((currentData) => ({
            ...currentData,
            status: targetStatus,
            attachments_synced: true,
            ...(editingId ? { _method: 'PUT' } : {}),
        }));

        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => closeModal(),
        };

        if (editingId) {
            post(route('teacher.lesson-preparations.update', editingId), options);
        } else {
            post(route('teacher.lesson-preparations.store'), options);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        submitWithStatus(data.status || 'draft');
    };

    const confirmDelete = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'لن تتمكن من التراجع عن هذا!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف!',
            cancelButtonText: 'إلغاء',
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('teacher.lesson-preparations.destroy', id));
            }
        });
    };

    const handleFilterChange = (key, value) => {
        router.get(
            route('teacher.lesson-preparations.index'),
            {
                ...filters,
                [key]: value,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const selectedGrade = grades.find((g) => String(g.id) === String(data.grade_id));
    const divisions = selectedGrade ? selectedGrade.divisions || [] : [];

    const allStrategiesOptions = Array.from(
        new Set([...DEFAULT_STRATEGIES, ...(Array.isArray(data.teaching_strategies) ? data.teaching_strategies : [])])
    );
    const allAidsOptions = Array.from(
        new Set([...DEFAULT_AIDS, ...(Array.isArray(data.educational_aids) ? data.educational_aids : [])])
    );

    const canEditOrDelete = (prep) => prep.status !== 'published' || isAdminUser;

    const renderStars = (rating) => {
        if (!rating) return null;
        return (
            <div className="flex items-center gap-0.5" title={`تقييم المشرف: ${rating} من 5`}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={13}
                        className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}
                    />
                ))}
            </div>
        );
    };

    const renderQuickChipsField = ({ id, field, label, icon: Icon, iconColor, chips, placeholder, rows = 2 }) => {
        const currentParts = (data[field] || '')
            .split(/[،,\n]+/)
            .map((p) => p.trim())
            .filter(Boolean);

        return (
            <div className="space-y-2">
                <label htmlFor={id} className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Icon size={16} className={iconColor} />
                    {label} <span className="text-xs font-semibold text-slate-400">(اختياري)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {chips.map((chip) => {
                        const included = currentParts.includes(chip);
                        return (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => appendQuickText(field, chip)}
                                className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                                    included
                                        ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-500/30'
                                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400'
                                }`}
                            >
                                {included ? '✓ ' : '+ '}
                                {chip}
                            </button>
                        );
                    })}
                </div>
                <textarea
                    id={id}
                    className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-5 py-3 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-y"
                    rows={rows}
                    placeholder={placeholder}
                    value={data[field]}
                    onChange={(e) => setData(field, e.target.value)}
                ></textarea>
                {errors[field] && <p className="text-xs font-bold text-red-500 mt-1">{errors[field]}</p>}
            </div>
        );
    };

    const attachmentErrorKeys = Object.keys(errors).filter(
        (k) => k === 'new_attachments' || k.startsWith('new_attachments.')
    );

    return (
        <AdminLayout user={auth.user}>
            <Head title="دفاتر التحضير والمتابعة" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />

                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <BookOpen size={28} className="text-primary-600" />
                                دفاتري للتحضير والمتابعة
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                إعداد وتوثيق تحضير الدروس اليومية والأهداف والأنشطة والمهارات والمرفقات
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => openModal(null)}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>إضافة تحضير جديد</span>
                            </button>
                            <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    title="عرض كبطاقات"
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    title="عرض كجدول"
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />

                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={18} className="text-primary-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white">تصفية النتائج</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="group flex flex-col">
                            <InputLabel value="المادة" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput
                                className="w-full"
                                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                                value={filters.subject_id || ''}
                                onChange={(v) => handleFilterChange('subject_id', v || '')}
                                placeholder="الكل"
                                isClearable
                            />
                        </div>
                        <div className="group flex flex-col">
                            <InputLabel value="الصف" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput
                                className="w-full"
                                options={grades.map((g) => ({ value: g.id, label: g.name }))}
                                value={filters.grade_id || ''}
                                onChange={(v) => handleFilterChange('grade_id', v || '')}
                                placeholder="الكل"
                                isClearable
                            />
                        </div>
                        <div className="group flex flex-col">
                            <InputLabel value="الفترة الزمنية" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <div className="mt-1 relative">
                                <FlatpickrInput
                                    value={filters.date_range || ''}
                                    onChange={(val) => handleFilterChange('date_range', val)}
                                    options={{
                                        mode: 'range',
                                        dateFormat: 'Y-m-d',
                                    }}
                                    placeholder="من - إلى"
                                    className="w-full pl-10 !py-[11px] border-slate-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preparations Grid/Table */}
                {viewMode === 'cards' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {preparations.data.length > 0 ? (
                            preparations.data.map((prep) => (
                                <div
                                    key={prep.id}
                                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                                >
                                    <div className={`absolute top-0 right-0 w-full h-1 ${prep.status === 'published' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start gap-2 mb-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                                    <span
                                                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                                            prep.status === 'published'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                        }`}
                                                    >
                                                        {prep.status === 'published' ? 'منشور' : 'مسودة'}
                                                    </span>
                                                    {prep.period?.period_name && (
                                                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                                                            {prep.period.period_name}
                                                        </span>
                                                    )}
                                                    {prep.curriculum_progress && (
                                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getProgressBadgeStyle(prep.curriculum_progress)}`}>
                                                            {prep.curriculum_progress}
                                                        </span>
                                                    )}
                                                    {prep.page_numbers && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                            {prep.page_numbers}
                                                        </span>
                                                    )}
                                                </div>
                                                {prep.unit_title && (
                                                    <p className="text-[11px] font-bold text-primary-600 dark:text-primary-400 truncate mb-0.5">
                                                        {prep.unit_title}
                                                    </p>
                                                )}
                                                <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 line-clamp-2">
                                                    {prep.lesson_title}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5 text-primary-500" />
                                                        <span dir="ltr">{normalizeDate(prep.preparation_date)}</span>
                                                    </span>
                                                    {Array.isArray(prep.attachments) && prep.attachments.length > 0 && (
                                                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                                                            <Paperclip className="w-3.5 h-3.5" />
                                                            {prep.attachments.length} مرفق
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-1 shrink-0">
                                                <button
                                                    onClick={() => setViewingPrep(prep)}
                                                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openModal(prep, true)}
                                                    className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="نسخ التحضير لشعبة أخرى"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                {canEditOrDelete(prep) && (
                                                    <>
                                                        <button
                                                            onClick={() => openModal(prep, false)}
                                                            className="p-1.5 text-primary-600 hover:bg-primary-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="تعديل"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(prep.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="حذف"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2 mt-2">
                                            <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                                                <span className="font-bold text-slate-500 dark:text-slate-400 min-w-[48px]">المادة:</span>
                                                <span className="text-slate-700 dark:text-slate-200 font-bold truncate">{prep.subject?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                                                <span className="font-bold text-slate-500 dark:text-slate-400 min-w-[48px]">الصف:</span>
                                                <span className="text-slate-700 dark:text-slate-200 font-bold truncate">
                                                    {prep.grade?.name} {prep.division ? `- شعبة ${prep.division.name}` : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {prep.behavioral_value && (
                                            <div className="mt-3 text-[11px] font-bold text-pink-700 dark:text-pink-300 bg-pink-50/80 dark:bg-pink-500/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 line-clamp-1">
                                                <Heart size={12} className="shrink-0" />
                                                <span className="truncate">القيمة السلوكية: {prep.behavioral_value}</span>
                                            </div>
                                        )}

                                        {Array.isArray(prep.teaching_strategies) && prep.teaching_strategies.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {prep.teaching_strategies.slice(0, 3).map((st, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                                                    >
                                                        {st}
                                                    </span>
                                                ))}
                                                {prep.teaching_strategies.length > 3 && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        +{prep.teaching_strategies.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {(prep.supervisor_rating || prep.supervisor_notes) && (
                                            <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 space-y-1.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                                        <MessageSquare size={12} />
                                                        توجيه المشرف التربوي
                                                    </span>
                                                    {renderStars(prep.supervisor_rating)}
                                                </div>
                                                {prep.supervisor_notes && (
                                                    <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2 font-medium leading-relaxed">
                                                        {prep.supervisor_notes}
                                                    </p>
                                                )}
                                                {prep.reviewer?.name && (
                                                    <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-bold">
                                                        بواسطة: {prep.reviewer.name}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد سجلات</h3>
                                <p className="mt-1 text-slate-500 font-medium">لم تقم بإضافة أي سجلات تحضير أو متابعة للدروس حتى الآن.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right text-slate-500 dark:text-slate-400">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
                                    <tr>
                                        <th className="px-5 py-4 rounded-tr-3xl font-bold">التاريخ والحصة</th>
                                        <th className="px-5 py-4 font-bold">الحالة والسير في المنهج</th>
                                        <th className="px-5 py-4 font-bold">الوحدة وعنوان الدرس</th>
                                        <th className="px-5 py-4 font-bold">المادة والصف</th>
                                        <th className="px-5 py-4 font-bold">ملاحظات المشرف</th>
                                        <th className="px-5 py-4 rounded-tl-3xl text-center font-bold">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preparations.data.length > 0 ? (
                                        preparations.data.map((prep) => (
                                            <tr key={prep.id} className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-slate-900 dark:text-white" dir="ltr">
                                                        {normalizeDate(prep.preparation_date)}
                                                    </div>
                                                    {prep.period?.period_name && (
                                                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                                                            {prep.period.period_name}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 space-y-1">
                                                    <div>
                                                        <span
                                                            className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                                                                prep.status === 'published'
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                            }`}
                                                        >
                                                            {prep.status === 'published' ? 'منشور' : 'مسودة'}
                                                        </span>
                                                    </div>
                                                    {prep.curriculum_progress && (
                                                        <div>
                                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getProgressBadgeStyle(prep.curriculum_progress)}`}>
                                                                {prep.curriculum_progress}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {prep.unit_title && (
                                                        <div className="text-[11px] font-bold text-primary-600 dark:text-primary-400">{prep.unit_title}</div>
                                                    )}
                                                    <div className="font-bold text-slate-700 dark:text-slate-200">{prep.lesson_title}</div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                                        {prep.page_numbers && <span>{prep.page_numbers}</span>}
                                                        {Array.isArray(prep.attachments) && prep.attachments.length > 0 && (
                                                            <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                                                                <Paperclip size={11} />
                                                                {prep.attachments.length} مرفق
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-slate-700 dark:text-slate-300">{prep.subject?.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        {prep.grade?.name} {prep.division ? `- ${prep.division.name}` : ''}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {prep.supervisor_rating || prep.supervisor_notes ? (
                                                        <div className="space-y-1 max-w-xs">
                                                            {renderStars(prep.supervisor_rating)}
                                                            {prep.supervisor_notes && (
                                                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{prep.supervisor_notes}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => setViewingPrep(prep)}
                                                            className="p-2 text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="عرض التفاصيل"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openModal(prep, true)}
                                                            className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                                                            title="نسخ التحضير لشعبة أخرى"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                        {canEditOrDelete(prep) && (
                                                            <>
                                                                <button
                                                                    onClick={() => openModal(prep, false)}
                                                                    className="p-2 text-primary-600 bg-primary-50 dark:bg-primary-500/10 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-lg transition-colors"
                                                                    title="تعديل"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => confirmDelete(prep.id)}
                                                                    className="p-2 text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                                                    title="حذف"
                                                                >
                                                                    <Trash className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center">
                                                <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد سجلات</h3>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-6">
                    <Pagination links={preparations.links} />
                </div>
            </div>

            {/* Add / Edit / Duplicate Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
                    <div className="relative bg-white/95 dark:bg-[#121820]/95 backdrop-blur-xl rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
                        <div className="absolute top-0 right-0 w-full h-40 bg-gradient-to-b from-primary-500/10 to-transparent pointer-events-none" />
                        <div className="absolute top-10 right-10 w-32 h-32 bg-primary-500/20 rounded-full blur-[50px] pointer-events-none" />

                        {/* Modal Header */}
                        <div className="relative flex items-center justify-between p-6 border-b border-slate-100/50 dark:border-slate-800/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                                    {editingId ? <Edit size={22} /> : isDuplicateMode ? <Copy size={22} /> : <Plus size={22} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {editingId ? 'تعديل تحضير الدرس' : isDuplicateMode ? 'نسخ التحضير لشعبة أخرى' : 'إضافة تحضير درس جديد'}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                        {isDuplicateMode
                                            ? 'اختر تاريخ التنفيذ والحصة المستهدفة للشعبة الجديدة مع إمكانية تعديل أي تفاصيل'
                                            : 'أدخل بيانات الحصة وعناصر التحضير التربوي بدقة لضمان المتابعة الصحيحة'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 relative z-10">
                            {/* Section 1: بيانات الحصة والجدول */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-black flex items-center justify-center">
                                        1
                                    </span>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white">بيانات الحصة والجدول</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
                                            تاريخ التنفيذ <span className="text-red-500">*</span>
                                        </label>
                                        <FlatpickrInput
                                            id="preparation_date"
                                            value={data.preparation_date}
                                            onChange={(dateStr) => setData('preparation_date', dateStr)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
                                            placeholder="اختر التاريخ..."
                                        />
                                        {errors.preparation_date && (
                                            <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                                                <X size={14} />
                                                {errors.preparation_date}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
                                            الحصة الدراسية (من جدولك)
                                        </label>
                                        <SelectInput
                                            id="period_id"
                                            options={availableSessions.map((s) => ({
                                                value: s.period_id,
                                                label: `${s.period?.period_name || 'حصة'} - ${s.subject?.name} (${s.division?.grade?.name} - ${s.division?.name})`,
                                            }))}
                                            value={data.period_id}
                                            onChange={handleSessionChange}
                                            placeholder="اختر الحصة لملء المادة والصف تلقائياً..."
                                            isDisabled={!data.preparation_date || availableSessions.length === 0}
                                            className="shadow-sm"
                                        />
                                        {data.preparation_date && availableSessions.length === 0 && (
                                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                لا توجد حصص مجدولة لك في هذا اليوم — يمكنك تحديد المادة والصف يدوياً أدناه
                                            </p>
                                        )}
                                        {errors.period_id && (
                                            <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                                                <X size={14} />
                                                {errors.period_id}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-50/80 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1.5">
                                            المادة <span className="text-red-500">*</span>
                                        </label>
                                        <SelectInput
                                            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                                            value={data.subject_id}
                                            onChange={(v) => setData('subject_id', v || '')}
                                            placeholder="اختر المادة..."
                                        />
                                        {errors.subject_id && <p className="text-xs font-bold text-red-500 mt-1">{errors.subject_id}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1.5">
                                            الصف الدراسي <span className="text-red-500">*</span>
                                        </label>
                                        <SelectInput
                                            options={grades.map((g) => ({ value: g.id, label: g.name }))}
                                            value={data.grade_id}
                                            onChange={(v) => {
                                                setData((prev) => ({ ...prev, grade_id: v || '', division_id: '' }));
                                            }}
                                            placeholder="اختر الصف..."
                                        />
                                        {errors.grade_id && <p className="text-xs font-bold text-red-500 mt-1">{errors.grade_id}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1.5">الشعبة</label>
                                        <SelectInput
                                            options={divisions.map((d) => ({ value: d.id, label: d.name }))}
                                            value={data.division_id}
                                            onChange={(v) => setData('division_id', v || '')}
                                            placeholder="اختر الشعبة..."
                                            isDisabled={!data.grade_id || divisions.length === 0}
                                        />
                                        {errors.division_id && <p className="text-xs font-bold text-red-500 mt-1">{errors.division_id}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: بيانات موقع الدرس في المنهج والسير حسب الخطة */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center">
                                        2
                                    </span>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white">موقع الدرس في المنهج والسير حسب الخطة</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <BookMarked size={15} className="text-indigo-500" />
                                            اسم الوحدة / الفصل <span className="text-xs font-semibold text-slate-400">(اختياري)</span>
                                        </label>
                                        <input
                                            id="unit_title"
                                            value={data.unit_title}
                                            onChange={(e) => setData('unit_title', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
                                            placeholder="مثال: الوحدة الثالثة - الكسور"
                                        />
                                        {errors.unit_title && <p className="text-xs font-bold text-red-500 mt-1">{errors.unit_title}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
                                            عنوان الحصة / الدرس <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="lesson_title"
                                            value={data.lesson_title}
                                            onChange={(e) => setData('lesson_title', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
                                            placeholder="مثال: جمع الكسور المتشابهة"
                                            required
                                        />
                                        {errors.lesson_title && (
                                            <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                                                <X size={14} />
                                                {errors.lesson_title}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <Hash size={15} className="text-slate-500" />
                                            أرقام الصفحات <span className="text-xs font-semibold text-slate-400">(اختياري)</span>
                                        </label>
                                        <input
                                            id="page_numbers"
                                            value={data.page_numbers}
                                            onChange={(e) => setData('page_numbers', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
                                            placeholder="مثال: ص 42 - 45"
                                        />
                                        {errors.page_numbers && <p className="text-xs font-bold text-red-500 mt-1">{errors.page_numbers}</p>}
                                    </div>
                                </div>

                                {/* Curriculum Progress */}
                                <div className="space-y-2.5 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <label htmlFor="curriculum_progress" className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <TrendingUp size={16} className="text-emerald-500" />
                                        السير في المنهج حسب الخطة <span className="text-xs font-semibold text-slate-400">(اختياري)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {CURRICULUM_PROGRESS_PRESETS.map((preset) => {
                                            const active = data.curriculum_progress === preset;
                                            return (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setData('curriculum_progress', preset)}
                                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                        active
                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                                                    }`}
                                                >
                                                    {active ? '✓ ' : ''}
                                                    {preset}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input
                                        id="curriculum_progress"
                                        value={data.curriculum_progress}
                                        onChange={(e) => setData('curriculum_progress', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
                                        placeholder="يمكنك اختيار حالة الخطة أعلاه أو كتابة توضيح (مثال: متأخر حصة واحدة بسبب نشاط مدرسي)..."
                                    />
                                    {errors.curriculum_progress && <p className="text-xs font-bold text-red-500 mt-1">{errors.curriculum_progress}</p>}
                                </div>
                            </div>

                            {/* Section 3: عناصر التحضير التربوي وسير الحصة */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center">
                                        3
                                    </span>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white">عناصر التحضير التربوي وسير الحصة</h4>
                                </div>

                                {/* Learning Objectives */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <Target size={16} className="text-rose-500" />
                                        الأهداف التعليمية / السلوكية <span className="text-xs font-bold text-amber-600">(إلزامي عند النشر)</span>
                                    </label>
                                    <textarea
                                        id="learning_objectives"
                                        className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-5 py-3.5 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-y"
                                        rows="3"
                                        placeholder="1. أن يتعرف الطالب على...&#10;2. أن يطبق الطالب..."
                                        value={data.learning_objectives}
                                        onChange={(e) => setData('learning_objectives', e.target.value)}
                                    ></textarea>
                                    {errors.learning_objectives && (
                                        <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                                            <X size={14} />
                                            {errors.learning_objectives}
                                        </p>
                                    )}
                                </div>

                                {/* Warm Up */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <Sparkles size={16} className="text-amber-500" />
                                        التمهيد والتهيئة الحافزة <span className="text-xs font-semibold text-slate-400">(اختياري)</span>
                                    </label>
                                    <textarea
                                        id="warm_up"
                                        className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-5 py-3.5 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-y"
                                        rows="2"
                                        placeholder="سؤال استهلالي، ربط بالدرس السابق، أو نشاط تهيئة..."
                                        value={data.warm_up}
                                        onChange={(e) => setData('warm_up', e.target.value)}
                                    ></textarea>
                                    {errors.warm_up && <p className="text-xs font-bold text-red-500 mt-1">{errors.warm_up}</p>}
                                </div>

                                {/* Teaching Strategies (Chips + Custom) */}
                                <div className="space-y-2.5">
                                    <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <Layers size={16} className="text-blue-500" />
                                        استراتيجيات التدريس <span className="text-xs font-bold text-amber-600">(إلزامي عند النشر)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {allStrategiesOptions.map((strategy) => {
                                            const active = (data.teaching_strategies || []).includes(strategy);
                                            return (
                                                <button
                                                    key={strategy}
                                                    type="button"
                                                    onClick={() => toggleArrayItem('teaching_strategies', strategy)}
                                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                        active
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                                    }`}
                                                >
                                                    {active ? '✓ ' : '+ '}
                                                    {strategy}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <input
                                            type="text"
                                            value={customStrategy}
                                            onChange={(e) => setCustomStrategy(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addCustomChip('teaching_strategies', customStrategy, setCustomStrategy);
                                                }
                                            }}
                                            placeholder="أضف استراتيجية أخرى غير مذكورة..."
                                            className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addCustomChip('teaching_strategies', customStrategy, setCustomStrategy)}
                                            className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors"
                                        >
                                            إضافة
                                        </button>
                                    </div>
                                    {errors.teaching_strategies && (
                                        <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                                            <X size={14} />
                                            {errors.teaching_strategies}
                                        </p>
                                    )}
                                </div>

                                {/* Educational Aids (Chips + Custom) */}
                                <div className="space-y-2.5">
                                    <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <Wrench size={16} className="text-purple-500" />
                                        الوسائل التعليمية <span className="text-xs font-bold text-amber-600">(إلزامي عند النشر)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {allAidsOptions.map((aid) => {
                                            const active = (data.educational_aids || []).includes(aid);
                                            return (
                                                <button
                                                    key={aid}
                                                    type="button"
                                                    onClick={() => toggleArrayItem('educational_aids', aid)}
                                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                        active
                                                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                                                    }`}
                                                >
                                                    {active ? '✓ ' : '+ '}
                                                    {aid}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <input
                                            type="text"
                                            value={customAid}
                                            onChange={(e) => setCustomAid(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addCustomChip('educational_aids', customAid, setCustomAid);
                                                }
                                            }}
                                            placeholder="أضف وسيلة تعليمية أخرى..."
                                            className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addCustomChip('educational_aids', customAid, setCustomAid)}
                                            className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-colors"
                                        >
                                            إضافة
                                        </button>
                                    </div>
                                    {errors.educational_aids && (
                                        <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                                            <X size={14} />
                                            {errors.educational_aids}
                                        </p>
                                    )}
                                </div>

                                {/* Topics Covered */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <FileText size={16} className="text-primary-500" />
                                        العرض / ما تم دراسته <span className="text-xs font-bold text-amber-600">(إلزامي عند النشر)</span>
                                    </label>
                                    <textarea
                                        id="topics_covered"
                                        className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-5 py-4 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-y"
                                        rows="3"
                                        placeholder="اكتب هنا خطوات العرض وملخص ما سيتم شرحه وتطبيقه في الحصة..."
                                        value={data.topics_covered}
                                        onChange={(e) => setData('topics_covered', e.target.value)}
                                    ></textarea>
                                    {errors.topics_covered && (
                                        <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                                            <X size={14} />
                                            {errors.topics_covered}
                                        </p>
                                    )}
                                </div>

                                {/* Educational Activities */}
                                {renderQuickChipsField({
                                    id: 'educational_activities',
                                    field: 'educational_activities',
                                    label: 'الأنشطة التعليمية',
                                    icon: Activity,
                                    iconColor: 'text-cyan-500',
                                    chips: ACTIVITIES_CHIPS,
                                    placeholder: 'الأنشطة الصفية الفردية أو الجماعية التي ينفذها الطلاب...',
                                })}

                                {/* Behavioral Value & Acquired Skills */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {renderQuickChipsField({
                                        id: 'behavioral_value',
                                        field: 'behavioral_value',
                                        label: 'القيمة السلوكية',
                                        icon: Heart,
                                        iconColor: 'text-pink-500',
                                        chips: BEHAVIORAL_VALUE_CHIPS,
                                        placeholder: 'القيمة الأخلاقية أو السلوكية المرتبطة بالدرس...',
                                    })}

                                    {renderQuickChipsField({
                                        id: 'acquired_skills',
                                        field: 'acquired_skills',
                                        label: 'المهارات المكتسبة',
                                        icon: Brain,
                                        iconColor: 'text-violet-500',
                                        chips: ACQUIRED_SKILLS_CHIPS,
                                        placeholder: 'المهارات المعرفية أو العملية التي يكتسبها الطالب...',
                                    })}
                                </div>

                                {/* Assessment Methods & Reinforcements */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <ClipboardCheck size={16} className="text-teal-500" />
                                            التقويم المرحلي والختامي <span className="text-xs font-semibold text-slate-400">(اختياري)</span>
                                        </label>
                                        <textarea
                                            id="assessment_methods"
                                            className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-5 py-3.5 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-y"
                                            rows="3"
                                            placeholder="أسئلة التقويم أو النشاط الختامي للتحقق من تحقق الأهداف..."
                                            value={data.assessment_methods}
                                            onChange={(e) => setData('assessment_methods', e.target.value)}
                                        ></textarea>
                                        {errors.assessment_methods && <p className="text-xs font-bold text-red-500 mt-1">{errors.assessment_methods}</p>}
                                    </div>

                                    {renderQuickChipsField({
                                        id: 'reinforcements',
                                        field: 'reinforcements',
                                        label: 'التعزيزات',
                                        icon: Award,
                                        iconColor: 'text-amber-500',
                                        chips: REINFORCEMENTS_CHIPS,
                                        placeholder: 'أساليب تحفيز وتعزيز الطلاب خلال الحصة...',
                                    })}
                                </div>
                            </div>

                            {/* Section 4: الواجب المنزلي والمرفقات والملاحظات */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center">
                                        4
                                    </span>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white">الواجب المنزلي والمرفقات والملاحظات</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <BookOpen size={16} className="text-emerald-500" />
                                            الواجب المنزلي المطلوب <span className="text-xs font-semibold text-slate-400">(اختياري)</span>
                                        </label>
                                        <textarea
                                            id="homework"
                                            className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-5 py-3.5 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-y"
                                            rows="2"
                                            placeholder="تفاصيل الواجب المنزلي (إن وجد)..."
                                            value={data.homework}
                                            onChange={(e) => setData('homework', e.target.value)}
                                        ></textarea>
                                        {errors.homework && <p className="text-xs font-bold text-red-500 mt-1">{errors.homework}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-slate-400 rounded-full"></span>
                                            ملاحظات المعلم <span className="text-xs font-semibold text-slate-400">(اختياري)</span>
                                        </label>
                                        <textarea
                                            id="notes"
                                            className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-5 py-3.5 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-y"
                                            rows="2"
                                            placeholder="أي ملاحظات إضافية حول الحصة أو الطلاب..."
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                        ></textarea>
                                        {errors.notes && <p className="text-xs font-bold text-red-500 mt-1">{errors.notes}</p>}
                                    </div>
                                </div>

                                {/* Attachments Upload Area */}
                                <div className="space-y-3 bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <label className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <Paperclip size={16} className="text-indigo-500" />
                                            المرفقات (أوراق عمل، عروض، صور، PDF) <span className="text-xs font-semibold text-slate-400">(اختياري - حد أقصى 20MB للملف)</span>
                                        </label>
                                        <label className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center gap-2 transition-colors">
                                            <Upload size={14} />
                                            <span>اختيار ملفات</span>
                                            <input
                                                type="file"
                                                multiple
                                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    {((data.existing_attachments || []).length > 0 || (data.new_attachments || []).length > 0) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                            {(data.existing_attachments || []).map((att, idx) => (
                                                <div
                                                    key={`existing-${idx}`}
                                                    className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <File size={15} className="text-indigo-500 shrink-0" />
                                                        <a
                                                            href={`/storage/${att.path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-primary-600 truncate"
                                                        >
                                                            {att.name}
                                                        </a>
                                                        {att.size && <span className="text-[10px] text-slate-400 shrink-0">{formatBytes(att.size)}</span>}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingAttachment(idx)}
                                                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                                                        title="إزالة المرفق"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            {(data.new_attachments || []).map((file, idx) => (
                                                <div
                                                    key={`new-${idx}`}
                                                    className="flex items-center justify-between gap-2 bg-indigo-50/70 dark:bg-indigo-500/10 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Upload size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate">{file.name}</span>
                                                        <span className="text-[10px] text-indigo-500 shrink-0">{formatBytes(file.size)}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewAttachment(idx)}
                                                        className="p-1 text-indigo-400 hover:text-red-500 rounded-lg"
                                                        title="إلغاء الملف"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {attachmentErrorKeys.map((k) => (
                                        <p key={k} className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                                            <X size={14} />
                                            {errors[k]}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4 mt-8 border-t border-slate-100 dark:border-slate-800/50">
                                <button
                                    type="button"
                                    onClick={() => submitWithStatus('draft')}
                                    disabled={processing}
                                    className="flex-1 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:bg-amber-500/20 dark:hover:bg-amber-500 dark:text-amber-400 dark:hover:text-white border border-amber-200 dark:border-amber-500/30 px-6 py-4 rounded-[1.25rem] font-black flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
                                >
                                    <Clock size={20} />
                                    حفظ كمسودة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => submitWithStatus('published')}
                                    disabled={processing}
                                    className="flex-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-8 py-4 rounded-[1.25rem] font-black flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-primary-500/30 hover:-translate-y-0.5 active:scale-95"
                                >
                                    <CheckCircle size={20} />
                                    نشر الحصة
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="w-full sm:w-auto px-8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-4 rounded-[1.25rem] font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Read-only Details Modal */}
            {viewingPrep && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingPrep(null)}></div>
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-start justify-between gap-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                                        {viewingPrep.status === 'published' ? 'منشور' : 'مسودة'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-[10px] font-bold" dir="ltr">
                                        {normalizeDate(viewingPrep.preparation_date)}
                                    </span>
                                    {viewingPrep.period?.period_name && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                                            {viewingPrep.period.period_name}
                                        </span>
                                    )}
                                    {viewingPrep.curriculum_progress && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                                            {viewingPrep.curriculum_progress}
                                        </span>
                                    )}
                                </div>
                                {viewingPrep.unit_title && <p className="text-xs text-white/80 font-bold">{viewingPrep.unit_title}</p>}
                                <h3 className="text-xl font-black">{viewingPrep.lesson_title}</h3>
                            </div>
                            <button
                                onClick={() => setViewingPrep(null)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                                    <p className="text-[10px] font-black text-slate-400 mb-1">المادة</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{viewingPrep.subject?.name || '-'}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                                    <p className="text-[10px] font-black text-slate-400 mb-1">الصف والشعبة</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                                        {viewingPrep.grade?.name || '-'} {viewingPrep.division ? `- ${viewingPrep.division.name}` : ''}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                                    <p className="text-[10px] font-black text-slate-400 mb-1">أرقام الصفحات</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{viewingPrep.page_numbers || '-'}</p>
                                </div>
                            </div>

                            {viewingPrep.learning_objectives && (
                                <div className="bg-rose-50/40 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4">
                                    <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                                        <Target size={14} /> الأهداف التعليمية / السلوكية
                                    </h4>
                                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                        {viewingPrep.learning_objectives}
                                    </p>
                                </div>
                            )}

                            {viewingPrep.warm_up && (
                                <div className="bg-amber-50/40 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-4">
                                    <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                                        <Sparkles size={14} /> التمهيد والتهيئة
                                    </h4>
                                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                        {viewingPrep.warm_up}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                    <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                                        <Layers size={14} /> استراتيجيات التدريس
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.isArray(viewingPrep.teaching_strategies) && viewingPrep.teaching_strategies.length > 0 ? (
                                            viewingPrep.teaching_strategies.map((item, idx) => (
                                                <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-100/70 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                                    {item}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-400">غير محدد</span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                    <h4 className="text-xs font-black text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1.5">
                                        <Wrench size={14} /> الوسائل التعليمية
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.isArray(viewingPrep.educational_aids) && viewingPrep.educational_aids.length > 0 ? (
                                            viewingPrep.educational_aids.map((item, idx) => (
                                                <span key={idx} className="px-2.5 py-1 rounded-lg bg-purple-100/70 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold">
                                                    {item}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-400">غير محدد</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {viewingPrep.educational_activities && (
                                <div className="bg-cyan-50/40 dark:bg-cyan-500/5 border border-cyan-100 dark:border-cyan-500/20 rounded-2xl p-4">
                                    <h4 className="text-xs font-black text-cyan-600 dark:text-cyan-400 mb-2 flex items-center gap-1.5">
                                        <Activity size={14} /> الأنشطة التعليمية
                                    </h4>
                                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                        {viewingPrep.educational_activities}
                                    </p>
                                </div>
                            )}

                            {(viewingPrep.behavioral_value || viewingPrep.acquired_skills) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-pink-50/40 dark:bg-pink-500/5 border border-pink-100 dark:border-pink-500/20 rounded-2xl p-4">
                                        <h4 className="text-xs font-black text-pink-600 dark:text-pink-400 mb-2 flex items-center gap-1.5">
                                            <Heart size={14} /> القيمة السلوكية
                                        </h4>
                                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                            {viewingPrep.behavioral_value || 'غير محدد'}
                                        </p>
                                    </div>
                                    <div className="bg-violet-50/40 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/20 rounded-2xl p-4">
                                        <h4 className="text-xs font-black text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-1.5">
                                            <Brain size={14} /> المهارات المكتسبة
                                        </h4>
                                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                            {viewingPrep.acquired_skills || 'غير محدد'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-black text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-1.5">
                                    <FileText size={14} /> العرض / ما تم دراسته
                                </h4>
                                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                    {viewingPrep.topics_covered || 'لم يتم إدخال تفاصيل إضافية.'}
                                </p>
                            </div>

                            {(viewingPrep.assessment_methods || viewingPrep.reinforcements) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-teal-50/40 dark:bg-teal-500/5 border border-teal-100 dark:border-teal-500/20 rounded-2xl p-4">
                                        <h4 className="text-xs font-black text-teal-600 dark:text-teal-400 mb-2 flex items-center gap-1.5">
                                            <ClipboardCheck size={14} /> التقويم المرحلي والختامي
                                        </h4>
                                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                            {viewingPrep.assessment_methods || 'غير محدد'}
                                        </p>
                                    </div>
                                    <div className="bg-amber-50/40 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-4">
                                        <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                                            <Award size={14} /> التعزيزات
                                        </h4>
                                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                            {viewingPrep.reinforcements || 'غير محدد'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-emerald-50/40 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4">
                                    <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 mb-2">الواجب المنزلي</h4>
                                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                        {viewingPrep.homework || 'لا يوجد واجب منزلي.'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                                    <h4 className="text-xs font-black text-slate-600 dark:text-slate-400 mb-2">ملاحظات المعلم</h4>
                                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                        {viewingPrep.notes || 'لا توجد ملاحظات.'}
                                    </p>
                                </div>
                            </div>

                            {Array.isArray(viewingPrep.attachments) && viewingPrep.attachments.length > 0 && (
                                <div className="bg-indigo-50/40 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 space-y-2.5">
                                    <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                        <Paperclip size={14} /> المرفقات ({viewingPrep.attachments.length})
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {viewingPrep.attachments.map((att, idx) => (
                                            <a
                                                key={idx}
                                                href={`/storage/${att.path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 px-3 py-2.5 rounded-xl border border-indigo-100 dark:border-slate-700 hover:border-indigo-400 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <File size={15} className="text-indigo-500 shrink-0" />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{att.name}</span>
                                                </div>
                                                <Download size={14} className="text-indigo-500 shrink-0" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(viewingPrep.supervisor_rating || viewingPrep.supervisor_notes) && (
                                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                            <MessageSquare size={14} /> تقييم وملاحظات المشرف التربوي
                                        </h4>
                                        {renderStars(viewingPrep.supervisor_rating)}
                                    </div>
                                    {viewingPrep.supervisor_notes && (
                                        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                                            {viewingPrep.supervisor_notes}
                                        </p>
                                    )}
                                    <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-3">
                                        {viewingPrep.reviewer?.name && <span>المشرف: {viewingPrep.reviewer.name}</span>}
                                        {viewingPrep.reviewed_at && (
                                            <span dir="ltr">{new Date(viewingPrep.reviewed_at).toLocaleString('ar-EG')}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/70">
                            <button
                                onClick={() => {
                                    const target = viewingPrep;
                                    setViewingPrep(null);
                                    openModal(target, true);
                                }}
                                className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5"
                            >
                                <Copy size={14} />
                                نسخ لشعبة أخرى
                            </button>
                            <button
                                onClick={() => setViewingPrep(null)}
                                className="px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
