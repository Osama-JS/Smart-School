import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { 
    BookOpen, Sparkles, CheckCircle, Clock, AlertCircle, FileText, ArrowRight,
    TrendingUp, ShieldAlert, AlertTriangle, BarChart
} from 'lucide-react';

export default function AnalyticsDashboard({ stats, statusDistribution, teacherPerformance, alerts }) {
    
    // Custom tooltip for Donut Chart
    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-sm font-bold">
                    <p className="text-slate-700 dark:text-slate-200">{payload[0].name}</p>
                    <p style={{ color: payload[0].payload.color }}>{payload[0].value} خطة</p>
                </div>
            );
        }
        return null;
    };

    // Custom tooltip for Bar Chart
    const CustomBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-sm min-w-[150px]">
                    <p className="font-bold text-slate-800 dark:text-white mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex justify-between items-center mb-1 font-bold" style={{ color: entry.color }}>
                            <span>{entry.name}</span>
                            <span className="ml-4">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <AdminLayout activeMenu="الخطط الدراسية">
            <Head title="مؤشرات أداء المشرفين | النظام الأكاديمي" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-indigo-100 dark:border-indigo-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-700" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <Link href={route('academic.study-plans.index')} className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-3 hover:text-indigo-800 transition">
                                <ArrowRight size={16} /> العودة للخطط الدراسية
                            </Link>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <TrendingUp size={28} className="text-indigo-600" />
                                لوحة مؤشرات أداء المشرفين
                            </h1>
                            <p className="text-indigo-700/80 dark:text-indigo-300/80 mt-2 text-sm font-semibold">
                                إحصائيات بصرية لنسب الإنجاز، والتزام المعلمين بتسليم الخطط الدراسية.
                            </p>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition">
                            <BookOpen size={64} className="text-indigo-500" />
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي الخطط</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.total}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition">
                            <CheckCircle size={64} className="text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">نسبة الاعتماد</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.approvalRate}%</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition">
                            <Clock size={64} className="text-amber-500" />
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">قيد المراجعة</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.pending}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition">
                            <ShieldAlert size={64} className="text-rose-500" />
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center shadow-inner">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">تنبيهات ذكية</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{alerts.length}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status Distribution Donut Chart */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                <FileText className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">حالة الخطط المرفوعة</h3>
                        </div>
                        
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomPieTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Smart Alerts */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-xl">
                                <Sparkles className="w-5 h-5 text-rose-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">التنبيهات الذكية (Smart Alerts)</h3>
                        </div>
                        
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {alerts.length > 0 ? alerts.map((alert) => (
                                <div key={alert.id} className={`p-4 rounded-2xl flex gap-4 items-start ${
                                    alert.type === 'danger' 
                                        ? 'bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30' 
                                        : 'bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30'
                                }`}>
                                    <div className={`mt-0.5 ${alert.type === 'danger' ? 'text-rose-500' : 'text-amber-500'}`}>
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm mb-1 ${alert.type === 'danger' ? 'text-rose-800 dark:text-rose-400' : 'text-amber-800 dark:text-amber-400'}`}>
                                            {alert.title}
                                        </h4>
                                        <p className={`text-xs font-semibold ${alert.type === 'danger' ? 'text-rose-600 dark:text-rose-500/80' : 'text-amber-600 dark:text-amber-500/80'}`}>
                                            {alert.message}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                                    <CheckCircle size={48} className="text-emerald-200 dark:text-emerald-900 mb-3" />
                                    <p className="font-bold text-sm">جميع الأمور ممتازة ولا توجد تنبيهات حالياً.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Teacher Performance Bar Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                            <BarChart className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">إنجاز المعلمين (أعلى 10)</h3>
                    </div>
                    
                    <div className="h-[400px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart
                                data={teacherPerformance}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                                    angle={-45}
                                    textAnchor="end"
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                                />
                                <RechartsTooltip content={<CustomBarTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '40px' }} />
                                <Bar dataKey="approved" name="معتمدة" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="pending" name="قيد المراجعة" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="rejected" name="مرفوضة" stackId="a" fill="#ef4444" />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
