import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, ArrowRight, Share2, Copy, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudyPlanCalendar({ events }) {
    const { auth } = usePage().props;
    const [copied, setCopied] = useState(false);

    // Dynamic sync URL for Google Calendar
    const syncUrl = `${window.location.origin}/teacher/study-plans-calendar/export.ics?token=${auth.user.id}`;

    const handleCopySyncUrl = () => {
        navigator.clipboard.writeText(syncUrl);
        setCopied(true);
        toast.success('تم نسخ رابط المزامنة بنجاح!');
        setTimeout(() => setCopied(false), 3000);
    };

    const handleEventClick = (info) => {
        // Show detailed description when an event is clicked
        const description = info.event.extendedProps.description || 'لا توجد تفاصيل إضافية.';
        toast(
            (t) => (
                <div className="flex flex-col gap-2 p-1 max-w-sm">
                    <h3 className="font-bold text-slate-800">{info.event.title}</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{description}</p>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="mt-2 self-end text-xs font-bold text-primary-600 hover:text-primary-800"
                    >
                        إغلاق
                    </button>
                </div>
            ),
            { duration: 6000, position: 'bottom-right' }
        );
    };

    return (
        <AdminLayout activeMenu="خططي الدراسية">
            <Head title="تقويم الخطط الدراسية | بوابة المعلم" />

            <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-indigo-100 dark:border-indigo-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-700" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <Link href={route('teacher.study-plans.index')} className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-3 hover:text-indigo-800 transition">
                                <ArrowRight size={16} /> العودة للخطط الدراسية
                            </Link>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <CalendarIcon size={28} className="text-indigo-600" />
                                تقويم الخطط الدراسية
                            </h1>
                            <p className="text-indigo-700/80 dark:text-indigo-300/80 mt-2 text-sm font-semibold">
                                عرض مجدول وتفاعلي لجميع خططك المعتمدة.
                            </p>
                        </div>

                        {/* Sync Section */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 max-w-md w-full shrink-0">
                            <div className="flex items-center gap-2 mb-2">
                                <Share2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">المزامنة مع التقويم الخارجي</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                استخدم هذا الرابط لمزامنة خططك تلقائياً مع تطبيقات مثل Google Calendar أو Apple Calendar.
                            </p>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={syncUrl}
                                    className="w-full text-xs p-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 outline-none"
                                />
                                <button 
                                    onClick={handleCopySyncUrl}
                                    className={`shrink-0 p-2 rounded-xl transition-colors ${copied ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                    title="نسخ الرابط"
                                >
                                    {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar View */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                        <Info size={18} className="shrink-0" />
                        <p>ملاحظة: تظهر في التقويم الخطط الدراسية التي اعتمدها المشرف فقط، والتي تحتوي على عمود لتحديد "تاريخ" الدرس.</p>
                    </div>

                    {/* Custom styling for fullcalendar via CSS */}
                    <style dangerouslySetInnerHTML={{__html: `
                        .fc { direction: rtl; font-family: inherit; }
                        .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 900 !important; }
                        .fc-button-primary { background-color: #4f46e5 !important; border-color: #4338ca !important; text-transform: capitalize; border-radius: 0.75rem !important; }
                        .fc-button-primary:hover { background-color: #4338ca !important; }
                        .fc-day-today { background-color: rgba(79, 70, 229, 0.05) !important; }
                        .dark .fc-day-today { background-color: rgba(79, 70, 229, 0.1) !important; }
                        .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid { border-color: #f1f5f9 !important; }
                        .dark .fc-theme-standard td, .dark .fc-theme-standard th, .dark .fc-theme-standard .fc-scrollgrid { border-color: #1e293b !important; }
                        .fc-event { border-radius: 0.5rem !important; padding: 2px 4px; border: none !important; cursor: pointer; transition: transform 0.2s; }
                        .fc-event:hover { transform: scale(1.02); z-index: 10; }
                    `}} />

                    <div className="min-h-[600px]">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale="ar"
                            headerToolbar={{
                                right: 'prev,next today',
                                center: 'title',
                                left: 'dayGridMonth,timeGridWeek'
                            }}
                            buttonText={{
                                today: 'اليوم',
                                month: 'شهر',
                                week: 'أسبوع',
                                day: 'يوم'
                            }}
                            events={events}
                            eventClick={handleEventClick}
                            height="auto"
                            dayMaxEvents={3}
                        />
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
