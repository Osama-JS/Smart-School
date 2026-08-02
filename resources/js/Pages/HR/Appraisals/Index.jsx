import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Play, Star, Clock, CheckCircle, Users, BarChart, AlertTriangle, Check, LayoutGrid, List, Sparkles, Search, Filter, ChevronDown, Award, TrendingUp, UserCheck, ShieldCheck, ArrowLeft, X } from 'lucide-react';

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

// ─── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 52 }) {
    if (score == null) return null;
    const r = (size - 8) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;
    const grade = getGrade(score);

    const colorMap = {
        'ممتاز': 'text-emerald-500',
        'جيد جداً': 'text-blue-500',
        'جيد': 'text-amber-500',
        'مقبول': 'text-orange-500',
        'يحتاج تحسين': 'text-rose-500',
    };
    const strokeColor = colorMap[grade?.label] || 'text-slate-400';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth="3.5" className="text-slate-100 dark:text-slate-800" />
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth="3.5" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className={`${strokeColor} transition-all duration-1000`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-black text-slate-700 dark:text-white">{Math.round(score)}%</span>
            </div>
        </div>
    );
}

export const getGrade = (score) => {
    if (score == null) return null;
    if (score >= 90) return { label: 'ممتاز', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200/50 dark:ring-emerald-500/20', gradient: 'from-emerald-500 to-emerald-600' };
    if (score >= 80) return { label: 'جيد جداً', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-200/50 dark:ring-blue-500/20', gradient: 'from-blue-500 to-blue-600' };
    if (score >= 70) return { label: 'جيد', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200/50 dark:ring-amber-500/20', gradient: 'from-amber-500 to-amber-600' };
    if (score >= 60) return { label: 'مقبول', bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-200/50 dark:ring-orange-500/20', gradient: 'from-orange-500 to-orange-600' };
    return { label: 'يحتاج تحسين', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-200/50 dark:ring-rose-500/20', gradient: 'from-rose-500 to-rose-600' };
};

// ─── Appraisal Card ───────────────────────────────────────────────────────────
function AppraisalCard({ appraisal, statusConfig, index }) {
    const sc = statusConfig[appraisal.status] || statusConfig.pending_self;
    const StatusIcon = sc.icon;
    const grade = appraisal.final_score != null ? getGrade(appraisal.final_score) : null;
    const empName = appraisal.employee?.user?.name || 'غير معروف';
    const initials = empName.charAt(0);

    return (
        <div
            className="group relative bg-white dark:bg-[#121820]/70 rounded-[22px] border border-slate-100/80 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:shadow-primary-500/[0.04] transition-all duration-500 hover:-translate-y-1 overflow-hidden"
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Top accent */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${sc.gradient}`} />

            <div className="p-5">
                {/* Header: Employee + Score */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/20 dark:to-primary-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-primary-700 dark:text-primary-400 font-black text-sm">{initials}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {empName}
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">{appraisal.cycle?.title}</p>
                        </div>
                    </div>

                    {appraisal.final_score != null && (
                        <ScoreRing score={appraisal.final_score} size={48} />
                    )}
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${sc.bg} ${sc.text} ring-1 ${sc.ring}`}>
                        <StatusIcon size={11} /> {sc.label}
                    </span>
                    {grade && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${grade.bg} ${grade.text} ring-1 ${grade.ring}`}>
                            <Award size={11} /> {grade.label}
                        </span>
                    )}
                </div>

                {/* Template Info */}
                {appraisal.template?.title && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-100/60 dark:border-slate-800/40 mb-4">
                        <Star size={12} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">{appraisal.template.title}</span>
                    </div>
                )}

                {/* Action */}
                <Link
                    href={route('hr.appraisals.show', appraisal.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50/70 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 border border-primary-200/30 dark:border-primary-500/10 transition-all active:scale-95"
                >
                    <Eye size={14} /> عرض التقييم
                </Link>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AppraisalsIndex({ appraisals, activeCycles }) {
    const { auth, flash } = usePage().props;
    const [processing, setProcessing] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selectedCycleId, setSelectedCycleId] = useState('');

    const canManage = auth?.permissions?.includes('إدارة التقييمات الإدارية') || auth?.user?.role?.name === 'مدير النظام';

    const startAppraisal = (cycleId) => {
        setProcessing(true);
        router.post(route('hr.appraisals.store'), { cycle_id: cycleId }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false)
        });
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        if (!selectedCycleId) return;
        setGenerating(true);
        router.post(route('hr.appraisals.generate'), { cycle_id: selectedCycleId }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowGenerateModal(false);
                setSelectedCycleId('');
            },
            onFinish: () => setGenerating(false)
        });
    };

    const statusConfig = {
        'pending_self': { label: 'بانتظار التقييم الذاتي', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200/50 dark:ring-amber-500/20', icon: Clock, dot: 'bg-amber-400', gradient: 'from-amber-400 via-amber-500 to-orange-400' },
        'pending_manager': { label: 'بانتظار تقييم المدير', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-200/50 dark:ring-blue-500/20', icon: Users, dot: 'bg-blue-400', gradient: 'from-blue-400 via-blue-500 to-indigo-500' },
        'pending_hr': { label: 'بانتظار اعتماد HR', bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-200/50 dark:ring-violet-500/20', icon: ShieldCheck, dot: 'bg-violet-400', gradient: 'from-violet-400 via-violet-500 to-purple-500' },
        'completed': { label: 'مكتمل', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200/50 dark:ring-emerald-500/20', icon: CheckCircle, dot: 'bg-emerald-400', gradient: 'from-emerald-400 via-emerald-500 to-teal-500' }
    };

    const counts = {
        all: appraisals.length,
        pending_self: appraisals.filter(a => a.status === 'pending_self').length,
        pending_manager: appraisals.filter(a => a.status === 'pending_manager').length,
        pending_hr: appraisals.filter(a => a.status === 'pending_hr').length,
        completed: appraisals.filter(a => a.status === 'completed').length,
    };

    const filteredAppraisals = appraisals.filter(a => {
        const matchesFilter = filter === 'all' || a.status === filter;
        const matchesSearch = !searchQuery || (a.employee?.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const avgScore = (() => {
        const scored = appraisals.filter(a => a.final_score != null);
        if (scored.length === 0) return null;
        return (scored.reduce((sum, a) => sum + a.final_score, 0) / scored.length).toFixed(1);
    })();

    return (
        <AdminLayout activeMenu="تقييمات الأداء">
            <Head title="تقييمات الأداء | النظام الإداري" />

            <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
                {/* Flash */}
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur border border-emerald-200/60 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-3 bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur border border-rose-200/60 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                            <X size={13} className="text-rose-600 dark:text-rose-400" />
                        </div>
                        {flash.error}
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
                                    <Star size={22} className="text-white" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                                    تقييمات الأداء
                                </h1>
                            </div>
                            <p className="text-primary-700/70 dark:text-primary-300/60 text-sm font-semibold mr-14">
                                التقييم الذاتي وتقييمات المدير المباشر واعتماد الموارد البشرية
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {canManage && (
                                <button
                                    onClick={() => setShowGenerateModal(true)}
                                    className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700 text-white rounded-2xl shadow-md shadow-primary-500/20 text-sm font-bold transition-all active:scale-[0.97] shrink-0"
                                >
                                    <Sparkles size={18} />
                                    <span>توليد التقييمات</span>
                                </button>
                            )}
                            <Link
                                href={route('hr.appraisals.dashboard')}
                                className="flex items-center gap-2.5 px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl shadow-sm text-sm font-bold transition-all active:scale-[0.97] shrink-0 group"
                            >
                                <BarChart size={18} className="text-primary-500 group-hover:scale-110 transition-transform" />
                                <span>لوحة بيانات التقييم</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Active Cycles Banner ── */}
                {activeCycles && activeCycles.length > 0 && (
                    <div className="relative bg-gradient-to-r from-emerald-50/90 to-emerald-100/30 dark:from-emerald-500/10 dark:to-emerald-500/5 border border-emerald-200/60 dark:border-emerald-500/20 rounded-[22px] p-5 overflow-hidden">
                        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
                        <div className="absolute top-4 left-4">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200/80 dark:from-emerald-500/20 dark:to-emerald-500/10 flex items-center justify-center shrink-0">
                                    <Play size={20} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-black text-emerald-800 dark:text-emerald-300 text-sm">دورات تقييم متاحة حالياً</p>
                                    <p className="text-[11px] text-emerald-600/60 dark:text-emerald-400/60 font-semibold">اختر الدورة المناسبة لبدء التقييم الذاتي</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                {activeCycles.map(cycle => (
                                    <button
                                        key={cycle.id}
                                        onClick={() => startAppraisal(cycle.id)}
                                        disabled={processing}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/15 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        <Play size={13} /> ابدأ تقييم ({cycle.title})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
                    {[
                        {
                            title: 'إجمالي التقييمات', value: counts.all, icon: BarChart,
                            iconBg: 'bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-500/15 dark:to-primary-500/5',
                            iconColor: 'text-primary-500', accent: 'from-primary-500/5 to-transparent'
                        },
                        {
                            title: 'بانتظار التقييم الذاتي', value: counts.pending_self, icon: Clock,
                            iconBg: 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-500/15 dark:to-amber-500/5',
                            iconColor: 'text-amber-500', accent: 'from-amber-500/5 to-transparent'
                        },
                        {
                            title: 'بانتظار المدير', value: counts.pending_manager, icon: UserCheck,
                            iconBg: 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/15 dark:to-blue-500/5',
                            iconColor: 'text-blue-500', accent: 'from-blue-500/5 to-transparent'
                        },
                        {
                            title: 'بانتظار HR', value: counts.pending_hr, icon: ShieldCheck,
                            iconBg: 'bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-500/15 dark:to-violet-500/5',
                            iconColor: 'text-violet-500', accent: 'from-violet-500/5 to-transparent'
                        },
                        {
                            title: 'مكتمل', value: counts.completed, icon: CheckCircle,
                            iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/15 dark:to-emerald-500/5',
                            iconColor: 'text-emerald-500', accent: 'from-emerald-500/5 to-transparent'
                        },
                    ].map((stat, i) => (
                        <div key={i} className="relative bg-white dark:bg-[#121820]/60 p-5 rounded-[22px] border border-slate-100/80 dark:border-slate-800/50 shadow-sm flex items-center gap-4 transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            <div className={`relative w-11 h-11 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className={stat.iconColor} size={22} />
                            </div>
                            <div className="relative">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-wide">{stat.title}</p>
                                <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                    <AnimatedCounter value={stat.value} />
                                </h4>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Toolbar: Search + Filters + View Toggle ── */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 w-full lg:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                            <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="بحث بالاسم..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-[#121820]/60 border border-slate-200/80 dark:border-slate-800/50 rounded-xl pr-10 pl-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all"
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 bg-white/60 dark:bg-[#121820]/40 p-1 rounded-xl border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm overflow-x-auto">
                            {[
                                { key: 'all', label: 'الكل' },
                                { key: 'pending_self', label: 'ذاتي' },
                                { key: 'pending_manager', label: 'المدير' },
                                { key: 'pending_hr', label: 'HR' },
                                { key: 'completed', label: 'مكتمل' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                                        filter === tab.key
                                            ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                    <span className={`px-1 py-0.5 rounded text-[9px] font-black ${
                                        filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}>{counts[tab.key]}</span>
                                </button>
                            ))}
                        </div>
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
                        {filteredAppraisals.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredAppraisals.map((appraisal, i) => (
                                    <AppraisalCard key={appraisal.id} appraisal={appraisal} statusConfig={statusConfig} index={i} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState filter={filter} statusConfig={statusConfig} />
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
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">الموظف</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">الدورة</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">القالب</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">الحالة</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">النتيجة</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filteredAppraisals.map(appraisal => {
                                        const sc = statusConfig[appraisal.status] || statusConfig.pending_self;
                                        const StatusIcon = sc.icon;
                                        const grade = appraisal.final_score != null ? getGrade(appraisal.final_score) : null;
                                        const empName = appraisal.employee?.user?.name || 'غير معروف';

                                        return (
                                            <tr key={appraisal.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/20 dark:to-primary-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                            <span className="text-primary-700 dark:text-primary-400 font-black text-sm">{empName.charAt(0)}</span>
                                                        </div>
                                                        <p className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{empName}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{appraisal.cycle?.title}</td>
                                                <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{appraisal.template?.title}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text} ring-1 ${sc.ring}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {grade ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <ScoreRing score={appraisal.final_score} size={40} />
                                                            <span className={`text-[10px] font-bold ${grade.text}`}>{grade.label}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link
                                                        href={route('hr.appraisals.show', appraisal.id)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50/70 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-500/20 border border-primary-200/30 dark:border-primary-500/10 transition-all active:scale-95"
                                                    >
                                                        <Eye size={13} /> عرض
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredAppraisals.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center">
                                                <EmptyStateInline filter={filter} statusConfig={statusConfig} />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Generate Modal ── */}
            {showGenerateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !generating && setShowGenerateModal(false)} />
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 animate-slide-up border border-slate-100 dark:border-slate-800">
                        <button onClick={() => !generating && setShowGenerateModal(false)} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors">
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/20 dark:to-primary-500/10 flex items-center justify-center">
                                <Sparkles size={28} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">توليد جماعي للتقييمات</h3>
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">إنشاء نماذج التقييم لموظفي الفرع</p>
                            </div>
                        </div>

                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اختر الدورة</label>
                                <div className="relative">
                                    <select
                                        value={selectedCycleId}
                                        onChange={e => setSelectedCycleId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none appearance-none"
                                        required
                                        disabled={generating}
                                    >
                                        <option value="">-- اختر دورة التقييم --</option>
                                        {activeCycles?.map(cycle => (
                                            <option key={cycle.id} value={cycle.id}>{cycle.title}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={generating || !selectedCycleId}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {generating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>جاري التوليد...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={18} />
                                        <span>توليد التقييمات الآن</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

// ─── Empty States ─────────────────────────────────────────────────────────────
function EmptyState({ filter, statusConfig }) {
    return (
        <div className="bg-white dark:bg-[#121820]/60 rounded-[28px] border border-slate-100 dark:border-slate-800 p-16 text-center">
            <div className="flex flex-col items-center gap-5">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                    <Star size={36} className="text-slate-300 dark:text-slate-600" />
                </div>
                <div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-base mb-1">
                        {filter === 'all' ? 'لا توجد تقييمات سابقة' : `لا توجد تقييمات ${statusConfig[filter]?.label || ''}`}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                        {filter === 'all' ? 'سيظهر هنا زر "ابدأ التقييم" عند توفر دورة تقييم نشطة' : 'جرّب تغيير الفلتر لعرض التقييمات الأخرى'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function EmptyStateInline({ filter, statusConfig }) {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                <Star size={28} className="text-slate-300 dark:text-slate-600" />
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1">
                    {filter === 'all' ? 'لا توجد تقييمات سابقة' : `لا توجد تقييمات ${statusConfig[filter]?.label || ''}`}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    {filter === 'all' ? 'سيظهر هنا زر "ابدأ التقييم" عند توفر دورة تقييم نشطة' : 'جرّب تغيير الفلتر'}
                </p>
            </div>
        </div>
    );
}
