import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Search, Calendar, UserX, Clock, MapPin, X } from 'lucide-react';
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
            <Head title="تقارير الغياب المدرسي (الطلاب)" />

            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <UserX className="text-rose-500" />
                        الغياب المدرسي للطلاب
                    </h1>
                    <p className="text-slate-500 mt-1">تتبع الحضور والغياب اليومي للطلاب عن المدرسة</p>
                </div>
                
                <div className="flex items-end gap-2 w-full md:w-auto">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ التقرير</label>
                        <FlatpickrInput
                            value={date}
                            onChange={(dates) => setDate(dates[0] ? dates[0].toISOString().split('T')[0] : '')}
                            placeholder="اختر التاريخ..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2"
                        />
                    </div>
                    <button 
                        onClick={applyFilters}
                        className="h-10 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"
                    >
                        <Search size={16} /> بحث
                    </button>
                    {(filters.date) && (
                        <button 
                            onClick={clearFilters}
                            className="h-10 w-10 flex items-center justify-center bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-xl transition-colors"
                            title="مسح الفلاتر"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">اسم الطالب</th>
                                <th className="px-6 py-4">تاريخ الحضور</th>
                                <th className="px-6 py-4">وقت الحضور</th>
                                <th className="px-6 py-4">وقت الانصراف</th>
                                <th className="px-6 py-4 text-center">الموقع</th>
                                <th className="px-6 py-4">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {logs.data.length > 0 ? (
                                logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                                            {log.user?.name || 'غير معروف'}
                                        </td>
                                        <td className="px-6 py-4 font-mono">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {log.attendance_date}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-emerald-600 font-bold">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                {log.check_in_time || '---'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-rose-600 font-bold">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                {log.check_out_time || '---'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {log.location ? (
                                                <a href={`https://maps.google.com/?q=${log.location}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100">
                                                    <MapPin size={14} /> خريطة
                                                </a>
                                            ) : '---'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.status === 'حاضر' ? (
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">حاضر</span>
                                            ) : log.status === 'متأخر' ? (
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">متأخر</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">{log.status}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-bold">
                                        لا توجد سجلات غياب/حضور للطلاب في هذا التاريخ.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {logs.links && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <Pagination links={logs.links} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
