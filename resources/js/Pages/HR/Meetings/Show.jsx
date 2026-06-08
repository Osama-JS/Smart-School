import React, { useState } from "react";
import { Head, useForm, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Users, Calendar, Clock, MapPin, CheckCircle, X, ChevronRight, FileText, CheckSquare, XCircle, AlertCircle } from "lucide-react";

export default function MeetingShow({ auth, meeting, isSupervisor }) {
    const attendanceForm = useForm({
        participants: meeting.participants.map(p => ({
            id: p.id,
            status: p.attendance_status
        }))
    });

    const completionForm = useForm({
        outcomes: meeting.outcomes || '',
        recommendations: meeting.recommendations || ''
    });

    const handleAttendanceChange = (id, status) => {
        const newParticipants = attendanceForm.data.participants.map(p => 
            p.id === id ? { ...p, status } : p
        );
        attendanceForm.setData('participants', newParticipants);
    };

    const handleAttendanceSubmit = (e) => {
        e.preventDefault();
        attendanceForm.post(route('meetings.attendance', meeting.id));
    };

    const handleCompleteSubmit = (e) => {
        e.preventDefault();
        completionForm.post(route('meetings.complete', meeting.id));
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title={`الاجتماع: ${meeting.title}`} />
            
            <div className="p-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Link href={route('meetings.index')} className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                            <ChevronRight size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{meeting.title}</h1>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                                    meeting.status === 'scheduled' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                                    meeting.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                    'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                    {meeting.status === 'scheduled' ? 'مجدول' : 
                                     meeting.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                </span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    مشرف الاجتماع: {meeting.supervisor?.name || 'غير محدد'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Right Column: Details & Agendas */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Meeting Info Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">تفاصيل الاجتماع</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">تاريخ الاجتماع</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                {new Date(meeting.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">الوقت</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{meeting.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">النوع</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                {meeting.type === 'in_person' ? 'حضوري' : 'عن بعد (Online)'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">عدد المدعوين</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{meeting.participants.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Agendas */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">محاور الاجتماع</h3>
                                <ul className="space-y-3">
                                    {meeting.agendas?.map((agenda, idx) => (
                                        <li key={idx} className="flex gap-3">
                                            <div className="h-6 w-6 shrink-0 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
                                                {idx + 1}
                                            </div>
                                            <span className="text-slate-700 dark:text-slate-300 mt-0.5">{agenda}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Meeting Outcomes & Recommendations (For completion) */}
                            {(meeting.status === 'completed' || isSupervisor) && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">مخرجات وتوصيات الاجتماع</h3>
                                    
                                    {meeting.status === 'completed' ? (
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                                    <FileText size={16} className="text-primary-500" /> مخرجات الاجتماع
                                                </h4>
                                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm">
                                                    {meeting.outcomes}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                                    <CheckSquare size={16} className="text-emerald-500" /> التوصيات النهائية
                                                </h4>
                                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm">
                                                    {meeting.recommendations}
                                                </div>
                                            </div>
                                        </div>
                                    ) : isSupervisor ? (
                                        <form onSubmit={handleCompleteSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">مخرجات الاجتماع <span className="text-red-500">*</span></label>
                                                <textarea 
                                                    value={completionForm.data.outcomes}
                                                    onChange={e => completionForm.setData('outcomes', e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white custom-scrollbar"
                                                    rows="4"
                                                    required
                                                    placeholder="اكتب ما تم التوصل إليه خلال الاجتماع..."
                                                ></textarea>
                                                {completionForm.errors.outcomes && <p className="text-red-500 text-xs mt-1">{completionForm.errors.outcomes}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">التوصيات النهائية <span className="text-red-500">*</span></label>
                                                <textarea 
                                                    value={completionForm.data.recommendations}
                                                    onChange={e => completionForm.setData('recommendations', e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white custom-scrollbar"
                                                    rows="4"
                                                    required
                                                    placeholder="اكتب التوصيات أو القرارات النهائية..."
                                                ></textarea>
                                                {completionForm.errors.recommendations && <p className="text-red-500 text-xs mt-1">{completionForm.errors.recommendations}</p>}
                                            </div>
                                            <div className="pt-2">
                                                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl flex items-start gap-3 mb-4 text-sm">
                                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                                    <p>بمجرد إنهاء الاجتماع، لا يمكن تعديل المخرجات أو حالة الحضور. سيتم إغلاق الاجتماع واعتماده.</p>
                                                </div>
                                                <button 
                                                    type="submit" 
                                                    disabled={completionForm.processing}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-2"
                                                >
                                                    <CheckCircle size={20} />
                                                    إنهاء الاجتماع واعتماد المخرجات
                                                </button>
                                            </div>
                                        </form>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {/* Left Column: Attendance */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Users size={18} className="text-primary-500" /> الحضور
                                    </h3>
                                    <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-md text-xs font-bold">
                                        {meeting.participants.length}
                                    </span>
                                </div>
                                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                                    <form id="attendanceForm" onSubmit={handleAttendanceSubmit}>
                                        <div className="space-y-3">
                                            {meeting.participants.map((p, idx) => {
                                                const currentStatus = attendanceForm.data.participants.find(ap => ap.id === p.id)?.status || 'pending';
                                                
                                                return (
                                                    <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col gap-2">
                                                        <div className="flex justify-between items-center">
                                                            <div className="font-bold text-sm text-slate-800 dark:text-white">{p.user?.name}</div>
                                                            <div className="text-xs text-slate-500">{p.user?.employee?.job_grade?.name}</div>
                                                        </div>
                                                        
                                                        {isSupervisor && meeting.status === 'scheduled' ? (
                                                            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mt-1">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleAttendanceChange(p.id, 'attended')}
                                                                    className={`flex-1 py-1.5 text-xs font-bold flex justify-center items-center gap-1 transition-colors ${currentStatus === 'attended' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                                >
                                                                    <CheckCircle size={14} /> حاضر
                                                                </button>
                                                                <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleAttendanceChange(p.id, 'absent')}
                                                                    className={`flex-1 py-1.5 text-xs font-bold flex justify-center items-center gap-1 transition-colors ${currentStatus === 'absent' ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                                >
                                                                    <XCircle size={14} /> غائب
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-1">
                                                                {currentStatus === 'attended' ? (
                                                                    <span className="text-xs text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20 px-2 py-1 rounded flex items-center gap-1 w-fit">
                                                                        <CheckCircle size={12} /> حاضر
                                                                    </span>
                                                                ) : currentStatus === 'absent' ? (
                                                                    <span className="text-xs text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20 px-2 py-1 rounded flex items-center gap-1 w-fit">
                                                                        <XCircle size={12} /> غائب
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">
                                                                        لم يتم التحضير
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </form>
                                </div>
                                {isSupervisor && meeting.status === 'scheduled' && (
                                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                        <button 
                                            form="attendanceForm" 
                                            type="submit" 
                                            disabled={attendanceForm.processing || !attendanceForm.isDirty}
                                            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                        >
                                            حفظ التحضير
                                        </button>
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
