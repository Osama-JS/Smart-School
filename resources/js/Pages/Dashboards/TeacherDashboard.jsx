import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Calendar, Clock, Users, BookOpen, 
    CheckCircle, XCircle, AlertCircle, MapPin
} from 'lucide-react';

export default function TeacherDashboard({ auth, todayTimetable, attendanceStatus, upcomingMeetings, stats }) {
    const formatTimeAr = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const formatDateAr = (dateString) => {
        if (!dateString) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="لوحة تحكم المعلم" />

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            مرحباً، {auth.user.name} 👋
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            إليك نظرة عامة على جدولك ومسؤولياتك لهذا اليوم.
                        </p>
                    </div>
                </div>

                {/* Quick Stats & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Attendance Status */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                            attendanceStatus?.status === 'present' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            attendanceStatus?.status === 'late' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                            attendanceStatus?.status === 'absent' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        }`}>
                            {attendanceStatus?.status === 'present' || attendanceStatus?.status === 'late' ? <CheckCircle size={28} /> : 
                             attendanceStatus?.status === 'absent' ? <XCircle size={28} /> : <AlertCircle size={28} />}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">حالة الحضور اليوم</p>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                {attendanceStatus?.status === 'present' ? 'حاضر' :
                                 attendanceStatus?.status === 'late' ? 'متأخر' :
                                 attendanceStatus?.status === 'absent' ? 'غائب' : 'لم يُسجل بعد'}
                            </h3>
                            {attendanceStatus?.time_in && (
                                <p className="text-xs text-slate-400 mt-1">وقت الحضور: {formatTimeAr(attendanceStatus.time_in)}</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الفصول التي تدرسها</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.divisions}</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">المواد التي تغطيها</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.subjects}</h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Today's Schedule */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Clock className="text-primary-500" size={24} /> جدول الحصص اليوم
                            </h2>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                            {todayTimetable && todayTimetable.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {todayTimetable.map((item, idx) => (
                                        <div key={idx} className="p-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="w-16 text-center shrink-0">
                                                <div className="text-xs font-bold text-slate-400 mb-1">{item.period?.period_name}</div>
                                                <div className="text-sm font-black text-primary-600 dark:text-primary-400">{formatTimeAr(item.period?.start_time)}</div>
                                            </div>
                                            <div className="w-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">{item.subject?.name}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                    <span className="flex items-center gap-1"><Users size={14} /> {item.division?.grade?.name} - {item.division?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar size={28} className="text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-white">لا توجد حصص اليوم</h3>
                                    <p className="text-slate-500 mt-1">يبدو أن جدولك فارغ لهذا اليوم.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Meetings */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Users className="text-amber-500" size={24} /> الاجتماعات القادمة
                        </h2>
                        
                        <div className="space-y-4">
                            {upcomingMeetings && upcomingMeetings.length > 0 ? (
                                upcomingMeetings.map(meeting => (
                                    <Link key={meeting.id} href={route('meetings.show', meeting.id)} className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${meeting.type === 'online' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'}`}>
                                                {meeting.type === 'online' ? 'عن بعد' : 'حضوري'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 group-hover:text-primary-500 transition-colors">{formatDateAr(meeting.date)}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white mb-2 line-clamp-2">{meeting.title}</h4>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Clock size={14} /> {formatTimeAr(meeting.time)}
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm">
                                    <Users size={24} className="text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">ليس لديك اجتماعات مجدولة قادمة.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
