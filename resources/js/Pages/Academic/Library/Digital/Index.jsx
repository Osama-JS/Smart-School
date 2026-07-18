import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import SelectInput from '@/Components/SelectInput';
import { 
    Search, Plus, FileText, Download, Trash2, Filter, X, 
    BookOpen, Layers, Sparkles, FolderOpen, ChevronDown, 
    RotateCcw, Activity, FileCheck2, LayoutGrid, Table2, User, Clock, Eye,
    Video, Presentation, MousePointerClick, Headphones, Image as ImageIcon, Users, MonitorPlay, BarChart3,
    Bookmark, Star, StarHalf
} from 'lucide-react';

function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose} 
            />
            <div className={`relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full ${maxWidth} z-10 overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all duration-300 scale-100 opacity-100`}>
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-500" />
                {title && (
                    <div className="flex items-center justify-between p-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary-500" />
                            {title}
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
                <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export default function DigitalLibraryIndex({ items, grades, subjects, filters }) {
    const { auth } = usePage().props;
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);
    
    const [filterGrade, setFilterGrade] = useState(filters?.grade_id || 'all');
    const [filterSubject, setFilterSubject] = useState(filters?.subject_id || 'all');
    const [filterType, setFilterType] = useState(filters?.item_type || 'all');
    const [filterCategory, setFilterCategory] = useState(filters?.category || 'all');
    const [searchValue, setSearchValue] = useState(filters?.search || '');
    const [showFilters, setShowFilters] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        grade_id: '',
        subject_id: '',
        file: null,
        external_url: '',
        item_type: 'pdf',
        category: '',
        target_audience: 'students',
        thumbnail: null,
    });

    const hasActiveFilters = filterGrade !== 'all' || filterSubject !== 'all' || filterType !== 'all' || filterCategory !== 'all' || searchValue !== '';

    const applyFilters = (overrides = {}) => {
        router.get(route('academic.library.digital.index'), {
            search: overrides.search !== undefined ? overrides.search : searchValue,
            grade_id: overrides.grade_id !== undefined ? overrides.grade_id : filterGrade === 'all' ? '' : filterGrade,
            subject_id: overrides.subject_id !== undefined ? overrides.subject_id : filterSubject === 'all' ? '' : filterSubject,
            item_type: overrides.item_type !== undefined ? overrides.item_type : filterType === 'all' ? '' : filterType,
            category: overrides.category !== undefined ? overrides.category : filterCategory === 'all' ? '' : filterCategory,
        }, { preserveState: true, replace: true });
    };

    const resetAllFilters = () => {
        setSearchValue('');
        setFilterGrade('all');
        setFilterSubject('all');
        setFilterType('all');
        setFilterCategory('all');
        router.get(route('academic.library.digital.index'), {}, { preserveState: true, replace: true });
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFilters();
        }
    };

    const submitAdd = (e) => {
        e.preventDefault();
        post(route('academic.library.digital.store'), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
            },
        });
    };

    const handleDelete = (item) => {
        setDeleteItem(item);
    };

    const confirmDelete = () => {
        if (!deleteItem) return;
        setIsDeleting(true);
        router.delete(route('academic.library.digital.destroy', deleteItem.id), { 
            preserveScroll: true,
            onSuccess: () => setDeleteItem(null),
            onFinish: () => setIsDeleting(false)
        });
    };

    const itemsData = items?.data || [];
    const totalItems = items?.total || itemsData.length;

    const getItemIcon = (type) => {
        switch (type) {
            case 'video': return <MonitorPlay size={24} strokeWidth={2} className="text-rose-500" />;
            case 'audio': return <Headphones size={24} strokeWidth={2} className="text-purple-500" />;
            case 'presentation': return <Presentation size={24} strokeWidth={2} className="text-amber-500" />;
            case 'interactive': return <MousePointerClick size={24} strokeWidth={2} className="text-emerald-500" />;
            case 'pdf':
            default: return <FileText size={24} strokeWidth={2} className="text-primary-500" />;
        }
    };
    
    const getEmbedUrl = (url) => {
        if (!url) return null;
        try {
            if (url.includes('youtube.com/watch?v=')) {
                return url.replace('watch?v=', 'embed/').split('&')[0];
            }
            if (url.includes('youtu.be/')) {
                return url.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
            }
        } catch(e) {}
        return url;
    };

    const getCategoryLabel = (cat) => {
        switch(cat) {
            case 'review': return 'مراجعة نهائية';
            case 'worksheet': return 'ورقة عمل';
            case 'explanation': return 'شرح وملخص';
            case 'enrichment': return 'إثراء';
            default: return 'عام';
        }
    };
    
    const handleBookmark = (item) => {
        router.post(route('digital.bookmark', item.id), {}, { preserveScroll: true });
    };

    const handleRate = (item, rating) => {
        router.post(route('digital.rating', item.id), { rating }, { preserveScroll: true });
    };

    return (
        <AdminLayout activeMenu="المكتبة الرقمية">
            <Head title="المكتبة الرقمية" />

            <div className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative">
                
                {/* Header Section with Brand Colors and Geometric Accent */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none">
                    {/* Brand Line Accent */}
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
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">المكتبة الرقمية</h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                إدارة موارد التعلم والملفات التعليمية والمراجع الرقمية
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} /> 
                                <span>رفع مورد جديد</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Premium Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { title: 'إجمالي الموارد', value: totalItems, icon: FolderOpen, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10', glow: 'bg-primary-500/5 dark:bg-primary-500/10', grad: 'from-primary-400 to-primary-600' },
                        { title: 'مواد دراسية مغطاة', value: subjects?.length || 0, icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', glow: 'bg-emerald-500/5 dark:bg-emerald-500/10', grad: 'from-emerald-400 to-emerald-600' },
                        { title: 'الصفوف المدعومة', value: grades?.length || 0, icon: Layers, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', glow: 'bg-amber-500/5 dark:bg-amber-500/10', grad: 'from-amber-400 to-amber-600' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#121820]/40 backdrop-blur-xl border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group cursor-default">
                            <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${stat.grad} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glow} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                            
                            <div className="relative z-10 min-w-0">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">{stat.title}</p>
                                <h3 className="text-2xl font-black text-dark-900 dark:text-white leading-none font-mono tracking-tight">{stat.value}</h3>
                            </div>
                            <div className={`relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}>
                                <stat.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modern Filter Section */}
                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-4 sm:p-6 mb-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-xl group">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                <Search size={22} strokeWidth={2.5} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="ابحث بعنوان المورد التعلمي..."
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pr-14 py-4 text-base focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                value={searchValue} 
                                onChange={e => setSearchValue(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold transition-all border shadow-sm ${
                                    showFilters || hasActiveFilters
                                        ? 'bg-primary-600 text-white border-primary-600 shadow-primary-600/30 dark:bg-primary-500 dark:border-primary-500'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md'
                                }`}
                            >
                                <Filter size={20} />
                                <span>تصفية متقدمة</span>
                                <ChevronDown size={18} className={`transform transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                            </button>

                            {hasActiveFilters && (
                                <button 
                                    onClick={resetAllFilters}
                                    className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-100 dark:border-rose-500/10"
                                >
                                    <RotateCcw size={18} />
                                    <span className="hidden sm:inline">إعادة تعيين</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Expanded Filters */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? 'mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 opacity-100 max-h-[500px]' : 'max-h-0 opacity-0 m-0 p-0 border-none'}`}>
                        {/* Grade Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">تصفية حسب الصف</label>
                            <SelectInput 
                                value={filterGrade} 
                                onChange={val => { setFilterGrade(val); applyFilters({ grade_id: val }); }}
                                options={[
                                    { value: 'all', label: 'كل الصفوف الدراسية' },
                                    ...(grades?.map(g => ({ value: g.id, label: g.name })) || [])
                                ]}
                            />
                        </div>

                        {/* Subject Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">تصفية حسب المادة</label>
                            <SelectInput 
                                value={filterSubject} 
                                onChange={val => { setFilterSubject(val); applyFilters({ subject_id: val }); }}
                                options={[
                                    { value: 'all', label: 'كل المواد الدراسية' },
                                    ...(subjects?.map(s => ({ value: s.id, label: s.name })) || [])
                                ]}
                            />
                        </div>
                        
                        {/* Type Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">نوع المحتوى</label>
                            <SelectInput 
                                value={filterType} 
                                onChange={val => { setFilterType(val); applyFilters({ item_type: val }); }}
                                options={[
                                    { value: 'all', label: 'الكل' },
                                    { value: 'pdf', label: 'ملف PDF / ملزمة' },
                                    { value: 'video', label: 'فيديو شرح' },
                                    { value: 'presentation', label: 'عرض تقديمي' },
                                    { value: 'interactive', label: 'تفاعلي' },
                                    { value: 'audio', label: 'صوتي' },
                                ]}
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">التصنيف</label>
                            <SelectInput 
                                value={filterCategory} 
                                onChange={val => { setFilterCategory(val); applyFilters({ category: val }); }}
                                options={[
                                    { value: 'all', label: 'الكل' },
                                    { value: 'review', label: 'مراجعات نهائية' },
                                    { value: 'worksheet', label: 'أوراق عمل' },
                                    { value: 'explanation', label: 'شروحات وملخصات' },
                                    { value: 'enrichment', label: 'إثراء إضافي' },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center justify-end gap-2 mb-6">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                            viewMode === 'cards'
                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-500/30'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <LayoutGrid size={16} />
                        <span>بطاقات</span>
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                            viewMode === 'table'
                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-500/30'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Table2 size={16} />
                        <span>جدول</span>
                    </button>
                </div>

                {/* Content */}
                {itemsData.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                            <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">لا توجد موارد رقمية</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed font-medium">
                            لم يتم العثور على أي ملفات أو موارد تعليمية تناسب بحثك.
                        </p>
                        {hasActiveFilters ? (
                            <button onClick={resetAllFilters} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                إزالة التصفية
                            </button>
                        ) : (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20">
                                إضافة المورد الأول
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === 'cards' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {itemsData.map(item => (
                                    <div key={item.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                                        
                                        {/* Thumbnail (Optional) */}
                                        {item.thumbnail_url && (
                                            <div className="w-full h-40 rounded-2xl mb-4 overflow-hidden relative">
                                                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                                                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-sm">
                                                    {getCategoryLabel(item.category)}
                                                </div>
                                            </div>
                                        )}

                                        <div className={`flex justify-between items-start mb-4 relative z-10 ${item.thumbnail_url ? 'mt-0' : ''}`}>
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 shadow-sm">
                                                {getItemIcon(item.item_type)}
                                            </div>
                                            <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-slate-100 dark:border-slate-800">
                                                <button 
                                                    onClick={() => handleBookmark(item)}
                                                    className={`p-2 rounded-lg transition-colors ${item.is_bookmarked_by_user ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`}
                                                    title={item.is_bookmarked_by_user ? "إزالة من المفضلة" : "أضف للمفضلة"}
                                                >
                                                    <Bookmark size={16} fill={item.is_bookmarked_by_user ? "currentColor" : "none"} />
                                                </button>
                                                {auth?.user?.role?.name !== 'معلم' && (
                                                    <button 
                                                        onClick={() => handleDelete(item)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                        title="حذف"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {!item.thumbnail_url && item.category && (
                                            <div className="mb-3 relative z-10">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200/50 dark:border-slate-700/50">
                                                    {getCategoryLabel(item.category)}
                                                </span>
                                            </div>
                                        )}

                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 leading-tight relative z-10 line-clamp-2">
                                            {item.title}
                                        </h3>

                                        <div className="space-y-3 flex-1 mb-6 relative z-10 mt-2">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                <Layers size={16} className="text-slate-400" />
                                                <span className="truncate">{item.grade?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                <BookOpen size={16} className="text-slate-400" />
                                                <span className="truncate">{item.subject?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                                                <User size={14} />
                                                <span className="truncate text-xs">{item.uploader?.name}</span>
                                                <span className="mx-1 text-slate-300">•</span>
                                                <Clock size={14} />
                                                <span className="text-xs" dir="ltr">{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium pt-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5" title="المشاهدات"><Eye size={14} /> {item.views_count}</div>
                                                    <div className="flex items-center gap-1.5" title="التحميلات"><Download size={14} /> {item.downloads_count}</div>
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-500" title="التقييم">
                                                    <span className="font-bold">{item.average_rating || '0.0'}</span>
                                                    <Star size={14} fill="currentColor" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative z-10 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                            {item.file_path && (item.item_type === 'video' || item.item_type === 'audio' || item.file_path.toLowerCase().endsWith('.pdf')) && (
                                                <button 
                                                    onClick={() => setPreviewItem(item)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 font-bold transition-colors border border-primary-100 dark:border-primary-500/20 shadow-sm"
                                                >
                                                    {(item.item_type === 'video') ? <MonitorPlay size={18} /> : (item.item_type === 'audio' ? <Headphones size={18} /> : <Eye size={18} />)}
                                                    عرض
                                                </button>
                                            )}
                                            <a 
                                                href={`/storage/${item.file_path}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                download
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition-colors border border-slate-200 dark:border-slate-700"
                                            >
                                                <Download size={18} />
                                                تحميل
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400">العنوان</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400">الصف والمادة</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400">بواسطة</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400">تاريخ الإضافة</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400 text-left">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {itemsData.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                                                                {React.cloneElement(getItemIcon(item.item_type), { size: 20 })}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 dark:text-white">{item.title}</span>
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{getCategoryLabel(item.category)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5 items-start">
                                                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">{item.grade?.name}</span>
                                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">{item.subject?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                            <User size={16} className="text-slate-400" /> {item.uploader?.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400" dir="ltr">
                                                            <Clock size={16} className="text-slate-400" /> {new Date(item.created_at).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-left">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg">
                                                                <span className="font-bold text-sm">{item.average_rating || '0.0'}</span>
                                                                <Star size={14} fill="currentColor" />
                                                            </div>
                                                            <button 
                                                                onClick={() => handleBookmark(item)}
                                                                className={`p-2 rounded-xl transition-all shadow-sm ${item.is_bookmarked_by_user ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`}
                                                                title={item.is_bookmarked_by_user ? "إزالة من المفضلة" : "أضف للمفضلة"}
                                                            >
                                                                <Bookmark size={18} fill={item.is_bookmarked_by_user ? "currentColor" : "none"} />
                                                            </button>
                                                            {item.file_path && (item.item_type === 'video' || item.item_type === 'audio' || item.file_path.toLowerCase().endsWith('.pdf')) && (
                                                                <button 
                                                                    onClick={() => setPreviewItem(item)}
                                                                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all shadow-sm"
                                                                    title="عرض المحتوى"
                                                                >
                                                                    {(item.item_type === 'video') ? <MonitorPlay size={18} /> : (item.item_type === 'audio' ? <Headphones size={18} /> : <Eye size={18} />)}
                                                                </button>
                                                            )}
                                                            <a 
                                                                href={item.file_url} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                download
                                                                className="p-2 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-all"
                                                                title="تحميل"
                                                            >
                                                                <Download size={18} />
                                                            </a>
                                                            {auth?.user?.role?.name !== 'معلم' && (
                                                                <button 
                                                                    onClick={() => handleDelete(item)}
                                                                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                                                                    title="حذف"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        {items?.links && (
                            <div className="mt-6 flex justify-center">
                                <Pagination links={items.links} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal for Add */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="رفع مورد تعليمي جديد">
                <form onSubmit={submitAdd} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان المورد</label>
                        <input 
                            type="text"
                            className={`w-full bg-slate-50 dark:bg-slate-950/50 border ${errors.title ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all`}
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            placeholder="مثال: ملزمة الرياضيات الفصل الأول"
                            required
                        />
                        {errors.title && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.title}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الصف الدراسي</label>
                            <SelectInput 
                                value={data.grade_id} 
                                onChange={val => setData('grade_id', val)}
                                options={[
                                    { value: '', label: 'اختر الصف...' },
                                    ...(grades?.map(g => ({ value: g.id.toString(), label: g.name })) || [])
                                ]}
                            />
                            {errors.grade_id && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.grade_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المادة الدراسية</label>
                            <SelectInput 
                                value={data.subject_id} 
                                onChange={val => setData('subject_id', val)}
                                options={[
                                    { value: '', label: 'اختر المادة...' },
                                    ...(subjects?.map(s => ({ value: s.id.toString(), label: s.name })) || [])
                                ]}
                            />
                            {errors.subject_id && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.subject_id}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع المحتوى</label>
                            <SelectInput 
                                value={data.item_type} 
                                onChange={val => setData('item_type', val)}
                                options={[
                                    { value: 'pdf', label: 'ملف PDF / ملزمة' },
                                    { value: 'video', label: 'فيديو شرح' },
                                    { value: 'presentation', label: 'عرض تقديمي' },
                                    { value: 'interactive', label: 'تفاعلي' },
                                    { value: 'audio', label: 'صوتي' },
                                ]}
                            />
                            {errors.item_type && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.item_type}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">التصنيف</label>
                            <SelectInput 
                                value={data.category} 
                                onChange={val => setData('category', val)}
                                options={[
                                    { value: '', label: 'اختر التصنيف...' },
                                    { value: 'review', label: 'مراجعة نهائية' },
                                    { value: 'worksheet', label: 'ورقة عمل' },
                                    { value: 'explanation', label: 'شرح وملخص' },
                                    { value: 'enrichment', label: 'إثراء' },
                                ]}
                            />
                            {errors.category && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.category}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الجمهور المستهدف</label>
                            <SelectInput 
                                value={data.target_audience} 
                                onChange={val => setData('target_audience', val)}
                                options={[
                                    { value: 'students', label: 'الطلاب' },
                                    { value: 'teachers', label: 'المعلمين' },
                                    { value: 'parents', label: 'أولياء الأمور' },
                                ]}
                            />
                            {errors.target_audience && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.target_audience}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رابط خارجي (يوتيوب وغيرها) - اختياري</label>
                            <input 
                                type="url"
                                className={`w-full bg-slate-50 dark:bg-slate-950/50 border ${errors.external_url ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all`}
                                value={data.external_url}
                                onChange={e => setData('external_url', e.target.value)}
                                placeholder="مثال: https://www.youtube.com/watch?v=..."
                            />
                            {errors.external_url && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.external_url}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الملف المرفق (إذا لم يتم توفير رابط)</label>
                            <div className={`flex justify-center px-6 pt-3 pb-4 border-2 border-dashed rounded-2xl hover:border-primary-400 transition-colors bg-slate-50 dark:bg-slate-800/50 ${errors.file ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'}`}>
                                <div className="space-y-2 text-center">
                                    <div className="mx-auto w-10 h-10 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <FileCheck2 className="h-5 w-5 text-primary-500" />
                                    </div>
                                    <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center font-medium">
                                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                                            <span>اختر ملفاً</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={e => setData('file', e.target.files[0])} />
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold">PDF, MP4, MP3 (حتى 20 ميجا)</p>
                                    {data.file && (
                                        <div className="mt-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-500/20 inline-block truncate max-w-full">
                                            {data.file.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {errors.file && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.file}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الصورة المصغرة (اختياري)</label>
                            <div className={`flex justify-center px-6 pt-6 pb-8 border-2 border-dashed rounded-2xl hover:border-primary-400 transition-colors bg-slate-50 dark:bg-slate-800/50 ${errors.thumbnail ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'}`}>
                                <div className="space-y-3 text-center">
                                    <div className="mx-auto w-14 h-14 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <ImageIcon className="h-7 w-7 text-primary-500" />
                                    </div>
                                    <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center font-medium">
                                        <label htmlFor="thumbnail-upload" className="relative cursor-pointer rounded-md font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                                            <span>اختر صورة</span>
                                            <input id="thumbnail-upload" name="thumbnail-upload" type="file" accept="image/*" className="sr-only" onChange={e => setData('thumbnail', e.target.files[0])} />
                                        </label>
                                        <p className="pr-2">أو اسحبها هنا</p>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold">JPG, PNG (حتى 2 ميجا)</p>
                                    {data.thumbnail && (
                                        <div className="mt-4 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold border border-emerald-100 dark:border-emerald-500/20 inline-block truncate max-w-full">
                                            {data.thumbnail.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {errors.thumbnail && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.thumbnail}</p>}
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsAddModalOpen(false)} 
                            className="px-6 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                            إلغاء
                        </button>
                        <button 
                            type="submit" 
                            disabled={processing} 
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all disabled:opacity-70"
                        >
                            <FileText size={18} />
                            اعتماد الرفع
                        </button>
                    </div>
                </form>
            </Modal>

            {/* PDF Viewer Modal */}
            {previewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
                    <div 
                        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity" 
                        onClick={() => setPreviewItem(null)} 
                    />
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full h-[90vh] max-w-6xl z-10 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transform transition-all">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none mb-1">
                                        {previewItem.title}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {previewItem.grade?.name} - {previewItem.subject?.name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a 
                                    href={previewItem.file_url} 
                                    download 
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors"
                                >
                                    <Download size={16} />
                                    تحميل
                                </a>
                                <button 
                                    onClick={() => setPreviewItem(null)} 
                                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        {/* Media Content */}
                        <div className="flex-1 w-full bg-slate-200 dark:bg-slate-950/50 p-2 sm:p-4 md:p-6 overflow-hidden flex flex-col">
                            {previewItem.external_url ? (
                                <iframe 
                                    src={getEmbedUrl(previewItem.external_url)} 
                                    className="w-full h-full rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm bg-black"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={previewItem.title}
                                />
                            ) : previewItem.item_type === 'video' ? (
                                <video 
                                    src={previewItem.file_url} 
                                    controls 
                                    controlsList="nodownload"
                                    className="w-full h-full rounded-xl shadow-lg bg-black object-contain"
                                />
                            ) : previewItem.item_type === 'audio' ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm p-6">
                                    <div className="w-32 h-32 bg-primary-50 dark:bg-primary-500/10 rounded-full flex items-center justify-center mb-8">
                                        <Headphones size={48} className="text-primary-500" />
                                    </div>
                                    <audio src={previewItem.file_url} controls controlsList="nodownload" className="w-full max-w-md" />
                                </div>
                            ) : (
                                <iframe 
                                    src={`${previewItem.file_url}#toolbar=0&navpanes=0&scrollbar=0`} 
                                    className="w-full h-full rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm bg-white"
                                    title={previewItem.title}
                                />
                            )}

                            {/* Star Rating UI inside Modal */}
                            <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between shrink-0">
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">ما رأيك بهذا المورد؟</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        متوسط التقييم: <span className="font-bold text-amber-500 px-1">{previewItem.average_rating || '0.0'}</span> نجمة
                                    </p>
                                </div>
                                <div className="flex items-center gap-1" dir="ltr">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button 
                                            key={star}
                                            onClick={() => {
                                                handleRate(previewItem, star);
                                                setPreviewItem({...previewItem, user_rating: star});
                                            }}
                                            className={`p-1 transition-transform hover:scale-110 active:scale-95 ${previewItem.user_rating >= star ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700 hover:text-amber-400'}`}
                                            title={`تقييم ${star} نجوم`}
                                        >
                                            <Star size={28} fill={previewItem.user_rating >= star ? "currentColor" : "none"} strokeWidth={1.5} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteItem} onClose={() => !isDeleting && setDeleteItem(null)} title={false} maxWidth="max-w-md">
                {deleteItem && (
                    <div className="text-center p-2">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3">تأكيد الحذف</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            هل أنت متأكد من رغبتك في حذف <span className="text-rose-600 dark:text-rose-400 font-black px-1">{deleteItem.title}</span>؟ <br/>لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => !isDeleting && setDeleteItem(null)}
                                disabled={isDeleting}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                إلغاء
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Trash2 size={18} />
                                )}
                                <span>نعم، احذف المورد</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
