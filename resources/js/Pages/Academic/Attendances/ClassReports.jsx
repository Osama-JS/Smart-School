import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Search, Calendar, UserX, Clock, X, Filter } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';

export default function ClassReports({ attendances, divisions, filters }) {
    const [date, setDate] = useState(filters.date || new Date().toISOString().split('T')[0]);
    const [divisionId, setDivisionId] = useState(filters.division_id || '');
    const [status, setStatus] = useState(filters.status || '');

    const applyFilters = () => {
        router.get(route('academic.attendances.classes'), { date, division_id: divisionId, status }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setDate('');
        setDivisionId('');
        setStatus('');
        router.get(route('academic.attendances.classes'));
    };

    return (
        <AdminLayout activeMenu="غياب الحصص">
            <Head title="تقارير غياب الحصص" />

            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Clock className="text-primary-500" />
                        الغياب في الحصص
                    </h1>
                    <p className="text-slate-500 mt-1">تتبع حضور وغياب الطلاب في كل حصة دراسية على حدة</p>
                </div>
                
                <div className="flex flex-wrap items-end gap-2 w-full md:w-auto">
                    <div className="w-full md:w-40">
                        <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الحصة</label>
                        <FlatpickrInput
                            value={date}
                            onChange={(dates) => setDate(dates[0] ? dates[0].toISOString().split('T')[0] : '')}
                            placeholder="اختر التاريخ..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-xs font-bold text-slate-500 mb-1">الشعبة</label>
                        <SelectInput
                            value={divisionId}
                            onChange={(e) => setDivisionId(e.target.value)}
                            className="w-full"
                        >
                            <option value="">الكل</option>
                            {divisions.map(div => (
                                <option key={div.id} value={div.id}>
                                    {div.grade?.name} - {div.name}
                                </option>
                            ))}
                        </SelectInput>
                    </div>
                    <div className="w-full md:w-32">
                        <label className="block text-xs font-bold text-slate-500 mb-1">الحالة</label>
                        <SelectInput
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full"
                        >
                            <option value="">الكل</option>
                            <option value="present">حاضر</option>
                            <option value="absent">غائب</option>
                            <option value="late">متأخر</option>
                        </SelectInput>
                    </div>

                    <button 
                        onClick={applyFilters}
                        className="h-10 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"
                    >
                        <Filter size={16} /> تصفية
                    </button>
                    {(filters.date || filters.division_id || filters.status) && (
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
                                <th className="px-6 py-4">الطالب</th>
                                <th className="px-6 py-4">الشعبة / الصف</th>
                                <th className="px-6 py-4">المادة</th>
                                <th className="px-6 py-4">الحصة</th>
                                <th className="px-6 py-4">المعلم</th>
                                <th className="px-6 py-4">التاريخ</th>
                                <th className="px-6 py-4">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {attendances.data.length > 0 ? (
                                attendances.data.map((att) => (
                                    <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                                            {att.student?.name || 'غير معروف'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {att.division?.grade?.name} - {att.division?.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {att.subject?.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-bold">
                                            {att.period?.period_name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {att.teacher?.name}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-600">
                                            {att.date}
                                        </td>
                                        <td className="px-6 py-4">
                                            {att.status === 'present' ? (
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">حاضر</span>
                                            ) : att.status === 'late' ? (
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">متأخر</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">غائب</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-bold">
                                        لا توجد سجلات مطابقة للبحث.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {attendances.links && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <Pagination links={attendances.links} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
