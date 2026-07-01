import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Calendar, Clock, Users, ShieldAlert,
    CheckCircle, XCircle, AlertCircle, FileText, ChevronLeft,
    Sun, Moon, Quote, Plane, Edit3, PenTool, LayoutList, CheckSquare, Square,
    Megaphone, ChevronRight, Target, Activity
} from 'lucide-react';

export default function EmployeeDashboard({ auth, attendanceStatus, upcomingMeetings, pendingViolations, leaderboard }) {
    // Dynamic Greeting Logic
    const [greeting, setGreeting] = useState({ text: 'مرحباً', icon: Sun, color: 'text-amber-500' });
    
    // Interactive To-Do List State
    const [tasks, setTasks] = useState([
        { id: 1, text: 'تسليم درجات أعمال السنة للفصل الدراسي', completed: false },
        { id: 2, text: 'تحضير مادة العلوم للصف الخامس', completed: true },
        { id: 3, text: 'الرد على استفسارات أولياء الأمور', completed: false },
    ]);

    // Announcements Carousel State
    const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
    const announcements = [
        { id: 1, title: 'موعد إجازة منتصف الفصل الدراسي الثاني', type: 'عاجل', date: '2026-10-15', color: 'bg-red-50 text-red-600 border-red-200' },
        { id: 2, title: 'دورة تدريبية: استخدام الذكاء الاصطناعي في التعليم', type: 'تطوير', date: '2026-07-01', color: 'bg-blue-50 text-blue-600 border-blue-200' },
        { id: 3, title: 'تحديث نظام الحضور والانصراف الإلكتروني', type: 'عام', date: '2026-06-30', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    ];

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

        const interval = setInterval(() => {
            setCurrentAnnouncement(prev => (prev + 1) % announcements.length);
        }, 5000);
        return () => clearInterval(interval);
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

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    return (
        <AdminLayout user={auth.user} activeMenu="الرئيسية">
            <Head title="لوحة تحكم الموظف | شامل" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">
                
                {/* 6. Dynamic Greeting Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/90 via-white to-white dark:from-[#1e293b] dark:via-[#121820] dark:to-[#121820] border border-primary-100 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary-400/10 dark:bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 mb-4">
                                {greeting.text}، {auth.user.name.split(' ')[0]} <greeting.icon className={`animate-pulse-slow ${greeting.color}`} size={36} />
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left/Main Content Column (Takes 8 columns on large screens) */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* 4. Announcements Carousel */}
                        <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 rounded-[2rem] p-2 shadow-sm flex items-center overflow-hidden relative">
                            <div className="bg-gradient-to-l from-amber-400 to-orange-500 text-white px-5 py-4 rounded-[1.5rem] flex items-center gap-2 font-bold shrink-0 z-10 shadow-lg shadow-amber-500/20">
                                <Megaphone size={20} className="animate-bounce" /> إعلانات
                            </div>
                            <div className="flex-1 overflow-hidden relative h-12 ml-4">
                                {announcements.map((ann, idx) => (
                                    <div 
                                        key={ann.id} 
                                        className={`absolute inset-0 flex items-center justify-between transition-all duration-500 ease-in-out px-4 ${idx === currentAnnouncement ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
                                    >
                                        <p className="font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{ann.title}</p>
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${ann.color} shrink-0 hidden sm:block`}>{ann.type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 1. Quick Actions Panel */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <div className="w-2 h-6 bg-primary-500 rounded-full"></div> الإجراءات السريعة
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <button className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/10 p-6 rounded-[2rem] transition-all hover:-translate-y-1 group">
                                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Plane size={24} /></div>
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">طلب إجازة</span>
                                </button>
                                <Link href={route('hr.reports.my-reports.index')} className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 p-6 rounded-[2rem] transition-all hover:-translate-y-1 group">
                                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Edit3 size={24} /></div>
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">كتابة تقرير</span>
                                </Link>
                                <button className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg hover:shadow-purple-500/10 p-6 rounded-[2rem] transition-all hover:-translate-y-1 group">
                                    <div className="w-14 h-14 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">كشف الراتب</span>
                                </button>
                                <button className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/10 p-6 rounded-[2rem] transition-all hover:-translate-y-1 group">
                                    <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><AlertCircle size={24} /></div>
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">الدعم الفني</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Performance & Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">نسبة الانضباط والحضور</p>
                                    <h4 className="text-3xl font-black text-slate-800 dark:text-white">96<span className="text-lg text-slate-400">%</span></h4>
                                    <p className="text-xs text-emerald-500 font-bold mt-2 flex items-center gap-1">+2% عن الشهر الماضي</p>
                                </div>
                                <div className="w-20 h-20 relative flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <path className="text-slate-100 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                        <path className="text-emerald-500" strokeDasharray="96, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    <Target className="absolute text-emerald-500" size={20} />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">رصيد الإجازات المتبقي</p>
                                    <h4 className="text-3xl font-black text-slate-800 dark:text-white">12<span className="text-lg text-slate-400"> يوم</span></h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-2">من أصل 21 يوم اعتيادي</p>
                                </div>
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                                    <Plane size={28} />
                                </div>
                            </div>
                        </div>

                        {/* Existing Highlights: Attendance & Violations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                    attendanceStatus?.status === 'present' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' :
                                    attendanceStatus?.status === 'late' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' :
                                    attendanceStatus?.status === 'absent' ? 'bg-red-50 text-red-600 dark:bg-red-500/10' :
                                    'bg-slate-50 text-slate-400 dark:bg-slate-800'
                                }`}>
                                    {attendanceStatus?.status === 'present' || attendanceStatus?.status === 'late' ? <CheckCircle size={28} /> : 
                                    attendanceStatus?.status === 'absent' ? <XCircle size={28} /> : <AlertCircle size={28} />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 mb-1">تسجيل الدخول اليوم</p>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        {attendanceStatus?.status === 'present' ? 'حاضر' :
                                        attendanceStatus?.status === 'late' ? 'متأخر' :
                                        attendanceStatus?.status === 'absent' ? 'غائب' : 'لم يُسجل بعد'}
                                    </h3>
                                    {attendanceStatus?.time_in && (
                                        <p className="text-xs font-bold text-slate-500 mt-1">الوقت: {formatTimeAr(attendanceStatus.time_in)}</p>
                                    )}
                                </div>
                            </div>

                            <div className={`bg-white dark:bg-[#121820] border rounded-[2rem] p-6 shadow-sm flex items-center gap-5 transition-all ${pendingViolations?.length > 0 ? 'border-red-200 dark:border-red-900/50' : 'border-slate-100 dark:border-slate-800'}`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${pendingViolations?.length > 0 ? 'bg-red-50 text-red-600 dark:bg-red-500/10 animate-pulse' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'}`}>
                                    {pendingViolations?.length > 0 ? <ShieldAlert size={28} /> : <CheckCircle size={28} />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 mb-1">المخالفات المعلقة</p>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        {pendingViolations?.length > 0 ? `تتطلب إقرار (${pendingViolations.length})` : 'سجلك نظيف!'}
                                    </h3>
                                    {pendingViolations?.length > 0 && (
                                        <Link href={route('hr.my-violations')} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline mt-1 inline-block">الذهاب للإقرار</Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Leaderboard Widget */}
                        {leaderboard && leaderboard.length > 0 && (
                            <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                                        <Target size={20} />
                                    </div>
                                    لوحة المتصدرين
                                </h3>
                                <div className="space-y-3">
                                    {leaderboard.map((leader, index) => (
                                        <div key={leader.user_id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {index + 1}
                                                </div>
                                                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{leader.user?.name}</p>
                                            </div>
                                            <span className="font-black text-emerald-600 dark:text-emerald-400">{leader.total_points} نقطة</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right/Sidebar Column (Takes 4 columns on large screens) */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* 3. Daily Timeline (Agenda) */}
                        <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 left-0 h-1 bg-primary-500" />
                            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-8">
                                <Clock className="text-primary-500" size={24} /> جدول اليوم
                            </h2>
                            
                            <div className="relative border-r-2 border-slate-100 dark:border-slate-800 pr-6 space-y-8">
                                {/* Current Event Marker */}
                                <div className="absolute top-1/3 right-[-9px] w-4 h-4 bg-primary-500 rounded-full border-4 border-white dark:border-[#121820] shadow-sm"></div>
                                
                                <div className="relative">
                                    <div className="absolute -right-[33px] top-1 w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                    <p className="text-xs font-bold text-slate-400 mb-1">08:00 ص - 08:45 ص</p>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">الحصة الأولى - رياضيات</h4>
                                        <p className="text-xs text-slate-500 mt-1">الصف الخامس (أ)</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <p className="text-xs font-bold text-primary-500 mb-1">10:00 ص - 11:30 ص (الحالي)</p>
                                    <div className="bg-primary-50 dark:bg-primary-500/10 p-4 rounded-2xl border border-primary-100 dark:border-primary-500/20 shadow-sm shadow-primary-500/5">
                                        <h4 className="font-bold text-primary-700 dark:text-primary-400 text-sm">اجتماع قسم الرياضيات</h4>
                                        <p className="text-xs text-primary-600/70 dark:text-primary-400/70 mt-1">غرفة الاجتماعات الرئيسية</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -right-[33px] top-1 w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                    <p className="text-xs font-bold text-slate-400 mb-1">01:00 م - 01:45 م</p>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 opacity-70">
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">مناوبة الساحة الخارجية</h4>
                                        <p className="text-xs text-slate-500 mt-1">البوابة الرئيسية</p>
                                    </div>
                                </div>
                            </div>
                            
                            {upcomingMeetings?.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <Link href={route('meetings.index')} className="text-sm font-bold text-primary-600 hover:text-primary-700 w-full flex items-center justify-center gap-2">
                                        عرض جميع اجتماعات الأسبوع <ChevronLeft size={16} />
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* 5. Tasks & Reminders (To-Do List) */}
                        <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                                <LayoutList className="text-emerald-500" size={24} /> مهام اليوم
                            </h2>
                            <div className="space-y-3">
                                {tasks.map(task => (
                                    <div 
                                        key={task.id} 
                                        onClick={() => toggleTask(task.id)}
                                        className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${task.completed ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-700 hover:border-emerald-300 shadow-sm'}`}
                                    >
                                        <div className={`mt-0.5 shrink-0 transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                            {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </div>
                                        <p className={`text-sm font-bold transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {task.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-4 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary-500 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all font-bold text-sm flex items-center justify-center gap-2">
                                + إضافة مهمة شخصية
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
