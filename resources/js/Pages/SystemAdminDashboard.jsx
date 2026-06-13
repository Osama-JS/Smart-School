import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { 
    Users, Store, Calendar, Activity, Clock, ShieldAlert, AlertCircle, Building2, UserCog, Database
} from 'lucide-react';

export default function SystemAdminDashboard({ stats, recentActivities }) {
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

    const [activityFilter, setActivityFilter] = useState('all');

    const statCards = [
        { 
            title: 'إجمالي الفروع', value: stats?.branches || '0', 
            icon: Store, color: 'primary',
            iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400',
            glowBg: 'bg-primary-500/5',
            hoverBorder: 'hover:border-primary-200 dark:hover:border-primary-800/30',
            topLineHover: 'group-hover:bg-primary-500/20',
            ringColor: 'border-primary-500/20'
        },
        { 
            title: 'الفروع النشطة', value: stats?.active_branches || '0', 
            icon: Building2, color: 'emerald',
            iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
            glowBg: 'bg-emerald-500/5',
            hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800/30',
            topLineHover: 'group-hover:bg-emerald-500/20',
            ringColor: 'border-emerald-500/20'
        },
        { 
            title: 'مدراء الفروع', value: stats?.managers || '0', 
            icon: UserCog, color: 'accent',
            iconBg: 'bg-accent-50 text-accent-600 dark:bg-accent-950/20 dark:text-accent-400',
            glowBg: 'bg-accent-500/5',
            hoverBorder: 'hover:border-accent-200 dark:hover:border-accent-800/30',
            topLineHover: 'group-hover:bg-accent-500/20',
            ringColor: 'border-accent-500/20'
        },
        { 
            title: 'إجمالي المستخدمين', value: stats?.users || '0', 
            icon: Users, color: 'dark',
            iconBg: 'bg-dark-100 text-dark-700 dark:bg-dark-900/40 dark:text-dark-300',
            glowBg: 'bg-dark-500/5',
            hoverBorder: 'hover:border-dark-300 dark:hover:border-dark-800/30',
            topLineHover: 'group-hover:bg-dark-500/20',
            ringColor: 'border-dark-500/20'
        },
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
            <Head title="لوحة التحكم | مدير النظام" />

            <div className="space-y-8 animate-fade-in">
                
                {/* Premium Welcome Header */}
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
                            <img src={logo_url || '/images/logo.png'} alt="شعار النظام" 
                                className="h-16 w-16 rounded-2xl object-contain bg-white p-2 shadow-md shrink-0 border border-slate-100/10" />
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-805 dark:text-white tracking-tight flex items-center gap-2">
                                    <span>مرحباً، {auth?.user?.name || 'مدير النظام'}</span>
                                    <span className="animate-bounce">👑</span>
                                </h1>
                                <p className="text-primary-705/80 dark:text-primary-300/80 mt-1.5 text-xs sm:text-sm font-semibold">إليك نظرة عامة على حالة النظام والفروع المسجلة</p>
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

                {/* Refined Stats Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => (
                        <div key={index} className={`bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-none hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden group cursor-default bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:16px_16px] ${stat.hoverBorder}`}>
                            <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                            <div className={`absolute top-0 right-0 left-0 h-1 bg-transparent ${stat.topLineHover} transition-colors`} />

                            <div className="relative z-10 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{stat.title}</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 leading-none font-mono tracking-tight">{stat.value}</h3>
                                </div>
                                <div className={`relative h-12 w-12 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 transition-all duration-350 group-hover:scale-110 group-hover:-rotate-3`}>
                                    <span className={`absolute inset-0 rounded-2xl border ${stat.ringColor} scale-100 group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                                    <stat.icon size={22} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* System Alerts and Quick Info */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5 bg-[radial-gradient(#f8fafc_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                            <div className="flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={18} className="text-primary-500" />
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base">حالة النظام العامة</h3>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3.5 p-3.5 bg-emerald-50/40 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                    <Database size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-400">قاعدة البيانات متصلة</p>
                                        <p className="text-[10px] text-emerald-600/90 dark:text-emerald-500/80 mt-1 font-semibold">استجابة سريعة للنظام</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3.5 p-3.5 bg-primary-50/40 dark:bg-primary-500/10 rounded-2xl border border-primary-100 dark:border-primary-500/20">
                                    <AlertCircle size={16} className="text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-primary-800 dark:text-primary-400">لا توجد أخطاء حيوية</p>
                                        <p className="text-[10px] text-primary-600/90 dark:text-primary-500/80 mt-1 font-semibold">النظام يعمل بكفاءة</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100/80 dark:border-slate-800/60 pb-4">
                                <div className="flex items-center gap-2">
                                    <Activity size={18} className="text-primary-500" />
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base">نشاط النظام الشامل</h3>
                                </div>

                                <div className="relative flex items-center gap-1 bg-slate-50 dark:bg-slate-950/80 p-1 border border-slate-100 dark:border-slate-800/80 rounded-2xl w-fit select-none font-sans">
                                    {[
                                        { key: 'all', label: 'الكل' },
                                        { key: 'success', label: 'نجاح' },
                                        { key: 'info', label: 'تغييرات' },
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
                            
                            <div className="p-2 relative min-h-[150px]">
                                <div className="absolute right-9 top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800/60" />
                                
                                {filteredActivities.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                                        <Clock size={32} className="mx-auto mb-2 opacity-30 animate-pulse" />
                                        <p className="font-bold">لا توجد نشاطات مسجلة مؤخراً</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {filteredActivities.map((activity, index) => (
                                            <div key={index} className="relative pl-2 pr-10 group animate-fade-in">
                                                <div className={`absolute right-[30px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-10 transition-transform duration-300 group-hover:scale-125 ${getActivityColor(activity.type)}`} />
                                                
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
