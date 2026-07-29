import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart as BarChartIcon, TrendingUp, TrendingDown, Users, Target, Activity } from 'lucide-react';

export default function AppraisalsDashboard({ departmentPerformance, distribution, selfVsManager, topEmployees, bottomEmployees }) {
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
    // We only have the overall average right now, so we can display it as a simple bar or radial chart, but let's make a dual bar chart.
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
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <Activity size={28} className="text-primary-600" />
                                لوحة بيانات الأداء التحليلية
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تحليل شامل لنتائج تقييمات الأداء عبر الأقسام والموظفين</p>
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
