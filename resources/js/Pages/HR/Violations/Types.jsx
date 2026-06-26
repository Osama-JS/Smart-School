import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit, Trash2, ShieldAlert, Edit2, X, Save, FileText, CheckCircle, AlertTriangle, AlignLeft, AlertCircle, UserCheck, UserCog, CheckCircle2, Search, Filter, LayoutGrid, Table2, ChevronLeft, Flag } from 'lucide-react';
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
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // '', 'active', 'inactive'

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

    // Client-side filtering
    const filteredTypes = useMemo(() => {
        return types.filter(t => {
            const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === '' || (statusFilter === 'active' && t.is_active) || (statusFilter === 'inactive' && !t.is_active);
            return matchesSearch && matchesStatus;
        });
    }, [types, searchQuery, statusFilter]);

    // Escalation Path Component for Cards
    const EscalationPath = ({ t }) => (
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h5 className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5"><AlertCircle size={14}/> مسار التصعيد</h5>
            
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-[10px] flex items-center justify-center shrink-0">1</div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{t.first_time_action}</p>
            </div>
            
            {t.second_time_action && (
                <div className="flex items-center gap-2 opacity-90">
                    <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0">2</div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{t.second_time_action}</p>
                </div>
            )}
            
            {t.third_time_action && (
                <div className="flex items-center gap-2 opacity-80">
                    <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-[10px] flex items-center justify-center shrink-0">3</div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{t.third_time_action}</p>
                </div>
            )}
        </div>
    );

    return (
        <AdminLayout user={auth.user}>
            <Head title="أنواع المخالفات" />

            <div className="max-w-[1600px] mx-auto space-y-6">
                
                {/* Header Section (Preserved) */}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-2">
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-primary-500 transition-transform group-hover:scale-150" />
                            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0 relative z-10">
                                <FileText className="text-primary-500" size={28} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الأنواع</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.total}</h4>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-emerald-500 transition-transform group-hover:scale-150" />
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 relative z-10">
                                <CheckCircle className="text-emerald-500" size={28} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الأنواع النشطة</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.active}</h4>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-rose-500 transition-transform group-hover:scale-150" />
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0 relative z-10">
                                <AlertTriangle className="text-rose-500" size={28} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الأنواع الموقوفة</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.inactive}</h4>
                            </div>
                        </div>
                    </div>
                )}

                {/* Smart Toolbar */}
                <div className="bg-white dark:bg-[#121820]/60 p-3 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
                    {/* Status Tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto custom-scrollbar shrink-0">
                        {[
                            { value: '', label: 'الكل' }, 
                            { value: 'active', label: 'الأنواع النشطة' }, 
                            { value: 'inactive', label: 'الموقوفة' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${statusFilter === opt.value ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Search & View Toggles */}
                    <div className="flex items-center gap-3 w-full xl:w-auto shrink-0 flex-1 xl:flex-none justify-end">
                        <div className="relative w-full max-w-xs">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث باسم المخالفة..."
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
                                <ShieldAlert size={40} className="relative z-10" />
                                <div className="absolute inset-0 bg-primary-500 opacity-20 rounded-full blur-xl animate-pulse" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">لا توجد أنواع مخالفات</h3>
                            <p className="text-slate-500 text-sm font-semibold max-w-sm mb-6 leading-relaxed">
                                لم يتم العثور على أي نوع تطابق الفلاتر الحالية. يمكنك البدء بإضافة نوع مخالفة جديد لتحديد لوائح العمل.
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
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {filteredTypes.map(type => (
                                        <div key={type.id} className="group relative bg-white dark:bg-[#121820]/80 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none hover:-translate-y-1 flex flex-col h-full overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.03] transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.06] bg-primary-500" />
                                            
                                            <div className="relative z-10 flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                        {type.name}
                                                    </h3>
                                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${type.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                                                        {type.is_active ? 'نشط' : 'موقوف'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openModal(type)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/20 flex items-center justify-center transition-all">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => confirmDelete(type)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 flex items-center justify-center transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {type.description && (
                                                <p className="relative z-10 text-sm font-semibold text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                                                    {type.description}
                                                </p>
                                            )}

                                            <div className="relative z-10 flex-1">
                                                <EscalationPath t={type} />
                                            </div>

                                            <div className="relative z-10 grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                                        <UserCheck size={14} />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">المتابعة</p>
                                                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{type.follow_up_role?.name || 'الكل'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                                                        <UserCog size={14} />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">التنفيذ</p>
                                                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{type.execution_role?.name || 'الإدارة'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'table' && (
                                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-right min-w-[900px]">
                                            <thead>
                                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">النوع</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الوصف</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-1/3">مسار التصعيد (الإجراءات)</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الأدوار المسؤولة</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الحالة</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredTypes.map((type) => (
                                                    <tr key={type.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                            {type.name}
                                                        </td>
                                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300 max-w-xs truncate text-sm font-semibold">
                                                            {type.description || '-'}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-[10px] flex items-center justify-center shrink-0">1</div>
                                                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{type.first_time_action}</p>
                                                                </div>
                                                                {type.second_time_action && (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-5 h-5 rounded bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0">2</div>
                                                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{type.second_time_action}</p>
                                                                    </div>
                                                                )}
                                                                {type.third_time_action && (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-5 h-5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-[10px] flex items-center justify-center shrink-0">3</div>
                                                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{type.third_time_action}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-2" title="مسؤول المتابعة">
                                                                    <UserCheck size={14} className="text-indigo-500" />
                                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{type.follow_up_role?.name || '-'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2" title="مسؤول التنفيذ">
                                                                    <UserCog size={14} className="text-sky-500" />
                                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{type.execution_role?.name || '-'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${type.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                                                                {type.is_active ? 'نشط' : 'موقوف'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => openModal(type)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/20 transition-all shadow-sm">
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button onClick={() => confirmDelete(type)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all shadow-sm">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal (Preserved structurally) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                        
                        <div className="relative p-6 sm:p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white tracking-tight">
                                            {editingType ? 'تعديل نوع المخالفة' : 'إضافة نوع مخالفة جديد'}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">
                                            {editingType ? 'تحديث بيانات ونوع وإجراءات المخالفة المحددة' : 'أدخل تفاصيل نوع المخالفة والإجراءات المترتبة عليها ليتم إضافتها للنظام'}
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

                        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                            <form onSubmit={submit} className="space-y-6" id="violationTypeForm">
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                    <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                        <FileText size={16} className="text-primary-500" />
                                        نوع المخالفة <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        placeholder="مثال: التأخر عن العمل، الغياب بدون عذر..."
                                    />
                                    {errors.name && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.name}</p>}
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                    <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                        <AlignLeft size={16} className="text-primary-500" />
                                        الوصف (اختياري)
                                    </label>
                                    <textarea
                                        className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows="2"
                                        placeholder="اكتب وصفاً مختصراً للمخالفة..."
                                    />
                                    {errors.description && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.description}</p>}
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                        <AlertCircle size={16} className="text-amber-500" />
                                        الإجراءات المتخذة (مسار التصعيد)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1"><div className="w-4 h-4 rounded bg-amber-100 text-amber-600 flex items-center justify-center text-[10px]">1</div> إجراء المرة الأولى <span className="text-rose-500">*</span></label>
                                            <input
                                                type="text"
                                                className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                                value={data.first_time_action}
                                                onChange={(e) => setData('first_time_action', e.target.value)}
                                                required
                                                placeholder="مثال: لفت نظر..."
                                            />
                                            {errors.first_time_action && <p className="text-xs text-rose-500 mt-1">{errors.first_time_action}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1"><div className="w-4 h-4 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-[10px]">2</div> إجراء المرة الثانية</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                                value={data.second_time_action}
                                                onChange={(e) => setData('second_time_action', e.target.value)}
                                                placeholder="مثال: إنذار كتابي..."
                                            />
                                            {errors.second_time_action && <p className="text-xs text-rose-500 mt-1">{errors.second_time_action}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1"><div className="w-4 h-4 rounded bg-rose-100 text-rose-600 flex items-center justify-center text-[10px]">3</div> المرة الثالثة فأكثر</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                                value={data.third_time_action}
                                                onChange={(e) => setData('third_time_action', e.target.value)}
                                                placeholder="مثال: خصم يوم..."
                                            />
                                            {errors.third_time_action && <p className="text-xs text-rose-500 mt-1">{errors.third_time_action}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                        <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                            <UserCheck size={16} className="text-primary-500" />
                                            مسؤول المتابعة
                                        </label>
                                        <SelectInput
                                            className="w-full"
                                            value={data.follow_up_role_id}
                                            onChange={(val) => setData('follow_up_role_id', val)}
                                            options={[
                                                { value: '', label: '-- بدون --' },
                                                ...(jobGrades || []).map(role => ({ value: role.id, label: role.name }))
                                            ]}
                                        />
                                        {errors.follow_up_role_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.follow_up_role_id}</p>}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                        <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                            <UserCog size={16} className="text-primary-500" />
                                            مسؤول التنفيذ
                                        </label>
                                        <SelectInput
                                            className="w-full"
                                            value={data.execution_role_id}
                                            onChange={(val) => setData('execution_role_id', val)}
                                            options={[
                                                { value: '', label: '-- بدون --' },
                                                ...(jobGrades || []).map(role => ({ value: role.id, label: role.name }))
                                            ]}
                                        />
                                        {errors.execution_role_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.execution_role_id}</p>}
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60">
                                    <label className="relative flex items-center gap-3 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            name="is_active"
                                            className="sr-only peer" 
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[22px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-500"></div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <CheckCircle2 size={16} className={data.is_active ? "text-primary-500" : "text-slate-400"} />
                                            تفعيل نوع المخالفة (نشط)
                                        </span>
                                    </label>
                                </div>
                            </form>
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-3">
                            <button
                                type="submit"
                                form="violationTypeForm"
                                disabled={processing}
                                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98]"
                            >
                                <Save size={20} />
                                {editingType ? 'حفظ التعديلات' : 'إضافة نوع المخالفة'}
                            </button>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="sm:w-1/3 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
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
                                هل أنت متأكد من رغبتك في حذف هذا النوع؟ 
                                <br/>لا يمكن التراجع عن هذا الإجراء ولا يمكن الحذف إذا كانت هناك مخالفات مرتبطة به.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={deleteType}
                                disabled={processing}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {processing ? 'جاري الحذف...' : 'نعم، احذف النوع'}
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
