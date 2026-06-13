import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import {
    Search, Plus, ShieldCheck, Star, Users, Edit2, Trash2,
    MoreVertical, X, Check, AlertTriangle, Save, SlidersHorizontal, RotateCcw, Award, ChevronDown, Network, LayoutGrid
} from 'lucide-react';
import OrgChart from './OrgChart';

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
function ActionMenu({ grade, onEdit, onDelete }) {
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
                        onClick={() => { onEdit(grade); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-700 dark:hover:text-primary-450 hover:pr-5 transition-all duration-200"
                    >
                        <Edit2 size={14} className="text-primary-500" /> تعديل الدرجة
                    </button>
                    <button
                        onClick={() => { onDelete(grade); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-950/20 hover:pr-5 transition-all duration-200"
                    >
                        <Trash2 size={14} className="text-accent-500" /> حذف الدرجة
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
                عرض {data.from} إلى {data.to} من أصل {data.total} درجة
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

// ─── Level Badge Styles ────────────────────────────────────────────────────────
const levelColor = (level) => {
    if (level <= 4) return 'bg-accent-50 text-accent-700 border-accent-100 dark:bg-accent-950/30 dark:text-accent-400 dark:border-accent-900/30';
    if (level <= 9) return 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-950/30 dark:text-primary-400 dark:border-primary-900/30';
    return 'bg-slate-50 text-slate-650 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800/80';
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function JobGradesIndex({ jobGrades, allGrades = [], stats, filters, branches = [], isAdmin = false }) {
    const { flash } = usePage().props;

    const [searchValue, setSearch]  = useState(filters?.search ?? '');
    const [levelFilter, setLevelFilter] = useState(filters?.level_range ?? 'all');
    const [minLevel, setMinLevel]   = useState(filters?.min_level ?? '');
    const [maxLevel, setMaxLevel]   = useState(filters?.max_level ?? '');
    const [staffFilter, setStaffFilter] = useState(filters?.staff_range ?? 'all');
    const [sortBy, setSortBy]       = useState(filters?.sort_by ?? 'all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [viewMode, setViewMode]   = useState('cards'); // 'cards' | 'tree'

    const [showAdd, setShowAdd]     = useState(false);
    const [editGrade, setEditGrade] = useState(null);
    const [deleteGrade, setDeleteGrade] = useState(null);
    const [form, setForm]           = useState({ name: '', level: '', branch_id: '', parent_id: '' });
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
            level_range: newFilters.level_range !== 'all' ? newFilters.level_range : undefined,
            min_level: newFilters.min_level !== '' ? newFilters.min_level : undefined,
            max_level: newFilters.max_level !== '' ? newFilters.max_level : undefined,
            staff_range: newFilters.staff_range !== 'all' ? newFilters.staff_range : undefined,
            sort_by: newFilters.sort_by !== 'all' ? newFilters.sort_by : undefined,
        };
        router.get(route('hr.job-grades'), queryParams, { preserveState: true, replace: true });
    };

    // Live search and range adjustments with debouncing
    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            applyFilters({ search: val, level_range: levelFilter, min_level: minLevel, max_level: maxLevel, staff_range: staffFilter, sort_by: sortBy });
        }, 400);
    };

    const handleMinLevelChange = (val) => {
        setMinLevel(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            applyFilters({ search: searchValue, level_range: levelFilter, min_level: val, max_level: maxLevel, staff_range: staffFilter, sort_by: sortBy });
        }, 500);
    };

    const handleMaxLevelChange = (val) => {
        setMaxLevel(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            applyFilters({ search: searchValue, level_range: levelFilter, min_level: minLevel, max_level: val, staff_range: staffFilter, sort_by: sortBy });
        }, 500);
    };

    const handleClearFilters = () => {
        setSearch('');
        setLevelFilter('all');
        setMinLevel('');
        setMaxLevel('');
        setStaffFilter('all');
        setSortBy('all');
        router.get(route('hr.job-grades'), {}, { preserveState: true, replace: true });
    };

    const activeFiltersCount = 
        (levelFilter !== 'all' ? 1 : 0) + 
        (minLevel !== '' ? 1 : 0) + 
        (maxLevel !== '' ? 1 : 0) + 
        (staffFilter !== 'all' ? 1 : 0) + 
        (sortBy !== 'all' ? 1 : 0);

    const openAdd  = () => { setForm({ name: '', level: '', branch_id: '', parent_id: '' }); setShowAdd(true); };
    const openEdit = (g) => { setForm({ name: g.name, level: g.level, branch_id: g.branch_id || '', parent_id: g.parent?.id || '' }); setEditGrade(g); };

    const handleStore = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('hr.job-grades.store'), form, {
            onFinish: () => { setProcessing(false); setShowAdd(false); }
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.put(route('hr.job-grades.update', editGrade.id), form, {
            onFinish: () => { setProcessing(false); setEditGrade(null); }
        });
    };

    const handleDelete = () => {
        router.delete(route('hr.job-grades.destroy', deleteGrade.id), {
            onFinish: () => setDeleteGrade(null)
        });
    };

    const gradesData = jobGrades?.data ?? [];

    return (
        <AdminLayout activeMenu="الدرجات الوظيفية">
            <Head title="الدرجات الوظيفية | النظام الإداري" />

            {/* Flash Success */}
            {flash?.success && (
                <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down">
                    <Check size={18} className="text-emerald-600" /> {flash.success}
                </div>
            )}
            
            {/* Flash Error */}
            {flash?.error && (
                <div className="mb-6 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down">
                    <AlertTriangle size={18} className="text-rose-600" /> {flash.error}
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
                        <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">الدرجات الوظيفية والصلاحيات</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة الهيكل الهرمي والمسميات الوظيفية للمدرسة</p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95 self-end sm:self-auto"
                    >
                        <Plus size={18} /> 
                        <span>إضافة درجة وظيفية</span>
                    </button>
                </div>
            </div>

            {/* ── Stats Section ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stat 1: Total Grades */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 group cursor-default">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                    <div className="absolute -left-6 -top-6 w-24 h-24 bg-primary-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">إجمالي الدرجات الوظيفية</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 font-mono tracking-tight">{stats?.total_grades ?? 0}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-all">
                            <ShieldCheck size={22} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                {/* Stat 2: Average Level */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 group cursor-default">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-dark-400 to-dark-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                    <div className="absolute -left-6 -top-6 w-24 h-24 bg-dark-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">متوسط المستوى الوظيفي</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 font-mono tracking-tight">{stats?.average_level ?? 0}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-dark-100 dark:bg-dark-900/40 text-dark-700 dark:text-dark-300 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-all">
                            <Star size={22} strokeWidth={2.5} className="fill-current" />
                        </div>
                    </div>
                </div>

                {/* Stat 3: Total Employees */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 group cursor-default">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                    <div className="absolute -left-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">الموظفون المسجلون بالدرجات</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 font-mono tracking-tight">{stats?.total_employees ?? 0}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-all">
                            <Users size={22} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                {/* Stat 4: Max Level */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 group cursor-default">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-accent-400 to-accent-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                    <div className="absolute -left-6 -top-6 w-24 h-24 bg-accent-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">أعلى مستوى وظيفي</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 font-mono tracking-tight">{stats?.max_level ?? 0}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-accent-950/30 text-accent-600 dark:text-accent-400 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-all">
                            <Award size={22} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Search & Filter Panel ── */}
            <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm mb-6 no-print">
                {/* Search and Toggle Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md group">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="ابحث عن درجة وظيفية... (اضغط / للتركيز)"
                            className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 pl-12 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                            value={searchValue}
                            onChange={e => handleSearch(e.target.value)}
                        />
                        {searchValue && (
                            <button
                                type="button"
                                onClick={() => handleSearch('')}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650 transition-all"
                            >
                                <X size={14} />
                            </button>
                        )}
                        {!searchValue && (
                            <kbd className="absolute left-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-200/60 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 rounded border border-slate-300 dark:border-slate-700 font-bold font-sans group-focus-within:opacity-0 transition-opacity">
                                /
                            </kbd>
                        )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    viewMode === 'cards' 
                                        ? 'bg-white dark:bg-[#121820] text-primary-600 dark:text-primary-400 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <LayoutGrid size={16} />
                                <span className="hidden sm:inline">البطاقات</span>
                            </button>
                            <button
                                onClick={() => setViewMode('tree')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    viewMode === 'tree' 
                                        ? 'bg-white dark:bg-[#121820] text-primary-600 dark:text-primary-400 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <Network size={16} />
                                <span className="hidden sm:inline">الهيكل التنظيمي</span>
                            </button>
                        </div>

                        {/* Advanced Filter Toggle Button */}
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border cursor-pointer ${
                                showAdvancedFilters || activeFiltersCount > 0
                                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                        >
                            <SlidersHorizontal size={16} />
                            <span>تصفية متقدمة</span>
                            {activeFiltersCount > 0 && (
                                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                                    showAdvancedFilters || activeFiltersCount > 0
                                        ? 'bg-white text-primary-600'
                                        : 'bg-primary-500 text-white'
                                }`}>
                                    {activeFiltersCount}
                                </span>
                            )}
                            <ChevronDown size={14} className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                        </button>

                        {(searchValue || activeFiltersCount > 0) && (
                            <button
                                onClick={handleClearFilters}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-accent-600 dark:text-accent-400 bg-accent-50/50 dark:bg-accent-500/10 hover:bg-accent-100/60 dark:hover:bg-accent-500/20 transition-all border border-accent-100 dark:border-accent-500/10 cursor-pointer"
                            >
                                <RotateCcw size={16} />
                                <span>إعادة تعيين</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Advanced Inline Filter Panel */}
                {showAdvancedFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 animate-slide-down">
                        {/* 1. Level Range Category */}
                        <div className="flex flex-col gap-1.5 text-right">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">فئة المستوى</label>
                            <SelectInput 
                                value={levelFilter} 
                                onChange={val => {
                                    setLevelFilter(val);
                                    applyFilters({ level_range: val, min_level: minLevel, max_level: maxLevel, staff_range: staffFilter, sort_by: sortBy });
                                }}
                                options={[
                                    { value: 'all', label: 'الكل' },
                                    { value: 'executive', label: 'مستوى قيادي / تنفيذي (10 - 15)' },
                                    { value: 'supervisory', label: 'مستوى إشرافي (5 - 9)' },
                                    { value: 'entry', label: 'مستوى تشغيلي (1 - 4)' }
                                ]}
                            />
                        </div>

                        {/* 2. Precise Min Level */}
                        <div className="flex flex-col gap-1.5 text-right">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">الحد الأدنى للمستوى</label>
                            <input
                                type="number"
                                min="1"
                                max="15"
                                value={minLevel}
                                onChange={e => handleMinLevelChange(e.target.value)}
                                placeholder="مثال: 1"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-sm font-bold text-slate-750 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all"
                            />
                        </div>

                        {/* 3. Precise Max Level */}
                        <div className="flex flex-col gap-1.5 text-right">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">الحد الأقصى للمستوى</label>
                            <input
                                type="number"
                                min="1"
                                max="15"
                                value={maxLevel}
                                onChange={e => handleMaxLevelChange(e.target.value)}
                                placeholder="مثال: 15"
                                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-sm font-bold text-slate-755 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all"
                            />
                        </div>

                        {/* 4. Employee Density */}
                        <div className="flex flex-col gap-1.5 text-right">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">كثافة الموظفين</label>
                            <SelectInput 
                                value={staffFilter} 
                                onChange={val => {
                                    setStaffFilter(val);
                                    applyFilters({ level_range: levelFilter, min_level: minLevel, max_level: maxLevel, staff_range: val, sort_by: sortBy });
                                }}
                                options={[
                                    { value: 'all', label: 'الكل' },
                                    { value: 'empty', label: 'درجات شاغرة (0 موظف)' },
                                    { value: 'low', label: 'كثافة منخفضة (1 - 5 موظفين)' },
                                    { value: 'medium', label: 'كثافة متوسطة (6 - 15 موظفاً)' },
                                    { value: 'high', label: 'كثافة عالية (16+ موظفاً)' }
                                ]}
                            />
                        </div>

                        {/* 5. Sort By */}
                        <div className="flex flex-col gap-1.5 text-right">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">ترتيب حسب</label>
                            <SelectInput 
                                value={sortBy} 
                                onChange={val => {
                                    setSortBy(val);
                                    applyFilters({ level_range: levelFilter, min_level: minLevel, max_level: maxLevel, staff_range: staffFilter, sort_by: val });
                                }}
                                options={[
                                    { value: 'all', label: 'المستوى الوظيفي (الأعلى أولاً)' },
                                    { value: 'level_asc', label: 'المستوى الوظيفي (الأقل أولاً)' },
                                    { value: 'name_asc', label: 'الاسم (أبجدي تصاعدي)' },
                                    { value: 'name_desc', label: 'الاسم (أبجدي تنازلي)' },
                                    { value: 'employees_desc', label: 'عدد الموظفين (الأكثر أولاً)' },
                                    { value: 'employees_asc', label: 'عدد الموظفين (الأقل أولاً)' }
                                ]}
                            />
                        </div>
                    </div>
                )}

                {/* Active Filter Badges */}
                {(searchValue || levelFilter !== 'all' || minLevel !== '' || maxLevel !== '' || staffFilter !== 'all' || sortBy !== 'all') && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {searchValue && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                <span>البحث: "{searchValue}"</span>
                                <button onClick={() => handleSearch('')} className="hover:text-accent-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {levelFilter !== 'all' && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                <span>النطاق: {
                                    levelFilter === 'executive' ? 'قيادي (10-15)' :
                                    levelFilter === 'supervisory' ? 'إشرافي (5-9)' : 'تشغيلي (1-4)'
                                }</span>
                                <button onClick={() => {
                                    setLevelFilter('all');
                                    applyFilters({ level_range: 'all', min_level: minLevel, max_level: maxLevel, staff_range: staffFilter, sort_by: sortBy });
                                }} className="hover:text-accent-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {minLevel !== '' && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                <span>الحد الأدنى: {minLevel}</span>
                                <button onClick={() => {
                                    setMinLevel('');
                                    applyFilters({ level_range: levelFilter, min_level: '', max_level: maxLevel, staff_range: staffFilter, sort_by: sortBy });
                                }} className="hover:text-accent-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {maxLevel !== '' && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                <span>الحد الأقصى: {maxLevel}</span>
                                <button onClick={() => {
                                    setMaxLevel('');
                                    applyFilters({ level_range: levelFilter, min_level: minLevel, max_level: '', staff_range: staffFilter, sort_by: sortBy });
                                }} className="hover:text-accent-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {staffFilter !== 'all' && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                <span>الكثافة: {
                                    staffFilter === 'empty' ? 'شاغرة (0)' :
                                    staffFilter === 'low' ? 'منخفضة (1-5)' :
                                    staffFilter === 'medium' ? 'متوسطة (6-15)' : 'عالية (16+)'
                                }</span>
                                <button onClick={() => {
                                    setStaffFilter('all');
                                    applyFilters({ level_range: levelFilter, min_level: minLevel, max_level: maxLevel, staff_range: 'all', sort_by: sortBy });
                                }} className="hover:text-accent-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {sortBy !== 'all' && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                <span>الترتيب: {
                                    sortBy === 'level_asc' ? 'المستوى تصاعدياً' :
                                    sortBy === 'name_asc' ? 'الاسم تصاعدياً' :
                                    sortBy === 'name_desc' ? 'الاسم تنازلياً' :
                                    sortBy === 'employees_desc' ? 'الموظفين الأكثر' : 'الموظفين الأقل'
                                }</span>
                                <button onClick={() => {
                                    setSortBy('all');
                                    applyFilters({ level_range: levelFilter, min_level: minLevel, max_level: maxLevel, staff_range: staffFilter, sort_by: 'all' });
                                }} className="hover:text-accent-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* ── Content Area ── */}
            {viewMode === 'tree' ? (
                <OrgChart data={allGrades} />
            ) : (
                <>
                    {gradesData.length === 0 ? (
                <div className="text-center py-16 text-slate-450 dark:text-slate-500 bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-sm">
                    <ShieldCheck size={40} className="mx-auto mb-3 opacity-40 text-primary-500" />
                    <p className="font-bold">لا توجد درجات وظيفية مطابقة للمرشحات</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                        {gradesData.map((grade) => {
                            // Calculate workforce distribution percentage for this grade
                            const totalEmp = stats?.total_employees ?? 0;
                            const percentage = totalEmp > 0 ? (grade.employees_count / totalEmp) * 100 : 0;

                            return (
                                <div
                                    key={grade.id}
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
                                        <div className="relative flex items-center justify-center">
                                            {/* SVG Workforce Distribution Ring wrapping around the icon container */}
                                            <svg className="w-16 h-16 transform -rotate-90 absolute" viewBox="0 0 64 64">
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="25"
                                                    className="stroke-slate-100 dark:stroke-slate-800/80"
                                                    strokeWidth="3"
                                                    fill="transparent"
                                                />
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="25"
                                                    className="stroke-primary-500 transition-all duration-500 ease-out"
                                                    strokeWidth="3"
                                                    fill="transparent"
                                                    strokeDasharray={157.08}
                                                    strokeDashoffset={157.08 - (percentage / 100) * 157.08}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/30 dark:from-primary-950/20 dark:to-primary-900/20 text-primary-600 dark:text-primary-400 shadow-inner border border-primary-100/30 dark:border-primary-900/20 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3 flex items-center justify-center z-10">
                                                <ShieldCheck size={22} strokeWidth={2.5} />
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-1.5 z-10">
                                            <ActionMenu grade={grade} onEdit={openEdit} onDelete={setDeleteGrade} />
                                            {/* Distribution percentage text */}
                                            {percentage > 0 && (
                                                <span className="text-[9px] font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-1.5 py-0.5 rounded-md border border-primary-100/20">
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="relative z-10 mb-6 transition-transform duration-300 group-hover:translate-x-1">
                                        <h3 className="text-lg font-black text-dark-900 dark:text-white mb-2.5 group-hover:text-primary-650 dark:group-hover:text-primary-400 transition-colors">{grade.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${levelColor(grade.level)}`}>
                                                <Star size={12} className="fill-current" /> مستوى {grade.level}
                                            </span>
                                            {grade.parent && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
                                                    <span>تبعية لـ:</span>
                                                    <span className="text-primary-600 dark:text-primary-400">{grade.parent.name}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100/80 dark:border-slate-800/80">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-450 border border-primary-100/30 dark:border-primary-900/20 text-[10px] font-bold group-hover:bg-primary-500 dark:group-hover:bg-primary-600 group-hover:text-white dark:group-hover:text-white transition-colors duration-300"><Users size={12}/></span>
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">{grade.employees_count} موظف</span>
                                        </div>
                                        <button
                                            onClick={() => openEdit(grade)}
                                            className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-primary-500 dark:hover:bg-primary-600 hover:text-white dark:hover:text-white transition-all duration-300 border border-transparent dark:border-slate-850 hover:shadow-md hover:shadow-primary-500/10 dark:hover:shadow-none hover:scale-105 active:scale-95"
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Pagination data={jobGrades} />
                </div>
            )}
            </>
            )}

            {/* ── Add Modal ── */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة درجة وظيفية جديدة">
                <form onSubmit={handleStore} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">اسم الدرجة الوظيفية <span className="text-accent-500">*</span></label>
                        <div className="relative flex items-center group">
                            <ShieldCheck size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
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
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">المستوى الوظيفي (1-15) <span className="text-accent-500">*</span></label>
                        <div className="relative flex items-center group">
                            <Star size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <input
                                type="number"
                                min="1"
                                max="15"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl pr-11 pl-4 py-3.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/5 outline-none transition-all font-semibold"
                                value={form.level}
                                onChange={e => setForm({ ...form, level: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">يرفع تقاريره إلى (التبعية)</label>
                        <SelectInput
                            value={form.parent_id}
                            onChange={val => setForm({ ...form, parent_id: val })}
                            options={[
                                { value: '', label: 'بدون تبعية (مستوى قيادي أعلى)' },
                                ...allGrades.filter(g => g.level < (parseInt(form.level) || 16)).map(g => ({
                                    value: g.id,
                                    label: `${g.name} (مستوى ${g.level})`
                                }))
                            ]}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-sm font-bold text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 dark:shadow-none hover:shadow-lg hover:shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5">
                            <Plus size={16} />
                            <span>{processing ? 'جاري الحفظ...' : 'حفظ الدرجة'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Edit Modal ── */}
            <Modal isOpen={!!editGrade} onClose={() => setEditGrade(null)} title="تعديل الدرجة الوظيفية">
                <form onSubmit={handleUpdate} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">اسم الدرجة الوظيفية <span className="text-accent-500">*</span></label>
                        <div className="relative flex items-center group">
                            <ShieldCheck size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
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
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">المستوى الوظيفي (1-15) <span className="text-accent-500">*</span></label>
                        <div className="relative flex items-center group">
                            <Star size={16} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                            <input
                                type="number"
                                min="1"
                                max="15"
                                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl pr-11 pl-4 py-3.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/5 outline-none transition-all font-semibold"
                                value={form.level}
                                onChange={e => setForm({ ...form, level: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-350 mb-2">يرفع تقاريره إلى (التبعية)</label>
                        <SelectInput
                            value={form.parent_id}
                            onChange={val => setForm({ ...form, parent_id: val })}
                            options={[
                                { value: '', label: 'بدون تبعية (مستوى قيادي أعلى)' },
                                ...allGrades.filter(g => g.id !== editGrade?.id && g.level < (parseInt(form.level) || 16)).map(g => ({
                                    value: g.id,
                                    label: `${g.name} (مستوى ${g.level})`
                                }))
                            ]}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setEditGrade(null)} className="px-5 py-2.5 text-sm font-bold text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 dark:shadow-none hover:shadow-lg hover:shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5">
                            <Save size={16} />
                            <span>{processing ? 'جاري التعديل...' : 'تحديث البيانات'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal isOpen={!!deleteGrade} onClose={() => setDeleteGrade(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-950/20 flex items-center justify-center animate-pulse">
                        <AlertTriangle size={32} className="text-accent-500 dark:text-accent-400" />
                    </div>
                    <div>
                        <p className="font-bold text-dark-900 dark:text-white text-lg mb-1">تأكيد الحذف</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">هل أنت متأكد من حذف الدرجة الوظيفية؟ سيتم حذف "<span className="font-bold text-accent-600 dark:text-accent-400">{deleteGrade?.name}</span>" بشكل نهائي.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setDeleteGrade(null)} className="flex-1 py-3 text-sm font-bold text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button onClick={handleDelete} className="flex-1 py-3 text-sm font-bold text-white bg-accent-500 dark:bg-accent-600 hover:bg-accent-600 dark:hover:bg-accent-750 rounded-2xl shadow-md shadow-accent-500/10 dark:shadow-none transition-all">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
