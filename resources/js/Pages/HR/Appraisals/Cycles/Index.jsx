import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { Plus, Edit2, Trash2, Calendar, Save, Check, Clock, X, Activity, CalendarDays, BarChart, Timer, CalendarRange, FileCheck, AlertCircle, ChevronLeft, ChevronRight, Sparkles, RotateCcw, Zap, LayoutGrid, List } from 'lucide-react';

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 600 }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = parseInt(value) || 0;
        if (end === 0) { setCount(0); return; }
        const step = Math.max(1, Math.floor(end / (duration / 16)));
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return <span>{count}</span>;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function CycleProgress({ startDate, endDate, status }) {
    if (status !== 'active') return null;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    const pct = total > 0 ? Math.min(Math.max((elapsed / total) * 100, 0), 100) : 0;
    const remaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2">
                <span>التقدم الزمني</span>
                <span>{remaining > 0 ? `${remaining} يوم متبقي` : 'انتهت المدة'}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 via-primary-500 to-violet-500 transition-all duration-1000 ease-out relative"
                    style={{ width: `${pct}%` }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] animate-shimmer" />
                </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] font-bold text-primary-500">{Math.round(pct)}%</span>
            </div>
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xl animate-fade-in" onClick={onClose} />
            <div className="relative bg-white/95 dark:bg-[#0f1720]/95 backdrop-blur-2xl rounded-[28px] shadow-2xl shadow-slate-900/10 dark:shadow-black/30 w-full max-w-lg z-10 overflow-hidden border border-white/30 dark:border-slate-700/50 animate-scale-in">
                <div className="relative px-7 py-5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-400 via-primary-500 to-violet-500" />
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                <Calendar size={18} className="text-white" />
                            </div>
                            {title}
                        </h3>
                        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-500/10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all active:scale-90">
                            <X size={16} />
                        </button>
                    </div>
                </div>
                <div className="p-7 max-h-[75vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

// ─── Active Cycle Card ────────────────────────────────────────────────────────
function ActiveCycleCard({ cycle, onEdit, onDelete, typeLabels, index }) {
    const formatDate = (d) => {
        if (!d) return '—';
        const date = new Date(d);
        return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const statusStyles = {
        active: { accent: 'from-emerald-400 via-primary-500 to-violet-500', border: 'border-emerald-100/60 dark:border-emerald-500/10', iconBg: 'from-emerald-50 to-emerald-100/70 dark:from-emerald-500/15 dark:to-emerald-500/5', iconColor: 'text-emerald-500', label: 'دورة نشطة', labelColor: 'text-emerald-500 dark:text-emerald-400', dot: 'bg-emerald-400', showPulse: true },
        draft: { accent: 'from-amber-400 via-amber-500 to-orange-400', border: 'border-amber-100/60 dark:border-amber-500/10', iconBg: 'from-amber-50 to-amber-100/70 dark:from-amber-500/15 dark:to-amber-500/5', iconColor: 'text-amber-500', label: 'مسودة', labelColor: 'text-amber-500 dark:text-amber-400', dot: 'bg-amber-400', showPulse: false },
        closed: { accent: 'from-slate-300 via-slate-400 to-slate-300 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700', border: 'border-slate-200/60 dark:border-slate-700/30', iconBg: 'from-slate-100 to-slate-200/70 dark:from-slate-800/50 dark:to-slate-700/30', iconColor: 'text-slate-400', label: 'مغلقة', labelColor: 'text-slate-400 dark:text-slate-500', dot: 'bg-slate-400', showPulse: false },
    };

    const s = statusStyles[cycle.status] || statusStyles.draft;

    return (
        <div
            className={`relative bg-white dark:bg-[#121820]/70 rounded-[22px] border ${s.border} shadow-sm hover:shadow-xl hover:shadow-primary-500/[0.04] transition-all duration-500 hover:-translate-y-1 overflow-hidden group`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Accent */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${s.accent}`} />

            {/* Pulse indicator */}
            {s.showPulse && (
                <div className="absolute top-5 left-5">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                </div>
            )}

            <div className="p-6">
                {/* Title & Type */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                            <Zap size={22} className={s.iconColor} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{cycle.title}</h3>
                            <span className={`text-[11px] font-bold ${s.labelColor}`}>{s.label}</span>
                        </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {typeLabels[cycle.type]}
                    </span>
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-100/60 dark:border-slate-800/40 mb-1">
                    <CalendarRange size={15} className="text-primary-400 shrink-0" />
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-1">
                        <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700/50">{formatDate(cycle.start_date)}</span>
                        <ChevronLeft size={12} className="text-slate-300 dark:text-slate-600" />
                        <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700/50">{formatDate(cycle.end_date)}</span>
                    </div>
                </div>

                {/* Progress */}
                <CycleProgress startDate={cycle.start_date} endDate={cycle.end_date} status={cycle.status} />

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100/60 dark:border-slate-800/40">
                    <button
                        onClick={() => onEdit(cycle)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50/70 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 border border-primary-200/30 dark:border-primary-500/10 transition-all active:scale-95"
                    >
                        <Edit2 size={13} /> تعديل
                    </button>
                    <button
                        onClick={() => { if (confirm('هل أنت متأكد من حذف هذه الدورة؟')) onDelete(cycle.id); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200/30 dark:border-rose-500/10 transition-all active:scale-95"
                    >
                        <Trash2 size={13} /> حذف
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CyclesIndex({ cycles }) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('cards');

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        title: '',
        type: 'monthly',
        start_date: '',
        end_date: '',
        status: 'draft'
    });

    const openModal = (cycle = null) => {
        if (cycle) {
            setEditingId(cycle.id);
            setData({
                title: cycle.title,
                type: cycle.type,
                start_date: cycle.start_date,
                end_date: cycle.end_date,
                status: cycle.status
            });
        } else {
            setEditingId(null);
            reset();
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(route('hr.appraisals.cycles.update', editingId), { onSuccess: () => setShowModal(false) });
        } else {
            post(route('hr.appraisals.cycles.store'), { onSuccess: () => setShowModal(false) });
        }
    };

    const statusConfig = {
        'draft': { label: 'مسودة', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200/50 dark:ring-amber-500/20', icon: Clock, dot: 'bg-amber-400' },
        'active': { label: 'نشطة', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200/50 dark:ring-emerald-500/20', icon: Activity, dot: 'bg-emerald-400' },
        'closed': { label: 'مغلقة', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', ring: 'ring-slate-200/50 dark:ring-slate-700/50', icon: X, dot: 'bg-slate-400' }
    };

    const typeLabels = { 'monthly': 'شهري', 'semi-annual': 'نصف سنوي', 'annual': 'سنوي' };
    const typeConfig = {
        'monthly': { icon: Timer, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        'semi-annual': { icon: CalendarRange, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
        'annual': { icon: CalendarDays, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' }
    };

    const activeCycles = cycles.filter(c => c.status === 'active');
    const draftCount = cycles.filter(c => c.status === 'draft').length;
    const closedCount = cycles.filter(c => c.status === 'closed').length;

    const filteredCycles = cycles.filter(c => {
        if (filter === 'active') return c.status === 'active';
        if (filter === 'draft') return c.status === 'draft';
        if (filter === 'closed') return c.status === 'closed';
        return true;
    });

    const formatDate = (d) => {
        if (!d) return '—';
        const date = new Date(d);
        return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <AdminLayout activeMenu="دورات التقييم">
            <Head title="دورات التقييم | النظام الإداري" />

            <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
                {/* Flash Message */}
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur border border-emerald-200/60 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        {flash.success}
                    </div>
                )}

                {/* ── Hero Header ── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/80 via-white to-violet-50/30 dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-violet-500/5 border border-primary-100/70 dark:border-primary-500/10 rounded-[28px] p-7 md:p-9 shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-400 via-primary-600 to-violet-500" />
                    <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <path d="M-50 160 C 200 60, 300 220, 500 160 C 700 100, 800 260, 950 160" stroke="currentColor" strokeWidth="1.5" className="text-violet-500" />
                            <circle cx="200" cy="80" r="60" className="fill-primary-500" />
                            <circle cx="600" cy="140" r="40" className="fill-violet-500" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                    <CalendarDays size={22} className="text-white" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                                    دورات التقييم
                                </h1>
                            </div>
                            <p className="text-primary-700/70 dark:text-primary-300/60 text-sm font-semibold mr-14">
                                إدارة فترات التقييم الدورية (شهرية، نصف سنوية، أو سنوية)
                            </p>
                        </div>

                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-xl hover:shadow-primary-500/15 text-sm font-bold transition-all active:scale-[0.97] shrink-0 group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>إضافة دورة تقييم</span>
                        </button>
                    </div>
                </div>

                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        {
                            title: 'إجمالي الدورات', value: cycles.length, icon: Calendar,
                            iconBg: 'bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-500/15 dark:to-primary-500/5',
                            iconColor: 'text-primary-500', accent: 'from-primary-500/5 to-transparent'
                        },
                        {
                            title: 'الدورات النشطة', value: activeCycles.length, icon: Activity,
                            iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/15 dark:to-emerald-500/5',
                            iconColor: 'text-emerald-500', accent: 'from-emerald-500/5 to-transparent'
                        },
                        {
                            title: 'المسودات', value: draftCount, icon: Clock,
                            iconBg: 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-500/15 dark:to-amber-500/5',
                            iconColor: 'text-amber-500', accent: 'from-amber-500/5 to-transparent'
                        },
                        {
                            title: 'الدورات المغلقة', value: closedCount, icon: FileCheck,
                            iconBg: 'bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700/30 dark:to-slate-800/20',
                            iconColor: 'text-slate-400', accent: 'from-slate-500/5 to-transparent'
                        },
                    ].map((stat, i) => (
                        <div key={i} className="relative bg-white dark:bg-[#121820]/60 p-5 rounded-[22px] border border-slate-100/80 dark:border-slate-800/50 shadow-sm flex items-center gap-4 transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            <div className={`relative w-12 h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className={stat.iconColor} size={24} />
                            </div>
                            <div className="relative">
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-wide">{stat.title}</p>
                                <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                    <AnimatedCounter value={stat.value} />
                                </h4>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Toolbar: Filters + View Toggle ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 bg-white/60 dark:bg-[#121820]/40 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm">
                        {[
                            { key: 'all', label: 'الكل', count: cycles.length },
                            { key: 'active', label: 'نشطة', count: activeCycles.length },
                            { key: 'draft', label: 'مسودة', count: draftCount },
                            { key: 'closed', label: 'مغلقة', count: closedCount },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    filter === tab.key
                                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {tab.label}
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                                    filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}>{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1.5 bg-white/60 dark:bg-[#121820]/40 p-1 rounded-xl border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'cards'
                                    ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <LayoutGrid size={14} /> بطاقات
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'table'
                                    ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <List size={14} /> جدول
                        </button>
                    </div>
                </div>

                {/* ── Cards View ── */}
                {viewMode === 'cards' && (
                    <>
                        {filteredCycles.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredCycles.map((cycle, i) => (
                                    <ActiveCycleCard key={cycle.id} cycle={cycle} onEdit={openModal} onDelete={(id) => destroy(route('hr.appraisals.cycles.destroy', id))} typeLabels={typeLabels} index={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#121820]/60 rounded-[28px] border border-slate-100 dark:border-slate-800 p-16 text-center">
                                <div className="flex flex-col items-center gap-5">
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                                        <Calendar size={36} className="text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 font-bold text-base mb-1">
                                            {filter === 'all' ? 'لا توجد دورات تقييم بعد' : `لا توجد دورات ${statusConfig[filter]?.label || ''}`}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                            {filter === 'all' ? 'ابدأ بإنشاء أول دورة تقييم لنظامك' : 'جرّب تغيير الفلتر لعرض الدورات الأخرى'}
                                        </p>
                                    </div>
                                    {filter === 'all' && (
                                        <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-primary-500/15 transition-all active:scale-95">
                                            <Sparkles size={16} /> إنشاء أول دورة
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── Table View ── */}
                {viewMode === 'table' && (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-[22px] border border-slate-100/80 dark:border-slate-800/50 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="border-b border-slate-100/60 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/30">
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">الدورة</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">النوع</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">تاريخ البداية</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">تاريخ النهاية</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">الحالة</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filteredCycles.map(cycle => {
                                        const sc = statusConfig[cycle.status] || statusConfig.draft;
                                        const tc = typeConfig[cycle.type] || typeConfig.monthly;
                                        const TypeIcon = tc.icon;

                                        return (
                                            <tr key={cycle.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-500/15 dark:to-primary-500/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                            <Calendar size={18} className="text-primary-500" />
                                                        </div>
                                                        <p className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{cycle.title}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ${tc.bg} ${tc.color} ring-1 ring-inset ring-current/10`}>
                                                        <TypeIcon size={12} />
                                                        {typeLabels[cycle.type]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                                        {formatDate(cycle.start_date)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                                        {formatDate(cycle.end_date)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text} ring-1 ${sc.ring}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button onClick={() => openModal(cycle)} className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50/70 dark:hover:bg-primary-500/10 transition-all active:scale-90" title="تعديل">
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذه الدورة؟')) destroy(route('hr.appraisals.cycles.destroy', cycle.id)); }} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 dark:hover:bg-rose-500/10 transition-all active:scale-90" title="حذف">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredCycles.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                                                        <Calendar size={28} className="text-slate-300 dark:text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1">
                                                            {filter === 'all' ? 'لا توجد دورات تقييم بعد' : `لا توجد دورات ${statusConfig[filter]?.label || ''}`}
                                                        </p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                                            {filter === 'all' ? 'ابدأ بإنشاء أول دورة تقييم لنظامك' : 'جرّب تغيير الفلتر لعرض الدورات الأخرى'}
                                                        </p>
                                                    </div>
                                                    {filter === 'all' && (
                                                        <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-primary-500/15 transition-all active:scale-95">
                                                            <Sparkles size={14} /> إنشاء أول دورة
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Modal for Add/Edit ── */}
                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'تعديل الدورة' : 'إضافة دورة تقييم جديدة'}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                <CalendarDays size={13} className="text-primary-400" />
                                عنوان الدورة
                            </label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                className="w-full bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                placeholder="مثال: تقييم شهر يناير 2026"
                                required
                            />
                            {errors.title && <p className="flex items-center gap-1.5 text-rose-500 text-xs mt-2 font-semibold"><AlertCircle size={12} />{errors.title}</p>}
                        </div>

                        {/* Type + Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                    <Timer size={13} className="text-primary-400" />
                                    نوع التقييم
                                </label>
                                <SelectInput
                                    value={data.type}
                                    onChange={val => setData('type', val)}
                                    className="w-full bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                                    options={[
                                        { value: 'monthly', label: 'شهري' },
                                        { value: 'semi-annual', label: 'نصف سنوي' },
                                        { value: 'annual', label: 'سنوي' }
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                    <Activity size={13} className="text-primary-400" />
                                    حالة الدورة
                                </label>
                                <SelectInput
                                    value={data.status}
                                    onChange={val => setData('status', val)}
                                    className="w-full bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                                    options={[
                                        { value: 'draft', label: 'مسودة' },
                                        { value: 'active', label: 'نشطة (متاح للتقييم)' },
                                        { value: 'closed', label: 'مغلقة' }
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 p-5">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                                <CalendarRange size={13} className="text-primary-400" />
                                فترة الدورة
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 block">تاريخ البداية</span>
                                    <FlatpickrInput
                                        type="date"
                                        value={data.start_date}
                                        onChange={d => setData('start_date', d)}
                                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/50 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                                        required
                                    />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 block">تاريخ النهاية</span>
                                    <FlatpickrInput
                                        type="date"
                                        value={data.end_date}
                                        onChange={d => setData('end_date', d)}
                                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/50 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                                        required
                                    />
                                </div>
                            </div>
                            {errors.end_date && <p className="flex items-center gap-1.5 text-rose-500 text-xs mt-3 font-semibold"><AlertCircle size={12} />{errors.end_date}</p>}
                        </div>

                        {/* Submit */}
                        <div className="flex items-center justify-end gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 disabled:opacity-50 hover:shadow-lg hover:shadow-primary-500/15 active:scale-95"
                            >
                                <Save size={16} />
                                {editingId ? 'تحديث الدورة' : 'حفظ الدورة'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AdminLayout>
    );
}
