import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import SelectInput from '@/Components/SelectInput';
import { 
    Check, Plus, AlertCircle, Trash2, Search, ArrowRightLeft, 
    User, Calendar, Book, X, Clock, Sparkles, ChevronDown, 
    RotateCcw, Activity, CheckCircle2, Filter
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
            <div className={`relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-full ${maxWidth} z-10 overflow-hidden border border-white/20 dark:border-slate-700/50 transform transition-all duration-300 scale-100 opacity-100 scale-in-center`}>
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-500" />
                {title && (
                    <div className="relative flex items-center justify-between p-6 md:p-8 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm z-20">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            {title}
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="w-10 h-10 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all active:scale-95"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                )}
                <div className="relative z-20 p-6 md:p-8 max-h-[75vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export default function BorrowingsIndex({ borrowings, books, students, filters }) {
    const { auth } = usePage().props;
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
    const [returnItem, setReturnItem] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');
    const [showFilters, setShowFilters] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        book_id: '',
        student_id: '',
        borrowed_at: new Date().toISOString().split('T')[0],
        due_date: '',
    });

    const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || dateFrom !== '' || dateTo !== '';

    const applyFilters = (overrides = {}) => {
        router.get(route('academic.library.borrowings.index'), {
            search: overrides.search !== undefined ? overrides.search : searchQuery,
            status: overrides.status !== undefined ? overrides.status : statusFilter === 'all' ? '' : statusFilter,
            date_from: overrides.date_from !== undefined ? overrides.date_from : dateFrom,
            date_to: overrides.date_to !== undefined ? overrides.date_to : dateTo,
        }, { preserveState: true, replace: true });
    };

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                applyFilters();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const resetAllFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setDateFrom('');
        setDateTo('');
        router.get(route('academic.library.borrowings.index'), {}, { preserveState: true, replace: true });
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFilters();
        }
    };

    const submitAdd = (e) => {
        e.preventDefault();
        post(route('academic.library.borrowings.store'), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
            },
        });
    };

    const handleReturnClick = (item) => {
        setReturnItem(item);
    };

    const confirmReturn = () => {
        if (!returnItem) return;
        setIsProcessing(true);
        router.post(route('academic.library.borrowings.return', returnItem.id), {}, {
            preserveScroll: true,
            onSuccess: () => setReturnItem(null),
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleDeleteClick = (item) => {
        setDeleteItem(item);
    };

    const confirmDelete = () => {
        if (!deleteItem) return;
        setIsProcessing(true);
        router.delete(route('academic.library.borrowings.destroy', deleteItem.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteItem(null),
            onFinish: () => setIsProcessing(false)
        });
    };

    const borrowingsData = borrowings?.data || [];
    const totalBorrowings = borrowings?.total || borrowingsData.length;
    
    // Quick visual stats from current page data (ideally these come from backend)
    const activeBorrowings = borrowingsData.filter(b => b.status === 'borrowed').length;
    const overdueBorrowings = borrowingsData.filter(b => b.status === 'overdue').length;

    return (
        <AdminLayout activeMenu="الاستعارات">
            <Head title="المكتبة - الاستعارات" />

            <div className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative">
                
                {/* Fine abstract geometric background lines */}
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden -z-10">
                    <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                        <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                        <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                        <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                    </svg>
                </div>
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600" />
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]">
                                <ArrowRightLeft size={24} strokeWidth={2.5} className="animate-pulse" />
                            </div>
                            سجل الاستعارات
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-sm max-w-xl leading-relaxed">
                            إدارة حركة استعارة الكتب، تتبع مواعيد الإرجاع، ومراقبة التأخيرات للحفاظ على ممتلكات المكتبة.
                        </p>
                    </div>
                    <div className="relative z-10 flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_25px_-4px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 active:translate-y-0 group"
                        >
                            <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" /> 
                            <span>تسجيل استعارة جديدة</span>
                        </button>
                    </div>
                </div>

                {/* Premium Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { title: 'إجمالي العمليات', value: totalBorrowings, icon: ArrowRightLeft, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10', glow: 'bg-primary-500/5 dark:bg-primary-500/10', grad: 'from-primary-400 to-primary-600' },
                        { title: 'استعارات جارية (الآن)', value: activeBorrowings, icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', glow: 'bg-blue-500/5 dark:bg-blue-500/10', grad: 'from-blue-400 to-blue-600' },
                        { title: 'استعارات متأخرة', value: overdueBorrowings, icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', glow: 'bg-rose-500/5 dark:bg-rose-500/10', grad: 'from-rose-400 to-rose-600' }
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
                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-4 sm:p-6 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -z-10 animate-pulse" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-xl group">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                <Search size={22} strokeWidth={2.5} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="ابحث باسم الطالب أو عنوان الكتاب..."
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pr-14 py-4 text-base focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)}
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
                    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-5 transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? 'mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 opacity-100 max-h-[500px]' : 'max-h-0 opacity-0 m-0 p-0 border-none'}`}>
                        {/* Status Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">حالة الاستعارة</label>
                            <SelectInput 
                                value={statusFilter} 
                                onChange={val => { setStatusFilter(val); applyFilters({ status: val }); }}
                                options={[
                                    { value: 'all', label: 'كل الحالات' },
                                    { value: 'borrowed', label: 'قيد الاستعارة (لم يُرجع)' },
                                    { value: 'returned', label: 'تم الإرجاع' },
                                    { value: 'overdue', label: 'متأخر الإرجاع' },
                                ]}
                            />
                        </div>

                        {/* Date From Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">من تاريخ (استعارة)</label>
                            <input 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all"
                                value={dateFrom}
                                onChange={e => { setDateFrom(e.target.value); applyFilters({ date_from: e.target.value }); }}
                            />
                        </div>

                        {/* Date To Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">إلى تاريخ (استعارة)</label>
                            <input 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all"
                                value={dateTo}
                                onChange={e => { setDateTo(e.target.value); applyFilters({ date_to: e.target.value }); }}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {borrowingsData.length === 0 ? (
                    <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
                        <div className="w-24 h-24 bg-primary-50 dark:bg-primary-500/10 rounded-[2rem] flex items-center justify-center mb-6 relative z-10 shadow-[0_0_40px_rgba(99,102,241,0.2)] animate-pulse">
                            <ArrowRightLeft className="w-10 h-10 text-primary-500 dark:text-primary-400" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 relative z-10 tracking-tight">سجل الاستعارات فارغ</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed font-medium relative z-10 text-sm">
                            لم يتم تسجيل أي عمليات استعارة بناءً على معايير البحث الحالية. يمكنك إضافة استعارة جديدة للبدء في تتبع حركة الكتب.
                        </p>
                        {hasActiveFilters ? (
                            <button onClick={resetAllFilters} className="relative z-10 px-8 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:-translate-y-1">
                                إزالة التصفية
                            </button>
                        ) : (
                            <button onClick={() => setIsAddModalOpen(true)} className="relative z-10 flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 hover:-translate-y-1 hover:shadow-primary-500/40">
                                <Plus size={18} strokeWidth={3} />
                                تسجيل أول استعارة
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative">
                            <div className="absolute inset-0 bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:16px_16px] -z-10" />
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                            <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400">الطالب المستعير</th>
                                            <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400">عنوان الكتاب</th>
                                            <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400">التواريخ</th>
                                            <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400">الحالة</th>
                                            <th className="px-6 py-5 text-sm font-black text-slate-500 dark:text-slate-400 text-left">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {borrowingsData.map((b) => (
                                            <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-500/20">
                                                            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                                        </div>
                                                        <span className="font-bold text-slate-800 dark:text-white">{b.student?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Book className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{b.book?.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5 text-xs font-bold">
                                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400" dir="ltr">
                                                            <span className="w-14 text-right text-[10px] uppercase tracking-wider text-slate-400">استعارة</span>
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            {new Date(b.borrowed_at).toLocaleDateString()}
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 ${b.status === 'overdue' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`} dir="ltr">
                                                            <span className="w-14 text-right text-[10px] uppercase tracking-wider text-slate-400">استحقاق</span>
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            {new Date(b.due_date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {b.status === 'borrowed' && (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                                            قيد الاستعارة
                                                        </div>
                                                    )}
                                                    {b.status === 'returned' && (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            تم الإرجاع
                                                        </div>
                                                    )}
                                                    {b.status === 'overdue' && (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            متأخر
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {b.status !== 'returned' && (
                                                            <button 
                                                                onClick={() => handleReturnClick(b)}
                                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all font-bold text-xs"
                                                                title="استلام الكتاب"
                                                            >
                                                                <Check size={16} /> 
                                                                استلام
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleDeleteClick(b)}
                                                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                                                            title="حذف السجل"
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
                        
                        {borrowings?.links && (
                            <div className="mt-6 flex justify-center">
                                <Pagination links={borrowings.links} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal for Add */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="تسجيل إعارة كتاب للطالب">
                <form onSubmit={submitAdd} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الطالب المستعير *</label>
                        <SelectInput 
                            value={data.student_id} 
                            onChange={val => setData('student_id', val)}
                            options={[
                                { value: '', label: 'بحث واختيار طالب...' },
                                ...(students?.map(s => ({ value: s.id.toString(), label: s.name })) || [])
                            ]}
                        />
                        {errors.student_id && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.student_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الكتاب المراد إعارته *</label>
                        <SelectInput 
                            value={data.book_id} 
                            onChange={val => setData('book_id', val)}
                            options={[
                                { value: '', label: 'اختر كتاباً متاحاً في الرف...' },
                                ...(books?.map(b => ({ 
                                    value: b.id.toString(), 
                                    label: `${b.title} - (متاح ${b.available_copies} نسخة)` 
                                })) || [])
                            ]}
                        />
                        {errors.book_id && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.book_id}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-5 p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ الاستعارة *</label>
                            <input 
                                type="date"
                                className={`w-full bg-white dark:bg-slate-900 border ${errors.borrowed_at ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white font-bold transition-all`}
                                value={data.borrowed_at}
                                onChange={e => setData('borrowed_at', e.target.value)}
                                required
                            />
                            {errors.borrowed_at && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.borrowed_at}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-rose-600 dark:text-rose-400 mb-2">تاريخ الاستحقاق *</label>
                            <input 
                                type="date"
                                className={`w-full bg-rose-50/50 dark:bg-rose-500/5 border ${errors.due_date ? 'border-rose-500' : 'border-rose-200 dark:border-rose-500/20'} text-rose-700 dark:text-rose-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold transition-all`}
                                value={data.due_date}
                                onChange={e => setData('due_date', e.target.value)}
                                required
                            />
                            {errors.due_date && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.due_date}</p>}
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
                            تأكيد الاستعارة
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Return Confirmation Modal */}
            <Modal isOpen={!!returnItem} onClose={() => !isProcessing && setReturnItem(null)} title={false} maxWidth="max-w-md">
                {returnItem && (
                    <div className="text-center p-2">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3">تأكيد الاستلام</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            هل تم استلام الكتاب <span className="text-emerald-600 dark:text-emerald-400 font-black px-1">{returnItem.book?.title}</span> فعلياً من الطالب؟ سيتم تحديث حالة الكتاب إلى متاح.
                        </p>
                        
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => !isProcessing && setReturnItem(null)}
                                disabled={isProcessing}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                إلغاء
                            </button>
                            <button
                                type="button"
                                onClick={confirmReturn}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle2 size={18} />
                                )}
                                <span>نعم، تم الاستلام</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteItem} onClose={() => !isProcessing && setDeleteItem(null)} title={false} maxWidth="max-w-md">
                {deleteItem && (
                    <div className="text-center p-2">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3">تأكيد الحذف</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            هل أنت متأكد من رغبتك في حذف سجل الاستعارة للطالب <span className="text-rose-600 dark:text-rose-400 font-black px-1">{deleteItem.student?.name}</span>؟ <br/>هذا الإجراء لا يمكن التراجع عنه.
                        </p>
                        
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => !isProcessing && setDeleteItem(null)}
                                disabled={isProcessing}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                إلغاء
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Trash2 size={18} />
                                )}
                                <span>نعم، احذف السجل</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
