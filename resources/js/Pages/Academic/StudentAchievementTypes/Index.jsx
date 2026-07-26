import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit2, Trash2, CheckCircle, X, Award, Medal, Star, Trophy, Target, Search, Layers, Briefcase, Activity } from 'lucide-react';

export default function StudentAchievementTypes({ achievementTypes = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('الكل');

    const { data, setData, post, put, delete: destroy, reset, processing, errors, clearErrors } = useForm({
        name: '',
        category: 'أكاديمي',
        description: '',
        default_points: 0,
        is_active: true,
    });

    const categories = ['الكل', 'أكاديمي', 'سلوكي', 'رياضي', 'ديني', 'أخرى'];

    const openModal = (type = null) => {
        clearErrors();
        if (type) {
            setEditingType(type);
            setData({
                name: type.name,
                category: type.category,
                description: type.description || '',
                default_points: type.default_points,
                is_active: type.is_active,
            });
        } else {
            setEditingType(null);
            reset();
            setData('is_active', true);
            setData('category', 'أكاديمي');
        }
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingType) {
            put(route('academic.achievement-types.update', editingType.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('academic.achievement-types.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const confirmDelete = (type) => {
        setEditingType(type);
        setIsDeleteModalOpen(true);
    };

    const deleteType = () => {
        destroy(route('academic.achievement-types.destroy', editingType.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const getCategoryStyles = (category) => {
        switch (category) {
            case 'أكاديمي': return { icon: <Target size={18} />, bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', gradient: 'from-blue-500 to-indigo-600' };
            case 'رياضي': return { icon: <Trophy size={18} />, bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', gradient: 'from-orange-500 to-amber-500' };
            case 'ديني': return { icon: <Star size={18} />, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', gradient: 'from-emerald-400 to-teal-500' };
            case 'سلوكي': return { icon: <Award size={18} />, bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', gradient: 'from-purple-500 to-fuchsia-500' };
            default: return { icon: <Layers size={18} />, bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', gradient: 'from-slate-400 to-slate-600' };
        }
    };

    const filteredTypes = useMemo(() => {
        return achievementTypes.filter(type => {
            const matchesSearch = type.name.toLowerCase().includes(searchQuery.toLowerCase()) || (type.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeTab === 'الكل' || type.category === activeTab;
            return matchesSearch && matchesCategory;
        });
    }, [achievementTypes, searchQuery, activeTab]);

    // Stats
    const totalPoints = achievementTypes.reduce((acc, curr) => acc + curr.default_points, 0);
    const topCategory = achievementTypes.length > 0 
        ? Object.entries(achievementTypes.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + 1;
            return acc;
        }, {})).sort((a,b) => b[1] - a[1])[0][0] 
        : 'لا يوجد';

    return (
        <AdminLayout>
            <Head title="كتالوج الإنجازات" />

            <div className="max-w-[1600px] mx-auto space-y-6">
                
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
                                <Briefcase size={28} className="text-primary-600" />
                                كتالوج الإنجازات المعتمدة
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                إدارة أنواع الإنجازات المتاحة للطلاب وتحديد قيمتها النقطية
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>إضافة إنجاز جديد</span>
                            </button>
                        </div>
                    </div>
                </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-[#121820] rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                        <Layers size={28} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الأنواع المعرفة</div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{achievementTypes.length}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#121820] rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
                        <Star size={28} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي النقاط المتاحة</div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{totalPoints}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#121820] rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
                        <Activity size={28} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الفئة الأكثر استخداماً</div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{topCategory}</div>
                    </div>
                </div>
            </div>

            {/* Interactive Tabs & Search */}
            <div className="bg-white dark:bg-[#121820] p-3 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-6 flex flex-col xl:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 hide-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                                activeTab === cat 
                                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative w-full xl:w-96">
                    <input
                        type="text"
                        placeholder="ابحث عن إنجاز..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-amber-200 dark:focus:border-amber-900/30 rounded-xl py-3 pr-11 pl-4 text-sm focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-medium"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
            </div>

            {/* Glassmorphic Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTypes.map((type, index) => {
                    const style = getCategoryStyles(type.category);
                    return (
                        <div key={type.id} className={`group relative bg-white dark:bg-[#121820] rounded-[2.5rem] border transition-all duration-300 ${!type.is_active ? 'border-slate-200 dark:border-slate-700 opacity-60 grayscale-[50%]' : 'border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 hover:-translate-y-1 overflow-hidden'}`} style={{animationDelay: `${index * 50}ms`}}>
                            
                            {/* Decorative Background Blur */}
                            <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${style.gradient} rounded-full opacity-10 group-hover:opacity-20 blur-2xl transition-opacity`}></div>

                            <div className="p-6 relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>
                                        {style.icon}
                                        {type.category}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(type)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-500/10 rounded-full transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => confirmDelete(type)} className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-500/10 rounded-full transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 leading-tight">{type.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 h-10 leading-relaxed">
                                    {type.description || 'لا يوجد وصف تفصيلي لهذا الإنجاز.'}
                                </p>
                                
                                <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">قيمة الإنجاز</span>
                                        <div className={`text-2xl font-black bg-gradient-to-r ${style.gradient} bg-clip-text text-transparent flex items-baseline gap-1`}>
                                            {type.default_points}
                                            <span className="text-xs text-slate-400 font-bold dark:text-slate-500">نقطة</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">الحالة</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2.5 h-2.5 rounded-full ${type.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                                            <span className={`text-xs font-bold ${type.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {type.is_active ? 'مفعل' : 'معطل'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredTypes.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-[#121820] rounded-[3rem] border border-slate-100 dark:border-slate-800">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="text-slate-300 dark:text-slate-600" size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2">لا توجد إنجازات تطابق بحثك</h3>
                    <p className="text-slate-500">جرب البحث بكلمة مختلفة أو في فئة أخرى.</p>
                </div>
            )}

            {/* Premium Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-auto transform transition-all">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <Briefcase size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        {editingType ? 'تعديل بيانات الإنجاز' : 'إضافة إنجاز جديد للكتالوج'}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">تعبئة نموذج الإنجاز وتحديد قيمته</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 rounded-2xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            <form id="typeForm" onSubmit={submit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم الإنجاز <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={data.name} 
                                            onChange={e => setData('name', e.target.value)} 
                                            required 
                                            placeholder="مثال: الفوز في مسابقة الرياضيات الكبرى"
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white outline-none" 
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                            <Trophy size={16} />
                                        </div>
                                    </div>
                                    {errors.name && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.name}</p>}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">التصنيف (الفئة) <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <select 
                                                value={data.category} 
                                                onChange={e => setData('category', e.target.value)} 
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
                                                <Layers size={16} />
                                            </div>
                                        </div>
                                        {errors.category && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.category}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">النقاط المستحقة <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                min="0" 
                                                value={data.default_points} 
                                                onChange={e => setData('default_points', e.target.value)} 
                                                required 
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-lg font-black focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white outline-none" 
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-primary-500">
                                                <Star size={18} className="fill-primary-100" />
                                            </div>
                                        </div>
                                        {errors.default_points && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.default_points}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الوصف التعريفي (اختياري)</label>
                                    <div className="relative">
                                        <textarea 
                                            value={data.description} 
                                            onChange={e => setData('description', e.target.value)} 
                                            rows="3" 
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white outline-none"
                                            placeholder="اكتب وصفاً موجزاً لمعايير هذا الإنجاز..."
                                        ></textarea>
                                        <div className="pointer-events-none absolute top-4 right-0 flex items-center pr-4 text-slate-400">
                                            <Target size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <input 
                                        type="checkbox" 
                                        id="is_active" 
                                        checked={data.is_active} 
                                        onChange={e => setData('is_active', e.target.checked)} 
                                        className="w-5 h-5 text-primary-600 bg-white border-slate-300 rounded focus:ring-primary-500"
                                    />
                                    <div className="mr-3">
                                        <label htmlFor="is_active" className="text-sm font-bold text-slate-800 dark:text-white cursor-pointer select-none">
                                            حالة الإنجاز (مفعل)
                                        </label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                                            إذا تم تعطيله، لن يتمكن المعلمون من اختياره للطلاب الجدد.
                                        </p>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3.5 font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-colors">إلغاء</button>
                            <button type="submit" form="typeForm" disabled={processing} className="px-8 py-3.5 font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl shadow-lg shadow-primary-500/25 transition-transform active:scale-95">
                                {editingType ? 'حفظ التعديلات' : 'اعتماد الإنجاز'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 font-semibold">
                            هل أنت متأكد من حذف هذا الإنجاز من الكتالوج؟
                            <br/>
                            <span className="text-xs text-rose-500 mt-2 block">تحذير: لا ينصح بحذف إنجاز تم استخدامه سابقاً لطلاب آخرين، بل يفضل تعطيله.</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 transition-colors">تراجع</button>
                            <button onClick={deleteType} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/25 hover:bg-rose-600 transition-colors">نعم، احذف</button>
                        </div>
                    </div>
                </div>
            )}
            
            </div>
        </AdminLayout>
    );
}
