import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Clock, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import Swal from 'sweetalert2';
import Modal from '@/Components/Modal';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function PeriodsIndex({ periods }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        period_name: '',
        start_time: '',
        end_time: '',
    });

    const openModal = (period = null) => {
        clearErrors();
        if (period) {
            setEditingPeriod(period);
            setData({
                period_name: period.period_name,
                start_time: period.start_time.substring(0, 5), // Remove seconds
                end_time: period.end_time.substring(0, 5),
            });
        } else {
            setEditingPeriod(null);
            setData({
                period_name: '',
                start_time: '',
                end_time: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setData({
                period_name: '',
                start_time: '',
                end_time: '',
            });
            clearErrors();
        }, 300);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingPeriod) {
            put(route('academic.periods.update', editingPeriod.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('academic.periods.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من التراجع عن الحذف! سيتأثر الجدول الدراسي المرتبط بهذه الحصة.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('academic.periods.destroy', id), {
                    preserveScroll: true,
                });
            }
        });
    };

    return (
        <AdminLayout activeMenu="أوقات الحصص">
            <Head title="الحصص اليومية | النظام الأكاديمي" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Fine abstract geometric background lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                            <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <Clock size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">جدولة الحصص اليومية</h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 text-sm mt-1 font-semibold">إعداد توقيتات الحصص (مثل: الحصة الأولى، الفسحة)</p>
                            </div>
                        </div>

                        <button
                            onClick={() => openModal()}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/30 transition-all shrink-0 w-full sm:w-auto"
                        >
                            <Plus size={18} /> <span>إضافة حصة / فترة</span>
                        </button>
                    </div>
                </div>

                {/* Periods List */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">مسمى الفترة</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">وقت البدء</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">وقت الانتهاء</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300 text-center">المدة</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {periods.length > 0 ? (
                                    periods.map((period, idx) => {
                                        // Calculate duration in minutes
                                        const start = new Date(`2000-01-01T${period.start_time}`);
                                        const end = new Date(`2000-01-01T${period.end_time}`);
                                        const diffMins = Math.round((end - start) / 60000);

                                        return (
                                            <tr key={period.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                                                            {idx + 1}
                                                        </div>
                                                        <span className="font-bold text-slate-800 dark:text-white">{period.period_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-sm" dir="ltr">{period.start_time.substring(0, 5)}</td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-sm" dir="ltr">{period.end_time.substring(0, 5)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                        {diffMins} دقيقة
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => openModal(period)} className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                                            <Edit size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(period.id)} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Clock size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
                                                <p className="text-slate-500 dark:text-slate-400 font-bold">لم يتم إعداد أوقات الحصص بعد</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400 flex items-center justify-center">
                                <Clock size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editingPeriod ? 'تعديل توقيت' : 'إضافة توقيت جديد'}
                            </h2>
                        </div>
                        <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">مسمى الفترة <span className="text-rose-500">*</span></label>
                            <input type="text"
                                className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.period_name ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700'} focus:border-primary-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all`}
                                value={data.period_name} onChange={e => setData('period_name', e.target.value)} placeholder="مثال: الحصة الأولى، الفسحة..." />
                            {errors.period_name && <p className="text-xs text-rose-500 mt-1">{errors.period_name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">وقت البدء <span className="text-rose-500">*</span></label>
                                <FlatpickrInput 
                                    type="time"
                                    className={`${errors.start_time ? '!border-rose-300' : ''}`}
                                    value={data.start_time} 
                                    onChange={val => setData('start_time', val)} 
                                />
                                {errors.start_time && <p className="text-xs text-rose-500 mt-1">{errors.start_time}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">وقت الانتهاء <span className="text-rose-500">*</span></label>
                                <FlatpickrInput 
                                    type="time"
                                    className={`${errors.end_time ? '!border-rose-300' : ''}`}
                                    value={data.end_time} 
                                    onChange={val => setData('end_time', val)} 
                                />
                                {errors.end_time && <p className="text-xs text-rose-500 mt-1">{errors.end_time}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                إلغاء
                            </button>
                            <button type="submit" disabled={processing} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/30 transition-all disabled:opacity-70">
                                {processing ? 'جاري الحفظ...' : <><Save size={18} /> حفظ التوقيت</>}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}
