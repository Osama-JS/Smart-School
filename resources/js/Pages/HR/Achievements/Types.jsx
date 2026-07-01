import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Trash2, Edit2, X, Save, FileText, CheckCircle, AlertTriangle, AlignLeft, ShieldCheck, Printer, Search, LayoutGrid, Table2, Star, Award, Shield } from 'lucide-react';
import InputLabel from '@/Components/InputLabel';

export default function Types({ auth, types, stats }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [viewMode, setViewMode] = useState('cards');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        description: '',
        reward: '',
        points: 0,
        badge_icon: 'Star',
        badge_color: 'text-amber-500',
        is_active: true,
    });

    const openModal = (type = null) => {
        setEditingType(type);
        if (type) {
            setData({
                name: type.name,
                description: type.description || '',
                reward: type.reward || '',
                points: type.points || 0,
                badge_icon: type.badge_icon || 'Star',
                badge_color: type.badge_color || 'text-amber-500',
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
            put(route('hr.achievement-types.update', editingType.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('hr.achievement-types.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDelete = (type) => {
        setEditingType(type);
        setIsDeleteModalOpen(true);
    };

    const deleteType = () => {
        destroy(route('hr.achievement-types.destroy', editingType.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const filteredTypes = useMemo(() => {
        return types.filter(t => {
            const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === '' || (statusFilter === 'active' && t.is_active) || (statusFilter === 'inactive' && !t.is_active);
            return matchesSearch && matchesStatus;
        });
    }, [types, searchQuery, statusFilter]);

    return (
        <AdminLayout user={auth.user} activeMenu="أنواع الإنجازات">
            <Head title="أنواع الإنجازات" />

            <div className="max-w-[1600px] mx-auto space-y-6">
                
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <ShieldCheck size={28} className="text-emerald-600" />
                                إدارة أنواع الإنجازات
                            </h1>
                            <p className="text-emerald-700/80 dark:text-emerald-300/80 mt-2 text-sm font-semibold">إدارة وتصنيف الإنجازات والمكافآت الخاصة بها</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 no-print">
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl hover:shadow-lg hover:shadow-emerald-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>إضافة نوع جديد</span>
                            </button>
                        </div>
                    </div>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-2">
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0 text-primary-500">
                                <FileText size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الأنواع</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white">{stats.total}</h4>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-500">
                                <CheckCircle size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الأنواع النشطة</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white">{stats.active}</h4>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-500">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الأنواع الموقوفة</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white">{stats.inactive}</h4>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-[#121820]/60 p-3 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto shrink-0">
                        {[ { value: '', label: 'الكل' }, { value: 'active', label: 'الأنواع النشطة' }, { value: 'inactive', label: 'الموقوفة' } ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${statusFilter === opt.value ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto shrink-0 flex-1 xl:flex-none justify-end">
                        <div className="relative w-full max-w-xs">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث باسم الإنجاز..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/40 border-none rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-white"
                            />
                        </div>
                        
                        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl shrink-0">
                            {[ { id: 'cards', icon: LayoutGrid }, { id: 'table', icon: Table2 } ].map(view => (
                                <button
                                    key={view.id}
                                    onClick={() => setViewMode(view.id)}
                                    className={`p-2 rounded-xl transition-all ${viewMode === view.id ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    <view.icon size={18} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="min-h-[400px]">
                    {filteredTypes.length === 0 ? (
                        <div className="bg-white dark:bg-[#121820]/60 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 py-24 text-center">
                            <p className="text-slate-500">لا توجد أنواع إنجازات تطابق بحثك.</p>
                        </div>
                    ) : (
                        <div className={viewMode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5' : 'hidden'}>
                            {filteredTypes.map(type => (
                                <div key={type.id} className="bg-white dark:bg-[#121820]/80 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 p-6 hover:-translate-y-1 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                                                <Star size={18} className={type.badge_color || 'text-amber-500'} />
                                                {type.name}
                                            </h3>
                                            <div className="flex gap-2 items-center mt-2">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${type.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {type.is_active ? 'نشط' : 'موقوف'}
                                                </span>
                                                {type.points > 0 && (
                                                    <span className="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-50 text-amber-600">
                                                        {type.points} نقطة
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button onClick={() => openModal(type)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 flex items-center justify-center">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => confirmDelete(type)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 flex items-center justify-center">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">{type.description || 'لا يوجد وصف'}</p>
                                    {type.reward && (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-xl text-sm font-bold">
                                            المكافأة: {type.reward}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className={viewMode === 'table' ? 'bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden' : 'hidden'}>
                        <table className="w-full text-right">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                                <tr>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">النوع</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الوصف</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">المكافأة / النقاط</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الحالة</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredTypes.map((type) => (
                                    <tr key={type.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Star size={16} className={type.badge_color || 'text-amber-500'} />
                                            {type.name}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{type.description || '-'}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-emerald-600 font-bold text-sm">{type.reward || '-'}</span>
                                                {type.points > 0 && <span className="text-amber-600 font-bold text-xs">{type.points} نقطة</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${type.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {type.is_active ? 'نشط' : 'موقوف'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openModal(type)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 flex items-center justify-center">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => confirmDelete(type)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 flex items-center justify-center">
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

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                        
                        <div className="relative p-6 sm:p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                                        <Star size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white tracking-tight">
                                            {editingType ? 'تعديل نوع الإنجاز' : 'إضافة نوع إنجاز جديد'}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">
                                            {editingType ? 'تحديث بيانات نوع الإنجاز المحدد' : 'أدخل تفاصيل نوع الإنجاز لإضافته للنظام'}
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
                            <form onSubmit={submit} className="space-y-6" id="achievementTypeForm">
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                    <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                        <Star size={16} className="text-primary-500" />
                                        اسم الإنجاز <span className="text-accent-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        placeholder="مثال: موظف الشهر، الإبداع..."
                                    />
                                    {errors.name && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.name}</p>}
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                    <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                        <FileText size={16} className="text-primary-500" />
                                        الوصف (اختياري)
                                    </label>
                                    <textarea
                                        className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows="2"
                                        placeholder="اكتب وصفاً مختصراً للإنجاز..."
                                    />
                                    {errors.description && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.description}</p>}
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                    <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                        <Star size={16} className="text-amber-500" />
                                        المكافأة (إن وجدت)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                        value={data.reward}
                                        onChange={(e) => setData('reward', e.target.value)}
                                        placeholder="مثال: شهادة شكر، مكافأة مالية..."
                                    />
                                    {errors.reward && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.reward}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                        <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                            <Award size={16} className="text-primary-500" />
                                            النقاط المكتسبة
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                            value={data.points}
                                            onChange={(e) => setData('points', e.target.value)}
                                        />
                                        {errors.points && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.points}</p>}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                        <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                            <Shield size={16} className="text-primary-500" />
                                            لون الشارة
                                        </label>
                                        <select
                                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                            value={data.badge_color}
                                            onChange={(e) => setData('badge_color', e.target.value)}
                                        >
                                            <option value="text-amber-500">ذهبي (Amber)</option>
                                            <option value="text-slate-400">فضي (Silver)</option>
                                            <option value="text-orange-400">برونزي (Bronze)</option>
                                            <option value="text-emerald-500">أخضر (Emerald)</option>
                                            <option value="text-blue-500">أزرق (Blue)</option>
                                            <option value="text-purple-500">بنفسجي (Purple)</option>
                                            <option value="text-rose-500">أحمر (Rose)</option>
                                        </select>
                                        {errors.badge_color && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.badge_color}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                                    <input 
                                        type="checkbox" 
                                        id="is_active" 
                                        className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700" 
                                        checked={data.is_active} 
                                        onChange={(e) => setData('is_active', e.target.checked)} 
                                    />
                                    <label htmlFor="is_active" className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                                        تفعيل هذا النوع (يمكن اختياره عند تسجيل الإنجازات)
                                    </label>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-3">
                            <button
                                type="submit"
                                form="achievementTypeForm"
                                disabled={processing}
                                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98]"
                            >
                                <Save size={20} />
                                {editingType ? 'حفظ التعديلات' : 'إضافة النوع'}
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
                                هل أنت متأكد من أنك تريد حذف نوع الإنجاز هذا؟ 
                                <br/>لا يمكن التراجع عن هذا الإجراء.
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
