import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import NewsWidget from '@/Components/NewsWidget';
import { 
    Calendar, Clock, BookOpen, Star, AlertCircle, 
    Trophy, GraduationCap, MapPin, ChevronLeft, Sun, Moon,
    Award, Book, FileText, PlayCircle, File, Download, User, Users
} from 'lucide-react';

const CircularProgress = ({ value, max = 100, colorClass = "text-primary-500", label = "", icon: Icon }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const circleRadius = 36;
    const circleCircumference = 2 * Math.PI * circleRadius;
    const strokeDashoffset = circleCircumference - (percentage / 100) * circleCircumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center w-24 h-24">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={circleRadius} stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-100/50 dark:text-slate-800/50" />
                    <circle cx="50" cy="50" r={circleRadius} stroke="currentColor" strokeWidth="8" fill="none" 
                        strokeDasharray={circleCircumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
                        className={`${colorClass} transition-all duration-1000 ease-out drop-shadow-md`} />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    {Icon ? <Icon className={`mb-1 ${colorClass}`} size={20} /> : null}
                    <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{value}</span>
                </div>
            </div>
            {label && <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>}
        </div>
    );
};

export default function ParentDashboard({ auth, children = [], activeChild, todayTimetable = [], stats, upcomingExams = [], latestNews = [] }) {
    const [greeting, setGreeting] = useState({ text: 'مرحباً', icon: Sun, color: 'text-amber-500' });
    
    // Ensure arrays
    const safeUpcomingExams = Array.isArray(upcomingExams) ? upcomingExams : Object.values(upcomingExams || {});
    const safeTimetable = Array.isArray(todayTimetable) ? todayTimetable : Object.values(todayTimetable || {});
    const safeChildren = Array.isArray(children) ? children : Object.values(children || {});
    const safeAchievements = activeChild?.achievements ? (Array.isArray(activeChild.achievements) ? activeChild.achievements : Object.values(activeChild.achievements)) : [];

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting({ text: 'صباح الخير', icon: Sun, color: 'text-amber-500' });
        else if (hour >= 12 && hour < 17) setGreeting({ text: 'مساء الخير', icon: Sun, color: 'text-orange-500' });
        else setGreeting({ text: 'مساء الخير', icon: Moon, color: 'text-indigo-400' });
    }, []);

    const formatTimeAr = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const isCurrentClass = (start, end) => {
        if (!start || !end) return false;
        const now = new Date();
        const [sh, sm] = start.split(':');
        const [eh, em] = end.split(':');
        const startTime = new Date(); startTime.setHours(sh, sm, 0);
        const endTime = new Date(); endTime.setHours(eh, em, 0);
        return now >= startTime && now <= endTime;
    };

    const handleChildSelect = (childId) => {
        router.get(route('parent.dashboard'), { child_id: childId }, { preserveState: true, replace: true, preserveScroll: true });
    };

    return (
        <AdminLayout user={auth.user} activeMenu="بوابة ولي الأمر">
            <Head title="بوابة ولي الأمر" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">
                
                {/* Header Widget */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/90 via-white to-white dark:from-[#1e293b] dark:via-[#121820] dark:to-[#121820] border border-primary-100 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 mb-4">
                                {greeting.text}، {auth.user.name.split(' ')[0]} <greeting.icon className={`animate-pulse-slow ${greeting.color}`} size={36} />
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 font-medium max-w-lg">
                                أهلاً بك في بوابة ولي الأمر. يمكنك من هنا متابعة الحضور، الدرجات، والمستوى الأكاديمي لأبنائك بشكل مباشر.
                            </p>
                        </div>
                    </div>
                </div>

                {safeChildren.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                        <Users size={64} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">لا يوجد أبناء مسجلين</h2>
                        <p className="text-slate-500">لم يتم ربط حسابك بأي طلاب حتى الآن. يرجى مراجعة إدارة المدرسة.</p>
                    </div>
                ) : (
                    <>
                        {/* Children Selector */}
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="text-primary-500" size={20} /> أبنائي
                            </h2>
                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                                {safeChildren.map((child) => {
                                    const isActive = activeChild?.id === child.id;
                                    return (
                                        <button 
                                            key={child.id}
                                            onClick={() => handleChildSelect(child.id)}
                                            className={`snap-center shrink-0 flex items-center gap-4 p-4 rounded-3xl border transition-all min-w-[280px] ${
                                                isActive 
                                                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/30 ring-4 ring-primary-500/20 transform -translate-y-1' 
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-300 hover:shadow-md'
                                            }`}
                                        >
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                                                isActive ? 'bg-primary-500 border-white/20' : 'bg-slate-100 dark:bg-slate-700 border-transparent text-slate-400'
                                            }`}>
                                                {child.user?.avatar ? (
                                                    <img src={child.user.avatar} alt={child.user?.name} className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <User size={24} className={isActive ? 'text-white' : 'text-slate-400'} />
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                                    {child.user?.name || 'طالب'}
                                                </h3>
                                                <p className={`text-xs mt-1 ${isActive ? 'text-primary-100' : 'text-slate-500'}`}>
                                                    {child.currentEnrollment?.division?.grade?.name} - {child.currentEnrollment?.division?.name}
                                                </p>
                                            </div>
                                            {isActive && (
                                                <div className="absolute top-4 left-4 w-3 h-3 bg-white rounded-full shadow-sm animate-pulse"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {activeChild && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                                
                                {/* Main Content - Left/Middle (Takes 2 Cols) */}
                                <div className="lg:col-span-2 space-y-8">
                                    
                                    {/* Quick Summary Widget */}
                                    <div className="flex gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/50 dark:border-slate-700/50 overflow-x-auto">
                                        <CircularProgress 
                                            value={stats?.totalPoints || 0} 
                                            max={500} 
                                            colorClass="text-yellow-500" 
                                            label="نقطة تميز" 
                                            icon={Trophy} 
                                        />
                                        <div className="w-px bg-slate-200 dark:bg-slate-800 mx-2 shrink-0"></div>
                                        <CircularProgress 
                                            value={100 - ((stats?.absentDays || 0) * 2)} 
                                            max={100} 
                                            colorClass={stats?.absentDays > 5 ? "text-rose-500" : "text-emerald-500"} 
                                            label="نسبة الحضور" 
                                        />
                                        <div className="w-px bg-slate-200 dark:bg-slate-800 mx-2 shrink-0"></div>
                                        <CircularProgress 
                                            value={stats?.absentDays || 0} 
                                            max={20} 
                                            colorClass="text-rose-500" 
                                            label="أيام الغياب" 
                                            icon={AlertCircle} 
                                        />
                                    </div>

                                    {/* Today's Timetable */}
                                    <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-center mb-6 px-2">
                                            <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                                    <Calendar size={24} />
                                                </div>
                                                حصص اليوم
                                            </h2>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {safeTimetable && safeTimetable.length > 0 ? (
                                                safeTimetable.map((item, index) => {
                                                    const isLive = isCurrentClass(item.period?.start_time, item.period?.end_time);
                                                    return (
                                                    <div key={item.id} className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all relative overflow-hidden ${
                                                        isLive 
                                                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 shadow-md ring-2 ring-primary-500/20' 
                                                            : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:border-primary-200 dark:hover:border-primary-900 hover:shadow-md'
                                                    }`}>
                                                        <div className={`absolute right-0 top-0 bottom-0 w-1.5 transition-colors ${isLive ? 'bg-primary-500 animate-pulse' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-primary-400'}`}></div>
                                                        
                                                        <div className={`flex-shrink-0 w-16 h-16 rounded-xl shadow-sm border flex flex-col items-center justify-center relative ${
                                                            isLive ? 'bg-primary-500 text-white border-primary-600' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-primary-600'
                                                        }`}>
                                                            {isLive && (
                                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                                                </span>
                                                            )}
                                                            <span className={`text-xs font-bold ${isLive ? 'text-primary-100' : 'text-slate-400'}`}>الحصة</span>
                                                            <span className="text-xl font-black">{item.period?.name?.replace(/[^0-9]/g, '') || index + 1}</span>
                                                        </div>
                                                        
                                                        <div className="flex-grow">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h3 className={`font-bold text-lg ${isLive ? 'text-primary-900 dark:text-primary-100' : 'text-slate-800 dark:text-white'}`}>{item.subject?.name}</h3>
                                                                {isLive && <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse"><Clock size={12}/> الآن</span>}
                                                            </div>
                                                            <div className={`flex items-center gap-4 text-sm ${isLive ? 'text-primary-700 dark:text-primary-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                <span className="flex items-center gap-1"><Clock size={14} /> {formatTimeAr(item.period?.start_time)} - {formatTimeAr(item.period?.end_time)}</span>
                                                                <span className="flex items-center gap-1"><MapPin size={14} /> أ. {item.teacher?.name}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )})
                                            ) : (
                                                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                                                        <Calendar size={32} />
                                                    </div>
                                                    <p className="text-slate-500 font-medium">لا توجد حصص مجدولة للابن اليوم</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Sidebar / Right (Takes 1 Col) */}
                                <div className="space-y-8">

                                    {/* Upcoming Deadlines & Tasks */}
                                    <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white mb-6">
                                            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                                                <AlertCircle size={20} />
                                            </div>
                                            مواعيد واختبارات قادمة
                                        </h2>
                                        <div className="space-y-4">
                                            {safeUpcomingExams && safeUpcomingExams.length > 0 ? (
                                                safeUpcomingExams.map(exam => {
                                                    const daysLeft = Math.max(0, Math.ceil((new Date(exam.exam_date) - new Date()) / (1000 * 60 * 60 * 24)));
                                                    return (
                                                        <div key={exam.id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-rose-200 transition-colors">
                                                            <div className="w-12 h-12 shrink-0 rounded-xl bg-white dark:bg-slate-700 flex flex-col items-center justify-center text-rose-500 shadow-sm border border-slate-100 dark:border-slate-600">
                                                                <span className="text-sm font-black">{new Date(exam.exam_date).getDate()}</span>
                                                                <span className="text-[10px] font-bold uppercase">{new Date(exam.exam_date).toLocaleString('ar-EG', { month: 'short' })}</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-800 dark:text-white">{exam.subject?.name}</h4>
                                                                <p className="text-sm text-slate-500 mb-2">{exam.schedule?.title}</p>
                                                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-100/50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                                                                    <Clock size={12} /> {daysLeft === 0 ? 'اليوم' : `باقي ${daysLeft} أيام`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <div className="text-center py-8 text-slate-500">
                                                    لا توجد اختبارات قريبة
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Achievements Widget */}
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-6 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                        <div className="relative z-10">
                                            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                                                <Award size={24} />
                                                أوسمة وتميز الابن
                                            </h2>
                                            
                                            <div className="space-y-4">
                                                {safeAchievements && safeAchievements.length > 0 ? (
                                                    safeAchievements.slice(0, 3).map((ach) => (
                                                        <div key={ach.id} className="bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center gap-4 border border-white/10">
                                                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                                                <Star className="text-yellow-300" size={24} fill="currentColor" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold">{ach.achievementType?.name || 'وسام التميز'}</h4>
                                                                <p className="text-xs text-indigo-100 mt-1">{ach.points} نقطة</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-6 text-indigo-100">
                                                        <Award size={32} className="mx-auto opacity-50 mb-2" />
                                                        <p className="text-sm">لم يحصل الابن على أوسمة بعد.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* News */}
                                    {latestNews && latestNews.length > 0 && (
                                        <NewsWidget news={latestNews} />
                                    )}

                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
