import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Search, Plus, Building, Users, FolderTree, ChevronRight,
    ChevronDown, Edit2, Trash2, MoreVertical, X, Check, AlertTriangle, Save,
    SlidersHorizontal, RotateCcw, Filter
} from 'lucide-react';

// ─── Tree Node Component ───────────────────────────────────────────────────────
function TreeNode({ node, depth = 0 }) {
    const [open, setOpen] = useState(depth < 1);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className={`${depth > 0 ? 'mr-5 border-r-2 border-slate-100 dark:border-slate-800/80 hover:border-primary-500/25 dark:hover:border-primary-500/35 transition-colors duration-300 pr-3' : ''}`}>
            <div
                className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer group transition-all duration-300 hover:-translate-x-1 hover:shadow-sm hover:shadow-primary-500/5"
                onClick={() => hasChildren && setOpen(!open)}
            >
                <span className="text-slate-400 dark:text-slate-500 w-4 flex-shrink-0">
                    {hasChildren
                        ? (open ? <ChevronDown size={14} className="transition-transform duration-200 group-hover:scale-110" /> : <ChevronRight size={14} className="transition-transform duration-200 group-hover:scale-110" />)
                        : <span className="block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-primary-500 dark:group-hover:bg-primary-450 transition-colors duration-300 mx-auto" />}
                </span>
                <Building size={14} className={`transition-all duration-300 group-hover:scale-110 ${depth === 0 ? 'text-primary-500 dark:text-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-350' : 'text-slate-405 dark:text-slate-500 group-hover:text-primary-500 dark:group-hover:text-primary-400'}`} />
                <span className={`text-sm font-bold transition-colors ${depth === 0 ? 'text-slate-800 dark:text-white group-hover:text-primary-650 dark:group-hover:text-primary-400' : 'text-slate-650 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100'}`}>
                    {node.name}
                </span>
            </div>
            {open && hasChildren && (
                <div className="mt-0.5 space-y-0.5">
                    {node.children.map(child => (
                        <TreeNode key={child.id} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

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
                    <div className="p-6 text-slate-700 dark:text-slate-300">{children}</div>
                </div>
            </div>
        </div>
    );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ dept, onEdit, onDelete }) {
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
                        onClick={() => { onEdit(dept); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-700 dark:hover:text-primary-450 hover:pr-5 transition-all duration-200"
                    >
                        <Edit2 size={14} className="text-primary-500" /> تعديل القسم
                    </button>
                    <button
                        onClick={() => { onDelete(dept); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-950/20 hover:pr-5 transition-all duration-200"
                    >
                        <Trash2 size={14} className="text-accent-500" /> حذف القسم
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
                عرض {data.from} إلى {data.to} من أصل {data.total} قسم
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
export default function DepartmentsIndex({ departments, tree, parentOptions, filters }) {
    const { flash } = usePage().props;

    const [view, setView]           = useState('grid'); // 'grid' | 'tree'
    const [searchValue, setSearch]  = useState(filters?.search ?? '');
    const [typeFilter, setTypeFilter] = useState(filters?.type ?? 'all');
    const [parentFilter, setParentFilter] = useState(filters?.parent_filter_id ?? 'all');
    const [staffFilter, setStaffFilter] = useState(filters?.staff_range ?? 'all');
    const [sortBy, setSortBy]       = useState(filters?.sort_by ?? 'all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const [showAdd, setShowAdd]     = useState(false);
    const [editDept, setEditDept]   = useState(null);
    const [deleteDept, setDeleteDept] = useState(null);
    const [form, setForm]           = useState({ name: '', parent_id: '' });
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
            type: newFilters.type !== 'all' ? newFilters.type : undefined,
            parent_filter_id: newFilters.parent_filter_id !== 'all' ? newFilters.parent_filter_id : undefined,
            staff_range: newFilters.staff_range !== 'all' ? newFilters.staff_range : undefined,
            sort_by: newFilters.sort_by !== 'all' ? newFilters.sort_by : undefined,
        };
        router.get(route('hr.departments'), queryParams, { preserveState: true, replace: true });
    };

    // Live search with debounce
    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            applyFilters({ search: val, type: typeFilter, parent_filter_id: parentFilter, staff_range: staffFilter, sort_by: sortBy });
        }, 400);
    };

    const handleClearFilters = () => {
        setSearch('');
        setTypeFilter('all');
        setParentFilter('all');
        setStaffFilter('all');
        setSortBy('all');
        router.get(route('hr.departments'), {}, { preserveState: true, replace: true });
    };

    const activeFiltersCount = 
        (typeFilter !== 'all' ? 1 : 0) + 
        (parentFilter !== 'all' ? 1 : 0) + 
        (staffFilter !== 'all' ? 1 : 0) + 
        (sortBy !== 'all' ? 1 : 0);

    const openAdd = () => { setForm({ name: '', parent_id: '' }); setShowAdd(true); };
    const openEdit = (dept) => { setForm({ name: dept.name, parent_id: dept.parent_id ?? '' }); setEditDept(dept); };

    const handleStore = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('hr.departments.store'), form, {
            onFinish: () => { setProcessing(false); setShowAdd(false); }
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.put(route('hr.departments.update', editDept.id), form, {
            onFinish: () => { setProcessing(false); setEditDept(null); }
        });
    };

    const handleDelete = () => {
        router.delete(route('hr.departments.destroy', deleteDept.id), {
            onFinish: () => setDeleteDept(null)
        });
    };

    const deptData = departments?.data ?? [];

    return (
        <AdminLayout activeMenu="الأقسام والإدارات">
            <Head title="إدارة الأقسام | النظام الإداري" />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
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
                        <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">إدارة الأقسام والإدارات</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">بناء وتعديل الهيكل التنظيمي للمدرسة</p>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <button
                            onClick={() => setView(view === 'grid' ? 'tree' : 'grid')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all shadow-sm text-sm font-bold"
                        >
                            <FolderTree size={16} className="text-slate-500 dark:text-slate-400" />
                            <span>{view === 'grid' ? 'عرض شجري' : 'عرض البطاقات'}</span>
                        </button>
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95"
                        >
                            <Plus size={18} /> 
                            <span>إضافة قسم جديد</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tree View ── */}
            {view === 'tree' ? (
                <div className="bg-white dark:bg-[#121820] rounded-3xl border border-slate-100 dark:border-primary-500/10 shadow-sm p-6">
                    <h2 className="text-base font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                        <FolderTree size={18} className="text-primary-500 dark:text-primary-400" /> الهيكل التنظيمي الشجري
                    </h2>
                    {tree && tree.length > 0
                        ? tree.map(node => <TreeNode key={node.id} node={node} depth={0} />)
                        : <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">لا توجد أقسام بعد</p>}
                </div>
            ) : (
                <>
                    <div className="mb-6 flex flex-col gap-4">
                        {/* Search and Toggle Filters */}
                        <div className="flex items-center gap-3">
                            <div className="group relative max-w-md flex-1 flex items-center bg-slate-100/60 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 focus-within:bg-white dark:focus-within:bg-[#121820] border border-transparent dark:border-slate-800 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/10 rounded-2xl transition-all p-1">
                                <div className="flex-1 relative flex items-center">
                                    <Search size={18} className="absolute right-3.5 text-slate-400 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 group-focus-within:scale-110 transition-all duration-300" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="ابحث عن قسم..."
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
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                    {/* 1. Department Type */}
                                    <div className="flex flex-col gap-1.5 text-right">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">نوع القسم</label>
                                        <select 
                                            value={typeFilter} 
                                            onChange={e => {
                                                setTypeFilter(e.target.value);
                                                applyFilters({ type: e.target.value, parent_filter_id: parentFilter, staff_range: staffFilter, sort_by: sortBy });
                                            }}
                                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all cursor-pointer"
                                        >
                                            <option value="all">الكل</option>
                                            <option value="main">قسم رئيسي (إدارة)</option>
                                            <option value="sub">قسم فرعي</option>
                                        </select>
                                    </div>

                                    {/* 2. Parent Department */}
                                    <div className="flex flex-col gap-1.5 text-right">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">القسم الرئيسي الأب</label>
                                        <select 
                                            value={parentFilter} 
                                            onChange={e => {
                                                setParentFilter(e.target.value);
                                                applyFilters({ type: typeFilter, parent_filter_id: e.target.value, staff_range: staffFilter, sort_by: sortBy });
                                            }}
                                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all cursor-pointer"
                                        >
                                            <option value="all">الكل</option>
                                            {parentOptions?.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 3. Employee Density */}
                                    <div className="flex flex-col gap-1.5 text-right">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">كثافة الموظفين</label>
                                        <select 
                                            value={staffFilter} 
                                            onChange={e => {
                                                setStaffFilter(e.target.value);
                                                applyFilters({ type: typeFilter, parent_filter_id: parentFilter, staff_range: e.target.value, sort_by: sortBy });
                                            }}
                                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all cursor-pointer"
                                        >
                                            <option value="all">الكل</option>
                                            <option value="empty">أقسام فارغة (0 موظف)</option>
                                            <option value="low">كثافة منخفضة (1-2 موظفين)</option>
                                            <option value="medium">كثافة متوسطة (3-9 موظفين)</option>
                                            <option value="high">كثافة عالية (10+ موظفين)</option>
                                        </select>
                                    </div>

                                    {/* 4. Sort By */}
                                    <div className="flex flex-col gap-1.5 text-right">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">ترتيب حسب</label>
                                        <select 
                                            value={sortBy} 
                                            onChange={e => {
                                                setSortBy(e.target.value);
                                                applyFilters({ type: typeFilter, parent_filter_id: parentFilter, staff_range: staffFilter, sort_by: e.target.value });
                                            }}
                                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all cursor-pointer"
                                        >
                                            <option value="all">الافتراضي (حسب الهيكل)</option>
                                            <option value="name_asc">الاسم (أبجدي تصاعدي)</option>
                                            <option value="name_desc">الاسم (أبجدي تنازلي)</option>
                                            <option value="employees_desc">عدد الموظفين (الأكثر أولاً)</option>
                                            <option value="employees_asc">عدد الموظفين (الأقل أولاً)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active Filter Badges */}
                        {(searchValue || typeFilter !== 'all' || parentFilter !== 'all' || staffFilter !== 'all' || sortBy !== 'all') && (
                            <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-slate-100 dark:border-primary-500/5">
                                <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-500 dark:text-slate-400" dir="rtl">
                                    <span>المرشحات النشطة:</span>
                                    {searchValue && (
                                        <span className="inline-flex items-center gap-1 bg-white dark:bg-[#121820] text-slate-750 dark:text-slate-350 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                                            <span>البحث: "{searchValue}"</span>
                                            <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-650" onClick={() => handleSearch('')} />
                                        </span>
                                    )}
                                    {typeFilter !== 'all' && (
                                        <span className="inline-flex items-center gap-1 bg-white dark:bg-[#121820] text-slate-750 dark:text-slate-350 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                                            <span>النوع: {typeFilter === 'main' ? 'إدارة رئيسية' : 'قسم فرعي'}</span>
                                            <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-650" onClick={() => {
                                                setTypeFilter('all');
                                                applyFilters({ type: 'all', parent_filter_id: parentFilter, staff_range: staffFilter, sort_by: sortBy });
                                            }} />
                                        </span>
                                    )}
                                    {parentFilter !== 'all' && (
                                        <span className="inline-flex items-center gap-1 bg-white dark:bg-[#121820] text-slate-750 dark:text-slate-350 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                                            <span>القسم الأب: {parentOptions?.find(p => String(p.id) === String(parentFilter))?.name}</span>
                                            <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-650" onClick={() => {
                                                setParentFilter('all');
                                                applyFilters({ type: typeFilter, parent_filter_id: 'all', staff_range: staffFilter, sort_by: sortBy });
                                            }} />
                                        </span>
                                    )}
                                    {staffFilter !== 'all' && (
                                        <span className="inline-flex items-center gap-1 bg-white dark:bg-[#121820] text-slate-750 dark:text-slate-350 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                                            <span>الكثافة: {
                                                staffFilter === 'empty' ? 'أقسام فارغة' :
                                                staffFilter === 'low' ? 'كثافة منخفضة (1-2)' :
                                                staffFilter === 'medium' ? 'كثافة متوسطة (3-9)' : 'كثافة عالية (10+)'
                                            }</span>
                                            <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-650" onClick={() => {
                                                setStaffFilter('all');
                                                applyFilters({ type: typeFilter, parent_filter_id: parentFilter, staff_range: 'all', sort_by: sortBy });
                                            }} />
                                        </span>
                                    )}
                                    {sortBy !== 'all' && (
                                        <span className="inline-flex items-center gap-1 bg-white dark:bg-[#121820] text-slate-750 dark:text-slate-350 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                                            <span>الترتيب: {
                                                sortBy === 'name_asc' ? 'الاسم تصاعدياً' :
                                                sortBy === 'name_desc' ? 'الاسم تنازلياً' :
                                                sortBy === 'employees_desc' ? 'الموظفين الأكثر أولاً' : 'الموظفين الأقل أولاً'
                                            }</span>
                                            <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-650" onClick={() => {
                                                setSortBy('all');
                                                applyFilters({ type: typeFilter, parent_filter_id: parentFilter, staff_range: staffFilter, sort_by: 'all' });
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
                    {deptData.length === 0 ? (
                        <div className="text-center py-16 text-slate-450 dark:text-slate-500">
                            <Building size={40} className="mx-auto mb-3 opacity-40" />
                            <p className="font-medium">لا توجد أقسام مطابقة</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-sm overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {deptData.map((dept) => (
                                    <div
                                        key={dept.id}
                                        className="relative bg-white dark:bg-[#121820]/40 rounded-3xl border border-slate-100 dark:border-slate-800/85 p-6 shadow-sm hover:shadow-xl dark:hover:shadow-black/30 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-slate-200 dark:hover:border-primary-500/20 transition-all duration-300 group overflow-hidden"
                                    >
                                        {/* Dot Matrix Premium Background Pattern */}
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
                                                <Building size={22} strokeWidth={2.5} />
                                            </div>
                                            <ActionMenu dept={dept} onEdit={openEdit} onDelete={setDeleteDept} />
                                        </div>
                                        
                                        <div className="relative z-10 mb-6 transition-transform duration-300 group-hover:translate-x-1">
                                            <h3 className="text-lg font-black text-dark-900 dark:text-white mb-1.5 group-hover:text-primary-650 dark:group-hover:text-primary-400 transition-colors">{dept.name}</h3>
                                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 w-fit px-2.5 py-1.5 rounded-xl border border-slate-100/50 dark:border-slate-800/60">
                                                <FolderTree size={12} className="text-slate-350 dark:text-slate-600" />
                                                <span>{dept.parent_name ? `يتبع: ${dept.parent_name}` : 'قسم رئيسي (إدارة)'}</span>
                                            </p>
                                        </div>
                                        
                                        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100/80 dark:border-slate-800/80">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-450 border border-primary-100/30 dark:border-primary-900/20 text-[10px] font-bold group-hover:bg-primary-500 dark:group-hover:bg-primary-600 group-hover:text-white dark:group-hover:text-white transition-colors duration-300"><Users size={12}/></span>
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">{dept.employees_count} موظف</span>
                                            </div>
                                            <button
                                                onClick={() => openEdit(dept)}
                                                className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-primary-500 dark:hover:bg-primary-600 hover:text-white dark:hover:text-white transition-all duration-300 border border-transparent dark:border-slate-850 hover:shadow-md hover:shadow-primary-500/10 dark:hover:shadow-none hover:scale-105 active:scale-95"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination data={departments} />
                        </div>
                    )}
                </>
            )}

            {/* ── Add Modal ── */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة قسم جديد">
                <form onSubmit={handleStore} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">اسم القسم <span className="text-accent-500">*</span></label>
                        <div className="relative flex items-center group">
                            <Building size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <input
                                type="text"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl pr-11 pl-4 py-3.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/5 outline-none transition-all font-semibold"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">القسم الأب (اختياري)</label>
                        <div className="relative flex items-center group">
                            <FolderTree size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <select
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-150 rounded-2xl pr-11 pl-10 py-3.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/5 outline-none transition-all font-bold appearance-none cursor-pointer"
                                value={form.parent_id}
                                onChange={e => setForm({ ...form, parent_id: e.target.value })}
                            >
                                <option value="">— قسم رئيسي —</option>
                                {parentOptions?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute left-4 text-slate-450 dark:text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-sm font-bold text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 dark:shadow-none hover:shadow-lg hover:shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5">
                            <Plus size={16} />
                            <span>{processing ? 'جاري الحفظ...' : 'حفظ القسم'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Edit Modal ── */}
            <Modal isOpen={!!editDept} onClose={() => setEditDept(null)} title="تعديل القسم">
                <form onSubmit={handleUpdate} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">اسم القسم <span className="text-accent-500">*</span></label>
                        <div className="relative flex items-center group">
                            <Building size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <input
                                type="text"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl pr-11 pl-4 py-3.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/5 outline-none transition-all font-semibold"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">القسم الأب (اختياري)</label>
                        <div className="relative flex items-center group">
                            <FolderTree size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <select
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-150 rounded-2xl pr-11 pl-10 py-3.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/5 outline-none transition-all font-bold appearance-none cursor-pointer"
                                value={form.parent_id}
                                onChange={e => setForm({ ...form, parent_id: e.target.value })}
                            >
                                <option value="">— قسم رئيسي —</option>
                                {parentOptions?.filter(p => p.id !== editDept?.id).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute left-4 text-slate-450 dark:text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setEditDept(null)} className="px-5 py-2.5 text-sm font-bold text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 dark:shadow-none hover:shadow-lg hover:shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5">
                            <Save size={16} />
                            <span>{processing ? 'جاري التعديل...' : 'تحديث البيانات'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal isOpen={!!deleteDept} onClose={() => setDeleteDept(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-950/20 flex items-center justify-center animate-pulse">
                        <AlertTriangle size={32} className="text-accent-500 dark:text-accent-400" />
                    </div>
                    <div>
                        <p className="font-bold text-dark-900 dark:text-white text-lg mb-1">تأكيد الحذف</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">هل أنت متأكد من حذف القسم؟ سيتم حذف "<span className="font-bold text-accent-600 dark:text-accent-400">{deleteDept?.name}</span>" بشكل نهائي.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setDeleteDept(null)} className="flex-1 py-3 text-sm font-bold text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button onClick={handleDelete} className="flex-1 py-3 text-sm font-bold text-white bg-accent-500 dark:bg-accent-600 hover:bg-accent-600 dark:hover:bg-accent-750 rounded-2xl shadow-md shadow-accent-500/10 dark:shadow-none transition-all">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
