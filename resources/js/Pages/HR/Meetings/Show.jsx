import React, { useState, useEffect } from "react";
import { Head, useForm, Link, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Users, Calendar, Clock, MapPin, CheckCircle, CheckCircle2, XCircle, ChevronRight, FileText, CheckSquare, AlertCircle, PlayCircle, Printer, Square } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import RichTextEditor from '@/Components/RichTextEditor';

export default function MeetingShow({ auth, meeting, isSupervisor }) {
    const { logo_url } = usePage().props;
    const [activeTab, setActiveTab] = useState('overview');
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [liveTimer, setLiveTimer] = useState(0);
    const [liveAgendas, setLiveAgendas] = useState(meeting.agendas?.map(a => ({ text: a, completed: false })) || []);

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

    // Live Mode Timer
    useEffect(() => {
        let interval;
        if (isLiveMode) {
            interval = setInterval(() => {
                setLiveTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isLiveMode]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleLiveAgenda = (idx) => {
        const newAgendas = [...liveAgendas];
        newAgendas[idx].completed = !newAgendas[idx].completed;
        setLiveAgendas(newAgendas);
    };

    const handleCompleteSubmit = (e) => {
        e.preventDefault();
        completionForm.post(route('meetings.complete', meeting.id), {
            onSuccess: () => setIsLiveMode(false)
        });
    };

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

    const handlePrint = () => {
        window.print();
    };

    // Timeline calculations
    const createdAt = new Date(meeting.created_at);
    const scheduledAt = new Date(`${meeting.date}T${meeting.time}`);
    const updatedAt = new Date(meeting.updated_at);
    const isCompleted = meeting.status === 'completed';

    return (
        <AdminLayout user={auth.user}>
            <Head title={`الاجتماع: ${meeting.title}`} />
            
            {/* Print Styles */}
            <style>
                {`
                    @media print {
                        body * { visibility: hidden; }
                        #print-section, #print-section * { visibility: visible; }
                        #print-section { 
                            display: block !important; 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                            background: white; 
                            color: black; 
                            padding: 0; 
                            margin: 0; 
                        }
                        /* Fix pagination for absolute elements in Chrome */
                        html, body, #app { 
                            height: auto !important; 
                            min-height: auto !important; 
                            overflow: visible !important; 
                        }
                        .page-break { page-break-before: always; }
                        /* Ensure background colors print */
                        * { 
                            -webkit-print-color-adjust: exact !important; 
                            color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
                        }
                    }
                `}
            </style>

            {/* LIVE MEETING MODE OVERLAY */}
            {isLiveMode && (
                <div className="fixed inset-0 z-50 bg-[#0b1120] flex flex-col overflow-hidden text-white print:hidden">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <div className="relative flex items-center justify-center w-4 h-4">
                                <div className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></div>
                                <div className="relative w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight leading-tight">{meeting.title}</h2>
                                <p className="text-xs text-white/50 font-medium">اجتماع مباشر قيد الانعقاد</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-0.5">الوقت المنقضي</span>
                                <div className="text-4xl font-mono tracking-widest text-primary-400 font-bold leading-none">{formatTime(liveTimer)}</div>
                            </div>
                            <button onClick={() => setIsLiveMode(false)} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold transition-all border border-white/10 flex items-center gap-2">
                                <Square size={16} className="fill-white/20" /> تعليق الاجتماع
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex overflow-hidden">
                        {/* Live Agendas */}
                        <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar relative">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen opacity-50"></div>
                            
                            <div className="relative z-10 max-w-4xl mx-auto">
                                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-white">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                                        <CheckSquare size={24} />
                                    </div>
                                    محاور الاجتماع
                                </h3>
                                <div className="space-y-4">
                                    {liveAgendas.map((agenda, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => toggleLiveAgenda(idx)}
                                            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-start gap-5 ${agenda.completed ? 'bg-primary-500/10 border-primary-500/30 shadow-[0_0_30px_-5px_rgba(34,197,94,0.1)] translate-x-2' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${agenda.completed ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-white/10 text-white/50'}`}>
                                                {agenda.completed ? <CheckCircle2 size={24} /> : <span className="font-bold text-lg">{idx + 1}</span>}
                                            </div>
                                            <p className={`text-xl font-medium leading-relaxed pt-1 transition-all duration-300 ${agenda.completed ? 'text-primary-100 line-through opacity-75' : 'text-white'}`}>
                                                {agenda.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Live Attendance */}
                        <div className="w-[400px] bg-[#0f172a] border-r border-white/5 flex flex-col overflow-hidden relative shadow-2xl z-20">
                            <div className="p-6 border-b border-white/5 bg-white/5">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                                    <Users size={20} className="text-blue-400" />
                                    التحضير المباشر
                                </h3>
                                <div className="mt-4 flex gap-2">
                                    <div className="flex-1 bg-primary-500/20 border border-primary-500/30 rounded-xl p-3 text-center">
                                        <div className="text-xl font-black text-primary-400">{attendanceForm.data.participants.filter(p => p.status === 'attended').length}</div>
                                        <div className="text-[10px] font-bold text-primary-200/50 uppercase tracking-wider">حضور</div>
                                    </div>
                                    <div className="flex-1 bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-center">
                                        <div className="text-xl font-black text-red-400">{attendanceForm.data.participants.filter(p => p.status === 'absent').length}</div>
                                        <div className="text-[10px] font-bold text-red-200/50 uppercase tracking-wider">غياب</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                <ul className="space-y-3">
                                    {meeting.participants.map((p) => {
                                        const currentStatus = attendanceForm.data.participants.find(ap => ap.id === p.id)?.status || 'pending';
                                        return (
                                            <li key={p.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {p.user?.name.charAt(0)}
                                                    </div>
                                                    <div className="font-bold text-sm text-white truncate">{p.user?.name}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleAttendanceChange(p.id, 'attended')} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${currentStatus === 'attended' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 border border-primary-400' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-transparent'}`}>حضر</button>
                                                    <button onClick={() => handleAttendanceChange(p.id, 'absent')} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${currentStatus === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 border border-red-400' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-transparent'}`}>غاب</button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            <div className="p-6 bg-[#0f172a] border-t border-white/5">
                                <button onClick={() => { setIsLiveMode(false); setActiveTab('outcomes'); }} className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 text-lg group">
                                    <CheckCircle size={22} className="group-hover:scale-110 transition-transform" /> إنهاء وتدوين المخرجات
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NORMAL VIEW */}
            <div className="p-6 print:hidden">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Premium Header */}
                    <div className="relative overflow-hidden bg-white dark:bg-dark-900 border border-dark-200/60 dark:border-dark-800 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-dark-200/20 dark:shadow-none">
                        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div className="relative z-10">
                            <Link href={route('meetings.index')} className="inline-flex items-center gap-2 text-sm font-bold text-dark-500 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors mb-6 bg-dark-50 dark:bg-dark-800/50 hover:bg-dark-100 dark:hover:bg-dark-700 px-4 py-2 rounded-xl border border-dark-200/50 dark:border-dark-700 w-fit backdrop-blur-sm">
                                <ChevronRight size={16} /> العودة للقائمة
                            </Link>
                            
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                                            meeting.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 shadow-blue-500/10' :
                                            meeting.status === 'completed' ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800 shadow-primary-500/10' :
                                            'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 shadow-red-500/10'
                                        }`}>
                                            {meeting.status === 'scheduled' && <Clock size={14} className="animate-pulse" />}
                                            {meeting.status === 'completed' && <CheckCircle size={14} />}
                                            {meeting.status === 'cancelled' && <XCircle size={14} />}
                                            {meeting.status === 'scheduled' ? 'مجدول وقادم' : 
                                             meeting.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black text-dark-900 dark:text-white tracking-tight mb-4 leading-tight">
                                        {meeting.title}
                                    </h1>
                                    <div className="flex items-center gap-2 text-dark-600 dark:text-dark-300 font-bold bg-dark-50 dark:bg-dark-800/50 px-4 py-2 rounded-xl border border-dark-200/50 dark:border-dark-700/50 w-fit">
                                        <Users size={16} className="text-primary-500" />
                                        المشرف المسؤول: <span className="text-dark-900 dark:text-white">{meeting.supervisor?.name || 'غير محدد'}</span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-3 shrink-0 pt-4 md:pt-0 border-t border-dark-100 dark:border-dark-800 md:border-0 mt-4 md:mt-0">
                                    <button onClick={handlePrint} className="bg-white dark:bg-dark-800 text-dark-700 dark:text-dark-200 border border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600 hover:bg-dark-50 dark:hover:bg-dark-700 px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <Printer size={18} /> طباعة التقرير
                                    </button>
                                    {isSupervisor && meeting.status === 'scheduled' && (
                                        <button onClick={() => setIsLiveMode(true)} className="flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-l from-primary-600 to-primary-500 text-white rounded-2xl hover:from-primary-500 hover:to-primary-400 shadow-lg shadow-primary-500/30 text-sm font-black transition-all active:scale-95 group">
                                            <PlayCircle size={22} className="group-hover:scale-110 transition-transform" /> بدء الاجتماع المباشر
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modern Tabs Navigation (Segmented Control) */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex bg-dark-100/50 dark:bg-dark-900/50 p-1.5 rounded-2xl border border-dark-200/50 dark:border-dark-800 backdrop-blur-md overflow-x-auto max-w-full custom-scrollbar">
                            <button 
                                onClick={() => setActiveTab('overview')} 
                                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === 'overview' ? 'bg-white dark:bg-dark-800 text-primary-600 shadow-sm' : 'text-dark-500 hover:text-dark-900 dark:text-dark-400 dark:hover:text-white hover:bg-dark-200/50 dark:hover:bg-dark-700/50'}`}
                            >
                                <AlertCircle size={16} className={activeTab === 'overview' ? 'text-primary-500' : ''} />
                                نظرة عامة والخط الزمني
                            </button>
                            <button 
                                onClick={() => setActiveTab('agenda')} 
                                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === 'agenda' ? 'bg-white dark:bg-dark-800 text-primary-600 shadow-sm' : 'text-dark-500 hover:text-dark-900 dark:text-dark-400 dark:hover:text-white hover:bg-dark-200/50 dark:hover:bg-dark-700/50'}`}
                            >
                                <CheckSquare size={16} className={activeTab === 'agenda' ? 'text-primary-500' : ''} />
                                الأجندة والمحاور
                            </button>
                            <button 
                                onClick={() => setActiveTab('outcomes')} 
                                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === 'outcomes' ? 'bg-white dark:bg-dark-800 text-primary-600 shadow-sm' : 'text-dark-500 hover:text-dark-900 dark:text-dark-400 dark:hover:text-white hover:bg-dark-200/50 dark:hover:bg-dark-700/50'}`}
                            >
                                <FileText size={16} className={activeTab === 'outcomes' ? 'text-primary-500' : ''} />
                                المخرجات والتوصيات
                                {meeting.status === 'completed' && <div className="w-2 h-2 rounded-full bg-primary-500"></div>}
                            </button>
                        </div>
                    </div>

                    {/* Tabs Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Main Content Area */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <>
                                    {/* Info Grid (Smart Widgets) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="bg-white dark:bg-dark-900 p-6 rounded-[2rem] border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                                            <div className="flex items-start gap-5">
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform"><Calendar size={24} /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-1.5">تاريخ الاجتماع</p>
                                                    <p className="text-lg font-black text-dark-900 dark:text-white leading-tight">{new Date(meeting.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-dark-900 p-6 rounded-[2rem] border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                                            <div className="flex items-start gap-5">
                                                <div className="p-4 bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 rounded-2xl group-hover:scale-110 transition-transform"><Clock size={24} /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-1.5">وقت الاجتماع</p>
                                                    <p className="text-lg font-black text-dark-900 dark:text-white leading-tight">{meeting.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-dark-900 p-6 rounded-[2rem] border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                                            <div className="flex items-start gap-5">
                                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform"><MapPin size={24} /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-1.5">طريقة الحضور</p>
                                                    <p className="text-lg font-black text-dark-900 dark:text-white leading-tight">{meeting.type === 'in_person' ? 'حضوري' : 'عن بعد (Online)'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-dark-900 p-6 rounded-[2rem] border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                                            <div className="flex items-start gap-5">
                                                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-2xl group-hover:scale-110 transition-transform"><Users size={24} /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-1.5">عدد المدعوين</p>
                                                    <p className="text-lg font-black text-dark-900 dark:text-white leading-tight">{meeting.participants.length} <span className="text-sm font-medium text-dark-500">مشارك/مدعو</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Agenda Timeline */}
                                    <div className="bg-white dark:bg-dark-900 rounded-[2rem] p-8 md:p-10 border border-dark-100 dark:border-dark-800 shadow-sm">
                                        <h3 className="text-xl font-black text-dark-900 dark:text-white mb-8 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-dark-50 dark:bg-dark-800 flex items-center justify-center text-dark-500 dark:text-dark-400">
                                                <Clock size={20} />
                                            </div>
                                            الخط الزمني للاجتماع
                                        </h3>
                                        <div className="relative border-r-2 border-dark-100 dark:border-dark-800 pr-8 ml-4 space-y-10">
                                            <div className="relative group">
                                                <span className="absolute -right-[43px] top-1 w-6 h-6 rounded-full bg-white dark:bg-dark-900 border-4 border-dark-200 dark:border-dark-700 shadow-sm group-hover:border-primary-400 transition-colors"></span>
                                                <p className="font-bold text-base text-dark-900 dark:text-white">تم إنشاء الاجتماع</p>
                                                <p className="text-sm font-medium text-dark-500 mt-1">{createdAt.toLocaleString('ar-EG')}</p>
                                            </div>
                                            <div className="relative group">
                                                <span className={`absolute -right-[43px] top-1 w-6 h-6 rounded-full bg-white dark:bg-dark-900 border-4 shadow-sm transition-colors ${meeting.status === 'scheduled' ? 'border-primary-500 shadow-primary-500/20 shadow-lg' : 'border-dark-200 dark:border-dark-700 group-hover:border-primary-400'}`}></span>
                                                {meeting.status === 'scheduled' && <span className="absolute -right-[43px] top-1 w-6 h-6 rounded-full bg-primary-500 opacity-20 animate-ping"></span>}
                                                <p className="font-bold text-base text-dark-900 dark:text-white">موعد البدء المجدول</p>
                                                <p className="text-sm font-medium text-dark-500 mt-1">{scheduledAt.toLocaleString('ar-EG')}</p>
                                            </div>
                                            {isCompleted && (
                                                <div className="relative group">
                                                    <span className="absolute -right-[43px] top-1 w-6 h-6 rounded-full bg-white dark:bg-dark-900 border-4 border-primary-500 shadow-sm"></span>
                                                    <p className="font-bold text-base text-primary-700 dark:text-primary-400">تم اعتماد المخرجات وإغلاق الاجتماع</p>
                                                    <p className="text-sm font-medium text-dark-500 mt-1">{updatedAt.toLocaleString('ar-EG')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* AGENDA TAB */}
                            {activeTab === 'agenda' && (
                                <div className="bg-white dark:bg-dark-900 rounded-[2rem] p-8 md:p-10 border border-dark-100 dark:border-dark-800 shadow-sm">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                                            <CheckSquare size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-dark-900 dark:text-white leading-tight">المحاور المدرجة للأجندة</h3>
                                            <p className="text-sm font-medium text-dark-500 mt-1">النقاط التي سيتم مناقشتها خلال الاجتماع</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 relative before:absolute before:inset-y-0 before:right-6 before:w-0.5 before:bg-dark-100 dark:before:bg-dark-800 before:-z-10">
                                        {meeting.agendas?.map((agenda, idx) => (
                                            <div key={idx} className="flex gap-5 items-start group relative">
                                                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-dark-900 border-2 border-dark-200 dark:border-dark-700 flex items-center justify-center text-lg font-black text-dark-400 group-hover:border-primary-500 group-hover:text-primary-600 transition-colors shadow-sm relative z-10">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 bg-dark-50 dark:bg-dark-800/50 hover:bg-dark-100 dark:hover:bg-dark-800 p-5 rounded-2xl border border-dark-100 dark:border-dark-700/50 transition-colors">
                                                    <p className="text-dark-700 dark:text-dark-200 text-base font-medium leading-relaxed">{agenda}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* OUTCOMES TAB */}
                            {activeTab === 'outcomes' && (
                                <div className="bg-white dark:bg-dark-900 rounded-[2rem] p-8 md:p-10 border border-dark-100 dark:border-dark-800 shadow-sm">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-accent-900/20 text-accent-600 flex items-center justify-center">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-dark-900 dark:text-white leading-tight">التوثيق والمخرجات</h3>
                                            <p className="text-sm font-medium text-dark-500 mt-1">ما تم التوصل إليه والتوصيات النهائية</p>
                                        </div>
                                    </div>
                                    
                                    {isCompleted ? (
                                        <div className="space-y-8">
                                            <div className="relative">
                                                <div className="absolute -right-4 top-0 bottom-0 w-1 bg-primary-500 rounded-full"></div>
                                                <div className="bg-gradient-to-l from-primary-50/50 to-transparent dark:from-primary-900/10 rounded-2xl p-6 border border-dark-100 dark:border-dark-800">
                                                    <h4 className="text-sm font-black text-dark-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                                        <CheckCircle2 size={18} className="text-primary-600" />
                                                        مخرجات الاجتماع
                                                    </h4>
                                                    <div className="text-dark-700 dark:text-dark-300 text-base leading-relaxed">
                                                        <RichTextEditor readOnly value={meeting.outcomes} />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="relative">
                                                <div className="absolute -right-4 top-0 bottom-0 w-1 bg-accent-500 rounded-full"></div>
                                                <div className="bg-gradient-to-l from-accent-50/50 to-transparent dark:from-accent-900/10 rounded-2xl p-6 border border-dark-100 dark:border-dark-800">
                                                    <h4 className="text-sm font-black text-dark-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                                        <AlertCircle size={18} className="text-accent-600" />
                                                        التوصيات النهائية
                                                    </h4>
                                                    <div className="text-dark-700 dark:text-dark-300 text-base leading-relaxed">
                                                        <RichTextEditor readOnly value={meeting.recommendations} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : isSupervisor ? (
                                        <form onSubmit={handleCompleteSubmit} className="space-y-8">
                                            <div>
                                                <label className="block text-sm font-black text-dark-800 dark:text-dark-200 mb-3">مخرجات الاجتماع <span className="text-red-500">*</span></label>
                                                <RichTextEditor 
                                                    value={completionForm.data.outcomes}
                                                    onChange={val => completionForm.setData('outcomes', val)}
                                                    placeholder="اكتب ما تم التوصل إليه بشكل مفصل..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-black text-dark-800 dark:text-dark-200 mb-3">التوصيات <span className="text-red-500">*</span></label>
                                                <RichTextEditor 
                                                    value={completionForm.data.recommendations}
                                                    onChange={val => completionForm.setData('recommendations', val)}
                                                    placeholder="اكتب التوصيات الخاصة بهذا الاجتماع..."
                                                />
                                            </div>
                                            <div className="pt-4 border-t border-dark-100 dark:border-dark-800">
                                                <button type="submit" disabled={completionForm.processing} className="w-full bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-6 py-4 rounded-2xl font-black transition-all flex justify-center items-center gap-3 shadow-lg shadow-primary-500/20 text-lg disabled:opacity-50">
                                                    <CheckCircle size={24} /> إنهاء الاجتماع واعتماد المخرجات بشكل نهائي
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="text-center py-16 bg-dark-50 dark:bg-dark-800/50 rounded-3xl border-2 border-dashed border-dark-200 dark:border-dark-700">
                                            <div className="w-20 h-20 bg-white dark:bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                                <Clock size={36} className="text-dark-300 dark:text-dark-600 animate-pulse" />
                                            </div>
                                            <h4 className="text-lg font-black text-dark-800 dark:text-white mb-2">الاجتماع لم يكتمل بعد</h4>
                                            <p className="text-dark-500 font-medium max-w-md mx-auto">ستظهر المخرجات والتوصيات هنا فور اعتمادها وإغلاق الاجتماع من قبل المشرف.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Sidebar: Attendance */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-dark-900 rounded-[2rem] border border-dark-100 dark:border-dark-800 shadow-sm flex flex-col h-full sticky top-[90px] overflow-hidden">
                                <div className="p-6 border-b border-dark-100 dark:border-dark-800 flex justify-between items-center bg-dark-50 dark:bg-dark-800/30">
                                    <h3 className="text-lg font-black text-dark-900 dark:text-white flex items-center gap-2">
                                        <Users size={20} className="text-primary-500" /> قائمة الحضور
                                    </h3>
                                    <span className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-3 py-1 rounded-lg text-xs font-bold border border-primary-100 dark:border-primary-800 shadow-sm">
                                        {meeting.participants.length} مشارك
                                    </span>
                                </div>
                                
                                {/* Visual Summary Bar */}
                                <div className="px-6 pt-6">
                                    <div className="flex gap-2 mb-2 text-xs font-bold uppercase tracking-wider">
                                        <div className="flex-1 text-primary-600">حضور ({attendanceForm.data.participants.filter(p => p.status === 'attended').length})</div>
                                        <div className="text-red-500 text-left">غياب ({attendanceForm.data.participants.filter(p => p.status === 'absent').length})</div>
                                    </div>
                                    <div className="h-2 flex rounded-full overflow-hidden bg-dark-100 dark:bg-dark-800">
                                        <div 
                                            className="bg-primary-500 h-full transition-all duration-500" 
                                            style={{ width: `${(attendanceForm.data.participants.filter(p => p.status === 'attended').length / Math.max(meeting.participants.length, 1)) * 100}%` }}
                                        />
                                        <div 
                                            className="bg-red-500 h-full transition-all duration-500" 
                                            style={{ width: `${(attendanceForm.data.participants.filter(p => p.status === 'absent').length / Math.max(meeting.participants.length, 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[600px] p-4 mt-2">
                                    <form id="attendanceForm" onSubmit={handleAttendanceSubmit}>
                                        <ul className="space-y-2">
                                            {meeting.participants.map((p) => {
                                                const currentStatus = attendanceForm.data.participants.find(ap => ap.id === p.id)?.status || 'pending';
                                                return (
                                                    <li key={p.id} className="p-4 hover:bg-dark-50 dark:hover:bg-dark-800 rounded-2xl flex flex-col gap-3 transition-colors border border-transparent hover:border-dark-100 dark:hover:border-dark-700 group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 flex items-center justify-center font-black text-sm shrink-0 border border-primary-200 dark:border-primary-800 shadow-sm">
                                                                {p.user?.name?.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-sm text-dark-900 dark:text-white truncate">{p.user?.name}</div>
                                                                <div className="text-xs text-dark-500 dark:text-dark-400 truncate mt-0.5">{p.user?.employee?.job_grade?.name || 'موظف'}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        {isSupervisor && meeting.status === 'scheduled' ? (
                                                            <div className="flex gap-2 w-full pl-1">
                                                                <button type="button" onClick={() => handleAttendanceChange(p.id, 'attended')} className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex justify-center items-center gap-1.5 transition-all border ${currentStatus === 'attended' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-primary-300 dark:border-primary-700 shadow-sm' : 'bg-white dark:bg-dark-900 text-dark-500 dark:text-dark-400 border-dark-200 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-800'}`}>
                                                                    <CheckCircle size={14} /> حضر
                                                                </button>
                                                                <button type="button" onClick={() => handleAttendanceChange(p.id, 'absent')} className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex justify-center items-center gap-1.5 transition-all border ${currentStatus === 'absent' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 shadow-sm' : 'bg-white dark:bg-dark-900 text-dark-500 dark:text-dark-400 border-dark-200 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-800'}`}>
                                                                    <XCircle size={14} /> غاب
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="pl-1 flex">
                                                                {currentStatus === 'attended' ? (
                                                                    <span className="text-[11px] font-black tracking-wider text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm"><CheckCircle size={12} /> حاضـر</span>
                                                                ) : currentStatus === 'absent' ? (
                                                                    <span className="text-[11px] font-black tracking-wider text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm"><XCircle size={12} /> غائـب</span>
                                                                ) : (
                                                                    <span className="text-[11px] font-black tracking-wider text-dark-500 dark:text-dark-400 bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm"><Clock size={12} /> قيد الانتظار</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </form>
                                </div>
                                {isSupervisor && meeting.status === 'scheduled' && (
                                    <div className="p-5 border-t border-dark-100 dark:border-dark-800 bg-dark-50 dark:bg-dark-900/50">
                                        <button form="attendanceForm" type="submit" disabled={attendanceForm.processing || !attendanceForm.isDirty} className="w-full bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white py-3.5 rounded-xl text-sm font-black transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2">
                                            <CheckCircle size={18} /> اعتماد سجل الحضور
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRINT ONLY SECTION */}
            <div id="print-section" className="hidden print:block">
                <div className="max-w-4xl mx-auto font-sans bg-white" dir="rtl">
                    {/* Header: Logo, Title, System Info */}
                    <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-primary-800 relative">
                        <div className="absolute -bottom-[2px] right-0 w-1/3 h-[2px] bg-accent-500"></div>
                        <div className="flex items-center gap-4">
                            {logo_url ? (
                                <img src={logo_url} alt="Logo" className="h-20 w-auto object-contain" />
                            ) : (
                                <div className="h-20 w-20 bg-primary-100 rounded-xl flex items-center justify-center border-2 border-primary-800">
                                    <span className="text-primary-800 font-black text-xs text-center">شعار<br/>المدرسة</span>
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl font-black text-primary-900 mb-1">مدارس القيم الأهلية</h1>
                                <p className="text-sm font-bold text-accent-600">إدارة الموارد البشرية - سجل الاجتماعات</p>
                            </div>
                        </div>
                        <div className="text-left bg-primary-50 p-3 rounded-lg border border-primary-100">
                            <p className="text-sm font-bold text-primary-800 mb-1">تاريخ الطباعة: <span className="text-primary-950">{new Date().toLocaleDateString('ar-EG')}</span></p>
                            <p className="text-sm font-bold text-primary-800">رقم المرجع: <span className="text-primary-950 font-mono">MTG-{meeting.id.toString().padStart(4, '0')}</span></p>
                        </div>
                    </div>
                    
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black mb-3 text-primary-900 underline decoration-2 decoration-accent-500 underline-offset-8">محضر اجتماع رسمــــي</h2>
                        <h3 className="text-xl font-bold text-primary-800 bg-primary-50 inline-block px-8 py-3 rounded-xl border border-primary-200 shadow-sm">{meeting.title}</h3>
                    </div>

                    {/* Metadata Table */}
                    <table className="w-full border-collapse border-2 border-primary-800 mb-8 text-right">
                        <tbody>
                            <tr>
                                <th className="border-2 border-primary-800 bg-primary-50 p-3 font-bold text-primary-900 w-1/4">رئيس الاجتماع</th>
                                <td className="border-2 border-primary-800 p-3 font-bold text-slate-800">{meeting.supervisor?.name}</td>
                                <th className="border-2 border-primary-800 bg-primary-50 p-3 font-bold text-primary-900 w-1/4">مقرر الاجتماع</th>
                                <td className="border-2 border-primary-800 p-3 font-bold text-slate-500">نظام الإدارة الذكية</td>
                            </tr>
                            <tr>
                                <th className="border-2 border-primary-800 bg-primary-50 p-3 font-bold text-primary-900">التاريخ</th>
                                <td className="border-2 border-primary-800 p-3 font-bold text-slate-800">{meeting.date}</td>
                                <th className="border-2 border-primary-800 bg-primary-50 p-3 font-bold text-primary-900">الوقت</th>
                                <td className="border-2 border-primary-800 p-3 font-bold text-slate-800">{meeting.time}</td>
                            </tr>
                            <tr>
                                <th className="border-2 border-primary-800 bg-primary-50 p-3 font-bold text-primary-900">نوع الاجتماع</th>
                                <td className="border-2 border-primary-800 p-3 font-bold text-slate-800">{meeting.type === 'in_person' ? 'حضوري' : 'عن بعد'}</td>
                                <th className="border-2 border-primary-800 bg-primary-50 p-3 font-bold text-primary-900">حالة الاجتماع</th>
                                <td className="border-2 border-primary-800 p-3 font-bold text-slate-800">{meeting.status === 'completed' ? 'مكتمل ومعتمد' : 'مجدول'}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Agenda */}
                    <div className="mb-8">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-primary-900"><span className="w-8 h-8 bg-primary-800 text-accent-400 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">1</span> جدول الأعمال (الأجندة)</h3>
                        <div className="border-2 border-primary-200 rounded-xl p-6 bg-primary-50/50">
                            <ul className="list-decimal list-inside space-y-3 font-bold text-lg text-slate-800">
                                {meeting.agendas?.map((agenda, idx) => (
                                    <li key={idx} className="pb-3 border-b border-primary-100 last:border-0 last:pb-0">{agenda}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Attendance Stats & Table */}
                    <div className="mb-8 page-break-inside-avoid">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-primary-900"><span className="w-8 h-8 bg-primary-800 text-accent-400 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">2</span> إحصائيات وسجل الحضور</h3>
                        
                        <div className="flex gap-4 mb-4">
                            <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-2 flex-1 text-center">
                                <span className="block text-sm font-bold text-primary-700">إجمالي المدعوين</span>
                                <span className="block text-2xl font-black text-primary-900">{meeting.participants.length}</span>
                            </div>
                            <div className="bg-primary-600 border border-primary-700 rounded-lg px-4 py-2 flex-1 text-center text-white">
                                <span className="block text-sm font-bold text-primary-100">الحضور</span>
                                <span className="block text-2xl font-black">{meeting.participants.filter(p => p.attendance_status === 'attended').length}</span>
                            </div>
                            <div className="bg-accent-50 border border-accent-200 rounded-lg px-4 py-2 flex-1 text-center">
                                <span className="block text-sm font-bold text-accent-700">الغياب</span>
                                <span className="block text-2xl font-black text-accent-600">{meeting.participants.filter(p => p.attendance_status === 'absent').length}</span>
                            </div>
                        </div>

                        <table className="w-full border-collapse border-2 border-primary-800 text-right bg-white">
                            <thead>
                                <tr className="bg-primary-800 text-white">
                                    <th className="border-2 border-primary-800 p-3 font-bold w-12 text-center">م</th>
                                    <th className="border-2 border-primary-800 p-3 font-bold">الاسم</th>
                                    <th className="border-2 border-primary-800 p-3 font-bold">المسمى الوظيفي</th>
                                    <th className="border-2 border-primary-800 p-3 font-bold text-center">الحالة</th>
                                    <th className="border-2 border-primary-800 p-3 font-bold text-center w-32">التوقيع</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meeting.participants.map((p, idx) => (
                                    <tr key={p.id} className="border-b border-primary-200">
                                        <td className="border-2 border-primary-800 p-3 text-center font-bold text-primary-900">{idx + 1}</td>
                                        <td className="border-2 border-primary-800 p-3 font-bold text-slate-800">{p.user?.name}</td>
                                        <td className="border-2 border-primary-800 p-3 font-semibold text-slate-600">{p.user?.employee?.job_grade?.name || '-'}</td>
                                        <td className="border-2 border-primary-800 p-3 text-center font-bold text-slate-700">
                                            {p.attendance_status === 'attended' ? 'حاضر' : p.attendance_status === 'absent' ? 'غائب' : 'لم يحدد'}
                                        </td>
                                        <td className="border-2 border-primary-800 p-3"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Outcomes & Recommendations */}
                    {isCompleted && (
                        <div className="page-break">
                            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-primary-900"><span className="w-8 h-8 bg-primary-800 text-accent-400 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">3</span> القرارات والمخرجات</h3>
                            <div className="border-2 border-primary-800 rounded-xl p-6 bg-white mb-8 min-h-[150px] shadow-sm">
                                <div className="prose max-w-none print:prose-primary text-slate-800" dangerouslySetInnerHTML={{ __html: meeting.outcomes || '<p className="text-slate-400 italic">لا توجد مخرجات مسجلة.</p>' }} />
                            </div>
                            
                            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-primary-900"><span className="w-8 h-8 bg-primary-800 text-accent-400 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">4</span> التوصيات</h3>
                            <div className="border-2 border-primary-800 rounded-xl p-6 bg-primary-50/50 min-h-[150px] shadow-sm">
                                <div className="prose max-w-none print:prose-primary text-slate-800" dangerouslySetInnerHTML={{ __html: meeting.recommendations || '<p className="text-slate-400 italic">لا توجد توصيات مسجلة.</p>' }} />
                            </div>
                        </div>
                    )}

                    {/* Signatures */}
                    <div className="mt-16 pt-8 border-t-4 border-primary-800 page-break-inside-avoid relative">
                        <div className="absolute top-0 right-0 w-1/3 h-[2px] bg-accent-500"></div>
                        <h4 className="text-xl font-black mb-8 text-center text-primary-900">الاعتمــــــــــادات</h4>
                        <div className="grid grid-cols-3 gap-8">
                            <div className="text-center">
                                <p className="font-bold mb-10 text-primary-900">مقرر الاجتماع</p>
                                <p className="font-bold text-slate-500">نظام الإدارة الذكية</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold mb-10 text-primary-900">رئيس الاجتماع</p>
                                <p className="font-bold text-slate-800">{meeting.supervisor?.name}</p>
                                <div className="mt-2 text-slate-400">........................</div>
                            </div>
                            <div className="text-center">
                                <p className="font-bold mb-10 text-primary-900">مدير المدارس (للاعتماد)</p>
                                <div className="mt-8 text-slate-400">........................</div>
                            </div>
                        </div>
                        <div className="mt-12 flex justify-center">
                            <div className="w-48 h-48 border-4 border-dashed border-accent-300 rounded-full flex items-center justify-center text-accent-500/70 font-black text-xl transform -rotate-12 bg-accent-50/30">
                                ختم المدارس
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t-2 border-emerald-100 flex justify-between items-center text-xs font-bold text-slate-500 print:fixed print:bottom-4 print:w-[calc(100%-4rem)]">
                        <span>صدر آلياً من نظام الإدارة الذكية - مدارس القيم الأهلية</span>
                        <span>الصفحة 1 من 1</span>
                    </div>
                </div>
            </div>

        </AdminLayout>
    );
}
