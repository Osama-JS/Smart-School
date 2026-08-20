import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Search, Filter, Bell, User, Clock, 
    Shield, CheckCircle, AlertTriangle, Info,
    Eye, ChevronLeft, ChevronRight, Activity, Users, Loader2, X, RefreshCw, Smartphone, Signal, Wifi, Battery, Lightbulb, Zap, SlidersHorizontal, Calendar, ChevronDown, LayoutGrid, List
} from 'lucide-react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';

export default function GlobalMonitor({ notifications, stats, filters, roles = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || 'all');
    const [source, setSource] = useState(filters.source || 'all');
    const [dateRange, setDateRange] = useState(filters.date_range || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [engagement, setEngagement] = useState(filters.engagement || 'all');
    const [senderRole, setSenderRole] = useState(filters.sender_role || 'all');
    const [receiverName, setReceiverName] = useState(filters.receiver_name || '');

    // حالات النافذة المنبثقة للـ Read Details
    const [showModal, setShowModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [readDetails, setReadDetails] = useState(null);
    const [activeTab, setActiveTab] = useState('read'); // read, unread
    const [modalSearch, setModalSearch] = useState('');

    // حالة نافذة الهاتف (Live Preview)
    const [previewNotification, setPreviewNotification] = useState(null);

    // حالة اللوحة الجانبية للفلاتر
    const [showFilters, setShowFilters] = useState(false);
    
    // حالة العرض (جدول أم بطاقات)
    const [viewMode, setViewMode] = useState('table');
    
    const activeFiltersCount = (type !== 'all' ? 1 : 0) + 
                               (source !== 'all' ? 1 : 0) + 
                               (dateRange !== 'all' ? 1 : 0) + 
                               (engagement !== 'all' ? 1 : 0) +
                               (senderRole !== 'all' ? 1 : 0) +
                               (receiverName !== '' ? 1 : 0);

    const handleFilter = (e) => {
        e?.preventDefault();
        router.get(route('admin.notifications.global-monitor'), {
            search,
            type,
            source,
            date_range: dateRange,
            date_from: dateFrom,
            date_to: dateTo,
            engagement,
            sender_role: senderRole,
            receiver_name: receiverName
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const applyQuickFilter = (overrides) => {
        if (overrides.dateRange !== undefined) setDateRange(overrides.dateRange);
        if (overrides.type !== undefined) setType(overrides.type);
        if (overrides.source !== undefined) setSource(overrides.source);
        if (overrides.engagement !== undefined) setEngagement(overrides.engagement);
        if (overrides.search !== undefined) setSearch(overrides.search);
        if (overrides.senderRole !== undefined) setSenderRole(overrides.senderRole);
        if (overrides.receiverName !== undefined) setReceiverName(overrides.receiverName);

        router.get(route('admin.notifications.global-monitor'), {
            search: overrides.search !== undefined ? overrides.search : search,
            type: overrides.type !== undefined ? overrides.type : type,
            source: overrides.source !== undefined ? overrides.source : source,
            date_range: overrides.dateRange !== undefined ? overrides.dateRange : dateRange,
            date_from: dateFrom,
            date_to: dateTo,
            engagement: overrides.engagement !== undefined ? overrides.engagement : engagement,
            sender_role: overrides.senderRole !== undefined ? overrides.senderRole : senderRole,
            receiver_name: overrides.receiverName !== undefined ? overrides.receiverName : receiverName
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };
    const loadUserOptions = async (inputValue) => {
        if (!inputValue || inputValue.length < 2) return [];
        try {
            const response = await axios.get(route('admin.notifications.search-users'), { params: { q: inputValue } });
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleFilter();
        }
    };

    const handleResend = (notificationId) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'سيتم إرسال الإشعار كـ [تذكير] فقط للمستخدمين الذين لم يقرؤوه بعد.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#6b9b37',
            cancelButtonColor: '#d1d5db',
            confirmButtonText: 'نعم، إرسال تذكير',
            cancelButtonText: 'إلغاء'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.post(route('admin.notifications.resend', notificationId));
                    if (res.data.success) {
                        toast.success(`تم إرسال التذكير لـ ${res.data.count} مستخدم/ين بنجاح.`);
                        router.reload({ only: ['notifications', 'stats'] });
                    } else {
                        toast.error(res.data.message || 'حدث خطأ.');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('فشل إرسال التذكير.');
                }
            }
        });
    };

    const fetchReadDetails = async (notificationId) => {
        setReadDetails(null);
        setModalSearch('');
        setActiveTab('read');
        setShowModal(true);
        setLoadingDetails(true);
        try {
            const res = await axios.get(route('admin.notifications.read-details', notificationId));
            setReadDetails(res.data);
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء جلب التفاصيل.');
            setShowModal(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const getTypeIcon = (typeName) => {
        switch (typeName) {
            case 'important': return <Shield className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            default: return <Info className="w-5 h-5 text-primary-500" />;
        }
    };

    const getTypeColor = (typeName) => {
        switch (typeName) {
            case 'important': return 'bg-red-50 text-red-700 border-red-200';
            case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-primary-50 text-primary-700 border-primary-200';
        }
    };

    const getTargetText = (log) => {
        if (log.target_type === 'all') return 'جميع المستخدمين';
        if (log.target_type === 'role') return `دور: ${log.target_role}`;
        if (log.target_type === 'users') {
            if (log.target_users_names && log.target_users_names.length > 0) {
                if (log.target_users_names.length === 1) return log.target_users_names[0];
                return `${log.target_users_names[0]} و ${log.target_users_names.length - 1} آخرين`;
            }
            return 'مستخدمين محددين';
        }
        return 'غير متأكد';
    };

    // --- Custom Select Styles for Premium Look ---
    const selectStyles = {
        control: (base, state) => ({
            ...base,
            borderColor: state.isFocused ? '#6b9b37' : '#e5e7eb',
            borderRadius: '0.75rem',
            minHeight: '44px',
            backgroundColor: state.isFocused ? '#fff' : 'rgba(249, 250, 251, 0.5)',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(107, 155, 55, 0.2)' : 'none',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: state.isFocused ? '#6b9b37' : '#d1d5db' }
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#f0f7eb' : state.isFocused ? '#f9fafb' : 'transparent',
            color: state.isSelected ? '#437020' : '#374151',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: state.isSelected ? '600' : '400',
            padding: '10px 12px',
            '&:active': { backgroundColor: '#dcefd1' }
        }),
        placeholder: (base) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
        singleValue: (base) => ({ ...base, color: '#111827', fontWeight: '500' }),
        menu: (base) => ({ 
            ...base, 
            borderRadius: '0.75rem', 
            overflow: 'hidden', 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', 
            border: '1px solid #f3f4f6', 
            zIndex: 50,
            padding: '4px'
        }),
        menuList: (base) => ({ ...base, padding: 0 }),
        dropdownIndicator: (base) => ({ ...base, color: '#9ca3af', '&:hover': { color: '#6b7280' } }),
        indicatorSeparator: () => ({ display: 'none' })
    };

    // --- Options Arrays ---
    const typeOptions = [
        { value: 'all', label: 'جميع الأنواع' },
        { value: 'general', label: 'عام (General)' },
        { value: 'important', label: 'هام (Important)' },
        { value: 'warning', label: 'تحذير (Warning)' }
    ];
    
    const sourceOptions = [
        { value: 'all', label: 'جميع المصادر' },
        { value: 'system', label: 'النظام (تلقائي)' },
        { value: 'user', label: 'إداري (يدوي)' }
    ];
    
    const engagementOptions = [
        { value: 'all', label: 'الكل' },
        { value: 'unread', label: 'لم يقرأها أحد (0%)' },
        { value: 'low', label: 'تفاعل ضعيف (أقل من 50%)' },
        { value: 'full', label: 'مقروءة بالكامل (100%)' }
    ];
    
    const dateOptions = [
        { value: 'all', label: 'جميع الأوقات' },
        { value: 'today', label: 'اليوم' },
        { value: 'this_week', label: 'هذا الأسبوع' },
        { value: 'this_month', label: 'هذا الشهر' },
        { value: 'custom', label: 'نطاق مخصص...' }
    ];
    
    const senderRoleOptions = [
        { value: 'all', label: 'الكل' },
        ...roles.map(role => ({ value: role.name, label: role.name }))
    ];

    return (
        <AdminLayout activeMenu="مراقبة الإشعارات">
            <Head title="مراقبة الإشعارات" />

            <div className="py-8 bg-gray-50/30 min-h-screen">
                <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
                    
                    {/* Header Section */}
                    <div className="relative overflow-hidden bg-white/60 dark:bg-[#121820]/60 backdrop-blur-3xl border border-white/40 dark:border-slate-800/60 rounded-[2.5rem] p-6 md:p-10 mb-8 shadow-sm">
                        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-indigo-500" />
                        
                        {/* Visual geometric lines */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                            <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary-500/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
                            <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <Activity size={36} className="text-primary-500" />
                                    مركز مراقبة الإشعارات
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm font-bold max-w-xl leading-relaxed">
                                    تابع حالة الإشعارات المرسلة، قراءات المستخدمين، وإحصائيات التفاعل في الوقت الفعلي بدقة متناهية.
                                </p>
                            </div>

                            <div className="flex gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl shrink-0">
                                <button className="flex items-center gap-2 px-8 py-3 rounded-xl font-black bg-white dark:bg-slate-800 text-primary-600 shadow-md scale-105 transition-all duration-300">
                                    <Activity size={18} /> نظرة عامة
                                </button>
                                <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-8 py-3 rounded-xl font-black text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-300">
                                    <RefreshCw size={18} /> تحديث
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Hyper-Modern Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* Stat 1: Total */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-600 rounded-2xl p-6 border border-primary-400 shadow-lg hover:shadow-xl transition-all duration-300 group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 blur-xl rounded-full -ml-8 -mb-8 pointer-events-none" />
                            
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-white/20 rounded-xl group-hover:scale-110 transition-all duration-300 backdrop-blur-sm border border-white/20">
                                    <Activity className="w-5 h-5 text-white" />
                                </div>
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-400/90 px-2 py-1 rounded-lg backdrop-blur-sm">
                                    +12% <Activity className="w-3 h-3" />
                                </span>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-primary-100 text-sm font-medium mb-1">إجمالي الإشعارات</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white tracking-tight">{stats.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stat 2: Automated */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 rounded-2xl p-6 border border-indigo-400 shadow-lg hover:shadow-xl transition-all duration-300 group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-400/20 blur-xl rounded-full -ml-8 -mb-8 pointer-events-none" />
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-white/20 rounded-xl group-hover:scale-110 transition-all duration-300 backdrop-blur-sm border border-white/20">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">النظام الآلي</span>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-indigo-100 text-sm font-medium mb-1">إشعارات تلقائية</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white tracking-tight">{stats.automated}</span>
                                    {stats.total > 0 && <span className="text-sm font-bold text-indigo-200">({Math.round((stats.automated / stats.total) * 100)}%)</span>}
                                </div>
                            </div>
                        </div>

                        {/* Stat 3: Manual */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 border border-emerald-400 shadow-lg hover:shadow-xl transition-all duration-300 group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/20 blur-xl rounded-full -ml-8 -mb-8 pointer-events-none" />
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-white/20 rounded-xl group-hover:scale-110 transition-all duration-300 backdrop-blur-sm border border-white/20">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">فريق الإدارة</span>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-emerald-100 text-sm font-medium mb-1">إشعارات يدوية</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white tracking-tight">{stats.manual}</span>
                                    {stats.total > 0 && <span className="text-sm font-bold text-emerald-200">({Math.round((stats.manual / stats.total) * 100)}%)</span>}
                                </div>
                            </div>
                        </div>

                        {/* Stat 4: Important/Warning */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 rounded-2xl p-6 border border-rose-400 shadow-lg hover:shadow-xl transition-all duration-300 group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-400/20 blur-xl rounded-full -ml-8 -mb-8 pointer-events-none" />
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-white/20 rounded-xl group-hover:scale-110 transition-all duration-300 backdrop-blur-sm border border-white/20">
                                    <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">انتباه فوري</span>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-rose-100 text-sm font-medium mb-1">هامة وتحذيرية</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white tracking-tight">{stats.important_or_warning}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
                        {/* Analytics Chart */}
                        {stats.chart_data && stats.chart_data.length > 0 && (
                            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-extrabold text-gray-900 tracking-tight">نشاط الإشعارات</h3>
                                        <p className="text-sm text-gray-500 mt-1">حجم الإرسال خلال آخر 30 يوماً</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50"></div>
                                            <span className="text-gray-600">تلقائية</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-primary-500 ring-4 ring-primary-50"></div>
                                            <span className="text-gray-600">يدوية</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-72 w-full" dir="ltr">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.chart_data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6b9b37" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#6b9b37" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 500 }} dy={10} minTickGap={20} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 500 }} dx="-10" />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}
                                                labelStyle={{ color: '#111827', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}
                                                itemStyle={{ fontSize: '13px', fontWeight: 600, padding: '2px 0' }}
                                            />
                                            <Area type="monotone" dataKey="آلية" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAuto)" activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
                                            <Area type="monotone" dataKey="يدوية" stroke="#6b9b37" strokeWidth={3} fillOpacity={1} fill="url(#colorManual)" activeDot={{ r: 6, strokeWidth: 0, fill: '#6b9b37' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Engagement Heatmap */}
                        {stats.heatmap_data && stats.heatmap_data.length > 0 && (
                            <div className="xl:col-span-1 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-br-full -z-10"></div>
                                <div className="mb-6">
                                    <h3 className="text-base font-extrabold text-gray-900 tracking-tight">أوقات الذروة للتفاعل</h3>
                                    <p className="text-sm text-gray-500 mt-1">متى يقرأ المستخدمون الإشعارات؟</p>
                                </div>
                                
                                <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/50 rounded-xl p-4 mb-6 border border-amber-100/50 flex items-start gap-3 relative overflow-hidden">
                                    <div className="absolute -right-2 -bottom-2 opacity-10">
                                        <Lightbulb className="w-16 h-16 text-amber-600" />
                                    </div>
                                    <div className="p-2 bg-white rounded-lg shrink-0 mt-0.5 shadow-sm border border-amber-100">
                                        <Zap className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-bold text-amber-900 tracking-wide">توصية ذكية</p>
                                        <p className="text-sm text-amber-800 mt-1 leading-relaxed font-medium">
                                            أفضل وقت لإرسال التعميمات هو <strong className="text-amber-900 bg-amber-200/50 px-1.5 py-0.5 rounded-md mx-0.5">{stats.best_hour}:00</strong>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 min-h-[200px]" dir="ltr">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.heatmap_data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} interval={3} />
                                            <YAxis axisLine={false} tickLine={false} tick={false} />
                                            <Tooltip 
                                                cursor={{fill: 'rgba(245, 158, 11, 0.05)'}}
                                                contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '10px 14px' }}
                                                formatter={(value) => [<span className="font-bold">{value}</span>, <span className="text-gray-500 font-normal">قراءة</span>]}
                                                labelFormatter={(label) => `الساعة ${label}`}
                                                labelStyle={{ color: '#111827', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}
                                            />
                                            <Bar dataKey="reads" radius={[4, 4, 0, 0]}>
                                                {stats.heatmap_data.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={entry.hour === stats.best_hour ? '#f59e0b' : '#f3f4f6'} 
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Toolbar */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                            <div className="relative w-full md:w-[450px]">
                                <input
                                    type="text"
                                    placeholder="البحث في الإشعارات..."
                                    className="w-full border-0 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 rounded-xl pl-11 pr-4 py-3 text-sm transition-all placeholder:text-gray-400"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                        showFilters 
                                            ? 'bg-gradient-to-r from-primary-500 to-indigo-500 text-white shadow-md' 
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    تصفية متقدمة
                                    {activeFiltersCount > 0 && (
                                        <span className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full ${
                                            showFilters ? 'bg-white text-primary-600' : 'bg-primary-100 text-primary-700'
                                        }`}>
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={handleFilter}
                                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
                                >
                                    <Search className="w-4 h-4" />
                                    بحث
                                </button>
                            </div>
                        </div>

                        {/* Quick Action Pills */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100/60">
                            <span className="text-xs font-semibold text-gray-400 ml-1">تصفية سريعة:</span>
                            <button 
                                onClick={() => applyQuickFilter({ dateRange: 'today', type: 'all', source: 'all', engagement: 'all', search: '', senderRole: 'all', receiverName: '' })}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${dateRange === 'today' && type === 'all' && engagement === 'all' ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                إشعارات اليوم
                            </button>
                            <button 
                                onClick={() => applyQuickFilter({ type: 'warning', dateRange: 'all', source: 'all', engagement: 'all', search: '', senderRole: 'all', receiverName: '' })}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${type === 'warning' && dateRange === 'all' && engagement === 'all' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                تحذيرات عاجلة
                            </button>
                            <button 
                                onClick={() => applyQuickFilter({ engagement: 'unread', type: 'all', dateRange: 'all', source: 'all', search: '', senderRole: 'all', receiverName: '' })}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${engagement === 'unread' && type === 'all' && dateRange === 'all' ? 'bg-rose-100 text-rose-800 shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                لم يقرأها أحد
                            </button>
                            <button 
                                onClick={() => applyQuickFilter({ source: 'system', type: 'all', dateRange: 'all', engagement: 'all', search: '', senderRole: 'all', receiverName: '' })}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${source === 'system' && type === 'all' && engagement === 'all' && dateRange === 'all' ? 'bg-indigo-100 text-indigo-800 shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                إشعارات النظام
                            </button>
                            {activeFiltersCount > 0 && (
                                <button 
                                    onClick={() => applyQuickFilter({ search: '', type: 'all', source: 'all', dateRange: 'all', engagement: 'all', senderRole: 'all', receiverName: '' })}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors mr-auto flex items-center gap-1"
                                >
                                    <X className="w-3.5 h-3.5" /> مسح الكل
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Inline Advanced Filters */}
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? 'opacity-100 max-h-[1200px] mb-6' : 'opacity-0 max-h-0'}`}>
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-0 relative overflow-hidden">
                            {/* Header */}
                            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                                        <Filter className="w-4 h-4 text-gray-700" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900">خيارات التصفية المتقدمة</h3>
                                </div>
                                <button onClick={() => setShowFilters(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Filter Groups */}
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:divide-x-reverse lg:divide-x lg:divide-gray-100">
                                
                                {/* Group 1: Notification Details */}
                                <div className="space-y-5 lg:pl-8">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Bell className="w-3.5 h-3.5" />
                                        خصائص الإشعار
                                    </h4>
                                    
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">نوع الإشعار</label>
                                        <Select
                                            options={typeOptions}
                                            value={typeOptions.find(o => o.value === type)}
                                            onChange={(opt) => setType(opt.value)}
                                            styles={selectStyles}
                                            isSearchable={false}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">مصدر الإشعار</label>
                                        <Select
                                            options={sourceOptions}
                                            value={sourceOptions.find(o => o.value === source)}
                                            onChange={(opt) => setSource(opt.value)}
                                            styles={selectStyles}
                                            isSearchable={false}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">حالة التفاعل</label>
                                        <Select
                                            options={engagementOptions}
                                            value={engagementOptions.find(o => o.value === engagement)}
                                            onChange={(opt) => setEngagement(opt.value)}
                                            styles={selectStyles}
                                            isSearchable={false}
                                        />
                                    </div>
                                </div>

                                {/* Group 2: Targets */}
                                <div className="space-y-5 lg:pr-8 lg:pl-8">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5" />
                                        الأطراف المعنية
                                    </h4>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">نوع المرسل</label>
                                        <Select
                                            options={senderRoleOptions}
                                            value={senderRoleOptions.find(o => o.value === senderRole)}
                                            onChange={(opt) => setSenderRole(opt.value)}
                                            styles={selectStyles}
                                            isSearchable={false}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">البحث عن مستلم محدد</label>
                                        <AsyncSelect
                                            cacheOptions
                                            defaultOptions
                                            loadOptions={loadUserOptions}
                                            placeholder="اكتب اسم المستلم..."
                                            noOptionsMessage={() => "اكتب حرفين على الأقل..."}
                                            loadingMessage={() => "جاري البحث..."}
                                            onChange={(selectedOption) => setReceiverName(selectedOption ? selectedOption.value : '')}
                                            value={receiverName ? { value: receiverName, label: receiverName } : null}
                                            isClearable
                                            styles={selectStyles}
                                        />
                                    </div>
                                </div>

                                {/* Group 3: Date */}
                                <div className="space-y-5 lg:pr-8">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        الإطار الزمني
                                    </h4>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">تاريخ الإرسال</label>
                                        <Select
                                            options={dateOptions}
                                            value={dateOptions.find(o => o.value === dateRange)}
                                            onChange={(opt) => setDateRange(opt.value)}
                                            styles={selectStyles}
                                            isSearchable={false}
                                        />
                                    </div>

                                    {dateRange === 'custom' && (
                                        <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">من تاريخ</label>
                                                <input type="date" className="w-full border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500/20 py-2 px-3" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">إلى تاريخ</label>
                                                <input type="date" className="w-full border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500/20 py-2 px-3" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="bg-gray-50/30 px-6 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                                <div className="text-xs text-gray-400 font-medium">
                                    يتم تطبيق الفلاتر على أرشيف الإشعارات بالكامل
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => {
                                            setType('all'); setSource('all'); setDateRange('all'); setDateFrom(''); setDateTo(''); setEngagement('all'); setSenderRole('all'); setReceiverName('');
                                        }}
                                        className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                    >
                                        إعادة ضبط
                                    </button>
                                    <button
                                        onClick={(e) => handleFilter(e)}
                                        className="flex-1 sm:flex-none px-8 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-[0_2px_10px_-3px_rgba(0,0,0,0.2)]"
                                    >
                                        تطبيق
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Header for View Mode Toggle */}
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-lg font-black text-gray-900">أرشيف الإشعارات</h3>
                        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl shadow-sm border border-gray-200/50">
                            <button 
                                onClick={() => setViewMode('table')} 
                                className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'table' ? 'bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] text-primary-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                title="عرض كجدول"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('cards')} 
                                className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'cards' ? 'bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] text-primary-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                title="عرض كبطاقات"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Data Display */}
                    <div className="w-full">
                        {notifications.data.length > 0 ? (
                        viewMode === 'table' ? (
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
                                <div className="overflow-x-auto">
                                <table className="min-w-full text-right divide-y divide-gray-200">
                                    <thead className="bg-gray-50/80 backdrop-blur-sm">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">تفاصيل الإشعار</th>
                                            <th scope="col" className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">المرسل</th>
                                            <th scope="col" className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">المستهدفين</th>
                                            <th scope="col" className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">تاريخ الإرسال</th>
                                            <th scope="col" className="px-6 py-4 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {notifications.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-6 py-5 align-top w-2/5">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            {item.type === 'important' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider"><AlertTriangle className="w-3 h-3" /> هام جداً</span>}
                                                            {item.type === 'warning' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider"><Info className="w-3 h-3" /> تحذير</span>}
                                                            {(item.type === 'general' || !item.type) && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-700 uppercase tracking-wider"><Bell className="w-3 h-3" /> إشعار عام</span>}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-extrabold text-gray-900 mb-1 leading-tight">{item.title}</p>
                                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed" title={item.message}>
                                                                {item.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap align-top">
                                                    {item.sender_id ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-50 to-gray-200 border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                                                                {item.sender?.name?.substring(0, 2) || 'م'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-gray-900 font-bold">
                                                                    {item.sender?.name || 'مستخدم محذوف'}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 font-semibold">{item.sender?.role?.name || 'إداري'}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                                                                <Shield className="w-4 h-4 text-indigo-600" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-indigo-700 font-bold">النظام الآلي</span>
                                                                <span className="text-[10px] text-indigo-400 font-semibold">تلقائي</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 align-top">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 font-semibold shadow-sm">
                                                        <Users className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="truncate max-w-[150px]" title={getTargetText(item)}>
                                                            {getTargetText(item)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm text-gray-900 font-bold tracking-tight">
                                                            {new Date(item.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 font-medium dir-ltr text-left w-fit bg-gray-50 px-1.5 py-0.5 rounded">
                                                            {new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-center align-top">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setPreviewNotification(item)}
                                                            className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all shadow-sm hover:shadow focus:ring-2 focus:ring-primary-100"
                                                            title="معاينة الهاتف"
                                                        >
                                                            <Smartphone className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => fetchReadDetails(item.id)}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all shadow-sm hover:shadow focus:ring-2 focus:ring-emerald-100"
                                                            title="تقارير القراءة"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            <span>{item.reads_count}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleResend(item.id)}
                                                            className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm hover:shadow focus:ring-2 focus:ring-rose-100"
                                                            title="إعادة إرسال تذكير"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                {notifications.data.map((item) => (
                                    <div key={item.id} className="relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col h-full overflow-hidden group">
                                        <div className={`absolute top-0 right-0 w-1.5 h-full ${item.type === 'important' ? 'bg-rose-500' : item.type === 'warning' ? 'bg-amber-500' : 'bg-primary-500'}`} />
                                        
                                        <div className="flex justify-between items-start mb-5">
                                            <div className="flex items-center gap-2">
                                                {item.type === 'important' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wider"><AlertTriangle className="w-3.5 h-3.5" /> هام جداً</span>}
                                                {item.type === 'warning' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider"><Info className="w-3.5 h-3.5" /> تحذير</span>}
                                                {(item.type === 'general' || !item.type) && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-primary-50 text-primary-600 border border-primary-100 uppercase tracking-wider"><Bell className="w-3.5 h-3.5" /> إشعار عام</span>}
                                            </div>
                                            <div className="text-[11px] text-gray-500 font-medium text-left">
                                                {new Date(item.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                        
                                        <div className="mb-4 flex-1">
                                            <h4 className="text-base font-extrabold text-gray-900 mb-2 leading-tight">{item.title}</h4>
                                            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed" title={item.message}>{item.message}</p>
                                        </div>

                                        <hr className="border-gray-50 my-4" />

                                        <div className="flex justify-between items-center mb-4">
                                            {item.sender_id ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-50 to-gray-200 border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                                                        {item.sender?.name?.substring(0, 2) || 'م'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-gray-900 font-bold truncate max-w-[80px]">
                                                            {item.sender?.name || 'مستخدم محذوف'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-500 font-semibold">{item.sender?.role?.name || 'إداري'}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                                                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-indigo-700 font-bold truncate max-w-[80px]">النظام الآلي</span>
                                                        <span className="text-[9px] text-indigo-400 font-semibold">تلقائي</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 text-[11px] text-gray-600 font-semibold max-w-[100px]">
                                                <Users className="w-3 h-3 text-gray-400" />
                                                <span className="truncate" title={getTargetText(item)}>
                                                    {getTargetText(item)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 pt-2">
                                            <button
                                                onClick={() => setPreviewNotification(item)}
                                                className="flex-1 inline-flex items-center justify-center p-2 rounded-xl bg-gray-50 text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all font-semibold text-xs gap-1.5"
                                            >
                                                <Smartphone className="w-3.5 h-3.5" /> معاينة
                                            </button>
                                            <button 
                                                onClick={() => fetchReadDetails(item.id)}
                                                className="flex-1 inline-flex items-center justify-center p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all font-bold text-xs gap-1.5"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> {item.reads_count}
                                            </button>
                                            <button
                                                onClick={() => handleResend(item.id)}
                                                className="flex-none inline-flex items-center justify-center p-2 rounded-xl bg-gray-50 text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                title="إعادة إرسال تذكير"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                            <div className="py-24 text-center">
                                <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Bell className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">لا توجد إشعارات</h3>
                                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                                    جرب تعديل خيارات التصفية المتقدمة أو البحث بكلمات مختلفة.
                                </p>
                            </div>
                        )}
                        
                        {/* Pagination */}
                        {notifications.last_page > 1 && (
                            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="text-xs text-gray-500 font-medium">
                                    عرض <span className="text-gray-800 font-bold">{notifications.from}</span> إلى <span className="text-gray-800 font-bold">{notifications.to}</span> من أصل <span className="text-gray-800 font-bold">{notifications.total}</span> إشعار
                                </div>
                                <div className="flex gap-1.5">
                                    {notifications.links.map((link, i) => {
                                        if (link.label.includes('Previous')) {
                                            return (
                                                <button key={i} disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, { search, type, source, date_range: dateRange, engagement, sender_role: senderRole, receiver_name: receiverName }, { preserveScroll: true, preserveState: true })}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            );
                                        }
                                        if (link.label.includes('Next')) {
                                            return (
                                                <button key={i} disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, { search, type, source, date_range: dateRange, engagement, sender_role: senderRole, receiver_name: receiverName }, { preserveScroll: true, preserveState: true })}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                            );
                                        }
                                        return (
                                            <button key={i}
                                                onClick={() => link.url && router.get(link.url, { search, type, source, date_range: dateRange, engagement, sender_role: senderRole, receiver_name: receiverName }, { preserveScroll: true, preserveState: true })}
                                                className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-semibold transition-all ${
                                                    link.active 
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Read Details Modal */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                                <Eye className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">تفاصيل قراءات الإشعار</h2>
                        </div>
                        <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {loadingDetails ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                            <p className="text-gray-500 text-sm">جاري جلب البيانات...</p>
                        </div>
                    ) : readDetails ? (
                        <div>
                            {/* Stats Summary */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                                    <p className="text-2xl font-extrabold text-emerald-700">{readDetails.read_users.length}</p>
                                    <p className="text-xs text-emerald-600 font-medium mt-0.5">قرؤوا الإشعار</p>
                                </div>
                                <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-100">
                                    <p className="text-2xl font-extrabold text-rose-700">{readDetails.unread_users.length}</p>
                                    <p className="text-xs text-rose-600 font-medium mt-0.5">لم يقرؤوا بعد</p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
                                <button
                                    onClick={() => setActiveTab('read')}
                                    className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
                                        activeTab === 'read' 
                                            ? 'bg-white text-emerald-700 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    ✅ تمت القراءة ({readDetails.read_users.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('unread')}
                                    className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
                                        activeTab === 'unread' 
                                            ? 'bg-white text-rose-700 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    ⏳ لم يقرأ ({readDetails.unread_users.length})
                                </button>
                            </div>

                            {/* Search */}
                            <div className="mb-4 relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="بحث بالاسم..."
                                    className="block w-full pr-10 border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-blue-500 focus:border-blue-500 text-sm rounded-xl"
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                />
                            </div>

                            {/* List */}
                            <div className="overflow-y-auto pr-2" style={{ maxHeight: '350px' }}>
                                {activeTab === 'read' ? (
                                    <ul className="space-y-1.5">
                                        {readDetails.read_users
                                            .filter(u => u.name.toLowerCase().includes(modalSearch.toLowerCase()))
                                            .map(user => (
                                            <li key={user.id} className="py-3 px-3 flex items-center justify-between rounded-xl hover:bg-emerald-50/50 transition-colors">
                                                <div className="flex items-center">
                                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center font-bold text-xs ml-3 shadow-sm">
                                                        {user.name.substring(0, 2)}
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg" dir="ltr">
                                                    <span className="font-mono">{user.read_at}</span>
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                </div>
                                            </li>
                                        ))}
                                        {readDetails.read_users.filter(u => u.name.toLowerCase().includes(modalSearch.toLowerCase())).length === 0 && (
                                            <div className="py-8 text-center text-gray-500 text-sm">لا توجد نتائج مطابقة.</div>
                                        )}
                                    </ul>
                                ) : (
                                    <ul className="space-y-1.5">
                                        {readDetails.unread_users
                                            .filter(u => u.name.toLowerCase().includes(modalSearch.toLowerCase()))
                                            .map(user => (
                                            <li key={user.id} className="py-3 px-3 flex items-center justify-between rounded-xl hover:bg-rose-50/50 transition-colors">
                                                <div className="flex items-center">
                                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-400 to-rose-500 text-white flex items-center justify-center font-bold text-xs ml-3 shadow-sm">
                                                        {user.name.substring(0, 2)}
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                </div>
                                                <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-lg">
                                                    غير مقروء
                                                </span>
                                            </li>
                                        ))}
                                        {readDetails.unread_users.filter(u => u.name.toLowerCase().includes(modalSearch.toLowerCase())).length === 0 && (
                                            <div className="py-8 text-center text-gray-500 text-sm">لا توجد نتائج مطابقة.</div>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </Modal>

            {/* Live Preview Modal */}
            <Modal show={!!previewNotification} onClose={() => setPreviewNotification(null)} maxWidth="sm">
                <div className="p-6 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg flex justify-center">
                    <div className="relative w-[320px] h-[650px] bg-black rounded-[3rem] p-3 shadow-2xl border-4 border-gray-800">
                        <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-20">
                            <div className="w-32 h-6 bg-black rounded-b-3xl"></div>
                        </div>
                        <div className="relative w-full h-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-[2.5rem] overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-12 flex justify-between items-center px-6 text-white text-xs font-medium z-10">
                                <span>9:41</span>
                                <div className="flex gap-1.5 items-center">
                                    <Signal className="w-3 h-3" />
                                    <Wifi className="w-3 h-3" />
                                    <Battery className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="pt-20 text-center text-white mb-8">
                                <h1 className="text-6xl font-light tracking-tight">9:41</h1>
                                <p className="text-lg mt-1 font-medium opacity-90">الخميس، 15 سبتمبر</p>
                            </div>
                            {previewNotification && (
                                <div className="mx-3 mt-4 bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-right" dir="rtl">
                                    <div className="flex justify-between items-start mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${
                                                previewNotification.type === 'important' ? 'bg-red-100 text-red-600' :
                                                previewNotification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                                <Bell className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 tracking-wide uppercase">Smart School</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium">الآن</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-1 leading-snug">
                                        {previewNotification.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                        {previewNotification.message}
                                    </p>
                                </div>
                            )}

                            {/* Home Indicator */}
                            <div className="absolute bottom-2 inset-x-0 h-1 flex justify-center">
                                <div className="w-1/3 h-1 bg-white/80 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>


        </AdminLayout>
    );
}
