import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { ArrowRight, Activity, AlertTriangle, Users, CalendarDays } from 'lucide-react';

export default function Analytics({ auth, commonViolations, violationsByDay, violationsByDivision }) {
    const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

    return (
        <AdminLayout user={auth.user}>
            <Head title="التحليل السلوكي للمخالفات" />

            <div className="min-h-screen bg-slate-50/50 dark:bg-[#0a0f16] p-4 sm:p-6 lg:p-8 font-cairo" dir="rtl">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header Section */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                        
                        {/* Visual geometric lines */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                                <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                                <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                            </svg>
                        </div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <Link
                                    href={route('academic.student-violations.index')}
                                    className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1a222c] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/20 transition-all shadow-sm"
                                >
                                    <ArrowRight size={22} />
                                </Link>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                        <Activity size={28} className="text-primary-600" />
                                        لوحة التحليل السلوكي
                                    </h1>
                                    <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تحليل وإحصائيات المخالفات السلوكية للطلاب</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Common Violations Chart */}
                        <div className="bg-white dark:bg-[#121820] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 lg:p-8">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <AlertTriangle className="text-rose-500" size={20} />
                                أكثر المخالفات شيوعاً
                            </h3>
                            <div className="h-[300px] w-full">
                                {commonViolations.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={commonViolations} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#6366f1" />
                                                    <stop offset="100%" stopColor="#8b5cf6" />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dx={-10} />
                                            <RechartsTooltip 
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="count" name="عدد المخالفات" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 font-bold">لا توجد بيانات كافية</div>
                                )}
                            </div>
                        </div>

                        {/* Violations by Day */}
                        <div className="bg-white dark:bg-[#121820] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 lg:p-8">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <CalendarDays className="text-amber-500" size={20} />
                                معدل المخالفات حسب أيام الأسبوع
                            </h3>
                            <div className="h-[300px] w-full">
                                {violationsByDay.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={violationsByDay} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                            <defs>
                                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dx={-10} />
                                            <RechartsTooltip 
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Area type="monotone" dataKey="count" name="عدد المخالفات" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#areaGradient)" activeDot={{ r: 8, fill: '#3b82f6', strokeWidth: 0 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 font-bold">لا توجد بيانات كافية</div>
                                )}
                            </div>
                        </div>

                        {/* Violations by Division */}
                        <div className="lg:col-span-2 bg-white dark:bg-[#121820] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 lg:p-8">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Users className="text-emerald-500" size={20} />
                                أكثر الفصول تسجيلاً للمخالفات
                            </h3>
                            <div className="h-[350px] w-full">
                                {violationsByDivision.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={violationsByDivision} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 10 }}>
                                            <defs>
                                                <linearGradient id="barGradientHorizontal" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#14b8a6" />
                                                    <stop offset="100%" stopColor="#0ea5e9" />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.2} />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} width={150} />
                                            <RechartsTooltip 
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="count" name="عدد المخالفات" fill="url(#barGradientHorizontal)" radius={[0, 6, 6, 0]} barSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 font-bold">لا توجد بيانات كافية</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
