import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { Calendar, Plus, Edit2, Trash2, X, Save, FileText, CheckCircle2 } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';

export default function HolidaysIndex({ holidays, branches, isAdmin }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        start_date: '',
        end_date: '',
        branch_id: '',
        notes: '',
    });

    const openModal = (holiday = null) => {
        if (holiday) {
            setEditingHoliday(holiday);
            setData({
                name: holiday.name,
                start_date: holiday.start_date,
                end_date: holiday.end_date,
                branch_id: holiday.branch_id || '',
                notes: holiday.notes || '',
            });
        } else {
            setEditingHoliday(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingHoliday(null);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingHoliday) {
            put(route('hr.holidays.update', editingHoliday.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('hr.holidays.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذه الإجازة الرسمية؟')) {
            destroy(route('hr.holidays.destroy', id));
        }
    };

    return (
        <AdminLayout>
            <Head title="الإجازات الرسمية والعطلات" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">الإجازات الرسمية والعطلات</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">إدارة أيام العطل الرسمية للمؤسسة والفروع</p>
                        </div>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-primary-500/20"
                    >
                        <Plus size={20} /> إضافة إجازة رسمية
                    </button>
                </div>

                {/* List */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">اسم الإجازة / المناسبة</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">من تاريخ</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">إلى تاريخ</th>
                                    {isAdmin && <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الفرع</th>}
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">ملاحظات</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {holidays.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-slate-500">
                                            لا توجد إجازات رسمية مضافة.
                                        </td>
                                    </tr>
                                ) : (
                                    holidays.map((holiday) => (
                                        <tr key={holiday.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="py-4 px-6 font-bold text-dark-900 dark:text-white">
                                                {holiday.name}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                {holiday.start_date}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                {holiday.end_date}
                                            </td>
                                            {isAdmin && (
                                                <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                    {holiday.branch_id ? holiday.branch?.name : 'عام (لجميع الفروع)'}
                                                </td>
                                            )}
                                            <td className="py-4 px-6 text-slate-500 text-sm max-w-xs truncate">
                                                {holiday.notes || '-'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openModal(holiday)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(holiday.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal}></div>
                        <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="text-primary-500" />
                                    {editingHoliday ? 'تعديل إجازة رسمية' : 'إضافة إجازة رسمية'}
                                </h3>
                                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم المناسبة <span className="text-accent-500">*</span></label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        value={data.name} onChange={e => setData('name', e.target.value)}
                                        placeholder="مثال: عيد الفطر، اليوم الوطني..."
                                    />
                                    {errors.name && <p className="text-xs text-accent-500 mt-1">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">تاريخ البدء <span className="text-accent-500">*</span></label>
                                        <FlatpickrInput
                                            value={data.start_date}
                                            onChange={(selectedDates, dateStr) => setData('start_date', dateStr)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        />
                                        {errors.start_date && <p className="text-xs text-accent-500 mt-1">{errors.start_date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">تاريخ الانتهاء <span className="text-accent-500">*</span></label>
                                        <FlatpickrInput
                                            value={data.end_date}
                                            onChange={(selectedDates, dateStr) => setData('end_date', dateStr)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        />
                                        {errors.end_date && <p className="text-xs text-accent-500 mt-1">{errors.end_date}</p>}
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الفرع المخصص (اختياري)</label>
                                        <SelectInput
                                            options={[
                                                { value: '', label: 'عام - ينطبق على جميع الفروع' },
                                                ...branches.map(b => ({ value: b.id, label: b.name }))
                                            ]}
                                            value={[
                                                { value: '', label: 'عام - ينطبق على جميع الفروع' },
                                                ...branches.map(b => ({ value: b.id, label: b.name }))
                                            ].find(o => o.value == data.branch_id) || null}
                                            onChange={(selected) => setData('branch_id', selected?.value || '')}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">اتركه فارغاً لتطبيق الإجازة على جميع فروع المؤسسة.</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">ملاحظات (اختياري)</label>
                                    <textarea
                                        rows="3"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        value={data.notes} onChange={e => setData('notes', e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <Save size={20} />
                                        {editingHoliday ? 'حفظ التعديلات' : 'إضافة الإجازة'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
