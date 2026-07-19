import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, ArrowRight, Calendar, Clock, CheckCircle, XCircle, FileText, CheckSquare, Book, FilePlus, AlertCircle } from 'lucide-react';
import Modal from '@/Components/Modal';

export default function Show({ auth, teacher, days, timeLimit }) {
    const [selectedFollowup, setSelectedFollowup] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculate overall stats
    let totalLessons = 0;
    let onTimeCount = 0;
    let lateCount = 0;
    let missingCount = 0;

    days.forEach(day => {
        day.lessons.forEach(lesson => {
            totalLessons++;
            if (lesson.status === 'on_time') onTimeCount++;
            else if (lesson.status === 'late') lateCount++;
            else missingCount++;
        });
    });

    const openDetailsModal = (followup) => {
        setSelectedFollowup(followup);
        setIsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedFollowup(null), 300);
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title={`متابعة المعلم - ${teacher.name}`} />

            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-10 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="relative z-10 flex flex-col gap-6">
                        <div>
                            <Link href={route('admin.followup-books.index')} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold mb-4 inline-flex items-center gap-2 transition-colors bg-white dark:bg-slate-800/80 px-4 py-2 rounded-xl shadow-sm border border-primary-100 dark:border-primary-500/20 w-fit">
                                <ArrowRight size={18} />
                                عودة للقائمة
                            </Link>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-inner">
                                    <BookOpen size={32} />
                                </div>
                                {teacher.name}
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-3 text-base font-medium flex items-center gap-2">
                                <Clock size={18} />
                                الحد الأقصى للرفع اليومي: {timeLimit}
                            </p>
                        </div>
                        
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الحصص</p>
                                    <p className="text-2xl font-black text-slate-800 dark:text-white">{totalLessons}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">رفع بالوقت</p>
                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{onTimeCount}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/30 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">رفع متأخر</p>
                                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{lateCount}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-red-100 dark:border-red-900/30 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">تقصير (لم يرفع)</p>
                                    <p className="text-2xl font-black text-red-600 dark:text-red-400">{missingCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Days Grid */}
                <div className="space-y-8">
                    {days.length > 0 ? (
                        days.map((day, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                {/* Day Header */}
                                <div className="bg-slate-50 dark:bg-slate-800/80 p-5 md:px-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-600">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-slate-800 dark:text-white">{day.day_name}</h3>
                                            <p className="text-sm text-slate-500 font-bold" dir="ltr">{day.date}</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-1.5 bg-white dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm text-sm font-bold text-slate-600 dark:text-slate-300">
                                        {day.lessons.length} حصص
                                    </div>
                                </div>
                                
                                {/* Lessons List */}
                                <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {day.lessons.map((lesson, lIdx) => (
                                        <div 
                                            key={lIdx} 
                                            className={`relative rounded-2xl border p-5 transition-all hover:shadow-md ${
                                                lesson.status === 'on_time' ? 'border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-900/5' : 
                                                lesson.status === 'late' ? 'border-amber-100 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-900/5' : 
                                                'border-red-100 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/5'
                                            }`}
                                        >
                                            {/* Status Badge Positioned Absolute */}
                                            <div className="absolute top-4 left-4">
                                                {lesson.status === 'on_time' && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full text-xs font-black shadow-sm">
                                                        <CheckCircle size={14} /> بالوقت
                                                    </span>
                                                )}
                                                {lesson.status === 'late' && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-full text-xs font-black shadow-sm">
                                                        <Clock size={14} /> متأخر
                                                    </span>
                                                )}
                                                {lesson.status === 'missing' && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded-full text-xs font-black shadow-sm">
                                                        <XCircle size={14} /> لم يرفع
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mb-4 pr-2">
                                                <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 mb-1">{lesson.subject}</h4>
                                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{lesson.division}</p>
                                            </div>

                                            <div className="bg-white dark:bg-slate-800/80 rounded-xl p-3 border border-slate-100 dark:border-slate-700 mb-4 h-16 flex items-center justify-center text-center">
                                                {lesson.followup ? (
                                                    <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-2" title={lesson.followup.lesson_title}>
                                                        {lesson.followup.lesson_title}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-400 italic">لا يوجد محتوى</span>
                                                )}
                                            </div>

                                            {lesson.followup && (
                                                <button
                                                    onClick={() => openDetailsModal(lesson.followup)}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 border border-primary-100 dark:border-primary-500/10"
                                                >
                                                    <FileText size={18} />
                                                    تفاصيل الدفتر
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-16 text-center flex flex-col items-center">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700">
                                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">لا توجد حصص مسجلة</h3>
                            <p className="text-slate-500 font-medium max-w-md">لا توجد أية بيانات للعرض في هذه الفترة، قد يكون المعلم غير مسند لأي جدول أو لم يتم تحديد حصص.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Followup Details Modal */}
            <Modal show={isModalOpen} onClose={closeDetailsModal} maxWidth="2xl">
                {selectedFollowup && (
                    <div className="relative overflow-hidden bg-white dark:bg-slate-900">
                        {/* Decorative header */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary-500 to-primary-700 opacity-10 dark:opacity-20" />
                        
                        <div className="relative p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center">
                                        <Book size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">محتوى دفتر المتابعة</h2>
                                        <p className="text-slate-500 font-semibold mt-1">تاريخ الرفع: <span dir="ltr">{new Date(selectedFollowup.uploaded_at).toLocaleString('ar-EG')}</span></p>
                                    </div>
                                </div>
                                <button onClick={closeDetailsModal} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Title and Page */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                                            <FileText size={18} />
                                            <h3 className="font-bold text-sm">عنوان الدرس</h3>
                                        </div>
                                        <p className="text-lg font-bold text-slate-800 dark:text-white">
                                            {selectedFollowup.lesson_title || 'بدون عنوان'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                                            <BookOpen size={18} />
                                            <h3 className="font-bold text-sm">رقم الصفحة</h3>
                                        </div>
                                        <p className="text-lg font-bold text-slate-800 dark:text-white" dir="ltr">
                                            {selectedFollowup.page_number || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Homework */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/30">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                                            <CheckSquare size={18} />
                                            <h3 className="font-bold text-sm">الواجب المدرسي</h3>
                                        </div>
                                        <p className="text-emerald-900 dark:text-emerald-100 font-medium">
                                            {selectedFollowup.homework || 'لا يوجد واجب مسجل'}
                                        </p>
                                    </div>
                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/30">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                                            <FilePlus size={18} />
                                            <h3 className="font-bold text-sm">صفحة الواجب</h3>
                                        </div>
                                        <p className="text-emerald-900 dark:text-emerald-100 font-bold" dir="ltr">
                                            {selectedFollowup.homework_page || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedFollowup.notes && (
                                    <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/30">
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                                            <AlertCircle size={18} />
                                            <h3 className="font-bold text-sm">ملاحظات إضافية</h3>
                                        </div>
                                        <p className="text-amber-900 dark:text-amber-100 leading-relaxed font-medium">
                                            {selectedFollowup.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

        </AdminLayout>
    );
}
