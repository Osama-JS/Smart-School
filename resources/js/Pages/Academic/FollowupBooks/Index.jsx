import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import FlatpickrInput from '@/Components/FlatpickrInput';
import {
    ClipboardList,
    Search,
    Download,
    Settings,
    Printer,
    CheckCircle2,
    Clock,
    AlertTriangle,
    TrendingUp,
    Layers,
    LayoutGrid,
    Table2,
    Eye,
    Trash2,
    X,
    BookOpen,
    FileText,
    CheckSquare,
    User,
    Calendar,
    Smartphone,
    Monitor,
    Star,
    Paperclip,
    Save,
} from 'lucide-react';
import Swal from 'sweetalert2';

const STATUS_BADGES = {
    uploaded: {
        label: 'مرفوع في الوقت',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
        dotClass: 'bg-emerald-500',
    },
    late: {
        label: 'مرفوع متأخر',
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
        dotClass: 'bg-amber-500',
    },
    pending: {
        label: 'غير مرفوع',
        className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
        dotClass: 'bg-rose-500',
    },
};

export default function Index({
    auth,
    followups,
    stats = {},
    teachers = [],
    grades = [],
    subjects = [],
    timeLimit = '14:00',
    filters = {},
}) {
    const [viewMode, setViewMode] = useState('table');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [filterData, setFilterData] = useState({
        search: filters.search || '',
        teacher_id: filters.teacher_id || '',
        grade_id: filters.grade_id || '',
        subject_id: filters.subject_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
        status: filters.status || '',
    });

    const settingsForm = useForm({
        time_limit: timeLimit || '14:00',
    });

    const reviewForm = useForm({
        supervisor_rating: '',
        supervisor_notes: '',
    });

    const openRecordModal = (item) => {
        setSelectedRecord(item);
        reviewForm.setData({
            supervisor_rating: item.supervisor_rating || '',
            supervisor_notes: item.supervisor_notes || '',
        });
        reviewForm.clearErrors();
    };

    const submitReview = (e) => {
        e.preventDefault();
        if (!selectedRecord) return;

        reviewForm.post(route('academic.followup-books.review', selectedRecord.id), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedRecord(null);
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحفظ',
                    text: 'تم حفظ تقييم وملاحظات الموجه وإشعار المعلم بنجاح.',
                    confirmButtonText: 'حسناً',
                    confirmButtonColor: '#10b981',
                });
            },
        });
    };

    const applyFilters = (override = null) => {
        const nextFilters = override || filterData;
        router.get(route('academic.followup-books.index'), nextFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        const cleared = {
            search: '',
            teacher_id: '',
            grade_id: '',
            subject_id: '',
            start_date: '',
            end_date: '',
            status: '',
        };
        setFilterData(cleared);
        applyFilters(cleared);
    };

    const handleExport = () => {
        const cleanParams = Object.fromEntries(
            Object.entries(filterData).filter(([, v]) => v !== '' && v !== null && v !== undefined)
        );
        const queryString = new URLSearchParams(cleanParams).toString();
        window.location.href = `${route('academic.followup-books.export')}${queryString ? `?${queryString}` : ''}`;
    };

    const submitSettings = (e) => {
        e.preventDefault();
        settingsForm.post(route('academic.followup-books.settings'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsSettingsOpen(false);
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحفظ',
                    text: 'تم تحديث موعد تسليم دفاتر المتابعة اليومي بنجاح.',
                    confirmButtonText: 'حسناً',
                    confirmButtonColor: '#10b981',
                });
            },
        });
    };

    const handleDelete = (item) => {
        Swal.fire({
            title: 'تأكيد الحذف',
            text: `هل أنت متأكد من حذف سجل المتابعة (${item.lesson_title || item.subject_name})؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('academic.followup-books.destroy', item.id), {
                    preserveScroll: true,
                });
            }
        });
    };

    const items = followups?.data || [];

    const renderStatusBadge = (code) => {
        const meta = STATUS_BADGES[code] || STATUS_BADGES.pending;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.className}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                {meta.label}
            </span>
        );
    };

    const renderReviewBadges = (item) => {
        if (!item.supervisor_rating && !(item.attachments?.length > 0)) {
            return null;
        }
        return (
            <div className="flex flex-wrap items-center gap-1.5">
                {item.supervisor_rating && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
                        <Star size={11} className="fill-amber-400 text-amber-500" />
                        {item.supervisor_rating}/5
                    </span>
                )}
                {item.attachments?.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20">
                        <Paperclip size={11} />
                        {item.attachments.length} مرفق
                    </span>
                )}
            </div>
        );
    };

    return (
        <AdminLayout user={auth.user} activeMenu="إدارة ومتابعة دفاتر المتابعة">
            <Head title="دفاتر متابعة المعلمين" />

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    aside, nav, header, .no-print { display: none !important; }
                    main { width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    body { background: white !important; color: black !important; }
                    .cards-view { display: none !important; }
                    .table-view { display: block !important; }
                }
            `}} />

            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-emerald-500 to-teal-500" />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <ClipboardList size={28} className="text-primary-600" />
                                دفاتر متابعة المعلمين
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-semibold">
                                متابعة السجل اليومي للدروس، الصفحات المنجزة، والواجبات المنزلية المسجلة في دفاتر المتابعة (موعد التسليم المعتمد: <span className="text-primary-600 dark:text-primary-400 font-black" dir="ltr">{timeLimit}</span>)
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0 no-print">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl hover:border-primary-400 text-xs font-bold transition-all"
                            >
                                <Printer size={16} />
                                <span>طباعة</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
                            >
                                <Download size={16} />
                                <span>تصدير CSV</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    settingsForm.setData('time_limit', timeLimit || '14:00');
                                    setIsSettingsOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
                            >
                                <Settings size={16} />
                                <span>موعد التسليم اليومي</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'إجمالي السجلات', value: stats.total ?? 0, icon: Layers, color: 'text-primary-600 bg-primary-50 dark:bg-primary-500/10' },
                        { label: 'مرفوعة في الوقت', value: stats.uploaded ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
                        { label: 'مرفوعة متأخرة', value: stats.late ?? 0, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
                        { label: 'غير مرفوعة', value: stats.pending ?? 0, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' },
                        { label: 'نسبة الالتزام', value: `${stats.compliance_rate ?? 100}%`, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' },
                    ].map((card, i) => (
                        <div key={i} className="bg-white dark:bg-[#121820]/70 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.color}`}>
                                <card.icon size={22} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-400 truncate">{card.label}</p>
                                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{card.value}</h4>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters Toolbar */}
                <div className="bg-white dark:bg-[#121820]/70 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 no-print">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                        <div className="xl:col-span-2 relative">
                            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="بحث باسم المعلم، الدرس، أو الواجب..."
                                value={filterData.search}
                                onChange={(e) => setFilterData({ ...filterData, search: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                            />
                        </div>

                        <select
                            value={filterData.teacher_id}
                            onChange={(e) => setFilterData({ ...filterData, teacher_id: e.target.value })}
                            className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                        >
                            <option value="">كل المعلمين</option>
                            {teachers.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>

                        <select
                            value={filterData.grade_id}
                            onChange={(e) => setFilterData({ ...filterData, grade_id: e.target.value })}
                            className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                        >
                            <option value="">كل الصفوف</option>
                            {grades.map((g) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>

                        <select
                            value={filterData.subject_id}
                            onChange={(e) => setFilterData({ ...filterData, subject_id: e.target.value })}
                            className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                        >
                            <option value="">كل المواد</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>

                        <select
                            value={filterData.status}
                            onChange={(e) => setFilterData({ ...filterData, status: e.target.value })}
                            className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                        >
                            <option value="">كل الحالات</option>
                            <option value="uploaded">مرفوع في الوقت</option>
                            <option value="late">مرفوع متأخر</option>
                            <option value="pending">غير مرفوع</option>
                        </select>

                        <div className="flex items-center justify-end gap-2">
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('cards')}
                                    title="بطاقات"
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    title="جدول"
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    <Table2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="w-44">
                                <FlatpickrInput
                                    type="date"
                                    value={filterData.start_date}
                                    onChange={(dateStr) => setFilterData({ ...filterData, start_date: dateStr })}
                                    placeholder="من تاريخ..."
                                    className="w-full"
                                />
                            </div>
                            <div className="w-44">
                                <FlatpickrInput
                                    type="date"
                                    value={filterData.end_date}
                                    onChange={(dateStr) => setFilterData({ ...filterData, end_date: dateStr })}
                                    placeholder="إلى تاريخ..."
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                إعادة تعيين
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFilters()}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm transition-all"
                            >
                                <Search size={14} />
                                <span>تطبيق الفلتر</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {items.length === 0 ? (
                    <div className="bg-white dark:bg-[#121820]/70 rounded-3xl border border-slate-100 dark:border-slate-800 p-16 text-center">
                        <BookOpen size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">لا توجد سجلات دفاتر متابعة مطابقة</h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">جرّب تعديل الفلاتر أو اختيار نطاق تاريخ مختلف.</p>
                    </div>
                ) : (
                    <>
                        {/* Cards View */}
                        <div className={viewMode === 'cards' ? 'cards-view' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {items.map((item) => (
                                    <div key={item.id} className="bg-white dark:bg-[#121820]/80 rounded-[2rem] border border-slate-200/70 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-lg transition-all">
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 mb-1">
                                                        <User size={13} />
                                                        <span className="truncate">{item.teacher_name}</span>
                                                    </div>
                                                    <h3 className="text-base font-black text-slate-800 dark:text-white truncate">
                                                        {item.subject_name}
                                                    </h3>
                                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                                                        <span>{item.grade_name} {item.division_name ? `- ${item.division_name}` : ''}</span>
                                                        {item.period_name && (
                                                            <span className="px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-[10px] font-bold">
                                                                {item.period_name}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                {renderStatusBadge(item.status_code)}
                                            </div>

                                            <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-xs">
                                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold">
                                                    <span className="flex items-center gap-1"><Calendar size={13} /> {item.day_name}</span>
                                                    <span dir="ltr" className="font-bold text-slate-700 dark:text-slate-300">{item.date}</span>
                                                </div>
                                                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800">
                                                    <p className="text-[11px] font-bold text-slate-400 mb-0.5">عنوان الدرس</p>
                                                    <p className="font-black text-slate-800 dark:text-slate-100 line-clamp-1">
                                                        {item.lesson_title || 'لم يُسجل عنوان الدرس'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-500">صفحة الدرس: <strong className="text-slate-800 dark:text-slate-200" dir="ltr">{item.page_number || '-'}</strong></span>
                                                    <span className="text-slate-500">صفحة الواجب: <strong className="text-slate-800 dark:text-slate-200" dir="ltr">{item.homework_page || '-'}</strong></span>
                                                </div>
                                                {item.homework && (
                                                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800">
                                                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">الواجب المنزلي</p>
                                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">{item.homework}</p>
                                                    </div>
                                                )}
                                                {renderReviewBadges(item) && (
                                                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800">
                                                        {renderReviewBadges(item)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                                {item.upload_source === 'app' ? <Smartphone size={13} /> : <Monitor size={13} />}
                                                {item.uploaded_at ? <span dir="ltr">{item.uploaded_at}</span> : 'لم يرفع'}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openRecordModal(item)}
                                                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center transition-colors"
                                                    title="عرض التفاصيل والتقييم"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item)}
                                                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Table View */}
                        <div className={viewMode === 'table' ? 'table-view' : 'hidden print:block table-view'}>
                            <div className="bg-white dark:bg-[#121820]/80 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right min-w-[1040px]">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/70 dark:border-slate-800">
                                                <th className="py-4 px-4 text-xs font-black text-slate-500 text-center w-12">#</th>
                                                <th className="py-4 px-4 text-xs font-black text-slate-500">المعلم</th>
                                                <th className="py-4 px-4 text-xs font-black text-slate-500">المادة والصف</th>
                                                <th className="py-4 px-4 text-xs font-black text-slate-500">التاريخ</th>
                                                <th className="py-4 px-4 text-xs font-black text-slate-500">عنوان الدرس / الصفحة</th>
                                                <th className="py-4 px-4 text-xs font-black text-slate-500">الواجب المنزلي</th>
                                                <th className="py-4 px-4 text-xs font-black text-slate-500">التقييم والمرفقات</th>
                                                <th className="py-4 px-4 text-xs font-black text-slate-500 text-center">الحالة</th>
                                                <th className="py-4 px-4 text-xs font-black text-slate-500 text-center no-print w-24">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                            {items.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-400">
                                                        {((followups?.current_page || 1) - 1) * (followups?.per_page || 18) + idx + 1}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs font-black text-slate-800 dark:text-white">
                                                        {item.teacher_name}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.subject_name}</p>
                                                        <p className="text-[11px] font-semibold text-slate-500">{item.grade_name} {item.division_name ? `- ${item.division_name}` : ''}</p>
                                                        {item.period_name && (
                                                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-[10px] font-bold">
                                                                {item.period_name}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs">
                                                        <p className="font-bold text-slate-700 dark:text-slate-200">{item.day_name}</p>
                                                        <p className="text-[11px] font-semibold text-slate-400" dir="ltr">{item.date}</p>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs max-w-xs">
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.lesson_title || '-'}</p>
                                                        <p className="text-[11px] text-slate-400 font-semibold">ص: <span dir="ltr">{item.page_number || '-'}</span></p>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs max-w-xs">
                                                        <p className="font-semibold text-emerald-700 dark:text-emerald-300 line-clamp-1">{item.homework || '-'}</p>
                                                        <p className="text-[11px] text-slate-400 font-semibold">ص الواجب: <span dir="ltr">{item.homework_page || '-'}</span></p>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs">
                                                        {renderReviewBadges(item) || <span className="text-slate-400 text-[11px]">-</span>}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {renderStatusBadge(item.status_code)}
                                                            {item.uploaded_at && (
                                                                <span className="text-[10px] font-semibold text-slate-400" dir="ltr">{item.uploaded_at}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 no-print">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openRecordModal(item)}
                                                                title="عرض التفاصيل والتقييم"
                                                                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center transition-colors"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(item)}
                                                                title="حذف"
                                                                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {followups?.links && (
                            <div className="no-print">
                                <Pagination links={followups.links} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Record Details Modal */}
            <Modal show={!!selectedRecord} onClose={() => setSelectedRecord(null)} maxWidth="2xl">
                {selectedRecord && (
                    <div className="p-6 md:p-7 space-y-5 max-h-[85vh] overflow-y-auto" dir="rtl">
                        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <FileText size={20} className="text-primary-600" />
                                    تفاصيل دفتر المتابعة
                                </h3>
                                <p className="text-xs font-semibold text-slate-500 mt-1">
                                    {selectedRecord.teacher_name} &bull; {selectedRecord.subject_name} ({selectedRecord.grade_name} - {selectedRecord.division_name})
                                    {selectedRecord.period_name ? ` • ${selectedRecord.period_name}` : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRecord(null)}
                                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 flex items-center justify-center"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 font-bold block mb-1">التاريخ</span>
                                <span className="font-black text-slate-800 dark:text-white">{selectedRecord.day_name} (<span dir="ltr">{selectedRecord.date}</span>)</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 font-bold block mb-1">الحالة</span>
                                {renderStatusBadge(selectedRecord.status_code)}
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 font-bold block mb-1">وقت ومصدر الرفع</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200" dir="ltr">
                                    {selectedRecord.uploaded_at || '-'} ({selectedRecord.upload_source === 'app' ? 'التطبيق' : 'لوحة التحكم'})
                                </span>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400">عنوان الدرس</span>
                                <span className="font-bold text-primary-600">صفحة الدرس: <span dir="ltr">{selectedRecord.page_number || '-'}</span></span>
                            </div>
                            <p className="text-sm font-black text-slate-800 dark:text-white">{selectedRecord.lesson_title || 'غير مسجل'}</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/40 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><CheckSquare size={14} /> الواجب المنزلي</span>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">صفحة الواجب: <span dir="ltr">{selectedRecord.homework_page || '-'}</span></span>
                            </div>
                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 whitespace-pre-line">
                                {selectedRecord.homework || 'لا يوجد واجب مسجل'}
                            </p>
                        </div>

                        {selectedRecord.notes && (
                            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/40">
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">ملاحظات المعلم</span>
                                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 whitespace-pre-line">{selectedRecord.notes}</p>
                            </div>
                        )}

                        {selectedRecord.attachments?.length > 0 && (
                            <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/40 space-y-2.5">
                                <span className="text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                                    <Paperclip size={14} />
                                    مرفقات الدرس والواجب ({selectedRecord.attachments.length})
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRecord.attachments.map((att, index) => (
                                        <a
                                            key={att.path || index}
                                            href={att.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition-colors"
                                        >
                                            <Paperclip size={13} className="text-sky-500" />
                                            <span className="max-w-[200px] truncate">{att.name}</span>
                                            <Download size={13} className="text-slate-400" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={submitReview} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <Star size={15} className="text-amber-500 fill-amber-400" />
                                    تقييم وملاحظات الموجه
                                </h4>
                                {(selectedRecord.reviewer_name || selectedRecord.reviewed_at) && (
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        آخر مراجعة: {selectedRecord.reviewer_name || 'الموجه'}{' '}
                                        {selectedRecord.reviewed_at ? `(${selectedRecord.reviewed_at})` : ''}
                                    </span>
                                )}
                            </div>

                            <div>
                                <InputLabel value="تقييم الالتزام وجودة المتابعة (من 5)" className="mb-2" />
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const isActive = Number(reviewForm.data.supervisor_rating) >= star;
                                        return (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() =>
                                                    reviewForm.setData(
                                                        'supervisor_rating',
                                                        Number(reviewForm.data.supervisor_rating) === star ? '' : star
                                                    )
                                                }
                                                className={`p-2 rounded-xl border transition-all ${
                                                    isActive
                                                        ? 'bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-500/15 dark:border-amber-500/40'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 hover:text-amber-400'
                                                }`}
                                                title={`${star} من 5`}
                                            >
                                                <Star size={18} className={isActive ? 'fill-amber-400 text-amber-500' : ''} />
                                            </button>
                                        );
                                    })}
                                    {reviewForm.data.supervisor_rating && (
                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mr-2">
                                            {reviewForm.data.supervisor_rating} / 5
                                        </span>
                                    )}
                                </div>
                                <InputError message={reviewForm.errors.supervisor_rating} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="supervisor_notes" value="ملاحظات وتوجيهات الموجه للمعلم" className="mb-1.5" />
                                <textarea
                                    id="supervisor_notes"
                                    rows={3}
                                    value={reviewForm.data.supervisor_notes}
                                    onChange={(e) => reviewForm.setData('supervisor_notes', e.target.value)}
                                    placeholder="اكتب ملاحظاتك أو توجيهاتك التربوية حول هذا السجل..."
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-primary-500 dark:text-white"
                                />
                                <InputError message={reviewForm.errors.supervisor_notes} className="mt-1" />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={reviewForm.processing}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-black shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    <Save size={14} />
                                    <span>حفظ التقييم وإشعار المعلم</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>

            {/* Daily Deadline Settings Modal */}
            <Modal show={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} maxWidth="md">
                <form onSubmit={submitSettings} className="p-6 space-y-5" dir="rtl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Settings size={18} className="text-primary-600" />
                            إعداد موعد تسليم دفاتر المتابعة
                        </h3>
                        <button
                            type="button"
                            onClick={() => setIsSettingsOpen(false)}
                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 flex items-center justify-center"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div>
                        <InputLabel htmlFor="followup_time_limit" value="الحد الأقصى للرفع اليومي (ساعة:دقيقة)" className="mb-2" />
                        <input
                            id="followup_time_limit"
                            type="time"
                            value={settingsForm.data.time_limit}
                            onChange={(e) => settingsForm.setData('time_limit', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary-500 dark:text-white"
                            required
                        />
                        <InputError message={settingsForm.errors.time_limit} className="mt-1.5" />
                        <p className="text-[11px] font-semibold text-slate-400 mt-2">
                            يُعتمد هذا التوقيت لتحديد السجلات المرفوعة في الوقت مقابل المتأخرة، كما يُستخدم في التذكيرات اليومية التلقائية.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setIsSettingsOpen(false)}
                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={settingsForm.processing}
                            className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-black disabled:opacity-50"
                        >
                            حفظ الإعدادات
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
