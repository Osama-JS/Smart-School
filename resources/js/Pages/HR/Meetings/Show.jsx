import React, { useState, useEffect } from "react";
import { Head, useForm, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Users, Calendar, Clock, MapPin, CheckCircle, X, ChevronRight, FileText, CheckSquare, XCircle, AlertCircle, Edit, Trash2, Bell, PlusCircle, Mail, Smartphone } from "lucide-react";
import FlatpickrInput from "@/Components/FlatpickrInput";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Select from "react-select";

export default function MeetingShow({ auth, meeting, isSupervisor, users }) {
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
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Link href={route('meetings.index')} className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors shadow-sm hover:shadow">
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
                                        إشراف: <span className="font-bold text-slate-700 dark:text-slate-300">{meeting.supervisor?.name || 'غير محدد'}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions have been moved to the Meetings Index page */}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Right Column: Details & Agendas */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Meeting Info Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 relative z-10 flex items-center gap-2">
                                    <FileText size={20} className="text-primary-500" />
                                    تفاصيل الاجتماع
                                </h3>
                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors hover:border-blue-200 dark:hover:border-blue-800">
                                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">التاريخ</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">
                                                {new Date(meeting.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors hover:border-amber-200 dark:hover:border-amber-800">
                                        <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">الوقت</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{meeting.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors hover:border-purple-200 dark:hover:border-purple-800">
                                        <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">النوع</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">
                                                {meeting.type === 'in_person' ? 'حضوري' : 'عن بعد (Online)'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors hover:border-emerald-200 dark:hover:border-emerald-800">
                                        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">المدعوين</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{meeting.participants.length} شخص</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Agendas */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <CheckSquare size={20} className="text-primary-500" />
                                    محاور الاجتماع
                                </h3>
                                <ul className="space-y-3">
                                    {meeting.agendas?.map((agenda, idx) => (
                                        <li key={idx} className="flex gap-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                                            <div className="h-6 w-6 shrink-0 rounded-lg bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold shadow-sm border border-slate-200 dark:border-slate-700">
                                                {idx + 1}
                                            </div>
                                            <span className="text-slate-700 dark:text-slate-300 mt-0.5 text-sm font-medium">{agenda}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Meeting Outcomes & Recommendations (For completion) */}
                            {(meeting.status === 'completed' || isSupervisor) && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                        <FileText size={20} className="text-primary-500" />
                                        مخرجات وتوصيات الاجتماع
                                    </h3>
                                    
                                    {meeting.status === 'completed' ? (
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center"><CheckCircle size={14}/></div> 
                                                    مخرجات الاجتماع
                                                </h4>
                                                <div 
                                                    className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm prose dark:prose-invert max-w-none shadow-inner"
                                                    dangerouslySetInnerHTML={{ __html: meeting.outcomes }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center"><AlertCircle size={14}/></div> 
                                                    التوصيات النهائية
                                                </h4>
                                                <div 
                                                    className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm prose dark:prose-invert max-w-none shadow-inner"
                                                    dangerouslySetInnerHTML={{ __html: meeting.recommendations }}
                                                />
                                            </div>
                                        </div>
                                    ) : isSupervisor ? (
                                        <form onSubmit={handleCompleteSubmit} className="space-y-4">
                                            <div className="mb-8">
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">مخرجات الاجتماع <span className="text-red-500">*</span></label>
                                                <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                                    <ReactQuill 
                                                        theme="snow"
                                                        value={completionForm.data.outcomes}
                                                        onChange={val => completionForm.setData('outcomes', val)}
                                                        className="h-40 [&_.ql-container]:min-h-[160px] [&_.ql-editor]:text-slate-800 dark:[&_.ql-editor]:text-white dark:[&_.ql-toolbar]:border-slate-700 dark:[&_.ql-container]:border-slate-700 dark:[&_.ql-picker]:text-slate-300 dark:[&_.ql-stroke]:stroke-slate-300"
                                                        placeholder="اكتب ما تم التوصل إليه خلال الاجتماع..."
                                                    />
                                                </div>
                                                {completionForm.errors.outcomes && <p className="text-red-500 text-xs mt-1">{completionForm.errors.outcomes}</p>}
                                            </div>
                                            <div className="mb-8">
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">التوصيات النهائية <span className="text-red-500">*</span></label>
                                                <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                                    <ReactQuill 
                                                        theme="snow"
                                                        value={completionForm.data.recommendations}
                                                        onChange={val => completionForm.setData('recommendations', val)}
                                                        className="h-40 [&_.ql-container]:min-h-[160px] [&_.ql-editor]:text-slate-800 dark:[&_.ql-editor]:text-white dark:[&_.ql-toolbar]:border-slate-700 dark:[&_.ql-container]:border-slate-700 dark:[&_.ql-picker]:text-slate-300 dark:[&_.ql-stroke]:stroke-slate-300"
                                                        placeholder="اكتب التوصيات أو القرارات النهائية..."
                                                    />
                                                </div>
                                                {completionForm.errors.recommendations && <p className="text-red-500 text-xs mt-1">{completionForm.errors.recommendations}</p>}
                                            </div>
                                            <div className="pt-2">
                                                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl flex items-start gap-3 mb-4 text-sm border border-blue-100 dark:border-blue-800">
                                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                                    <p>بمجرد إنهاء الاجتماع، لا يمكن تعديل المخرجات أو حالة الحضور. سيتم إغلاق الاجتماع واعتماده بشكل نهائي.</p>
                                                </div>
                                                <button 
                                                    type="submit" 
                                                    disabled={completionForm.processing}
                                                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-5 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-2 transform active:scale-[0.98]"
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
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full sticky top-6">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Users size={20} className="text-primary-500" /> الحضور
                                    </h3>
                                    <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-primary-200 dark:border-primary-800">
                                        {meeting.participants.length}
                                    </span>
                                </div>
                                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar max-h-[600px]">
                                    <form id="attendanceForm" onSubmit={handleAttendanceSubmit}>
                                        <div className="space-y-3">
                                            {meeting.participants.map((p, idx) => {
                                                const currentStatus = attendanceForm.data.participants.find(ap => ap.id === p.id)?.status || 'pending';
                                                
                                                return (
                                                    <div key={p.id} className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col gap-3 shadow-sm hover:border-primary-200 transition-colors">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-bold text-sm text-slate-800 dark:text-white">{p.user?.name}</div>
                                                                <div className="text-xs text-slate-500 mt-0.5">{p.user?.employee?.job_grade?.name || 'موظف'}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        {isSupervisor && meeting.status === 'scheduled' ? (
                                                            <div className="flex bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden p-1 gap-1">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleAttendanceChange(p.id, 'attended')}
                                                                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold flex justify-center items-center gap-1.5 transition-all duration-200 ${currentStatus === 'attended' ? 'bg-emerald-500 text-white shadow-sm scale-100' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 scale-95 hover:scale-100'}`}
                                                                >
                                                                    <CheckCircle size={14} /> حاضر
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleAttendanceChange(p.id, 'absent')}
                                                                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold flex justify-center items-center gap-1.5 transition-all duration-200 ${currentStatus === 'absent' ? 'bg-red-500 text-white shadow-sm scale-100' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 scale-95 hover:scale-100'}`}
                                                                >
                                                                    <XCircle size={14} /> غائب
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex">
                                                                {currentStatus === 'attended' ? (
                                                                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 dark:border-emerald-900/50 dark:text-emerald-400 dark:bg-emerald-900/20 px-2 py-1 rounded-md flex items-center gap-1">
                                                                        <CheckCircle size={12} /> حاضر
                                                                    </span>
                                                                ) : currentStatus === 'absent' ? (
                                                                    <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 dark:border-red-900/50 dark:text-red-400 dark:bg-red-900/20 px-2 py-1 rounded-md flex items-center gap-1">
                                                                        <XCircle size={12} /> غائب
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 dark:border-slate-700 dark:text-slate-400 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
                                                                        <Clock size={12} /> بانتظار التحضير
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
                                            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-500/20 active:scale-[0.98]"
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

