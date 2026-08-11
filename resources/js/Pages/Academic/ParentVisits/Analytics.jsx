import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { ArrowRight, BarChart3, Users, Calendar, Activity, TrendingUp, Clock, Target, Award, ChevronLeft } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700">
                <p className="text-sm font-black text-slate-800 dark:text-white mb-1">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} className="text-sm font-bold" style={{ color: p.color || p.fill }}>
                        {p.name}: <span className="font-black">{p.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Analytics({ auth, statusChart, timeChart, purposeChart, topStudents, totalVisits, currentFilter = 'year' }) {
    const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#f43f5e'];
    const PURPOSE_COLORS = ['#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

    const completedVisits = statusChart.find(s => s.name === 'مكتملة')?.value || 0;
    const scheduledVisits = statusChart.find(s => s.name === 'مجدولة')?.value || 0;
    const completionRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

    const handleFilterChange = (filter) => {
        router.get(route('academic.parent-visits.analytics'), { filter }, { preserveState: true, replace: true, preserveScroll: true });
    };

    return (
        <AdminLayout user={auth.user} activeMenu="زيارات أولياء الأمور">
            <Head title="تحليلات زيارات أولياء الأمور" />

            <div className="max-w-[1600px] mx-auto space-y-8">
                
                {/* ═══════════════════════════════════════════════
                     Premium Header
                    ═══════════════════════════════════════════════ */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Decorative SVG */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                            <circle cx="700" cy="50" r="3" className="fill-primary-300" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center">
                                    <BarChart3 size={22} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                تحليلات وإحصائيات الزيارات
                            </h1>
                            <p className="text-primary-700/70 dark:text-primary-300/60 mt-2 text-sm font-semibold mr-14">نظرة شاملة على أداء ومعدل زيارات أولياء الأمور ومؤشرات الأداء</p>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-4 shrink-0">
                            <div className="flex bg-white/80 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700 backdrop-blur-sm shadow-sm">
                                <button 
                                    onClick={() => handleFilterChange('month')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentFilter === 'month' ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                >
                                    هذا الشهر
                                </button>
                                <button 
                                    onClick={() => handleFilterChange('semester')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentFilter === 'semester' ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                >
                                    هذا الفصل
                                </button>
                                <button 
                                    onClick={() => handleFilterChange('year')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentFilter === 'year' ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                >
                                    السنة النشطة
                                </button>
                            </div>
                            <Link 
                                href={route('academic.parent-visits.index')} 
                                className="flex items-center gap-2 px-6 py-3 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:shadow-md transition-all active:scale-95 font-bold text-sm border border-slate-200 dark:border-slate-700 backdrop-blur-sm shrink-0"
                            >
                                <ChevronLeft size={16} />
                                العودة
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                     Stats Cards Row
                    ═══════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {/* Total Visits */}
                    <div className="group bg-white dark:bg-[#0f1419] rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/20 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
                                <Users size={22} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2.5 py-1 rounded-lg">
                                <TrendingUp size={12} />
                                الكل
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الزيارات</p>
                        <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{totalVisits}</p>
                    </div>
                    
                    {/* Completed */}
                    <div className="group bg-white dark:bg-[#0f1419] rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <Activity size={22} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                                <TrendingUp size={12} />
                                مكتملة
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الزيارات المكتملة</p>
                        <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{completedVisits}</p>
                    </div>

                    {/* Scheduled */}
                    <div className="group bg-white dark:bg-[#0f1419] rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-500/20 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                                <Calendar size={22} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg">
                                <Clock size={12} />
                                قادمة
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الزيارات المجدولة</p>
                        <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{scheduledVisits}</p>
                    </div>

                    {/* Completion Rate */}
                    <div className="group bg-white dark:bg-[#0f1419] rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-500/20 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                                <Target size={22} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-lg">
                                <TrendingUp size={12} />
                                نسبة
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">نسبة الإنجاز</p>
                        <div className="flex items-end gap-2">
                            <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{completionRate}</p>
                            <span className="text-lg font-black text-slate-400 mb-1">%</span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                     Charts Grid
                    ═══════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Status Distribution - Donut Chart */}
                    <div className="bg-white dark:bg-[#0f1419] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                                <Target size={18} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white">توزيع حالات الزيارات</h3>
                                <p className="text-xs text-slate-400 font-medium">تقسيم الزيارات حسب حالتها الحالية</p>
                            </div>
                        </div>
                        <div className="p-6 h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusChart}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={65}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        strokeWidth={0}
                                        label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                    >
                                        {statusChart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(value) => <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Peak Times - Area/Bar Chart */}
                    <div className="bg-white dark:bg-[#0f1419] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                                <Clock size={18} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white">أوقات الذروة</h3>
                                <p className="text-xs text-slate-400 font-medium">التوزيع الساعي لزيارات أولياء الأمور</p>
                            </div>
                        </div>
                        <div className="p-6 h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f030" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="الزيارات" 
                                        stroke="#3b82f6" 
                                        strokeWidth={2.5}
                                        fill="url(#colorVisits)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Purpose Distribution */}
                    <div className="bg-white dark:bg-[#0f1419] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                                <BarChart3 size={18} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white">تصنيف أسباب الزيارات</h3>
                                <p className="text-xs text-slate-400 font-medium">تحليل ذكي لأغراض الزيارات الأكثر شيوعاً</p>
                            </div>
                        </div>
                        <div className="p-6 h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={purposeChart}
                                        cx="50%"
                                        cy="45%"
                                        outerRadius={100}
                                        dataKey="value"
                                        strokeWidth={0}
                                        label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                    >
                                        {purposeChart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PURPOSE_COLORS[index % PURPOSE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(value) => <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Students - Premium Leaderboard */}
                    <div className="bg-white dark:bg-[#0f1419] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
                                <Award size={18} className="text-rose-600 dark:text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white">أكثر الطلاب زيارة / استدعاء</h3>
                                <p className="text-xs text-slate-400 font-medium">ترتيب الطلاب الأكثر تفاعلاً مع أولياء أمورهم</p>
                            </div>
                        </div>
                        <div className="p-5">
                            {topStudents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                        <Users size={28} className="opacity-40" />
                                    </div>
                                    <p className="font-bold text-sm">لا توجد بيانات كافية لعرضها</p>
                                    <p className="text-xs text-slate-400 mt-1">ستظهر البيانات بعد تسجيل زيارات كافية</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topStudents.map((student, idx) => {
                                        const maxVal = topStudents[0]?.total || 1;
                                        const percentage = Math.round((student.total / maxVal) * 100);
                                        const rankColors = [
                                            'from-amber-500 to-orange-500 shadow-amber-500/20',
                                            'from-slate-400 to-slate-500 shadow-slate-400/20',
                                            'from-amber-700 to-amber-800 shadow-amber-700/20',
                                        ];
                                        const barColors = [
                                            'from-amber-500/20 to-orange-500/10',
                                            'from-blue-500/15 to-blue-500/5',
                                            'from-emerald-500/15 to-emerald-500/5',
                                            'from-violet-500/15 to-violet-500/5',
                                            'from-rose-500/15 to-rose-500/5',
                                        ];
                                        
                                        return (
                                            <div key={idx} className="group relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-500/20 transition-all duration-300">
                                                {/* Progress Background */}
                                                <div 
                                                    className={`absolute inset-y-0 right-0 bg-gradient-to-l ${barColors[idx % barColors.length]} transition-all duration-1000 ease-out`}
                                                    style={{ width: `${percentage}%` }} 
                                                />
                                                <div className="relative flex items-center justify-between p-4">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${idx < 3 ? rankColors[idx] : 'from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600'} text-white flex items-center justify-center font-black text-sm shadow-md ${idx < 3 ? rankColors[idx].split(' ').pop() : ''}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-slate-800 dark:text-white text-sm">{student.name}</span>
                                                            {idx === 0 && (
                                                                <span className="mr-2 inline-flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                                                                    الأكثر
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-400">زيارة</span>
                                                        <div className="font-black text-xl text-primary-600 dark:text-primary-400 tabular-nums">
                                                            {student.total}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
