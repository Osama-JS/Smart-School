import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Search, Filter, FileText, Send, CheckCircle, Trash2, Edit2, X, Save, RotateCcw, Eye, ShieldCheck, User, Calendar, Paperclip, PenTool, Megaphone, Award, Star, Activity, Clock, Bell } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import SignaturePad from '@/Components/SignaturePad';
import Pagination from '@/Components/Pagination';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function Index({ auth, achievements, types, employees, filters, stats }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        user_id: '',
        achievement_type_id: '',
        achievement_date: new Date().toISOString().split('T')[0],
        details: '',
        attachment: null,
        admin_signature: null,
    });

    const notifyForm = useForm({
        channels: ['database'],
    });

    const [filterData, setFilterData] = useState({
        user_id: filters.user_id || '',
        achievement_type_id: filters.achievement_type_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const applyFilters = () => {
        router.get(route('hr.employee-achievements'), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setFilterData({
            user_id: '',
            achievement_type_id: '',
            start_date: '',
            end_date: ''
        });
        router.get(route('hr.employee-achievements'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openModal = (achievement = null) => {
        reset();
        setSelectedAchievement(achievement);
        if (achievement) {
            setData({
                user_id: achievement.user_id,
                achievement_type_id: achievement.achievement_type_id,
                achievement_date: achievement.achievement_date,
                details: achievement.details || '',
                attachment: null,
                admin_signature: null,
            });
        }
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (selectedAchievement) {
            put(route('hr.employee-achievements.update', selectedAchievement.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
                preserveScroll: true
            });
        } else {
            post(route('hr.employee-achievements.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
                preserveScroll: true
            });
        }
    };

    const openNotifyModal = (achievement) => {
        setSelectedAchievement(achievement);
        notifyForm.reset();
        setIsNotifyModalOpen(true);
    };

    const openPreviewModal = (achievement) => {
        setSelectedAchievement(achievement);
        setIsPreviewModalOpen(true);
    };

    const sendNotify = (e) => {
        e.preventDefault();
        notifyForm.post(route('hr.employee-achievements.notify', selectedAchievement.id), {
            onSuccess: () => setIsNotifyModalOpen(false)
        });
    };

    const confirmDelete = (achievement) => {
        setSelectedAchievement(achievement);
        setIsDeleteModalOpen(true);
    };

    const deleteAchievement = () => {
        router.delete(route('hr.employee-achievements.destroy', selectedAchievement.id), {
            onSuccess: () => setIsDeleteModalOpen(false)
        });
    };

    const confirmBroadcast = (achievement) => {
        setSelectedAchievement(achievement);
        setIsBroadcastModalOpen(true);
    };

    const broadcastAchievement = () => {
        router.post(route('hr.employee-achievements.broadcast', selectedAchievement.id), {}, {
            onSuccess: () => setIsBroadcastModalOpen(false)
        });
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="سجل الإنجازات" />

            <div className="max-w-7xl mx-auto space-y-6">
                
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 via-white to-white dark:from-emerald-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-emerald-100 dark:border-emerald-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <ShieldCheck size={28} className="text-emerald-600" />
                                سجل الإنجازات
                            </h1>
                            <p className="text-emerald-700/80 dark:text-emerald-300/80 mt-2 text-sm font-semibold">إدارة إنجازات الموظفين ومكافآتهم</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl hover:shadow-lg hover:shadow-emerald-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>تسجيل إنجاز جديد</span>
                            </button>
                        </div>
                    </div>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <ShieldCheck className="text-emerald-500" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الإنجازات</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white">{stats.total}</h4>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Calendar className="text-blue-500" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إنجازات هذا الشهر</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white">{stats.this_month}</h4>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Send className="text-amber-500" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">بانتظار الاستلام</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white">{stats.unsigned}</h4>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={18} className="text-emerald-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white">تصفية النتائج</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="group flex flex-col">
                            <SelectInput 
                                className="w-full" 
                                value={filterData.user_id} 
                                onChange={val => setFilterData({...filterData, user_id: val})}
                                options={[ { value: '', label: 'جميع الموظفين' }, ...employees.map(emp => ({ value: emp.id, label: emp.name })) ]}
                            />
                        </div>
                        <div className="group flex flex-col">
                            <SelectInput 
                                className="w-full" 
                                value={filterData.achievement_type_id} 
                                onChange={val => setFilterData({...filterData, achievement_type_id: val})}
                                options={[ { value: '', label: 'جميع الأنواع' }, ...types.map(t => ({ value: t.id, label: t.name })) ]}
                            />
                        </div>
                        <div className="group flex flex-col">
                            <FlatpickrInput 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 !pl-10"
                                value={filterData.start_date}
                                onChange={val => setFilterData({...filterData, start_date: val})}
                                placeholder="من تاريخ"
                            />
                        </div>
                        <div className="group flex flex-col">
                            <FlatpickrInput 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 !pl-10"
                                value={filterData.end_date}
                                onChange={val => setFilterData({...filterData, end_date: val})}
                                placeholder="إلى تاريخ"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
                        <button onClick={applyFilters} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2">
                            <Filter size={16} /> تطبيق الفرز
                        </button>
                        <button onClick={clearFilters} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2">
                            <RotateCcw size={16} /> إعادة ضبط
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-full">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                                <tr>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500">الموظف</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500">التاريخ والنوع</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500">التفاصيل والمكافأة</th>
                                    <th className="py-4 px-6 text-center text-sm font-bold text-slate-500">استلام الموظف</th>
                                    <th className="py-4 px-6 text-center text-sm font-bold text-slate-500 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {achievements.data.length > 0 ? achievements.data.map((a) => (
                                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                            {a.user?.name}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                {a.achievement_date}
                                            </div>
                                            <div className="text-xs mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                                {a.achievement_type?.name}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2" title={a.details}>{a.details || 'لا يوجد تفاصيل'}</div>
                                            <div className="mt-1 flex items-center gap-3">
                                                {a.achievement_type?.reward && (
                                                    <div className="text-xs font-bold text-emerald-600">المكافأة: {a.achievement_type.reward}</div>
                                                )}
                                                {a.points > 0 && (
                                                    <div className="text-xs font-bold text-amber-600 px-2 py-0.5 bg-amber-50 rounded-lg">+{a.points} نقطة</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {a.employee_signature ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                                    <CheckCircle size={14} /> مستلم
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => openNotifyModal(a)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200 transition-colors"
                                                >
                                                    <Send size={14} /> طلب استلام
                                                </button>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => confirmBroadcast(a)} title="احتفاء عام" className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 hover:text-purple-700 hover:bg-purple-100 flex items-center justify-center">
                                                    <Megaphone size={16} />
                                                </button>
                                                <button onClick={() => openPreviewModal(a)} title="معاينة" className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:text-emerald-500 hover:bg-emerald-50 flex items-center justify-center">
                                                    <Eye size={16} />
                                                </button>
                                                {!a.employee_signature && (
                                                    <>
                                                        <button onClick={() => openModal(a)} className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => confirmDelete(a)} className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center text-slate-500">
                                            لا توجد إنجازات مسجلة.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {achievements.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                            <Pagination links={achievements.links} />
                        </div>
                    )}
                </div>
            </div>

            {/* Broadcast Modal */}
            {isBroadcastModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsBroadcastModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col">
                        <div className="p-8 text-center flex-1">
                            <div className="w-20 h-20 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Megaphone size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-dark-900 dark:text-white mb-3">احتفاء عام!</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                                هل أنت متأكد من إرسال إشعار احتفاء عام لجميع الموظفين بإنجاز <strong>{selectedAchievement?.user?.name}</strong>؟
                                <br/>سيظهر الإشعار في النظام لتعزيز التحفيز والمشاركة.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={broadcastAchievement}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                نعم، أرسل الإشعار
                            </button>
                            <button
                                onClick={() => setIsBroadcastModalOpen(false)}
                                className="sm:w-1/3 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
                            >
                                تراجع
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                        
                        <div className="relative p-6 sm:p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                        <Award size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white tracking-tight">
                                            {selectedAchievement ? 'تعديل إنجاز' : 'تسجيل إنجاز جديد'}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">
                                            أدخل تفاصيل الإنجاز للموظف ليتم توثيقه في النظام
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                            <form onSubmit={submit} className="space-y-6" id="achievementForm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                                            <User size={16} className="text-emerald-500" />
                                            الموظف <span className="text-rose-500">*</span>
                                        </label>
                                        <SelectInput
                                            className="w-full"
                                            value={data.user_id}
                                            onChange={(val) => setData('user_id', val)}
                                            options={employees.map(emp => ({ value: emp.id, label: emp.name }))}
                                            placeholder="-- اختر الموظف --"
                                            required
                                        />
                                        {errors.user_id && <p className="text-xs text-rose-500 mt-1">{errors.user_id}</p>}
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                                            <Calendar size={16} className="text-blue-500" />
                                            تاريخ الإنجاز <span className="text-rose-500">*</span>
                                        </label>
                                        <FlatpickrInput
                                            type="date"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl py-3 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 !pl-10"
                                            value={data.achievement_date}
                                            onChange={(val) => setData('achievement_date', val)}
                                            required
                                        />
                                        {errors.achievement_date && <p className="text-xs text-rose-500 mt-1">{errors.achievement_date}</p>}
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                                            <Star size={16} className="text-amber-500" />
                                            نوع الإنجاز <span className="text-rose-500">*</span>
                                        </label>
                                        <SelectInput
                                            className="w-full"
                                            value={data.achievement_type_id}
                                            onChange={(val) => setData('achievement_type_id', val)}
                                            options={types.map(t => ({ value: t.id, label: t.name }))}
                                            placeholder="-- اختر النوع --"
                                            required
                                        />
                                        {errors.achievement_type_id && <p className="text-xs text-rose-500 mt-1">{errors.achievement_type_id}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                                            <FileText size={16} className="text-indigo-500" />
                                            التفاصيل (اختياري)
                                        </label>
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-emerald-400"
                                            value={data.details}
                                            onChange={(e) => setData('details', e.target.value)}
                                            rows="3"
                                        />
                                        {errors.details && <p className="text-xs text-rose-500 mt-1">{errors.details}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                                            <PenTool size={16} className="text-emerald-500" />
                                            توقيع المسؤول المباشر
                                        </label>
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
                                            <SignaturePad 
                                                onChange={(val) => setData('admin_signature', val)} 
                                                error={errors.admin_signature}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-3">
                            <button
                                type="submit"
                                form="achievementForm"
                                disabled={processing}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]"
                            >
                                <Save size={20} />
                                حفظ واعتماد الإنجاز
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="sm:w-1/3 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {isPreviewModalOpen && selectedAchievement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsPreviewModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                        
                        <div className="relative p-6 sm:p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                        <Eye size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white tracking-tight">
                                            تفاصيل الإنجاز
                                        </h3>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsPreviewModalOpen(false)} 
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">الموظف</p>
                                        <p className="text-base font-bold text-dark-900 dark:text-white">{selectedAchievement.user?.name}</p>
                                    </div>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تاريخ الإنجاز</p>
                                        <p className="text-base font-bold text-dark-900 dark:text-white">{selectedAchievement.achievement_date}</p>
                                    </div>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">نوع الإنجاز</p>
                                        <p className="text-base font-bold text-dark-900 dark:text-white flex items-center gap-2">
                                            {selectedAchievement.achievement_type?.name}
                                        </p>
                                    </div>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">النقاط / المكافأة</p>
                                        <p className="text-base font-bold text-dark-900 dark:text-white flex items-center gap-2">
                                            <span className="text-amber-500">{selectedAchievement.points} نقطة</span>
                                            <span className="text-slate-300">|</span>
                                            <span>{selectedAchievement.achievement_type?.reward || 'لا توجد'}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">التفاصيل</p>
                                    <p className="text-base font-semibold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedAchievement.details || 'لا توجد تفاصيل إضافية مسجلة.'}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121820] rounded-2xl text-center">
                                        <p className="text-sm text-slate-500 mb-3 font-bold">توقيع المسؤول المباشر</p>
                                        {selectedAchievement.admin_signature ? (
                                            <img src={selectedAchievement.admin_signature_url} className="h-20 mx-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:invert" alt="توقيع المسؤول" />
                                        ) : (
                                            <div className="h-20 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                                <span className="text-slate-400 italic text-sm">غير موقع</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121820] rounded-2xl text-center">
                                        <p className="text-sm text-slate-500 mb-3 font-bold">توقيع الموظف المنجز</p>
                                        {selectedAchievement.employee_signature ? (
                                            <img src={selectedAchievement.employee_signature_url} className="h-20 mx-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:invert" alt="توقيع الموظف" />
                                        ) : (
                                            <div className="h-20 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                                <span className="text-slate-400 italic text-sm">بانتظار توقيع الموظف</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <button onClick={() => setIsPreviewModalOpen(false)} className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]">
                                إغلاق المعاينة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notify Modal */}
            {isNotifyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsNotifyModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col">
                        
                        <div className="relative p-6 sm:p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500"></div>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                        <Bell size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white tracking-tight">
                                            إشعار الموظف
                                        </h3>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsNotifyModalOpen(false)} 
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            <form onSubmit={sendNotify} className="space-y-6" id="notifyForm">
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                    سيتم إرسال إشعار للموظف <strong>{selectedAchievement?.user?.name}</strong> لإعلامه بتسجيل الإنجاز وطلب الدخول للاطلاع عليه وتوقيع الاستلام.
                                </p>
                                
                                <div>
                                    <label className="block text-sm font-bold mb-3 text-slate-800 dark:text-slate-200">اختر قنوات الإرسال</label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                            <input type="checkbox" checked={notifyForm.data.channels.includes('database')} onChange={(e) => {
                                                const channels = [...notifyForm.data.channels];
                                                if (e.target.checked) channels.push('database');
                                                else channels.splice(channels.indexOf('database'), 1);
                                                notifyForm.setData('channels', channels);
                                            }} className="rounded text-amber-500 w-5 h-5 focus:ring-amber-500 border-slate-300 dark:border-slate-600 dark:bg-slate-900" />
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">إشعار داخلي في النظام</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                            <input type="checkbox" checked={notifyForm.data.channels.includes('mail')} onChange={(e) => {
                                                const channels = [...notifyForm.data.channels];
                                                if (e.target.checked) channels.push('mail');
                                                else channels.splice(channels.indexOf('mail'), 1);
                                                notifyForm.setData('channels', channels);
                                            }} className="rounded text-amber-500 w-5 h-5 focus:ring-amber-500 border-slate-300 dark:border-slate-600 dark:bg-slate-900" />
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">بريد إلكتروني (Email)</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                            <input type="checkbox" checked={notifyForm.data.channels.includes('firebase')} onChange={(e) => {
                                                const channels = [...notifyForm.data.channels];
                                                if (e.target.checked) channels.push('firebase');
                                                else channels.splice(channels.indexOf('firebase'), 1);
                                                notifyForm.setData('channels', channels);
                                            }} className="rounded text-amber-500 w-5 h-5 focus:ring-amber-500 border-slate-300 dark:border-slate-600 dark:bg-slate-900" />
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">إشعار تطبيق الجوال (Push)</span>
                                        </label>
                                    </div>
                                    {notifyForm.errors.channels && (
                                        <p className="text-sm text-red-500 mt-2 font-bold">{notifyForm.errors.channels}</p>
                                    )}
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex gap-3">
                            <button
                                type="button"
                                onClick={sendNotify}
                                disabled={notifyForm.processing}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]"
                            >
                                {notifyForm.processing ? 'جاري الإرسال...' : <><Send size={18} /> إرسال الإشعار</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col">
                        <div className="p-8 text-center flex-1">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-dark-900 dark:text-white mb-3">تأكيد الحذف</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                                هل أنت متأكد من حذف إنجاز <strong>{selectedAchievement?.user?.name}</strong>؟ 
                                <br/>لا يمكن التراجع عن هذا الإجراء.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={deleteAchievement}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-xl font-bold transition-all shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                نعم، احذف الإنجاز
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="sm:w-1/3 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
