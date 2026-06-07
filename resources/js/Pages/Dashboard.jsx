import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { 
    Users, GraduationCap, BookOpen, CheckSquare, 
    TrendingUp, ArrowUpRight, ArrowDownRight, Calendar,
    Clock, AlertCircle, Activity, Sparkles, BookCheck, ShieldAlert
} from 'lucide-react';

export default function Dashboard() {
    const { auth, logo_url } = usePage().props;

    // Live digital clock state
    const [timeStr, setTimeStr] = useState('');
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTimeStr(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    // Interactive Weekly Attendance state
    const [hoveredDay, setHoveredDay] = useState(null);
    const weeklyData = [
        { day: 'الأحد', percentage: 95.2, present: 1187, absent: 60, x: 50, y: 110 },
        { day: 'الإثنين', percentage: 96.8, present: 1207, absent: 40, x: 150, y: 70 },
        { day: 'الثلاثاء', percentage: 94.2, present: 1174, absent: 73, x: 250, y: 130 }, // Today
        { day: 'الأربعاء', percentage: 95.5, present: 1191, absent: 56, x: 350, y: 100 },
        { day: 'الخميس', percentage: 93.8, present: 1170, absent: 77, x: 450, y: 140 }
    ];

    // Activity Filter state
    const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'success', 'info', 'warning'

    const stats = [
        { 
            title: 'إجمالي الطلاب', value: '1,247', change: '+12%', up: true,
            icon: GraduationCap, color: 'primary',
            iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400',
            progress: 'w-[84%] bg-gradient-to-r from-primary-400 to-primary-600',
            glowBg: 'bg-primary-500/5',
            hoverBorder: 'hover:border-primary-200 dark:hover:border-primary-800/30',
            topLineHover: 'group-hover:bg-primary-500/20',
            ringColor: 'border-primary-500/20'
        },
        { 
            title: 'المعلمين', value: '86', change: '+3%', up: true,
            icon: Users, color: 'emerald',
            iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
            progress: 'w-[91%] bg-gradient-to-r from-emerald-400 to-emerald-600',
            glowBg: 'bg-emerald-500/5',
            hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800/30',
            topLineHover: 'group-hover:bg-emerald-500/20',
            ringColor: 'border-emerald-500/20'
        },
        { 
            title: 'المواد الدراسية', value: '24', change: '0%', up: true,
            icon: BookOpen, color: 'dark',
            iconBg: 'bg-dark-100 text-dark-700 dark:bg-dark-900/40 dark:text-dark-300',
            progress: 'w-[100%] bg-gradient-to-r from-dark-500 to-dark-700 dark:from-dark-400 dark:to-dark-600',
            glowBg: 'bg-dark-500/5',
            hoverBorder: 'hover:border-dark-300 dark:hover:border-dark-800/30',
            topLineHover: 'group-hover:bg-dark-500/20',
            ringColor: 'border-dark-500/20'
        },
        { 
            title: 'نسبة الحضور اليوم', value: '94.2%', change: '-1.3%', up: false,
            icon: CheckSquare, color: 'accent',
            iconBg: 'bg-accent-50 text-accent-600 dark:bg-accent-950/20 dark:text-accent-400',
            progress: 'w-[94.2%] bg-gradient-to-r from-accent-400 to-accent-600',
            glowBg: 'bg-accent-500/5',
            hoverBorder: 'hover:border-accent-200 dark:hover:border-accent-800/30',
            topLineHover: 'group-hover:bg-accent-500/20',
            ringColor: 'border-accent-500/20'
        },
    ];

    const recentActivities = [
        { text: 'تم تسجيل 15 طالب جديد في الفصل الدراسي الثالث', time: 'منذ 5 دقائق', type: 'success' },
        { text: 'تم تحديث جدول الحصص للمرحلة المتوسطة', time: 'منذ 30 دقيقة', type: 'info' },
        { text: 'تنبيه: 3 معلمين لم يرفعوا دفاتر التحضير للأسبوع الحالي', time: 'منذ ساعة', type: 'warning' },
        { text: 'تم رصد درجات الشهر الأول لمادة الرياضيات', time: 'منذ ساعتين', type: 'success' },
        { text: 'تم تقديم طلب إجازة اضطرارية من المعلم أحمد محمد', time: 'منذ 3 ساعات', type: 'info' },
    ];

    const filteredActivities = recentActivities.filter(act => {
        if (activityFilter === 'all') return true;
        return act.type === activityFilter;
    });

    const getActivityColor = (type) => {
        switch (type) {
            case 'success': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
            case 'warning': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
            case 'info': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
            default: return 'bg-slate-400';
        }
    };

    return (
        <AdminLayout activeMenu="الرئيسية">
            <Head title="لوحة التحكم | نظام القيم ERP" />

            <div className="space-y-8 animate-fade-in">
                
                {/* Premium Welcome Header with Animated SVGs & Clock (Styled like Staff Directory) */}
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

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <img src={logo_url || '/images/logo.png'} alt="شعار المدرسة" 
                                className="h-16 w-16 rounded-2xl object-contain bg-white p-2 shadow-md shrink-0 border border-slate-100/10" />
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-805 dark:text-white tracking-tight flex items-center gap-2">
                                    <span>مرحباً، {auth?.user?.name || 'مدير النظام'}</span>
                                    <span className="animate-bounce">👋</span>
                                </h1>
                                <p className="text-primary-705/80 dark:text-primary-300/80 mt-1.5 text-xs sm:text-sm font-semibold">نظام القيم ERP — إليك نظرة شاملة على مؤشرات الأداء والنشاطات اليومية</p>
                            </div>
                        </div>
                        
                        {/* Live Digital Clock & Calendar Widget */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-primary-700 dark:text-primary-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm backdrop-blur">
                                <Calendar size={14} className="text-primary-500 shrink-0" />
                                <span className="font-semibold">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            {timeStr && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm backdrop-blur font-mono font-bold tracking-wider">
                                    <Clock size={14} className="text-primary-500 animate-pulse shrink-0" />
                                    <span>{timeStr}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Refined Stats Cards Grid with custom colors & light mode optimizations */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <div key={index} className={`bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-none hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden group cursor-default bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:16px_16px] ${stat.hoverBorder}`}>
                            {/* Glowing ambient light */}
                            <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                            <div className={`absolute top-0 right-0 left-0 h-1 bg-transparent ${stat.topLineHover} transition-colors`} />

                            <div className="relative z-10 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{stat.title}</p>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none font-mono tracking-tight">{stat.value}</h3>
                                </div>
                                <div className={`relative h-11 w-11 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 transition-all duration-350 group-hover:scale-110 group-hover:-rotate-3`}>
                                    {/* Double ring hover overlay */}
                                    <span className={`absolute inset-0 rounded-2xl border ${stat.ringColor} scale-100 group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                                    <stat.icon size={20} strokeWidth={2.5} />
                                </div>
                            </div>
                            
                            {/* Progress bar and trend badge */}
                            <div className="relative z-10 space-y-2.5 mt-1">
                                <div className="w-full bg-slate-100/80 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${stat.progress}`} />
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                    <div className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full border ${
                                        stat.up 
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100/30 dark:border-emerald-500/20' 
                                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-100/20 dark:border-rose-500/20'
                                    }`}>
                                        {stat.up ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
                                        <span>{stat.change}</span>
                                    </div>
                                    <span className="text-slate-400 dark:text-slate-500">من الشهر الماضي</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dashboard Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Sidebar components (Alerts & Gauge Summary) */}
                    <div className="space-y-6 lg:col-span-1">
                        
                        {/* System alerts - Glassmorphic design */}
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5 bg-[radial-gradient(#f8fafc_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                            <div className="flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={18} className="text-rose-500" />
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base">تنبيهات النظام</h3>
                                </div>
                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-rose-500 text-white text-xs font-black border border-rose-400/20 animate-pulse">3</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3.5 p-3.5 bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20 transition-all hover:scale-[1.01] duration-300">
                                    <AlertCircle size={16} className="text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-400">فترة رصد الدرجات</p>
                                        <p className="text-[10px] text-amber-600/90 dark:text-amber-500/80 mt-1 font-semibold">تنتهي المهلة بعد 3 أيام عمل</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3.5 p-3.5 bg-rose-50/40 hover:bg-rose-50/70 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20 transition-all hover:scale-[1.01] duration-300">
                                    <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-400">حسابات تحتاج مراجعة</p>
                                        <p className="text-[10px] text-rose-500/90 dark:text-rose-500/80 mt-1 font-semibold">يوجد 5 طلاب معطلون مالياً</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3.5 p-3.5 bg-primary-50/40 hover:bg-primary-50/70 dark:bg-primary-500/10 rounded-2xl border border-primary-100 dark:border-primary-500/20 transition-all hover:scale-[1.01] duration-300">
                                    <AlertCircle size={16} className="text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-primary-800 dark:text-primary-400">تحديث النظام متوفر</p>
                                        <p className="text-[10px] text-primary-600/90 dark:text-primary-500/80 mt-1 font-semibold">الإصدار 2.1.0 جاهز للتطبيق</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Beautiful Circular Progress Summary for Attendance */}
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5">
                            <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100/80 dark:border-slate-800/60 pb-3">
                                <BookCheck size={16} className="text-primary-500" />
                                <span>الحضور والانصراف اليوم</span>
                            </h4>
                            
                            {/* SVG Ring Progress Gauge */}
                            <div className="relative flex items-center justify-center h-36 w-36 mx-auto my-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="72" cy="72" r="58" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="8" fill="transparent" />
                                    <circle cx="72" cy="72" r="58" className="stroke-[#6b9b37] dark:stroke-primary-400 transition-all duration-1000 ease-out" strokeWidth="8" fill="transparent" 
                                        strokeDasharray={2 * Math.PI * 58}
                                        strokeDashoffset={2 * Math.PI * 58 - (94.2 / 100) * 2 * Math.PI * 58}
                                        strokeLinecap="round"
                                        filter="url(#glow-filter-attend)"
                                    />
                                </svg>
                                <svg className="absolute w-0 h-0">
                                    <defs>
                                        <filter id="glow-filter-attend" x="-20%" y="-20%" width="140%" height="140%">
                                            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#6b9b37" floodOpacity="0.2"/>
                                        </filter>
                                    </defs>
                                </svg>
                                <div className="absolute text-center">
                                    <p className="text-2xl font-black text-slate-800 dark:text-white font-mono leading-none">94.2%</p>
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black mt-2">معدل الحضور</p>
                                </div>
                            </div>

                            <div className="space-y-3.5 pt-2">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5 text-xs font-semibold">
                                        <span className="text-slate-500 font-bold">الطلاب الحاضرون</span>
                                        <span className="font-bold text-primary-700 dark:text-primary-400">1,174 (94%)</span>
                                    </div>
                                    <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100/50 dark:border-transparent h-2 rounded-full overflow-hidden">
                                        <div className="bg-gradient-to-r from-primary-400 to-primary-600 h-full rounded-full transition-all duration-700" style={{ width: '94%' }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5 text-xs font-semibold">
                                        <span className="text-slate-500 font-bold">الطلاب الغائبون</span>
                                        <span className="font-bold text-rose-600 dark:text-rose-400">73 (6%)</span>
                                    </div>
                                    <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100/50 dark:border-transparent h-2 rounded-full overflow-hidden">
                                        <div className="bg-gradient-to-r from-rose-400 to-rose-600 h-full rounded-full transition-all duration-700" style={{ width: '6%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left main area (Weekly Chart & Activities Timeline) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Weekly Attendance Curve Chart (SVG based) */}
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5 relative overflow-hidden bg-[radial-gradient(#f8fafc_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                            <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2 border-b border-slate-100/80 dark:border-slate-800/60 pb-3">
                                <TrendingUp size={18} className="text-[#6b9b37]" />
                                <span>مخطط حضور الطلاب الأسبوعي (%)</span>
                            </h3>

                            {/* Hover Tooltip display */}
                            {hoveredDay !== null && (
                                <div className="absolute top-16 left-6 bg-white/95 dark:bg-slate-900/95 border border-slate-100 dark:border-slate-800 shadow-xl p-3.5 rounded-2xl text-right animate-scale-in pointer-events-none z-20 w-48">
                                    <p className="text-xs font-black text-slate-800 dark:text-white">{weeklyData[hoveredDay].day}</p>
                                    <p className="text-sm font-black text-primary-600 dark:text-primary-400 mt-1 font-mono">{weeklyData[hoveredDay].percentage}% حضور</p>
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-bold">
                                        <span>حاضر: {weeklyData[hoveredDay].present}</span>
                                        <span>غائب: {weeklyData[hoveredDay].absent}</span>
                                    </div>
                                </div>
                            )}

                            {/* SVG Chart */}
                            <div className="relative h-48 w-full select-none">
                                <svg viewBox="0 0 500 200" className="w-full h-full" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6b9b37" stopOpacity="0.25" />
                                            <stop offset="100%" stopColor="#6b9b37" stopOpacity="0.0" />
                                        </linearGradient>
                                        <filter id="shadowCurve" x="-10%" y="-10%" width="120%" height="120%">
                                            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#6b9b37" floodOpacity="0.3" />
                                        </filter>
                                    </defs>

                                    {/* Grid Lines */}
                                    <line x1="40" y1="40" x2="460" y2="40" className="stroke-slate-100 dark:stroke-slate-800/50" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="90" x2="460" y2="90" className="stroke-slate-100 dark:stroke-slate-800/50" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="140" x2="460" y2="140" className="stroke-slate-100 dark:stroke-slate-800/50" strokeWidth="1" strokeDasharray="4 4" />

                                    {/* Filled Gradient path */}
                                    <path 
                                        d="M 50 110 C 100 90, 100 70, 150 70 C 200 70, 200 130, 250 130 C 300 130, 300 100, 350 100 C 400 100, 400 140, 450 140 L 450 180 L 50 180 Z" 
                                        fill="url(#curveGradient)" 
                                    />

                                    {/* Curve path */}
                                    <path 
                                        d="M 50 110 C 100 90, 100 70, 150 70 C 200 70, 200 130, 250 130 C 300 130, 300 100, 350 100 C 400 100, 400 140, 450 140" 
                                        fill="none" 
                                        className="stroke-[#6b9b37] dark:stroke-primary-400" 
                                        strokeWidth="3.5" 
                                        strokeLinecap="round"
                                        filter="url(#shadowCurve)"
                                    />

                                    {/* Interactive dots */}
                                    {weeklyData.map((d, idx) => (
                                        <g key={idx}>
                                            <circle 
                                                cx={d.x} 
                                                cy={d.y} 
                                                r={hoveredDay === idx ? 8 : 5} 
                                                className="fill-white dark:fill-slate-900 stroke-[#6b9b37] dark:stroke-primary-400 stroke-[3] cursor-pointer transition-all duration-200" 
                                                onMouseEnter={() => setHoveredDay(idx)} 
                                                onMouseLeave={() => setHoveredDay(null)} 
                                            />
                                            {hoveredDay === idx && (
                                                <circle 
                                                    cx={d.x} 
                                                    cy={d.y} 
                                                    r="14" 
                                                    className="fill-none stroke-[#6b9b37]/25 stroke-[4] animate-ping pointer-events-none" 
                                                />
                                            )}
                                        </g>
                                    ))}
                                </svg>
                            </div>
                            
                            {/* X-axis labels */}
                            <div className="flex justify-between px-8 text-[10px] font-bold text-slate-550 dark:text-slate-400 font-sans select-none">
                                {weeklyData.map((d, idx) => (
                                    <span key={idx} className={hoveredDay === idx ? 'text-primary-600 dark:text-primary-400 font-bold scale-105 transition-all' : ''}>
                                        {d.day}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activities Panel with Segmented Presets */}
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100/80 dark:border-slate-800/60 pb-4">
                                <div className="flex items-center gap-2">
                                    <Activity size={18} className="text-primary-500" />
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base">آخر النشاطات الحالية</h3>
                                </div>

                                {/* Sliding preset capsules for filtering */}
                                <div className="relative flex items-center gap-1 bg-slate-50 dark:bg-slate-950/80 p-1 border border-slate-100 dark:border-slate-800/80 rounded-2xl w-fit select-none font-sans">
                                    {[
                                        { key: 'all', label: 'الكل' },
                                        { key: 'success', label: 'نجاح' },
                                        { key: 'info', label: 'معلومات' },
                                        { key: 'warning', label: 'تنبيهات' }
                                    ].map(preset => (
                                        <button
                                            key={preset.key}
                                            onClick={() => setActivityFilter(preset.key)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                                                activityFilter === preset.key
                                                    ? 'bg-primary-500 text-white shadow-sm font-bold'
                                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-900/30'
                                            }`}>
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Timeline Component */}
                            <div className="p-2 relative min-h-[150px]">
                                <div className="absolute right-9 top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800/60" />
                                
                                {filteredActivities.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                                        <Clock size={32} className="mx-auto mb-2 opacity-30 animate-pulse" />
                                        <p className="font-bold">لا توجد نشاطات ضمن هذا التصنيف حالياً</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {filteredActivities.map((activity, index) => (
                                            <div key={index} className="relative pl-2 pr-10 group animate-fade-in">
                                                {/* Pulsing timeline dot */}
                                                <div className={`absolute right-[30px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-10 transition-transform duration-300 group-hover:scale-125 ${getActivityColor(activity.type)}`} />
                                                
                                                {/* Content Box */}
                                                <div className="bg-slate-50/30 hover:bg-slate-50/70 border border-slate-100/80 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 dark:border-slate-800/40 p-4 rounded-2xl transition-all duration-250 hover:shadow-sm">
                                                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{activity.text}</p>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5 font-bold font-sans">
                                                        <Clock size={11} /> {activity.time}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
