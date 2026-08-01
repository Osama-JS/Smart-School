import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ShieldCheck, AlertTriangle, Clock, Star, MapPin, Award, CheckCircle,
    BookOpen, Trophy, Medal, TrendingDown, CalendarDays, User, FileWarning,
    Sparkles, Ban, CircleAlert, BarChart3
} from 'lucide-react';
import ChildSelector from '@/Components/ChildSelector';

// Severity color mapping for violations
const getSeverityStyle = (status) => {
    switch (status) {
        case 'resolved': return { bg: 'bg-emerald-50 dark:bg-emerald-900/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/40', label: 'تم المعالجة', icon: CheckCircle };
        case 'pending': return { bg: 'bg-amber-50 dark:bg-amber-900/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/40', label: 'قيد المعالجة', icon: Clock };
        default: return { bg: 'bg-rose-50 dark:bg-rose-900/15', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/40', label: 'مخالفة', icon: CircleAlert };
    }
};

// Attendance status helpers
const getAttendanceStyle = (status) => {
    switch (status) {
        case 'late': return { bg: 'bg-amber-50 dark:bg-amber-900/15', iconBg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/40', label: 'تأخر', icon: Clock, dot: 'bg-amber-500' };
        case 'absent': return { bg: 'bg-rose-50 dark:bg-rose-900/15', iconBg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/40', label: 'غياب', icon: AlertTriangle, dot: 'bg-rose-500' };
        case 'unexcused': return { bg: 'bg-red-50 dark:bg-red-900/15', iconBg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800/40', label: 'غياب بدون عذر', icon: Ban, dot: 'bg-red-600' };
        default: return { bg: 'bg-slate-50 dark:bg-slate-800/50', iconBg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600', border: 'border-slate-200', label: status, icon: AlertTriangle, dot: 'bg-slate-500' };
    }
};

// Format date nicely
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ar-EG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
};

// Achievement medal colors
const medalColors = [
    { bg: 'from-yellow-400 to-amber-500', shadow: 'shadow-amber-500/30', ring: 'ring-yellow-300' },
    { bg: 'from-slate-300 to-slate-400', shadow: 'shadow-slate-500/20', ring: 'ring-slate-200' },
    { bg: 'from-amber-600 to-orange-700', shadow: 'shadow-orange-500/20', ring: 'ring-amber-500' },
    { bg: 'from-emerald-400 to-green-500', shadow: 'shadow-emerald-500/20', ring: 'ring-emerald-300' },
    { bg: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/20', ring: 'ring-blue-300' },
    { bg: 'from-purple-400 to-violet-500', shadow: 'shadow-purple-500/20', ring: 'ring-purple-300' },
];

export default function RecordsIndex({ auth, attendance, violations, achievements, stats, children, activeChildId }) {
    const [activeTab, setActiveTab] = useState('attendance');

    // Group attendance by date
    const attendanceByDate = useMemo(() => {
        if (!attendance || attendance.length === 0) return {};
        const grouped = {};
        attendance.forEach(item => {
            const date = item.date || 'غير محدد';
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(item);
        });
        return grouped;
    }, [attendance]);

    const attendanceDates = Object.keys(attendanceByDate).sort((a, b) => new Date(b) - new Date(a));

    // Stats-based behavior score (simple calculation)
    const behaviorScore = useMemo(() => {
        const maxScore = 100;
        const deductions = (stats.totalAbsent * 3) + (stats.totalLate * 1) + (stats.totalViolations * 5);
        return Math.max(0, maxScore - deductions);
    }, [stats]);

    const getBehaviorInfo = (score) => {
        if (score >= 90) return { label: 'ممتاز', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', emoji: '🌟' };
        if (score >= 75) return { label: 'جيد جداً', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500', emoji: '✨' };
        if (score >= 60) return { label: 'جيد', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500', emoji: '👍' };
        if (score >= 40) return { label: 'مقبول', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500', emoji: '📝' };
        return { label: 'ضعيف', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500', emoji: '⚠️' };
    };

    const behaviorInfo = getBehaviorInfo(behaviorScore);

    // Behavior ring
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (behaviorScore / 100) * circumference;

    const tabs = [
        { key: 'attendance', label: 'سجل الغياب والتأخر', icon: CalendarDays, count: attendance?.length || 0 },
        { key: 'violations', label: 'المخالفات السلوكية', icon: FileWarning, count: violations?.length || 0 },
        { key: 'achievements', label: 'الإنجازات والأوسمة', icon: Trophy, count: achievements?.length || 0 },
    ];

    return (
        <AdminLayout user={auth.user} activeMenu="السجل الأكاديمي">
            <Head title="السجل الأكاديمي والانضباط" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">
                <ChildSelector children={children} activeChildId={activeChildId} />

                {/* Header Profile Summary */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820]/95 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-dark-800" />
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/30 shadow-inner">
                                <ShieldCheck size={32} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">السجل الأكاديمي والانضباط</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
                                    <BarChart3 size={16} />
                                    تابع سجل غيابك، مخالفاتك، وإنجازاتك
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {/* Behavior Score Ring */}
                    <div className="col-span-2 lg:col-span-1 bg-white dark:bg-[#1e293b] p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center row-span-1">
                        <div className="relative w-24 h-24 mb-3">
                            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 90 90">
                                <circle cx="45" cy="45" r="40" fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="6" />
                                <circle cx="45" cy="45" r="40" fill="none" className={behaviorInfo.bg.replace('bg-', 'stroke-')} strokeWidth="6"
                                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-2xl font-black ${behaviorInfo.color}`}>{behaviorScore}</span>
                                <span className="text-[9px] text-slate-400 font-bold">من 100</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">مؤشر الانضباط</p>
                        <span className={`text-sm font-black ${behaviorInfo.color}`}>{behaviorInfo.emoji} {behaviorInfo.label}</span>
                    </div>

                    {/* Absent */}
                    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-rose-500" />
                            </div>
                            {stats.totalAbsent > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />}
                        </div>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalAbsent}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">أيام غياب</p>
                        <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(stats.totalAbsent * 10, 100)}%` }} />
                        </div>
                    </div>

                    {/* Late */}
                    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                <Clock size={20} className="text-amber-500" />
                            </div>
                            {stats.totalLate > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />}
                        </div>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalLate}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">مرات تأخر</p>
                        <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(stats.totalLate * 10, 100)}%` }} />
                        </div>
                    </div>

                    {/* Violations */}
                    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                <ShieldCheck size={20} className="text-red-500" />
                            </div>
                            {stats.totalViolations > 0 && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />}
                        </div>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalViolations}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">المخالفات</p>
                        <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(stats.totalViolations * 20, 100)}%` }} />
                        </div>
                    </div>

                    {/* Points - Featured */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-5 rounded-[2rem] shadow-lg shadow-primary-500/20 text-white group hover:shadow-xl transition-all">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                        <div className="absolute left-4 bottom-2 w-16 h-16 bg-white/5 rounded-full blur-lg" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                    <Trophy size={20} />
                                </div>
                                <Sparkles size={16} className="text-white/60" />
                            </div>
                            <p className="text-3xl font-black">{stats.totalPoints}</p>
                            <p className="text-sm text-white/70 font-medium mt-1">نقاط التميز</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-[#1e293b] p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8 flex overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 ${
                                activeTab === tab.key
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <tab.icon size={18} />
                            <span className="hidden sm:inline">{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                    activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div>
                    {/* ── Attendance Tab ── */}
                    {activeTab === 'attendance' && (
                        <div className="space-y-5">
                            {attendanceDates.length > 0 ? (
                                attendanceDates.map(date => (
                                    <div key={date} className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                                        {/* Date Header */}
                                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                                    <CalendarDays size={20} className="text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 dark:text-white">{formatDate(date)}</h3>
                                                    <p className="text-xs text-slate-500">{attendanceByDate[date].length} سجل</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Attendance Items */}
                                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {attendanceByDate[date].map(item => {
                                                const style = getAttendanceStyle(item.status);
                                                const Icon = style.icon;
                                                return (
                                                    <div key={item.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                        <div className={`w-11 h-11 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0`}>
                                                            <Icon size={20} className={style.text} />
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-slate-700 dark:text-slate-200">{item.subject?.name || 'مادة غير محددة'}</span>
                                                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                                                                    {style.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                                                <Clock size={13} />
                                                                الحصة: {item.period?.name || '-'}
                                                            </p>
                                                        </div>
                                                        <div className={`w-3 h-3 rounded-full ${style.dot} shrink-0`} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="w-20 h-20 mx-auto bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-5">
                                        <CheckCircle size={36} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">ممتاز! 🌟</h3>
                                    <p className="text-slate-500">ليس لديك أي سجلات غياب أو تأخر. استمر!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Violations Tab ── */}
                    {activeTab === 'violations' && (
                        <div className="space-y-4">
                            {violations && violations.length > 0 ? (
                                violations.map((item, idx) => {
                                    const severity = getSeverityStyle(item.status);
                                    const Icon = severity.icon;
                                    return (
                                        <div key={item.id} className={`bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden border-r-4 ${severity.border}`}
                                             style={{ animationDelay: `${idx * 0.05}s` }}>
                                            <div className="p-5 md:p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 rounded-xl ${severity.bg} flex items-center justify-center shrink-0`}>
                                                        <Icon size={22} className={severity.text} />
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                                            <div>
                                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{item.violationType?.name || 'مخالفة'}</h3>
                                                                <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <CalendarDays size={14} />
                                                                        {formatDate(item.violation_date)}
                                                                    </span>
                                                                    {item.supervisor && (
                                                                        <span className="flex items-center gap-1">
                                                                            <User size={14} />
                                                                            {item.supervisor.name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${severity.bg} ${severity.text} ${severity.border} shrink-0`}>
                                                                {severity.label}
                                                            </span>
                                                        </div>

                                                        {item.details && (
                                                            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.details}</p>
                                                            </div>
                                                        )}

                                                        {item.action_taken && (
                                                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/15 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">الإجراء المتخذ:</p>
                                                                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{item.action_taken}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="w-20 h-20 mx-auto bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-5">
                                        <ShieldCheck size={36} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">سجل نظيف! ✨</h3>
                                    <p className="text-slate-500">سجلك السلوكي خالٍ من المخالفات. أحسنت!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Achievements Tab ── */}
                    {activeTab === 'achievements' && (
                        <div>
                            {achievements && achievements.length > 0 ? (
                                <>
                                    {/* Points Summary Banner */}
                                    <div className="relative overflow-hidden bg-gradient-to-l from-primary-500 via-primary-600 to-primary-700 rounded-[2rem] p-6 md:p-8 mb-6 text-white">
                                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-xl" />
                                        <div className="absolute left-10 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-lg" />
                                        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                                    <Trophy size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-white/70 text-sm font-medium">إجمالي نقاط التميز</p>
                                                    <p className="text-4xl font-black">{stats.totalPoints} <span className="text-lg text-white/60">نقطة</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/5">
                                                    <p className="text-xs text-white/60 font-medium mb-0.5">عدد الإنجازات</p>
                                                    <p className="text-2xl font-black">{achievements.length}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Achievement Cards Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {achievements.map((item, idx) => {
                                            const medal = medalColors[idx % medalColors.length];
                                            return (
                                                <div key={item.id} className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                                                     style={{ animationDelay: `${idx * 0.06}s` }}>
                                                    <div className="p-6 flex flex-col items-center text-center">
                                                        {/* Medal Icon */}
                                                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${medal.bg} shadow-lg ${medal.shadow} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ring-4 ${medal.ring} ring-offset-2 ring-offset-white dark:ring-offset-[#1e293b]`}>
                                                            <Medal size={36} className="text-white drop-shadow-md" />
                                                        </div>

                                                        {/* Title */}
                                                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">
                                                            {item.type?.name || 'إنجاز'}
                                                        </h3>

                                                        {/* Points Badge */}
                                                        <span className="inline-flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-4 py-1.5 rounded-xl text-sm font-black border border-primary-100 dark:border-primary-800/30">
                                                            <Star size={14} fill="currentColor" />
                                                            +{item.points} نقطة
                                                        </span>

                                                        {/* Description */}
                                                        {item.description && (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed line-clamp-2">{item.description}</p>
                                                        )}

                                                        {/* Meta */}
                                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 w-full flex items-center justify-between text-xs text-slate-400">
                                                            <span className="flex items-center gap-1">
                                                                <CalendarDays size={12} />
                                                                {item.date_awarded ? formatDate(item.date_awarded) : formatDate(item.created_at)}
                                                            </span>
                                                            {item.awardedBy && (
                                                                <span className="flex items-center gap-1">
                                                                    <User size={12} />
                                                                    {item.awardedBy.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="w-20 h-20 mx-auto bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-5">
                                        <Star size={36} className="text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">لا توجد إنجازات بعد</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto">شارك بفعالية في الأنشطة المدرسية والحصص لتحصل على الأوسمة والنقاط!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
