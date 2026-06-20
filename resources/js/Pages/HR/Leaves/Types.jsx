import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Sliders, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import Swal from 'sweetalert2';

import SelectInput from '@/Components/SelectInput';

export default function LeaveTypesIndex({ leaveTypes, isSystemAdmin, branches = [], filters = {}, currentBranchId }) {
    const { flash } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        branch_id: currentBranchId || '',
        name: '',
        default_days: 0,
    });

    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        const swalConfig = {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
        };

        if (flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'عذراً!',
                text: flash.error,
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#ef4444',
                ...swalConfig
            });
        }
        
        if (flash?.success) {
            Swal.fire({
                icon: 'success',
                title: 'نجاح!',
                text: flash.success,
                timer: 2000,
                showConfirmButton: false,
                ...swalConfig
            });
        }
    }, [flash]);

    const openModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setData({
                branch_id: type.branch_id || '',
                name: type.name,
                default_days: type.default_days,
            });
        } else {
            setEditingType(null);
            reset();
            if (currentBranchId) setData('branch_id', currentBranchId);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingType(null);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingType) {
            put(route('hr.leave-types.update', editingType.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('hr.leave-types.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'هل أنت متأكد من حذف هذا النوع من الإجازات؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: isDark ? '#334155' : '#94a3b8',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء',
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('hr.leave-types.destroy', id), { preserveScroll: true });
            }
        });
    };

    return (
        <AdminLayout activeMenu="أنواع الإجازات">
            <Head title="أنواع الإجازات" />

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
                            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight">أنواع الإجازات</h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة أنواع الإجازات وأرصدتها الافتراضية</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            {isSystemAdmin && (
                                <div className="w-48">
                                    <SelectInput
                                        value={filters.branch_id || ''}
                                        onChange={(val) => {
                                            router.get(route('hr.leave-types.index'), { branch_id: val }, { preserveState: true, preserveScroll: true });
                                        }}
                                        options={[
                                            { value: '', label: 'جميع الفروع' },
                                            ...branches.map(b => ({ value: b.id, label: b.name }))
                                        ]}
                                    />
                                </div>
                            )}
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

                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 w-16">#</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">اسم الإجازة</th>
                                    {isSystemAdmin && <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الفرع</th>}
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الرصيد الافتراضي (أيام)</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 w-24">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {leaveTypes && leaveTypes.length > 0 ? (
                                    leaveTypes.map((type, index) => (
                                        <tr key={type.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-mono">{index + 1}</td>
                                            <td className="py-4 px-6 font-bold text-dark-900 dark:text-white">{type.name}</td>
                                            {isSystemAdmin && <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{type.branch?.name || '-'}</td>}
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{type.default_days}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openModal(type)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(type.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isSystemAdmin ? "5" : "4"} className="py-12 text-center text-slate-500">
                                            لا توجد أنواع إجازات مضافة بعد.
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
                            <h3 className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                                <Sliders className="text-primary-500" />
                                {editingType ? 'تعديل نوع الإجازة' : 'إضافة نوع إجازة جديد'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {isSystemAdmin && (
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الفرع التابع له الإجازة</label>
                                    <SelectInput
                                        value={data.branch_id}
                                        onChange={val => setData('branch_id', val)}
                                        options={[
                                            { value: '', label: 'بدون فرع مخصص (يطبق على الجميع إن لزم)' },
                                            ...branches.map(b => ({ value: b.id, label: b.name }))
                                        ]}
                                    />
                                    {errors.branch_id && <p className="text-xs text-accent-500 mt-1">{errors.branch_id}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم الإجازة</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                    required
                                    placeholder="مثال: إجازة سنوية"
                                />
                                {errors.name && <p className="text-xs text-accent-500 mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الرصيد الافتراضي (عدد الأيام)</label>
                                <input
                                    type="number"
                                    value={data.default_days}
                                    onChange={e => setData('default_days', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                    required
                                    min="0"
                                />
                                {errors.default_days && <p className="text-xs text-accent-500 mt-1">{errors.default_days}</p>}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Save size={20} />
                                    {processing ? 'جاري الحفظ...' : 'حفظ'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
