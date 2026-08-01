import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Calendar, Clock, MapPin } from 'lucide-react';
import ChildSelector from '@/Components/ChildSelector';

export default function TimetableIndex({ auth, timetable, enrollment, children, activeChildId }) {
    const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('ar-EG', { weekday: 'long' }) || 'الأحد');

    // Make sure we have a valid day selection
    if (!daysOfWeek.includes(selectedDay)) {
        setSelectedDay('الأحد');
    }

    const currentDaySchedule = timetable[selectedDay] || [];
    
    // Sort by start_time
    const sortedSchedule = [...currentDaySchedule].sort((a, b) => {
        return (a.period?.start_time || '').localeCompare(b.period?.start_time || '');
    });

    const formatTimeAr = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <AdminLayout user={auth.user} activeMenu="الجدول الأسبوعي">
            <Head title="الجدول الأسبوعي" />
            
            <div className="max-w-[1200px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
                <ChildSelector children={children} activeChildId={activeChildId} />
                
                {/* Header Widget */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820]/95 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-dark-800" />
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/30 shadow-inner">
                                <Calendar size={32} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">الجدول الأسبوعي</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
                                    <MapPin size={16} />
                                    {enrollment ? `شعبة: ${enrollment.division?.name} - ${enrollment.division?.grade?.name}` : 'غير مسجل في شعبة حالياً'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Days Tabs */}
                <div className="bg-white dark:bg-[#1e293b] p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8 flex overflow-x-auto hide-scrollbar">
                    {daysOfWeek.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl font-bold text-center transition-all ${
                                selectedDay === day
                                    ? 'bg-primary-500 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Timetable List */}
                <div className="space-y-4">
                    {sortedSchedule.length > 0 ? (
                        sortedSchedule.map((item, index) => (
                            <div key={item.id} className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6 hover:border-primary-200 transition-colors">
                                <div className="flex-shrink-0 w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <span className="text-sm font-bold opacity-70">الحصة</span>
                                    <span className="text-2xl font-black">{item.period?.name?.replace(/[^0-9]/g, '') || index + 1}</span>
                                </div>
                                <div className="flex-grow text-center md:text-right">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{item.subject?.name}</h3>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock size={16} />
                                            {formatTimeAr(item.period?.start_time)} - {formatTimeAr(item.period?.end_time)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={16} />
                                            أ. {item.teacher?.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                            <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">لا توجد حصص</h3>
                            <p className="text-slate-500">لا يوجد جدول مخصص لك في هذا اليوم.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
