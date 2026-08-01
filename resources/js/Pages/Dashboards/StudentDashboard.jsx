import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import NewsWidget from '@/Components/NewsWidget';
import { 
    Calendar, Clock, BookOpen, Star, AlertCircle, 
    Trophy, GraduationCap, MapPin, ChevronLeft, Sun, Moon,
    Award, Book, FileText, PlayCircle, File, Download
} from 'lucide-react';
import ChildSelector from '@/Components/ChildSelector';

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

export default function StudentDashboard({ auth, todayTimetable = [], currentEnrollment, stats, achievements = [], latestNews = [], upcomingExams = [], libraryItems = [], children, activeChildId }) {
    const [greeting, setGreeting] = useState({ text: 'مرحباً', icon: Sun, color: 'text-amber-500' });
    
    // Ensure arrays
    const safeUpcomingExams = Array.isArray(upcomingExams) ? upcomingExams : Object.values(upcomingExams || {});
    const safeLibraryItems = Array.isArray(libraryItems) ? libraryItems : Object.values(libraryItems || {});
    const safeTimetable = Array.isArray(todayTimetable) ? todayTimetable : Object.values(todayTimetable || {});

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

    return (
        <AdminLayout user={auth.user} activeMenu="الرئيسية">
            <Head title="لوحة الطالب" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">
                <ChildSelector children={children} activeChildId={activeChildId} />
                
                {/* Header Widget */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/90 via-white to-white dark:from-[#1e293b] dark:via-[#121820] dark:to-[#121820] border border-primary-100 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 mb-4">
                                {greeting.text}، {auth.user.name.split(' ')[0]} <greeting.icon className={`animate-pulse-slow ${greeting.color}`} size={36} />
                            </h1>
                            {currentEnrollment ? (
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium bg-white/60 dark:bg-slate-900/60 backdrop-blur border border-white/40 dark:border-slate-700 w-max px-4 py-2 rounded-2xl">
                                    <GraduationCap size={20} className="text-primary-500" />
                                    <span>{currentEnrollment.division?.grade?.section?.name} - {currentEnrollment.division?.grade?.name} - شعبه {currentEnrollment.division?.name}</span>
                                </div>
                            ) : (
                                <div className="text-amber-600 font-medium flex items-center gap-2">
                                    <AlertCircle size={20} />
                                    غير مسجل في شعبة حالياً
                                </div>
                            )}
                        </div>
                        <div className="shrink-0 flex gap-4 md:gap-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-[2.5rem] border border-white/50 dark:border-slate-700/50">
                            <CircularProgress 
                                value={stats?.totalPoints || 0} 
                                max={500} 
                                colorClass="text-yellow-500" 
                                label="نقطة تميز" 
                                icon={Trophy} 
                            />
                            <CircularProgress 
                                value={100 - ((stats?.absentDays || 0) * 2)} 
                                max={100} 
                                colorClass={stats?.absentDays > 5 ? "text-rose-500" : "text-emerald-500"} 
                                label="نسبة الحضور" 
                            />
                        </div>
                    </div>
                </div>

                {/* Quick Actions Glassmorphic Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href={route('student.grades')} className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-4 flex items-center gap-4 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">درجاتي</h3>
                            <p className="text-xs text-slate-500">سجل الدرجات</p>
                        </div>
                    </Link>
                    <Link href={route('student.library')} className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-4 flex items-center gap-4 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">المكتبة</h3>
                            <p className="text-xs text-slate-500">موارد رقمية</p>
                        </div>
                    </Link>
                    <Link href={route('student.timetable')} className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-4 flex items-center gap-4 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">الاختبارات</h3>
                            <p className="text-xs text-slate-500">الجدول الدراسي</p>
                        </div>
                    </Link>
                    <Link href={route('student.discipline')} className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-4 flex items-center gap-4 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">الانضباط</h3>
                            <p className="text-xs text-slate-500">سجل المخالفات</p>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Content - Left/Middle (Takes 2 Cols) */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Today's Timetable */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-6 px-2">
                                <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                        <Calendar size={24} />
                                    </div>
                                    حصص اليوم
                                </h2>
                                <Link href={route('student.timetable')} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                                    الجدول الكامل <ChevronLeft size={16} />
                                </Link>
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
                                        <p className="text-slate-500 font-medium">لا توجد حصص مجدولة لك اليوم</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Deadlines & Tasks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white mb-6">
                                    <div className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                                        <AlertCircle size={20} />
                                    </div>
                                    المواعيد والاختبارات القادمة
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
                            
                            {/* Recommended Library */}
                            <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                            <Book size={20} />
                                        </div>
                                        جديد المكتبة
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    {safeLibraryItems && safeLibraryItems.length > 0 ? (
                                        safeLibraryItems.slice(0, 3).map(item => (
                                            <Link href={route('student.library')} key={item.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                    {item.type === 'video' ? <PlayCircle size={20} /> : <File size={20} />}
                                                </div>
                                                <div className="flex-grow overflow-hidden">
                                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{item.title}</h4>
                                                    <p className="text-xs text-slate-500">{item.subject?.name}</p>
                                                </div>
                                                <ChevronLeft size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:-translate-x-1" />
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            لا توجد إضافات جديدة
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Sidebar / Right (Takes 1 Col) */}
                    <div className="space-y-8">
                        
                        {/* Achievements Widget */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-6 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                                    <Award size={24} />
                                    أحدث الأوسمة
                                </h2>
                                
                                <div className="space-y-4">
                                    {achievements && achievements.length > 0 ? (
                                        achievements.map((ach) => (
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
                                            <p className="text-sm">لم تحصل على أوسمة بعد، استمر في التميز!</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/20 text-center">
                                    <Link href={route('student.records')} className="text-sm font-bold text-white hover:text-yellow-300 flex justify-center items-center gap-1 transition-colors">
                                        سجل الإنجازات <ChevronLeft size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* News */}
                        {latestNews && latestNews.length > 0 && (
                            <NewsWidget news={latestNews} />
                        )}

                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
