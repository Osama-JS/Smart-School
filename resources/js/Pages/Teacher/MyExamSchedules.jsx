import React, { useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Calendar, Clock, Download, AlertCircle, MapPin, Users, CheckCircle2, ChevronLeft, ShieldCheck } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';

export default function MyExamSchedules({ schedules, isTeacher }) {
    dayjs.locale('ar');
    const { auth } = usePage().props;
    const teacherName = auth?.user?.name || '';

    const renderSchedule = (schedule) => {
        // Group items by date
        const days = {};
        let totalTasks = 0;
        let pastTasks = 0;
        let upcomingTasks = 0;
        const todayStr = dayjs().format('YYYY-MM-DD');

        schedule.items.forEach(item => {
            if (!days[item.exam_date]) days[item.exam_date] = [];
            days[item.exam_date].push(item);
            totalTasks++;
            
            if (item.exam_date < todayStr) {
                pastTasks++;
            } else {
                upcomingTasks++;
            }
        });

        const sortedDates = Object.keys(days).sort();

        return (
            <div className="space-y-8">
                {/* Stats Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-bold text-sm">إجمالي المهام</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{totalTasks} <span className="text-sm font-bold text-slate-400">مهمة</span></h3>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-bold text-sm">مهام قادمة</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{upcomingTasks}</h3>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center">
                            <CheckCircle2 size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-bold text-sm">مهام منجزة</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{pastTasks}</h3>
                        </div>
                    </div>
                </div>

                {/* Days Grid */}
                <div className="space-y-6">
                    {sortedDates.map((date) => {
                        const isToday = date === todayStr;
                        const isPast = date < todayStr;
                        const tasks = days[date];

                        return (
                            <div key={date} className={`bg-white dark:bg-slate-800 rounded-3xl border ${isToday ? 'border-primary-400 shadow-lg shadow-primary-500/10' : 'border-slate-200 dark:border-slate-700 shadow-sm'} overflow-hidden transition-all hover:shadow-md`}>
                                {/* Date Header */}
                                <div className={`px-6 py-4 flex items-center justify-between border-b ${isToday ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${isToday ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20 animate-pulse' : isPast ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'}`}>
                                            <Calendar size={22} />
                                        </div>
                                        <div>
                                            <h3 className={`text-xl font-black ${isToday ? 'text-primary-700 dark:text-primary-400' : isPast ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                                {dayjs(date).format('dddd، D MMMM YYYY')}
                                            </h3>
                                            {isToday && <p className="text-xs font-bold text-primary-500 mt-0.5">مهام اليوم!</p>}
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <span className="font-bold text-sm text-slate-600 dark:text-slate-300">{tasks.length} مهام</span>
                                    </div>
                                </div>

                                {/* Tasks List */}
                                <div className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        {tasks.map(item => {
                                            const colleagues = (item.proctors || []).filter(p => p.name !== teacherName);
                                            
                                            return (
                                                <div key={item.id} className={`group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 ${isPast ? 'border-slate-100 dark:border-slate-800 opacity-70 grayscale hover:grayscale-0' : 'border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800'} transition-all duration-300`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold mb-3">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                                {item.division?.grade?.name} - {item.division?.name}
                                                            </div>
                                                            <h4 className="font-black text-xl text-slate-800 dark:text-white">
                                                                {item.subject?.name}
                                                            </h4>
                                                        </div>
                                                        
                                                        {item.room && (
                                                            <div className="flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl px-4 py-2 min-w-[80px]">
                                                                <span className="text-[10px] font-bold text-indigo-400 mb-0.5">القاعة</span>
                                                                <span className="text-lg font-black text-indigo-700 dark:text-indigo-400 leading-none">{item.room}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                                                        <div className="flex-1 flex items-center gap-2">
                                                            <Clock size={16} className="text-primary-500 shrink-0" />
                                                            <div>
                                                                <div className="text-[10px] font-bold text-slate-400">فترة المراقبة</div>
                                                                <div className="font-bold text-sm text-slate-700 dark:text-slate-200" dir="ltr">
                                                                    {item.start_time ? item.start_time.substring(0, 5) : '?'} - {item.end_time ? item.end_time.substring(0, 5) : '?'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700"></div>
                                                        <div className="flex-1 flex items-center gap-2">
                                                            <Users size={16} className="text-amber-500 shrink-0" />
                                                            <div>
                                                                <div className="text-[10px] font-bold text-slate-400">زملاء اللجنة</div>
                                                                <div className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                                                                    {colleagues.length > 0 
                                                                        ? colleagues.map(c => c.name.split(' ')[0]).join('، ')
                                                                        : <span className="text-slate-400">بمفردك</span>
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <AdminLayout activeMenu="جدول المراقبة والاختبارات">
            <Head title="جدول المراقبة الخاص بي" />
            
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                {/* Styled Header */}
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
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <ShieldCheck size={28} className="text-primary-600" />
                                جدول مهام المراقبة والاختبارات
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                لوحة تحكم شاملة لمهام المراقبة الموكلة إليك، مع تفاصيل اللجان والزملاء المشاركين.
                            </p>
                        </div>
                    </div>
                </div>

                {!isTeacher && schedules.length === 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700/50 p-5 rounded-2xl mb-8 text-amber-800 dark:text-amber-400 flex items-start gap-4 shadow-sm">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl shrink-0">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-1">حساب غير مرتبط بمعلم</h4>
                            <p className="font-medium opacity-90">أنت لا تملك حساب موظف/معلم مسجل حالياً. لن يظهر لك جدول مراقبة فعلي حتى يتم ربط حسابك بملف وظيفي.</p>
                        </div>
                    </div>
                )}

                {schedules.length > 0 ? (
                    <div className="space-y-16">
                        {schedules.map(schedule => (
                            <div key={schedule.id} className="relative">
                                {/* Decorative elements */}
                                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                                
                                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/40 dark:bg-slate-900/20 backdrop-blur-xl p-6 rounded-[2rem] border border-white dark:border-slate-800 shadow-sm">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-white inline-block relative">
                                            {schedule.title}
                                            <div className="absolute -bottom-2 right-0 w-1/3 h-1 bg-gradient-to-l from-primary-500 to-indigo-500 rounded-full"></div>
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 mt-4 font-bold flex items-center gap-2 text-sm">
                                            <Calendar size={16} />
                                            الفترة المستهدفة: {schedule.period?.month_name} - {schedule.period?.semester?.name}
                                        </p>
                                    </div>
                                    <div className="flex gap-3 shrink-0">
                                        <button 
                                            onClick={() => window.open(route('teacher.my-exam-schedules.print', schedule.id), '_blank')}
                                            className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-primary-600 dark:hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                                        >
                                            <Download size={18} />
                                            طباعة الإشعار الرسمي
                                        </button>
                                    </div>
                                </div>
                                
                                {schedule.items.length > 0 ? (
                                    <div>
                                        {renderSchedule(schedule)}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white dark:border-slate-800 shadow-inner">
                                            <ShieldCheck className="text-slate-400" size={40} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2">لا توجد مهام مراقبة حالياً</h3>
                                        <p className="text-slate-500 font-medium">لم يتم تكليفك بأي مهام مراقبة في هذا الجدول حتى الآن.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-12 md:p-20 border border-slate-100 dark:border-slate-700 text-center shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 -z-10"></div>
                        <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 border-[10px] border-white dark:border-slate-800 shadow-xl">
                            <ShieldCheck className="text-primary-300 dark:text-primary-600/50" size={56} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">أنت متفرغ تماماً!</h2>
                        <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto leading-relaxed">
                            لم يتم تكليفك بأي مهام مراقبة لاختبارات قادمة حتى الآن. سيظهر جدول أعمالك هنا فور إصداره من لجنة الاختبارات.
                        </p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
