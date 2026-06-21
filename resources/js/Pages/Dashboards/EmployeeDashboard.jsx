import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Calendar, Clock, Users, ShieldAlert,
    CheckCircle, XCircle, AlertCircle, FileText
} from 'lucide-react';

export default function EmployeeDashboard({ auth, attendanceStatus, upcomingMeetings, pendingViolations }) {
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
            <Head title="لوحة تحكم الموظف" />

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            مرحباً، {auth.user.name} 👋
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            هنا تجد ملخصاً لأهم التنبيهات والأحداث الخاصة بك.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    {/* Pending Violations Highlight */}
                    <div className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm flex items-center gap-5 transition-colors ${pendingViolations?.length > 0 ? 'border-red-200 dark:border-red-900/50 hover:border-red-300' : 'border-slate-200 dark:border-slate-800'}`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${pendingViolations?.length > 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                            {pendingViolations?.length > 0 ? <ShieldAlert size={28} /> : <CheckCircle size={28} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">المخالفات المعلقة</p>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                {pendingViolations?.length > 0 ? `لديك ${pendingViolations.length} مخالفات تتطلب الإقرار` : 'لا توجد مخالفات مسجلة'}
                            </h3>
                            {pendingViolations?.length > 0 && (
                                <Link href={route('my-violations.index')} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline mt-1 inline-block">عرض التفاصيل والتوقيع &larr;</Link>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Meetings */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Users className="text-amber-500" size={24} /> الاجتماعات المجدولة
                            </h2>
                            <Link href={route('meetings.index')} className="text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">عرض الكل</Link>
                        </div>
                        
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
                                    <p className="text-slate-500 font-medium">ليس لديك أي اجتماعات مجدولة.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Violations List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText className="text-red-500" size={24} /> المخالفات الأخيرة
                            </h2>
                        </div>
                        
                        <div className="space-y-4">
                            {pendingViolations && pendingViolations.length > 0 ? (
                                pendingViolations.slice(0, 3).map(violation => (
                                    <div key={violation.id} className="bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 rounded-3xl p-5 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-400">{formatDateAr(violation.date)}</span>
                                            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50">بانتظار التوقيع</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white mb-1">{violation.violationType?.name}</h4>
                                        {violation.notes && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">{violation.notes}</p>}
                                        <div className="mt-4 flex justify-end">
                                            <Link href={route('my-violations.index')} className="text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl transition-colors">
                                                الذهاب للإقرار
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm">
                                    <ShieldAlert size={24} className="text-emerald-400 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">لا توجد مخالفات معلقة. عمل رائع!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
