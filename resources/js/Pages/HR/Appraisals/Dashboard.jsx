import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart as BarChartIcon, TrendingUp, TrendingDown, Users, Target, Activity, Filter, RefreshCw, Award, CheckCircle, Layers, GraduationCap, ShieldCheck } from 'lucide-react';

const RECOMMENDATION_CARDS = [
    { key: 'promotion', label: 'ترقية', cls: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
    { key: 'reward', label: 'مكافأة تشجيعية / تميز', cls: 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20 text-teal-700 dark:text-teal-300' },
    { key: 'training', label: 'برنامج تدريبي', cls: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300' },
    { key: 'contract_renewal', label: 'تجديد عقد', cls: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300' },
    { key: 'pip', label: 'خطة تحسين أداء (PIP)', cls: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300' },
    { key: 'warning', label: 'لفت نظر / إنذار', cls: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300' },
];

export default function AppraisalsDashboard({
    departmentPerformance = [],
    distribution = {},
    selfVsManager,
    topEmployees = [],
    bottomEmployees = [],
    recommendationsBreakdown = {},
    categoryPerformance = [],
    committeeStats = {},
    cycles = [],
    departments = [],
    employees = [],
    filters = {},
}) {
    // Filter State
    const [filterData, setFilterData] = useState({
        cycle_id: filters.cycle_id || '',
        department_id: filters.department_id || '',
        employee_id: filters.employee_id || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || ''
    });

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('hr.appraisals.dashboard'), filterData, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const clearFilters = () => {
        setFilterData({ cycle_id: '', department_id: '', employee_id: '', date_from: '', date_to: '' });
        router.get(route('hr.appraisals.dashboard'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Colors for pie chart
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'];
    
    // Prepare data for Pie Chart
    const pieData = [
        { name: 'ممتاز (90-100)', value: distribution.excellent },
        { name: 'جيد جداً (80-89)', value: distribution.vgood },
        { name: 'جيد (70-79)', value: distribution.good },
        { name: 'يحتاج تحسين (<70)', value: distribution.needs_improvement },
    ].filter(d => d.value > 0);

    // Prepare data for Radar Chart (Self vs Manager)
    const comparisonData = [
        { name: 'متوسط التقييم (من 5)', الذاتي: selfVsManager?.avg_self || 0, المدير: selfVsManager?.avg_manager || 0 }
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-xl z-50 relative">
                    <p className="font-bold text-slate-800 dark:text-white mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-semibold flex items-center justify-between gap-4" style={{ color: entry.color }}>
                            <span>{entry.name}</span>
                            <span>{entry.value}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <AdminLayout activeMenu="لوحة بيانات التقييم">
            <Head title="لوحة بيانات التقييم | النظام الإداري" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                {/* Header & Filters */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 border-b border-primary-100 dark:border-primary-500/10 pb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <Activity size={28} className="text-primary-600" />
                                لوحة بيانات الأداء التحليلية
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تحليل شامل لنتائج تقييمات الأداء عبر الأقسام والموظفين</p>
                        </div>
                    </div>
                    
                    {/* Filter Bar */}
                    <form onSubmit={handleFilter} className="relative z-10 bg-white/50 dark:bg-slate-900/50 p-5 rounded-2xl border border-primary-50 dark:border-primary-500/10 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-4 text-primary-600 dark:text-primary-400 font-bold text-sm">
                            <Filter size={18} /> خيارات التصفية
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">دورة التقييم</label>
                                <select 
                                    value={filterData.cycle_id} 
                                    onChange={e => setFilterData({...filterData, cycle_id: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                >
                                    <option value="">جميع دورات التقييم</option>
                                    {cycles.map(cycle => (
                                        <option key={cycle.id} value={cycle.id}>{cycle.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">القسم</label>
                                <select 
                                    value={filterData.department_id} 
                                    onChange={e => setFilterData({...filterData, department_id: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                >
                                    <option value="">جميع الأقسام</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">الموظف</label>
                                <select 
                                    value={filterData.employee_id} 
                                    onChange={e => setFilterData({...filterData, employee_id: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                >
                                    <option value="">جميع الموظفين</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">من تاريخ</label>
                                <input 
                                    type="date"
                                    value={filterData.date_from} 
                                    onChange={e => setFilterData({...filterData, date_from: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">إلى تاريخ</label>
                                <input 
                                    type="date"
                                    value={filterData.date_to} 
                                    onChange={e => setFilterData({...filterData, date_to: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-2 mt-5 pt-4 border-t border-primary-50 dark:border-primary-500/10">
                            {(filters.cycle_id || filters.department_id || filters.employee_id || filters.date_from || filters.date_to) && (
                                <button type="button" onClick={clearFilters} className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2" title="مسح الفلاتر">
                                    <RefreshCw size={16} /> مسح
                                </button>
                            )}
                            <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2">
                                عرض النتائج
                            </button>
                        </div>
                    </form>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">نسبة إنجاز لجان التقييم</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{committeeStats.completion_rate ?? 0}%</p>
                            <p className="text-[11px] font-semibold text-slate-400 mt-1">
                                مكتمل {committeeStats.submitted_assignments ?? 0} من {committeeStats.total_assignments ?? 0} مهام
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                            <CheckCircle size={22} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">تقييمات متعددة المقيّمين</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{committeeStats.multi_evaluator_appraisals ?? 0}</p>
                            <p className="text-[11px] font-semibold text-slate-400 mt-1">
                                بانتظار التنفيذ: {committeeStats.pending_assignments ?? 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                            <ShieldCheck size={22} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">مرشحون للترقية أو المكافأة</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                {(recommendationsBreakdown.promotion || 0) + (recommendationsBreakdown.reward || 0)}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-400 mt-1">
                                ترقية: {recommendationsBreakdown.promotion || 0} | مكافأة: {recommendationsBreakdown.reward || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 flex items-center justify-center">
                            <Award size={22} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">بحاجة لتدريب أو خطة PIP</p>
                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                                {(recommendationsBreakdown.training || 0) + (recommendationsBreakdown.pip || 0)}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-400 mt-1">
                                تدريب: {recommendationsBreakdown.training || 0} | PIP: {recommendationsBreakdown.pip || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center">
                            <GraduationCap size={22} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Department Performance Bar Chart */}
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 text-sm">
                            <BarChartIcon size={16} className="text-primary-500" /> متوسط الأداء حسب القسم
                        </h3>
                        <div className="h-72" dir="ltr">
                            {departmentPerformance.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={departmentPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="avg_score" name="متوسط النسبة" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">لا توجد بيانات كافية</div>
                            )}
                        </div>
                    </div>

                    {/* Grade Distribution Pie Chart */}
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 text-sm">
                            <Target size={16} className="text-primary-500" /> التوزيع العام للنتائج
                        </h3>
                        <div className="h-72" dir="ltr">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip content={<div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-xl text-sm font-bold"><p>{'عدد الموظفين'}</p></div>} />
                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">لا توجد بيانات كافية</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Category Performance & Recommendations Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance by KPI Category */}
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-sm">
                            <Layers size={16} className="text-primary-500" /> متوسط الأداء حسب تصنيفات المعايير (من 5)
                        </h3>
                        {categoryPerformance.length > 0 ? (
                            <div className="space-y-4">
                                <div className="h-56" dir="ltr">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                            <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                                            <Bar dataKey="avg_score_5" name="متوسط اللجنة / المدير" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                            <Bar dataKey="avg_self_5" name="متوسط الذاتي" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    {categoryPerformance.map((cat) => (
                                        <div key={cat.category} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{cat.category}</span>
                                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                                                {cat.avg_score_pct}% ({cat.avg_score_5}/5)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-56 flex items-center justify-center text-slate-400 font-bold text-sm">لا توجد تقييمات مصنفة كافية بعد</div>
                        )}
                    </div>

                    {/* Administrative Recommendations Breakdown */}
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 text-sm">
                            <Award size={16} className="text-primary-500" /> توزيع القرارات والتوصيات الإدارية النهائية
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {RECOMMENDATION_CARDS.map((card) => (
                                <div key={card.key} className={`p-4 rounded-2xl border flex items-center justify-between ${card.cls}`}>
                                    <div>
                                        <p className="text-xs font-bold">{card.label}</p>
                                        <p className="text-[10px] opacity-75 font-semibold mt-0.5">توصيات اللجان والموارد البشرية</p>
                                    </div>
                                    <span className="text-2xl font-black">{recommendationsBreakdown[card.key] || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Self vs Manager Comparison */}
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden lg:col-span-1">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 text-sm">
                            <Users size={16} className="text-primary-500" /> التقييم الذاتي مقابل المدير
                        </h3>
                        <div className="h-56" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                                    <Bar dataKey="الذاتي" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="المدير" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4 font-semibold">
                            هذا المؤشر يوضح هل يميل الموظفون للمبالغة في تقييم أنفسهم مقارنة بتقييم مدرائهم (من 5).
                        </p>
                    </div>

                    {/* Top & Bottom Performers */}
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden lg:col-span-2">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Top 5 */}
                            <div>
                                <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2 text-sm">
                                    <TrendingUp size={16} /> أفضل 5 موظفين أداءً
                                </h3>
                                <div className="space-y-3">
                                    {topEmployees.map((appraisal, idx) => (
                                        <div key={appraisal.id} className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">{idx + 1}</div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{appraisal.employee?.user?.name}</p>
                                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{appraisal.employee?.department?.name}</p>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-xs font-black">{appraisal.final_score}%</span>
                                        </div>
                                    ))}
                                    {topEmployees.length === 0 && <p className="text-xs text-slate-400 text-center py-4 font-bold">لا توجد تقييمات مكتملة</p>}
                                </div>
                            </div>

                            {/* Bottom 5 */}
                            <div>
                                <h3 className="font-bold text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2 text-sm">
                                    <TrendingDown size={16} /> أقل 5 موظفين أداءً
                                </h3>
                                <div className="space-y-3">
                                    {bottomEmployees.map((appraisal, idx) => (
                                        <div key={appraisal.id} className="flex items-center justify-between p-3 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-xs">{idx + 1}</div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{appraisal.employee?.user?.name}</p>
                                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{appraisal.employee?.department?.name}</p>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-xs font-black">{appraisal.final_score}%</span>
                                        </div>
                                    ))}
                                    {bottomEmployees.length === 0 && <p className="text-xs text-slate-400 text-center py-4 font-bold">لا توجد تقييمات مكتملة</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
