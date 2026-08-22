import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import NewsWidget from '@/Components/NewsWidget';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import {
    Calendar, Clock, Users, BookOpen,
    CheckCircle, XCircle, AlertCircle, MapPin,
    Sun, Moon, Quote, ChevronRight, ChevronLeft,
    CheckSquare, Square, FileText, ClipboardList, TrendingUp, TrendingDown, Minus,
    Megaphone, Trophy, Star, BellRing, ArrowUpRight, Trash2, Plus, Loader2,
    Cloud, Snowflake, Leaf, CloudRain, LayoutList
} from 'lucide-react';

export default function TeacherDashboard({ auth, todayTimetable, attendanceStatus, upcomingMeetings, stats, leaderboard, topStudents, teacherProgress, classPerformance, teacherSubjects, semesters, filters, quickTasks = [], latestNews }) {
    const [greeting, setGreeting] = useState({ text: 'مرحباً', icon: Sun, color: 'text-amber-500' });
    const quotes = [
        "التعليم هو السلاح الأقوى الذي يمكنك استخدامه لتغيير العالم.",
        "المعلم الناجح هو أهم عمود في بناء الجيل القادم.",
        "لا حدود لما يمكن أن تنجزه عندما تتعاون مع طلابك.",
        "كل يوم هو فرصة جديدة لإحداث تأثير إيجابي.",
        "العلم نور، والجهل ظلام.",
    ];
    const randomQuote = quotes[auth.user.id % quotes.length];

    const [season, setSeason] = useState({ name: 'الربيع', gradient: 'from-emerald-400 via-emerald-500 to-teal-600', icon: Leaf });
    const [weather, setWeather] = useState({ temp: '24°', condition: 'مشمس', icon: Sun });

    const [isDarkMode, setIsDarkMode] = useState(false);
    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark') ||
            (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDarkMode(isDark);
        if (isDark) document.documentElement.classList.add('dark');
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        if (!isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting({ text: 'صباح الخير', icon: Sun, color: 'text-amber-500' });
        else if (hour >= 12 && hour < 17) setGreeting({ text: 'مساء الخير', icon: Sun, color: 'text-orange-500' });
        else setGreeting({ text: 'مساء الخير', icon: Moon, color: 'text-indigo-400' });
    }, []);

    useEffect(() => {
        const month = new Date().getMonth();
        if (month === 11 || month === 0 || month === 1) {
            setSeason({ name: 'الشتاء', gradient: 'from-blue-400 via-indigo-500 to-purple-600', icon: Snowflake });
            setWeather({ temp: '15°', condition: 'غائم جزئياً', icon: Cloud });
        } else if (month >= 2 && month <= 4) {
            setSeason({ name: 'الربيع', gradient: 'from-emerald-400 via-teal-500 to-primary-600', icon: Leaf });
            setWeather({ temp: '22°', condition: 'ربيعي معتدل', icon: Sun });
        } else if (month >= 5 && month <= 7) {
            setSeason({ name: 'الصيف', gradient: 'from-amber-400 via-orange-500 to-rose-600', icon: Sun });
            setWeather({ temp: '38°', condition: 'مشمس وحار', icon: Sun });
        } else {
            setSeason({ name: 'الخريف', gradient: 'from-orange-400 via-amber-500 to-yellow-600', icon: CloudRain });
            setWeather({ temp: '26°', condition: 'معتدل', icon: Cloud });
        }
    }, []);

    const handleFilterChange = (key, value) => {
        router.get(
            route('dashboard'),
            { ...filters, [key]: value },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const [tasks, setTasks] = useState(quickTasks);
    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        router.patch(route('dashboard.quick-tasks.toggle', id), {}, { preserveScroll: true });
    };
    const [newTaskText, setNewTaskText] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isProcessing, setIsProcessing] = useState(null);

    const deleteTask = (id, e) => {
        e.stopPropagation();
        setIsProcessing(id);
        router.delete(route('dashboard.quick-tasks.destroy', id), {
            preserveScroll: true,
            onSuccess: () => { setTasks(tasks.filter(t => t.id !== id)); setIsProcessing(null); },
            onError: () => setIsProcessing(null)
        });
    };
    const addTask = () => {
        if (!newTaskText.trim()) { setIsAddingTask(false); return; }
        setIsProcessing('new');
        router.post(route('dashboard.quick-tasks.store'), { text: newTaskText }, {
            preserveScroll: true,
            onSuccess: () => { setNewTaskText(''); setIsAddingTask(false); setIsProcessing(null); },
            onError: () => setIsProcessing(null)
        });
    };
    useEffect(() => { setTasks(quickTasks); }, [quickTasks]);

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

    return (
        <AdminLayout user={auth.user} activeMenu="الرئيسية">
            <Head title="لوحة تحكم المعلم | شامل" />
            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">

                {/* Next Class Alert */}
                {todayTimetable && todayTimetable.length > 0 && (
                    <div className="group relative overflow-hidden bg-gradient-to-l from-emerald-600 to-emerald-800 dark:from-emerald-700 dark:to-emerald-900 rounded-[2.5rem] p-5 sm:p-6 shadow-lg shadow-emerald-500/20 text-white">
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                    <BellRing size={28} className="animate-bounce" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg mb-0.5">تنبيه الحصة القادمة</h3>
                                    <p className="text-emerald-100 text-sm font-semibold">تبدأ حصة (الرياضيات - الصف الأول) بعد <span className="font-black text-white bg-white/20 px-2 py-0.5 rounded-lg">15 دقيقة</span> في قاعة 3.</p>
                                </div>
                            </div>
                            <Link href="#" className="shrink-0 bg-white text-emerald-700 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                                تحضير الدرس
                            </Link>
                        </div>
                    </div>
                )}

                {/* Dynamic Greeting Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-emerald-50/30 to-white dark:from-[#064e3b]/30 dark:via-[#121820] dark:to-[#121820] border border-emerald-100/50 dark:border-emerald-800/30 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-2" style={{ backgroundColor: 'var(--color-primary-400)' }} />
                    <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute right-0 top-0 w-64 h-64 bg-amber-400/5 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-slate-700/50 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                متصل الآن
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 mb-2">
                                {greeting.text}، أستاذ {auth.user.name.split(' ')[0]} <greeting.icon className={`animate-pulse-slow ${greeting.color}`} size={28} />
                            </h1>
                            <div className="flex items-start gap-2 mt-2 p-3 rounded-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 max-w-xl shadow-inner">
                                <Quote size={18} className="text-emerald-400/50 dark:text-emerald-500/30 shrink-0 rotate-180" />
                                <p className="text-slate-600 dark:text-slate-300 font-semibold text-xs leading-relaxed">"{randomQuote}"</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                            <div className="flex-1 xl:flex-none flex items-center gap-3 bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl border border-white dark:border-slate-700/80 p-2.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex flex-col items-center justify-center shadow-inner">
                                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'short' })}</span>
                                    <span className="text-lg font-black leading-none">{new Date().getDate()}</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-0.5">{new Date().toLocaleDateString('ar-EG', { weekday: 'long' })}</p>
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="flex-1 xl:flex-none flex items-center gap-3 bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl border border-white dark:border-slate-700/80 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner">
                                    <season.icon size={20} className={season.name === 'الشتاء' ? 'text-blue-500' : season.name === 'الصيف' ? 'text-amber-500' : season.name === 'الخريف' ? 'text-orange-500' : 'text-emerald-500'} />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{season.name}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{weather.condition}</span>
                                    </div>
                                    <span className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-0.5">{weather.temp}</span>
                                </div>
                            </div>
                            <button onClick={toggleDarkMode} className="h-full min-h-[72px] aspect-square flex items-center justify-center rounded-3xl bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl border border-white dark:border-slate-700/80 shadow-sm text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 transition-all hover:shadow-md hover:-translate-y-1" title="تغيير المظهر">
                                {isDarkMode ? <Sun size={28} className="animate-spin-slow text-amber-400" /> : <Moon size={28} className="text-indigo-500" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            الإجراءات السريعة
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        <Link href={route('teacher.class-attendances.index')} className="group relative overflow-hidden bg-white/40 dark:bg-[#121820]/40 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 p-6 rounded-[2rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] hover:bg-white/80 dark:hover:bg-[#121820]/80">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-white/0 pointer-events-none rounded-[2rem]"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl group-hover:bg-emerald-400/30 transition-colors duration-500"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-2 ring-white/50 dark:ring-slate-800/50"><CheckCircle size={28} /></div>
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">تحضير الطلاب</span>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </Link>
                        
                        <Link href={route('academic.monthly-grades.index')} className="group relative overflow-hidden bg-white/40 dark:bg-[#121820]/40 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 p-6 rounded-[2rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)] hover:bg-white/80 dark:hover:bg-[#121820]/80">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-white/0 pointer-events-none rounded-[2rem]"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl group-hover:bg-blue-400/30 transition-colors duration-500"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-2 ring-white/50 dark:ring-slate-800/50"><FileText size={28} /></div>
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">رصد الدرجات</span>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </Link>

                        <Link href={route('teacher.lesson-preparations.index')} className="group relative overflow-hidden bg-white/40 dark:bg-[#121820]/40 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 p-6 rounded-[2rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:bg-white/80 dark:hover:bg-[#121820]/80">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-white/0 pointer-events-none rounded-[2rem]"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl group-hover:bg-indigo-400/30 transition-colors duration-500"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-2 ring-white/50 dark:ring-slate-800/50"><ClipboardList size={28} /></div>
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">دفتر التحضير</span>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </Link>

                        <Link href={route('teacher.my-classroom-visits')} className="group relative overflow-hidden bg-white/40 dark:bg-[#121820]/40 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 p-6 rounded-[2rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.2)] hover:bg-white/80 dark:hover:bg-[#121820]/80">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-white/0 pointer-events-none rounded-[2rem]"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl group-hover:bg-amber-400/30 transition-colors duration-500"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 ring-2 ring-white/50 dark:ring-slate-800/50"><Users size={28} /></div>
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">زيارة صفية</span>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="group relative overflow-hidden bg-white/60 dark:bg-[#121820]/60 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${attendanceStatus?.status === 'present' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className={`inline-flex p-3 rounded-[1.25rem] shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ring-1 ring-white/50 dark:ring-slate-800/50 ${attendanceStatus?.status === 'present' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <CheckCircle size={24} />
                                </div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-100 dark:border-emerald-800/30">
                                    اليوم
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">حضورك اليوم</p>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">{attendanceStatus?.status === 'present' ? 'حاضر ومُلتزم' : 'لم يُسجل بعد'}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/60 dark:bg-[#121820]/60 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 bg-blue-500"></div>
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="inline-flex p-3 rounded-[1.25rem] bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-inner shadow-blue-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ring-1 ring-white/50 dark:ring-slate-800/50">
                                    <Users size={24} />
                                </div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-100 dark:border-blue-800/30">
                                    <Users size={12} /> إجمالي
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">الطلاب</p>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white flex items-baseline gap-1">
                                    {stats?.students || 0} <span className="text-sm font-bold text-slate-400">طالب</span>
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/60 dark:bg-[#121820]/60 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 bg-indigo-500"></div>
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="inline-flex p-3 rounded-[1.25rem] bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-inner shadow-indigo-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ring-1 ring-white/50 dark:ring-slate-800/50">
                                    <BookOpen size={24} />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">المقررات</p>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white flex items-baseline gap-1">
                                    {stats.subjects} <span className="text-sm font-bold text-slate-400">مقرر</span>
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/60 dark:bg-[#121820]/60 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 bg-emerald-500"></div>
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="relative w-14 h-14 shrink-0 transition-transform duration-500 group-hover:scale-110">
                                    <svg className="w-14 h-14 transform -rotate-90 drop-shadow-md" viewBox="0 0 36 36">
                                        <path className="text-white/50 dark:text-slate-800/50" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className="text-emerald-500 transition-all duration-1000 ease-out" strokeDasharray="88, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-black text-slate-700 dark:text-slate-300">{stats?.successRate || 0}%</span></div>
                                </div>
                                {stats?.successRateTrend !== undefined && (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                        stats.successRateTrend > 0 
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30'
                                            : stats.successRateTrend < 0
                                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/30'
                                                : 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800/30'
                                    }`}>
                                        {stats.successRateTrend > 0 ? <TrendingUp size={12} /> : stats.successRateTrend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                                        <span dir="ltr">{stats.successRateTrend > 0 ? '+' : ''}{stats.successRateTrend}%</span>
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">متوسط النجاح</p>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">أداء متميز</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── News & Announcements (Full Width) ─── */}
                <NewsWidget news={latestNews} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">



                        {/* Class Performance Chart */}
                        {classPerformance && classPerformance.length > 0 && (
                            <div className="group relative overflow-hidden bg-white/70 dark:bg-[#121820]/70 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-500">
                                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary-500 to-primary-400 z-20 opacity-80"></div>
                                <div className="absolute top-0 left-0 w-64 h-64 bg-primary-400/5 dark:bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-400/10 transition-colors"></div>
                                <div className="relative z-10">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                            <div className="relative w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
                                                <TrendingUp size={28} />
                                            </div>
                                            <div>مؤشر أداء الفصول<p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 font-normal">مقارنة بمتوسط الدرجات ونسبة الحضور</p></div>
                                        </h3>
                                        
                                        <div className="flex items-center gap-3">
                                            {semesters && semesters.length > 0 && (
                                                <select 
                                                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 cursor-pointer shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                    value={filters?.semester_id || ''}
                                                    onChange={(e) => handleFilterChange('semester_id', e.target.value)}
                                                >
                                                    <option value="">كل الفصول الدراسية</option>
                                                    {semesters.map(sem => (
                                                        <option key={sem.id} value={sem.id}>{sem.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                            
                                            {teacherSubjects && teacherSubjects.length > 0 && (
                                                <select 
                                                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 cursor-pointer shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                    value={filters?.subject_id || ''}
                                                    onChange={(e) => handleFilterChange('subject_id', e.target.value)}
                                                >
                                                    <option value="">كل المقررات</option>
                                                    {teacherSubjects.map(sub => (
                                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-72 w-full" dir="ltr">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={classPerformance} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                                <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                                                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    cursor={{ fill: 'var(--color-primary-500)', opacity: 0.05 }}
                                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                                    itemStyle={{ fontWeight: '900' }}
                                                />
                                                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} />
                                                <Bar yAxisId="left" dataKey="score" name="متوسط الدرجات" fill="url(#colorScore)" radius={[6, 6, 0, 0]} barSize={24} />
                                                <Bar yAxisId="right" dataKey="attendance" name="نسبة الحضور %" fill="url(#colorAttendance)" radius={[6, 6, 0, 0]} barSize={24} />
                                                
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={1} />
                                                        <stop offset="95%" stopColor="var(--color-primary-400)" stopOpacity={0.6} />
                                                    </linearGradient>
                                                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                                                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.6} />
                                                    </linearGradient>
                                                </defs>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top Students */}
                        <div className="group relative overflow-hidden bg-white/70 dark:bg-[#121820]/70 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-500">
                            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-400 z-20 opacity-80"></div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 dark:bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-400/10 transition-colors"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                        <div className="relative w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform"><Trophy size={28} /></div>
                                        <div>نجوم الأسبوع<p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 font-normal">أفضل طلابك تميزاً هذا الأسبوع</p></div>
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {(topStudents && topStudents.length > 0 ? topStudents : [
                                        { name: 'لا يوجد طلاب متميزين', score: 0 }
                                    ]).map((student, idx) => (
                                        <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col items-center justify-center text-center ${
                                            idx === 0 ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-700/50' :
                                            idx === 1 ? 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border-slate-200 dark:border-slate-700' :
                                            'bg-gradient-to-br from-orange-50/50 to-orange-50 dark:from-orange-900/10 dark:to-orange-900/5 border-orange-200/50 dark:border-orange-800/30'
                                        }`}>
                                            <div className="relative mb-3">
                                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${
                                                    idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-500/40' :
                                                    idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-slate-500/40' :
                                                    'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-500/40'
                                                }`}>{idx + 1}</div>
                                                {idx === 0 && <div className="absolute -top-3 -right-3 text-amber-500 animate-bounce"><svg className="w-6 h-6 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h14l-1.5-9L15 10l-3-6-3 6-2.5-3L5 16zm0 2h14v2H5v-2z"/></svg></div>}
                                            </div>
                                            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-1">{student.name}</h4>
                                            <span className={`text-xl font-black ${idx === 0 ? 'text-amber-600 dark:text-amber-400' : idx === 1 ? 'text-slate-600 dark:text-slate-400' : 'text-orange-600 dark:text-orange-400'}`}>{student.score}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">نقطة تميز</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Leaderboard */}
                        {leaderboard && leaderboard.length > 0 && (
                            <div className="group relative overflow-hidden bg-white/70 dark:bg-[#121820]/70 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500">
                                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-400 z-20 opacity-80"></div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 dark:bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-400/10 transition-colors"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                            <div className="relative w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white dark:border-[#121820]"></span></span>
                                                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>
                                            </div>
                                            <div>لوحة شرف المعلمين<p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 font-normal">أفضل 5 معلمين أداءً هذا الشهر</p></div>
                                        </h3>
                                    </div>
                                    
                                    {/* Teacher Personal Progress */}
                                    {teacherProgress && (
                                        <div className="mb-6 p-5 bg-gradient-to-br from-primary-50/50 to-primary-100/30 dark:from-primary-900/10 dark:to-primary-900/5 rounded-[1.5rem] border border-primary-100/50 dark:border-primary-800/30 shadow-sm relative overflow-hidden">
                                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-400/10 rounded-full blur-2xl"></div>
                                            <div className="relative z-10 flex justify-between items-end mb-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">مستواك الحالي</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 border border-primary-200/50 dark:border-primary-800/50 shadow-sm">
                                                            {teacherProgress.current_tier}
                                                        </span>
                                                        <span className="text-xl font-black text-slate-800 dark:text-white flex items-baseline gap-1">
                                                            {teacherProgress.points} <span className="text-[10px] font-bold text-slate-400">نقطة</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">المستوى التالي</p>
                                                    <p className="text-sm font-black text-slate-700 dark:text-slate-300">{teacherProgress.next_tier}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="relative h-3 bg-white/60 dark:bg-[#121820]/60 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
                                                <div 
                                                    className="absolute top-0 right-0 h-full bg-gradient-to-l from-primary-400 to-primary-600 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                                    style={{ width: `${teacherProgress.percentage}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                                                </div>
                                            </div>
                                            
                                            {teacherProgress.points_needed > 0 ? (
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-3 text-center flex items-center justify-center gap-1.5">
                                                    <Trophy size={12} className="text-primary-500" />
                                                    متبقي <span className="text-primary-600 dark:text-primary-400 font-black">{teacherProgress.points_needed}</span> نقطة للوصول للمستوى التالي!
                                                </p>
                                            ) : (
                                                <p className="text-[10px] font-bold text-amber-500 mt-3 text-center flex items-center justify-center gap-1.5">
                                                    <Star size={12} className="fill-amber-500" />
                                                    لقد وصلت لأعلى مستوى! أنت نجم المدرسة
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {leaderboard.map((leader, index) => {
                                            const isFirst = index === 0; const isSecond = index === 1; const isThird = index === 2;
                                            return (
                                                <div key={leader.user_id} className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default ${
                                                    isFirst ? 'bg-gradient-to-r from-amber-50 to-amber-50 dark:from-amber-900/20 dark:to-amber-900/20 border-2 border-amber-200 dark:border-amber-700/50' :
                                                    isSecond ? 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border border-slate-200 dark:border-slate-700' :
                                                    isThird ? 'bg-gradient-to-r from-amber-50/50 to-amber-50/50 dark:from-amber-900/10 dark:to-amber-900/10 border border-amber-200/50 dark:border-amber-800/30' :
                                                    'bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800/80 hover:border-slate-300'
                                                }`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0 shadow-inner ${
                                                            isFirst ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-500/40' :
                                                            isSecond ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-slate-500/40' :
                                                            isThird ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-500/40' :
                                                            'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                                        }`}>
                                                            {isFirst && <div className="absolute -top-3 -right-3 text-amber-500 animate-bounce"><svg className="w-6 h-6 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h14l-1.5-9L15 10l-3-6-3 6-2.5-3L5 16zm0 2h14v2H5v-2z"/></svg></div>}
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold ${isFirst ? 'text-amber-900 dark:text-amber-100 text-lg' : 'text-slate-700 dark:text-slate-200'}`}>{leader.user?.name}</p>
                                                            {isFirst && <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">نجم الشهر 🌟</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className={`font-black text-2xl ${isFirst ? 'text-amber-600 dark:text-amber-400' : isSecond ? 'text-slate-600 dark:text-slate-400' : isThird ? 'text-amber-600 dark:text-amber-500' : 'text-amber-500'}`}>{leader.total_points}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">نقطة</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* To-Do List */}
                        <div className="relative group/widget">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-transparent rounded-[2.5rem] blur-xl opacity-50 group-hover/widget:opacity-70 transition-all duration-700"></div>
                            <div className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden z-10">
                                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary-500 to-primary-400 z-20 opacity-80"></div>
                                <div className="absolute -left-20 -top-20 w-40 h-40 bg-primary-400/5 dark:bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-400/10 transition-colors"></div>
                                <div className="relative z-10 flex flex-col gap-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                            <div className="p-2.5 bg-primary-50 dark:bg-primary-500/10 text-primary-500 rounded-xl"><LayoutList size={20} /></div>
                                            مهامي السريعة
                                        </h2>
                                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-4 py-1.5 rounded-full border border-primary-100 dark:border-primary-800/50">{tasks.filter(t => t.completed).length} / {tasks.length} منجزة</span>
                                    </div>
                                    {tasks.length > 0 && (
                                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000 relative" style={{ width: `${Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%` }}>
                                                <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4zKSIvPjwvc3ZnPg==')] opacity-50"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="relative z-10 space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[350px]">
                                    {tasks.length === 0 && !isAddingTask && (
                                        <div className="flex flex-col items-center justify-center py-10 text-center">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3"><CheckSquare size={32} className="text-slate-300 dark:text-slate-600" /></div>
                                            <p className="text-slate-500 font-bold">لا توجد مهام حالياً</p>
                                            <p className="text-xs text-slate-400 mt-1">أضف مهامك اليومية لمتابعتها هنا</p>
                                        </div>
                                    )}
                                    {tasks.map(task => (
                                        <div key={task.id} onClick={() => toggleTask(task.id)} className={`group/task flex items-center justify-between gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-300 border relative overflow-hidden ${task.completed ? 'bg-slate-50/50 dark:bg-slate-900/20 border-transparent opacity-70 hover:opacity-100' : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700/50 hover:shadow-md hover:shadow-primary-500/5 hover:-translate-y-0.5'}`}>
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`shrink-0 transition-all duration-500 ${task.completed ? 'text-primary-500 scale-110' : 'text-slate-300 dark:text-slate-600 group-hover/task:text-primary-400'}`}>
                                                    {isProcessing === task.id ? <Loader2 size={22} className="animate-spin text-slate-400" /> : task.completed ? <CheckSquare size={22} className="drop-shadow-sm" /> : <Square size={22} />}
                                                </div>
                                                <p className={`text-sm font-semibold transition-all duration-500 ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600' : 'text-slate-700 dark:text-slate-200'}`}>{task.text}</p>
                                            </div>
                                            <button onClick={(e) => deleteTask(task.id, e)} className="opacity-0 group-hover/task:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"><Trash2 size={16} /></button>
                                            <div className={`absolute bottom-0 right-0 h-0.5 bg-primary-500 transition-all duration-500 ease-out ${task.completed ? 'left-0 opacity-100' : 'left-full opacity-0'}`} />
                                        </div>
                                    ))}
                                    <div className={`transition-all duration-300 overflow-hidden ${isAddingTask ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                        <div className="flex gap-2 items-center bg-white dark:bg-[#121820] p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
                                            <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') addTask(); if(e.key === 'Escape') setIsAddingTask(false); }} autoFocus={isAddingTask} disabled={isProcessing === 'new'} placeholder="اكتب المهمة واضغط Enter..." className="w-full text-sm bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 placeholder:text-slate-400" />
                                            <button onClick={addTask} disabled={isProcessing === 'new' || !newTaskText.trim()} className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500 dark:hover:text-white rounded-xl transition-colors disabled:opacity-50 shrink-0">
                                                {isProcessing === 'new' ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    {!isAddingTask && (
                                        <button onClick={() => setIsAddingTask(true)} className="w-full mt-2 py-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary-500 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2 group/add">
                                            <Plus size={18} className="transition-transform group-hover/add:scale-110 group-hover/add:rotate-90" />
                                            إضافة مهمة جديدة
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timetable */}
                        <div className="relative group/widget">
                            <div className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden z-10">
                                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary-500 to-primary-400 z-20 opacity-80"></div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/5 dark:bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-400/10 transition-colors"></div>
                                <h2 className="relative text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-8">
                                    <div className="p-2.5 bg-primary-50 dark:bg-primary-500/10 text-primary-500 rounded-xl"><Clock size={20} /></div>
                                    جدول الحصص اليوم
                                </h2>
                                <div className="relative border-r-2 border-slate-100 dark:border-slate-800/80 pr-6 space-y-8 min-h-[150px]">
                                    {todayTimetable && todayTimetable.length > 0 ? (
                                        todayTimetable.map((slot, index) => {
                                            const isActive = index === 1;
                                            const isPast = index < 1;
                                            const isFuture = index > 1;
                                            return (
                                                <div key={slot.id} className="relative group/item">
                                                    {isActive && (<>
                                                        <span className="absolute -right-[35px] top-1 flex h-4 w-4">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary-500 border-2 border-white dark:border-[#121820]"></span>
                                                        </span>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-xs font-black text-primary-600 dark:text-primary-400">{formatTimeAr(slot.period?.start_time)} - {formatTimeAr(slot.period?.end_time)}</p>
                                                            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[9px] font-black rounded-full uppercase tracking-wider animate-pulse">الآن</span>
                                                        </div>
                                                        <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-900/10 p-5 rounded-2xl border border-primary-200 dark:border-primary-800/50 shadow-lg shadow-primary-500/15 transition-transform group-hover/item:-translate-y-1">
                                                            <h4 className="font-black text-primary-800 dark:text-primary-300 text-base">{slot.period?.name || `الحصة ${slot.period_id}`} - {slot.subject?.name}</h4>
                                                            <div className="text-xs font-semibold text-primary-600/80 dark:text-primary-400/80 mt-1.5 flex items-center gap-3">
                                                                <span className="flex items-center gap-1"><Users size={12} /> {slot.division?.grade?.name} - {slot.division?.section?.name}</span>
                                                                {slot.division?.room_number && <span className="flex items-center gap-1"><MapPin size={12} /> قاعة {slot.division?.room_number}</span>}
                                                            </div>
                                                        </div>
                                                    </>)}
                                                    {isPast && (<>
                                                        <div className="absolute -right-[33px] top-1.5 w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-full ring-4 ring-white dark:ring-[#121820]"></div>
                                                        <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-2"><CheckCircle size={12} className="text-slate-400" />{formatTimeAr(slot.period?.start_time)} - {formatTimeAr(slot.period?.end_time)}</p>
                                                        <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 opacity-70">
                                                            <h4 className="font-bold text-slate-600 dark:text-slate-400 text-sm line-through decoration-slate-300">{slot.period?.name || `الحصة ${slot.period_id}`} - {slot.subject?.name}</h4>
                                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3"><span className="flex items-center gap-1"><Users size={12} /> {slot.division?.grade?.name} - {slot.division?.section?.name}</span></div>
                                                        </div>
                                                    </>)}
                                                    {isFuture && (<>
                                                        <div className="absolute -right-[33px] top-1.5 w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-full ring-4 ring-white dark:ring-[#121820]"></div>
                                                        <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-2"><Clock size={12} className="text-slate-400" />{formatTimeAr(slot.period?.start_time)} - {formatTimeAr(slot.period?.end_time)}</p>
                                                        <div className="bg-white dark:bg-[#121820] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md group-hover/item:border-slate-200 dark:group-hover/item:border-slate-700">
                                                            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">{slot.period?.name || `الحصة ${slot.period_id}`} - {slot.subject?.name}</h4>
                                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                                                <span className="flex items-center gap-1"><Users size={12} /> {slot.division?.grade?.name} - {slot.division?.section?.name}</span>
                                                                {slot.division?.room_number && <span className="flex items-center gap-1"><MapPin size={12} /> قاعة {slot.division?.room_number}</span>}
                                                            </div>
                                                        </div>
                                                    </>)}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-center opacity-70">
                                            <Clock size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                                            <p className="text-sm font-bold text-slate-500">ليس لديك أي حصص مجدولة لهذا اليوم</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Meetings */}
                        <div className="relative group/widget">
                            <div className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden z-10">
                                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-400 z-20 opacity-80"></div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 dark:bg-amber-500/5 rounded-full blur-2xl"></div>
                                <div className="relative z-10 flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                        <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl"><Users size={20} /></div>
                                        الاجتماعات القادمة
                                    </h2>
                                    <Link href={route('meetings.index')} className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors bg-primary-50 hover:bg-primary-100 dark:bg-primary-500/10 px-4 py-1.5 rounded-xl border border-primary-100 dark:border-primary-800/50">الكل</Link>
                                </div>
                                <div className="space-y-3">
                                    {upcomingMeetings && upcomingMeetings.length > 0 ? (
                                        upcomingMeetings.map(meeting => (
                                            <Link key={meeting.id} href={route('meetings.show', meeting.id)} className="block bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide ${meeting.type === 'online' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>{meeting.type === 'online' ? 'عن بعد' : 'حضوري'}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{formatDateAr(meeting.date)}</span>
                                                </div>
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{meeting.title}</h4>
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><Clock size={12} className="text-slate-400" /> {formatTimeAr(meeting.time)}</div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-center opacity-70">
                                            <Users size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                                            <p className="text-sm font-bold text-slate-500">لا توجد اجتماعات قادمة</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
