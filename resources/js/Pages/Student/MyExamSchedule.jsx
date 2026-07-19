import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Calendar, Clock, BookOpen, Download, AlertCircle, FileText, ChevronDown, CheckCircle2, MapPin } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';

// Dynamic color generator for subjects
const getSubjectColor = (id) => {
    const colors = [
        'from-blue-500 to-cyan-500', 
        'from-indigo-500 to-purple-500', 
        'from-rose-500 to-pink-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-amber-500'
    ];
    return colors[id % colors.length];
};

export default function MyExamSchedule({ schedules, isStudent }) {
    
    const renderTimeline = (schedule) => {
        const days = {};
        schedule.items.forEach(item => {
            if (!days[item.exam_date]) days[item.exam_date] = [];
            days[item.exam_date].push(item);
        });

        const sortedDates = Object.keys(days).sort();
        const today = dayjs().format('YYYY-MM-DD');

        return (
            <div className="relative border-r-4 border-slate-100 dark:border-slate-800 pr-6 md:pr-10 mr-4 space-y-12 my-8 before:absolute before:inset-y-0 before:right-[-2px] before:w-1 before:bg-gradient-to-b before:from-primary-500 before:via-indigo-500 before:to-transparent before:rounded-full">
                {sortedDates.map((date, idx) => {
                    const isToday = date === today;
                    const isPast = date < today;
                    
                    return (
                        <div key={date} className="relative group">
                            {/* Timeline glowing dot */}
                            <div className={`absolute -right-[35px] md:-right-[51px] top-1 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm transition-all duration-300 ${isToday ? 'bg-indigo-500 scale-125 animate-pulse shadow-indigo-500/50' : isPast ? 'bg-slate-300 dark:bg-slate-700' : 'bg-primary-500 group-hover:scale-110'}`}>
                                {isPast ? <CheckCircle2 size={12} className="text-white" /> : <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"></div>}
                            </div>
                            
                            <div className="mb-6 flex items-center gap-3">
                                <h3 className={`text-xl md:text-2xl font-black ${isToday ? 'text-indigo-600 dark:text-indigo-400' : isPast ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                    {dayjs(date).locale('ar').format('dddd، D MMMM YYYY')}
                                </h3>
                                {isToday && (
                                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                                        اليوم!
                                    </span>
                                )}
                                {idx === 0 && !isPast && !isToday && (
                                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">بداية الاختبارات</span>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {days[date].map(item => {
                                    const gradient = getSubjectColor(item.subject_id);
                                    
                                    return (
                                        <div key={item.id} className={`bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${isPast ? 'opacity-60 grayscale hover:grayscale-0' : ''}`}>
                                            {/* Glowing background blob */}
                                            <div className={`absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-10 dark:opacity-20 pointer-events-none`}></div>
                                            
                                            <div className="flex justify-between items-start mb-5 relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} p-0.5 shadow-md`}>
                                                        <div className="w-full h-full bg-white dark:bg-slate-800 rounded-[14px] flex items-center justify-center">
                                                            <BookOpen size={24} className={`text-transparent bg-clip-text bg-gradient-to-br ${gradient} drop-shadow-sm`} style={{ stroke: 'url(#gradient-' + item.subject_id + ')' }} />
                                                            {/* SVG Gradient definition for the icon */}
                                                            <svg width="0" height="0">
                                                                <linearGradient id={'gradient-' + item.subject_id} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop stopColor="currentColor" offset="0%" />
                                                                    <stop stopColor="currentColor" offset="100%" />
                                                                </linearGradient>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-800 dark:text-white text-xl md:text-2xl tracking-tight">
                                                            {item.subject?.name}
                                                        </h4>
                                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                            {item.division?.grade?.name} - {item.division?.name}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col gap-2 shrink-0">
                                                    {(item.start_time || item.end_time) && (
                                                        <div className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
                                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1"><Clock size={12}/> وقت الاختبار</span>
                                                            <span className="font-black text-sm dir-ltr text-primary-600 dark:text-primary-400" dir="ltr">
                                                                {item.start_time ? item.start_time.substring(0, 5) : '?'} - {item.end_time ? item.end_time.substring(0, 5) : '?'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {item.room && (
                                                        <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm flex items-center justify-center gap-2">
                                                            <MapPin size={16} />
                                                            <span className="font-bold text-sm">{item.room}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {item.syllabus ? (
                                                <div className="group/syllabus bg-slate-50/80 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-700/50 mt-2 relative z-10 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-default">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                            <FileText size={14} /> المقرر المطلوب
                                                        </p>
                                                    </div>
                                                    <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                                        {item.syllabus}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 mt-2 text-center relative z-10">
                                                    <p className="text-sm font-medium text-slate-400">لم يتم تحديد تفاصيل المقرر</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <AdminLayout activeMenu="جدول اختباراتي">
            <Head title="جدول الاختبارات الخاص بي" />
            
            <div className="p-4 md:p-8 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-sm mb-3 border border-primary-100 dark:border-primary-800/50">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </span>
                            الاستعداد للاختبارات
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 flex items-center gap-4">
                            جدول الاختبارات
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg font-medium max-w-2xl">
                            استعرض مواعيد اختباراتك والمقررات المطلوبة لكل مادة لضمان أفضل استعداد للنجاح.
                        </p>
                    </div>
                </div>

                {!isStudent && schedules.length === 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700/50 p-5 rounded-2xl mb-8 text-amber-800 dark:text-amber-400 flex items-start gap-4 shadow-sm">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl shrink-0">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-1">حساب تجريبي / غير طلابي</h4>
                            <p className="font-medium opacity-90">أنت لا تملك حساب طالب مسجل حالياً. يتم عرض هذه الصفحة للتجربة، ولن يظهر لك جدول فعلي حتى يتم ربط حسابك بملف طالب.</p>
                        </div>
                    </div>
                )}

                {schedules.length > 0 ? (
                    <div className="space-y-16">
                        {schedules.map(schedule => (
                            <div key={schedule.id} className="relative">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                                
                                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-800 dark:text-white inline-block relative">
                                            {schedule.title}
                                            <div className="absolute -bottom-2 right-0 w-1/3 h-1.5 bg-gradient-to-l from-primary-500 to-indigo-500 rounded-full"></div>
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 mt-4 font-bold flex items-center gap-2">
                                            <Calendar size={18} />
                                            الفترة المستهدفة: {schedule.period?.month_name} - {schedule.period?.semester?.name}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <a 
                                            href={route('student.exam-schedule.ics', schedule.id)}
                                            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm hover:shadow-md"
                                        >
                                            <Calendar size={18} />
                                            إضافة للتقويم 📅
                                        </a>
                                        <a 
                                            href={route('student.exam-schedule.print', schedule.id)}
                                            target="_blank"
                                            className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl font-bold hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm hover:shadow-md"
                                        >
                                            <Download size={18} />
                                            طباعة PDF
                                        </a>
                                    </div>
                                </div>
                                
                                {schedule.items.length > 0 ? (
                                    <div className="bg-white/40 dark:bg-slate-900/20 backdrop-blur-xl rounded-[2.5rem] p-4 md:p-10 border border-white dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
                                        {renderTimeline(schedule)}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 border-dashed">
                                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Calendar className="text-slate-400" size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">الجدول قيد الإعداد</h3>
                                        <p className="text-slate-500 font-medium">لم يتم إدراج مواد لك في هذا الجدول حتى الآن.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-12 md:p-20 border border-slate-100 dark:border-slate-700 text-center shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 -z-10"></div>
                        <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 border-[10px] border-white dark:border-slate-800 shadow-xl">
                            <Calendar className="text-primary-300 dark:text-primary-600/50" size={56} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">لا توجد اختبارات قادمة</h2>
                        <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto leading-relaxed">
                            لم يتم نشر أي جداول اختبارات لك في الوقت الحالي. استمتع بوقتك وسيظهر الجدول هنا فور اعتماده من الإدارة.
                        </p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
