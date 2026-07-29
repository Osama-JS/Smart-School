import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { Users, UserX, Activity, Search, Shield, Clock, TrendingUp, Eye, ChevronRight, CheckCircle2, AlertCircle, BarChart3, ArrowLeft, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, Calendar, Filter, ArrowUp, ArrowDown, Bell, FileSpreadsheet, Printer, Send, Monitor, Smartphone, LayoutList, History, X } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import Swal from 'sweetalert2';
import axios from 'axios';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function UserEngagementIndex({ users, filters, stats, charts, availableRoles }) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [dateRange, setDateRange] = useState([filters.date_start ? new Date(filters.date_start) : null, filters.date_end ? new Date(filters.date_end) : null]);
    
    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedUserDetails, setSelectedUserDetails] = useState(null);
    const [drawerLoading, setDrawerLoading] = useState(false);

    const handleAdvancedFilter = (role, dRange) => {
        let dateStart = '';
        let dateEnd = '';
        if (dRange && dRange.length === 2 && dRange[0] && dRange[1]) {
            // YYYY-MM-DD format
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            dateStart = (new Date(dRange[0] - tzoffset)).toISOString().split('T')[0];
            dateEnd = (new Date(dRange[1] - tzoffset)).toISOString().split('T')[0];
        }
        router.get(route('admin.engagement.index'), { ...filters, role, date_start: dateStart, date_end: dateEnd, page: 1 }, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field) => {
        let direction = 'desc';
        if (filters.sort === field && filters.direction === 'desc') {
            direction = 'asc';
        }
        router.get(route('admin.engagement.index'), { ...filters, sort: field, direction }, { preserveState: true, preserveScroll: true });
    };

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

    const handleExport = () => {
        const queryParams = new URLSearchParams(filters).toString();
        window.location.href = route('admin.engagement.export') + '?' + queryParams;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleNudge = (user, e) => {
        if (e) e.stopPropagation();
        Swal.fire({
            title: 'تنبيه المستخدم',
            text: `هل أنت متأكد من إرسال بريد وتنبيه للمستخدم ${user.name} لتذكيره بتسجيل الدخول؟`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، أرسل التنبيه',
            cancelButtonText: 'إلغاء',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.engagement.nudge', user.id), {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire('تم الإرسال!', 'تم إرسال التنبيه للمستخدم بنجاح.', 'success');
                    }
                });
            }
        });
    };

    const handleRowClick = async (user) => {
        setIsDrawerOpen(true);
        setDrawerLoading(true);
        setSelectedUserDetails({ ...user, activities: [], devices: [], avg_session_minutes: 0 });
        
        try {
            const response = await axios.get(route('admin.engagement.show', user.id));
            setSelectedUserDetails({
                ...response.data.user,
                activities: response.data.activities,
                devices: response.data.devices,
                avg_session_minutes: response.data.avg_session_minutes
            });
        } catch (error) {
            console.error('Error fetching user details:', error);
            Swal.fire('خطأ', 'حدث خطأ أثناء جلب تفاصيل المستخدم.', 'error');
        } finally {
            setDrawerLoading(false);
        }
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
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleExport}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                        >
                                            <FileSpreadsheet size={14} />
                                            تصدير CSV
                                        </button>
                                        <button
                                            onClick={handlePrint}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all shadow-sm"
                                        >
                                            <Printer size={14} />
                                            طباعة التقرير
                                        </button>
                                        <Link
                                            href={route('admin.traffic.index')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 dark:bg-dark-700 dark:hover:bg-dark-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                        >
                                            <ArrowLeft size={14} />
                                            إحصائيات المرور
                                        </Link>
                                    </div>
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
                            <div className="flex items-end gap-3 mb-1">
                                <div className="text-4xl font-black text-slate-800 dark:text-white font-mono group-hover:scale-105 transition-transform origin-right">{stats.active_today}</div>
                                {stats.growth !== undefined && (
                                    <div className={`flex items-center text-xs font-bold ${stats.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {stats.growth >= 0 ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
                                        {Math.abs(stats.growth)}%
                                    </div>
                                )}
                            </div>
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
                    CHARTS — Data Visualization
                   ═══════════════════════════════════════════════════════════ */}
                {charts && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Trend Line Chart */}
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm mb-6">
                                <div className="p-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl ring-1 ring-primary-500/20">
                                    <TrendingUp size={16} />
                                </div>
                                معدل الدخول (آخر 7 أيام)
                            </div>
                            <div className="h-64 w-full" dir="ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={charts.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                        />
                                        <Line type="monotone" dataKey="count" name="المستخدمين" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Roles Donut Chart */}
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm mb-6">
                                <div className="p-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl ring-1 ring-primary-500/20">
                                    <PieChartIcon size={16} />
                                </div>
                                توزيع الحسابات حسب الدور
                            </div>
                            <div className="h-64 w-full" dir="ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={charts.roles}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {charts.roles.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    ADVANCED FILTER BAR
                   ═══════════════════════════════════════════════════════════ */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-sm">
                        <Filter size={18} />
                        فلاتر متقدمة
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-48">
                            <Shield className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                value={selectedRole}
                                onChange={(e) => {
                                    setSelectedRole(e.target.value);
                                    handleAdvancedFilter(e.target.value, dateRange);
                                }}
                                className="block w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-slate-700 dark:text-slate-300"
                            >
                                <option value="">جميع الأدوار</option>
                                {availableRoles?.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative w-full md:w-64 z-40">
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Flatpickr
                                options={{ mode: 'range', dateFormat: 'Y-m-d' }}
                                value={dateRange}
                                onChange={(dates) => {
                                    setDateRange(dates);
                                    if (dates.length === 2) {
                                        handleAdvancedFilter(selectedRole, dates);
                                    }
                                }}
                                placeholder="حدد النطاق الزمني..."
                                className="block w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-slate-700 dark:text-slate-300"
                            />
                            {dateRange[0] && (
                                <button 
                                    onClick={() => {
                                        setDateRange([null, null]);
                                        handleAdvancedFilter(selectedRole, []);
                                    }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600"
                                >
                                    <UserX size={14} />
                                </button>
                            )}
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
                                    <th className="py-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1.5">
                                            المستخدم
                                            {filters.sort === 'name' ? (
                                                filters.direction === 'asc' ? <ArrowUp size={14} className="text-primary-500" /> : <ArrowDown size={14} className="text-primary-500" />
                                            ) : <ArrowDown size={14} className="text-slate-300 dark:text-slate-600" />}
                                        </div>
                                    </th>
                                    <th className="py-4 px-6">الدور</th>
                                    <th className="py-4 px-6 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('today_logins')}>
                                        <div className="flex items-center justify-center gap-1.5">
                                            مرات الدخول (اليوم)
                                            {filters.sort === 'today_logins' ? (
                                                filters.direction === 'asc' ? <ArrowUp size={14} className="text-primary-500" /> : <ArrowDown size={14} className="text-primary-500" />
                                            ) : <ArrowDown size={14} className="text-slate-300 dark:text-slate-600" />}
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('total_logins')}>
                                        <div className="flex items-center justify-center gap-1.5">
                                            إجمالي الدخول
                                            {filters.sort === 'total_logins' ? (
                                                filters.direction === 'asc' ? <ArrowUp size={14} className="text-primary-500" /> : <ArrowDown size={14} className="text-primary-500" />
                                            ) : <ArrowDown size={14} className="text-slate-300 dark:text-slate-600" />}
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-center">الحالة</th>
                                    <th className="py-4 px-6 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('last_login_at')}>
                                        <div className="flex items-center justify-end gap-1.5">
                                            آخر ظهور
                                            {filters.sort === 'last_login_at' ? (
                                                filters.direction === 'asc' ? <ArrowUp size={14} className="text-primary-500" /> : <ArrowDown size={14} className="text-primary-500" />
                                            ) : <ArrowDown size={14} className="text-slate-300 dark:text-slate-600" />}
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {users.data.map((user) => {
                                    // Determine engagement level
                                    const isGhost = !user.last_login_at;
                                    const isActiveToday = user.today_logins > 0;
                                    const isPowerUser = user.total_logins > 50;

                                    return (
                                        <tr 
                                            key={user.id} 
                                            onClick={() => handleRowClick(user)}
                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                        >
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
                                            <td className="py-4 px-6 text-center">
                                                {isGhost && (
                                                    <button 
                                                        onClick={() => handleNudge(user)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-50 hover:bg-accent-100 dark:bg-accent-500/10 dark:hover:bg-accent-500/20 text-accent-600 dark:text-accent-400 text-[11px] font-bold rounded-xl transition-colors ring-1 ring-accent-500/20 shadow-sm"
                                                        title="إرسال تنبيه شديد لتسجيل الدخول"
                                                    >
                                                        <Send size={14} />
                                                        تنبيه
                                                    </button>
                                                )}
                                                {!isGhost && user.today_logins === 0 && (
                                                    <button 
                                                        onClick={() => handleNudge(user)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-bold rounded-xl transition-colors ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm"
                                                        title="إرسال تذكير لتسجيل الدخول"
                                                    >
                                                        <Bell size={14} />
                                                        تذكير
                                                    </button>
                                                )}
                                                {isActiveToday && (
                                                    <span className="text-[11px] text-slate-400 font-bold">—</span>
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

            {/* ═══════════════════════════════════════════════════════════
                MODAL — Deep Dive Analytics
               ═══════════════════════════════════════════════════════════ */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    
                    {/* Modal */}
                    <div 
                        className="relative w-full max-w-2xl bg-white dark:bg-[#151d27] rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300"
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
                                <Activity size={20} className="text-primary-500" />
                                السجل التفصيلي للمستخدم
                            </h3>
                            <button 
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {drawerLoading ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-3">
                                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm font-bold text-slate-500">جاري تحميل السجل...</p>
                                </div>
                            ) : selectedUserDetails && (
                                <>
                                    {/* User Info Header - Premium Design */}
                                    <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800/80 dark:to-slate-900 shadow-sm group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 text-white bg-gradient-to-br from-primary-500 to-indigo-600 shadow-lg shadow-primary-500/30 ring-2 ring-white dark:ring-slate-800 transform group-hover:scale-105 transition-transform duration-300">
                                                {selectedUserDetails.name ? selectedUserDetails.name.charAt(0) : ''}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{selectedUserDetails.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1.5">
                                                    {selectedUserDetails.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Stats Grid - Premium Look */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden group hover:border-primary-500/30 transition-colors">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/5 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none"></div>
                                            <div className="flex items-center gap-2 text-primary-500 mb-2">
                                                <div className="p-1.5 bg-primary-50 dark:bg-primary-500/10 rounded-lg">
                                                    <Clock size={14} className="text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">متوسط مدة الجلسة</span>
                                            </div>
                                            <div className="text-3xl font-black text-slate-800 dark:text-white flex items-baseline gap-1.5">
                                                {selectedUserDetails.avg_session_minutes} 
                                                <span className="text-xs text-slate-400 font-bold">دقيقة</span>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                                            <div className="absolute top-0 left-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl -ml-8 -mt-8 pointer-events-none"></div>
                                            <div className="flex items-center gap-2 text-indigo-500 mb-2">
                                                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                                                    <LayoutList size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">نشاطات اليوم</span>
                                            </div>
                                            <div className="text-3xl font-black text-slate-800 dark:text-white flex items-baseline gap-1.5">
                                                {selectedUserDetails.activities?.length || 0}
                                                <span className="text-xs text-slate-400 font-bold">إجراء</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Devices / Browser */}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                            <Monitor size={16} className="text-slate-500" />
                                            أجهزة الدخول الحديثة
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedUserDetails.devices?.length > 0 ? (
                                                selectedUserDetails.devices.map((device, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500">
                                                                {device.device_type === 'mobile' ? <Smartphone size={16} /> : <Monitor size={16} />}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                    {device.os_name || 'نظام غير معروف'} - {device.device_type === 'mobile' ? 'هاتف' : 'حاسوب'}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{device.ip_address}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-medium bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                                                            {device.created_at_human}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-slate-500 text-center py-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed">
                                                    لا توجد سجلات دخول مسجلة
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Activity Feed (Timeline) */}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <History size={16} className="text-slate-500" />
                                            سجل النشاطات (آخر 10 إجراءات)
                                        </h4>
                                        
                                        {selectedUserDetails.activities?.length > 0 ? (
                                            <div className="relative border-r-2 border-slate-200 dark:border-slate-700/80 pr-5 space-y-5 ml-2 rtl:border-r-2 rtl:border-l-0 rtl:pr-5 rtl:ml-0 rtl:mr-2">
                                                {selectedUserDetails.activities.map((activity, i) => {
                                                    let actionColor = 'bg-slate-400';
                                                    let actionBg = 'bg-slate-50 dark:bg-slate-800/50';
                                                    if (activity.action === 'create') { actionColor = 'bg-emerald-500 shadow-emerald-500/40'; actionBg = 'bg-emerald-50/50 dark:bg-emerald-500/5'; }
                                                    if (activity.action === 'update') { actionColor = 'bg-blue-500 shadow-blue-500/40'; actionBg = 'bg-blue-50/50 dark:bg-blue-500/5'; }
                                                    if (activity.action === 'delete') { actionColor = 'bg-rose-500 shadow-rose-500/40'; actionBg = 'bg-rose-50/50 dark:bg-rose-500/5'; }
                                                    
                                                    return (
                                                        <div key={i} className="relative group">
                                                            {/* Timeline Dot */}
                                                            <div className={`absolute w-3.5 h-3.5 border-2 border-white dark:border-[#151d27] rounded-full -right-[27px] top-1.5 ${actionColor} shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition-transform group-hover:scale-125 duration-300`}></div>
                                                            
                                                            <div className={`border border-slate-200/60 dark:border-slate-700/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300 ${actionBg}`}>
                                                                <div className="flex justify-between items-start mb-1.5">
                                                                    <div className="font-bold text-[13px] text-slate-800 dark:text-white flex items-center gap-1.5">
                                                                        {activity.action === 'create' ? 'إضافة سجل جديد' : 
                                                                         activity.action === 'update' ? 'تحديث بيانات' : 
                                                                         activity.action === 'delete' ? 'حذف سجل' : activity.action}
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap bg-white/50 dark:bg-slate-800 px-2 py-0.5 rounded-full">{activity.created_at_human}</span>
                                                                </div>
                                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                                    جدول: <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm text-slate-600 dark:text-slate-300">{activity.table_name}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-500 text-center py-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed flex flex-col items-center gap-2">
                                                <History size={24} className="text-slate-300 dark:text-slate-600" />
                                                لم يتم تسجيل أي نشاط حديث للمستخدم
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
