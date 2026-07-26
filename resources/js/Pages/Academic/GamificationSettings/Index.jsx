import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit2, Trash2, CheckCircle, X, Award, Medal, Star, Trophy, Target, Heart, Brain, Zap, Settings, Shield } from 'lucide-react';

export default function GamificationSettings({ tiers = [], badges = [] }) {
    const [activeTab, setActiveTab] = useState('tiers'); // 'tiers' or 'badges'
    
    // Tiers Form
    const [isTierModalOpen, setIsTierModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState(null);
    const tierForm = useForm({
        name: '',
        min_points: 0,
        icon: 'Award',
        color_class: 'bg-slate-100 text-slate-700 border-slate-300',
    });

    // Badges Form
    const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);
    const badgeForm = useForm({
        name: '',
        description: '',
        category_target: 'أكاديمي',
        required_count: 1,
        icon: 'Star',
        color_class: 'bg-blue-50 text-blue-500 border-blue-200',
    });

    // Delete Modals
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { type: 'tier'|'badge', id: 1 }

    const availableIcons = [
        { name: 'Award', comp: <Award size={18} /> },
        { name: 'Medal', comp: <Medal size={18} /> },
        { name: 'Star', comp: <Star size={18} /> },
        { name: 'Trophy', comp: <Trophy size={18} /> },
        { name: 'Target', comp: <Target size={18} /> },
        { name: 'Heart', comp: <Heart size={18} /> },
        { name: 'Brain', comp: <Brain size={18} /> },
        { name: 'Zap', comp: <Zap size={18} /> },
        { name: 'Shield', comp: <Shield size={18} /> },
    ];

    const availableTierColors = [
        { name: 'ألماسي (سماوي)', value: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
        { name: 'ذهبي (أصفر/برتقالي)', value: 'bg-amber-50 text-amber-600 border-amber-200' },
        { name: 'فضي (رمادي)', value: 'bg-slate-100 text-slate-700 border-slate-300' },
        { name: 'برونزي (برتقالي داكن)', value: 'bg-orange-50 text-orange-700 border-orange-200' },
        { name: 'أخضر (زمردي)', value: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
        { name: 'بنفسجي (ملكي)', value: 'bg-purple-50 text-purple-600 border-purple-200' },
    ];

    const availableBadgeColors = [
        { name: 'أزرق', value: 'bg-blue-50 text-blue-500 border-blue-200' },
        { name: 'أخضر', value: 'bg-emerald-50 text-emerald-500 border-emerald-200' },
        { name: 'برتقالي', value: 'bg-orange-50 text-orange-500 border-orange-200' },
        { name: 'أصفر', value: 'bg-amber-50 text-amber-500 border-amber-200' },
        { name: 'بنفسجي', value: 'bg-purple-50 text-purple-500 border-purple-200' },
        { name: 'أحمر/وردي', value: 'bg-rose-50 text-rose-500 border-rose-200' },
    ];

    const getIconComp = (iconName) => {
        const found = availableIcons.find(i => i.name === iconName);
        return found ? found.comp : <Award size={18} />;
    };

    // Tier Handlers
    const openTierModal = (tier = null) => {
        tierForm.clearErrors();
        if (tier) {
            setEditingTier(tier);
            tierForm.setData({
                name: tier.name,
                min_points: tier.min_points,
                icon: tier.icon,
                color_class: tier.color_class,
            });
        } else {
            setEditingTier(null);
            tierForm.reset();
        }
        setIsTierModalOpen(true);
    };

    const submitTier = (e) => {
        e.preventDefault();
        if (editingTier) {
            tierForm.put(route('academic.gamification.tiers.update', editingTier.id), {
                onSuccess: () => setIsTierModalOpen(false),
            });
        } else {
            tierForm.post(route('academic.gamification.tiers.store'), {
                onSuccess: () => setIsTierModalOpen(false),
            });
        }
    };

    // Badge Handlers
    const openBadgeModal = (badge = null) => {
        badgeForm.clearErrors();
        if (badge) {
            setEditingBadge(badge);
            badgeForm.setData({
                name: badge.name,
                description: badge.description || '',
                category_target: badge.category_target,
                required_count: badge.required_count,
                icon: badge.icon,
                color_class: badge.color_class,
            });
        } else {
            setEditingBadge(null);
            badgeForm.reset();
        }
        setIsBadgeModalOpen(true);
    };

    const submitBadge = (e) => {
        e.preventDefault();
        if (editingBadge) {
            badgeForm.put(route('academic.gamification.badges.update', editingBadge.id), {
                onSuccess: () => setIsBadgeModalOpen(false),
            });
        } else {
            badgeForm.post(route('academic.gamification.badges.store'), {
                onSuccess: () => setIsBadgeModalOpen(false),
            });
        }
    };

    // Delete Handlers
    const confirmDelete = (type, id) => {
        setItemToDelete({ type, id });
        setIsDeleteModalOpen(true);
    };

    const executeDelete = () => {
        if (!itemToDelete) return;
        
        if (itemToDelete.type === 'tier') {
            tierForm.delete(route('academic.gamification.tiers.destroy', itemToDelete.id), {
                onSuccess: () => setIsDeleteModalOpen(false),
            });
        } else {
            badgeForm.delete(route('academic.gamification.badges.destroy', itemToDelete.id), {
                onSuccess: () => setIsDeleteModalOpen(false),
            });
        }
    };

    return (
        <AdminLayout>
            <Head title="إعدادات التلعيب والشارات" />

            {/* Premium Header */}
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
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            <Settings size={28} className="text-primary-600" />
                            إعدادات التلعيب والشارات (Gamification)
                        </h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                            تحكم في المستويات الديناميكية وشروط منح الشارات التلقائية للطلاب.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('tiers')}
                    className={`pb-4 px-4 font-bold text-lg border-b-2 transition-colors ${
                        activeTab === 'tiers' 
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Trophy className="inline-block mr-2" size={20} />
                    المستويات (Tiers)
                </button>
                <button
                    onClick={() => setActiveTab('badges')}
                    className={`pb-4 px-4 font-bold text-lg border-b-2 transition-colors ${
                        activeTab === 'badges' 
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Award className="inline-block mr-2" size={20} />
                    الشارات التخصصية (Badges)
                </button>
            </div>

            {/* Tiers Tab */}
            {activeTab === 'tiers' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button
                            onClick={() => openTierModal()}
                            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary-500/30 transition-transform hover:scale-105"
                        >
                            <Plus size={20} /> إضافة مستوى جديد
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {tiers.map(tier => (
                            <div key={tier.id} className="bg-white dark:bg-[#121820] rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center relative group">
                                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => openTierModal(tier)} className="p-2 bg-slate-100 hover:bg-primary-50 text-slate-400 hover:text-primary-500 rounded-full transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => confirmDelete('tier', tier.id)} className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 mb-4 ${tier.color_class}`}>
                                    {React.cloneElement(getIconComp(tier.icon), { size: 36 })}
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{tier.name}</h3>
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-sm w-full">
                                    أعلى من <span className="text-lg text-primary-600 mx-1">{tier.min_points}</span> نقطة
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Badges Tab */}
            {activeTab === 'badges' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button
                            onClick={() => openBadgeModal()}
                            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary-500/30 transition-transform hover:scale-105"
                        >
                            <Plus size={20} /> ابتكار شارة جديدة
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {badges.map(badge => (
                            <div key={badge.id} className="bg-white dark:bg-[#121820] rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all flex gap-4 relative group">
                                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                    <button onClick={() => openBadgeModal(badge)} className="p-2 bg-slate-100 hover:bg-primary-50 text-slate-400 hover:text-primary-500 rounded-full transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => confirmDelete('badge', badge.id)} className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center border shadow-inner ${badge.color_class}`}>
                                    {React.cloneElement(getIconComp(badge.icon), { size: 32 })}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">{badge.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                                        {badge.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg inline-flex">
                                        <Target size={14} className="text-primary-500" />
                                        تحقيق {badge.required_count} إنجاز ({badge.category_target})
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Premium Tier Modal */}
            {isTierModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-auto transform transition-all">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <Trophy size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        {editingTier ? 'تعديل المستوى' : 'إضافة مستوى جديد'}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">تحديد الحد الأدنى للنقاط وشكل المستوى</p>
                                </div>
                            </div>
                            <button onClick={() => setIsTierModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 rounded-2xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[70vh]">
                            <form id="tierForm" onSubmit={submitTier} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم المستوى <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={tierForm.data.name} 
                                                onChange={e => tierForm.setData('name', e.target.value)} 
                                                required 
                                                placeholder="مثال: المستوى الماسي"
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white outline-none" 
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                                <Trophy size={16} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الحد الأدنى للنقاط (Min Points) <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                min="0" 
                                                value={tierForm.data.min_points} 
                                                onChange={e => tierForm.setData('min_points', e.target.value)} 
                                                required 
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-lg font-black focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white outline-none" 
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-primary-500">
                                                <Star size={18} className="fill-primary-100" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">أيقونة المستوى</label>
                                    <div className="flex gap-3 flex-wrap">
                                        {availableIcons.map(icon => (
                                            <button 
                                                type="button" 
                                                key={icon.name} 
                                                onClick={() => tierForm.setData('icon', icon.name)} 
                                                className={`p-4 rounded-2xl border transition-all ${tierForm.data.icon === icon.name ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400 shadow-md ring-2 ring-primary-500/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                            >
                                                {icon.comp}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">اللون (Theme)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        {availableTierColors.map(color => (
                                            <button 
                                                type="button" 
                                                key={color.value} 
                                                onClick={() => tierForm.setData('color_class', color.value)} 
                                                className={`p-4 rounded-2xl border text-sm font-bold text-right flex items-center justify-between transition-all ${tierForm.data.color_class === color.value ? 'border-primary-500 shadow-md ring-2 ring-primary-500/20 scale-105' : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'} ${color.value}`}
                                            >
                                                <span>{color.name}</span>
                                                {tierForm.data.color_class === color.value && <CheckCircle size={18} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                            <button type="button" onClick={() => setIsTierModalOpen(false)} className="px-6 py-3.5 font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-colors">إلغاء</button>
                            <button type="submit" form="tierForm" disabled={tierForm.processing} className="px-8 py-3.5 font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl shadow-lg shadow-primary-500/25 transition-transform active:scale-95">
                                {editingTier ? 'حفظ التعديلات' : 'اعتماد المستوى'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Badge Modal */}
            {isBadgeModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-auto transform transition-all">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        {editingBadge ? 'تعديل بيانات الشارة' : 'ابتكار شارة تخصصية جديدة'}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">تحديد شروط المنح التلقائي واسم الشارة</p>
                                </div>
                            </div>
                            <button onClick={() => setIsBadgeModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 rounded-2xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[70vh]">
                            <form id="badgeForm" onSubmit={submitBadge} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم الشارة <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={badgeForm.data.name} 
                                            onChange={e => badgeForm.setData('name', e.target.value)} 
                                            required 
                                            placeholder="مثال: القائد، العبقري، الموهوب..." 
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white outline-none" 
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                            <Award size={16} />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تستهدف فئة إنجاز <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <select 
                                                value={badgeForm.data.category_target} 
                                                onChange={e => badgeForm.setData('category_target', e.target.value)} 
                                                required 
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white outline-none appearance-none"
                                            >
                                                <option value="أكاديمي">أكاديمي</option>
                                                <option value="رياضي">رياضي</option>
                                                <option value="ديني">ديني</option>
                                                <option value="سلوكي">سلوكي</option>
                                                <option value="أخرى">أخرى</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                                <Target size={16} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">العدد المطلوب للحصول عليها <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={badgeForm.data.required_count} 
                                                onChange={e => badgeForm.setData('required_count', e.target.value)} 
                                                required 
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-lg font-black focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white outline-none" 
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-primary-500">
                                                <Star size={18} className="fill-primary-100" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الوصف التعريفي (اختياري)</label>
                                    <div className="relative">
                                        <textarea 
                                            value={badgeForm.data.description} 
                                            onChange={e => badgeForm.setData('description', e.target.value)} 
                                            rows="2" 
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white outline-none"
                                            placeholder="يظهر هذا الوصف عند تمرير الماوس فوق الشارة..."
                                        ></textarea>
                                        <div className="pointer-events-none absolute top-4 right-0 flex items-center pr-4 text-slate-400">
                                            <Shield size={16} />
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">أيقونة الشارة</label>
                                    <div className="flex gap-3 flex-wrap">
                                        {availableIcons.map(icon => (
                                            <button 
                                                type="button" 
                                                key={icon.name} 
                                                onClick={() => badgeForm.setData('icon', icon.name)} 
                                                className={`p-4 rounded-2xl border transition-all ${badgeForm.data.icon === icon.name ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400 shadow-md ring-2 ring-primary-500/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                            >
                                                {icon.comp}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">لون الشارة</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {availableBadgeColors.map(color => (
                                            <button 
                                                type="button" 
                                                key={color.value} 
                                                onClick={() => badgeForm.setData('color_class', color.value)} 
                                                className={`p-3 rounded-2xl border text-sm font-bold text-center flex flex-col items-center gap-2 transition-all ${badgeForm.data.color_class === color.value ? 'border-primary-500 shadow-md ring-2 ring-primary-500/20 scale-105' : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'} ${color.value}`}
                                            >
                                                <span>{color.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                            <button type="button" onClick={() => setIsBadgeModalOpen(false)} className="px-6 py-3.5 font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-colors">إلغاء</button>
                            <button type="submit" form="badgeForm" disabled={badgeForm.processing} className="px-8 py-3.5 font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl shadow-lg shadow-primary-500/25 transition-transform active:scale-95">
                                {editingBadge ? 'حفظ التعديلات' : 'اعتماد الشارة'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800 my-auto transform transition-all">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 font-semibold text-sm">
                            هل أنت متأكد من حذف هذا العنصر؟ لن يظهر للطلاب بعد الآن وسيفقدون هذا التقدم.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">تراجع</button>
                            <button onClick={executeDelete} className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/25 transition-transform active:scale-95">نعم، احذف</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
