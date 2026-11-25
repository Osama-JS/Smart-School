import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { BookOpen, Calendar, ChevronLeft, ChevronRight, CheckCircle, Plus, Search, Edit3, Save, FileText, CheckSquare, X, Eye, Sparkles, Paperclip, Star, Clock, Trash2, Download } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Index({ auth, days, weekOffset, periodStart, periodEnd, filters = {} }) {
    const [activeLesson, setActiveLesson] = useState(null);
    const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        date: '',
        subject_id: '',
        division_id: '',
        period_id: '',
        lesson_title: '',
        page_number: '',
        homework: '',
        homework_page: '',
        notes: '',
        existing_attachments: [],
        new_attachments: [],
        attachments_synced: true,
    });

    const [filterData, setFilterData] = useState({
        start_date: filters.start_date || '',
        end_date: filters.end_date || ''
    });

    const applyFilters = () => {
        router.get(route('teacher.followup-books.index'), filterData, { preserveState: true, preserveScroll: true });
    };

    const navigateWeek = (offset) => {
        setFilterData({ start_date: '', end_date: '' });
        router.get(route('teacher.followup-books.index'), { week_offset: offset }, { preserveState: true, preserveScroll: true });
    };

    const openQuickModal = (dayDate, lesson) => {
        clearErrors();
        setActiveLesson({ date: dayDate, ...lesson });
        setData({
            date: dayDate,
            subject_id: lesson.subject?.id || '',
            division_id: lesson.division?.id || '',
            period_id: lesson.period?.id || lesson.followup?.period_id || '',
            lesson_title: lesson.followup?.lesson_title || '',
            page_number: lesson.followup?.page_number || '',
            homework: lesson.followup?.homework || '',
            homework_page: lesson.followup?.homework_page || '',
            notes: lesson.followup?.notes || '',
            existing_attachments: Array.isArray(lesson.followup?.attachments) ? lesson.followup.attachments : [],
            new_attachments: [],
            attachments_synced: true,
        });
        setIsQuickModalOpen(true);
    };

    const importFromPreparation = () => {
        const prep = activeLesson?.suggested_prep;
        if (!prep) return;
        setData((prev) => ({
            ...prev,
            lesson_title: prep.lesson_title || prev.lesson_title,
            page_number: prep.page_numbers || prev.page_number,
            homework: prep.homework || prev.homework,
            notes: prep.notes || prev.notes,
        }));
    };

    const closeQuickModal = () => {
        setIsQuickModalOpen(false);
        setActiveLesson(null);
        reset();
    };

    const submitQuickForm = (e) => {
        e.preventDefault();
        post(route('teacher.followup-books.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                closeQuickModal();
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحفظ بنجاح',
                    text: 'تم حفظ بيانات دفتر المتابعة بنجاح.',
                    confirmButtonText: 'حسناً',
                    confirmButtonColor: '#10b981',
                });
            },
        });
    };

    return (
        <AdminLayout user={auth.user} activeMenu="دفتر المتابعة">
            <Head title="دفتر المتابعة" />

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <BookOpen size={28} className="text-primary-600" />
                                دفتر المتابعة
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة ومتابعة الدروس والواجبات اليومية لفصولك</p>
                        </div>
                    </div>
                </div>

                {/* Filters & Week Navigation */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        
                        {/* Custom Date Range */}
                        <div className="flex-1 flex flex-col sm:flex-row items-end gap-4">
                            <div className="w-full sm:w-auto">
                                <label className="block text-xs font-bold text-slate-500 mb-2">من تاريخ</label>
                                <input
                                    type="date"
                                    value={filterData.start_date}
                                    onChange={(e) => setFilterData({ ...filterData, start_date: e.target.value })}
                                    className="w-full sm:w-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2.5 font-bold focus:border-primary-500 focus:ring-primary-500 transition-all"
                                />
                            </div>
                            <div className="w-full sm:w-auto">
                                <label className="block text-xs font-bold text-slate-500 mb-2">إلى تاريخ</label>
                                <input
                                    type="date"
                                    value={filterData.end_date}
                                    onChange={(e) => setFilterData({ ...filterData, end_date: e.target.value })}
                                    className="w-full sm:w-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2.5 font-bold focus:border-primary-500 focus:ring-primary-500 transition-all"
                                />
                            </div>
                            <button
                                onClick={applyFilters}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition-all shadow-sm active:scale-95"
                            >
                                <Search size={18} />
                                تصفية
                            </button>
                        </div>

                        {/* Week Navigation */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => navigateWeek(weekOffset - 1)}
                                className="flex items-center justify-center w-10 h-10 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors"
                                title="الأسبوع السابق"
                            >
                                <ChevronRight size={18} />
                            </button>
                            
                            <div className="flex items-center justify-center px-4 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <Calendar className="text-primary-500 ml-2" size={16} />
                                <span className="text-sm font-bold text-slate-800 dark:text-white" dir="ltr">
                                    {periodStart} <span className="mx-1 text-slate-400">-</span> {periodEnd}
                                </span>
                            </div>

                            <button 
                                onClick={() => navigateWeek(weekOffset + 1)}
                                className="flex items-center justify-center w-10 h-10 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors"
                                title="الأسبوع التالي"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Days List */}
                <div className="space-y-6">
                    {days.length > 0 ? (
                        days.map((day, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center shadow-inner">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{day.day_name}</h3>
                                        <p className="text-sm text-slate-500 font-semibold" dir="ltr">{day.date}</p>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {day.lessons.map((lesson, lIdx) => (
                                            <div key={lIdx} className={`p-5 rounded-2xl border flex flex-col justify-between ${lesson.has_followup ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'} relative group hover:shadow-md transition-all`}>
                                                <div>
                                                    <div className="flex justify-between items-start gap-2 mb-3">
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <h4 className="font-bold text-slate-800 dark:text-slate-100">{lesson.subject?.name}</h4>
                                                                {lesson.period?.period_name && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 text-[10px] font-bold">
                                                                        <Clock size={10} />
                                                                        {lesson.period.period_name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{lesson.division?.grade?.name} - {lesson.division?.name}</p>
                                                        </div>
                                                        {lesson.has_followup ? (
                                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0" title="تم الرفع">
                                                                <CheckCircle size={14} />
                                                                مكتمل
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 shrink-0">
                                                                بانتظار الرفع
                                                            </span>
                                                        )}
                                                    </div>

                                                    {lesson.has_followup && lesson.followup ? (
                                                        <div className="mb-4 p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-100 dark:border-emerald-900/30 space-y-1.5 text-xs">
                                                            <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                                                                <FileText size={13} className="text-primary-500 shrink-0 mt-0.5" />
                                                                <span className="line-clamp-1">{lesson.followup.lesson_title}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                                                                <span>صفحة الدرس: <strong className="text-slate-700 dark:text-slate-200" dir="ltr">{lesson.followup.page_number || '-'}</strong></span>
                                                                <span>صفحة الواجب: <strong className="text-slate-700 dark:text-slate-200" dir="ltr">{lesson.followup.homework_page || '-'}</strong></span>
                                                            </div>
                                                            {lesson.followup.homework && (
                                                                <div className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800">
                                                                    <CheckSquare size={13} className="shrink-0 mt-0.5" />
                                                                    <span className="line-clamp-2">{lesson.followup.homework}</span>
                                                                </div>
                                                            )}
                                                            {(lesson.followup.attachments?.length > 0 || lesson.followup.supervisor_rating || lesson.followup.supervisor_notes) && (
                                                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                                                                    {lesson.followup.attachments?.length > 0 && (
                                                                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold">
                                                                            <Paperclip size={11} />
                                                                            {lesson.followup.attachments.length} مرفق
                                                                        </span>
                                                                    )}
                                                                    {(lesson.followup.supervisor_rating || lesson.followup.supervisor_notes) && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                                                                            <Star size={11} className="fill-amber-400 text-amber-500" />
                                                                            {lesson.followup.supervisor_rating ? `${lesson.followup.supervisor_rating}/5` : 'ملاحظة موجه'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="mb-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                            لم يتم تسجيل محتوى الدرس والواجب لهذه الحصة بعد.
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openQuickModal(day.date, lesson)}
                                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors ${lesson.has_followup
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                                            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
                                                            }`}
                                                    >
                                                        {lesson.has_followup ? <Edit3 size={14} /> : <Plus size={14} />}
                                                        <span>{lesson.has_followup ? 'تعديل سريع' : 'تعبئة سريعة'}</span>
                                                    </button>
                                                    <Link
                                                        href={route('teacher.followup-books.show', {
                                                            date: day.date,
                                                            subject_id: lesson.subject.id,
                                                            division_id: lesson.division.id,
                                                            ...(lesson.period?.id ? { period_id: lesson.period.id } : {}),
                                                        })}
                                                        title="عرض الصفحة التفصيلية"
                                                        className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        <Eye size={14} />
                                                        <span>التفاصيل</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center">
                            <BookOpen className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">لا توجد حصص في هذا الأسبوع</h3>
                            <p className="mt-2 text-slate-500 font-medium">يبدو أنه ليس لديك حصص مسندة في الجدول الدراسي خلال هذا الأسبوع.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Quick Entry / Edit Modal */}
            <Modal show={isQuickModalOpen} onClose={closeQuickModal} maxWidth="2xl">
                <div className="p-6 md:p-7" dir="rtl">
                    <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <BookOpen size={20} className="text-primary-600" />
                                {activeLesson?.has_followup ? 'تعديل دفتر المتابعة' : 'تعبئة دفتر المتابعة السريعة'}
                            </h3>
                            {activeLesson && (
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                    {activeLesson.subject?.name} &bull; {activeLesson.division?.grade?.name} - {activeLesson.division?.name}
                                    {activeLesson.period?.period_name ? ` • ${activeLesson.period.period_name}` : ''} &bull; <span dir="ltr">{activeLesson.date}</span>
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={closeQuickModal}
                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {activeLesson?.suggested_prep && (
                        <div className="mb-4 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200/70 dark:border-indigo-500/20 flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs font-bold text-indigo-800 dark:text-indigo-200">
                                يوجد دفتر تحضير مسجل لهذا الدرس ({activeLesson.suggested_prep.lesson_title})
                            </div>
                            <button
                                type="button"
                                onClick={importFromPreparation}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                            >
                                <Sparkles size={13} />
                                <span>استيراد تلقائي من دفتر التحضير</span>
                            </button>
                        </div>
                    )}

                    <form onSubmit={submitQuickForm} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="quick_lesson_title" value="عنوان الدرس *" className="mb-1.5" />
                            <input
                                id="quick_lesson_title"
                                type="text"
                                value={data.lesson_title}
                                onChange={(e) => setData('lesson_title', e.target.value)}
                                placeholder="مثال: تطبيقات على المعادلات الخطية"
                                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                                required
                            />
                            <InputError message={errors.lesson_title} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="quick_page_number" value="رقم الصفحة *" className="mb-1.5" />
                                <input
                                    id="quick_page_number"
                                    type="text"
                                    dir="ltr"
                                    value={data.page_number}
                                    onChange={(e) => setData('page_number', e.target.value)}
                                    placeholder="مثال: 45 - 47"
                                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                                    required
                                />
                                <InputError message={errors.page_number} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="quick_homework_page" value="صفحة الواجب *" className="mb-1.5" />
                                <input
                                    id="quick_homework_page"
                                    type="text"
                                    dir="ltr"
                                    value={data.homework_page}
                                    onChange={(e) => setData('homework_page', e.target.value)}
                                    placeholder="مثال: 48"
                                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                                    required
                                />
                                <InputError message={errors.homework_page} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="quick_homework" value="الواجب المدرسي *" className="mb-1.5" />
                            <textarea
                                id="quick_homework"
                                rows="3"
                                value={data.homework}
                                onChange={(e) => setData('homework', e.target.value)}
                                placeholder="حدد الواجب المطلوب من الطلاب بوضوح..."
                                className="w-full bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-200/70 dark:border-emerald-800/50 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:text-white resize-none"
                                required
                            />
                            <InputError message={errors.homework} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="quick_notes" value="ملاحظات إضافية (اختياري)" className="mb-1.5" />
                            <textarea
                                id="quick_notes"
                                rows="2"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="أي ملاحظات للإدارة أو ولي الأمر..."
                                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:text-white resize-none"
                            />
                            <InputError message={errors.notes} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="مرفقات الدرس أو الواجب (اختياري)" className="mb-1.5" />
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip"
                                onChange={(e) => setData('new_attachments', Array.from(e.target.files || []))}
                                className="w-full text-xs text-slate-600 dark:text-slate-300 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-500/15 dark:file:text-primary-300"
                            />
                            <InputError message={errors['new_attachments.0']} className="mt-1" />

                            {data.existing_attachments?.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                    {data.existing_attachments.map((att, idx) => (
                                        <div key={idx} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                                            <a href={att.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-primary-600 hover:underline truncate">
                                                <Download size={12} />
                                                <span className="truncate">{att.name}</span>
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => setData('existing_attachments', data.existing_attachments.filter((_, i) => i !== idx))}
                                                className="text-rose-500 hover:text-rose-700 p-1"
                                                title="إزالة المرفق"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={closeQuickModal}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-black shadow-sm disabled:opacity-50 transition-all"
                            >
                                <Save size={15} />
                                <span>حفظ المحتوى</span>
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}
