import React, { useState, useEffect, useMemo } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Sliders, Plus, Edit2, Trash2, X, Save, CalendarRange, Building2, FolderOpen, CalendarDays, CheckSquare, Hash, AlignLeft, Search, LayoutGrid, Table2, ShieldAlert } from 'lucide-react';
import Swal from 'sweetalert2';
import SelectInput from '@/Components/SelectInput';

export default function LeaveTypesIndex({ leaveTypes, isSystemAdmin, branches = [], filters = {}, currentBranchId }) {
    const { flash } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' vs 'table'
    const [searchQuery, setSearchQuery] = useState('');

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        branch_id: currentBranchId || '',
        name: '',
        default_days: 0,
    });

    // KPI Stats
    const totalTypes = leaveTypes?.length || 0;
    const globalTypes = leaveTypes?.filter(t => !t.branch_id)?.length || 0;
    const branchSpecificTypes = leaveTypes?.filter(t => t.branch_id)?.length || 0;

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
        setDeletingId(id);
    };

    const confirmDelete = () => {
        if (deletingId) {
            destroy(route('hr.leave-types.destroy', deletingId), { 
                preserveScroll: true,
                onSuccess: () => setDeletingId(null)
            });
        }
    };

    const filteredTypes = useMemo(() => {
        if (!leaveTypes) return [];
        return leaveTypes.filter(t => 
            !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [leaveTypes, searchQuery]);

    // Color mapper based on leave type ID or Name (deterministic pseudo-randomish for aesthetics)
    const getColorTheme = (name) => {
        const charCode = name.charCodeAt(0) || 0;
        const themes = [
            { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-200 dark:border-emerald-500/20' },
            { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-200 dark:border-indigo-500/20' },
            { bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-500', border: 'border-sky-200 dark:border-sky-500/20' },
            { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-200 dark:border-amber-500/20' },
            { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-200 dark:border-rose-500/20' },
            { bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', text: 'text-fuchsia-500', border: 'border-fuchsia-200 dark:border-fuchsia-500/20' },
        ];
        return themes[charCode % themes.length];
    };

    return (
        <AdminLayout activeMenu="أنواع الإجازات">
            <Head title="أنواع الإجازات" />

            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
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

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-2">
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-primary-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <CalendarRange className="text-primary-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الأنواع</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{totalTypes}</h4>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-indigo-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <CheckSquare className="text-indigo-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجازات عامة</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{globalTypes}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-emerald-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <Building2 className="text-emerald-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجازات مخصصة بفروع</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{branchSpecificTypes}</h4>
                        </div>
                    </div>
                </div>

                {/* Smart Toolbar */}
                <div className="bg-white dark:bg-[#121820]/60 p-3 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
                    {/* Branch Filter */}
                    <div className="w-full xl:w-64 shrink-0">
                        {isSystemAdmin && (
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
                        )}
                    </div>

                    {/* Search & View Toggles */}
                    <div className="flex items-center gap-3 w-full xl:w-auto shrink-0 flex-1 xl:flex-none justify-end">
                        <div className="relative w-full max-w-xs">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث بنوع الإجازة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/40 border-none rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                            />
                        </div>
                        
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block" />

                        {/* View Toggles */}
                        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl shrink-0">
                            {[
                                { id: 'cards', icon: LayoutGrid, title: 'بطاقات' },
                                { id: 'table', icon: Table2, title: 'جدول' },
                            ].map(view => (
                                <button
                                    key={view.id}
                                    onClick={() => setViewMode(view.id)}
                                    title={view.title}
                                    className={`p-2 rounded-xl transition-all ${viewMode === view.id ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    <view.icon size={18} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="min-h-[400px]">
                    {filteredTypes.length === 0 ? (
                        <div className="bg-white dark:bg-[#121820]/60 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm py-24 px-6 text-center flex flex-col items-center">
                            <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6 text-primary-500 relative">
                                <FolderOpen size={40} className="relative z-10" />
                                <div className="absolute inset-0 bg-primary-500 opacity-20 rounded-full blur-xl animate-pulse" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">لم نتمكن من العثور على أي أنواع</h3>
                            <p className="text-slate-500 text-sm font-semibold max-w-sm mb-6 leading-relaxed">
                                ابدأ بإضافة نوع إجازة جديد لإدارة أرصدة إجازات الموظفين بشكل فعال.
                            </p>
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-slate-900/20 dark:shadow-primary-500/20 active:scale-95"
                            >
                                <Plus size={18} />
                                <span>إضافة نوع جديد الآن</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'cards' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                                    {filteredTypes.map(type => {
                                        const theme = getColorTheme(type.name);
                                        return (
                                            <div key={type.id} className="group relative bg-white dark:bg-[#121820]/80 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none hover:-translate-y-1 flex flex-col h-full overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.03] transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.06] bg-slate-500" />
                                                
                                                <div className="relative z-10 flex justify-between items-start mb-6">
                                                    <div className={`w-12 h-12 rounded-2xl ${theme.bg} ${theme.text} flex items-center justify-center shrink-0`}>
                                                        <CalendarDays size={24} />
                                                    </div>
                                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openModal(type)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/20 flex items-center justify-center transition-all">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => handleDelete(type.id)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 flex items-center justify-center transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="relative z-10 flex-1">
                                                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
                                                        {type.name}
                                                    </h3>
                                                    {type.branch_id ? (
                                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                            <Building2 size={14} />
                                                            <span className="text-xs font-bold truncate">فرع: {type.branch?.name}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                            عام (لجميع الفروع)
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="relative z-10 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-500">الرصيد الافتراضي</span>
                                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                                        <Hash size={14} className="text-primary-500" />
                                                        <span className="font-black text-slate-800 dark:text-white text-sm">{type.default_days}</span>
                                                        <span className="text-xs font-bold text-slate-500">يوم</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {viewMode === 'table' && (
                                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-right min-w-[700px]">
                                            <thead>
                                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-16">#</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">اسم الإجازة</th>
                                                    {isSystemAdmin && <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الفرع</th>}
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الرصيد الافتراضي (أيام)</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredTypes.map((type, index) => {
                                                    const theme = getColorTheme(type.name);
                                                    return (
                                                        <tr key={type.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                                            <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-bold">{index + 1}</td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-8 h-8 rounded-xl ${theme.bg} ${theme.text} flex items-center justify-center shrink-0`}>
                                                                        <CalendarDays size={16} />
                                                                    </div>
                                                                    <span className="font-bold text-slate-900 dark:text-white">{type.name}</span>
                                                                </div>
                                                            </td>
                                                            {isSystemAdmin && (
                                                                <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                                    {type.branch_id ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                                                                                <Building2 size={12} />
                                                                            </div>
                                                                            <span className="font-bold text-sm">{type.branch?.name}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                            عام (لجميع الفروع)
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            )}
                                                            <td className="py-4 px-6">
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                                                                    <Hash size={14} className="text-primary-500" />
                                                                    {type.default_days} <span className="text-xs text-slate-500">يوم</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => openModal(type)}
                                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/20 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(type.id)}
                                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add/Edit Slide-over Drawer */}
            <div className={`fixed inset-0 z-50 transition-all duration-300 ${isModalOpen ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closeModal}></div>
                
                <div className={`absolute top-0 bottom-0 left-0 w-full max-w-md bg-white dark:bg-[#121820] shadow-2xl border-r border-slate-100 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${isModalOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    
                    {/* Drawer Header */}
                    <div className="relative p-6 sm:p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-primary-600"></div>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                                    <Sliders size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-dark-900 dark:text-white tracking-tight">
                                        {editingType ? 'تعديل نوع الإجازة' : 'إضافة نوع جديد'}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">
                                        {editingType ? 'تحديث بيانات نوع الإجازة' : 'أدخل تفاصيل الإجازة لإضافتها للنظام'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={closeModal} 
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Drawer Body */}
                    <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                        <form onSubmit={submit} className="space-y-6" id="leaveTypeForm">
                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                    <AlignLeft size={16} className="text-primary-500" />
                                    اسم الإجازة <span className="text-accent-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                        required
                                        placeholder="مثال: إجازة سنوية، مرضية..."
                                    />
                                </div>
                                {errors.name && <p className="text-xs text-accent-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.name}</p>}
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                    <Hash size={16} className="text-primary-500" />
                                    الرصيد الافتراضي (عدد الأيام) <span className="text-accent-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={data.default_days}
                                        onChange={e => setData('default_days', e.target.value)}
                                        className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                        required
                                        min="0"
                                    />
                                </div>
                                {errors.default_days && <p className="text-xs text-accent-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.default_days}</p>}
                            </div>

                            {isSystemAdmin && (
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                    <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                        <Building2 size={16} className="text-primary-500" />
                                        الفرع التابع له الإجازة
                                    </label>
                                    <SelectInput
                                        value={data.branch_id}
                                        onChange={val => setData('branch_id', val)}
                                        options={[
                                            { value: '', label: 'عام - لجميع الفروع' },
                                            ...branches.map(b => ({ value: b.id, label: b.name }))
                                        ]}
                                    />
                                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 w-fit px-2 py-1 rounded-md">اتركه فارغاً ليطبق على الجميع.</p>
                                    {errors.branch_id && <p className="text-xs text-accent-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.branch_id}</p>}
                                </div>
                            )}
                        </form>
                    </div>
                    
                    {/* Drawer Footer */}
                    <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col gap-3">
                        <button
                            type="submit"
                            form="leaveTypeForm"
                            disabled={processing}
                            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98]"
                        >
                            <Save size={20} />
                            {editingType ? 'حفظ التعديلات' : 'إضافة النوع'}
                        </button>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setDeletingId(null)}></div>
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col">
                        <div className="p-8 text-center flex-1">
                            <div className="w-20 h-20 bg-accent-50 dark:bg-accent-500/10 text-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-dark-900 dark:text-white mb-3">تأكيد الحذف</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                                هل أنت متأكد من أنك تريد حذف نوع الإجازة هذا؟ 
                                <br/>لا يمكن التراجع عن هذا الإجراء وقد يؤثر على أرصدة الموظفين الحالية.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={confirmDelete}
                                disabled={processing}
                                className="flex-1 bg-accent-500 hover:bg-accent-600 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-md shadow-accent-500/20 hover:shadow-lg hover:shadow-accent-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {processing ? 'جاري الحذف...' : 'نعم، احذف الإجازة'}
                            </button>
                            <button
                                onClick={() => setDeletingId(null)}
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
