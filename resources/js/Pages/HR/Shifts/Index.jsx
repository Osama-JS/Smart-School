import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Search, Plus, Clock, Edit2, Trash2, MoreVertical, X, Check, 
    AlertTriangle, AlertCircle, Filter, RotateCcw, ArrowUpDown,
    SlidersHorizontal, CheckCircle2, Hourglass, Users, Briefcase, ChevronDown
} from 'lucide-react';

function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">✕</button>
                </div>
                <div className="p-6">{children}</div>
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
            <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 p-1.5 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">
                <MoreVertical size={18} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-20 overflow-hidden animate-slide-down">
                    <button onClick={() => { onEdit(shift); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right">
                        <Edit2 size={14} className="text-primary-500" /> تعديل
                    </button>
                    <button onClick={() => { onDelete(shift); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors text-right">
                        <Trash2 size={14} /> حذف
                    </button>
                </div>
            )}
        </div>
    );
}

function Pagination({ data }) {
    if (!data || data.last_page <= 1) return null;
    return (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30 flex-wrap gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">عرض {data.from} إلى {data.to} من {data.total}</p>
            <div className="flex items-center gap-1.5 flex-wrap font-sans" dir="ltr">
                {data.links.map((link, i) => (
                    <button key={i} disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ${
                            link.active
                                ? 'bg-primary-500 text-white border-primary-500 shadow-sm dark:bg-primary-600 dark:border-primary-600'
                                : link.url
                                    ? 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'
                                    : 'bg-white dark:bg-slate-950 text-slate-300 dark:text-slate-600 border-slate-105 dark:border-slate-850 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
            </div>
        </div>
    );
}

export default function ShiftsIndex({ shifts, filters, stats }) {
    const { flash } = usePage().props;

    // Ensure filters is a valid object and properties are strings (especially protecting against Array.prototype.sort if filters is an array)
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

        // Clean empty parameters
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined || (key === 'status' && params[key] === 'all') || (key === 'sort' && params[key] === 'name_asc')) {
                delete params[key];
            }
        });

        router.get(route('hr.shifts'), params, { preserveState: true, replace: true });
    };

    // Debounce for input fields (search, min_grace, max_grace)
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

    const handleStatusChange = (val) => {
        setStatusValue(val);
        applyFilters({ status: val });
    };

    const handleSortChange = (val) => {
        setSortValue(val);
        applyFilters({ sort: val });
    };

    const resetAllFilters = () => {
        setSearch('');
        setStatusValue('all');
        setMinGrace('');
        setMaxGrace('');
        setSortValue('name_asc');
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

    // Check if any filter is applied (excluding defaults)
    const hasActiveFilters = 
        searchValue !== '' ||
        statusValue !== 'all' ||
        minGrace !== '' ||
        maxGrace !== '' ||
        sortValue !== 'name_asc';

    return (
        <AdminLayout activeMenu="الشفتات">
            <Head title="إدارة الشفتات | النظام الإداري" />

            {flash?.success && (
                <div className="mb-6 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down">
                    <Check size={16} /> {flash.success}
                </div>
            )}
            
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
                        <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">إدارة شفتات العمل</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">التحكم في أوقات الدوام الرسمي وساعات العمل</p>
                    </div>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95">
                        <Plus size={18} /> 
                        <span>إضافة شفت جديد</span>
                    </button>
                </div>
            </div>

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Card 1: Total Shifts */}
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm group hover:shadow-md transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-500/5 rounded-full blur-xl group-hover:bg-primary-500/10 transition-all duration-300" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <Clock size={22} />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">الوقت الكلي</span>
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي شفتات العمل</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1 font-mono">{stats?.total_shifts ?? 0}</p>
                </div>
                
                {/* Card 2: Active Shifts */}
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm group hover:shadow-md transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-300" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={22} />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">حالة التشغيل</span>
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">الشفتات النشطة</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1 font-mono">{stats?.active_shifts ?? 0}</p>
                </div>
                
                {/* Card 3: Avg Grace Period */}
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm group hover:shadow-md transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all duration-300" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Hourglass size={22} />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">دقائق</span>
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">متوسط فترة السماح</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1 font-mono">
                        {stats?.avg_grace ?? 0} <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">دقيقة</span>
                    </p>
                </div>
                
                {/* Card 4: Assigned Employees */}
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm group hover:shadow-md transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all duration-300" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Users size={22} />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">الموظفين</span>
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">الموظفون المسجلون</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1 font-mono">{stats?.total_assigned_employees ?? 0}</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="ابحث باسم الشفت..."
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                            value={searchValue} onChange={e => setSearch(e.target.value)} />
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${
                                showFilters || hasActiveFilters
                                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                    : 'bg-white dark:bg-slate-950 border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}>
                            <Filter size={16} />
                            <span>تصفية متقدمة</span>
                            <ChevronDown size={14} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        {hasActiveFilters && (
                            <button onClick={resetAllFilters}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10 hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-all border border-accent-100 dark:border-accent-550/10">
                                <RotateCcw size={16} />
                                <span>إعادة تعيين</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Expandable Advanced Filters Panel */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 animate-slide-down">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الحالة التشغيلية</label>
                            <select 
                                value={statusValue} 
                                onChange={e => handleStatusChange(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 dark:text-white font-semibold">
                                <option value="all">الكل</option>
                                <option value="active">نشط</option>
                                <option value="inactive">غير نشط</option>
                            </select>
                        </div>

                        {/* Min Grace Period */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">السماح من (دقائق)</label>
                            <input 
                                type="number" 
                                min="0"
                                placeholder="مثال: 5"
                                value={minGrace}
                                onChange={e => setMinGrace(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 dark:text-white font-semibold font-sans"
                            />
                        </div>

                        {/* Max Grace Period */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">السماح إلى (دقائق)</label>
                            <input 
                                type="number" 
                                min="0"
                                placeholder="مثال: 30"
                                value={maxGrace}
                                onChange={e => setMaxGrace(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 dark:text-white font-semibold font-sans"
                            />
                        </div>

                        {/* Sorting */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الترتيب حسب</label>
                            <select 
                                value={sortValue} 
                                onChange={e => handleSortChange(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 dark:text-white font-semibold">
                                <option value="name_asc">الاسم (أ-ي)</option>
                                <option value="name_desc">الاسم (ي-أ)</option>
                                <option value="start_time_asc">وقت البدء (مبكراً أولاً)</option>
                                <option value="start_time_desc">وقت البدء (متأخراً أولاً)</option>
                                <option value="employees_count_asc">الموظفين (الأقل أولاً)</option>
                                <option value="employees_count_desc">الموظفين (الأكثر أولاً)</option>
                                <option value="grace_period_asc">فترة السماح (الأصغر أولاً)</option>
                                <option value="grace_period_desc">فترة السماح (الأكبر أولاً)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Active Filter Badges */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {searchValue && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                <span>البحث: "{searchValue}"</span>
                                <button onClick={() => { setSearch(''); applyFilters({ search: '' }); }} className="hover:text-accent-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {statusValue !== 'all' && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                <span>الحالة: {statusValue === 'active' ? 'نشط' : 'غير نشط'}</span>
                                <button onClick={() => handleStatusChange('all')} className="hover:text-accent-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {(minGrace !== '' || maxGrace !== '') && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                <span>
                                    دقائق السماح: {minGrace !== '' ? `من ${minGrace}` : ''} {maxGrace !== '' ? `إلى ${maxGrace}` : ''}
                                </span>
                                <button onClick={() => { setMinGrace(''); setMaxGrace(''); applyFilters({ min_grace: '', max_grace: '' }); }} className="hover:text-accent-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {sortValue !== 'name_asc' && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                <span>
                                    الترتيب: {
                                        sortValue === 'name_desc' ? 'الاسم تنازلياً' :
                                        sortValue === 'start_time_asc' ? 'وقت البدء تصاعدياً' :
                                        sortValue === 'start_time_desc' ? 'وقت البدء تنازلياً' :
                                        sortValue === 'employees_count_asc' ? 'الموظفين تصاعدياً' :
                                        sortValue === 'employees_count_desc' ? 'الموظفين تنازلياً' :
                                        sortValue === 'grace_period_asc' ? 'السماح تصاعدياً' :
                                        sortValue === 'grace_period_desc' ? 'السماح تنازلياً' : 'الاسم تصاعدياً'
                                    }
                                </span>
                                <button onClick={() => handleSortChange('name_asc')} className="hover:text-accent-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {shiftsData.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
                    <Clock size={40} className="mx-auto mb-3 opacity-40 text-primary-600 dark:text-primary-400" />
                    <p className="font-bold">لا توجد شفتات مطابقة للبحث أو التصفية الحالية</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {shiftsData.map((shift) => {
                            // Calculate percentage for SVG ring
                            const totalAssigned = stats?.total_assigned_employees ?? 0;
                            const empCount = shift.employees_count ?? 0;
                            const percentage = totalAssigned > 0 ? (empCount / totalAssigned) * 100 : 0;
                            const radius = 22;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

                            return (
                                <div key={shift.id} className="relative erp-premium-card group overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 transition-all duration-300 hover:shadow-md">
                                    <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-primary-500/5 to-transparent rounded-br-[100px] -z-0" />
                                    
                                    <div className="relative z-10 flex justify-between items-start mb-5">
                                        {/* Visual SVG Progress Ring */}
                                        <div className="relative flex items-center justify-center">
                                            <svg className="w-14 h-14 transform -rotate-90">
                                                <circle
                                                    cx="28"
                                                    cy="28"
                                                    r={radius}
                                                    className="stroke-slate-100 dark:stroke-slate-800"
                                                    strokeWidth="3.5"
                                                    fill="transparent"
                                                />
                                                <circle
                                                    cx="28"
                                                    cy="28"
                                                    r={radius}
                                                    className="stroke-primary-500 dark:stroke-primary-400 transition-all duration-550 ease-out"
                                                    strokeWidth="3.5"
                                                    fill="transparent"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={strokeDashoffset}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute flex items-center justify-center text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 w-9 h-9 rounded-full">
                                                <Clock size={18} strokeWidth={1.5} />
                                            </div>
                                        </div>
                                        
                                        <ActionMenu shift={shift} onEdit={openEdit} onDelete={setDeleteShift} />
                                    </div>
                                    
                                    <div className="relative z-10 mb-6">
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-center gap-2">
                                            {shift.name}
                                            {!shift.is_active && (
                                                <span className="text-[10px] bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 px-2.5 py-0.5 rounded-full font-bold border border-accent-100 dark:border-accent-500/20">غير فعال</span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-2 mb-2 font-sans animate-fade-in" dir="rtl">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800">{formatTime(shift.start_time)}</span>
                                            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold">إلى</span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800">{formatTime(shift.end_time)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold">
                                                <AlertCircle size={14} className="text-amber-500" />
                                                <span>السماح: {shift.grace_period_minutes} دقيقة</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold font-sans">
                                                <Users size={14} className="text-primary-500 dark:text-primary-400" />
                                                <span>الموظفون: {shift.employees_count ?? 0}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => openEdit(shift)} className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-500/25 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        <Pagination data={shifts} />
                    </div>
                </div>
            )}

            {/* Add Shift Modal */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة شفت جديد">
                <form onSubmit={handleStore} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الاسم <span className="text-accent-500">*</span></label>
                        <input type="text" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-450 dark:focus:ring-primary-500 dark:text-white font-semibold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">وقت البدء <span className="text-accent-500">*</span></label>
                            <input type="time" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-450 dark:focus:ring-primary-500 dark:text-white font-semibold font-sans" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">وقت الانتهاء <span className="text-accent-500">*</span></label>
                            <input type="time" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-450 dark:focus:ring-primary-500 dark:text-white font-semibold font-sans" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">فترة السماح (بالدقائق) <span className="text-accent-500">*</span></label>
                        <input type="number" min="0" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-455 dark:focus:ring-primary-500 dark:text-white font-semibold font-sans" value={form.grace_period_minutes} onChange={e => setForm({ ...form, grace_period_minutes: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="add_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-primary-600 rounded border-slate-305 dark:border-slate-800 focus:ring-primary-500 dark:bg-slate-950" />
                        <label htmlFor="add_active" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">شفت فعال</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-5 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl disabled:opacity-60 transition-colors shadow-sm dark:bg-primary-600 dark:hover:bg-primary-700">حفظ</button>
                    </div>
                </form>
            </Modal>

            {/* Edit Shift Modal */}
            <Modal isOpen={!!editShift} onClose={() => setEditShift(null)} title="تعديل الشفت">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الاسم <span className="text-accent-500">*</span></label>
                        <input type="text" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-450 dark:focus:ring-primary-500 dark:text-white font-semibold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">وقت البدء <span className="text-accent-500">*</span></label>
                            <input type="time" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-450 dark:focus:ring-primary-500 dark:text-white font-semibold font-sans" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">وقت الانتهاء <span className="text-accent-500">*</span></label>
                            <input type="time" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-450 dark:focus:ring-primary-500 dark:text-white font-semibold font-sans" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">فترة السماح (بالدقائق) <span className="text-accent-500">*</span></label>
                        <input type="number" min="0" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-455 dark:focus:ring-primary-500 dark:text-white font-semibold font-sans" value={form.grace_period_minutes} onChange={e => setForm({ ...form, grace_period_minutes: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="edit_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-primary-600 rounded border-slate-305 dark:border-slate-800 focus:ring-primary-500 dark:bg-slate-950" />
                        <label htmlFor="edit_active" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">شفت فعال</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setEditShift(null)} className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-5 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl disabled:opacity-60 transition-colors shadow-sm dark:bg-primary-600 dark:hover:bg-primary-700">تعديل</button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal isOpen={!!deleteShift} onClose={() => setDeleteShift(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-4 animate-scale-in">
                    <div className="w-14 h-14 rounded-full bg-accent-50 dark:bg-accent-500/10 flex items-center justify-center">
                        <AlertTriangle size={28} className="text-accent-550 dark:text-accent-400 animate-pulse" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-850 dark:text-white mb-1">هل أنت متأكد من الحذف؟</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">سيتم حذف الشفت "<span className="font-bold text-accent-500">{deleteShift?.name}</span>".</p>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setDeleteShift(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold">إلغاء</button>
                        <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-bold text-white bg-accent-500 hover:bg-accent-600 rounded-2xl transition-colors font-semibold">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
