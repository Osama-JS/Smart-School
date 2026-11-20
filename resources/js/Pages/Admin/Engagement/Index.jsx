import React, { useMemo, useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import {
    Users, UserX, Activity, Search, Shield, Clock, TrendingUp, Eye,
    CheckCircle2, AlertCircle, BarChart3, ArrowLeft, ArrowUpRight, ArrowDownRight,
    PieChart as PieChartIcon, Calendar, Filter, ArrowUp, ArrowDown, Bell,
    FileSpreadsheet, Printer, Send, Monitor, Smartphone, LayoutList, History,
    X, MessageCircle, Flame, UserCheck, Phone, Sparkles, Check
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import Swal from 'sweetalert2';
import axios from 'axios';
import { exportEngagementExcel } from '@/Utils/engagementExcel';

const CHART_COLORS = ['#4d7c0f', '#84b819', '#dc2626', '#6366f1', '#f59e0b', '#0ea5e9'];

const formatWhatsAppPhone = (rawPhone) => {
    const digits = String(rawPhone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('00')) return digits.slice(2);
    if (digits.startsWith('0')) return `967${digits.slice(1)}`;
    return digits;
};

export default function UserEngagementIndex({ users, filters, stats, charts, availableRoles }) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [dateRange, setDateRange] = useState([
        filters.date_start ? new Date(filters.date_start) : null,
        filters.date_end ? new Date(filters.date_end) : null,
    ]);

    // Selection state (current page)
    const [selectedIds, setSelectedIds] = useState([]);

    // Bulk Nudge Modal
    const [isBulkNudgeOpen, setIsBulkNudgeOpen] = useState(false);
    const [bulkNudgeTitle, setBulkNudgeTitle] = useState('تذكير بتسجيل الدخول للنظام');
    const [bulkNudgeMessage, setBulkNudgeMessage] = useState('مرحباً {name}، نرجو منك تسجيل الدخول إلى منصة المدرسة الذكية لمتابعة آخر التحديثات والمهام الخاصة بك.');
    const [bulkNudgeLoading, setBulkNudgeLoading] = useState(false);

    // Bulk WhatsApp Modal
    const [isBulkWaOpen, setIsBulkWaOpen] = useState(false);
    const [waMessage, setWaMessage] = useState('مرحباً {name}، نرجو منك تسجيل الدخول إلى منصة المدرسة الذكية لمتابعة آخر التحديثات.');
    const [waSentIds, setWaSentIds] = useState([]);

    // Detail Modal / Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedUserDetails, setSelectedUserDetails] = useState(null);
    const [drawerLoading, setDrawerLoading] = useState(false);

    const pageUsers = users?.data || [];

    const selectedUsers = useMemo(
        () => pageUsers.filter((u) => selectedIds.includes(u.id)),
        [pageUsers, selectedIds]
    );

    const allPageSelected = pageUsers.length > 0 && pageUsers.every((u) => selectedIds.includes(u.id));

    const toggleSelectAllPage = () => {
        if (allPageSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pageUsers.map((u) => u.id));
        }
    };

    const toggleSelectRow = (id, e) => {
        if (e) e.stopPropagation();
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const applyQuery = (overrides = {}) => {
        setSelectedIds([]);
        router.get(
            route('admin.engagement.index'),
            { ...filters, ...overrides, page: overrides.page ?? 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleAdvancedFilter = (role, dRange) => {
        let dateStart = '';
        let dateEnd = '';
        if (dRange && dRange.length === 2 && dRange[0] && dRange[1]) {
            const tzoffset = new Date().getTimezoneOffset() * 60000;
            dateStart = new Date(dRange[0] - tzoffset).toISOString().split('T')[0];
            dateEnd = new Date(dRange[1] - tzoffset).toISOString().split('T')[0];
        }
        applyQuery({ role, date_start: dateStart, date_end: dateEnd });
    };

    const applyQuickRange = (daysBack) => {
        const end = new Date();
        const start = new Date();
        if (daysBack > 0) {
            start.setDate(end.getDate() - daysBack);
        }
        const range = [start, end];
        setDateRange(range);
        handleAdvancedFilter(selectedRole, range);
    };

    const handleSort = (field) => {
        let direction = 'desc';
        if (filters.sort === field && filters.direction === 'desc') {
            direction = 'asc';
        }
        applyQuery({ sort: field, direction, page: filters.page || 1 });
    };

    const handleFilterChange = (newFilter) => {
        applyQuery({ filter: newFilter, page: 1 });
    };

    const submitSearch = (val = searchValue) => {
        applyQuery({ search: val, page: 1 });
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            submitSearch(e.target.value);
        }
    };

    const handlePagination = (url) => {
        if (url) {
            setSelectedIds([]);
            router.get(url, filters, { preserveState: true, preserveScroll: true });
        }
    };

    const [exportingExcel, setExportingExcel] = useState(false);

    const handleExport = async (onlySelected = false) => {
        if (exportingExcel) return;
        setExportingExcel(true);
        try {
            const params = { ...filters, format: 'json' };
            if (onlySelected && selectedIds.length > 0) {
                params.ids = selectedIds.join(',');
            }
            const response = await axios.get(route('admin.engagement.export'), { params });
            await exportEngagementExcel({
                rows: response.data.rows || [],
                meta: response.data.meta || {},
                stats,
                charts,
            });
        } catch (error) {
            console.error('Excel export failed:', error);
            Swal.fire('خطأ', 'تعذر تصدير ملف الإكسل، يرجى المحاولة مرة أخرى.', 'error');
        } finally {
            setExportingExcel(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleNudge = (user, e) => {
        if (e) e.stopPropagation();
        Swal.fire({
            title: 'تنبيه المستخدم',
            text: `هل أنت متأكد من إرسال إشعار وتنبيه للمستخدم ${user.name} لتذكيره بتسجيل الدخول؟`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4d7c0f',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، أرسل التنبيه',
            cancelButtonText: 'إلغاء',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route('admin.engagement.nudge', user.id),
                    {},
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            Swal.fire('تم الإرسال!', 'تم إرسال التنبيه للمستخدم بنجاح.', 'success');
                        },
                    }
                );
            }
        });
    };

    const handleBulkNudgeSubmit = (e) => {
        e.preventDefault();
        if (selectedIds.length === 0) return;
        setBulkNudgeLoading(true);
        router.post(
            route('admin.engagement.bulk-nudge'),
            {
                user_ids: selectedIds,
                title: bulkNudgeTitle,
                message: bulkNudgeMessage,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsBulkNudgeOpen(false);
                    setSelectedIds([]);
                    Swal.fire('تم الإرسال!', `تم إرسال التنبيه الجماعي إلى ${selectedIds.length} مستخدم بنجاح.`, 'success');
                },
                onFinish: () => setBulkNudgeLoading(false),
            }
        );
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
                avg_session_minutes: response.data.avg_session_minutes,
            });
        } catch (error) {
            console.error('Error fetching user details:', error);
            Swal.fire('خطأ', 'حدث خطأ أثناء جلب تفاصيل المستخدم.', 'error');
        } finally {
            setDrawerLoading(false);
        }
    };

    const engagementRate = stats.total_users > 0 ? Math.round((stats.active_today / stats.total_users) * 100) : 0;

    const tabs = [
        { id: 'all', label: 'الكل', count: stats.total_users, icon: Users },
        { id: 'active_today', label: 'نشطون اليوم', count: stats.active_today, icon: UserCheck },
        { id: 'inactive_7d', label: 'خاملون +7 أيام', count: stats.inactive_7d ?? 0, icon: Clock },
        { id: 'ghosts', label: 'الأشباح (لم يدخلوا)', count: stats.ghosts, icon: UserX },
        { id: 'power_users', label: 'الأكثر تفاعلاً', count: stats.power_users ?? 0, icon: Flame },
    ];

    const waTargetsWithPhone = selectedUsers.filter((u) => Boolean(formatWhatsAppPhone(u.phone)));
    const waTargetsNoPhone = selectedUsers.filter((u) => !formatWhatsAppPhone(u.phone));

    return (
        <AdminLayout activeMenu="سجل التفاعل والنشاط">
            <Head title="سجل التفاعل والنشاط" />

            <div className="max-w-[100rem] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-20 animate-fade-in">
                {/* Executive Hero Header (Logo-Harmonized) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#f7fbe9] via-white to-red-50/35 dark:from-slate-900 dark:via-[#121820] dark:to-lime-950/25 border border-lime-200/70 dark:border-slate-800 rounded-3xl p-5 sm:p-7 md:p-8 shadow-sm">
                    <div
                        className="absolute top-0 right-0 left-0 h-1.5"
                        style={{ background: 'linear-gradient(to left, #18181b 0%, #18181b 20%, #dc2626 20%, #dc2626 42%, #84b819 42%, #4d7c0f 100%)' }}
                    />
                    <div className="absolute -left-16 -top-16 w-56 h-56 rounded-full bg-[#84b819]/15 blur-3xl pointer-events-none" />
                    <div className="absolute -right-12 -bottom-20 w-56 h-56 rounded-full bg-[#dc2626]/10 blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="w-15 h-15 rounded-2xl bg-gradient-to-br from-[#4d7c0f] to-[#84b819] text-white flex items-center justify-center shrink-0 shadow-lg shadow-lime-700/25 ring-4 ring-lime-500/15">
                                <Activity size={28} strokeWidth={2.4} />
                            </div>
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-[#f7fbe9] text-[#4d7c0f] border border-[#84b819]/40 dark:bg-lime-500/15 dark:text-lime-300 dark:border-lime-500/30">
                                    <Sparkles size={12} className="text-[#dc2626] dark:text-red-400" />
                                    مراقبة النظام • تحليل التفاعل والنشاط
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                                    سجل التفاعل والنشاط
                                </h1>
                                <p className="text-zinc-500 dark:text-slate-400 text-sm font-medium">
                                    متابعة الدخول اليومي، اكتشاف الحسابات الخاملة، وإرسال التنبيهات الفردية والجماعية.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {/* Search Input */}
                            <div className="relative w-full sm:w-80 group">
                                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl bg-lime-50 dark:bg-lime-500/15 text-[#4d7c0f] dark:text-lime-400 flex items-center justify-center transition-colors group-focus-within:bg-[#4d7c0f] group-focus-within:text-white">
                                    <Search size={14} />
                                </div>
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="ابحث بالاسم، اسم المستخدم، الجوال..."
                                    className="w-full py-2.5 pr-12 pl-16 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-[#84b819] focus:ring-4 focus:ring-lime-500/10 transition-all"
                                />
                                {searchValue && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchValue('');
                                            submitSearch('');
                                        }}
                                        title="مسح البحث"
                                        className="absolute left-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => submitSearch()}
                                    title="تنفيذ البحث"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-[#4d7c0f] text-white text-[10px] font-black hover:bg-[#3f6212]"
                                >
                                    بحث
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 print:hidden">
                                <button
                                    type="button"
                                    onClick={() => handleExport(false)}
                                    disabled={exportingExcel}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#4d7c0f] hover:bg-[#3f6212] disabled:opacity-60 text-white text-xs font-black rounded-2xl transition-all shadow-sm"
                                >
                                    <FileSpreadsheet size={15} />
                                    {exportingExcel ? 'جاري التصدير...' : 'تصدير Excel'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrint}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-black rounded-2xl transition-all shadow-xs"
                                >
                                    <Printer size={15} />
                                    طباعة
                                </button>
                                <Link
                                    href={route('admin.traffic.index')}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-black rounded-2xl transition-all shadow-xs"
                                >
                                    <ArrowLeft size={15} />
                                    المرور
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        type="button"
                        onClick={() => handleFilterChange('active_today')}
                        className={`bg-white dark:bg-slate-900/80 border rounded-3xl p-5 shadow-xs transition-all text-right relative overflow-hidden ${
                            filters.filter === 'active_today'
                                ? 'border-[#4d7c0f] ring-2 ring-lime-500/20'
                                : 'border-slate-200/80 dark:border-slate-800 hover:border-[#84b819]/60'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center gap-2 text-[#4d7c0f] dark:text-lime-400 font-black text-xs">
                                <span className="p-2 bg-[#f7fbe9] dark:bg-lime-500/15 rounded-xl">
                                    <Activity size={16} />
                                </span>
                                نشطون اليوم
                            </span>
                            {filters.filter === 'active_today' && <CheckCircle2 size={18} className="text-[#4d7c0f]" />}
                        </div>
                        <div className="flex items-end gap-3">
                            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.active_today}</div>
                            {stats.growth !== undefined && (
                                <span className={`inline-flex items-center text-xs font-black ${stats.growth >= 0 ? 'text-[#4d7c0f]' : 'text-[#dc2626]'}`}>
                                    {stats.growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {Math.abs(stats.growth)}%
                                </span>
                            )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1.5 font-semibold">سجلوا دخولهم خلال الـ 24 ساعة الماضية</div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleFilterChange('ghosts')}
                        className={`bg-white dark:bg-slate-900/80 border rounded-3xl p-5 shadow-xs transition-all text-right relative overflow-hidden ${
                            filters.filter === 'ghosts'
                                ? 'border-[#dc2626] ring-2 ring-red-500/20'
                                : 'border-slate-200/80 dark:border-slate-800 hover:border-red-300'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center gap-2 text-[#dc2626] dark:text-red-400 font-black text-xs">
                                <span className="p-2 bg-red-50 dark:bg-red-500/15 rounded-xl">
                                    <UserX size={16} />
                                </span>
                                الأشباح (لم يدخلوا)
                            </span>
                            {filters.filter === 'ghosts' && <CheckCircle2 size={18} className="text-[#dc2626]" />}
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.ghosts}</div>
                        <div className="text-[11px] text-slate-500 mt-1.5 font-semibold">حسابات لم تسجل دخولاً أبداً</div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleFilterChange('inactive_7d')}
                        className={`bg-white dark:bg-slate-900/80 border rounded-3xl p-5 shadow-xs transition-all text-right relative overflow-hidden ${
                            filters.filter === 'inactive_7d'
                                ? 'border-amber-500 ring-2 ring-amber-500/20'
                                : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-xs">
                                <span className="p-2 bg-amber-50 dark:bg-amber-500/15 rounded-xl">
                                    <Clock size={16} />
                                </span>
                                خاملون منذ +7 أيام
                            </span>
                            {filters.filter === 'inactive_7d' && <CheckCircle2 size={18} className="text-amber-600" />}
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.inactive_7d ?? 0}</div>
                        <div className="text-[11px] text-slate-500 mt-1.5 font-semibold">انقطعوا عن الدخول منذ أسبوع فأكثر</div>
                    </button>

                    <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                        <div className="flex items-center gap-2 text-[#4d7c0f] dark:text-lime-400 font-black text-xs mb-3">
                            <span className="p-2 bg-[#f7fbe9] dark:bg-lime-500/15 rounded-xl">
                                <TrendingUp size={16} />
                            </span>
                            نسبة التفاعل اليوم
                        </div>
                        <div className="flex items-end gap-1.5">
                            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{engagementRate}</div>
                            <span className="text-base font-black text-[#4d7c0f] mb-1">%</span>
                        </div>
                        <div className="mt-2.5 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-l from-[#4d7c0f] to-[#84b819] transition-all duration-700"
                                style={{ width: `${Math.min(engagementRate, 100)}%` }}
                            />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1.5 font-semibold">
                            {stats.active_today} نشط من أصل {stats.total_users} حساب
                        </div>
                    </div>
                </div>

                {/* Charts */}
                {charts && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:hidden">
                        <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-white font-black text-sm mb-5">
                                <div className="p-2 bg-[#f7fbe9] dark:bg-lime-500/15 text-[#4d7c0f] dark:text-lime-400 rounded-xl">
                                    <TrendingUp size={16} />
                                </div>
                                معدل الدخول (آخر 7 أيام)
                            </div>
                            <div className="h-60 w-full" dir="ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={charts.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            name="المستخدمون"
                                            stroke="#4d7c0f"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#84b819', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6, fill: '#dc2626' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-white font-black text-sm mb-5">
                                <div className="p-2 bg-[#f7fbe9] dark:bg-lime-500/15 text-[#4d7c0f] dark:text-lime-400 rounded-xl">
                                    <PieChartIcon size={16} />
                                </div>
                                توزيع الحسابات حسب الدور
                            </div>
                            <div className="h-60 w-full" dir="ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={charts.roles}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={56}
                                            outerRadius={78}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {charts.roles.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Advanced Filter Bar */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between print:hidden">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 font-black text-xs ml-2">
                            <Filter size={16} className="text-[#4d7c0f]" />
                            تصفية متقدمة:
                        </div>
                        <button
                            type="button"
                            onClick={() => applyQuickRange(0)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-slate-100 hover:bg-[#f7fbe9] hover:text-[#4d7c0f] dark:bg-slate-800 dark:text-slate-300 transition-colors"
                        >
                            اليوم
                        </button>
                        <button
                            type="button"
                            onClick={() => applyQuickRange(7)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-slate-100 hover:bg-[#f7fbe9] hover:text-[#4d7c0f] dark:bg-slate-800 dark:text-slate-300 transition-colors"
                        >
                            آخر 7 أيام
                        </button>
                        <button
                            type="button"
                            onClick={() => applyQuickRange(30)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-slate-100 hover:bg-[#f7fbe9] hover:text-[#4d7c0f] dark:bg-slate-800 dark:text-slate-300 transition-colors"
                        >
                            آخر 30 يوماً
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                        <div className="w-full sm:w-64">
                            <SelectInput
                                value={selectedRole}
                                onChange={(val) => {
                                    const v = val || '';
                                    setSelectedRole(v);
                                    handleAdvancedFilter(v, dateRange);
                                }}
                                options={(availableRoles || []).map((r) => ({ value: r.id, label: r.name }))}
                                placeholder="جميع الأدوار الوظيفية..."
                                noOptionsMessage={() => 'لا توجد أدوار'}
                            />
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            <Flatpickr
                                options={{ mode: 'range', dateFormat: 'Y-m-d' }}
                                value={dateRange}
                                onChange={(dates) => {
                                    setDateRange(dates);
                                    if (dates.length === 2) {
                                        handleAdvancedFilter(selectedRole, dates);
                                    }
                                }}
                                placeholder="نطاق تاريخ مخصص..."
                                className="block w-full pl-9 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all font-bold text-slate-700 dark:text-slate-200 shadow-sm"
                            />
                            {dateRange[0] && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDateRange([null, null]);
                                        handleAdvancedFilter(selectedRole, []);
                                    }}
                                    title="مسح التاريخ"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-700"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabbed Users Table */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    {/* Tabs Header */}
                    <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-4 pt-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = (filters.filter || 'all') === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleFilterChange(tab.id)}
                                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-black whitespace-nowrap transition-all border-b-2 ${
                                            isActive
                                                ? 'bg-white dark:bg-slate-900 text-[#4d7c0f] dark:text-lime-400 border-[#4d7c0f] dark:border-lime-400 shadow-xs'
                                                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <Icon size={14} />
                                        <span>{tab.label}</span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                                                isActive
                                                    ? 'bg-[#f7fbe9] text-[#4d7c0f] dark:bg-lime-500/15 dark:text-lime-300'
                                                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2 pb-2 lg:pb-1 text-xs font-bold text-slate-500">
                            <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
                                النتائج: {users.total}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-right text-sm min-w-[960px]">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-black text-xs border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-4 w-10 text-center print:hidden">
                                        <input
                                            type="checkbox"
                                            checked={allPageSelected}
                                            onChange={toggleSelectAllPage}
                                            className="rounded border-slate-300 text-[#4d7c0f] focus:ring-lime-500 cursor-pointer"
                                            title="تحديد كل الصفحة"
                                        />
                                    </th>
                                    <th className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1.5">
                                            المستخدم
                                            {filters.sort === 'name' ? (
                                                filters.direction === 'asc' ? <ArrowUp size={14} className="text-[#4d7c0f]" /> : <ArrowDown size={14} className="text-[#4d7c0f]" />
                                            ) : <ArrowDown size={14} className="text-slate-300 dark:text-slate-600" />}
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-5">الدور</th>
                                    <th className="py-3.5 px-5 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('today_logins')}>
                                        <div className="flex items-center justify-center gap-1.5">
                                            دخول اليوم
                                            {filters.sort === 'today_logins' ? (
                                                filters.direction === 'asc' ? <ArrowUp size={14} className="text-[#4d7c0f]" /> : <ArrowDown size={14} className="text-[#4d7c0f]" />
                                            ) : <ArrowDown size={14} className="text-slate-300 dark:text-slate-600" />}
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-5 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('total_logins')}>
                                        <div className="flex items-center justify-center gap-1.5">
                                            إجمالي الدخول
                                            {filters.sort === 'total_logins' ? (
                                                filters.direction === 'asc' ? <ArrowUp size={14} className="text-[#4d7c0f]" /> : <ArrowDown size={14} className="text-[#4d7c0f]" />
                                            ) : <ArrowDown size={14} className="text-slate-300 dark:text-slate-600" />}
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-5 text-center">الحالة</th>
                                    <th className="py-3.5 px-5 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('last_login_at')}>
                                        <div className="flex items-center justify-end gap-1.5">
                                            آخر ظهور
                                            {filters.sort === 'last_login_at' ? (
                                                filters.direction === 'asc' ? <ArrowUp size={14} className="text-[#4d7c0f]" /> : <ArrowDown size={14} className="text-[#4d7c0f]" />
                                            ) : <ArrowDown size={14} className="text-slate-300 dark:text-slate-600" />}
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-5 text-center print:hidden">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {pageUsers.map((user) => {
                                    const isGhost = !user.last_login_at;
                                    const isActiveToday = user.today_logins > 0;
                                    const isPowerUser = user.total_logins >= 20;
                                    const isSelected = selectedIds.includes(user.id);
                                    const waPhone = formatWhatsAppPhone(user.phone);

                                    return (
                                        <tr
                                            key={user.id}
                                            onClick={() => handleRowClick(user)}
                                            className={`transition-colors group cursor-pointer ${
                                                isSelected
                                                    ? 'bg-[#f7fbe9]/70 dark:bg-lime-500/10'
                                                    : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                                            }`}
                                        >
                                            <td className="py-3.5 px-4 text-center print:hidden" onClick={(e) => toggleSelectRow(user.id, e)}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="rounded border-slate-300 text-[#4d7c0f] focus:ring-lime-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                                                            isGhost
                                                                ? 'bg-red-50 dark:bg-red-500/10 text-[#dc2626] border-red-200 dark:border-red-500/20'
                                                                : isActiveToday
                                                                    ? 'bg-[#f7fbe9] dark:bg-lime-500/15 text-[#4d7c0f] dark:text-lime-300 border-lime-300/60 dark:border-lime-500/30'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                                            <span>{user.name}</span>
                                                            {isActiveToday && (
                                                                <span className="flex h-2 w-2 relative">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84b819] opacity-75" />
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4d7c0f]" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono flex flex-wrap items-center gap-2">
                                                            {user.username && <span>@{user.username}</span>}
                                                            {user.email && <span>• {user.email}</span>}
                                                            {user.phone && <span>• {user.phone}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <Shield size={12} className="text-[#4d7c0f] dark:text-lime-400" />
                                                    {user.role ? user.role.name : 'غير محدد'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5 text-center">
                                                {user.today_logins > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-[#4d7c0f] dark:text-lime-300 bg-[#f7fbe9] dark:bg-lime-500/15 px-2.5 py-1 rounded-lg font-mono font-black text-xs border border-lime-300/60 dark:border-lime-500/25">
                                                        <Eye size={12} />
                                                        {user.today_logins}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-5 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-mono font-black text-slate-900 dark:text-white">{user.total_logins}</span>
                                                    {isPowerUser && (
                                                        <span className="text-[9px] font-black text-[#4d7c0f] bg-[#f7fbe9] dark:bg-lime-500/15 px-1.5 py-0.5 rounded">
                                                            الأكثر تفاعلاً
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5 text-center">
                                                {isGhost ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-[#dc2626] dark:text-red-400 text-[10px] font-black border border-red-200 dark:border-red-500/20">
                                                        <AlertCircle size={11} />
                                                        شبح
                                                    </span>
                                                ) : isActiveToday ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f7fbe9] dark:bg-lime-500/15 text-[#4d7c0f] dark:text-lime-300 text-[10px] font-black border border-lime-300/60 dark:border-lime-500/25">
                                                        <CheckCircle2 size={11} />
                                                        نشط
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black border border-slate-200 dark:border-slate-700">
                                                        <Clock size={11} />
                                                        غير نشط
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-5 text-left">
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
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-[#dc2626] dark:bg-red-500/10 dark:text-red-400 text-[10px] font-black border border-red-200 dark:border-red-500/20">
                                                        <UserX size={12} />
                                                        لم يدخل أبداً
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-5 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {!isActiveToday && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleNudge(user, e)}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-black rounded-xl transition-colors border ${
                                                                isGhost
                                                                    ? 'bg-red-50 hover:bg-red-100 text-[#dc2626] border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                                            }`}
                                                            title="إرسال تنبيه في النظام والتطبيق"
                                                        >
                                                            {isGhost ? <Send size={12} /> : <Bell size={12} />}
                                                            <span>{isGhost ? 'تنبيه' : 'تذكير'}</span>
                                                        </button>
                                                    )}
                                                    {waPhone && (
                                                        <a
                                                            href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً ${user.name}، نرجو منك تسجيل الدخول إلى منصة المدرسة الذكية لمتابعة آخر التحديثات.`)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="مراسلة عبر واتساب"
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25 transition-colors"
                                                        >
                                                            <MessageCircle size={14} />
                                                        </a>
                                                    )}
                                                    {isActiveToday && !waPhone && (
                                                        <span className="text-[11px] text-slate-400 font-bold">—</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {pageUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-14 w-14 rounded-2xl bg-[#f7fbe9] dark:bg-lime-500/10 flex items-center justify-center text-[#4d7c0f]">
                                                    <Users size={28} />
                                                </div>
                                                <p className="text-slate-500 font-bold text-sm">لا توجد بيانات مطابقة للتبويب أو البحث الحالي.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.links.length > 3 && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="text-xs text-slate-500 font-bold">
                                صفحة {users.current_page} من {users.last_page}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {users.links.map((link, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handlePagination(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-[#4d7c0f] text-white shadow-xs'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#f7fbe9] hover:text-[#4d7c0f] border border-slate-200 dark:border-slate-700'
                                        } ${!link.url && 'opacity-40 cursor-not-allowed'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-3xl bg-zinc-900 dark:bg-slate-800 text-white rounded-2xl px-4 py-3 shadow-2xl border border-zinc-700 flex flex-wrap items-center justify-between gap-3 print:hidden animate-slide-up">
                    <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-xl bg-[#84b819] text-zinc-950 font-mono font-black text-xs">
                            {selectedIds.length}
                        </span>
                        <span className="text-xs sm:text-sm font-black">مستخدم محدد</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsBulkNudgeOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-[#4d7c0f] hover:bg-[#65a30d] text-white transition-colors"
                        >
                            <Bell size={14} />
                            تنبيه جماعي (النظام والتطبيق)
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setWaSentIds([]);
                                setIsBulkWaOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                        >
                            <MessageCircle size={14} />
                            واتساب جماعي
                        </button>
                        <button
                            type="button"
                            onClick={() => handleExport(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-colors"
                        >
                            <FileSpreadsheet size={14} />
                            تصدير المحددين
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedIds([])}
                            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
                            title="إلغاء التحديد"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk System/App Nudge Modal */}
            {isBulkNudgeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white dark:bg-[#151d27] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-[#f7fbe9] dark:bg-slate-800/50">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-base">
                                <Bell size={18} className="text-[#4d7c0f]" />
                                إرسال تنبيه جماعي ({selectedIds.length} مستخدم)
                            </h3>
                            <button type="button" onClick={() => setIsBulkNudgeOpen(false)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleBulkNudgeSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5">عنوان الإشعار</label>
                                <input
                                    type="text"
                                    value={bulkNudgeTitle}
                                    onChange={(e) => setBulkNudgeTitle(e.target.value)}
                                    required
                                    className="w-full rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5">
                                    نص الرسالة <span className="text-[10px] text-slate-400">(يمكنك استخدام {'{name}'} لاسم المستخدم)</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={bulkNudgeMessage}
                                    onChange={(e) => setBulkNudgeMessage(e.target.value)}
                                    required
                                    className="w-full rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-semibold"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsBulkNudgeOpen(false)}
                                    className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkNudgeLoading}
                                    className="px-6 py-2.5 rounded-2xl text-xs font-black bg-[#4d7c0f] hover:bg-[#3f6212] text-white disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Send size={14} />
                                    {bulkNudgeLoading ? 'جاري الإرسال...' : 'إرسال التنبيه الآن'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk WhatsApp Queue Modal */}
            {isBulkWaOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white dark:bg-[#151d27] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/70 dark:bg-slate-800/50">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-base">
                                <MessageCircle size={18} className="text-emerald-600" />
                                تذكير جماعي عبر واتساب ({waTargetsWithPhone.length} متاح)
                            </h3>
                            <button type="button" onClick={() => setIsBulkWaOpen(false)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
                            <div>
                                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5">
                                    نص رسالة الواتساب <span className="text-[10px] text-slate-400">(استخدم {'{name}'} لإدراج اسم المستخدم)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={waMessage}
                                    onChange={(e) => setWaMessage(e.target.value)}
                                    className="w-full rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-semibold"
                                />
                            </div>

                            {waTargetsNoPhone.length > 0 && (
                                <div className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-2xl px-4 py-2.5">
                                    تنبيه: يوجد {waTargetsNoPhone.length} مستخدم بدون رقم جوال مسجل وتم استبعادهم من قائمة الإرسال.
                                </div>
                            )}

                            <div className="space-y-2">
                                {waTargetsWithPhone.map((u) => {
                                    const phone = formatWhatsAppPhone(u.phone);
                                    const msg = waMessage.replace(/\{name\}/g, u.name);
                                    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                                    const isSent = waSentIds.includes(u.id);
                                    return (
                                        <div key={u.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                                            <div>
                                                <div className="font-black text-xs text-slate-900 dark:text-white">{u.name}</div>
                                                <div className="text-[11px] font-mono text-slate-400">{u.phone}</div>
                                            </div>
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => setWaSentIds((prev) => (prev.includes(u.id) ? prev : [...prev, u.id]))}
                                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-colors ${
                                                    isSent
                                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                }`}
                                            >
                                                {isSent ? <Check size={13} /> : <MessageCircle size={13} />}
                                                <span>{isSent ? 'تم الفتح' : 'إرسال واتساب'}</span>
                                            </a>
                                        </div>
                                    );
                                })}
                                {waTargetsWithPhone.length === 0 && (
                                    <div className="py-8 text-center text-xs font-bold text-slate-400">
                                        لا يوجد مستخدمون محددون لديهم أرقام جوال صالحة.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
                    <div
                        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-[#151d27] rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] sm:max-h-[85vh] border border-slate-100 dark:border-slate-800">
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                            <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-base sm:text-lg">
                                <Activity size={20} className="text-[#4d7c0f]" />
                                السجل التفصيلي للمستخدم
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
                            {drawerLoading ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-3">
                                    <div className="w-8 h-8 border-4 border-[#4d7c0f] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-slate-500">جاري تحميل السجل...</p>
                                </div>
                            ) : selectedUserDetails && (
                                <>
                                    <div className="relative overflow-hidden p-5 rounded-2xl border border-lime-200/70 dark:border-slate-700/50 bg-gradient-to-br from-[#f7fbe9] to-white dark:from-slate-800/80 dark:to-slate-900 shadow-xs flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 text-white bg-gradient-to-br from-[#4d7c0f] to-[#84b819] shadow-md">
                                                {selectedUserDetails.name ? selectedUserDetails.name.charAt(0) : ''}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                                                    <span>{selectedUserDetails.name}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedUserDetails.is_active === false ? 'bg-red-100 text-red-700' : 'bg-lime-100 text-[#4d7c0f]'}`}>
                                                        {selectedUserDetails.is_active === false ? 'معطّل' : 'نشط'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 font-mono flex flex-wrap items-center gap-2">
                                                    {selectedUserDetails.username && <span>@{selectedUserDetails.username}</span>}
                                                    {selectedUserDetails.email && <span>• {selectedUserDetails.email}</span>}
                                                    {selectedUserDetails.phone && (
                                                        <span className="inline-flex items-center gap-1">
                                                            • <Phone size={11} /> {selectedUserDetails.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleNudge(selectedUserDetails)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-[#4d7c0f] hover:bg-[#3f6212] text-white"
                                            >
                                                <Bell size={13} /> تنبيه
                                            </button>
                                            {formatWhatsAppPhone(selectedUserDetails.phone) && (
                                                <a
                                                    href={`https://wa.me/${formatWhatsAppPhone(selectedUserDetails.phone)}?text=${encodeURIComponent(`مرحباً ${selectedUserDetails.name}، نرجو منك تسجيل الدخول إلى منصة المدرسة الذكية.`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white"
                                                >
                                                    <MessageCircle size={13} /> واتساب
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-white dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 text-[#4d7c0f] mb-1.5 text-xs font-bold">
                                                <Clock size={14} />
                                                متوسط مدة الجلسة
                                            </div>
                                            <div className="text-3xl font-black text-slate-800 dark:text-white font-mono">
                                                {selectedUserDetails.avg_session_minutes} <span className="text-xs text-slate-400 font-bold">دقيقة</span>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 text-indigo-600 mb-1.5 text-xs font-bold">
                                                <LayoutList size={14} />
                                                أحدث النشاطات المسجلة
                                            </div>
                                            <div className="text-3xl font-black text-slate-800 dark:text-white font-mono">
                                                {selectedUserDetails.activities?.length || 0} <span className="text-xs text-slate-400 font-bold">إجراء</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                            <Monitor size={16} className="text-slate-500" />
                                            أجهزة الدخول الحديثة
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedUserDetails.devices?.length > 0 ? (
                                                selectedUserDetails.devices.map((device, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
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
                                                <div className="text-xs text-slate-500 text-center py-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                                    لا توجد سجلات دخول مسجلة
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <History size={16} className="text-slate-500" />
                                            سجل النشاطات (آخر 10 إجراءات)
                                        </h4>
                                        {selectedUserDetails.activities?.length > 0 ? (
                                            <div className="relative border-r-2 border-slate-200 dark:border-slate-700/80 pr-5 space-y-4 mr-2">
                                                {selectedUserDetails.activities.map((activity, i) => {
                                                    let actionColor = 'bg-slate-400';
                                                    let actionBg = 'bg-slate-50 dark:bg-slate-800/50';
                                                    if (activity.action === 'create') { actionColor = 'bg-emerald-500'; actionBg = 'bg-emerald-50/50 dark:bg-emerald-500/5'; }
                                                    if (activity.action === 'update') { actionColor = 'bg-blue-500'; actionBg = 'bg-blue-50/50 dark:bg-blue-500/5'; }
                                                    if (activity.action === 'delete') { actionColor = 'bg-rose-500'; actionBg = 'bg-rose-50/50 dark:bg-rose-500/5'; }

                                                    return (
                                                        <div key={i} className="relative">
                                                            <div className={`absolute w-3.5 h-3.5 border-2 border-white dark:border-[#151d27] rounded-full -right-[27px] top-1.5 ${actionColor}`} />
                                                            <div className={`border border-slate-200/60 dark:border-slate-700/50 rounded-xl p-3 ${actionBg}`}>
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <div className="font-bold text-[13px] text-slate-800 dark:text-white">
                                                                        {activity.action === 'create' ? 'إضافة سجل جديد' :
                                                                         activity.action === 'update' ? 'تحديث بيانات' :
                                                                         activity.action === 'delete' ? 'حذف سجل' : activity.action}
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-400 font-bold bg-white/70 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                                        {activity.created_at_human}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                                    جدول: <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{activity.table_name}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-500 text-center py-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
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
