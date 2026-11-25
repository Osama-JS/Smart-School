import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { BookOpen, ArrowRight, Calendar, Plus, Save, FileText, CheckCircle, XCircle, Book, CheckSquare, FilePlus, AlertCircle, Edit3, Sparkles, Paperclip, Star, Clock, Download, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Details({ auth, date, subject, division, period = null, followup, suggestedPrep = null }) {
    const [isEditing, setIsEditing] = useState(!followup);

    const { data, setData, post, processing, errors, reset } = useForm({
        date: date,
        subject_id: subject.id,
        division_id: division.id,
        period_id: period?.id || followup?.period_id || '',
        lesson_title: followup ? followup.lesson_title : '',
        notes: followup ? (followup.notes || '') : '',
        page_number: followup ? (followup.page_number || '') : '',
        homework: followup ? (followup.homework || '') : '',
        homework_page: followup ? (followup.homework_page || '') : '',
        existing_attachments: Array.isArray(followup?.attachments) ? followup.attachments : [],
        new_attachments: [],
        attachments_synced: true,
    });

    const importFromPreparation = () => {
        if (!suggestedPrep) return;
        setData((prev) => ({
            ...prev,
            lesson_title: suggestedPrep.lesson_title || prev.lesson_title,
            page_number: suggestedPrep.page_numbers || prev.page_number,
            homework: suggestedPrep.homework || prev.homework,
            notes: suggestedPrep.notes || prev.notes,
        }));
    };

    const startEditing = () => setIsEditing(true);
    const cancelEditing = () => {
        if (!followup) {
            // Can't cancel if there's no content to fall back to, so maybe redirect?
            // Actually, we can just let it be, but the "Cancel" button is handled below
        }
        setIsEditing(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('teacher.followup-books.store'), {
            forceFormData: true,
            onSuccess: () => {
                setIsEditing(false);
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحفظ بنجاح',
                    text: 'تم تحديث دفتر المتابعة للدرس بنجاح.',
                    confirmButtonText: 'حسناً',
                    confirmButtonColor: '#10b981',
                });
            },
        });
    };

    return (
        <AdminLayout user={auth.user} activeMenu="دفتر المتابعة">
            <Head title={`متابعة ${subject.name}`} />

            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-10 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                            <Link href={route('teacher.followup-books.index')} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold mb-4 inline-flex items-center gap-2 transition-colors bg-white dark:bg-slate-800/80 px-4 py-2 rounded-xl shadow-sm border border-primary-100 dark:border-primary-500/20 w-fit">
                                <ArrowRight size={18} />
                                عودة لجدول الحصص
                            </Link>
                            
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-inner">
                                    <BookOpen size={32} />
                                </div>
                                دفتر المتابعة
                            </h1>
                            
                            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <Book size={18} className="text-primary-500" />
                                    <span className="font-bold text-slate-700 dark:text-slate-300">المادة: <span className="text-slate-900 dark:text-white">{subject.name}</span></span>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <CheckSquare size={18} className="text-primary-500" />
                                    <span className="font-bold text-slate-700 dark:text-slate-300">الصف: <span className="text-slate-900 dark:text-white">{division.grade?.name} - {division.name}</span></span>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <Calendar size={18} className="text-primary-500" />
                                    <span className="font-bold text-slate-700 dark:text-slate-300">التاريخ: <span className="text-slate-900 dark:text-white" dir="ltr">{date}</span></span>
                                </div>
                                {period?.period_name && (
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <Clock size={18} className="text-indigo-500" />
                                        <span className="font-bold text-slate-700 dark:text-slate-300">الحصة: <span className="text-slate-900 dark:text-white">{period.period_name}</span></span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="shrink-0 pt-2">
                            {!isEditing && (
                                <button
                                    onClick={startEditing}
                                    className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/20 text-base font-bold transition-all active:scale-95"
                                >
                                    <Edit3 size={20} />
                                    <span>تعديل محتوى الدرس</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                {isEditing ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-primary-500" />
                        
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center">
                                    {followup ? <Edit3 size={28} /> : <Plus size={28} />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                                        {followup ? 'تعديل دفتر المتابعة' : 'إضافة دفتر المتابعة للدرس'}
                                    </h2>
                                    <p className="text-slate-500 font-semibold mt-1">الرجاء ملء تفاصيل الدرس والواجبات بدقة.</p>
                                </div>
                            </div>

                            {suggestedPrep && (
                                <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200/70 dark:border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-sm font-bold text-indigo-800 dark:text-indigo-200">
                                        يوجد دفتر تحضير مسجل لهذا الدرس ({suggestedPrep.lesson_title})
                                    </div>
                                    <button
                                        type="button"
                                        onClick={importFromPreparation}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                                    >
                                        <Sparkles size={15} />
                                        <span>استيراد تلقائي من دفتر التحضير</span>
                                    </button>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="lesson_title" value="عنوان الدرس *" className="text-slate-700 dark:text-slate-300 font-bold mb-3 text-sm uppercase tracking-wider" />
                                        <input
                                            id="lesson_title"
                                            value={data.lesson_title}
                                            onChange={(e) => setData('lesson_title', e.target.value)}
                                            placeholder="اكتب عنوان الدرس هنا... (مثال: تطبيقات على التفاضل)"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-lg font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
                                            required
                                        />
                                        <InputError message={errors.lesson_title} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="page_number" value="رقم الصفحة *" className="text-slate-700 dark:text-slate-300 font-bold mb-3 text-sm uppercase tracking-wider" />
                                        <div className="relative">
                                            <input
                                                id="page_number"
                                                value={data.page_number}
                                                onChange={(e) => setData('page_number', e.target.value)}
                                                placeholder="مثال: 45"
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-lg font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm pl-12"
                                                required
                                                dir="ltr"
                                            />
                                            <BookOpen size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                        <InputError message={errors.page_number} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="homework_page" value="صفحة الواجب *" className="text-slate-700 dark:text-slate-300 font-bold mb-3 text-sm uppercase tracking-wider" />
                                        <div className="relative">
                                            <input
                                                id="homework_page"
                                                value={data.homework_page}
                                                onChange={(e) => setData('homework_page', e.target.value)}
                                                placeholder="مثال: 46"
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-lg font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm pl-12"
                                                required
                                                dir="ltr"
                                            />
                                            <FilePlus size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                        <InputError message={errors.homework_page} className="mt-2" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="homework" value="الواجب المدرسي *" className="text-slate-700 dark:text-slate-300 font-bold mb-3 text-sm uppercase tracking-wider" />
                                        <textarea
                                            id="homework"
                                            value={data.homework}
                                            onChange={(e) => setData('homework', e.target.value)}
                                            placeholder="حدد الواجب المطلوب من الطلاب بوضوح..."
                                            className="w-full bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl px-6 py-4 text-lg font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm resize-none"
                                            rows="3"
                                            required
                                        />
                                        <InputError message={errors.homework} className="mt-2" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="notes" value="ملاحظات إضافية (اختياري)" className="text-slate-700 dark:text-slate-300 font-bold mb-3 text-sm uppercase tracking-wider" />
                                        <textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="أي ملاحظات تود إضافتها للإدارة أو الموجه..."
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-base font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm resize-none"
                                            rows="2"
                                        />
                                        <InputError message={errors.notes} className="mt-2" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel value="مرفقات الدرس أو الواجب (اختياري)" className="text-slate-700 dark:text-slate-300 font-bold mb-3 text-sm uppercase tracking-wider" />
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip"
                                            onChange={(e) => setData('new_attachments', Array.from(e.target.files || []))}
                                            className="w-full text-sm text-slate-600 dark:text-slate-300 file:ml-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-500/15 dark:file:text-primary-300"
                                        />
                                        <InputError message={errors['new_attachments.0']} className="mt-2" />

                                        {data.existing_attachments?.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {data.existing_attachments.map((att, idx) => (
                                                    <div key={idx} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                                                        <a href={att.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-bold text-primary-600 hover:underline truncate">
                                                            <Download size={14} />
                                                            <span className="truncate">{att.name}</span>
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => setData('existing_attachments', data.existing_attachments.filter((_, i) => i !== idx))}
                                                            className="text-rose-500 hover:text-rose-700 p-1"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                                    {followup && (
                                        <button
                                            type="button"
                                            onClick={cancelEditing}
                                            className="px-6 py-3.5 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-2xl font-bold transition-colors"
                                        >
                                            إلغاء التعديل
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex items-center gap-3 px-10 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg transition-all shadow-sm hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50"
                                    >
                                        <Save size={22} />
                                        حفظ المحتوى
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : followup ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
                        
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                                    <CheckCircle size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">تفاصيل المحتوى المرفوع</h2>
                                    {followup.uploaded_at && (
                                        <p className="text-sm font-semibold text-slate-500 mt-1">تاريخ الرفع: <span dir="ltr">{new Date(followup.uploaded_at).toLocaleString('ar-EG')}</span></p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Title and Page */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-3">
                                            <FileText size={20} />
                                            <h3 className="font-bold text-sm uppercase tracking-wider">عنوان الدرس</h3>
                                        </div>
                                        <p className="text-xl font-black text-slate-800 dark:text-white">
                                            {followup.lesson_title || 'بدون عنوان'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-3">
                                            <BookOpen size={20} />
                                            <h3 className="font-bold text-sm uppercase tracking-wider">رقم الصفحة</h3>
                                        </div>
                                        <p className="text-xl font-black text-slate-800 dark:text-white" dir="ltr">
                                            {followup.page_number || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Homework */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/30">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-3">
                                            <CheckSquare size={20} />
                                            <h3 className="font-bold text-sm uppercase tracking-wider">الواجب المدرسي</h3>
                                        </div>
                                        <p className="text-lg text-emerald-900 dark:text-emerald-100 font-bold">
                                            {followup.homework || 'لا يوجد واجب مسجل'}
                                        </p>
                                    </div>
                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/30">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-3">
                                            <FilePlus size={20} />
                                            <h3 className="font-bold text-sm uppercase tracking-wider">صفحة الواجب</h3>
                                        </div>
                                        <p className="text-lg text-emerald-900 dark:text-emerald-100 font-black" dir="ltr">
                                            {followup.homework_page || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Notes */}
                                {followup.notes && (
                                    <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-6 border border-amber-100 dark:border-amber-900/30">
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                                            <AlertCircle size={20} />
                                            <h3 className="font-bold text-sm uppercase tracking-wider">ملاحظات إضافية</h3>
                                        </div>
                                        <p className="text-amber-900 dark:text-amber-100 leading-relaxed font-bold">
                                            {followup.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Attachments */}
                                {followup.attachments?.length > 0 && (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-3">
                                            <Paperclip size={20} />
                                            <h3 className="font-bold text-sm uppercase tracking-wider">المرفقات</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {followup.attachments.map((att, idx) => (
                                                <a
                                                    key={idx}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-primary-600 hover:border-primary-400 transition-colors"
                                                >
                                                    <Download size={14} />
                                                    <span>{att.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Supervisor Review */}
                                {(followup.supervisor_rating || followup.supervisor_notes) && (
                                    <div className="bg-indigo-50/60 dark:bg-indigo-900/15 rounded-2xl p-6 border border-indigo-200/70 dark:border-indigo-800/40 space-y-2">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                                <Star size={20} className="fill-amber-400 text-amber-500" />
                                                <h3 className="font-bold text-sm uppercase tracking-wider">مراجعة الموجه</h3>
                                            </div>
                                            {followup.supervisor_rating && (
                                                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                                                    التقييم: {followup.supervisor_rating} / 5
                                                </span>
                                            )}
                                        </div>
                                        {followup.supervisor_notes && (
                                            <p className="text-sm font-bold text-indigo-950 dark:text-indigo-100 leading-relaxed">
                                                {followup.supervisor_notes}
                                            </p>
                                        )}
                                        {followup.reviewer_name && (
                                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                                بواسطة: {followup.reviewer_name} {followup.reviewed_at ? `(${followup.reviewed_at})` : ''}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 border-dashed dark:border-slate-800 shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">لم يتم رفع المحتوى بعد</h3>
                        <p className="text-slate-500 font-semibold max-w-sm mx-auto">لم تقم بإضافة دفتر المتابعة أو الواجبات لهذا الدرس حتى الآن. انقر على الزر أعلاه لإضافة المحتوى.</p>
                        
                        <button
                            onClick={startEditing}
                            className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 rounded-xl font-bold transition-all"
                        >
                            <Plus size={20} />
                            إضافة المحتوى الآن
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
