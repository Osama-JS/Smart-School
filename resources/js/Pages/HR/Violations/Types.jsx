import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit, Trash2, ShieldAlert, Edit2, X, Save, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import Textarea from '@/Components/Textarea';

import SelectInput from '@/Components/SelectInput';

export default function Types({ auth, types, stats, jobGrades }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        description: '',
        first_time_action: '',
        second_time_action: '',
        third_time_action: '',
        follow_up_role_id: '',
        execution_role_id: '',
        is_active: true,
    });

    const openModal = (type = null) => {
        setEditingType(type);
        if (type) {
            setData({
                name: type.name,
                description: type.description || '',
                first_time_action: type.first_time_action || '',
                second_time_action: type.second_time_action || '',
                third_time_action: type.third_time_action || '',
                follow_up_role_id: type.follow_up_role_id || '',
                execution_role_id: type.execution_role_id || '',
                is_active: type.is_active,
            });
        } else {
            reset();
            setData('is_active', true);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingType) {
            put(route('hr.violation-types.update', editingType.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('hr.violation-types.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDelete = (type) => {
        setEditingType(type);
        setIsDeleteModalOpen(true);
    };

    const deleteType = () => {
        destroy(route('hr.violation-types.destroy', editingType.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="أنواع المخالفات" />

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Visual geometric lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <ShieldAlert size={28} className="text-primary-600" />
                                إدارة أنواع المخالفات
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة وتصنيف المخالفات والإجراءات الافتراضية الخاصة بها</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>إضافة نوع جديد</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                                <FileText className="text-primary-500" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الأنواع</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.total}</h4>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle className="text-emerald-500" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الأنواع النشطة</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.active}</h4>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="text-rose-500" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الأنواع الموقوفة</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.inactive}</h4>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-full">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">النوع</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الوصف</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الإجراءات المتخذة (١، ٢، ٣)</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">مسؤول المتابعة</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">مسؤول التنفيذ</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الحالة</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {types.length > 0 ? types.map((type) => (
                                    <tr key={type.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                            {type.name}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                            {type.description || '-'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                                    1: {type.first_time_action}
                                                </span>
                                                {type.second_time_action && (
                                                    <span className="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                                        2: {type.second_time_action}
                                                    </span>
                                                )}
                                                {type.third_time_action && (
                                                    <span className="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                                                        3: {type.third_time_action}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300 text-sm">
                                            {type.follow_up_role?.name || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300 text-sm">
                                            {type.execution_role?.name || '-'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${type.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {type.is_active ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openModal(type)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => confirmDelete(type)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center text-slate-500">
                                            لا توجد أنواع مخالفات مسجلة بعد.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ShieldAlert className="text-primary-500" />
                                {editingType ? 'تعديل نوع المخالفة' : 'إضافة نوع مخالفة جديد'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">نوع المخالفة <span className="text-accent-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-xs text-accent-500 mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">الوصف (اختياري)</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows="3"
                                />
                                {errors.description && <p className="text-xs text-accent-500 mt-1">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">إجراء المرة الأولى <span className="text-accent-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        value={data.first_time_action}
                                        onChange={(e) => setData('first_time_action', e.target.value)}
                                        required
                                        placeholder="مثال: لفت نظر، إنذار شفوي..."
                                    />
                                    {errors.first_time_action && <p className="text-xs text-accent-500 mt-1">{errors.first_time_action}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">إجراء المرة الثانية</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        value={data.second_time_action}
                                        onChange={(e) => setData('second_time_action', e.target.value)}
                                        placeholder="مثال: إنذار كتابي..."
                                    />
                                    {errors.second_time_action && <p className="text-xs text-accent-500 mt-1">{errors.second_time_action}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">إجراء المرة الثالثة فأكثر</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        value={data.third_time_action}
                                        onChange={(e) => setData('third_time_action', e.target.value)}
                                        placeholder="مثال: خصم يوم..."
                                    />
                                    {errors.third_time_action && <p className="text-xs text-accent-500 mt-1">{errors.third_time_action}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">مسؤول المتابعة</label>
                                    <SelectInput
                                        className="w-full"
                                        value={data.follow_up_role_id}
                                        onChange={(val) => setData('follow_up_role_id', val)}
                                        options={[
                                            { value: '', label: '-- بدون --' },
                                            ...(jobGrades || []).map(role => ({ value: role.id, label: role.name }))
                                        ]}
                                    />
                                    {errors.follow_up_role_id && <p className="text-xs text-accent-500 mt-1">{errors.follow_up_role_id}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">مسؤول التنفيذ</label>
                                    <SelectInput
                                        className="w-full"
                                        value={data.execution_role_id}
                                        onChange={(val) => setData('execution_role_id', val)}
                                        options={[
                                            { value: '', label: '-- بدون --' },
                                            ...(jobGrades || []).map(role => ({ value: role.id, label: role.name }))
                                        ]}
                                    />
                                    {errors.execution_role_id && <p className="text-xs text-accent-500 mt-1">{errors.execution_role_id}</p>}
                                </div>
                            </div>

                            <div className="block mt-6 mb-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="is_active"
                                        className="sr-only peer" 
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-500"></div>
                                    <span className="ms-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                                        حالة النوع (نشط)
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Save size={20} />
                                    {editingType ? 'حفظ التعديلات' : 'حفظ'}
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

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            هل أنت متأكد من رغبتك في حذف هذا النوع؟ سيؤدي ذلك إلى حذف جميع المخالفات المرتبطة به.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={deleteType}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all"
                            >
                                حذف نهائياً
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                            >
                                تراجع
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
