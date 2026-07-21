import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Filter, X, Save } from 'lucide-react';
import Modal from '@/Components/Modal';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function ResultPeriods({ periods, semesters, branches, isAdmin }) {
    const [showModal, setShowModal] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        semester_id: '',
        month_name: '',
        fill_start_date: '',
        fill_end_date: '',
        branch_id: '',
    });

    const openModal = (period = null) => {
        setEditingPeriod(period);
        if (period) {
            setData({
                semester_id: period.semester_id,
                month_name: period.month_name,
                fill_start_date: period.fill_start_date,
                fill_end_date: period.fill_end_date,
                branch_id: period.branch_id || '',
            });
        } else {
            reset();
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingPeriod(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingPeriod) {
            put(route('academic.result-periods.update', editingPeriod.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('academic.result-periods.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذه الفترة؟')) {
            destroy(route('academic.result-periods.destroy', id));
        }
    };

    return (
        <AdminLayout activeMenu="فترات الرصد">
            <Head title="إدارة فترات الرصد" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
                {/* Header section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="absolute left-0 top-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary-500" />
                            <path d="M0 50 C 50 100 80 0 100 50 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary-400" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary-500 blur-xl opacity-20 rounded-full"></div>
                                <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-4 rounded-2xl shadow-md relative ring-4 ring-white dark:ring-[#121820]">
                                    <CalendarIcon size={28} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                                    فترات الرصد (النتائج الشهرية)
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-2">
                                    <Filter size={16} className="text-primary-500" /> إدارة الفترات الزمنية المسموح فيها برصد الدرجات من قبل المعلمين
                                </p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => openModal()}
                            className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-primary-600 rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary-600/30 shrink-0"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <Plus size={20} className="relative z-10" />
                            <span className="relative z-10">إضافة فترة رصد</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">اسم الفترة</th>
                                    <th className="px-6 py-4">الفصل الدراسي</th>
                                    {isAdmin && <th className="px-6 py-4">الفرع</th>}
                                    <th className="px-6 py-4 text-center">بداية الرصد</th>
                                    <th className="px-6 py-4 text-center">نهاية الرصد</th>
                                    <th className="px-6 py-4 text-center">الحالة</th>
                                    <th className="px-6 py-4 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {periods.map((period) => {
                                    const now = new Date().toISOString().split('T')[0];
                                    const isOpen = now >= period.fill_start_date && now <= period.fill_end_date;
                                    const isPast = now > period.fill_end_date;
                                    const isFuture = now < period.fill_start_date;
                                    return (
                                        <tr key={period.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/25 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                                                {period.month_name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {period.semester?.name} ({period.semester?.academic_year?.year_name})
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                    {period.branch?.name}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                                                {period.fill_start_date}
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                                                {period.fill_end_date}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isOpen && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">مفتوحة للرصد</span>}
                                                {isPast && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">مغلقة</span>}
                                                {isFuture && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">مجدولة</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center flex items-center justify-center gap-3">
                                                <button onClick={() => openModal(period)} className="text-blue-500 hover:text-blue-600" title="تعديل">
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(period.id)} className="text-red-500 hover:text-red-600" title="حذف">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {periods.length === 0 && (
                                    <tr>
                                        <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            لا توجد فترات رصد مضافة حالياً.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal show={showModal} onClose={closeModal} maxWidth="md">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {editingPeriod ? 'تعديل فترة الرصد' : 'إضافة فترة رصد'}
                        </h2>
                        <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {isAdmin && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الفرع</label>
                                <SelectInput
                                    value={data.branch_id}
                                    onChange={val => setData('branch_id', val)}
                                    options={branches.map(b => ({ value: b.id, label: b.name }))}
                                    placeholder="اختر الفرع..."
                                />
                                {errors.branch_id && <p className="mt-1 text-sm font-bold text-red-500">{errors.branch_id}</p>}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الفصل الدراسي</label>
                            <SelectInput
                                value={data.semester_id}
                                onChange={val => setData('semester_id', val)}
                                options={semesters.map(s => ({ value: s.id, label: `${s.name} (${s.academic_year?.year_name})` }))}
                                placeholder="اختر الفصل الدراسي..."
                            />
                            {errors.semester_id && <p className="mt-1 text-sm font-bold text-red-500">{errors.semester_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم الفترة (مثال: الشهر الأول، منتصف الفصل)</label>
                            <input
                                type="text"
                                value={data.month_name}
                                onChange={e => setData('month_name', e.target.value)}
                                className="block w-full p-3 font-bold text-slate-800 border-2 border-slate-200 rounded-xl bg-slate-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-900/50 dark:border-slate-700 dark:text-white transition-all shadow-sm"
                                placeholder="أدخل اسم الفترة..."
                            />
                            {errors.month_name && <p className="mt-1 text-sm font-bold text-red-500">{errors.month_name}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">بداية فترة الرصد</label>
                                <FlatpickrInput
                                    type="date"
                                    value={data.fill_start_date || ''}
                                    onChange={date => setData('fill_start_date', date)}
                                    className="block w-full p-3 font-bold text-slate-800 border-2 border-slate-200 rounded-xl bg-slate-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-900/50 dark:border-slate-700 dark:text-white transition-all shadow-sm"
                                />
                                {errors.fill_start_date && <p className="mt-1 text-sm font-bold text-red-500">{errors.fill_start_date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نهاية فترة الرصد</label>
                                <FlatpickrInput
                                    type="date"
                                    value={data.fill_end_date || ''}
                                    onChange={date => setData('fill_end_date', date)}
                                    className="block w-full p-3 font-bold text-slate-800 border-2 border-slate-200 rounded-xl bg-slate-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-900/50 dark:border-slate-700 dark:text-white transition-all shadow-sm"
                                />
                                {errors.fill_end_date && <p className="mt-1 text-sm font-bold text-red-500">{errors.fill_end_date}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {processing ? 'جاري الحفظ...' : 'حفظ الفترة'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
