import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import NewsWidget from '@/Components/NewsWidget';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    Users, GraduationCap, BookOpen, CheckSquare,
    TrendingUp, Calendar, Clock, AlertCircle, Activity,
    BookCheck, ShieldAlert, CheckCircle, ChevronLeft, Star,
} from 'lucide-react';

export default function BranchManagerDashboard({
    stats: backendStats = {},
    systemAlerts = [],
    recentActivities = [],
    weeklyEmployeeData = [],
    weeklyStudentData = [],
    weeklyData = [],
    pendingAppraisals = null,
    latestNews = [],
}) {
    const { auth, logo_url } = usePage().props;

    // Live digital clock state
    const [timeStr, setTimeStr] = useState('');
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTimeStr(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    const [chartTab, setChartTab] = useState('students');
    const [activityFilter, setActivityFilter] = useState('all');

    const empAttendanceNum = Math.min(100, Math.max(0, parseFloat(backendStats?.attendance_percentage || 0) || 0));
    const stuAttendanceNum = Math.min(100, Math.max(0, parseFloat(backendStats?.student_attendance_percentage || 0) || 0));

    const stats = [
        {
            title: 'إجمالي الطلاب',
            value: backendStats?.students || '0',
            subLabel: `حضور الطلاب اليوم: ${backendStats?.student_attendance_percentage || '0%'}`,
            progressPct: stuAttendanceNum,
            icon: GraduationCap,
            iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400',
            progressClass: 'bg-gradient-to-r from-primary-400 to-primary-600',
            glowBg: 'bg-primary-500/5',
            hoverBorder: 'hover:border-primary-200 dark:hover:border-primary-800/30',
            topLineHover: 'group-hover:bg-primary-500/20',
            ringColor: 'border-primary-500/20',
        },
        {
            title: 'المعلمون',
            value: backendStats?.teachers || '0',
            subLabel: 'كادر التعليم بالفرع',
            progressPct: 100,
            icon: Users,
            iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
            progressClass: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
            glowBg: 'bg-emerald-500/5',
            hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800/30',
            topLineHover: 'group-hover:bg-emerald-500/20',
            ringColor: 'border-emerald-500/20',
        },
        {
            title: 'المواد الدراسية',
            value: backendStats?.subjects || '0',
            subLabel: 'المقررات المعتمدة',
            progressPct: 100,
            icon: BookOpen,
            iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            progressClass: 'bg-gradient-to-r from-slate-500 to-slate-700',
            glowBg: 'bg-slate-500/5',
            hoverBorder: 'hover:border-slate-300 dark:hover:border-slate-700',
            topLineHover: 'group-hover:bg-slate-500/20',
            ringColor: 'border-slate-500/20',
        },
        {
            title: 'حضور الموظفين اليوم',
            value: backendStats?.attendance_percentage || '0%',
            subLabel: `حاضر: ${backendStats?.present_today || 0} | غائب: ${backendStats?.absent_today || 0}`,
            progressPct: empAttendanceNum,
            icon: CheckSquare,
            iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400',
            progressClass: 'bg-gradient-to-r from-amber-400 to-amber-600',
            glowBg: 'bg-amber-500/5',
            hoverBorder: 'hover:border-amber-200 dark:hover:border-amber-800/30',
            topLineHover: 'group-hover:bg-amber-500/20',
            ringColor: 'border-amber-500/20',
        },
    ];

    const safeActivities = Array.isArray(recentActivities) ? recentActivities : [];
    const filteredActivities = safeActivities.filter((act) => {
        if (activityFilter === 'all') return true;
        return act.type === activityFilter;
    });

    const activeChartData = chartTab === 'students'
        ? (weeklyStudentData?.length > 0 ? weeklyStudentData : weeklyData)
        : (weeklyEmployeeData?.length > 0 ? weeklyEmployeeData : weeklyData);

    const getActivityColor = (type) => {
        switch (type) {
            case 'success': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
            case 'warning': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
            case 'info': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
            default: return 'bg-slate-400';
        }
    };

    const getAlertStyle = (type) => {
        if (type === 'danger') {
            return 'bg-rose-50/60 hover:bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300';
        }
        if (type === 'warning') {
            return 'bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300';
        }
        return 'bg-primary-50/50 hover:bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/20 text-primary-800 dark:text-primary-300';
    };

    const ringRadius = 58;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringOffset = ringCircumference - (empAttendanceNum / 100) * ringCircumference;

    return (
        <AdminLayout activeMenu="الرئيسية">
            <Head title="لوحة التحكم | نظام القيم ERP" />

            <div className="space-y-8 animate-fade-in">
                {/* Welcome Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <img
                                src={logo_url || '/images/logo.png'}
                                alt="شعار المدرسة"
                                className="h-16 w-16 rounded-2xl object-contain bg-white p-2 shadow-md shrink-0 border border-slate-100/10"
                            />
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                                    <span>مرحباً، {auth?.user?.name || 'مدير الفرع'}</span>
                                </h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-1.5 text-xs sm:text-sm font-semibold">
                                    نظام القيم ERP — نظرة مباشرة على مؤشرات الفرع، التنبيهات، والحضور اليومي
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-primary-700 dark:text-primary-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm">
                                <Calendar size={14} className="text-primary-500 shrink-0" />
                                <span className="font-semibold">
                                    {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                            {timeStr && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm font-mono font-bold">
                                    <Clock size={14} className="text-primary-500 animate-pulse shrink-0" />
                                    <span>{timeStr}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actionable Appraisal Banner */}
                {pendingAppraisals && pendingAppraisals.total > 0 && (
                    <div className="bg-gradient-to-l from-indigo-600 to-purple-700 rounded-3xl p-5 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                                <Star size={24} className="text-amber-300" />
                            </div>
                            <div>
                                <h3 className="font-black text-base">لديك ({pendingAppraisals.total}) مهام تقييم أداء بانتظار الإجراء</h3>
                                <p className="text-xs text-indigo-100 mt-0.5 font-semibold">
                                    {pendingAppraisals.hr_count > 0 && `اعتماد الموارد البشرية: ${pendingAppraisals.hr_count} | `}
                                    {pendingAppraisals.evaluator_count > 0 && `تقييمات كعضو لجنة/مدير: ${pendingAppraisals.evaluator_count}`}
                                    {pendingAppraisals.self_count > 0 && ` | تقييمك الذاتي: ${pendingAppraisals.self_count}`}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={pendingAppraisals.items?.[0]?.id ? route('hr.appraisals.show', pendingAppraisals.items[0].id) : route('hr.appraisals.index')}
                            className="px-5 py-2.5 rounded-2xl bg-white text-indigo-700 font-black text-xs hover:bg-indigo-50 transition-colors shrink-0"
                        >
                            مراجعة التقييمات
                        </Link>
                    </div>
                )}

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className={`bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden group ${stat.hoverBorder}`}
                        >
                            <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                            <div className={`absolute top-0 right-0 left-0 h-1 bg-transparent ${stat.topLineHover} transition-colors`} />

                            <div className="relative z-10 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{stat.title}</p>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none font-mono">{stat.value}</h3>
                                </div>
                                <div className={`relative h-11 w-11 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                                    <stat.icon size={20} strokeWidth={2.5} />
                                </div>
                            </div>

                            <div className="relative z-10 space-y-2">
                                <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${stat.progressClass}`} style={{ width: `${stat.progressPct}%` }} />
                                </div>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">{stat.subLabel}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {latestNews && latestNews.length > 0 && <NewsWidget news={latestNews} />}

                {/* Dashboard Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar (Live Alerts & Attendance Gauge) */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Real System Alerts */}
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={18} className="text-rose-500" />
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base">تنبيهات ومهام الفرع</h3>
                                </div>
                                <span className={`inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full text-white text-xs font-black ${systemAlerts.length > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                                    {systemAlerts.length}
                                </span>
                            </div>

                            {systemAlerts.length > 0 ? (
                                <div className="space-y-2.5">
                                    {systemAlerts.map((alert, idx) => (
                                        <Link
                                            key={idx}
                                            href={alert.href}
                                            className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${getAlertStyle(alert.type)}`}
                                        >
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-bold">{alert.title}</p>
                                                <p className="text-[11px] opacity-85 mt-0.5 font-semibold">{alert.description}</p>
                                            </div>
                                            <ChevronLeft size={16} className="shrink-0 mt-1 opacity-60" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle size={28} className="mx-auto mb-2" />
                                    <p className="text-xs font-black">الأوضاع مستقرة — لا توجد مهام معلقة حالياً</p>
                                </div>
                            )}
                        </div>

                        {/* Circular Attendance Gauge (Live) */}
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
                            <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <BookCheck size={16} className="text-primary-500" />
                                <span>الحضور والانصراف اليوم</span>
                            </h4>

                            <div className="relative flex items-center justify-center h-36 w-36 mx-auto my-2">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="72" cy="72" r={ringRadius} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="8" fill="transparent" />
                                    <circle
                                        cx="72"
                                        cy="72"
                                        r={ringRadius}
                                        className="stroke-[#6b9b37] dark:stroke-primary-400 transition-all duration-1000 ease-out"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={ringCircumference}
                                        strokeDashoffset={ringOffset}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute text-center">
                                    <p className="text-2xl font-black text-slate-800 dark:text-white font-mono leading-none">
                                        {backendStats?.attendance_percentage || '0%'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-black mt-1.5">حضور الموظفين</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-1">
                                <div>
                                    <div className="flex items-center justify-between mb-1 text-xs font-bold">
                                        <span className="text-slate-500">الموظفون الحاضرون</span>
                                        <span className="text-primary-700 dark:text-primary-400">{backendStats?.present_today || 0}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                                        <div className="bg-primary-500 h-full rounded-full transition-all duration-700" style={{ width: `${empAttendanceNum}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1 text-xs font-bold">
                                        <span className="text-slate-500">الموظفون الغائبون / مجازون</span>
                                        <span className="text-rose-600 dark:text-rose-400">{backendStats?.absent_today || 0}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                                        <div className="bg-rose-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(0, 100 - empAttendanceNum)}%` }} />
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-500">حضور الطلاب اليوم</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                                        {backendStats?.student_attendance_percentage || '0%'} ({backendStats?.student_present_today || 0})
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Area (Real Recharts Weekly AreaChart + Activities Timeline) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
                                    <TrendingUp size={18} className="text-[#6b9b37]" />
                                    <span>مخطط نسبة الحضور للأيام الخمسة الأخيرة (%)</span>
                                </h3>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setChartTab('students')}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${chartTab === 'students' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        الطلاب
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChartTab('employees')}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${chartTab === 'employees' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        الموظفون
                                    </button>
                                </div>
                            </div>

                            <div className="h-60 w-full" dir="ltr">
                                {activeChartData && activeChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="branchAttendanceGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6b9b37" stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor="#6b9b37" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 700 }} />
                                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <Tooltip
                                                formatter={(value, _name, props) => [`${value}% (حاضر: ${props.payload.present} | غائب: ${props.payload.absent})`, 'نسبة الحضور']}
                                                contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '12px' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="percentage"
                                                stroke="#6b9b37"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#branchAttendanceGrad)"
                                                activeDot={{ r: 6 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                                        لا توجد سجلات حضور مسجلة للأيام الأخيرة
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activities Panel */}
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-2">
                                    <Activity size={18} className="text-primary-500" />
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base">آخر النشاطات الحالية</h3>
                                </div>

                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/80 p-1 border border-slate-100 dark:border-slate-800 rounded-2xl w-fit">
                                    {[
                                        { key: 'all', label: 'الكل' },
                                        { key: 'success', label: 'اعتماد وإضافة' },
                                        { key: 'info', label: 'معلومات' },
                                        { key: 'warning', label: 'تنبيهات وحذف' },
                                    ].map((preset) => (
                                        <button
                                            key={preset.key}
                                            type="button"
                                            onClick={() => setActivityFilter(preset.key)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                                activityFilter === preset.key
                                                    ? 'bg-primary-500 text-white shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-2 relative min-h-[140px]">
                                <div className="absolute right-9 top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800/60" />

                                {filteredActivities.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400">
                                        <Clock size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="font-bold text-sm">لا توجد نشاطات ضمن هذا التصنيف حالياً</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredActivities.map((activity, index) => (
                                            <div key={index} className="relative pl-2 pr-10 group">
                                                <div className={`absolute right-[30px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-10 ${getActivityColor(activity.type)}`} />
                                                <div className="bg-slate-50/40 hover:bg-slate-50 border border-slate-100 dark:bg-slate-900/30 dark:border-slate-800/40 p-3.5 rounded-2xl transition-all">
                                                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{activity.text}</p>
                                                    <span className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5 font-bold">
                                                        <Clock size={11} /> {activity.time}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
