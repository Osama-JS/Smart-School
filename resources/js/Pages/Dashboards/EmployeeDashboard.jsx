import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import NewsWidget from '@/Components/NewsWidget';
import {
    Calendar, Clock, Users, ShieldAlert,
    CheckCircle, XCircle, AlertCircle, FileText, ChevronLeft,
    Sun, Moon, Quote, Plane, Edit3, PenTool, LayoutList, CheckSquare, Square,
    Megaphone, ChevronRight, Target, Activity, Trash2, Plus, Loader2,
    Cloud, Snowflake, Leaf, CloudRain, Thermometer, MapPin, Star,
    TrendingUp, Award, Sparkles, Zap
} from 'lucide-react';

export default function EmployeeDashboard({ auth, attendanceStatus, upcomingMeetings, pendingViolations, leaderboard, quickTasks = [], latestNews, performanceMetrics, todayTimeline = [], recentAppraisal }) {
    // Dynamic Greeting Logic
    const [greeting, setGreeting] = useState({ text: 'مرحباً', icon: Sun, color: 'text-amber-500' });

    // Seasonal & Weather Logic
    const [season, setSeason] = useState({ name: 'الربيع', gradient: 'from-primary-400 via-primary-500 to-primary-700', icon: Leaf });
    const [weather, setWeather] = useState({ temp: '24°', condition: 'مشمس', icon: Sun });

    // Smart Dark Mode
    const [isDarkMode, setIsDarkMode] = useState(false);
    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark') ||
            (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        if (!isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Interactive To-Do List State
    const [tasks, setTasks] = useState(quickTasks);

    const [newTaskText, setNewTaskText] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isProcessing, setIsProcessing] = useState(null); // hold task id or 'new'

    // Counter animation
    const [animatedDiscipline, setAnimatedDiscipline] = useState(0);
    const [animatedLeaves, setAnimatedLeaves] = useState(0);
    const statsRef = useRef(null);
    const [statsVisible, setStatsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !statsVisible) {
                    setStatsVisible(true);
                }
            },
            { threshold: 0.3 }
        );
        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, [statsVisible]);

    useEffect(() => {
        if (!statsVisible) return;
        const target = performanceMetrics?.discipline_percentage ?? 100;
        const duration = 1200;
        const steps = 40;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setAnimatedDiscipline(target);
                clearInterval(timer);
            } else {
                setAnimatedDiscipline(Math.round(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [statsVisible, performanceMetrics?.discipline_percentage]);

    useEffect(() => {
        if (!statsVisible) return;
        const target = performanceMetrics?.remaining_leaves ?? 0;
        const duration = 800;
        const steps = 20;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setAnimatedLeaves(target);
                clearInterval(timer);
            } else {
                setAnimatedLeaves(Math.round(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [statsVisible, performanceMetrics?.remaining_leaves]);

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        router.patch(route('dashboard.quick-tasks.toggle', id), {}, { preserveScroll: true });
    };

    const deleteTask = (id, e) => {
        e.stopPropagation();
        setIsProcessing(id);
        router.delete(route('dashboard.quick-tasks.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                setTasks(tasks.filter(t => t.id !== id));
                setIsProcessing(null);
            },
            onError: () => setIsProcessing(null)
        });
    };

    const addTask = () => {
        if (!newTaskText.trim()) {
            setIsAddingTask(false);
            return;
        }
        setIsProcessing('new');
        router.post(route('dashboard.quick-tasks.store'), { text: newTaskText }, {
            preserveScroll: true,
            onSuccess: () => {
                setNewTaskText('');
                setIsAddingTask(false);
                setIsProcessing(null);
            },
            onError: () => setIsProcessing(null)
        });
    };

    // Update Tasks when props change
    useEffect(() => {
        setTasks(quickTasks);
    }, [quickTasks]);

    const quotes = [
        "التعليم هو السلاح الأقوى الذي يمكنك استخدامه لتغيير العالم.",
        "المعلم الناجح هو أهم عمود في بناء الجيل القادم.",
        "لا حدود لما يمكن أن تنجزه عندما تتعاون مع فريقك.",
        "كل يوم هو فرصة جديدة لإحداث تأثير إيجابي."
    ];
    const randomQuote = quotes[auth.user.id % quotes.length]; // Pseudo-random based on user ID

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting({ text: 'صباح الخير', icon: Sun, color: 'text-amber-500' });
        } else if (hour >= 12 && hour < 17) {
            setGreeting({ text: 'مساء الخير', icon: Sun, color: 'text-orange-500' });
        } else {
            setGreeting({ text: 'مساء الخير', icon: Moon, color: 'text-indigo-400' });
        }
    }, []);

    useEffect(() => {
        const month = new Date().getMonth();
        if (month === 11 || month === 0 || month === 1) { // الشتاء
            setSeason({ name: 'الشتاء', gradient: 'from-blue-400 via-indigo-500 to-purple-600', icon: Snowflake });
            setWeather({ temp: '15°', condition: 'غائم جزئياً', icon: Cloud });
        } else if (month >= 2 && month <= 4) { // الربيع
            setSeason({ name: 'الربيع', gradient: 'from-primary-400 via-primary-500 to-primary-700', icon: Leaf });
            setWeather({ temp: '22°', condition: 'ربيعي معتدل', icon: Sun });
        } else if (month >= 5 && month <= 7) { // الصيف
            setSeason({ name: 'الصيف', gradient: 'from-amber-400 via-orange-500 to-rose-600', icon: Sun });
            setWeather({ temp: '38°', condition: 'مشمس وحار', icon: Sun });
        } else { // الخريف
            setSeason({ name: 'الخريف', gradient: 'from-orange-400 via-amber-500 to-yellow-600', icon: CloudRain });
            setWeather({ temp: '26°', condition: 'معتدل', icon: Cloud });
        }
    }, []);

    const formatTimeAr = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const formatDateAr = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Discipline level label
    const getDisciplineLabel = (val) => {
        if (val >= 95) return { text: 'ممتاز', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10' };
        if (val >= 80) return { text: 'جيد جداً', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10' };
        if (val >= 60) return { text: 'جيد', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' };
        return { text: 'يحتاج تحسين', color: 'text-accent-500 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-500/10' };
    };
    const disciplineLabel = getDisciplineLabel(performanceMetrics?.discipline_percentage ?? 100);

    return (
        <AdminLayout user={auth.user} activeMenu="الرئيسية">
            <Head title="لوحة تحكم الموظف | شامل" />

            {/* Inline styles for dashboard-specific animations */}
            <style>{`
                @keyframes dash-float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(1deg); }
                }
                @keyframes dash-glow {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }
                @keyframes dash-slide-up {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes dash-scale-up {
                    from { opacity: 0; transform: scale(0.92); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes dash-counter {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes dash-gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes dash-border-glow {
                    0%, 100% { border-color: rgba(107, 155, 55, 0.1); }
                    50% { border-color: rgba(107, 155, 55, 0.3); }
                }
                .dash-animate-in { animation: dash-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .dash-animate-scale { animation: dash-scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .dash-stagger > *:nth-child(1) { animation-delay: 0.05s; }
                .dash-stagger > *:nth-child(2) { animation-delay: 0.1s; }
                .dash-stagger > *:nth-child(3) { animation-delay: 0.15s; }
                .dash-stagger > *:nth-child(4) { animation-delay: 0.2s; }
                .dash-stagger > *:nth-child(5) { animation-delay: 0.25s; }
                .dash-stagger > *:nth-child(6) { animation-delay: 0.3s; }
                .dash-gradient-animate {
                    background-size: 200% 200%;
                    animation: dash-gradient-shift 6s ease infinite;
                }
                .dash-float { animation: dash-float 4s ease-in-out infinite; }
                .dash-glow { animation: dash-glow 3s ease-in-out infinite; }
            `}</style>

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">

                {/* ═══════════════════════════════════════════════════════
                    HERO GREETING HEADER - Brand-Aligned Premium Design
                ═══════════════════════════════════════════════════════ */}
                <div className="relative overflow-hidden rounded-[2.5rem] shadow-xl shadow-primary-500/5 dark:shadow-primary-900/20 dash-animate-in">
                    {/* Layered Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50/50 dark:from-[#121820] dark:via-[#141e28] dark:to-[#0f1419]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--primary-100)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(107,155,55,0.08)_0%,_transparent_60%)]" />

                    {/* Brand Bar */}
                    <div className="absolute top-0 right-0 left-0 h-1.5 z-30" style={{ background: '#6b9b37' }} />

                    {/* Floating Decorative Orbs */}
                    <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-primary-400/8 dark:bg-primary-500/5 rounded-full blur-3xl dash-glow pointer-events-none" />
                    <div className="absolute right-10 top-10 w-48 h-48 bg-primary-300/8 dark:bg-primary-400/5 rounded-full blur-3xl pointer-events-none dash-float" />
                    <div className="absolute left-1/2 top-0 w-32 h-32 bg-accent-400/5 dark:bg-accent-500/3 rounded-full blur-2xl pointer-events-none" />

                    {/* Subtle Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23437020' fill-opacity='1'%3E%3Cpath d='M0 0h1v40H0zm39 0h1v40h-1zM0 0h40v1H0zm0 39h40v1H0z'/%3E%3C/g%3E%3C/svg%3E")`,
                    }} />

                    <div className="relative z-10 p-4 md:p-5 lg:p-6">
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                            {/* Right Side: Greeting & Quote */}
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-primary-100/50 dark:border-primary-800/30 text-[10px] font-bold text-primary-700 dark:text-primary-400 mb-2 shadow-sm">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                    </span>
                                    متصل الآن
                                    <span className="w-px h-3 bg-primary-200 dark:bg-primary-700" />
                                    <span className="text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString('ar-EG', { weekday: 'long' })}</span>
                                </div>
                                <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5 mb-1">
                                    {greeting.text}، {auth.user.name.split(' ')[0]}
                                    <span className="dash-float inline-block">
                                        <greeting.icon className={`${greeting.color}`} size={26} />
                                    </span>
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-3">
                                    مرحباً بك في لوحة التحكم — يوم {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-primary-100/30 dark:border-slate-700/50 max-w-2xl group/quote hover:border-primary-200 dark:hover:border-primary-800/50 transition-all duration-300">
                                    <Quote size={18} className="text-primary-400/60 dark:text-primary-500/40 shrink-0 rotate-180 group-hover/quote:text-primary-500/80 transition-colors mt-0.5" />
                                    <p className="text-slate-600 dark:text-slate-300 font-semibold text-[11px] leading-relaxed">
                                        "{randomQuote}"
                                    </p>
                                </div>
                            </div>

                            {/* Left Side: Date, Weather, Season Widget */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full xl:w-auto">

                                {/* Date Widget */}
                                <div className="flex-1 xl:flex-none flex items-center gap-3 bg-white/80 dark:bg-[#121820]/80 backdrop-blur-2xl border border-primary-100/40 dark:border-slate-700/80 p-2.5 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 hover:-translate-y-0.5 group/date">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex flex-col items-center justify-center shadow-lg shadow-primary-500/25 group-hover/date:scale-105 transition-transform">
                                        <span className="text-[8px] font-bold opacity-80 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-sm font-black leading-none">{new Date().getDate()}</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-0.5">{new Date().toLocaleDateString('ar-EG', { weekday: 'long' })}</p>
                                        <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* Weather/Season Widget */}
                                <div className="flex-1 xl:flex-none flex items-center gap-3 bg-white/80 dark:bg-[#121820]/80 backdrop-blur-2xl border border-primary-100/40 dark:border-slate-700/80 p-2.5 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 hover:-translate-y-0.5 group/weather">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center border border-primary-100 dark:border-primary-800/40 group-hover/weather:scale-105 transition-transform">
                                        <season.icon size={20} className={season.name === 'الشتاء' ? 'text-blue-500' : season.name === 'الصيف' ? 'text-amber-500' : season.name === 'الخريف' ? 'text-orange-500' : 'text-primary-500'} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{season.name}</span>
                                            <span className="w-1 h-1 rounded-full bg-primary-300 dark:bg-primary-600"></span>
                                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{weather.condition}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-lg font-black text-slate-700 dark:text-slate-200">{weather.temp}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dark Mode Toggle */}
                                <button
                                    onClick={toggleDarkMode}
                                    className="h-full min-h-[56px] aspect-square flex items-center justify-center rounded-xl bg-white/80 dark:bg-[#121820]/80 backdrop-blur-2xl border border-primary-100/40 dark:border-slate-700/80 shadow-sm text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5 group/dm"
                                    title="تغيير المظهر"
                                >
                                    {isDarkMode ?
                                        <Sun size={20} className="text-amber-400 group-hover/dm:rotate-90 transition-transform duration-500" /> :
                                        <Moon size={20} className="text-primary-600 group-hover/dm:-rotate-12 transition-transform duration-500" />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* ─── Quick Actions (Header Footer) ─── */}
                        <div className="mt-5 pt-4 border-t border-primary-100/30 dark:border-slate-700/50 dash-animate-in" style={{ animationDelay: '0.1s' }}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 dash-stagger">
                                {/* Action 1: Leave Request */}
                                <Link href={route('hr.my-requests.index')} className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-slate-700/50 p-2 sm:p-2.5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 hover:bg-white/70 dark:hover:bg-slate-800/60 flex items-center gap-2.5">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0">
                                        <Plane size={16} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-[10px] sm:text-xs">طلب إجازة</span>
                                </Link>

                                {/* Action 2: Write Report */}
                                <Link href={route('hr.reports.my-reports.index')} className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-slate-700/50 p-2 sm:p-2.5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/10 hover:bg-white/70 dark:hover:bg-slate-800/60 flex items-center gap-2.5">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform shrink-0">
                                        <Edit3 size={16} />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-[10px] sm:text-xs">كتابة تقرير</span>
                                </Link>

                                {/* Action 3: Violations */}
                                <Link href={route('hr.employee-violations')} className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-slate-700/50 p-2 sm:p-2.5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-500/10 hover:bg-white/70 dark:hover:bg-slate-800/60 flex items-center gap-2.5">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0">
                                        <ShieldAlert size={16} className="group-hover:animate-pulse" />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-[10px] sm:text-xs">سجل المخالفات</span>
                                </Link>

                                {/* Action 4: Attendance */}
                                <Link href={route('hr.attendance')} className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-slate-700/50 p-2 sm:p-2.5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 hover:bg-white/70 dark:hover:bg-slate-800/60 flex items-center gap-2.5">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0">
                                        <Clock size={16} />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-[10px] sm:text-xs">سجل الحضور</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>


                {/* ─── News & Announcements (Full Width) ─── */}
                <NewsWidget news={latestNews} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ═══════════════════════════════════════════════════════
                        LEFT/MAIN CONTENT COLUMN (8 columns)
                    ═══════════════════════════════════════════════════════ */}
                    <div className="lg:col-span-8 space-y-8">




                        {/* ─── Performance & Metrics ─── */}
                        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 gap-5 dash-animate-in" style={{ animationDelay: '0.15s' }}>
                            {/* Attendance KPI Card */}
                            <div className="group relative overflow-hidden bg-white/70 dark:bg-[#121820]/70 backdrop-blur-xl border border-slate-100/80 dark:border-slate-800/80 rounded-[2rem] p-6 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-primary-500/8 transition-all duration-500 hover:-translate-y-1">
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 z-20" />
                                <div className="absolute top-0 right-0 w-40 h-40 bg-primary-400/5 dark:bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-400/10 transition-colors duration-700" />
                                <div className="relative z-10 flex-1">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/30">
                                            <Target size={17} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">مؤشر الانضباط</p>
                                    </div>
                                    <h4 className="text-4xl font-black text-slate-800 dark:text-white flex items-baseline gap-1 mt-2">
                                        {animatedDiscipline}<span className="text-xl text-slate-400 font-bold">%</span>
                                    </h4>
                                    <div className={`flex items-center gap-1.5 mt-3 px-3 py-1.5 ${disciplineLabel.bg} ${disciplineLabel.color} text-xs font-bold rounded-full w-max`}>
                                        <Activity size={12} />
                                        <span>{disciplineLabel.text}</span>
                                    </div>
                                </div>
                                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90 drop-shadow-md transition-transform duration-1000 group-hover:scale-105" viewBox="0 0 36 36">
                                        <path className="text-primary-100 dark:text-primary-900/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                        <path className="text-primary-500" strokeDasharray={`${animatedDiscipline}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0px 2px 6px rgba(107,155,55,0.35))', transition: 'stroke-dasharray 0.3s ease' }} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <Sparkles size={16} className="text-primary-400 dark:text-primary-500 mb-0.5" />
                                        <span className="text-[10px] font-bold text-slate-400">{disciplineLabel.text}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Leaves Balance Card */}
                            <div className="group relative overflow-hidden bg-white/70 dark:bg-[#121820]/70 backdrop-blur-xl border border-slate-100/80 dark:border-slate-800/80 rounded-[2rem] p-6 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-blue-500/8 transition-all duration-500 hover:-translate-y-1">
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-primary-500 z-20" />
                                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/5 dark:bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-400/10 transition-colors duration-700" />
                                <div className="relative z-10 flex-1">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
                                            <Plane size={17} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">رصيد الإجازات</p>
                                    </div>
                                    <h4 className="text-4xl font-black text-slate-800 dark:text-white flex items-baseline gap-1 mt-2">
                                        {animatedLeaves}<span className="text-xl text-slate-400 font-bold">يوم</span>
                                    </h4>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 text-xs font-bold rounded-full border border-accent-100 dark:border-accent-800/30">
                                            مُستهلك: {performanceMetrics?.used_leaves ?? 0}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90 drop-shadow-md transition-transform duration-1000 group-hover:scale-105" viewBox="0 0 36 36">
                                        {/* Background Circle (Total / Remaining Leaves - Blue) */}
                                        <path className="text-blue-200 dark:text-blue-800/40" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                        {/* Full arc in blue */}
                                        <path className="text-blue-400 dark:text-blue-500" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" style={{ filter: 'drop-shadow(0px 2px 4px rgba(59,130,246,0.3))' }} />
                                        {/* Progress Circle (Used Leaves - Red overlay) */}
                                        {performanceMetrics?.used_leaves > 0 && (
                                            <path className="text-accent-500" strokeDasharray={`${Math.round(((performanceMetrics?.used_leaves ?? 0) / (performanceMetrics?.total_leaves ?? 21)) * 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0px 2px 4px rgba(204,43,43,0.3))' }} />
                                        )}
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <Calendar size={14} className="text-blue-400 dark:text-blue-500 mb-0.5" />
                                        <span className="text-[10px] font-bold text-slate-400">متاح</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ─── Recent Appraisal ─── */}
                        {recentAppraisal && (
                            <div className="dash-animate-in" style={{ animationDelay: '0.2s' }}>
                                <div className="group relative overflow-hidden bg-white/70 dark:bg-[#121820]/70 backdrop-blur-xl border border-slate-100/80 dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-500">
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 via-amber-400 to-primary-500 z-20" />
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/5 dark:bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-400/10 transition-colors duration-700" />

                                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
                                        <div className="flex-1 w-full">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-primary-50 dark:from-amber-900/20 dark:to-primary-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-800/30">
                                                    <Star size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-800 dark:text-white">التقييم الأخير</h3>
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{recentAppraisal.cycle_name}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                                                {/* Strengths */}
                                                <div className="bg-primary-50/60 dark:bg-primary-900/15 p-4 rounded-2xl border border-primary-100/50 dark:border-primary-800/30 hover:border-primary-200 dark:hover:border-primary-700/50 transition-colors">
                                                    <h4 className="text-xs font-bold text-primary-700 dark:text-primary-400 mb-3 flex items-center gap-1.5"><CheckCircle size={14} /> نقاط القوة</h4>
                                                    <ul className="space-y-1.5">
                                                        {recentAppraisal.strengths.length > 0 ? recentAppraisal.strengths.map((str, idx) => (
                                                            <li key={idx} className="text-sm font-semibold text-primary-800 dark:text-primary-300 flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0"></span> {str}
                                                            </li>
                                                        )) : <li className="text-xs text-primary-600/70">لا يوجد بيانات</li>}
                                                    </ul>
                                                </div>

                                                {/* Improvements */}
                                                <div className="bg-amber-50/60 dark:bg-amber-900/15 p-4 rounded-2xl border border-amber-100/50 dark:border-amber-800/30 hover:border-amber-200 dark:hover:border-amber-700/50 transition-colors">
                                                    <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1.5"><TrendingUp size={14} /> مجالات التطوير</h4>
                                                    <ul className="space-y-1.5">
                                                        {recentAppraisal.improvements.length > 0 ? recentAppraisal.improvements.map((imp, idx) => (
                                                            <li key={idx} className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span> {imp}
                                                            </li>
                                                        )) : <li className="text-xs text-amber-600/70">لا يوجد بيانات</li>}
                                                    </ul>
                                                </div>
                                            </div>
                                            {recentAppraisal.comments && (
                                                <div className="mt-4 p-4 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-100/80 dark:border-slate-800/60">
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 flex gap-2">
                                                        <Quote size={16} className="text-slate-400 shrink-0 rotate-180" />
                                                        {recentAppraisal.comments}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary-50 to-amber-50 dark:from-primary-900/15 dark:to-amber-900/10 rounded-[1.5rem] border border-primary-100/50 dark:border-primary-800/40 shadow-inner min-w-[150px] group-hover:scale-105 transition-transform duration-500">
                                            <Award size={20} className="text-amber-500 mb-2" />
                                            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mb-1">النتيجة النهائية</p>
                                            <h4 className="text-5xl font-black text-primary-700 dark:text-primary-300 flex items-baseline gap-1">
                                                {recentAppraisal.final_score}<span className="text-xl text-primary-400 font-bold">%</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Daily Status Highlights (Attendance & Violations) ─── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 dash-animate-in" style={{ animationDelay: '0.25s' }}>
                            {/* Today's Attendance Card */}
                            <div className="group relative overflow-hidden bg-white/70 dark:bg-[#121820]/70 backdrop-blur-xl border border-slate-100/80 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 z-20" />
                                <div className={`absolute -right-10 -top-10 w-36 h-36 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity duration-700 ${attendanceStatus?.status === 'present' ? 'bg-primary-500' :
                                        attendanceStatus?.status === 'late' ? 'bg-amber-500' :
                                            attendanceStatus?.status === 'absent' ? 'bg-accent-500' :
                                                'bg-slate-500'
                                    }`}></div>

                                <div className="relative z-10 flex items-center gap-5">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${attendanceStatus?.status === 'present' ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-primary-500/25' :
                                            attendanceStatus?.status === 'late' ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/25' :
                                                attendanceStatus?.status === 'absent' ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-accent-500/25' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                        }`}>
                                        {attendanceStatus?.status === 'present' || attendanceStatus?.status === 'late' ? <CheckCircle size={32} /> :
                                            attendanceStatus?.status === 'absent' ? <XCircle size={32} /> : <Clock size={32} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">تسجيل الدخول اليوم</p>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">
                                            {attendanceStatus?.status === 'present' ? 'حاضر ومُلتزم' :
                                                attendanceStatus?.status === 'late' ? 'متأخر' :
                                                    attendanceStatus?.status === 'absent' ? 'غائب' : 'لم يُسجل الدخول'}
                                        </h3>
                                        {attendanceStatus?.time_in ? (
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                                                <Clock size={14} className={attendanceStatus?.status === 'late' ? 'text-amber-500' : 'text-primary-500'} />
                                                <span>تم التسجيل الساعة {formatTimeAr(attendanceStatus.time_in)}</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">بانتظار تسجيل البصمة...</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Pending Violations Card */}
                            <Link href={pendingViolations?.length > 0 ? route('hr.my-violations') : '#'} className={`group relative overflow-hidden bg-white/70 dark:bg-[#121820]/70 backdrop-blur-xl border rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${pendingViolations?.length > 0 ? 'border-accent-200/80 dark:border-accent-900/50 hover:border-accent-300 cursor-pointer' : 'border-slate-100/80 dark:border-slate-800 cursor-default'
                                }`}>
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 z-20" />
                                <div className={`absolute -left-10 -bottom-10 w-36 h-36 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity duration-700 ${pendingViolations?.length > 0 ? 'bg-accent-500' : 'bg-primary-500'
                                    }`}></div>

                                <div className="relative z-10 flex items-center gap-5 h-full">
                                    <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${pendingViolations?.length > 0 ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-accent-500/25' : 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-primary-500/25'
                                        }`}>
                                        {pendingViolations?.length > 0 && (
                                            <span className="absolute -top-2 -right-2 flex h-5 w-5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-5 w-5 bg-accent-500 border-2 border-white dark:border-[#121820] text-white text-[9px] font-black items-center justify-center">{pendingViolations.length}</span>
                                            </span>
                                        )}
                                        {pendingViolations?.length > 0 ? <ShieldAlert size={32} className="animate-pulse" /> : <CheckCircle size={32} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">السجل الإداري والمخالفات</p>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">
                                            {pendingViolations?.length > 0 ? `توجد (${pendingViolations.length}) مخالفة!` : 'سجلك نظيف وممتاز!'}
                                        </h3>
                                        {pendingViolations?.length > 0 ? (
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-accent-500 group-hover:text-accent-600 transition-colors mt-1">
                                                <span>انقر هنا لمراجعتها والإقرار بها</span>
                                                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                            </div>
                                        ) : (
                                            <p className="text-xs text-primary-500 font-bold mt-1">شكراً لالتزامك بقوانين العمل 🌟</p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* ─── Leaderboard Widget ─── */}
                        {leaderboard && leaderboard.length > 0 && (
                            <div className="dash-animate-in" style={{ animationDelay: '0.3s' }}>
                                <div className="group relative overflow-hidden bg-white/70 dark:bg-[#121820]/70 backdrop-blur-xl border border-slate-100/80 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500">
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-primary-500 to-amber-400 z-20" />
                                    <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/5 dark:bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-400/10 transition-colors duration-700" />

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-7">
                                            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                                <div className="relative w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform">
                                                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white dark:border-[#121820]"></span>
                                                    </span>
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" /></svg>
                                                </div>
                                                <div>
                                                    لوحة شرف الموظفين
                                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5 font-normal">أفضل 5 موظفين أداءً هذا الشهر</p>
                                                </div>
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            {leaderboard.map((leader, index) => {
                                                const isFirst = index === 0;
                                                const isSecond = index === 1;
                                                const isThird = index === 2;

                                                return (
                                                    <div key={leader.user_id} className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-default ${isFirst ? 'bg-gradient-to-r from-amber-50 to-amber-50/80 dark:from-amber-900/20 dark:to-amber-900/15 border-2 border-amber-200 dark:border-amber-700/50 shadow-sm shadow-amber-500/10' :
                                                            isSecond ? 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border border-slate-200 dark:border-slate-700' :
                                                                isThird ? 'bg-gradient-to-r from-amber-50/50 to-amber-50/30 dark:from-amber-900/10 dark:to-amber-900/5 border border-amber-200/50 dark:border-amber-800/30' :
                                                                    'bg-white/80 dark:bg-[#121820]/80 border border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                                                        }`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0 shadow-inner ${isFirst ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-500/40' :
                                                                    isSecond ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-slate-500/40' :
                                                                        isThird ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-500/40' :
                                                                            'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                                                }`}>
                                                                {isFirst && (
                                                                    <div className="absolute -top-3 -right-3 text-amber-500 animate-bounce">
                                                                        <svg className="w-6 h-6 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h14l-1.5-9L15 10l-3-6-3 6-2.5-3L5 16zm0 2h14v2H5v-2z" /></svg>
                                                                    </div>
                                                                )}
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <p className={`font-bold ${isFirst ? 'text-amber-900 dark:text-amber-100 text-lg' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                    {leader.user?.name}
                                                                </p>
                                                                {isFirst && <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">نجم الشهر 🌟</p>}
                                                            </div>
                                                        </div>
                                                        <div className={`flex flex-col items-end`}>
                                                            <span className={`font-black text-2xl ${isFirst ? 'text-amber-600 dark:text-amber-400' :
                                                                    isSecond ? 'text-slate-600 dark:text-slate-400' :
                                                                        isThird ? 'text-amber-600 dark:text-amber-500' :
                                                                            'text-amber-500'
                                                                }`}>
                                                                {leader.total_points}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">نقطة</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* ═══════════════════════════════════════════════════════
                        RIGHT/SIDEBAR COLUMN (4 columns)
                    ═══════════════════════════════════════════════════════ */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* ─── Daily Timeline (Agenda) ─── */}
                        <div className="dash-animate-in" style={{ animationDelay: '0.15s' }}>
                            <div className="relative group/widget">
                                <div className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-2xl border border-slate-100/80 dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden z-10">
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 z-20" />
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/5 dark:bg-primary-500/5 rounded-full blur-2xl group-hover/widget:bg-primary-400/10 transition-colors duration-700" />

                                    <h2 className="relative text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-8">
                                        <div className="p-2.5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-500/10 dark:to-primary-500/5 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-100 dark:border-primary-800/30">
                                            <Clock size={18} />
                                        </div>
                                        جدول اليوم
                                    </h2>

                                    <div className="relative border-r-2 border-primary-100/60 dark:border-primary-900/30 pr-6 space-y-8 min-h-[150px]">
                                        {todayTimeline.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center opacity-70">
                                                <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mb-3">
                                                    <Clock size={28} className="text-primary-300 dark:text-primary-700" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-500">لا توجد أحداث أو مهام مجدولة اليوم</p>
                                            </div>
                                        ) : (
                                            todayTimeline.map((item, index) => {
                                                const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

                                                const isPast = item.end_time < nowStr;
                                                const isCurrent = item.start_time <= nowStr && item.end_time >= nowStr;
                                                const isFuture = item.start_time > nowStr;

                                                return (
                                                    <div key={item.id} className="relative group/item">
                                                        {isCurrent && (
                                                            <>
                                                                <span className="absolute -right-[35px] top-1 flex h-4 w-4">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary-500 border-2 border-white dark:border-[#121820]"></span>
                                                                </span>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="text-xs font-black text-primary-600 dark:text-primary-400">{item.formatted_time}</p>
                                                                    <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[9px] font-black rounded-full uppercase tracking-wider animate-pulse">الآن</span>
                                                                </div>
                                                                <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-900/10 p-5 rounded-2xl border border-primary-200/60 dark:border-primary-800/50 shadow-lg shadow-primary-500/10 transition-transform group-hover/item:-translate-y-1">
                                                                    <h4 className="font-black text-primary-800 dark:text-primary-300 text-base">{item.title}</h4>
                                                                    <p className="text-xs font-semibold text-primary-600/80 dark:text-primary-400/80 mt-1.5 flex items-center gap-1.5">
                                                                        <MapPin size={12} />
                                                                        {item.location}
                                                                    </p>
                                                                </div>
                                                            </>
                                                        )}

                                                        {isPast && (
                                                            <>
                                                                <div className="absolute -right-[33px] top-1.5 w-3 h-3 bg-primary-200 dark:bg-primary-800 rounded-full ring-4 ring-white dark:ring-[#121820] transition-colors group-hover/item:bg-primary-300"></div>
                                                                <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-2">
                                                                    <CheckCircle size={12} className="text-primary-400" />
                                                                    {item.formatted_time}
                                                                </p>
                                                                <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all group-hover/item:border-slate-200 dark:group-hover/item:border-slate-700 opacity-70">
                                                                    <h4 className="font-bold text-slate-600 dark:text-slate-400 text-sm line-through decoration-slate-300 dark:decoration-slate-600">{item.title}</h4>
                                                                    <p className="text-xs text-slate-500 mt-1">{item.location}</p>
                                                                </div>
                                                            </>
                                                        )}

                                                        {isFuture && (
                                                            <>
                                                                <div className="absolute -right-[33px] top-1.5 w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-full ring-4 ring-white dark:ring-[#121820] transition-colors group-hover/item:bg-primary-300"></div>
                                                                <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-2">
                                                                    <Clock size={12} className="text-slate-400" />
                                                                    {item.formatted_time}
                                                                </p>
                                                                <div className="bg-white dark:bg-[#121820] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md group-hover/item:border-primary-200 dark:group-hover/item:border-primary-800/50 cursor-default">
                                                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">{item.title}</h4>
                                                                    <p className="text-xs text-slate-500 mt-1">{item.location}</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {upcomingMeetings?.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-primary-100/40 dark:border-slate-800">
                                            <Link href={route('meetings.index')} className="group/btn flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-bold rounded-2xl transition-all border border-primary-100/40 dark:border-primary-900/30 hover:border-primary-200 dark:hover:border-primary-800/50">
                                                عرض جميع اجتماعات الأسبوع
                                                <ChevronLeft size={16} className="transition-transform group-hover/btn:-translate-x-1" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ─── Tasks & Reminders (To-Do List) ─── */}
                        <div className="dash-animate-in" style={{ animationDelay: '0.2s' }}>
                            <div className="relative group/widget">
                                <div className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-2xl border border-slate-100/80 dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col relative overflow-hidden z-10">
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 z-20" />
                                    <div className="absolute -left-20 -top-20 w-40 h-40 bg-primary-400/5 dark:bg-primary-500/5 rounded-full blur-3xl group-hover/widget:bg-primary-400/10 transition-colors duration-700" />

                                    <div className="relative z-10 flex flex-col gap-4 mb-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                                <div className="p-2.5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-500/10 dark:to-primary-500/5 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-100 dark:border-primary-800/30">
                                                    <LayoutList size={18} />
                                                </div>
                                                مهام اليوم
                                            </h2>
                                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-4 py-1.5 rounded-full border border-primary-100/60 dark:border-primary-800/40">
                                                {tasks.filter(t => t.completed).length} / {tasks.length} منجزة
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        {tasks.length > 0 && (
                                            <div className="w-full h-2 bg-primary-50 dark:bg-primary-900/20 rounded-full overflow-hidden border border-primary-100/30 dark:border-primary-800/20">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000 ease-out relative"
                                                    style={{ width: `${Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 rounded-full" style={{
                                                        backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 6px)',
                                                    }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative z-10 space-y-2.5 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[350px]">
                                        {tasks.length === 0 && !isAddingTask && (
                                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                                <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/15 rounded-2xl flex items-center justify-center mb-3 border border-primary-100/40 dark:border-primary-800/30">
                                                    <CheckSquare size={32} className="text-primary-300 dark:text-primary-700" />
                                                </div>
                                                <p className="text-slate-500 font-bold">لا توجد مهام حالياً</p>
                                                <p className="text-xs text-slate-400 mt-1">أضف مهامك اليومية لمتابعتها هنا</p>
                                            </div>
                                        )}

                                        {tasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => toggleTask(task.id)}
                                                className={`group/task flex items-center justify-between gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-300 border relative overflow-hidden ${task.completed
                                                        ? 'bg-primary-50/30 dark:bg-primary-900/10 border-primary-100/30 dark:border-primary-800/20 opacity-70 hover:opacity-100'
                                                        : 'bg-white dark:bg-[#121820] border-slate-200/80 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700/50 hover:shadow-md hover:shadow-primary-500/5 hover:-translate-y-0.5'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className={`shrink-0 transition-all duration-500 ${task.completed ? 'text-primary-500 scale-110' : 'text-slate-300 dark:text-slate-600 group-hover/task:text-primary-400'
                                                        }`}>
                                                        {isProcessing === task.id ? (
                                                            <Loader2 size={22} className="animate-spin text-primary-400" />
                                                        ) : task.completed ? (
                                                            <CheckSquare size={22} className="drop-shadow-sm" />
                                                        ) : (
                                                            <Square size={22} />
                                                        )}
                                                    </div>
                                                    <p className={`text-sm font-semibold transition-all duration-500 ${task.completed
                                                            ? 'text-slate-400 dark:text-slate-500 line-through decoration-primary-300/50 dark:decoration-primary-700/50'
                                                            : 'text-slate-700 dark:text-slate-200'
                                                        }`}>
                                                        {task.text}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => deleteTask(task.id, e)}
                                                    className="opacity-0 group-hover/task:opacity-100 transition-opacity p-2 text-slate-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-xl"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                {/* Progress Line under completed tasks */}
                                                <div className={`absolute bottom-0 right-0 h-0.5 bg-gradient-to-l from-primary-400 to-primary-600 transition-all duration-500 ease-out ${task.completed ? 'left-0 opacity-100' : 'left-full opacity-0'}`} />
                                            </div>
                                        ))}

                                        <div className={`transition-all duration-300 overflow-hidden ${isAddingTask ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                            <div className="flex gap-2 items-center bg-white dark:bg-[#121820] p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                                                <input
                                                    type="text"
                                                    value={newTaskText}
                                                    onChange={e => setNewTaskText(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') addTask();
                                                        if (e.key === 'Escape') setIsAddingTask(false);
                                                    }}
                                                    autoFocus={isAddingTask}
                                                    disabled={isProcessing === 'new'}
                                                    placeholder="اكتب المهمة واضغط Enter..."
                                                    className="w-full text-sm bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                                                />
                                                <button
                                                    onClick={addTask}
                                                    disabled={isProcessing === 'new' || !newTaskText.trim()}
                                                    className="p-2.5 bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500 dark:hover:text-white rounded-xl transition-all duration-300 disabled:opacity-50 shrink-0"
                                                >
                                                    {isProcessing === 'new' ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        {!isAddingTask && (
                                            <button
                                                onClick={() => setIsAddingTask(true)}
                                                className="w-full mt-2 py-3.5 rounded-2xl border-2 border-dashed border-primary-200/50 dark:border-primary-800/30 text-slate-400 hover:text-primary-600 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2 group/add"
                                            >
                                                <Plus size={18} className="transition-transform group-hover/add:scale-110 group-hover/add:rotate-90" />
                                                إضافة مهمة شخصية
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
