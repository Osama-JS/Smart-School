import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Search, Plus, Clock, Edit2, Trash2, MoreVertical, X, Check, 
    AlertTriangle, AlertCircle, Filter, RotateCcw,
    CheckCircle2, Hourglass, Users, ChevronDown, Activity, Sparkles
} from 'lucide-react';

function Modal({ isOpen, onClose, title, children }) {
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
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all duration-300 scale-100 opacity-100">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-500" />
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
                <div className="p-6 md:p-8">{children}</div>
            </div>
        </div>
    );
}

function ActionMenu({ shift, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button 
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 p-2 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all duration-200"
            >
                <MoreVertical size={20} />
            </button>
            
            {open && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                        onClick={() => { onEdit(shift); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <Edit2 size={16} />
                        </div>
                        تعديل الشفت
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-4" />
                    <button 
                        onClick={() => { onDelete(shift); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                        <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                            <Trash2 size={16} />
                        </div>
                        حذف الشفت
                    </button>
                </div>
            )}
        </div>
    );
}

function Pagination({ data }) {
    if (!data || data.last_page <= 1) return null;
    return (
        <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 flex-wrap gap-4 rounded-b-3xl">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                عرض <span className="font-bold text-slate-800 dark:text-white mx-1">{data.from}</span> 
                إلى <span className="font-bold text-slate-800 dark:text-white mx-1">{data.to}</span> 
                من إجمالي <span className="font-bold text-slate-800 dark:text-white mx-1">{data.total}</span> شفت
            </p>
            <div className="flex items-center gap-2 flex-wrap" dir="ltr">
                {data.links.map((link, i) => {
                    const isPrevNext = link.label.includes('Previous') || link.label.includes('Next');
                    const label = link.label.replace('&laquo; Previous', 'السابق').replace('Next &raquo;', 'التالي');
                    return (
                        <button 
                            key={i} 
                            disabled={!link.url || link.active}
                            onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 shadow-sm ${
                                link.active
                                    ? 'bg-primary-500 text-white shadow-primary-500/20'
                                    : link.url
                                        ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-800'
                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-50'
                            }`}
                        >
                            {label}
                        </button>
                    )
                })}
            </div>
        </div>
    );
}

export default function ShiftsIndex({ shifts, filters, stats }) {
    const { flash } = usePage().props;

    const getFilterVal = (key, fallback = '') => {
        if (!filters || Array.isArray(filters)) return fallback;
        const val = filters[key];
        return typeof val === 'string' || typeof val === 'number' ? String(val) : fallback;
    };

    const [searchValue, setSearch] = useState(getFilterVal('search'));
    const [statusValue, setStatusValue] = useState(getFilterVal('status', 'all'));
    const [minGrace, setMinGrace] = useState(getFilterVal('min_grace'));
    const [maxGrace, setMaxGrace] = useState(getFilterVal('max_grace'));
    const [sortValue, setSortValue] = useState(getFilterVal('sort', 'name_asc'));

    const [showFilters, setShowFilters] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [editShift, setEditShift] = useState(null);
    const [deleteShift, setDeleteShift] = useState(null);
    const [form, setForm] = useState({ name: '', start_time: '', end_time: '', grace_period_minutes: 15, is_active: true });
    const [processing, setProcessing] = useState(false);
    
    const isFirstRender = useRef(true);

    const applyFilters = (updates) => {
        const params = {
            search: updates.hasOwnProperty('search') ? updates.search : searchValue,
            status: updates.hasOwnProperty('status') ? updates.status : statusValue,
            min_grace: updates.hasOwnProperty('min_grace') ? updates.min_grace : minGrace,
            max_grace: updates.hasOwnProperty('max_grace') ? updates.max_grace : maxGrace,
            sort: updates.hasOwnProperty('sort') ? updates.sort : sortValue,
        };

        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined || (key === 'status' && params[key] === 'all') || (key === 'sort' && params[key] === 'name_asc')) {
                delete params[key];
            }
        });

        router.get(route('hr.shifts'), params, { preserveState: true, replace: true });
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const delay = setTimeout(() => {
            applyFilters({});
        }, 400);
        return () => clearTimeout(delay);
    }, [searchValue, minGrace, maxGrace]);

    const handleStatusChange = (val) => { setStatusValue(val); applyFilters({ status: val }); };
    const handleSortChange = (val) => { setSortValue(val); applyFilters({ sort: val }); };

    const resetAllFilters = () => {
        setSearch(''); setStatusValue('all'); setMinGrace(''); setMaxGrace(''); setSortValue('name_asc');
        router.get(route('hr.shifts'), {}, { preserveState: true, replace: true });
    };

    const openAdd = () => { setForm({ name: '', start_time: '', end_time: '', grace_period_minutes: 15, is_active: true }); setShowAdd(true); };
    const openEdit = (s) => { 
        setForm({ 
            name: s.name, 
            start_time: s.start_time.substring(0,5), 
            end_time: s.end_time.substring(0,5), 
            grace_period_minutes: s.grace_period_minutes, 
            is_active: s.is_active 
        }); 
        setEditShift(s); 
    };

    const handleStore = (e) => {
        e.preventDefault(); setProcessing(true);
        router.post(route('hr.shifts.store'), form, { onFinish: () => { setProcessing(false); setShowAdd(false); } });
    };

    const handleUpdate = (e) => {
        e.preventDefault(); setProcessing(true);
        router.put(route('hr.shifts.update', editShift.id), form, { onFinish: () => { setProcessing(false); setEditShift(null); } });
    };

    const handleDelete = () => {
        router.delete(route('hr.shifts.destroy', deleteShift.id), { onFinish: () => setDeleteShift(null) });
    };

    const shiftsData = shifts?.data ?? [];

    const formatTime = (time) => {
        if (!time) return '';
        const [h, m] = time.split(':');
        let hours = parseInt(h);
        const ampm = hours >= 12 ? 'م' : 'ص';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        return `${hours}:${m} ${ampm}`;
    };

    const hasActiveFilters = searchValue !== '' || statusValue !== 'all' || minGrace !== '' || maxGrace !== '' || sortValue !== 'name_asc';

    return (
        <AdminLayout activeMenu="الشفتات">
            <Head title="إدارة الشفتات | النظام الإداري" />

            {flash?.success && (
                <div className="mb-8 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-3xl text-sm font-bold shadow-sm shadow-emerald-500/5 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                            <Check size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        {flash.success}
                    </div>
                </div>
            )}
            
            {/* Header Hero Section */}
            <div className="relative overflow-hidden bg-white dark:bg-[#0B1120] rounded-[2.5rem] p-8 md:p-12 mb-10 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/80 dark:border-slate-800/80 dark:shadow-2xl">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-gradient-to-br from-primary-100/80 to-indigo-100/80 dark:from-primary-500/20 dark:to-indigo-500/20 rounded-full blur-[80px] pointer-events-none opacity-80 dark:opacity-100" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-gradient-to-tr from-sky-100/80 to-blue-100/80 dark:from-sky-500/20 dark:to-blue-500/20 rounded-full blur-[80px] pointer-events-none opacity-80 dark:opacity-100" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-5 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white/90 text-sm font-bold mb-5 backdrop-blur-md shadow-sm">
                            <Activity size={18} className="text-primary-600 dark:text-primary-400" />
                            <span>نظام الموارد البشرية</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                            إدارة <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">شفتات العمل</span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-4 text-lg font-semibold max-w-xl leading-relaxed">
                            تحكم كامل في أوقات الدوام الرسمي، فترات السماح، وتعيين الموظفين بكفاءة ومرونة عالية.
                        </p>
                    </div>
                    <button onClick={openAdd}
                        className="group flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-50 text-white dark:text-slate-900 rounded-2xl shadow-[0_10px_30px_-10px_rgba(15,23,42,0.3)] dark:hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] text-base font-black transition-all duration-300 shrink-0 transform hover:-translate-y-1 active:translate-y-0 active:scale-95">
                        <div className="bg-white/20 dark:bg-primary-100 text-white dark:text-primary-600 p-1.5 rounded-xl group-hover:rotate-90 transition-transform duration-300">
                            <Plus size={20} /> 
                        </div>
                        <span>إضافة شفت جديد</span>
                    </button>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { title: 'إجمالي الشفتات', value: stats?.total_shifts ?? 0, icon: Clock, color: 'from-blue-500 to-cyan-500', bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10', text: 'text-blue-600 dark:text-blue-400', shadow: 'shadow-blue-500/10' },
                    { title: 'الشفتات النشطة', value: stats?.active_shifts ?? 0, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10', text: 'text-emerald-600 dark:text-emerald-400', shadow: 'shadow-emerald-500/10' },
                    { title: 'متوسط السماح', value: (stats?.avg_grace ?? 0) + ' د', icon: Hourglass, color: 'from-amber-500 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10', text: 'text-amber-600 dark:text-amber-400', shadow: 'shadow-amber-500/10' },
                    { title: 'الموظفون المسجلون', value: stats?.total_assigned_employees ?? 0, icon: Users, color: 'from-indigo-500 to-violet-500', bg: 'bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10', text: 'text-indigo-600 dark:text-indigo-400', shadow: 'shadow-indigo-500/10' },
                ].map((stat, i) => (
                    <div key={i} className={`group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 transition-all duration-300 hover:shadow-2xl ${stat.shadow} dark:hover:shadow-none hover:-translate-y-1`}>
                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-16 h-16 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.text} transition-transform duration-300 group-hover:scale-110 shadow-sm border border-white/50 dark:border-transparent`}>
                                <stat.icon size={28} strokeWidth={2.5} />
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">{stat.title}</p>
                        <p className="text-4xl font-black text-slate-800 dark:text-white font-sans tracking-tight">{stat.value}</p>
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
                            placeholder="ابحث باسم الشفت..."
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pr-14 py-4 text-base focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                            value={searchValue} 
                            onChange={e => setSearch(e.target.value)} 
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
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? 'mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 opacity-100 max-h-[500px]' : 'max-h-0 opacity-0 m-0 p-0 border-none'}`}>
                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الحالة التشغيلية</label>
                        <select 
                            value={statusValue} 
                            onChange={e => handleStatusChange(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900"
                        >
                            <option value="all">الكل</option>
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                        </select>
                    </div>

                    {/* Min Grace */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">السماح من (دقائق)</label>
                        <input 
                            type="number" min="0" placeholder="مثال: 5" value={minGrace} onChange={e => setMinGrace(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all placeholder:font-medium"
                        />
                    </div>

                    {/* Max Grace */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">السماح إلى (دقائق)</label>
                        <input 
                            type="number" min="0" placeholder="مثال: 30" value={maxGrace} onChange={e => setMaxGrace(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all placeholder:font-medium"
                        />
                    </div>

                    {/* Sort */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الترتيب حسب</label>
                        <select 
                            value={sortValue} 
                            onChange={e => handleSortChange(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900"
                        >
                            <option value="name_asc">الاسم (أ-ي)</option>
                            <option value="name_desc">الاسم (ي-أ)</option>
                            <option value="start_time_asc">وقت البدء (مبكراً أولاً)</option>
                            <option value="start_time_desc">وقت البدء (متأخراً أولاً)</option>
                            <option value="employees_count_desc">الموظفين (الأكثر أولاً)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Shift Cards Grid */}
            {shiftsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Search size={40} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">لا توجد نتائج مطابقة</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">حاول تغيير معايير البحث أو إضافة شفت جديد</p>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {shiftsData.map((shift, index) => {
                            const totalAssigned = stats?.total_assigned_employees ?? 0;
                            const empCount = shift.employees_count ?? 0;
                            const percentage = totalAssigned > 0 ? (empCount / totalAssigned) * 100 : 0;
                            
                            return (
                                <div 
                                    key={shift.id} 
                                    className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 p-6 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:hover:shadow-none hover:-translate-y-2 overflow-hidden flex flex-col h-full"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Glassmorphism Background Accent */}
                                    <div className={`absolute top-0 right-0 w-48 h-48 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transition-all duration-500 group-hover:scale-150 group-hover:opacity-40 ${shift.is_active ? 'bg-primary-400' : 'bg-slate-300'}`} />
                                    
                                    <div className="relative z-10 flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            {/* Progress Circle (Apple Watch style) */}
                                            <div className="relative w-16 h-16 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
                                                <svg className="absolute inset-0 w-full h-full transform -rotate-90 p-1">
                                                    <circle cx="28" cy="28" r="24" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="4" fill="none" />
                                                    <circle 
                                                        cx="28" cy="28" r="24" 
                                                        className={`${shift.is_active ? 'stroke-primary-600 dark:stroke-primary-500' : 'stroke-slate-400'} transition-all duration-1000 ease-out`} 
                                                        strokeWidth="4" fill="none" strokeLinecap="round"
                                                        strokeDasharray={2 * Math.PI * 24}
                                                        strokeDashoffset={2 * Math.PI * 24 - (Math.min(percentage, 100) / 100) * (2 * Math.PI * 24)}
                                                    />
                                                </svg>
                                                <div className="relative text-slate-800 dark:text-slate-200 font-black font-sans text-sm">{empCount}</div>
                                            </div>
                                            
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                                                    {shift.name}
                                                </h3>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${shift.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/60' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${shift.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                    {shift.is_active ? 'نشط' : 'متوقف'}
                                                </span>
                                            </div>
                                        </div>
                                        <ActionMenu shift={shift} onEdit={openEdit} onDelete={setDeleteShift} />
                                    </div>

                                    {/* Times Section */}
                                    <div className="relative z-10 flex flex-col gap-3 mb-6 mt-auto">
                                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">وقت الحضور</span>
                                                <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-sans">{formatTime(shift.start_time)}</span>
                                            </div>
                                            <div className="w-8 h-[2px] bg-slate-200 dark:bg-slate-700 rounded-full" />
                                            <div className="flex flex-col items-end">
                                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">وقت الانصراف</span>
                                                <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-sans">{formatTime(shift.end_time)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Details */}
                                    <div className="relative z-10 flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/80">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold border border-amber-100/50 dark:border-transparent">
                                            <AlertCircle size={16} strokeWidth={2.5} />
                                            <span>السماح: {shift.grace_period_minutes} دقيقة</span>
                                        </div>
                                        
                                        <button onClick={() => openEdit(shift)} className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500/20 transition-all shadow-sm">
                                            <Edit2 size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <Pagination data={shifts} />
                </div>
            )}

            {/* Modal Components */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة شفت جديد">
                <form onSubmit={handleStore} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">اسم الشفت <span className="text-rose-500">*</span></label>
                        <input type="text" required placeholder="مثال: الدوام الصباحي"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold" 
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">وقت البدء <span className="text-rose-500">*</span></label>
                            <input type="time" required 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold font-sans" 
                                value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">وقت الانتهاء <span className="text-rose-500">*</span></label>
                            <input type="time" required 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold font-sans" 
                                value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">فترة السماح (بالدقائق) <span className="text-rose-500">*</span></label>
                        <input type="number" min="0" required placeholder="مثال: 15"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold font-sans" 
                            value={form.grace_period_minutes} onChange={e => setForm({ ...form, grace_period_minutes: e.target.value })} />
                    </div>
                    
                    <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="relative flex items-center">
                            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} 
                                className="peer sr-only" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">تفعيل الشفت فور الإضافة</span>
                    </label>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3.5 text-sm font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="flex-1 py-3.5 text-sm font-black text-white bg-primary-500 hover:bg-primary-600 rounded-2xl disabled:opacity-70 transition-all shadow-lg shadow-primary-500/30">حفظ الشفت</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!editShift} onClose={() => setEditShift(null)} title="تعديل بيانات الشفت">
                <form onSubmit={handleUpdate} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">اسم الشفت <span className="text-rose-500">*</span></label>
                        <input type="text" required 
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold" 
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">وقت البدء <span className="text-rose-500">*</span></label>
                            <input type="time" required 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold font-sans" 
                                value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">وقت الانتهاء <span className="text-rose-500">*</span></label>
                            <input type="time" required 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold font-sans" 
                                value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">فترة السماح (بالدقائق) <span className="text-rose-500">*</span></label>
                        <input type="number" min="0" required 
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold font-sans" 
                            value={form.grace_period_minutes} onChange={e => setForm({ ...form, grace_period_minutes: e.target.value })} />
                    </div>
                    
                    <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="relative flex items-center">
                            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} 
                                className="peer sr-only" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">حالة الشفت (مفعل/غير مفعل)</span>
                    </label>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setEditShift(null)} className="flex-1 py-3.5 text-sm font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="flex-1 py-3.5 text-sm font-black text-white bg-primary-500 hover:bg-primary-600 rounded-2xl disabled:opacity-70 transition-all shadow-lg shadow-primary-500/30">حفظ التعديلات</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!deleteShift} onClose={() => setDeleteShift(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-20"></div>
                        <AlertTriangle size={36} className="text-rose-500 dark:text-rose-400" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-2">هل أنت متأكد؟</h4>
                        <p className="text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                            سيتم حذف الشفت "<span className="font-bold text-rose-500 mx-1">{deleteShift?.name}</span>" نهائياً ولن تتمكن من استعادته.
                        </p>
                    </div>
                    <div className="flex gap-4 w-full mt-4">
                        <button onClick={() => setDeleteShift(null)} className="flex-1 py-3.5 text-sm font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">تراجع</button>
                        <button onClick={handleDelete} className="flex-1 py-3.5 text-sm font-black text-white bg-rose-500 hover:bg-rose-600 rounded-2xl transition-colors shadow-lg shadow-rose-500/30">نعم، احذف الشفت</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
