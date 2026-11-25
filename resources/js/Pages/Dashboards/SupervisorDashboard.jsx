import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import NewsWidget from '@/Components/NewsWidget';
import {
    BookOpen, Calendar, Clock, Users, ClipboardList, CheckCircle,
    FileCheck, Star, Eye, MapPin, LayoutList, CheckSquare, Square,
    Trash2, Plus, Loader2, Sun, Moon, ChevronLeft, Award,
} from 'lucide-react';

export default function SupervisorDashboard({
    stats = {},
    recentUnreviewedPreps = [],
    pendingStudyPlansList = [],
    recentVisits = [],
    pendingAppraisals = null,
    attendanceStatus = null,
    upcomingMeetings = [],
    quickTasks = [],
    latestNews = [],
}) {
    const { auth } = usePage().props;

    const [greeting, setGreeting] = useState({ text: 'مرحباً', icon: Sun, color: 'text-amber-500' });
    const [timeStr, setTimeStr] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting({ text: 'صباح الخير', icon: Sun, color: 'text-amber-500' });
        else if (hour >= 12 && hour < 17) setGreeting({ text: 'مساء الخير', icon: Sun, color: 'text-orange-500' });
        else setGreeting({ text: 'مساء الخير', icon: Moon, color: 'text-indigo-400' });

        const updateClock = () => {
            setTimeStr(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true }));
        };
        updateClock();
        const timer = setInterval(updateClock, 30000);
        return () => clearInterval(timer);
    }, []);

    // Quick Tasks
    const [tasks, setTasks] = useState(quickTasks);
    const [newTaskText, setNewTaskText] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isProcessing, setIsProcessing] = useState(null);

    useEffect(() => {
        setTasks(quickTasks);
    }, [quickTasks]);

    const toggleTask = (id) => {
        setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
        router.patch(route('dashboard.quick-tasks.toggle', id), {}, { preserveScroll: true });
    };

    const deleteTask = (id, e) => {
        e.stopPropagation();
        setIsProcessing(id);
        router.delete(route('dashboard.quick-tasks.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                setTasks(tasks.filter((t) => t.id !== id));
                setIsProcessing(null);
            },
            onError: () => setIsProcessing(null),
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
            onError: () => setIsProcessing(null),
        });
    };

    const formatTimeAr = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const d = new Date();
        d.setHours(hours, minutes);
        return d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <AdminLayout user={auth.user} activeMenu="الرئيسية">
            <Head title="لوحة الموجه | شامل" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/90 via-white to-white dark:from-indigo-950/30 dark:via-[#121820] dark:to-[#121820] border border-indigo-100/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-indigo-500 via-primary-500 to-emerald-500" />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-black mb-2">
                                <Eye size={13} /> التوجيه والمتابعة الأكاديمية
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                {greeting.text}، {auth.user?.name?.split(' ')[0] || 'موجهنا'}
                                <greeting.icon size={26} className={greeting.color} />
                            </h1>
                            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                متابعة مراجعة دفاتر التحضير، الخطط الدراسية، الزيارات الصفية، وتقييم المعلمين في لجان التقييم
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-500" />
                                {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            {timeStr && (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl text-xs font-black font-mono text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    <Clock size={14} className="text-indigo-500" />
                                    {timeStr}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-100/60 dark:border-slate-800">
                        <Link href={route('academic.lesson-preparations')} className="bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 hover:border-indigo-400 hover:-translate-y-0.5 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
                                <ClipboardList size={18} />
                            </div>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">مراجعة دفاتر التحضير</span>
                        </Link>
                        <Link href={route('academic.classroom-visits')} className="bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 hover:border-emerald-400 hover:-translate-y-0.5 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                <Eye size={18} />
                            </div>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">الزيارات الصفية</span>
                        </Link>
                        <Link href={route('academic.study-plans.index')} className="bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 hover:border-amber-400 hover:-translate-y-0.5 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                                <BookOpen size={18} />
                            </div>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">الخطط الدراسية</span>
                        </Link>
                        <Link href={route('hr.appraisals.index')} className="bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 hover:border-purple-400 hover:-translate-y-0.5 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                                <Star size={18} />
                            </div>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">تقييمات الأداء</span>
                        </Link>
                    </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white dark:bg-[#121820]/70 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500">تحاضير بانتظار المراجعة</p>
                            <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">{stats.unreviewed_preparations ?? 0}</h3>
                            <p className="text-[11px] font-semibold text-slate-400 mt-1">تمت مراجعة ({stats.reviewed_this_month ?? 0}) هذا الشهر</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center">
                            <FileCheck size={22} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/70 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500">خطط دراسية معلقة</p>
                            <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">{stats.pending_study_plans ?? 0}</h3>
                            <p className="text-[11px] font-semibold text-slate-400 mt-1">بانتظار المراجعة والاعتماد</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                            <BookOpen size={22} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/70 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500">زيارات صفية هذا الشهر</p>
                            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{stats.visits_this_month ?? 0}</h3>
                            <p className="text-[11px] font-semibold text-slate-400 mt-1">زيارات منفذة وموثقة</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                            <Eye size={22} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/70 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500">تقييمات مسندة في اللجنة</p>
                            <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">{stats.pending_committee_appraisals ?? 0}</h3>
                            <p className="text-[11px] font-semibold text-slate-400 mt-1">معلمون بانتظار تقييمك</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 flex items-center justify-center">
                            <Award size={22} />
                        </div>
                    </div>
                </div>

                {latestNews && latestNews.length > 0 && <NewsWidget news={latestNews} />}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left 8 Cols */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Pending Committee Appraisals */}
                        {pendingAppraisals && pendingAppraisals.total > 0 && (
                            <div className="bg-white dark:bg-[#121820]/70 border border-purple-200/70 dark:border-purple-900/40 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <Star size={18} className="text-purple-600" />
                                        تقييمات مسندة إليك ({pendingAppraisals.total})
                                    </h3>
                                    <Link href={route('hr.appraisals.index')} className="text-xs font-bold text-purple-600 hover:underline">
                                        عرض الكل
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {pendingAppraisals.items.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={route('hr.appraisals.show', item.id)}
                                            className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-800/30 hover:border-purple-400 flex items-center justify-between transition-all"
                                        >
                                            <div>
                                                <p className="text-sm font-black text-slate-800 dark:text-white">{item.employee_name}</p>
                                                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{item.cycle_title}</p>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-xl bg-purple-600 text-white text-[10px] font-black">
                                                {item.action_type === 'self' ? 'تقييم ذاتي' : 'بدء التقييم'}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Unreviewed Lesson Preparations */}
                        <div className="bg-white dark:bg-[#121820]/70 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <ClipboardList size={18} className="text-amber-500" />
                                    دفاتر تحضير بانتظار مراجعة التوجيه
                                </h3>
                                <Link href={route('academic.lesson-preparations')} className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
                                    فتح الكل <ChevronLeft size={14} />
                                </Link>
                            </div>

                            {recentUnreviewedPreps.length > 0 ? (
                                <div className="space-y-2.5">
                                    {recentUnreviewedPreps.map((prep) => (
                                        <Link
                                            key={prep.id}
                                            href={route('academic.lesson-preparations')}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-amber-300 transition-all"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">{prep.lesson_title}</p>
                                                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                                    أ. {prep.teacher_name} — {prep.subject_name} ({prep.grade_name}{prep.division_name ? ` - ${prep.division_name}` : ''})
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {prep.curriculum_progress && (
                                                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                                        {prep.curriculum_progress}
                                                    </span>
                                                )}
                                                <span className="text-[11px] font-mono text-slate-400">{prep.preparation_date}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle size={28} className="mx-auto mb-2" />
                                    <p className="text-xs font-black">تمت مراجعة جميع دفاتر التحضير المنشورة</p>
                                </div>
                            )}
                        </div>

                        {/* Pending Study Plans & Recent Classroom Visits */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Study Plans */}
                            <div className="bg-white dark:bg-[#121820]/70 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <BookOpen size={16} className="text-indigo-500" /> خطط دراسية معلقة
                                    </h3>
                                    <Link href={route('academic.study-plans.index')} className="text-xs font-bold text-indigo-600">الكل</Link>
                                </div>
                                {pendingStudyPlansList.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {pendingStudyPlansList.map((sp) => (
                                            <Link
                                                key={sp.id}
                                                href={route('academic.study-plans.show', sp.id)}
                                                className="block p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300"
                                            >
                                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{sp.title}</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    أ. {sp.teacher_name} — {sp.subject_name} ({sp.grade_name})
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 text-center py-6 font-bold">لا توجد خطط دراسية معلقة</p>
                                )}
                            </div>

                            {/* Recent Classroom Visits */}
                            <div className="bg-white dark:bg-[#121820]/70 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <Eye size={16} className="text-emerald-500" /> أحدث زياراتك الصفية
                                    </h3>
                                    <Link href={route('academic.classroom-visits')} className="text-xs font-bold text-emerald-600">الكل</Link>
                                </div>
                                {recentVisits.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {recentVisits.map((v) => (
                                            <div key={v.id} className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-white">أ. {v.teacher_name}</p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">{v.grade_name} {v.division_name} • {v.visit_date}</p>
                                                </div>
                                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-black font-mono">
                                                    {v.score}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 text-center py-6 font-bold">لم يتم توثيق زيارات صفية مؤخراً</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right 4 Cols */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Attendance Status */}
                        <div className="bg-white dark:bg-[#121820]/70 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${attendanceStatus?.status === 'present' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400">حضورك اليوم</p>
                                <h4 className="text-lg font-black text-slate-800 dark:text-white">
                                    {attendanceStatus?.status === 'present' ? 'حاضر ومُلتزم' : attendanceStatus?.status === 'late' ? 'متأخر' : 'لم يُسجل بعد'}
                                </h4>
                                {attendanceStatus?.check_in && (
                                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">تسجيل الدخول: {formatTimeAr(attendanceStatus.check_in)}</p>
                                )}
                            </div>
                        </div>

                        {/* Quick Tasks */}
                        <div className="bg-white dark:bg-[#121820]/70 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <LayoutList size={18} className="text-primary-500" /> مهامي التوجيهية
                                </h3>
                                <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full">
                                    {tasks.filter((t) => t.completed).length} / {tasks.length}
                                </span>
                            </div>

                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {tasks.length === 0 && !isAddingTask && (
                                    <p className="text-xs text-slate-400 text-center py-6 font-bold">لا توجد مهام مسجلة</p>
                                )}
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => toggleTask(task.id)}
                                        className={`flex items-center justify-between gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
                                            task.completed ? 'bg-slate-50/50 dark:bg-slate-900/20 opacity-70' : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-800 hover:border-primary-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {isProcessing === task.id ? (
                                                <Loader2 size={18} className="animate-spin text-primary-500 shrink-0" />
                                            ) : task.completed ? (
                                                <CheckSquare size={18} className="text-primary-500 shrink-0" />
                                            ) : (
                                                <Square size={18} className="text-slate-300 shrink-0" />
                                            )}
                                            <span className={`text-xs font-bold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {task.text}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => deleteTask(task.id, e)}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                {isAddingTask ? (
                                    <div className="flex gap-2 items-center p-2 rounded-2xl border border-primary-300 bg-white dark:bg-slate-900">
                                        <input
                                            type="text"
                                            value={newTaskText}
                                            onChange={(e) => setNewTaskText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') addTask();
                                                if (e.key === 'Escape') setIsAddingTask(false);
                                            }}
                                            placeholder="اكتب المهمة..."
                                            autoFocus
                                            className="w-full text-xs bg-transparent border-none focus:ring-0 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={addTask}
                                            disabled={isProcessing === 'new'}
                                            className="p-1.5 bg-primary-500 text-white rounded-xl"
                                        >
                                            {isProcessing === 'new' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingTask(true)}
                                        className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary-500 hover:border-primary-300 text-xs font-bold flex items-center justify-center gap-1.5"
                                    >
                                        <Plus size={14} /> إضافة مهمة توجيهية
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Meetings */}
                        <div className="bg-white dark:bg-[#121820]/70 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Users size={18} className="text-amber-500" /> الاجتماعات القادمة
                                </h3>
                                <Link href={route('meetings.index')} className="text-xs font-bold text-primary-600">الكل</Link>
                            </div>
                            {upcomingMeetings.length > 0 ? (
                                <div className="space-y-2.5">
                                    {upcomingMeetings.map((m) => (
                                        <Link
                                            key={m.id}
                                            href={route('meetings.show', m.id)}
                                            className="block p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-primary-300"
                                        >
                                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{m.title}</p>
                                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock size={11} /> {formatTimeAr(m.time)}
                                                {m.location && <span className="inline-flex items-center gap-0.5 mr-2"><MapPin size={11} /> {m.location}</span>}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 text-center py-6 font-bold">لا توجد اجتماعات قادمة</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
