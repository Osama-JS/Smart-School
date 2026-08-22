import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, ArrowRight, Calendar, Clock, CheckCircle, XCircle, FileText, Book, AlertCircle, Edit3 } from 'lucide-react';
import Modal from '@/Components/Modal';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function Show({ auth, teacher, days, timeLimit, periodStart, periodEnd }) {
    const [selectedPrep, setSelectedPrep] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [startDate, setStartDate] = useState(periodStart || '');
    const [endDate, setEndDate] = useState(periodEnd || '');

    const applyDateFilter = () => {
        router.get(route('admin.followup-books.show', {
            teacher: teacher.id,
            start_date: startDate,
            end_date: endDate,
        }), {}, { preserveState: true, preserveScroll: true });
    };

    // Calculate overall stats
    let totalLessons = 0;
    let onTimeCount = 0;
    let lateCount = 0;
    let draftCount = 0;
    let missingCount = 0;

    days.forEach(day => {
        day.lessons.forEach(lesson => {
            totalLessons++;
            if (lesson.status === 'on_time') onTimeCount++;
            else if (lesson.status === 'late') lateCount++;
            else if (lesson.status === 'draft') draftCount++;
            else missingCount++;
        });
    });

    const openDetailsModal = (prep) => {
        setSelectedPrep(prep);
        setIsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedPrep(null), 300);
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title={`متابعة تحضيرات المعلم - ${teacher.name}`} />

            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-10 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <Link href={route('admin.followup-books.index')} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold mb-4 inline-flex items-center gap-2 transition-colors bg-white dark:bg-slate-800/80 px-4 py-2 rounded-xl shadow-sm border border-primary-100 dark:border-primary-500/20 w-fit">
                                    <ArrowRight size={18} />
                                    عودة لقائمة المعلمين
                                </Link>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
                                    <div className="w-14 h-14 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-inner">
                                        <BookOpen size={32} />
                                    </div>
                                    {teacher.name}
                                </h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-3 text-base font-medium flex items-center gap-2">
                                    <Clock size={18} />
                                    موعد إغلاق التحضير اليومي: {timeLimit}
                                </p>
                            </div>

                            {/* Inline Date Filter */}
                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-primary-100 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">من تاريخ</label>
                                    <FlatpickrInput
                                        type="date"
                                        value={startDate}
                                        onChange={val => setStartDate(val)}
                                        placeholder="من تاريخ..."
                                        className="w-36 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">إلى تاريخ</label>
                                    <FlatpickrInput
                                        type="date"
                                        value={endDate}
                                        onChange={val => setEndDate(val)}
                                        placeholder="إلى تاريخ..."
                                        className="w-36 text-xs"
                                    />
                                </div>
                                <button
                                    onClick={applyDateFilter}
                                    className="self-end px-4 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-xs hover:bg-primary-700 transition-all shadow-sm active:scale-95"
                                >
                                    تحديث الفترة
                                </button>
                            </div>
                        </div>
                        
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
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
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">تحضير بالوقت</p>
                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{onTimeCount}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/30 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">تحضير متأخر</p>
                                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{lateCount}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-red-100 dark:border-red-900/30 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">غير محضر (تقصير)</p>
                                    <p className="text-2xl font-black text-red-600 dark:text-red-400">{missingCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Days Schedule Section */}
                <div className="space-y-6">
                    {days.length > 0 ? (
                        days.map((day, dIdx) => (
                            <div key={dIdx} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="bg-slate-50/80 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-primary-500" />
                                        <h3 className="font-black text-lg text-slate-800 dark:text-white">{day.day_name}</h3>
                                        <span className="text-sm font-semibold text-slate-400">({day.date})</span>
                                    </div>
                                    <span className="text-xs font-bold bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                        {day.lessons.length} حصص مجدولة
                                    </span>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {day.lessons.map((lesson, lIdx) => (
                                        <div 
                                            key={lIdx} 
                                            className={`relative rounded-2xl border p-5 transition-all hover:shadow-md ${
                                                lesson.status === 'on_time' ? 'border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-900/5' : 
                                                lesson.status === 'late' ? 'border-amber-100 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-900/5' : 
                                                lesson.status === 'draft' ? 'border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-900/5' :
                                                'border-red-100 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/5'
                                            }`}
                                        >
                                            {/* Status Badge */}
                                            <div className="absolute top-4 left-4">
                                                {lesson.status === 'on_time' && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full text-xs font-black shadow-sm">
                                                        <CheckCircle size={14} /> محضر بالوقت
                                                    </span>
                                                )}
                                                {lesson.status === 'late' && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-full text-xs font-black shadow-sm">
                                                        <Clock size={14} /> تحضير متأخر
                                                    </span>
                                                )}
                                                {lesson.status === 'draft' && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 rounded-full text-xs font-black shadow-sm">
                                                        <Edit3 size={14} /> مسودة
                                                    </span>
                                                )}
                                                {lesson.status === 'missing' && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded-full text-xs font-black shadow-sm">
                                                        <XCircle size={14} /> غير محضر
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mb-4 pr-2">
                                                <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 mb-1">{lesson.subject}</h4>
                                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{lesson.division}</p>
                                            </div>

                                            <div className="bg-white dark:bg-slate-800/80 rounded-xl p-3 border border-slate-100 dark:border-slate-700 mb-4 h-16 flex items-center justify-center text-center">
                                                {lesson.preparation ? (
                                                    <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-2" title={lesson.preparation.lesson_title}>
                                                        {lesson.preparation.lesson_title}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-400 italic">لم يُعد المعلم تحضيراً لهذا الدرس</span>
                                                )}
                                            </div>

                                            {lesson.preparation && (
                                                <button
                                                    onClick={() => openDetailsModal(lesson.preparation)}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 border border-primary-100 dark:border-primary-500/10"
                                                >
                                                    <FileText size={18} />
                                                    عرض تفاصيل التحضير
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

            {/* Preparation Details Modal */}
            <Modal show={isModalOpen} onClose={closeDetailsModal} maxWidth="2xl">
                {selectedPrep && (
                    <div className="relative overflow-hidden bg-white dark:bg-slate-900">
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary-500 to-primary-700 opacity-10 dark:opacity-20" />
                        
                        <div className="relative p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center">
                                        <Book size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">تفاصيل دفتر التحضير</h2>
                                        <p className="text-slate-500 font-semibold mt-1">تاريخ الإنشاء: <span dir="ltr">{selectedPrep.created_at || 'غير محدد'}</span></p>
                                    </div>
                                </div>
                                <button onClick={closeDetailsModal} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Title */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                                        <FileText size={18} />
                                        <h3 className="font-bold text-sm">عنوان وموضوع الدرس</h3>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">
                                        {selectedPrep.lesson_title || 'بدون عنوان'}
                                    </p>
                                </div>

                                {/* Topics Covered */}
                                {selectedPrep.topics_covered && (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                                            <BookOpen size={18} />
                                            <h3 className="font-bold text-sm">المحاور والأهداف المشروحة</h3>
                                        </div>
                                        <p className="text-base text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                            {selectedPrep.topics_covered}
                                        </p>
                                    </div>
                                )}

                                {/* Homework */}
                                {selectedPrep.homework && (
                                    <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-200/60 dark:border-amber-800/30">
                                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                                            <Clock size={18} />
                                            <h3 className="font-bold text-sm">الواجب المدرسي المطلوب</h3>
                                        </div>
                                        <p className="text-base text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                                            {selectedPrep.homework}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={closeDetailsModal}
                                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
