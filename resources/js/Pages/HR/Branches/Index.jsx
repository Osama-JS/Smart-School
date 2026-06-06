import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Search, Plus, MapPin, Phone, Users, Edit2, Trash2,
    MoreVertical, X, Check, AlertTriangle, Store, Compass, Crosshair, Save, SlidersHorizontal, RotateCcw
} from 'lucide-react';

// ─── Modal Component ───────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#090d16]/50 dark:bg-black/60 backdrop-blur-md transition-all duration-300" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#121820] rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-100 dark:border-slate-800/80 animate-scale-in">
                {/* Soft ambient brand glow */}
                <div className="absolute -right-10 -top-10 w-36 h-36 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-2xl pointer-events-none -z-10" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800/60">
                        <div className="text-lg font-bold text-dark-900 dark:text-white">{title}</div>
                        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-400 dark:text-slate-500 transition-colors">✕</button>
                    </div>
                    <div className="p-6 text-slate-700 dark:text-slate-300 overflow-y-auto max-h-[75vh]">{children}</div>
                </div>
            </div>
        </div>
    );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ branch, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 p-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-900/60 transition-all inline-flex border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800"
            >
                <MoreVertical size={16} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1.5 w-40 bg-white dark:bg-[#121820] rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/60 border border-slate-100 dark:border-slate-800 z-20 overflow-hidden animate-scale-in">
                    <button
                        onClick={() => { onEdit(branch); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-700 dark:hover:text-primary-450 hover:pr-5 transition-all duration-200"
                    >
                        <Edit2 size={14} className="text-primary-500" /> تعديل الفرع
                    </button>
                    <button
                        onClick={() => { onDelete(branch); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-950/20 hover:pr-5 transition-all duration-200"
                    >
                        <Trash2 size={14} className="text-accent-500" /> حذف الفرع
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ data }) {
    if (!data || data.last_page <= 1) return null;
    return (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-855 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10 flex-wrap gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                عرض {data.from} إلى {data.to} من أصل {data.total} فرع
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
                {data.links.map((link, i) => (
                    <button
                        key={i}
                        disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-300 ${
                            link.active
                                ? 'bg-primary-500 text-white border-primary-500 dark:bg-primary-600 dark:border-primary-600 shadow-md shadow-primary-500/20 dark:shadow-none hover:scale-105 active:scale-95'
                                : link.url
                                    ? 'bg-white dark:bg-[#121820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary-500 dark:hover:border-primary-500/50 hover:text-primary-650 dark:hover:text-primary-400 hover:scale-105 active:scale-95'
                                    : 'bg-white dark:bg-[#121820]/40 text-slate-350 dark:text-slate-600 border-slate-100 dark:border-slate-850/50 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BranchesIndex({ branches, filters }) {
    const { flash, errors } = usePage().props;

    const [searchValue, setSearch]  = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [staffFilter, setStaffFilter] = useState(filters?.staff_range ?? 'all');
    const [sortBy, setSortBy]       = useState(filters?.sort_by ?? 'all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const [showAdd, setShowAdd]     = useState(false);
    const [editBranch, setEditBranch] = useState(null);
    const [deleteBranch, setDeleteBranch] = useState(null);
    const [form, setForm]           = useState({
        name: '', address: '', phone: '', is_active: true,
        latitude: '', longitude: '', radius_meters: 100
    });
    const [processing, setProcessing] = useState(false);
    const searchTimeout = useRef(null);
    const searchInputRef = useRef(null);

    // Global shortcut key listener to focus search when '/' is pressed
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/') {
                const activeEl = document.activeElement;
                const isEditable = activeEl && (
                    activeEl.tagName === 'INPUT' ||
                    activeEl.tagName === 'TEXTAREA' ||
                    activeEl.tagName === 'SELECT' ||
                    activeEl.isContentEditable
                );

                if (!isEditable) {
                    e.preventDefault();
                    searchInputRef.current?.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Filter Application Handler
    const applyFilters = (newFilters) => {
        const queryParams = {
            search: newFilters.search !== undefined ? newFilters.search : searchValue,
            status: newFilters.status !== 'all' ? newFilters.status : undefined,
            staff_range: newFilters.staff_range !== 'all' ? newFilters.staff_range : undefined,
            sort_by: newFilters.sort_by !== 'all' ? newFilters.sort_by : undefined,
        };
        router.get(route('hr.branches'), queryParams, { preserveState: true, replace: true });
    };

    // Live search with debounce
    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            applyFilters({ search: val, status: statusFilter, staff_range: staffFilter, sort_by: sortBy });
        }, 400);
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setStaffFilter('all');
        setSortBy('all');
        router.get(route('hr.branches'), {}, { preserveState: true, replace: true });
    };

    const activeFiltersCount = 
        (statusFilter !== 'all' ? 1 : 0) + 
        (staffFilter !== 'all' ? 1 : 0) + 
        (sortBy !== 'all' ? 1 : 0);

    const openAdd = () => {
        setForm({
            name: '', address: '', phone: '', is_active: true,
            latitude: '', longitude: '', radius_meters: 100
        });
        setShowAdd(true);
    };

    const openEdit = (b) => {
        setForm({
            name: b.name,
            address: b.address || '',
            phone: b.phone || '',
            is_active: b.is_active,
            latitude: b.latitude !== null ? b.latitude : '',
            longitude: b.longitude !== null ? b.longitude : '',
            radius_meters: b.radius_meters !== null ? b.radius_meters : 100
        });
        setEditBranch(b);
    };

    const handleStore = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('hr.branches.store'), form, {
            onFinish: () => { setProcessing(false); setShowAdd(false); }
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.put(route('hr.branches.update', editBranch.id), form, {
            onFinish: () => { setProcessing(false); setEditBranch(null); }
        });
    };

    const handleDelete = () => {
        router.delete(route('hr.branches.destroy', deleteBranch.id), {
            onFinish: () => setDeleteBranch(null)
        });
    };

    const branchesData = branches?.data ?? [];

    return (
        <AdminLayout activeMenu="الفروع">
            <Head title="إدارة الفروع | النظام الإداري" />

            {/* Flash Success/Error */}
            {flash?.success && (
                <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down">
                    <Check size={18} className="text-emerald-600" /> {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down">
                    <AlertTriangle size={18} className="text-rose-650" /> {flash.error}
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
                        <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">إدارة فروع المدرسة</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">التحكم في فروع ومقرات عمليات مدارس القيم وإعدادات الحضور الجغرافي</p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95 self-end sm:self-auto"
                    >
                        <Plus size={18} /> 
                        <span>إضافة فرع جديد</span>
                    </button>
                </div>
            </div>

            {/* ── Search & Filter Controls ── */}
            <div className="mb-6 flex flex-col gap-4">
                {/* Search input with toggle filters */}
                <div className="flex items-center gap-3">
                    <div className="group relative max-w-md flex-1 flex items-center bg-slate-100/60 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 focus-within:bg-white dark:focus-within:bg-[#121820] border border-transparent dark:border-slate-800 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/10 rounded-2xl transition-all p-1">
                        <div className="flex-1 relative flex items-center">
                            <Search size={18} className="absolute right-3.5 text-slate-400 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 group-focus-within:scale-110 transition-all duration-300" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="ابحث عن فرع بالاسم أو العنوان أو الهاتف..."
                                className="w-full bg-transparent border-none pr-10 pl-10 py-2.5 text-sm outline-none text-dark-900 dark:text-slate-100 font-bold"
                                value={searchValue}
                                onChange={e => handleSearch(e.target.value)}
                            />
                            {!searchValue && (
                                <kbd className="absolute left-3.5 px-1.5 py-0.5 text-[10px] font-sans font-bold text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700/60 rounded pointer-events-none group-focus-within:opacity-0 transition-opacity duration-200">
                                    /
                                </kbd>
                            )}
                            {searchValue && (
                                <button
                                    type="button"
                                    onClick={() => handleSearch('')}
                                    className="absolute left-3 p-1 rounded-lg text-slate-450 dark:text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-all active:scale-90"
                                >
                                    <X size={14} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Advanced Filter Toggle Button */}
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`h-12 px-4 rounded-2xl text-sm font-bold border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                            showAdvancedFilters || activeFiltersCount > 0
                                ? 'bg-primary-50 border-primary-200 dark:border-primary-900/30 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400'
                                : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                        }`}
                    >
                        <SlidersHorizontal size={15} />
                        <span>تصفية</span>
                        {activeFiltersCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center font-bold">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Advanced Inline Filter Panel */}
                {showAdvancedFilters && (
                    <div className="p-6 bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-sm relative animate-scale-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* 1. Status Filter */}
                            <div className="flex flex-col gap-1.5 text-right">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">حالة الفرع</label>
                                <select 
                                    value={statusFilter} 
                                    onChange={e => {
                                        setStatusFilter(e.target.value);
                                        applyFilters({ status: e.target.value, staff_range: staffFilter, sort_by: sortBy });
                                    }}
                                    className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all cursor-pointer"
                                >
                                    <option value="all">الكل</option>
                                    <option value="active">نشط</option>
                                    <option value="inactive">مغلق</option>
                                </select>
                            </div>

                            {/* 2. Employee Density */}
                            <div className="flex flex-col gap-1.5 text-right">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">كثافة الموظفين</label>
                                <select 
                                    value={staffFilter} 
                                    onChange={e => {
                                        setStaffFilter(e.target.value);
                                        applyFilters({ status: statusFilter, staff_range: e.target.value, sort_by: sortBy });
                                    }}
                                    className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all cursor-pointer"
                                >
                                    <option value="all">الكل</option>
                                    <option value="empty">فروع شاغرة (0 موظف)</option>
                                    <option value="low">كثافة منخفضة (1 - 5 موظفين)</option>
                                    <option value="medium">كثافة متوسطة (6 - 15 موظفاً)</option>
                                    <option value="high">كثافة عالية (16+ موظفاً)</option>
                                </select>
                            </div>

                            {/* 3. Sort By */}
                            <div className="flex flex-col gap-1.5 text-right">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">ترتيب حسب</label>
                                <select 
                                    value={sortBy} 
                                    onChange={e => {
                                        setSortBy(e.target.value);
                                        applyFilters({ status: statusFilter, staff_range: staffFilter, sort_by: e.target.value });
                                    }}
                                    className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all cursor-pointer"
                                >
                                    <option value="all">الاسم (أبجدي تصاعدي)</option>
                                    <option value="name_desc">الاسم (أبجدي تنازلي)</option>
                                    <option value="employees_desc">عدد الموظفين (الأكثر أولاً)</option>
                                    <option value="employees_asc">عدد الموظفين (الأقل أولاً)</option>
                                    <option value="active_first">الفروع النشطة أولاً</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Filter Badges */}
                {(searchValue || statusFilter !== 'all' || staffFilter !== 'all' || sortBy !== 'all') && (
                    <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-slate-100 dark:border-primary-500/5">
                        <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-500 dark:text-slate-400" dir="rtl">
                            <span>المرشحات النشطة:</span>
                            {searchValue && (
                                <span className="inline-flex items-center gap-1 bg-white dark:bg-[#121820] text-slate-750 dark:text-slate-350 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                                    <span>البحث: "{searchValue}"</span>
                                    <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-650" onClick={() => handleSearch('')} />
                                </span>
                            )}
                            {statusFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1 bg-white dark:bg-[#121820] text-slate-750 dark:text-slate-350 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                                    <span>الحالة: {statusFilter === 'active' ? 'نشط' : 'مغلق'}</span>
                                    <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-650" onClick={() => {
                                        setStatusFilter('all');
                                        applyFilters({ status: 'all', staff_range: staffFilter, sort_by: sortBy });
                                    }} />
                                </span>
                            )}
                            {staffFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1 bg-white dark:bg-[#121820] text-slate-750 dark:text-slate-350 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                                    <span>الكثافة: {
                                        staffFilter === 'empty' ? 'شاغرة (0)' :
                                        staffFilter === 'low' ? 'منخفضة (1-5)' :
                                        staffFilter === 'medium' ? 'متوسطة (6-15)' : 'عالية (16+)'
                                    }</span>
                                    <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-650" onClick={() => {
                                        setStaffFilter('all');
                                        applyFilters({ status: statusFilter, staff_range: 'all', sort_by: sortBy });
                                    }} />
                                </span>
                            )}
                            {sortBy !== 'all' && (
                                <span className="inline-flex items-center gap-1 bg-white dark:bg-[#121820] text-slate-750 dark:text-slate-350 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                                    <span>الترتيب: {
                                        sortBy === 'name_desc' ? 'الاسم تنازلياً' :
                                        sortBy === 'employees_desc' ? 'الموظفين الأكثر أولاً' :
                                        sortBy === 'employees_asc' ? 'الموظفين الأقل أولاً' : 'النشطة أولاً'
                                    }</span>
                                    <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-650" onClick={() => {
                                        setSortBy('all');
                                        applyFilters({ status: statusFilter, staff_range: staffFilter, sort_by: 'all' });
                                    }} />
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleClearFilters}
                            className="text-xs font-extrabold text-accent-500 hover:text-accent-600 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-accent-50 dark:hover:bg-accent-950/20 transition-all active:scale-95 cursor-pointer"
                        >
                            <RotateCcw size={12} />
                            <span>إعادة ضبط المرشحات</span>
                        </button>
                    </div>
                )}
            </div>

            {/* ── Cards Grid ── */}
            {branchesData.length === 0 ? (
                <div className="text-center py-16 text-slate-450 dark:text-slate-500 bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-sm">
                    <Store size={40} className="mx-auto mb-3 opacity-40 text-primary-500" />
                    <p className="font-bold">لا توجد فروع مطابقة للمرشحات</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {branchesData.map((branch) => (
                            <div
                                key={branch.id}
                                className="relative bg-white dark:bg-[#121820]/40 rounded-3xl border border-slate-100 dark:border-slate-800/85 p-6 shadow-sm hover:shadow-xl dark:hover:shadow-black/30 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-slate-200 dark:hover:border-primary-500/20 transition-all duration-300 group overflow-hidden"
                            >
                                {/* Dot Matrix Background Pattern */}
                                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

                                {/* Expanding top brand line accent */}
                                <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-l from-primary-400 to-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right pointer-events-none z-20" />
                                {/* Static default subtle top border */}
                                <div className="absolute top-0 right-0 left-0 h-[3px] bg-slate-100 dark:bg-slate-800 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none z-10" />

                                {/* Glowing ambient light */}
                                <div className="absolute -left-6 -top-6 w-24 h-24 bg-primary-500/5 dark:bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/5 to-transparent rounded-bl-[100px] pointer-events-none -z-0" />
                                
                                <div className="relative z-10 flex justify-between items-start mb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/30 dark:from-primary-950/20 dark:to-primary-900/20 text-primary-600 dark:text-primary-400 shadow-inner border border-primary-100/30 dark:border-primary-900/20 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3 flex items-center justify-center">
                                        <Store size={22} strokeWidth={2.5} />
                                    </div>
                                    <ActionMenu branch={branch} onEdit={openEdit} onDelete={setDeleteBranch} />
                                </div>
                                
                                <div className="relative z-10 mb-6 transition-transform duration-300 group-hover:translate-x-1">
                                    <h3 className="text-lg font-black text-dark-900 dark:text-white mb-2.5 group-hover:text-primary-650 dark:group-hover:text-primary-400 transition-colors flex items-center gap-2">
                                        {branch.name}
                                        {branch.is_active ? (
                                            <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-100 dark:border-emerald-900/30">نشط</span>
                                        ) : (
                                            <span className="text-[10px] bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 px-2.5 py-0.5 rounded-full font-bold border border-rose-100 dark:border-rose-900/30">مغلق</span>
                                        )}
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <MapPin size={13} className="text-slate-400 dark:text-slate-500" /> 
                                            <span>{branch.address || 'غير محدد'}</span>
                                        </p>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <Phone size={13} className="text-slate-400 dark:text-slate-500" /> 
                                            <span dir="ltr">{branch.phone || 'غير محدد'}</span>
                                        </p>
                                        {/* Geolocation visual details */}
                                        {branch.latitude && branch.longitude && (
                                            <div className="mt-2.5 pt-2 border-t border-slate-100/50 dark:border-slate-800/40 flex flex-wrap gap-2">
                                                <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-900/80 text-slate-450 dark:text-slate-400 px-2 py-1 rounded-lg text-[10px] border border-slate-100 dark:border-slate-800">
                                                    <Compass size={10} />
                                                    <span>{Number(branch.latitude).toFixed(4)}, {Number(branch.longitude).toFixed(4)}</span>
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-900/80 text-slate-450 dark:text-slate-400 px-2 py-1 rounded-lg text-[10px] border border-slate-100 dark:border-slate-800">
                                                    <Crosshair size={10} />
                                                    <span>نطاق: {branch.radius_meters || 100}م</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100/80 dark:border-slate-800/80">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-450 border border-primary-100/30 dark:border-primary-900/20 text-[10px] font-bold group-hover:bg-primary-500 dark:group-hover:bg-primary-600 group-hover:text-white dark:group-hover:text-white transition-colors duration-300"><Users size={12}/></span>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">{branch.employees_count} موظف</span>
                                    </div>
                                    <button
                                        onClick={() => openEdit(branch)}
                                        className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-primary-500 dark:hover:bg-primary-600 hover:text-white dark:hover:text-white transition-all duration-300 border border-transparent dark:border-slate-850 hover:shadow-md hover:shadow-primary-500/10 dark:hover:shadow-none hover:scale-105 active:scale-95"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination data={branches} />
                </div>
            )}

            {/* ── Add Modal ── */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة فرع جديد">
                <form onSubmit={handleStore} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">اسم الفرع <span className="text-accent-500">*</span></label>
                        <div className="relative flex items-center group">
                            <Store size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <input
                                type="text"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl pr-11 pl-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">العنوان</label>
                        <div className="relative flex items-center group">
                            <MapPin size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <input
                                type="text"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl pr-11 pl-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">رقم الهاتف</label>
                        <div className="relative flex items-center group">
                            <Phone size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <input
                                type="text"
                                dir="ltr"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl pr-11 pl-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Geolocation Section */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <p className="text-xs font-black text-primary-650 dark:text-primary-400 flex items-center gap-1.5">
                            <Compass size={14} />
                            <span>إعدادات الحضور الجغرافي الذكي</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">خط العرض (Latitude)</label>
                                <input
                                    type="number"
                                    step="0.00000001"
                                    placeholder="24.7136"
                                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                    value={form.latitude}
                                    onChange={e => setForm({ ...form, latitude: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">خط الطول (Longitude)</label>
                                <input
                                    type="number"
                                    step="0.00000001"
                                    placeholder="46.6753"
                                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                    value={form.longitude}
                                    onChange={e => setForm({ ...form, longitude: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                                <Crosshair size={12} className="text-slate-400" />
                                <span>نصف قطر النطاق المسموح به للحضور (بالمتر)</span>
                            </label>
                            <input
                                type="number"
                                min="50"
                                max="50000"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                value={form.radius_meters}
                                onChange={e => setForm({ ...form, radius_meters: e.target.value })}
                            />
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">المسافة المسموحة للموظف لتسجيل الحضور عبر التطبيق من موقعه الجغرافي الفعلي.</p>
                        </div>
                    </div>

                    <div className="flex items-center pt-2">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div className="relative">
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="sr-only" />
                                <div className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out ${form.is_active ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                                <div className={`absolute top-1 right-1 bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-200 ease-in-out ${form.is_active ? '-translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-350">الفرع نشط للعمليات</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-800/40">
                        <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-sm font-bold text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 dark:shadow-none hover:shadow-lg hover:shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5">
                            <Plus size={16} />
                            <span>{processing ? 'جاري الحفظ...' : 'حفظ الفرع'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Edit Modal ── */}
            <Modal isOpen={!!editBranch} onClose={() => setEditBranch(null)} title="تعديل الفرع">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">اسم الفرع <span className="text-accent-500">*</span></label>
                        <div className="relative flex items-center group">
                            <Store size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <input
                                type="text"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl pr-11 pl-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">العنوان</label>
                        <div className="relative flex items-center group">
                            <MapPin size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <input
                                type="text"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl pr-11 pl-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">رقم الهاتف</label>
                        <div className="relative flex items-center group">
                            <Phone size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <input
                                type="text"
                                dir="ltr"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl pr-11 pl-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Geolocation Section */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <p className="text-xs font-black text-primary-650 dark:text-primary-400 flex items-center gap-1.5">
                            <Compass size={14} />
                            <span>إعدادات الحضور الجغرافي الذكي</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">خط العرض (Latitude)</label>
                                <input
                                    type="number"
                                    step="0.00000001"
                                    placeholder="24.7136"
                                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                    value={form.latitude}
                                    onChange={e => setForm({ ...form, latitude: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">خط الطول (Longitude)</label>
                                <input
                                    type="number"
                                    step="0.00000001"
                                    placeholder="46.6753"
                                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                    value={form.longitude}
                                    onChange={e => setForm({ ...form, longitude: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                                <Crosshair size={12} className="text-slate-400" />
                                <span>نصف قطر النطاق المسموح به للحضور (بالمتر)</span>
                            </label>
                            <input
                                type="number"
                                min="50"
                                max="50000"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold"
                                value={form.radius_meters}
                                onChange={e => setForm({ ...form, radius_meters: e.target.value })}
                            />
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">المسافة المسموحة للموظف لتسجيل الحضور عبر التطبيق من موقعه الجغرافي الفعلي.</p>
                        </div>
                    </div>

                    <div className="flex items-center pt-2">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div className="relative">
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="sr-only" />
                                <div className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out ${form.is_active ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                                <div className={`absolute top-1 right-1 bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-200 ease-in-out ${form.is_active ? '-translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-350">الفرع نشط للعمليات</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-800/40">
                        <button type="button" onClick={() => setEditBranch(null)} className="px-5 py-2.5 text-sm font-bold text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 dark:shadow-none hover:shadow-lg hover:shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5">
                            <Save size={16} />
                            <span>{processing ? 'جاري التعديل...' : 'تحديث البيانات'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal isOpen={!!deleteBranch} onClose={() => setDeleteBranch(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-950/20 flex items-center justify-center animate-pulse">
                        <AlertTriangle size={32} className="text-accent-500 dark:text-accent-400" />
                    </div>
                    <div>
                        <p className="font-bold text-dark-900 dark:text-white text-lg mb-1">تأكيد الحذف</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">هل أنت متأكد من حذف فرع المدرسة؟ سيتم حذف "<span className="font-bold text-accent-600 dark:text-accent-400">{deleteBranch?.name}</span>" بشكل نهائي.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setDeleteBranch(null)} className="flex-1 py-3 text-sm font-bold text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button onClick={handleDelete} className="flex-1 py-3 text-sm font-bold text-white bg-accent-500 dark:bg-accent-600 hover:bg-accent-600 dark:hover:bg-accent-750 rounded-2xl shadow-md shadow-accent-500/10 dark:shadow-none transition-all">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
