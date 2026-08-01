import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Award, FileText, TrendingUp, BookOpen, BarChart3, ChevronDown, ChevronUp, Sparkles, GraduationCap, Star, Target } from 'lucide-react';
import ChildSelector from '@/Components/ChildSelector';

// Helper: get grade label & color based on percentage
const getGradeInfo = (percentage) => {
    if (percentage >= 90) return { label: 'ممتاز', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/40', bar: 'bg-emerald-500', emoji: '🌟' };
    if (percentage >= 80) return { label: 'جيد جداً', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/40', bar: 'bg-blue-500', emoji: '✨' };
    if (percentage >= 70) return { label: 'جيد', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/40', bar: 'bg-amber-500', emoji: '👍' };
    if (percentage >= 60) return { label: 'مقبول', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800/40', bar: 'bg-orange-500', emoji: '📝' };
    return { label: 'ضعيف', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800/40', bar: 'bg-red-500', emoji: '⚠️' };
};

// Score cell component with visual indicator
const ScoreCell = ({ score, max = 100 }) => {
    if (score === null || score === undefined || score === '-') return <td className="py-4 px-3 text-center text-slate-400">-</td>;
    const pct = max > 0 ? (score / max) * 100 : 0;
    const info = getGradeInfo(pct);
    return (
        <td className="py-4 px-3 text-center">
            <span className={`inline-flex items-center justify-center min-w-[40px] font-bold text-sm ${info.color}`}>
                {score}
            </span>
        </td>
    );
};

// Grand total cell with mini progress ring
const GrandTotalCell = ({ score, max = 100 }) => {
    if (score === null || score === undefined) return <td className="py-4 px-3 text-center text-slate-400">-</td>;
    const pct = max > 0 ? Math.min((score / max) * 100, 100) : 0;
    const info = getGradeInfo(pct);
    const circumference = 2 * Math.PI * 16;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
        <td className="py-4 px-3">
            <div className="flex items-center justify-center gap-2">
                <div className="relative w-10 h-10 shrink-0">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="3" />
                        <circle cx="18" cy="18" r="16" fill="none" className={info.bar.replace('bg-', 'stroke-')} strokeWidth="3"
                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${info.color}`}>
                        {Math.round(pct)}
                    </span>
                </div>
                <span className={`font-black text-base ${info.color}`}>{score}</span>
            </div>
        </td>
    );
};

export default function GradesIndex({ auth, monthlyGrades, semesterResults, children, activeChildId }) {
    const [activeTab, setActiveTab] = useState('monthly');
    const [expandedPeriods, setExpandedPeriods] = useState({});

    const resultPeriods = Object.keys(monthlyGrades || {});

    // Toggle period expansion
    const togglePeriod = (period) => {
        setExpandedPeriods(prev => ({ ...prev, [period]: !prev[period] }));
    };

    // Compute monthly summary statistics
    const monthlyStats = useMemo(() => {
        const stats = {};
        resultPeriods.forEach(period => {
            const grades = monthlyGrades[period] || [];
            const totals = grades.map(g => g.scores?.grand_total ?? 0).filter(t => t > 0);
            const sum = totals.reduce((a, b) => a + b, 0);
            const avg = totals.length > 0 ? sum / totals.length : 0;
            const highest = totals.length > 0 ? Math.max(...totals) : 0;
            const lowest = totals.length > 0 ? Math.min(...totals) : 0;
            const highestSubject = grades.find(g => (g.scores?.grand_total ?? 0) === highest)?.subject?.name || '-';
            stats[period] = { avg: Math.round(avg * 10) / 10, total: sum, count: grades.length, highest, lowest, highestSubject };
        });
        return stats;
    }, [monthlyGrades, resultPeriods]);

    // Compute semester summary
    const semesterStats = useMemo(() => {
        const stats = {};
        Object.keys(semesterResults || {}).forEach(semName => {
            const results = semesterResults[semName] || [];
            const totals = results.map(r => r.semester_total ?? 0).filter(t => t > 0);
            const sum = totals.reduce((a, b) => a + b, 0);
            const avg = totals.length > 0 ? sum / totals.length : 0;
            const highest = totals.length > 0 ? Math.max(...totals) : 0;
            const highestSubject = results.find(r => (r.semester_total ?? 0) === highest)?.subject?.name || '-';
            stats[semName] = { avg: Math.round(avg * 10) / 10, total: sum, count: results.length, highest, highestSubject };
        });
        return stats;
    }, [semesterResults]);

    // Overall average across all monthly periods
    const overallMonthlyAvg = useMemo(() => {
        const allAvgs = Object.values(monthlyStats).map(s => s.avg).filter(a => a > 0);
        if (allAvgs.length === 0) return 0;
        return Math.round((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) * 10) / 10;
    }, [monthlyStats]);

    const overallInfo = getGradeInfo(overallMonthlyAvg);

    return (
        <AdminLayout user={auth.user} activeMenu="درجاتي ونتائجي">
            <Head title="درجاتي ونتائجي" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 pb-24">
                <ChildSelector children={children} activeChildId={activeChildId} />

                {/* Main Header Card */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820]/95 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-dark-800" />
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute right-10 bottom-0 w-48 h-48 bg-primary-400/3 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/30 shadow-inner">
                                <Award size={32} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">درجاتي ونتائجي</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
                                    <FileText size={16} />
                                    تابع مستواك الأكاديمي ودرجاتك الشهرية والفصلية
                                </p>
                            </div>
                        </div>

                        {/* Overall quick badge */}
                        {overallMonthlyAvg > 0 && (
                            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${overallInfo.bg} ${overallInfo.border}`}>
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">المعدل العام</p>
                                    <p className={`text-2xl font-black ${overallInfo.color}`}>{overallMonthlyAvg}%</p>
                                </div>
                                <div className={`w-px h-10 bg-slate-200 dark:bg-slate-700`} />
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">التقدير</p>
                                    <p className={`text-lg font-black ${overallInfo.color}`}>{overallInfo.emoji} {overallInfo.label}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-[#1e293b] p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8 flex overflow-x-auto hide-scrollbar">
                    <button
                        onClick={() => setActiveTab('monthly')}
                        className={`flex-1 min-w-[150px] py-3.5 px-4 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'monthly'
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <BarChart3 size={18} />
                        الدرجات الشهرية
                    </button>
                    <button
                        onClick={() => setActiveTab('semester')}
                        className={`flex-1 min-w-[150px] py-3.5 px-4 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'semester'
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <GraduationCap size={18} />
                        النتائج الفصلية (الشهادات)
                    </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-8">
                    {activeTab === 'monthly' && (
                        <div className="space-y-6">
                            {resultPeriods.length > 0 ? (
                                resultPeriods.map((period, periodIdx) => {
                                    const stats = monthlyStats[period];
                                    const gradeInfo = getGradeInfo(stats.avg);
                                    const isExpanded = expandedPeriods[period] !== false; // default expanded

                                    return (
                                        <div key={period} className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300"
                                             style={{ animationDelay: `${periodIdx * 0.08}s` }}>
                                            {/* Period Header */}
                                            <div
                                                className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                                onClick={() => togglePeriod(period)}
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl ${gradeInfo.bg} ${gradeInfo.border} border flex items-center justify-center`}>
                                                            <BookOpen size={22} className={gradeInfo.color} />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                                {period}
                                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${gradeInfo.bg} ${gradeInfo.color} ${gradeInfo.border} border`}>
                                                                    {gradeInfo.emoji} {gradeInfo.label}
                                                                </span>
                                                            </h2>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                                                {stats.count} مواد  •  المعدل: <span className={`font-bold ${gradeInfo.color}`}>{stats.avg}%</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {monthlyGrades[period][0] && (
                                                            <a
                                                                href={route('student.certificate.monthly', monthlyGrades[period][0].period_id)}
                                                                target="_blank"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="hidden sm:flex items-center gap-1.5 text-sm font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors border border-primary-100 dark:border-primary-800/30"
                                                            >
                                                                📜 الشهادة
                                                            </a>
                                                        )}
                                                        <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                            <ChevronDown size={18} className="text-slate-500" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mini Stats Bar */}
                                                <div className="mt-4 grid grid-cols-3 gap-3">
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                                                        <p className="text-xs text-slate-400 font-medium mb-1">أعلى درجة</p>
                                                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.highest}</p>
                                                        <p className="text-[10px] text-slate-400 truncate">{stats.highestSubject}</p>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                                                        <p className="text-xs text-slate-400 font-medium mb-1">أقل درجة</p>
                                                        <p className="text-lg font-black text-amber-600 dark:text-amber-400">{stats.lowest}</p>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                                                        <p className="text-xs text-slate-400 font-medium mb-1">المجموع</p>
                                                        <p className="text-lg font-black text-primary-600 dark:text-primary-400">{stats.total}</p>
                                                    </div>
                                                </div>

                                                {/* Mobile certificate button */}
                                                {monthlyGrades[period][0] && (
                                                    <a
                                                        href={route('student.certificate.monthly', monthlyGrades[period][0].period_id)}
                                                        target="_blank"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="sm:hidden flex items-center justify-center gap-1.5 text-sm font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-4 py-2.5 rounded-xl hover:bg-primary-100 transition-colors border border-primary-100 dark:border-primary-800/30 mt-3"
                                                    >
                                                        📜 الشهادة الذكية
                                                    </a>
                                                )}
                                            </div>

                                            {/* Expandable Table */}
                                            {isExpanded && (
                                                <div className="p-4 md:p-6 animate-fade-in">
                                                    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                                                        <table className="w-full text-right">
                                                            <thead>
                                                                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                                                                    <th className="py-3.5 px-4 font-bold text-sm">#</th>
                                                                    <th className="py-3.5 px-4 font-bold text-sm">المادة</th>
                                                                    <th className="py-3.5 px-4 font-bold text-sm text-center">المشاركة</th>
                                                                    <th className="py-3.5 px-4 font-bold text-sm text-center">الواجبات</th>
                                                                    <th className="py-3.5 px-4 font-bold text-sm text-center">الاختبار</th>
                                                                    <th className="py-3.5 px-4 font-bold text-sm text-center">المجموع</th>
                                                                    <th className="py-3.5 px-4 font-bold text-sm text-center">المستوى</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {monthlyGrades[period].map((grade, idx) => {
                                                                    const grandTotal = grade.scores?.grand_total ?? 0;
                                                                    const gi = getGradeInfo(grandTotal);
                                                                    return (
                                                                        <tr key={grade.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors group">
                                                                            <td className="py-4 px-4 text-slate-400 text-sm font-medium">{idx + 1}</td>
                                                                            <td className="py-4 px-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-2 h-2 rounded-full ${gi.bar}`} />
                                                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{grade.subject?.name}</span>
                                                                                </div>
                                                                            </td>
                                                                            <ScoreCell score={grade.scores?.oral_total} />
                                                                            <ScoreCell score={grade.scores?.homework_total} />
                                                                            <ScoreCell score={grade.scores?.monthly_exam} />
                                                                            <GrandTotalCell score={grandTotal} />
                                                                            <td className="py-4 px-3 text-center">
                                                                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${gi.bg} ${gi.color} ${gi.border} border`}>
                                                                                    {gi.emoji} {gi.label}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="w-20 h-20 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5">
                                        <Award size={36} className="text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">لا توجد درجات</h3>
                                    <p className="text-slate-500">لم يتم رصد درجات شهرية لك حتى الآن.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'semester' && (
                        <div className="space-y-6">
                            {Object.keys(semesterResults || {}).length > 0 ? (
                                Object.keys(semesterResults).map((semesterName, semIdx) => {
                                    const stats = semesterStats[semesterName];
                                    const avgPct = stats.count > 0 ? (stats.avg / 100) * 100 : 0;
                                    const gradeInfo = getGradeInfo(avgPct);

                                    return (
                                        <div key={semesterName} className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden"
                                             style={{ animationDelay: `${semIdx * 0.08}s` }}>
                                            {/* Semester Header with gradient */}
                                            <div className="relative overflow-hidden bg-gradient-to-l from-primary-600 via-primary-500 to-primary-700 p-6 text-white">
                                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-xl" />
                                                <div className="absolute left-10 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-lg" />

                                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                                                            <GraduationCap size={24} />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-xl font-black flex items-center gap-2">
                                                                نتائج {semesterName}
                                                            </h2>
                                                            <p className="text-white/70 text-sm mt-0.5">{stats.count} مواد  •  المعدل: {stats.avg}%</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className="text-sm font-bold bg-white/15 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-white/10">
                                                            {gradeInfo.emoji} {gradeInfo.label}
                                                        </span>
                                                        <a
                                                            href={route('student.certificate', semesterResults[semesterName][0]?.semester_id)}
                                                            target="_blank"
                                                            className="flex items-center gap-1.5 text-sm font-bold bg-white text-primary-600 px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors shadow-md"
                                                        >
                                                            📜 الشهادة الذكية
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* Semester Mini Stats */}
                                                <div className="mt-5 grid grid-cols-3 gap-3 relative z-10">
                                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/5">
                                                        <p className="text-xs text-white/60 font-medium mb-1">المعدل</p>
                                                        <p className="text-xl font-black">{stats.avg}%</p>
                                                    </div>
                                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/5">
                                                        <p className="text-xs text-white/60 font-medium mb-1">أعلى مادة</p>
                                                        <p className="text-xl font-black">{stats.highest}</p>
                                                        <p className="text-[10px] text-white/50 truncate">{stats.highestSubject}</p>
                                                    </div>
                                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/5">
                                                        <p className="text-xs text-white/60 font-medium mb-1">المجموع</p>
                                                        <p className="text-xl font-black">{stats.total}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Semester Table */}
                                            <div className="p-4 md:p-6">
                                                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <table className="w-full text-right">
                                                        <thead>
                                                            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                                                                <th className="py-3.5 px-4 font-bold text-sm">#</th>
                                                                <th className="py-3.5 px-4 font-bold text-sm">المادة</th>
                                                                <th className="py-3.5 px-4 font-bold text-sm text-center">المحصلة الشهرية</th>
                                                                <th className="py-3.5 px-4 font-bold text-sm text-center">الاختبار النهائي</th>
                                                                <th className="py-3.5 px-4 font-bold text-sm text-center">المجموع</th>
                                                                <th className="py-3.5 px-4 font-bold text-sm text-center">المستوى</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {semesterResults[semesterName].map((result, idx) => {
                                                                const total = result.semester_total ?? 0;
                                                                const pct = (total / 100) * 100;
                                                                const gi = getGradeInfo(pct);
                                                                return (
                                                                    <tr key={result.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors">
                                                                        <td className="py-4 px-4 text-slate-400 text-sm font-medium">{idx + 1}</td>
                                                                        <td className="py-4 px-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`w-2 h-2 rounded-full ${gi.bar}`} />
                                                                                <span className="font-bold text-slate-700 dark:text-slate-200">{result.subject?.name}</span>
                                                                            </div>
                                                                        </td>
                                                                        <ScoreCell score={result.monthly_aggregate} />
                                                                        <ScoreCell score={result.final_exam_score} />
                                                                        <GrandTotalCell score={total} />
                                                                        <td className="py-4 px-3 text-center">
                                                                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${gi.bg} ${gi.color} ${gi.border} border`}>
                                                                                {gi.emoji} {gi.label}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="w-20 h-20 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5">
                                        <FileText size={36} className="text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">لا توجد نتائج</h3>
                                    <p className="text-slate-500">لم يتم اعتماد أي نتائج فصلية لك حتى الآن.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
