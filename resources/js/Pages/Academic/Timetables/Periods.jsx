import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Clock, Plus, Edit, Trash2, Save, X, Coffee, BookOpen } from 'lucide-react';
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

                {/* Periods Timeline View */}
                <div className="bg-white/50 dark:bg-dark-900/40 backdrop-blur-xl border border-dark-100 dark:border-dark-800 rounded-[2rem] p-6 md:p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    {periods.length > 0 ? (
                        <div className="relative max-w-4xl mx-auto before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-dark-200 before:via-primary-300 before:to-dark-200 dark:before:from-dark-700 dark:before:via-primary-700 dark:before:to-dark-700">
                            {periods.map((period, idx) => {
                                const start = new Date(`2000-01-01T${period.start_time}`);
                                const end = new Date(`2000-01-01T${period.end_time}`);
                                const diffMins = Math.round((end - start) / 60000);
                                const isBreak = period.period_name.includes('فسحة') || period.period_name.includes('استراحة') || period.period_name.includes('صلاة');
                                
                                return (
                                    <div key={period.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group mb-8 transition-all hover:-translate-y-1">
                                        
                                        {/* Timeline Dot */}
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-dark-900 bg-white dark:bg-dark-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 ${isBreak ? 'text-amber-500' : 'text-primary-500'}`}>
                                            {isBreak ? <Coffee size={16} /> : <BookOpen size={16} />}
                                        </div>

                                        {/* Content Card */}
                                        <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border ${isBreak ? 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200/50 dark:border-amber-500/20' : 'bg-white dark:bg-dark-800 border-dark-100 dark:border-dark-700'} shadow-sm hover:shadow-md transition-shadow relative group-hover:border-primary-300 dark:group-hover:border-primary-700`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black ${isBreak ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' : 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <h3 className="font-black text-lg text-dark-900 dark:text-white">{period.period_name}</h3>
                                                </div>
                                                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openModal(period)} className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-all" title="تعديل">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(period.id)} className="p-2 text-dark-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="حذف">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
                                                <div className="flex items-center gap-1.5 text-dark-600 dark:text-dark-300 bg-dark-50 dark:bg-dark-900/50 px-3 py-1.5 rounded-lg border border-dark-100 dark:border-dark-800" dir="ltr">
                                                    <Clock size={14} className={isBreak ? 'text-amber-500' : 'text-primary-500'} />
                                                    {period.start_time ? period.start_time.substring(0, 5) : ''}
                                                </div>
                                                <div className="text-dark-300 dark:text-dark-600 font-normal">إلى</div>
                                                <div className="flex items-center gap-1.5 text-dark-600 dark:text-dark-300 bg-dark-50 dark:bg-dark-900/50 px-3 py-1.5 rounded-lg border border-dark-100 dark:border-dark-800" dir="ltr">
                                                    <Clock size={14} className={isBreak ? 'text-amber-500' : 'text-primary-500'} />
                                                    {period.end_time ? period.end_time.substring(0, 5) : ''}
                                                </div>
                                                
                                                <div className="mr-auto mt-2 sm:mt-0">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black ${isBreak ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30' : 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'}`}>
                                                        {diffMins} دقيقة
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center relative z-10">
                            <div className="w-24 h-24 bg-dark-50 dark:bg-dark-800/50 rounded-full flex items-center justify-center mb-6 border border-dark-100 dark:border-dark-700 relative shadow-inner">
                                <Clock size={40} className="text-dark-300 dark:text-dark-600" />
                                <div className="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full border-2 border-white dark:border-dark-900" />
                            </div>
                            <h3 className="text-dark-900 dark:text-white font-black text-xl mb-3">لم يتم إعداد أوقات الحصص بعد</h3>
                            <p className="text-dark-500 dark:text-dark-400 max-w-sm mx-auto font-semibold leading-relaxed">
                                قم بإضافة الحصص والفترات الدراسية (مثل الحصة الأولى، الفسحة) لبناء مخطط زمني لليوم الدراسي بشكل منظم.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="md">
                <div className="relative bg-white dark:bg-dark-900 rounded-[2rem] shadow-2xl w-full overflow-hidden border border-dark-100 dark:border-dark-800 transform transition-all">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600" />
                    <div className="p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-dark-100 dark:border-dark-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 flex items-center justify-center shadow-inner">
                                    <Clock size={24} />
                                </div>
                                <h2 className="text-xl font-black text-dark-900 dark:text-white">
                                    {editingPeriod ? 'تعديل توقيت' : 'إضافة توقيت جديد'}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-50 dark:bg-dark-800 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-black text-dark-800 dark:text-dark-200 mb-2">مسمى الفترة <span className="text-red-500">*</span></label>
                                <input type="text"
                                    className={`w-full bg-dark-50 dark:bg-dark-800 border-2 ${errors.period_name ? 'border-red-400 dark:border-red-500/50' : 'border-transparent dark:border-transparent focus:border-primary-500'} rounded-xl px-5 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/20 transition-all text-dark-900 dark:text-white font-bold placeholder:text-dark-400`}
                                    value={data.period_name} onChange={e => setData('period_name', e.target.value)} placeholder="مثال: الحصة الأولى، الفسحة..." />
                                {errors.period_name && <p className="text-xs font-bold text-red-500 mt-1.5">{errors.period_name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-black text-dark-800 dark:text-dark-200 mb-2">وقت البدء <span className="text-red-500">*</span></label>
                                    <FlatpickrInput 
                                        type="time"
                                        className={`!bg-dark-50 dark:!bg-dark-800 !border-2 ${errors.start_time ? '!border-red-400 dark:!border-red-500/50' : '!border-transparent dark:!border-transparent focus:!border-primary-500'} !rounded-xl !px-5 !py-3.5 !outline-none focus:!ring-4 focus:!ring-primary-500/20 transition-all text-dark-800 dark:text-white font-bold`}
                                        value={data.start_time} 
                                        onChange={val => setData('start_time', val)} 
                                    />
                                    {errors.start_time && <p className="text-xs font-bold text-red-500 mt-1.5">{errors.start_time}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-dark-800 dark:text-dark-200 mb-2">وقت الانتهاء <span className="text-red-500">*</span></label>
                                    <FlatpickrInput 
                                        type="time"
                                        className={`!bg-dark-50 dark:!bg-dark-800 !border-2 ${errors.end_time ? '!border-red-400 dark:!border-red-500/50' : '!border-transparent dark:!border-transparent focus:!border-primary-500'} !rounded-xl !px-5 !py-3.5 !outline-none focus:!ring-4 focus:!ring-primary-500/20 transition-all text-dark-800 dark:text-white font-bold`}
                                        value={data.end_time} 
                                        onChange={val => setData('end_time', val)} 
                                    />
                                    {errors.end_time && <p className="text-xs font-bold text-red-500 mt-1.5">{errors.end_time}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-dark-100 dark:border-dark-800">
                                <button type="button" onClick={closeModal} className="px-6 py-3.5 text-sm font-bold text-dark-600 hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-800 rounded-xl transition-colors">
                                    إلغاء
                                </button>
                                <button type="submit" disabled={processing} className="flex items-center gap-2 bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-8 py-3.5 rounded-xl text-sm font-black shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-70">
                                    {processing ? 'جاري الحفظ...' : <><Save size={18} /> حفظ التوقيت</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
