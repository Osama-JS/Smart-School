import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import SelectInput from '@/Components/SelectInput';
import { 
    Search, Plus, Book, Trash2, Library, Hash, Layers, X, 
    Info, Sparkles, ChevronDown, RotateCcw, LayoutGrid, 
    Table2, CheckCircle2, Bookmark, Check, Filter
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

export default function BooksIndex({ books, filters }) {
    const { auth } = usePage().props;
    const [viewMode, setViewMode] = useState('table'); // 'cards' | 'table'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [searchValue, setSearchValue] = useState(filters?.search || '');
    const [availableOnly, setAvailableOnly] = useState(filters?.available_only || 'false');
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'newest');
    const [showFilters, setShowFilters] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        author: '',
        isbn: '',
        shelf_location: '',
        total_copies: 1,
        description: '',
        cover_image: null,
    });

    const hasActiveFilters = searchValue !== '' || availableOnly === 'true' || sortBy !== 'newest';

    const applyFilters = (overrides = {}) => {
        router.get(route('academic.library.books.index'), {
            search: overrides.search !== undefined ? overrides.search : searchValue,
            available_only: overrides.available_only !== undefined ? overrides.available_only : availableOnly,
            sort_by: overrides.sort_by !== undefined ? overrides.sort_by : sortBy,
        }, { preserveState: true, replace: true });
    };

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== (filters?.search || '')) {
                applyFilters();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchValue]);

    const resetAllFilters = () => {
        setSearchValue('');
        setAvailableOnly('false');
        setSortBy('newest');
        router.get(route('academic.library.books.index'), {}, { preserveState: true, replace: true });
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFilters();
        }
    };

    const submitAdd = (e) => {
        e.preventDefault();
        post(route('academic.library.books.store'), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
            },
        });
    };

    const handleDelete = (book) => {
        setDeleteItem(book);
    };

    const confirmDelete = () => {
        if (!deleteItem) return;
        setIsDeleting(true);
        router.delete(route('academic.library.books.destroy', deleteItem.id), { 
            preserveScroll: true,
            onSuccess: () => setDeleteItem(null),
            onFinish: () => setIsDeleting(false)
        });
    };

    const booksData = books?.data || [];
    const totalBooks = books?.total || booksData.length;
    // Calculate stats
    const totalCopies = booksData.reduce((acc, book) => acc + book.total_copies, 0);
    const totalAvailable = booksData.reduce((acc, book) => acc + book.available_copies, 0);

    return (
        <AdminLayout activeMenu="الكتب الورقية">
            <Head title="المكتبة الورقية - الكتب" />

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
                            <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">المكتبة الورقية</h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                إدارة الكتب الفعلية، متابعة الرفوف، والتحكم بالنسخ المتاحة للاستعارة
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} /> 
                                <span>إضافة كتاب جديد</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Premium Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { title: 'إجمالي الكتب', value: totalBooks, icon: Library, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10', glow: 'bg-primary-500/5 dark:bg-primary-500/10', grad: 'from-primary-400 to-primary-600' },
                        { title: 'النسخ المتاحة (بالصفحة)', value: totalAvailable, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', glow: 'bg-emerald-500/5 dark:bg-emerald-500/10', grad: 'from-emerald-400 to-emerald-600' },
                        { title: 'إجمالي النسخ', value: totalCopies, icon: Bookmark, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', glow: 'bg-amber-500/5 dark:bg-amber-500/10', grad: 'from-amber-400 to-amber-600' }
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
                                placeholder="بحث بالعنوان، المؤلف، أو رقم ISBN..."
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
                        {/* Sort By Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">ترتيب حسب</label>
                            <SelectInput 
                                value={sortBy} 
                                onChange={val => { setSortBy(val); applyFilters({ sort_by: val }); }}
                                options={[
                                    { value: 'newest', label: 'الأحدث إضافة' },
                                    { value: 'title_asc', label: 'العنوان (أ-ي)' },
                                    { value: 'most_copies', label: 'الأكثر نسخاً' },
                                ]}
                            />
                        </div>

                        {/* Availability Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">حالة التوفر</label>
                            <SelectInput 
                                value={availableOnly} 
                                onChange={val => { setAvailableOnly(val); applyFilters({ available_only: val }); }}
                                options={[
                                    { value: 'false', label: 'عرض جميع الكتب' },
                                    { value: 'true', label: 'الكتب المتاحة للاستعارة فقط' },
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
                {booksData.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                            <Library className="w-10 h-10 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">المكتبة الورقية فارغة</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed font-medium">
                            لم يتم إضافة أي كتب ورقية بعد. ابدأ بإضافة الكتب ليتمكن الطلاب من استعارتها.
                        </p>
                        {hasActiveFilters ? (
                            <button onClick={resetAllFilters} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                إزالة التصفية
                            </button>
                        ) : (
                            <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20">
                                إضافة الكتاب الأول
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === 'cards' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {booksData.map(book => (
                                    <div key={book.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                                        
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            {book.cover_image ? (
                                                <div className="w-16 h-20 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800">
                                                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-20 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                                    <Book size={24} strokeWidth={1.5} />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => handleDelete(book)}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 leading-tight relative z-10 line-clamp-2">
                                            {book.title}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-1 relative z-10">
                                            {book.author || 'مؤلف غير معروف'}
                                        </p>

                                        <div className="space-y-3 flex-1 relative z-10">
                                            {book.isbn && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                    <Hash size={16} className="text-slate-400" />
                                                    <span className="truncate" dir="ltr">{book.isbn}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                <Layers size={16} className="text-slate-400" />
                                                <span className="truncate">الرف: {book.shelf_location || 'غير محدد'}</span>
                                            </div>
                                        </div>

                                        <div className="relative z-10 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${book.available_copies > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${book.available_copies > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                متاح {book.available_copies} من {book.total_copies}
                                            </div>
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
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400 w-2/5">معلومات الكتاب</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400">المؤلف</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400">موقع الرف</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400">التوفر</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400 text-left">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {booksData.map(book => (
                                                <tr key={book.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            {book.cover_image ? (
                                                                <img src={book.cover_url} alt={book.title} className="w-12 h-16 object-cover rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0" />
                                                            ) : (
                                                                <div className="w-12 h-16 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                                                    <Book className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <span className="font-bold text-slate-800 dark:text-white block mb-1">{book.title}</span>
                                                                {book.isbn && (
                                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1" dir="ltr">
                                                                        <Hash size={12} /> {book.isbn}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                                            {book.author || <span className="text-slate-400 dark:text-slate-500 font-normal">غير معروف</span>}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {book.shelf_location ? (
                                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                                                                <Layers className="w-3.5 h-3.5 text-slate-400" />
                                                                {book.shelf_location}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">غير محدد</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${book.available_copies > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${book.available_copies > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                                متاح: {book.available_copies}
                                                            </div>
                                                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-2">من أصل {book.total_copies}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-left">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button 
                                                                onClick={() => handleDelete(book)}
                                                                className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                                                                title="حذف"
                                                            >
                                                                <Trash2 size={18} />
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
                        
                        {books?.links && (
                            <div className="mt-6 flex justify-center">
                                <Pagination links={books.links} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal for Add */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة كتاب للمكتبة">
                <form onSubmit={submitAdd} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان الكتاب *</label>
                            <input 
                                type="text"
                                className={`w-full bg-slate-50 dark:bg-slate-950/50 border ${errors.title ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all`}
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                placeholder="اكتب العنوان الكامل للكتاب"
                                required
                            />
                            {errors.title && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المؤلف</label>
                            <input 
                                type="text"
                                className={`w-full bg-slate-50 dark:bg-slate-950/50 border ${errors.author ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all`}
                                value={data.author}
                                onChange={e => setData('author', e.target.value)}
                                placeholder="مثال: د. أحمد خالد"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الرقم المعياري (ISBN)</label>
                            <input 
                                type="text"
                                className={`w-full text-left bg-slate-50 dark:bg-slate-950/50 border ${errors.isbn ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all`}
                                value={data.isbn}
                                onChange={e => setData('isbn', e.target.value)}
                                placeholder="978-3-16-148410-0"
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رقم أو موقع الرف</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <Layers className="w-4 h-4 text-slate-400" />
                                </div>
                                <input 
                                    type="text"
                                    className={`w-full bg-slate-50 dark:bg-slate-950/50 border ${errors.shelf_location ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl pl-4 pr-11 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all`}
                                    value={data.shelf_location}
                                    onChange={e => setData('shelf_location', e.target.value)}
                                    placeholder="مثال: A12, الرف الثالث"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">إجمالي عدد النسخ المتاحة *</label>
                            <input 
                                type="number"
                                min="1"
                                className={`w-full bg-slate-50 dark:bg-slate-950/50 border ${errors.total_copies ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-black transition-all`}
                                value={data.total_copies}
                                onChange={e => setData('total_copies', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-primary-50 dark:bg-primary-500/10 p-4 rounded-2xl border border-primary-100 dark:border-primary-500/20 flex gap-3 items-start">
                        <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-primary-800 dark:text-primary-300 leading-relaxed">
                            سيتم إتاحة هذا الكتاب للاستعارة من قبل الطلاب بمجرد إضافته. نظام الاستعارة سيقوم بتحديث عدد النسخ المتاحة تلقائياً عند الإعارة والإرجاع.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">صورة الغلاف (اختياري)</label>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                                <span className="text-sm text-slate-500 font-bold truncate max-w-[200px]">
                                    {data.cover_image ? data.cover_image.name : 'لم يتم اختيار صورة'}
                                </span>
                                <label htmlFor="cover-upload" className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-xl text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all">
                                    تصفح
                                    <input id="cover-upload" type="file" accept="image/*" className="sr-only" onChange={e => setData('cover_image', e.target.files[0])} />
                                </label>
                            </div>
                            {data.cover_image && (
                                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                                    <img src={URL.createObjectURL(data.cover_image)} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
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
                            <Check size={18} />
                            حفظ الكتاب
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteItem} onClose={() => !isDeleting && setDeleteItem(null)} title={false} maxWidth="max-w-md">
                {deleteItem && (
                    <div className="text-center p-2">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3">تأكيد الحذف</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            هل أنت متأكد من رغبتك في حذف الكتاب <span className="text-rose-600 dark:text-rose-400 font-black px-1">{deleteItem.title}</span>؟ <br/>لا يمكن التراجع عن هذا الإجراء ولا يمكن الحذف إذا كانت هناك نسخ معارة.
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
                                <span>نعم، احذف الكتاب</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
