import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Search, Calendar, UserX, Clock, MapPin, X, Filter } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function Index({ logs, filters }) {
    const [date, setDate] = useState(filters.date || new Date().toISOString().split('T')[0]);

    const applyFilters = () => {
        router.get(route('academic.attendances.index'), { date }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setDate('');
        router.get(route('academic.attendances.index'));
    };

    return (
        <AdminLayout activeMenu="الغياب المدرسي">
            <Head title="تقارير الغياب المدرسي | النظام الإداري" />

            <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8">
                {/* Header Section with Brand Colors and Geometric Accent */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                            <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <UserX size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    الغياب المدرسي
                                </h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-1 text-sm font-bold">
                                    تتبع الحضور والغياب اليومي للطلاب عن المدرسة
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 md:p-6 flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <Filter size={18} />
                        </div>
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">أدوات الفلترة</h2>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:w-64 relative group">
                            <FlatpickrInput
                                value={date}
                                onChange={(dates) => setDate(dates[0] ? dates[0].toISOString().split('T')[0] : '')}
                                placeholder="اختر التاريخ..."
                                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-4 pr-11 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                            />
                            <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                        </div>
                        <button 
                            onClick={applyFilters}
                            className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-500/20 active:scale-95 shrink-0"
                        >
                            <Search size={16} /> <span className="hidden sm:inline">بحث</span>
                        </button>
                        {(filters.date) && (
                            <button 
                                onClick={clearFilters}
                                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/10 dark:text-slate-400 dark:hover:text-rose-400 rounded-2xl transition-all shrink-0"
                                title="مسح الفلاتر"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-black text-slate-700 dark:text-slate-300">اسم الطالب</th>
                                    <th className="px-6 py-4 font-black text-slate-700 dark:text-slate-300">تاريخ الحضور</th>
                                    <th className="px-6 py-4 font-black text-slate-700 dark:text-slate-300">وقت الحضور</th>
                                    <th className="px-6 py-4 font-black text-slate-700 dark:text-slate-300">وقت الانصراف</th>
                                    <th className="px-6 py-4 font-black text-slate-700 dark:text-slate-300 text-center">الموقع</th>
                                    <th className="px-6 py-4 font-black text-slate-700 dark:text-slate-300">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {logs.data.length > 0 ? (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                                                        {log.user?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {log.user?.name || 'غير معروف'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                                                    {log.attendance_date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} />
                                                    <span className="bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                                                        {log.check_in_time || '---'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} />
                                                    <span className="bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md">
                                                        {log.check_out_time || '---'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {log.location ? (
                                                    <a href={`https://maps.google.com/?q=${log.location}`} target="_blank" rel="noreferrer" 
                                                       className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-500/20 font-bold text-xs transition-colors">
                                                        <MapPin size={14} /> خريطة
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 font-bold">---</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.status === 'حاضر' ? (
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg text-xs font-black">حاضر</span>
                                                ) : log.status === 'متأخر' ? (
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg text-xs font-black">متأخر</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-lg text-xs font-black">{log.status}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                                    <UserX size={32} className="text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">لا توجد سجلات</h3>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                                    لا توجد سجلات غياب أو حضور للطلاب في هذا التاريخ.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {logs.links && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <Pagination links={logs.links} />
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
