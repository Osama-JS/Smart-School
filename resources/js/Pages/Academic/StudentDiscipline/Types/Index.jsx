import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit2, Trash2, ShieldAlert, X, Save, FileText, CheckCircle, AlertTriangle, AlertCircle, Search, LayoutGrid, Table2, Printer, Target, GraduationCap } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';

export default function Types({ auth, types }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // '', 'active', 'inactive'

    const { data, setData, post, put, delete: destroy, errors, reset } = useForm({
        name: '',
        description: '',
        degree: 'first_degree',
        first_time_action: '',
        second_time_action: '',
        third_time_action: '',
        is_active: true,
    });

    const openModal = (type = null) => {
        setEditingType(type);
        if (type) {
            setData({
                name: type.name,
                description: type.description || '',
                degree: type.degree || 'first_degree',
                first_time_action: type.first_time_action || '',
                second_time_action: type.second_time_action || '',
                third_time_action: type.third_time_action || '',
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
            put(route('academic.student-violation-types.update', editingType.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('academic.student-violation-types.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDelete = (type) => {
        setEditingType(type);
        setIsDeleteModalOpen(true);
    };

    const deleteType = () => {
        destroy(route('academic.student-violation-types.destroy', editingType.id), {
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

    // Calculate Stats
    const stats = {
        total: types.length,
        active: types.filter(t => t.is_active).length,
        inactive: types.filter(t => !t.is_active).length,
    };

    // Escalation Path Component for Cards
    const EscalationPath = ({ t }) => (
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h5 className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5"><AlertCircle size={14}/> مسار التصعيد والإجراءات</h5>
            
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-[10px] flex items-center justify-center shrink-0">1</div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{t.first_time_action || 'بدون إجراء'}</p>
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

    const getDegreeBadge = (degree) => {
        switch (degree) {
            case 'first_degree': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">درجة أولى</span>;
            case 'second_degree': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">درجة ثانية</span>;
            case 'third_degree': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">درجة ثالثة</span>;
            default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20">غير محدد</span>;
        }
    };

    return (
        <AdminLayout user={auth.user} activeMenu="لائحة المخالفات (طلاب)">
            <Head title="أنواع المخالفات الطلابية" />

            <div className="hidden print:block mb-8 text-right font-sans" dir="rtl">
                <div className="flex items-center justify-between border-b-2 border-primary-600 pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-black text-dark-900">مدارس القيم الأهلية</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-1">سجل أنواع المخالفات الطلابية والإجراءات</p>
                    </div>
                    <div className="text-left font-semibold">
                        <p className="text-xs text-slate-500 mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto space-y-6">
                
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
                                لائحة المخالفات السلوكية (طلاب)
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة وتصنيف المخالفات الطلابية وإجراءاتها المتدرجة</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 no-print">
                            <button onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:border-primary-400 text-slate-600 dark:text-slate-300 rounded-2xl shadow-sm text-sm font-bold transition-all">
                                <Printer size={18} />
                                <span className="hidden sm:inline">طباعة</span>
                            </button>
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
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">لا توجد لوائح مخالفات</h3>
                            <p className="text-slate-500 text-sm font-semibold max-w-sm mb-6 leading-relaxed">
                                لم يتم العثور على أي لائحة تطابق الفلاتر الحالية. يمكنك البدء بإضافة مخالفة جديدة.
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
                            <div className={viewMode === 'cards' ? 'cards-view' : 'hidden'}>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {filteredTypes.map(type => (
                                        <div key={type.id} className="group relative bg-white dark:bg-[#121820]/80 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none hover:-translate-y-1 flex flex-col h-full overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.03] transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.06] bg-primary-500" />
                                            
                                            <div className="relative z-10 flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                        {type.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${type.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'}`}>
                                                            {type.is_active ? 'نشط' : 'غير نشط'}
                                                        </span>
                                                        {getDegreeBadge(type.degree)}
                                                    </div>
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
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={viewMode === 'table' ? 'table-view' : 'hidden print:block table-view'}>
                                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-right min-w-[900px]">
                                            <thead>
                                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">النوع / المخالفة</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الدرجة</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-1/3">مسار التصعيد (الإجراءات)</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الحالة</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredTypes.map((type) => (
                                                    <tr key={type.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                            <div className="mb-1">{type.name}</div>
                                                            <div className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">{type.description || '-'}</div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {getDegreeBadge(type.degree)}
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
                                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${type.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'}`}>
                                                                {type.is_active ? 'نشط' : 'غير نشط'}
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
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-auto transform transition-all">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        {editingType ? 'تعديل بيانات اللائحة' : 'لائحة مخالفة جديدة'}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">قم بتحديد اسم المخالفة والإجراءات المترتبة عليها</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 rounded-2xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="p-8">
                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم المخالفة <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            required
                                            placeholder="مثال: التأخر عن الطابور الصباحي"
                                        />
                                        {errors.name && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.name}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الوصف</label>
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            rows="2"
                                            placeholder="وصف تفصيلي للمخالفة..."
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">درجة المخالفة <span className="text-rose-500">*</span></label>
                                        <SelectInput
                                            options={[
                                                { value: 'first_degree', label: 'مخالفة من الدرجة الأولى (مخالفات بسيطة)' },
                                                { value: 'second_degree', label: 'مخالفة من الدرجة الثانية (مخالفات متوسطة)' },
                                                { value: 'third_degree', label: 'مخالفة من الدرجة الثالثة (مخالفات جسيمة)' },
                                            ]}
                                            value={data.degree}
                                            onChange={val => setData('degree', val)}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <AlertTriangle size={18} className="text-amber-500" />
                                        التدرج في الإجراءات
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <div className="absolute top-1/2 -translate-y-1/2 right-4 w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-[10px] flex items-center justify-center">1</div>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-5 pr-14 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                                value={data.first_time_action}
                                                onChange={e => setData('first_time_action', e.target.value)}
                                                placeholder="الإجراء في المرة الأولى (مثال: لفت نظر)"
                                                required
                                            />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute top-1/2 -translate-y-1/2 right-4 w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-black text-[10px] flex items-center justify-center">2</div>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-5 pr-14 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                                value={data.second_time_action}
                                                onChange={e => setData('second_time_action', e.target.value)}
                                                placeholder="الإجراء في المرة الثانية (مثال: استدعاء ولي أمر)"
                                            />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute top-1/2 -translate-y-1/2 right-4 w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-[10px] flex items-center justify-center">3</div>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-5 pr-14 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                                value={data.third_time_action}
                                                onChange={e => setData('third_time_action', e.target.value)}
                                                placeholder="الإجراء في المرة الثالثة (مثال: توقيع تعهد)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mt-6 cursor-pointer"
                                     onClick={() => setData('is_active', !data.is_active)}>
                                    <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${data.is_active ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white absolute transition-all ${data.is_active ? 'left-1' : 'right-1'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">حالة المخالفة (تفعيل/إيقاف)</p>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">في حال الإيقاف لن تظهر هذه المخالفة في قوائم تسجيل المخالفات الجديدة</p>
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-6 py-3.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold transition-colors">
                                        إلغاء
                                    </button>
                                    <button type="submit" className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 active:scale-95">
                                        <Save size={18} />
                                        <span>حفظ البيانات</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800 transform transition-all">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <Trash2 size={32} className="relative z-10" />
                            <div className="absolute inset-0 bg-rose-500 opacity-20 rounded-full blur-xl animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold mb-8">
                            هل أنت متأكد من حذف هذه اللائحة؟ لا يمكن التراجع عن هذا الإجراء وسيؤثر على سجل المخالفات السابق.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold transition-colors">
                                إلغاء
                            </button>
                            <button onClick={deleteType} className="flex-1 py-4 text-white bg-rose-500 hover:bg-rose-600 rounded-2xl font-bold transition-colors shadow-lg shadow-rose-500/20">
                                تأكيد الحذف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
