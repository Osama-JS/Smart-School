import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Calendar, ChevronLeft, ChevronRight, CheckCircle, Plus, Search } from 'lucide-react';

export default function Index({ auth, days, weekOffset, periodStart, periodEnd, filters = {} }) {
    
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

    return (
        <AdminLayout user={auth.user}>
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
                                            <div key={lIdx} className={`p-4 rounded-2xl border ${lesson.has_followup ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'} relative group hover:shadow-md transition-all`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{lesson.subject?.name}</h4>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{lesson.division?.grade?.name} - {lesson.division?.name}</p>
                                                    </div>
                                                    {lesson.has_followup && (
                                                        <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 p-1.5 rounded-lg" title="تم الرفع">
                                                            <CheckCircle size={18} />
                                                        </span>
                                                    )}
                                                </div>

                                                <Link
                                                    href={route('teacher.followup-books.show', {
                                                        date: day.date,
                                                        subject_id: lesson.subject.id,
                                                        division_id: lesson.division.id
                                                    })}
                                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-colors ${lesson.has_followup ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'}`}
                                                >
                                                    {lesson.has_followup ? 'عرض / تعديل' : 'إضافة المحتوى'}
                                                    {lesson.has_followup ? null : <Plus size={16} />}
                                                </Link>
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
        </AdminLayout>
    );
}
