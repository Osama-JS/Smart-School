import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Calendar, Clock, Users, BookOpen, 
    CheckCircle, XCircle, AlertCircle, MapPin,
    Sun, Moon, Quote, ChevronRight, ChevronLeft,
    CheckSquare, Square, FileText, ClipboardList, TrendingUp,
    Megaphone, Trophy, Star, BellRing, ArrowUpRight
} from 'lucide-react';

export default function TeacherDashboard({ auth, todayTimetable, attendanceStatus, upcomingMeetings, stats, leaderboard }) {
    // 1. Dynamic Greeting
    const [greeting, setGreeting] = useState({ text: 'مرحباً', icon: Sun, color: 'text-amber-500' });
    const quotes = [
        "التعليم هو السلاح الأقوى الذي يمكنك استخدامه لتغيير العالم.",
        "المعلم الناجح هو أهم عمود في بناء الجيل القادم.",
        "لا حدود لما يمكن أن تنجزه عندما تتعاون مع طلابك."
    ];
    const randomQuote = quotes[auth.user.id % quotes.length];

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting({ text: 'صباح الخير', icon: Sun, color: 'text-amber-500' });
        else if (hour >= 12 && hour < 17) setGreeting({ text: 'مساء الخير', icon: Sun, color: 'text-orange-500' });
        else setGreeting({ text: 'مساء الخير', icon: Moon, color: 'text-indigo-400' });
    }, []);

    // 2. To-Do List State
    const [tasks, setTasks] = useState([
        { id: 1, text: 'تصحيح أوراق اختبار الرياضيات للصف الأول', completed: false },
        { id: 2, text: 'تحضير عرض الباوربوينت لدرس الغد', completed: true },
        { id: 3, text: 'رفع درجات المشاركة على النظام', completed: false },
    ]);
    const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

    // 3. Announcements Carousel State
    const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
    const announcements = [
        { id: 1, title: 'موعد تسليم الدرجات النهائية', tag: 'عاجل', color: 'bg-red-50 text-red-600', date: 'اليوم' },
        { id: 2, title: 'دورة تدريبية للمعلمين في استخدام التقنية', tag: 'تطوير', color: 'bg-emerald-50 text-emerald-600', date: 'غداً' },
        { id: 3, title: 'تغيير في جدول الحصص للأسبوع القادم', tag: 'عام', color: 'bg-blue-50 text-blue-600', date: 'الخميس' }
    ];
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentAnnouncement(prev => (prev + 1) % announcements.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [announcements.length]);

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
            <Head title="لوحة تحكم المعلم" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">
                
                {/* Proposal 2: Next Class Alert */}
                {todayTimetable && todayTimetable.length > 0 && (
                    <div className="bg-gradient-to-l from-primary-600 to-primary-800 rounded-3xl p-4 shadow-lg shadow-primary-500/20 text-white flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
                        <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="bg-white/20 p-3 rounded-2xl animate-bounce-slow">
                                <BellRing size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">تنبيه الحصة القادمة</h3>
                                <p className="text-primary-100 text-sm">تبدأ حصة (الرياضيات - الصف الأول) بعد <span className="font-black text-white">15 دقيقة</span> في قاعة 3.</p>
                            </div>
                        </div>
                        <Link href="#" className="shrink-0 bg-white text-primary-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors shadow-sm relative z-10">
                            تحضير الدرس
                        </Link>
                    </div>
                )}

                {/* Header & Quick Actions */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/90 via-white to-white dark:from-[#1e293b] dark:via-[#121820] dark:to-[#121820] border border-primary-100 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 mb-4">
                                {greeting.text}، أستاذ {auth.user.name.split(' ')[0]} <greeting.icon className={`animate-pulse-slow ${greeting.color}`} size={36} />
                            </h1>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium bg-white/60 dark:bg-slate-900/60 backdrop-blur border border-white/40 dark:border-slate-700 w-max px-4 py-2 rounded-2xl">
                                <Quote size={16} className="text-primary-500" />
                                <span>{randomQuote}</span>
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 px-6 py-4 rounded-3xl shadow-sm">
                            <div className="text-center">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">{new Date().toLocaleDateString('ar-EG', { weekday: 'long' })}</p>
                                <p className="text-2xl font-black text-primary-600 dark:text-primary-400 tracking-tight">{new Date().getDate()}</p>
                            </div>
                            <div className="w-[1px] h-10 bg-slate-200 dark:bg-slate-700"></div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">{new Date().toLocaleDateString('ar-EG', { month: 'short' })}</p>
                                <p className="text-xl font-bold text-slate-600 dark:text-slate-300">{new Date().getFullYear()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Proposal 1: Quick Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-200/60 dark:border-slate-700/50">
                        <Link href="#" className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle size={24} /></div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">تحضير الطلاب</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-blue-100/50 dark:bg-blue-500/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">رصد الدرجات</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100/50 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform"><ClipboardList size={24} /></div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">إضافة واجب</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-slate-100 dark:border-slate-800 hover:border-amber-200 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-amber-100/50 dark:bg-amber-500/20 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Users size={24} /></div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400">طلب زيارة صفية</span>
                        </Link>
                    </div>
                </div>

                {/* Proposal 3: Stats & Academic Insights */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm flex items-center gap-5 transition-all hover:shadow-md group">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform ${
                            attendanceStatus?.status === 'present' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        }`}>
                            <CheckCircle size={32} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">حضورك اليوم</p>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                {attendanceStatus?.status === 'present' ? 'حاضر' : 'لم يُسجل بعد'}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm flex items-center gap-5 transition-all hover:shadow-md group">
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform border border-blue-100 dark:border-blue-500/20">
                            <Users size={32} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">الطلاب</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">142 <span className="text-sm font-bold text-slate-400">طالب</span></h3>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm flex items-center gap-5 transition-all hover:shadow-md group">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform border border-indigo-100 dark:border-indigo-500/20">
                            <BookOpen size={32} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">المقررات</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{stats.subjects} <span className="text-sm font-bold text-slate-400">مقرر</span></h3>
                        </div>
                    </div>

                    {/* Academic Insight Widget */}
                    <div className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/50 group">
                        <div className="relative w-16 h-16 shrink-0">
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-slate-100 dark:text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="text-emerald-500 transition-all duration-1000 ease-out" strokeDasharray="88, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-sm font-black text-slate-700 dark:text-slate-300">88%</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">متوسط النجاح</p>
                            <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-sm">
                                <TrendingUp size={16} />
                                <span>أداء ممتاز هذا الشهر</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Schedule & Top Students (Takes 7 columns) */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Timeline */}
                        <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 left-0 h-1 bg-primary-500" />
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-primary-50 dark:bg-primary-500/10 text-primary-500 rounded-2xl">
                                    <Clock size={24} />
                                </div>
                                جدول الحصص اليوم
                            </h2>
                            
                            <div className="relative">
                                {todayTimetable && todayTimetable.length > 0 ? (
                                    <div className="border-r-2 border-slate-100 dark:border-slate-800 pr-6 space-y-6">
                                        {todayTimetable.map((slot, index) => {
                                            const isActive = index === 1; // Mocking current active class
                                            return (
                                                <div key={slot.id} className="relative group">
                                                    <div className={`absolute -right-[33px] top-1.5 w-3 h-3 rounded-full transition-all ${isActive ? 'bg-primary-500 scale-125 ring-4 ring-primary-50 dark:ring-primary-900/30' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-primary-300'}`}></div>
                                                    <p className={`text-xs font-bold mb-1.5 ${isActive ? 'text-primary-500' : 'text-slate-400'}`}>
                                                        {formatTimeAr(slot.period?.start_time)} - {formatTimeAr(slot.period?.end_time)} {isActive && '(الآن)'}
                                                    </p>
                                                    <div className={`p-5 rounded-2xl border transition-all ${isActive ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 shadow-sm shadow-primary-500/5 translate-x-1' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'}`}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className={`font-bold text-base mb-1 ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                    {slot.period?.name || `الحصة ${slot.period_id}`} - {slot.subject?.name}
                                                                </h4>
                                                                <div className={`text-xs font-semibold flex items-center gap-3 ${isActive ? 'text-primary-600/80 dark:text-primary-400/80' : 'text-slate-500'}`}>
                                                                    <span className="flex items-center gap-1"><Users size={12} /> {slot.division?.grade?.name} - {slot.division?.section?.name}</span>
                                                                    {slot.division?.room_number && (
                                                                        <span className="flex items-center gap-1"><MapPin size={12} /> قاعة {slot.division?.room_number}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-white/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                                            <Calendar size={32} />
                                        </div>
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">يومك فارغ!</h4>
                                        <p className="text-slate-500 text-sm font-medium">ليس لديك أي حصص مجدولة لهذا اليوم.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Proposal 6: Top Students Widget */}
                        <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Trophy className="text-amber-500" size={20} /> نجوم الأسبوع (طلابك)
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { name: 'أحمد محمد', grade: 'الابتدائية', score: 99, color: 'bg-amber-50 text-amber-600 border-amber-200' },
                                    { name: 'عمر خالد', grade: 'الابتدائية', score: 97, color: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300' },
                                    { name: 'ياسر علي', grade: 'الابتدائية', score: 95, color: 'bg-orange-50 text-orange-600 border-orange-200' }
                                ].map((student, idx) => (
                                    <div key={idx} className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${student.color} dark:border-opacity-10`}>
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm mb-3">
                                                <span className="font-black text-lg">{idx+1}</span>
                                            </div>
                                            {idx === 0 && <Star size={16} className="absolute -top-1 -right-1 text-amber-500 fill-amber-500" />}
                                        </div>
                                        <h4 className="font-bold text-sm mb-1">{student.name}</h4>
                                        <span className="text-xs opacity-80">{student.score} نقطة تميز</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Leaderboard Widget */}
                        {leaderboard && leaderboard.length > 0 && (
                            <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl">
                                            <Trophy size={20} />
                                        </div>
                                        لوحة المتصدرين للمعلمين
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    {leaderboard.map((leader, index) => (
                                        <div key={leader.user_id} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    {index + 1}
                                                </div>
                                                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{leader.user?.name}</p>
                                            </div>
                                            <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg text-sm">{leader.total_points} نقطة</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Carousel, ToDo, Meetings (Takes 5 columns) */}
                    <div className="lg:col-span-5 space-y-8">
                        
                        {/* Proposal 5: Announcements Carousel */}
                        <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm overflow-hidden relative group">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Megaphone size={18} className="text-primary-500" /> التعاميم الحديثة
                                </h3>
                                <div className="flex items-center gap-1">
                                    {announcements.map((_, idx) => (
                                        <button key={idx} onClick={() => setCurrentAnnouncement(idx)} className={`w-2 h-2 rounded-full transition-all ${currentAnnouncement === idx ? 'bg-primary-500 w-4' : 'bg-slate-200 dark:bg-slate-700'}`}></button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative min-h-[100px]">
                                {announcements.map((ann, idx) => (
                                    <div key={ann.id} className={`absolute inset-0 transition-all duration-500 ease-in-out ${currentAnnouncement === idx ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
                                        <div className="flex gap-2 items-center mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${ann.color}`}>{ann.tag}</span>
                                            <span className="text-xs text-slate-400">{ann.date}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-base leading-snug">{ann.title}</h4>
                                        <Link href="#" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">
                                            قراءة التفاصيل <ChevronLeft size={14} />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Proposal 4: To-Do List */}
                        <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl">
                                        <CheckSquare size={20} />
                                    </div>
                                    مهامي السريعة
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {tasks.map(task => (
                                    <div key={task.id} onClick={() => toggleTask(task.id)} className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${task.completed ? 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-60' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:shadow-sm'}`}>
                                        <div className={`mt-0.5 shrink-0 transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                            {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </div>
                                        <p className={`text-sm font-semibold transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {task.text}
                                        </p>
                                    </div>
                                ))}
                                <button className="w-full mt-2 py-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary-500 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-sm font-bold flex items-center justify-center gap-2">
                                    إضافة مهمة جديدة
                                </button>
                            </div>
                        </div>

                        {/* Meetings */}
                        <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl">
                                        <Users size={20} />
                                    </div>
                                    الاجتماعات
                                </h2>
                                <Link href={route('meetings.index')} className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors bg-primary-50 hover:bg-primary-100 dark:bg-primary-500/10 px-3 py-1.5 rounded-lg">الكل</Link>
                            </div>
                            
                            <div className="space-y-3">
                                {upcomingMeetings && upcomingMeetings.length > 0 ? (
                                    upcomingMeetings.map(meeting => (
                                        <Link key={meeting.id} href={route('meetings.show', meeting.id)} className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-all hover:-translate-y-0.5 group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${meeting.type === 'online' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                                    {meeting.type === 'online' ? 'عن بعد' : 'حضوري'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">{formatDateAr(meeting.date)}</span>
                                            </div>
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1.5 line-clamp-1">{meeting.title}</h4>
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                <Clock size={12} className="text-slate-400" /> {formatTimeAr(meeting.time)}
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-6 text-center">
                                        <Users size={24} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-slate-500 text-sm font-medium">لا توجد اجتماعات</p>
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
