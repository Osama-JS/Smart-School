import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Activity, Clock, Server, AlertTriangle, Trash2, RotateCcw, AlertCircle, Database, Search, Gauge, Zap, Route as RouteIcon, Layout, HardDrive, Archive, Download, Shield, CheckCircle2, Cpu, BarChart3 } from 'lucide-react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function PerformanceIndex({ avgResponseTime, totalRequests, slowQueries, queueStats, dbHealth = { total_size_mb: 0, top_tables: [] }, diskHealth = { total_gb: 0, used_gb: 0, free_gb: 0, usage_percent: 0, uploads_mb: 0 } }) {
    const [isDeletingSlowQueries, setIsDeletingSlowQueries] = useState(false);
    const [isFlushingJobs, setIsFlushingJobs] = useState(false);
    const [isRetryingJobs, setIsRetryingJobs] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizingType, setOptimizingType] = useState(null);

    const [isArchivingModalOpen, setIsArchivingModalOpen] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [archiveForm, setArchiveForm] = useState({
        table: 'activity_logs',
        duration: '6_months'
    });

    const [tablesPage, setTablesPage] = useState(1);
    const [queriesPage, setQueriesPage] = useState(1);
    const tablesPerPage = 5;
    const queriesPerPage = 10;

    const currentTables = dbHealth.top_tables.slice((tablesPage - 1) * tablesPerPage, tablesPage * tablesPerPage);
    const totalTablesPages = Math.ceil(dbHealth.top_tables.length / tablesPerPage);

    const currentQueries = slowQueries.slice((queriesPage - 1) * queriesPerPage, queriesPage * queriesPerPage);
    const totalQueriesPages = Math.ceil(slowQueries.length / queriesPerPage);

    const optimizeSystem = (type) => {
        setIsOptimizing(true);
        setOptimizingType(type);
        router.post(route('admin.performance.optimize'), { type }, {
            onFinish: () => {
                setIsOptimizing(false);
                setOptimizingType(null);
            }
        });
    };

    const getResponseSpeedStatus = () => {
        if (avgResponseTime < 200) return { text: 'ممتاز', color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-500/10', ring: 'ring-primary-500/20', iconColor: 'text-primary-500' };
        if (avgResponseTime < 500) return { text: 'جيد', color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10', ring: 'ring-primary-500/20', iconColor: 'text-primary-400' };
        if (avgResponseTime < 1000) return { text: 'بطيء نوعاً ما', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', ring: 'ring-amber-500/20', iconColor: 'text-amber-500' };
        return { text: 'بطيء جداً', color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-500/10', ring: 'ring-accent-500/20', iconColor: 'text-accent-500' };
    };
    const speedStatus = getResponseSpeedStatus();

    const clearSlowQueries = () => {
        router.delete(route('admin.performance.clear-slow-queries'), {
            onSuccess: () => setIsDeletingSlowQueries(false)
        });
    };

    const retryFailedJobs = () => {
        setIsRetryingJobs(true);
        router.post(route('admin.performance.retry-jobs'), {}, {
            onFinish: () => setIsRetryingJobs(false)
        });
    };

    const flushFailedJobs = () => {
        router.delete(route('admin.performance.flush-jobs'), {
            onSuccess: () => setIsFlushingJobs(false)
        });
    };

    const startArchiving = () => {
        setIsArchiving(true);
        router.post(route('admin.performance.archive'), archiveForm, {
            onFinish: () => setIsArchiving(false),
            onSuccess: (page) => {
                setIsArchivingModalOpen(false);
                if (page.props.flash?.archive_url) {
                    window.location.href = page.props.flash.archive_url;
                }
            }
        });
    };

    // Disk usage color based on brand
    const diskColor = diskHealth.usage_percent > 85 ? 'accent' : 'primary';

    return (
        <AdminLayout activeMenu="تقارير الأداء">
            <Head title="تقارير الأداء الفنية" />

            <div className="max-w-[100rem] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

                {/* ═══════════════════════════════════════════════════════════
                    HEADER — Brand-aligned hero section
                   ═══════════════════════════════════════════════════════════ */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none">
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
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0 shadow-sm border border-primary-50 dark:border-primary-500/20">
                                <Cpu size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">تقارير أداء النظام</h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">مراقبة سرعة الاستجابة، الاستعلامات البطيئة، وحالة الطوابير الخلفية</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    ROW 1 — Server Health: Response + Cache Optimization
                   ═══════════════════════════════════════════════════════════ */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500">
                            <Activity size={20} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">حالة السيرفر والاستجابة</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Response Time Card */}
                        <div className="md:col-span-1 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">متوسط زمن الاستجابة (اليوم)</p>
                                    <div className="flex items-end gap-2 mt-2">
                                        <h3 className="text-4xl font-black text-slate-800 dark:text-white font-mono">{avgResponseTime}</h3>
                                        <span className="text-sm font-bold text-slate-400 mb-1">ms</span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ring-1 ${speedStatus.bg} ${speedStatus.color} ${speedStatus.ring}`}>
                                            {speedStatus.text}
                                        </span>
                                        <span className="text-xs text-slate-400 font-semibold">بناءً على {totalRequests} طلب</span>
                                    </div>
                                </div>
                                <div className={`h-12 w-12 rounded-2xl ${speedStatus.bg} ${speedStatus.iconColor} flex items-center justify-center ring-1 ${speedStatus.ring}`}>
                                    <Gauge size={24} />
                                </div>
                            </div>
                        </div>

                        {/* System Optimization Quick Actions (Inline) */}
                        <div className="md:col-span-2 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-primary-50/40 dark:bg-primary-500/5">
                                <div className="p-1.5 bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg">
                                    <Zap size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">إدارة الذاكرة المؤقتة وتحسين السرعة (Cache)</h3>
                                </div>
                            </div>
                            <div className="flex-1 p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <button onClick={() => optimizeSystem('clear_cache')} disabled={isOptimizing} className="flex flex-col items-center justify-center p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:border-primary-500/30 hover:text-primary-600 transition-all group/btn disabled:opacity-50">
                                    {isOptimizing && optimizingType === 'clear_cache' ? <RotateCcw className="animate-spin text-primary-500" size={20} /> : <Database size={20} className="text-slate-400 group-hover/btn:text-primary-500 mb-2 transition-colors" />}
                                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 group-hover/btn:text-primary-600">تنظيف الذاكرة</span>
                                </button>

                                <button onClick={() => optimizeSystem('clear_views')} disabled={isOptimizing} className="flex flex-col items-center justify-center p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:border-primary-500/30 hover:text-primary-600 transition-all group/btn disabled:opacity-50">
                                    {isOptimizing && optimizingType === 'clear_views' ? <RotateCcw className="animate-spin text-primary-500" size={20} /> : <Layout size={20} className="text-slate-400 group-hover/btn:text-primary-500 mb-2 transition-colors" />}
                                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 group-hover/btn:text-primary-600">تنظيف الواجهات</span>
                                </button>

                                <button onClick={() => optimizeSystem('optimize_routes')} disabled={isOptimizing} className="flex flex-col items-center justify-center p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:border-primary-500/30 hover:text-primary-600 transition-all group/btn disabled:opacity-50">
                                    {isOptimizing && optimizingType === 'optimize_routes' ? <RotateCcw className="animate-spin text-primary-500" size={20} /> : <RouteIcon size={20} className="text-slate-400 group-hover/btn:text-primary-500 mb-2 transition-colors" />}
                                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 group-hover/btn:text-primary-600">تسريع المسارات</span>
                                </button>

                                <button onClick={() => optimizeSystem('optimize_all')} disabled={isOptimizing} className="flex flex-col items-center justify-center p-4 border border-primary-600/20 dark:border-primary-500/30 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 hover:from-primary-700 hover:to-primary-800 transition-all group/btn disabled:opacity-50 text-white shadow-sm">
                                    {isOptimizing && optimizingType === 'optimize_all' ? <RotateCcw className="animate-spin text-white" size={20} /> : <Zap size={20} className="mb-2 text-primary-200" />}
                                    <span className="font-bold text-[11px]">تحسين شامل</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    ROW 2 — Background Jobs + Storage & Database
                   ═══════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Section: Background Jobs */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-dark-50 dark:bg-dark-700 flex items-center justify-center text-dark-600 dark:text-dark-300">
                                <Server size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">المهام الخلفية (Queue Workers)</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                            {/* Pending Jobs Card */}
                            <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden group">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                                <div className="relative z-10 flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">المهام قيد الانتظار</p>
                                        <div className="flex items-end gap-2 mt-2">
                                            <h3 className="text-4xl font-black text-slate-800 dark:text-white font-mono">{queueStats.pending}</h3>
                                            <span className="text-sm font-bold text-slate-400 mb-1">مهمة</span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20">
                                                يتم المعالجة بالخلفية
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-500 flex items-center justify-center ring-1 ring-primary-500/20">
                                        <Clock size={24} />
                                    </div>
                                </div>
                            </div>

                            {/* Failed Jobs Card */}
                            <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden group">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                                <div className="relative z-10 flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">المهام الفاشلة</p>
                                        <div className="flex items-end gap-2 mt-2">
                                            <h3 className="text-4xl font-black text-slate-800 dark:text-white font-mono">{queueStats.failed_count}</h3>
                                            <span className="text-sm font-bold text-slate-400 mb-1">مهمة</span>
                                        </div>
                                        {queueStats.failed_count > 0 && (
                                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                                                <button onClick={retryFailedJobs} disabled={isRetryingJobs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-dark-800 text-white hover:bg-dark-700 transition-colors disabled:opacity-50">
                                                    <RotateCcw size={12} className={isRetryingJobs ? 'animate-spin' : ''} />
                                                    <span>إعادة المحاولة</span>
                                                </button>
                                                <button onClick={() => setIsFlushingJobs(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-accent-50 text-accent-600 hover:bg-accent-100 dark:bg-accent-500/10 dark:text-accent-400 transition-colors ring-1 ring-accent-500/20">
                                                    <Trash2 size={12} />
                                                    <span>حذف الكل</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-12 w-12 rounded-2xl bg-accent-50 dark:bg-accent-500/10 text-accent-500 flex items-center justify-center shrink-0 ring-1 ring-accent-500/20">
                                        <AlertTriangle size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Storage & Database */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <HardDrive size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">التخزين وقواعد البيانات</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                            {/* Database Size Card */}
                            <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden group">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                                <div className="relative z-10 flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">حجم قاعدة البيانات (DB)</p>
                                        <div className="flex items-end gap-2 mt-2">
                                            <h3 className="text-4xl font-black text-slate-800 dark:text-white font-mono">{dbHealth.total_size_mb}</h3>
                                            <span className="text-sm font-bold text-slate-400 mb-1">MB</span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ring-1 ${dbHealth.total_size_mb > 500 ? 'bg-accent-50 text-accent-600 ring-accent-500/20 dark:bg-accent-500/10 dark:text-accent-400' : 'bg-primary-50 text-primary-600 ring-primary-500/20 dark:bg-primary-500/10 dark:text-primary-400'}`}>
                                                {dbHealth.total_size_mb > 500 ? 'حجم كبير' : 'حجم طبيعي'}
                                            </span>
                                            <button onClick={() => setIsArchivingModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 transition-colors ring-1 ring-primary-500/20">
                                                <Archive size={12} />
                                                <span>أرشفة السجلات</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0 ring-1 ring-primary-500/20">
                                        <Database size={24} />
                                    </div>
                                </div>
                            </div>

                            {/* Disk Space Card */}
                            <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden group">
                                <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${diskColor}-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                                <div className="relative z-10 flex items-start justify-between w-full gap-2">
                                    <div className="w-full">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">مساحة التخزين (Disk)</p>
                                        <div className="flex items-end gap-2 mt-2">
                                            <h3 className="text-4xl font-black text-slate-800 dark:text-white font-mono">{diskHealth.used_gb}</h3>
                                            <span className="text-sm font-bold text-slate-400 mb-1">GB / {diskHealth.total_gb} GB</span>
                                        </div>
                                        <div className="mt-4 h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${diskHealth.usage_percent > 85 ? 'bg-gradient-to-r from-accent-400 to-accent-600' : 'bg-gradient-to-r from-primary-400 to-primary-600'}`}
                                                style={{ width: `${diskHealth.usage_percent}%` }}
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                                            <span className="text-slate-500">المرفقات: {diskHealth.uploads_mb} MB</span>
                                            <span className={diskHealth.usage_percent > 85 ? 'text-accent-500' : 'text-primary-500'}>{diskHealth.usage_percent}%</span>
                                        </div>
                                    </div>
                                    <div className={`h-12 w-12 rounded-2xl ${diskHealth.usage_percent > 85 ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-500 ring-accent-500/20' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-500 ring-primary-500/20'} flex items-center justify-center shrink-0 ring-1`}>
                                        <HardDrive size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    ROW 3 — Top Tables + Slow Queries
                   ═══════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Largest Tables Section */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-primary-50/30 dark:bg-primary-500/5">
                            <div className="p-2 bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl ring-1 ring-primary-500/20">
                                <BarChart3 size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">الجداول الأكثر استهلاكاً للمساحة</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">مراقبة الجداول الأكثر استهلاكاً للتخزين</p>
                            </div>
                        </div>
                        <div className="flex-1 p-6">
                            <div className="space-y-5">
                                {currentTables.map((table, index) => {
                                    const percentage = dbHealth.total_size_mb > 0
                                        ? Math.min(100, Math.round((table.size_mb / dbHealth.total_size_mb) * 100))
                                        : 0;

                                    return (
                                        <div key={index} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-md bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-[9px] text-primary-600 dark:text-primary-400 font-black ring-1 ring-primary-500/20">{(tablesPage - 1) * tablesPerPage + index + 1}</span>
                                                    {table.table_name}
                                                </span>
                                                <span className="font-mono font-bold text-slate-500 text-xs">{table.size_mb} MB</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {dbHealth.top_tables.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm font-bold flex flex-col items-center gap-2">
                                        <CheckCircle2 size={24} className="text-primary-400" />
                                        لا توجد بيانات متاحة
                                    </div>
                                )}
                            </div>
                            
                            {/* Pagination Controls for Tables */}
                            {totalTablesPages > 1 && (
                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                                    <button
                                        onClick={() => setTablesPage(p => Math.max(1, p - 1))}
                                        disabled={tablesPage === 1}
                                        className="px-3 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                    >
                                        السابق
                                    </button>
                                    <span className="text-xs font-bold text-slate-500">
                                        صفحة {tablesPage} من {totalTablesPages}
                                    </span>
                                    <button
                                        onClick={() => setTablesPage(p => Math.min(totalTablesPages, p + 1))}
                                        disabled={tablesPage === totalTablesPages}
                                        className="px-3 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                    >
                                        التالي
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Slow Queries Section */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50/30 dark:bg-amber-500/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl ring-1 ring-amber-500/20">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">سجل الاستعلامات البطيئة (Slow Queries)</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">استعلامات قاعدة البيانات التي تستغرق أكثر من 500ms</p>
                                </div>
                            </div>
                            {slowQueries.length > 0 && (
                                <button onClick={() => setIsDeletingSlowQueries(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-50 hover:bg-accent-100 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400 dark:hover:bg-accent-500/20 rounded-xl font-bold text-xs transition-colors shrink-0 ring-1 ring-accent-500/20">
                                    <Trash2 size={14} />
                                    <span>مسح السجل</span>
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs">
                                    <tr>
                                        <th className="px-6 py-4">الزمن (ms)</th>
                                        <th className="px-6 py-4">مسار الطلب (Path)</th>
                                        <th className="px-6 py-4">نص الاستعلام (Query)</th>
                                        <th className="px-6 py-4">وقت التسجيل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {slowQueries.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-semibold">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 ring-1 ring-primary-500/20">
                                                        <CheckCircle2 size={28} />
                                                    </div>
                                                    <p className="font-bold">رائع! لا توجد أي استعلامات بطيئة مسجلة حالياً.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentQueries.map((query) => (
                                            <tr key={query.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono ring-1 ${
                                                        query.execution_time_ms > 2000 ? 'bg-accent-50 text-accent-600 ring-accent-500/20 dark:bg-accent-500/10' : 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/10'
                                                    }`}>
                                                        <AlertCircle size={12} />
                                                        {query.execution_time_ms} ms
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-300 dir-ltr text-left">
                                                    /{query.path || 'unknown'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xl">
                                                        <p className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 break-all dir-ltr text-left">
                                                            {query.sql_query}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                                    {new Date(query.created_at).toLocaleString('ar-SA')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination Controls for Slow Queries */}
                        {totalQueriesPages > 1 && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                                <button
                                    onClick={() => setQueriesPage(p => Math.max(1, p - 1))}
                                    disabled={queriesPage === 1}
                                    className="px-4 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors border border-slate-200 dark:border-slate-700"
                                >
                                    السابق
                                </button>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                    الصفحة {queriesPage} من {totalQueriesPages}
                                </span>
                                <button
                                    onClick={() => setQueriesPage(p => Math.min(totalQueriesPages, p + 1))}
                                    disabled={queriesPage === totalQueriesPages}
                                    className="px-4 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors border border-slate-200 dark:border-slate-700"
                                >
                                    التالي
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    Failed Jobs Details
                   ═══════════════════════════════════════════════════════════ */}
                {queueStats.recent_failed.length > 0 && (
                    <div className="bg-white dark:bg-slate-900/60 border border-accent-100 dark:border-accent-900/30 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-accent-100 dark:border-accent-900/30 bg-accent-50/50 dark:bg-accent-500/5 flex items-center gap-3">
                            <div className="p-2 bg-accent-100 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 rounded-xl ring-1 ring-accent-500/20">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-accent-600 dark:text-accent-400">أحدث المهام الفاشلة</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {queueStats.recent_failed.map(job => (
                                <div key={job.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-accent-200 dark:hover:border-accent-500/20 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">مهمة (ID: {job.id})</span>
                                        <span className="text-xs text-slate-500 font-semibold">{job.failed_at}</span>
                                    </div>
                                    <p className="text-xs font-mono text-accent-500 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10 p-3 rounded-xl line-clamp-3 dir-ltr text-left ring-1 ring-accent-500/10">
                                        {job.exception}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}



            </div>

            {/* ═══════════════════════════════════════════════════════════
                MODALS
               ═══════════════════════════════════════════════════════════ */}
            <Modal show={isDeletingSlowQueries} onClose={() => setIsDeletingSlowQueries(false)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                        مسح سجل الاستعلامات البطيئة
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        هل أنت متأكد من رغبتك في مسح السجل بالكامل؟ لن تتمكن من التراجع عن هذا الإجراء.
                    </p>
                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton onClick={() => setIsDeletingSlowQueries(false)}>
                            إلغاء
                        </SecondaryButton>
                        <DangerButton onClick={clearSlowQueries}>
                            تأكيد المسح
                        </DangerButton>
                    </div>
                </div>
            </Modal>

            <Modal show={isFlushingJobs} onClose={() => setIsFlushingJobs(false)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                        حذف المهام الفاشلة نهائياً
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        هل أنت متأكد من حذف جميع المهام التي فشلت في الطابور؟ سيتم تجاهلها نهائياً.
                    </p>
                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton onClick={() => setIsFlushingJobs(false)}>
                            إلغاء
                        </SecondaryButton>
                        <DangerButton onClick={flushFailedJobs}>
                            تأكيد الحذف
                        </DangerButton>
                    </div>
                </div>
            </Modal>

            {/* Archiving Modal */}
            <Modal show={isArchivingModalOpen} onClose={() => setIsArchivingModalOpen(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl ring-1 ring-primary-500/20">
                            <Archive size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">المنظف الذكي والأرشفة</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                استخراج السجلات القديمة وحذفها لتقليل مساحة قاعدة البيانات.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الجدول المستهدف</label>
                            <select
                                value={archiveForm.table}
                                onChange={(e) => setArchiveForm({...archiveForm, table: e.target.value})}
                                className="w-full border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="activity_logs">سجلات النشاط (Activity Logs)</option>
                                <option value="notifications">الإشعارات المقروءة (Notifications)</option>
                                <option value="traffic_analytics">إحصائيات المرور (Traffic Analytics)</option>
                                <option value="slow_queries">سجل الاستعلامات البطيئة (Slow Queries)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عمر السجلات المراد أرشفتها</label>
                            <select
                                value={archiveForm.duration}
                                onChange={(e) => setArchiveForm({...archiveForm, duration: e.target.value})}
                                className="w-full border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="1_month">أقدم من شهر</option>
                                <option value="3_months">أقدم من 3 أشهر</option>
                                <option value="6_months">أقدم من 6 أشهر</option>
                                <option value="1_year">أقدم من سنة</option>
                            </select>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl flex gap-3">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
                                سيتم جمع كافة السجلات المطابقة وحفظها في ملف Excel (CSV) تلقائياً،
                                ثم <strong className="text-accent-500">حذفها بشكل نهائي</strong> من قاعدة البيانات لتوفير المساحة.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <SecondaryButton onClick={() => setIsArchivingModalOpen(false)} disabled={isArchiving}>
                            إلغاء
                        </SecondaryButton>
                        <button
                            onClick={startArchiving}
                            disabled={isArchiving}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 border border-transparent rounded-lg font-bold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition ease-in-out duration-150"
                        >
                            {isArchiving ? <RotateCcw size={16} className="animate-spin" /> : <Download size={16} />}
                            بدء الأرشفة والتحميل
                        </button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
