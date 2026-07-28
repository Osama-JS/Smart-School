import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { Users, UserX, Activity, Search, Shield, Clock, TrendingUp, Eye, ChevronRight, CheckCircle2, AlertCircle, BarChart3, ArrowLeft } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function UserEngagementIndex({ users, filters, stats }) {
    const [searchValue, setSearchValue] = useState(filters.search || '');

    const handleFilterChange = (newFilter) => {
        router.get(route('admin.engagement.index'), { ...filters, filter: newFilter, page: 1 }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('admin.engagement.index'), { ...filters, search: e.target.value, page: 1 }, { preserveState: true, preserveScroll: true });
        }
    };

    const handlePagination = (url) => {
        if (url) router.get(url, filters, { preserveState: true, preserveScroll: true });
    };

    // Calculate engagement rate
    const engagementRate = stats.total_users > 0 ? Math.round((stats.active_today / stats.total_users) * 100) : 0;

    return (
        <AdminLayout activeMenu="تفاعل المستخدمين">
            <Head title="سجل تفاعل المستخدمين" />

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
                                <Activity size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">سجل التفاعل والنشاط</h1>
                                    <Link
                                        href={route('admin.traffic.index')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 dark:bg-dark-700 dark:hover:bg-dark-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                    >
                                        <ArrowLeft size={14} />
                                        إحصائيات المرور
                                    </Link>
                                </div>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">مراقبة تفاعل الأفراد والدخول اليومي واكتشاف الخاملين</p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-80 group z-50">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-primary-400">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={handleSearch}
                                className="block w-full pl-4 pr-10 py-3 bg-white/80 dark:bg-slate-900/80 border border-primary-100 dark:border-primary-500/20 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm placeholder:text-slate-400 font-medium"
                                placeholder="ابحث باسم المستخدم أو البريد..."
                            />
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    STATS CARDS — KPI Overview
                   ═══════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Active Today */}
                    <button
                        onClick={() => handleFilterChange('active_today')}
                        className={`bg-white dark:bg-slate-900/60 border rounded-3xl p-6 shadow-sm transition-all text-right flex flex-col group cursor-pointer relative overflow-hidden ${
                            filters.filter === 'active_today'
                            ? 'border-primary-500 ring-2 ring-primary-500/20'
                            : 'border-slate-100 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-500/30'
                        }`}
                    >
                        {filters.filter === 'active_today' && <div className="absolute inset-0 bg-primary-500/5 dark:bg-primary-500/10" />}
                        <div className="absolute -left-4 -top-4 w-20 h-20 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                        <div className="relative z-10 w-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-xs">
                                    <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl ring-1 ring-primary-500/20">
                                        <Activity size={16} />
                                    </div>
                                    نشطون اليوم
                                </div>
                                {filters.filter === 'active_today' && <CheckCircle2 size={18} className="text-primary-500" />}
                            </div>
                            <div className="text-4xl font-black text-slate-800 dark:text-white font-mono group-hover:scale-105 transition-transform origin-right">{stats.active_today}</div>
                            <div className="text-[10px] text-slate-500 mt-2 font-semibold">سجلوا دخولهم خلال الـ 24 ساعة الماضية</div>
                        </div>
                    </button>

                    {/* Ghosts */}
                    <button
                        onClick={() => handleFilterChange('ghosts')}
                        className={`bg-white dark:bg-slate-900/60 border rounded-3xl p-6 shadow-sm transition-all text-right flex flex-col group cursor-pointer relative overflow-hidden ${
                            filters.filter === 'ghosts'
                            ? 'border-accent-500 ring-2 ring-accent-500/20'
                            : 'border-slate-100 dark:border-slate-800 hover:border-accent-300 dark:hover:border-accent-500/30'
                        }`}
                    >
                        {filters.filter === 'ghosts' && <div className="absolute inset-0 bg-accent-500/5 dark:bg-accent-500/10" />}
                        <div className="absolute -left-4 -top-4 w-20 h-20 bg-accent-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                        <div className="relative z-10 w-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-accent-600 dark:text-accent-400 font-bold text-xs">
                                    <div className="p-2 bg-accent-50 dark:bg-accent-500/10 rounded-xl ring-1 ring-accent-500/20">
                                        <UserX size={16} />
                                    </div>
                                    الأشباح (الخاملين)
                                </div>
                                {filters.filter === 'ghosts' && <CheckCircle2 size={18} className="text-accent-500" />}
                            </div>
                            <div className="text-4xl font-black text-slate-800 dark:text-white font-mono group-hover:scale-105 transition-transform origin-right">{stats.ghosts}</div>
                            <div className="text-[10px] text-slate-500 mt-2 font-semibold">لم يسجلوا دخولهم للنظام أبداً</div>
                        </div>
                    </button>

                    {/* All Users */}
                    <button
                        onClick={() => handleFilterChange('all')}
                        className={`bg-white dark:bg-slate-900/60 border rounded-3xl p-6 shadow-sm transition-all text-right flex flex-col group cursor-pointer relative overflow-hidden ${
                            filters.filter === 'all'
                            ? 'border-dark-600 ring-2 ring-dark-500/20'
                            : 'border-slate-100 dark:border-slate-800 hover:border-dark-300 dark:hover:border-dark-500/30'
                        }`}
                    >
                        {filters.filter === 'all' && <div className="absolute inset-0 bg-dark-500/5 dark:bg-dark-500/10" />}
                        <div className="absolute -left-4 -top-4 w-20 h-20 bg-dark-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                        <div className="relative z-10 w-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-dark-600 dark:text-dark-300 font-bold text-xs">
                                    <div className="p-2 bg-dark-50 dark:bg-dark-700 rounded-xl ring-1 ring-dark-200 dark:ring-dark-600">
                                        <Users size={16} />
                                    </div>
                                    إجمالي الحسابات
                                </div>
                                {filters.filter === 'all' && <CheckCircle2 size={18} className="text-dark-600 dark:text-dark-300" />}
                            </div>
                            <div className="text-4xl font-black text-slate-800 dark:text-white font-mono group-hover:scale-105 transition-transform origin-right">{stats.total_users}</div>
                            <div className="text-[10px] text-slate-500 mt-2 font-semibold">جميع الحسابات المسجلة بالنظام</div>
                        </div>
                    </button>

                    {/* Engagement Rate — NEW KPI */}
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute -left-4 -top-4 w-20 h-20 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-xs mb-4">
                                <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl ring-1 ring-primary-500/20">
                                    <TrendingUp size={16} />
                                </div>
                                نسبة التفاعل اليوم
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="text-4xl font-black text-slate-800 dark:text-white font-mono">{engagementRate}</div>
                                <span className="text-lg font-black text-primary-500 mb-1">%</span>
                            </div>
                            {/* Mini progress bar */}
                            <div className="mt-3 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700"
                                    style={{ width: `${Math.min(engagementRate, 100)}%` }}
                                />
                            </div>
                            <div className="text-[10px] text-slate-500 mt-2 font-semibold">
                                {stats.active_today} نشط من أصل {stats.total_users}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    USERS TABLE — Premium data table
                   ═══════════════════════════════════════════════════════════ */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    {/* Table Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-primary-50/20 dark:bg-primary-500/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl ring-1 ring-primary-500/20">
                                <BarChart3 size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">سجل المستخدمين</h3>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                    {filters.filter === 'active_today' && 'عرض المستخدمين النشطين اليوم'}
                                    {filters.filter === 'ghosts' && 'عرض المستخدمين الخاملين (الأشباح)'}
                                    {filters.filter === 'all' && 'عرض جميع المستخدمين'}
                                    {!['active_today', 'ghosts', 'all'].includes(filters.filter) && 'جميع المستخدمين'}
                                </p>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
                            {users.total} مستخدم
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-bold text-xs border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="py-4 px-6">المستخدم</th>
                                    <th className="py-4 px-6">الدور</th>
                                    <th className="py-4 px-6 text-center">مرات الدخول (اليوم)</th>
                                    <th className="py-4 px-6 text-center">إجمالي الدخول</th>
                                    <th className="py-4 px-6 text-center">الحالة</th>
                                    <th className="py-4 px-6 text-left">آخر ظهور</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {users.data.map((user) => {
                                    // Determine engagement level
                                    const isGhost = !user.last_login_at;
                                    const isActiveToday = user.today_logins > 0;
                                    const isPowerUser = user.total_logins > 50;

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ring-1 transition-all ${
                                                        isGhost
                                                        ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-500 ring-accent-500/20'
                                                        : isActiveToday
                                                        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 ring-primary-500/20'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 ring-slate-200 dark:ring-slate-700'
                                                    }`}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                                            {user.name}
                                                            {isActiveToday && (
                                                                <span className="flex h-2 w-2 relative">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 w-fit px-2.5 py-1 rounded-lg ring-1 ring-primary-500/20">
                                                    <Shield size={12} />
                                                    {user.role ? user.role.name : 'غير محدد'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {user.today_logins > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2.5 py-1 rounded-lg font-black text-xs ring-1 ring-primary-500/20">
                                                        <Eye size={12} />
                                                        {user.today_logins}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-black text-slate-900 dark:text-white">{user.total_logins}</span>
                                                    {isPowerUser && (
                                                        <span className="text-[9px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-1.5 py-0.5 rounded">مستخدم نشط</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {isGhost ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 text-[10px] font-bold ring-1 ring-accent-500/20">
                                                        <AlertCircle size={11} />
                                                        شبح
                                                    </span>
                                                ) : isActiveToday ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold ring-1 ring-primary-500/20">
                                                        <CheckCircle2 size={11} />
                                                        نشط
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold ring-1 ring-slate-200 dark:ring-slate-700">
                                                        <Clock size={11} />
                                                        غير نشط
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-left">
                                                {user.last_login_at ? (
                                                    <div>
                                                        <div className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                                            {new Date(user.last_login_at).toLocaleDateString('ar-SA', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {new Date(user.last_login_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400 text-[10px] font-bold ring-1 ring-accent-500/20">
                                                        <UserX size={12} />
                                                        لم يدخل أبداً
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 ring-1 ring-primary-500/20">
                                                    <Users size={28} />
                                                </div>
                                                <p className="text-slate-500 font-bold text-sm">لا يوجد بيانات مطابقة للفلتر أو البحث.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.links.length > 3 && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="text-[10px] text-slate-500 font-semibold">
                                صفحة {users.current_page} من {users.last_page}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {users.links.map((link, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePagination(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            link.active
                                            ? 'bg-primary-500 text-white shadow-sm ring-1 ring-primary-600/20'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 ring-1 ring-slate-200 dark:ring-slate-700'
                                        } ${!link.url && 'opacity-40 cursor-not-allowed'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
