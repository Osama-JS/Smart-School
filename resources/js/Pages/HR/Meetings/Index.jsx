import React, { useState } from "react";
import { Head, useForm, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Select from "react-select";
import SelectInput from "@/Components/SelectInput";
import { Plus, Trash2, X, Users, Calendar, Clock, MapPin, Eye, FileText, CheckCircle, Search, Filter, PlusCircle, ArrowUpRight, ArrowUpLeft, Bell, Mail, Smartphone, Edit, AlertCircle, LayoutGrid, List } from "lucide-react";
import FlatpickrInput from "@/Components/FlatpickrInput";

export default function MeetingsIndex({ auth, meetings, users, stats, filters }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [viewMode, setViewMode] = useState('grid');

    // Create Modal State & Form
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const createForm = useForm({
        title: '',
        date: '',
        time: '',
        type: 'in_person',
        agendas: [''],
        participants: [],
        notification_channels: ['system', 'mail']
    });

    // Edit Modal State & Form
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const editForm = useForm({
        title: '',
        date: '',
        time: '',
        type: 'in_person',
        agendas: [''],
        participants: [],
        notification_channels: ['system', 'mail']
    });

    // Remind Modal State & Form
    const [isRemindModalOpen, setIsRemindModalOpen] = useState(false);
    const remindForm = useForm({
        reminder_type: 'now',
        custom_message: '',
        notification_channels: ['system', 'mail']
    });

    // Cancel Modal State & Form
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const cancelForm = useForm({
        notification_channels: ['system', 'mail']
    });

    const userOptions = users.map(u => ({ value: u.id, label: `${u.name} ${u.employee?.job_grade?.name ? '- ' + u.employee.job_grade.name : ''}` }));

    const filteredMeetings = meetings.data;

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('meetings.index'), { search: searchQuery, status: statusFilter }, { preserveState: true });
    };

    const getStatusColor = (status) => {
        if (status === 'scheduled') return 'from-amber-400 to-amber-600';
        if (status === 'completed') return 'from-emerald-400 to-emerald-600';
        return 'from-red-400 to-red-600';
    };

    const getStatusBadgeColor = (status) => {
        if (status === 'scheduled') return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
        if (status === 'completed') return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
        return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    };

    const getStatusLabel = (status) => {
        if (status === 'scheduled') return 'مجدول';
        if (status === 'completed') return 'مكتمل';
        return 'ملغي';
    };

    const formatDateAr = (dateString) => {
        if (!dateString) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    };

    const formatTimeAr = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    // --- CREATE ACTIONS ---
    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post(route('meetings.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            }
        });
    };

    const addCreateAgenda = () => createForm.setData('agendas', [...createForm.data.agendas, '']);
    const updateCreateAgenda = (index, value) => {
        const newAgendas = [...createForm.data.agendas];
        newAgendas[index] = value;
        createForm.setData('agendas', newAgendas);
    };
    const removeCreateAgenda = (index) => {
        const newAgendas = [...createForm.data.agendas];
        newAgendas.splice(index, 1);
        createForm.setData('agendas', newAgendas);
    };

    const toggleCreateChannel = (channel) => {
        const current = createForm.data.notification_channels;
        createForm.setData('notification_channels', current.includes(channel) ? current.filter(c => c !== channel) : [...current, channel]);
    };

    // --- EDIT ACTIONS ---
    const openEditModal = (meeting) => {
        setSelectedMeeting(meeting);
        editForm.setData({
            title: meeting.title,
            date: meeting.date,
            time: meeting.time,
            type: meeting.type,
            agendas: meeting.agendas || [''],
            participants: meeting.participants.map(p => p.user_id),
            notification_channels: ['system', 'mail']
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.put(route('meetings.update', selectedMeeting.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedMeeting(null);
            }
        });
    };

    const addEditAgenda = () => editForm.setData('agendas', [...editForm.data.agendas, '']);
    const updateEditAgenda = (index, value) => {
        const newAgendas = [...editForm.data.agendas];
        newAgendas[index] = value;
        editForm.setData('agendas', newAgendas);
    };
    const removeEditAgenda = (index) => {
        const newAgendas = [...editForm.data.agendas];
        newAgendas.splice(index, 1);
        editForm.setData('agendas', newAgendas);
    };

    const toggleEditChannel = (channel) => {
        const current = editForm.data.notification_channels;
        editForm.setData('notification_channels', current.includes(channel) ? current.filter(c => c !== channel) : [...current, channel]);
    };

    // --- REMIND ACTIONS ---
    const openRemindModal = (meeting) => {
        setSelectedMeeting(meeting);
        remindForm.reset();
        setIsRemindModalOpen(true);
    };

    const handleRemindSubmit = (e) => {
        e.preventDefault();
        remindForm.post(route('meetings.remind', selectedMeeting.id), {
            onSuccess: () => {
                setIsRemindModalOpen(false);
                setSelectedMeeting(null);
            }
        });
    };

    const toggleRemindChannel = (channel) => {
        const current = remindForm.data.notification_channels;
        remindForm.setData('notification_channels', current.includes(channel) ? current.filter(c => c !== channel) : [...current, channel]);
    };

    // --- CANCEL ACTIONS ---
    const openCancelModal = (meeting) => {
        setSelectedMeeting(meeting);
        cancelForm.reset();
        setIsCancelModalOpen(true);
    };

    const handleCancelSubmit = (e) => {
        e.preventDefault();
        cancelForm.delete(route('meetings.destroy', selectedMeeting.id), {
            onSuccess: () => {
                setIsCancelModalOpen(false);
                setSelectedMeeting(null);
            }
        });
    };

    const toggleCancelChannel = (channel) => {
        const current = cancelForm.data.notification_channels;
        cancelForm.setData('notification_channels', current.includes(channel) ? current.filter(c => c !== channel) : [...current, channel]);
    };

    // --- SELECT STYLES ---
    const selectClassNames = {
        control: (state) => `bg-white dark:bg-slate-900 border ${state.isFocused ? 'border-primary-500 ring-1 ring-primary-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl min-h-[42px] px-1 transition-all text-sm`,
        menu: () => "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl mt-1 overflow-hidden z-50",
        option: (state) => `px-4 py-2 text-sm cursor-pointer transition-colors ${state.isFocused ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`,
        multiValue: () => "bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 rounded-md m-1",
        multiValueLabel: () => "text-primary-700 dark:text-primary-400 text-xs py-1 px-2",
        multiValueRemove: () => "text-primary-500 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-800 hover:text-primary-700 px-1 rounded-r-md transition-colors",
        placeholder: () => "text-slate-400 text-sm px-2",
        input: () => "text-slate-700 dark:text-slate-300 text-sm px-2",
        valueContainer: () => "px-1",
        indicatorsContainer: () => "px-1 text-slate-400",
        indicatorSeparator: () => "hidden",
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="الإجتماعات" />
            <div className="p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-6 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">إدارة الاجتماعات</h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة الاجتماعات واللجان والقرارات والتوصيات</p>
                            </div>
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95"
                            >
                                <Plus size={18} /> 
                                <span>جدولة اجتماع جديد</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-4">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ابحث عن اجتماع..."
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                            <div className="w-48">
                                <SelectInput
                                    value={statusFilter}
                                    onChange={val => setStatusFilter(val)}
                                    options={[
                                        { value: '', label: 'جميع الحالات' },
                                        { value: 'scheduled', label: 'مجدول' },
                                        { value: 'completed', label: 'مكتمل' },
                                        { value: 'cancelled', label: 'ملغي' }
                                    ]}
                                />
                            </div>
                            <button type="submit" className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-bold transition-colors">
                                بحث
                            </button>
                        </form>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                        <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                <LayoutGrid size={16} /> شبكة
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'table' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                <List size={16} /> جدول
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button 
                                onClick={() => router.get(route('meetings.index'))}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!filters.status ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'}`}
                            >
                                الكل
                            </button>
                            <button 
                                onClick={() => router.get(route('meetings.index', { status: 'scheduled' }))}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.status === 'scheduled' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'}`}
                            >
                                مجدولة
                            </button>
                            <button 
                                onClick={() => router.get(route('meetings.index', { status: 'completed' }))}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.status === 'completed' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'}`}
                            >
                                مكتملة
                            </button>
                            <button 
                                onClick={() => router.get(route('meetings.index', { status: 'cancelled' }))}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.status === 'cancelled' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'}`}
                            >
                                ملغاة
                            </button>
                        </div>
                    </div>

                    {filteredMeetings.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-900 shadow-sm">
                                <Calendar size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد اجتماعات</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                لم يتم العثور على اجتماعات تطابق معايير البحث أو الفلترة الحالية.
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredMeetings.map(meeting => {
                                const isSupervisor = meeting.supervisor_id === auth.user.id;
                                const isPast = new Date(`${meeting.date}T${meeting.time}`) < new Date();
                                
                                return (
                                    <div key={meeting.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none hover:border-primary-200 dark:hover:border-primary-800/50 transition-all duration-300 flex flex-col h-full relative">
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getStatusColor(meeting.status)} rounded-bl-full opacity-10 dark:opacity-5 transform translate-x-10 -translate-y-10 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-500`} />
                                        
                                        <div className="p-6 flex-1 flex flex-col relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${meeting.type === 'online' ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400'}`}>
                                                        {meeting.type === 'online' ? <Users size={24} strokeWidth={1.5} /> : <MapPin size={24} strokeWidth={1.5} />}
                                                    </div>
                                                    <div>
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getStatusBadgeColor(meeting.status)}`}>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                            {getStatusLabel(meeting.status)}
                                                        </span>
                                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5">
                                                            {meeting.type === 'online' ? 'اجتماع عن بعد' : 'اجتماع حضوري'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link href={route('meetings.show', meeting.id)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-primary-50 hover:text-primary-600 dark:bg-slate-800 dark:hover:bg-primary-900/30 dark:text-slate-400 dark:hover:text-primary-400 flex items-center justify-center transition-colors">
                                                    <ArrowUpLeft size={18} />
                                                </Link>
                                            </div>

                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 line-clamp-2 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {meeting.title}
                                            </h3>

                                            <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-500 dark:text-primary-400 shrink-0 border border-slate-100 dark:border-slate-700">
                                                        <Calendar size={14} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatDateAr(meeting.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-amber-500 shrink-0 border border-slate-100 dark:border-slate-700">
                                                        <Clock size={14} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">الساعة {formatTimeAr(meeting.time)}</span>
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                <div className="flex items-center justify-between text-sm mb-3">
                                                    <span className="font-bold text-slate-500 dark:text-slate-400">المدعوون</span>
                                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700">
                                                        {meeting.participants.length} أشخاص
                                                    </span>
                                                </div>
                                                <div className="flex -space-x-3 rtl:space-x-reverse">
                                                    {meeting.participants.slice(0, 4).map((p, idx) => (
                                                        <div key={idx} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300 shadow-sm relative group/avatar cursor-help">
                                                            {p.user?.name?.charAt(0)}
                                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                                                {p.user?.name}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {meeting.participants.length > 4 && (
                                                        <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                                                            +{meeting.participants.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2 relative z-10">
                                            {isSupervisor && meeting.status === 'scheduled' && (
                                                <>
                                                    <button 
                                                        onClick={() => openEditModal(meeting)}
                                                        className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-primary-400 transition-all shadow-sm"
                                                    >
                                                        <Edit size={16} /> <span className="hidden sm:inline">{isPast ? 'تغيير الموعد' : 'تعديل'}</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => openRemindModal(meeting)}
                                                        className="w-11 h-11 flex justify-center items-center rounded-xl font-bold bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-all shadow-sm shrink-0"
                                                        title="إرسال تذكير"
                                                    >
                                                        <Bell size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => openCancelModal(meeting)}
                                                        className="w-11 h-11 flex justify-center items-center rounded-xl font-bold bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 dark:bg-slate-800 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-900/30 transition-all shadow-sm shrink-0"
                                                        title="إلغاء الاجتماع"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-black border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tr-3xl">الاجتماع</th>
                                            <th className="px-6 py-4">التاريخ والوقت</th>
                                            <th className="px-6 py-4">النوع</th>
                                            <th className="px-6 py-4">المدعوون</th>
                                            <th className="px-6 py-4">الحالة</th>
                                            <th className="px-6 py-4 rounded-tl-3xl">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium">
                                        {filteredMeetings.map(meeting => {
                                            const isSupervisor = meeting.supervisor_id === auth.user.id;
                                            const isPast = new Date(`${meeting.date}T${meeting.time}`) < new Date();
                                            return (
                                                <tr key={meeting.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <Link href={route('meetings.show', meeting.id)} className="font-bold text-slate-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                                                            {meeting.title}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className="text-slate-400" /> 
                                                            <span className="text-slate-700 dark:text-slate-300">{formatDateAr(meeting.date)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                            <Clock size={12} className="text-slate-400" />
                                                            {formatTimeAr(meeting.time)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {meeting.type === 'online' ? (
                                                            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md text-xs font-bold w-max">
                                                                <Users size={12}/> عن بعد
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md text-xs font-bold w-max">
                                                                <MapPin size={12}/> حضوري
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex -space-x-2 rtl:space-x-reverse">
                                                            {meeting.participants.slice(0, 3).map((p, idx) => (
                                                                <div key={idx} className="w-8 h-8 rounded-full border border-white dark:border-slate-900 bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300" title={p.user?.name}>
                                                                    {p.user?.name?.charAt(0)}
                                                                </div>
                                                            ))}
                                                            {meeting.participants.length > 3 && (
                                                                <div className="w-8 h-8 rounded-full border border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                                    +{meeting.participants.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${getStatusBadgeColor(meeting.status)}`}>
                                                            {getStatusLabel(meeting.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <Link href={route('meetings.show', meeting.id)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg dark:hover:bg-primary-900/30 transition-colors" title="عرض التفاصيل">
                                                                <Eye size={16} />
                                                            </Link>
                                                            {isSupervisor && meeting.status === 'scheduled' && (
                                                                <>
                                                                    <button onClick={() => openEditModal(meeting)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg dark:hover:bg-primary-900/30 transition-colors" title="تعديل">
                                                                        <Edit size={16} />
                                                                    </button>
                                                                    <button onClick={() => openRemindModal(meeting)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30 transition-colors" title="تذكير">
                                                                        <Bell size={16} />
                                                                    </button>
                                                                    <button onClick={() => openCancelModal(meeting)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30 transition-colors" title="إلغاء">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#121820] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">جدولة اجتماع جديد</h2>
                                    <p className="text-sm text-slate-500">قم بتحديد تفاصيل الاجتماع والمشاركين</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="createForm" onSubmit={handleCreateSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان الاجتماع <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={createForm.data.title}
                                        onChange={e => createForm.setData('title', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                        required
                                    />
                                    {createForm.errors.title && <p className="text-red-500 text-xs mt-1">{createForm.errors.title}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ الاجتماع <span className="text-red-500">*</span></label>
                                        <FlatpickrInput 
                                            type="date"
                                            value={createForm.data.date}
                                            onChange={(date) => createForm.setData('date', date)}
                                            required
                                        />
                                        {createForm.errors.date && <p className="text-red-500 text-xs mt-1">{createForm.errors.date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">وقت الاجتماع <span className="text-red-500">*</span></label>
                                        <FlatpickrInput 
                                            type="time"
                                            value={createForm.data.time}
                                            onChange={(time) => createForm.setData('time', time)}
                                            required
                                        />
                                        {createForm.errors.time && <p className="text-red-500 text-xs mt-1">{createForm.errors.time}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع الاجتماع <span className="text-red-500">*</span></label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="type" value="in_person" checked={createForm.data.type === 'in_person'} onChange={e => createForm.setData('type', e.target.value)} className="text-primary-600 focus:ring-primary-500 w-4 h-4" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">حضوري</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="type" value="online" checked={createForm.data.type === 'online'} onChange={e => createForm.setData('type', e.target.value)} className="text-primary-600 focus:ring-primary-500 w-4 h-4" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">عن بعد (Online)</span>
                                        </label>
                                    </div>
                                    {createForm.errors.type && <p className="text-red-500 text-xs mt-1">{createForm.errors.type}</p>}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">محاور الاجتماع <span className="text-red-500">*</span></label>
                                        <button type="button" onClick={addCreateAgenda} className="text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                                            <PlusCircle size={16} /> إضافة محور
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {createForm.data.agendas.map((agenda, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={agenda}
                                                    onChange={e => updateCreateAgenda(idx, e.target.value)}
                                                    placeholder={`المحور ${idx + 1}`}
                                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                                    required
                                                />
                                                {createForm.data.agendas.length > 1 && (
                                                    <button type="button" onClick={() => removeCreateAgenda(idx)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 rounded-xl transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {createForm.errors.agendas && <p className="text-red-500 text-xs mt-1">{createForm.errors.agendas}</p>}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">المدعوون (المشاركون) <span className="text-red-500">*</span></label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => createForm.setData('participants', userOptions.map(opt => opt.value))} className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 px-2 py-1 rounded-md transition-colors">
                                                تحديد الكل
                                            </button>
                                            <button type="button" onClick={() => createForm.setData('participants', [])} className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-2 py-1 rounded-md transition-colors">
                                                إلغاء التحديد
                                            </button>
                                        </div>
                                    </div>
                                    <Select
                                        isMulti
                                        options={userOptions}
                                        value={userOptions.filter(opt => createForm.data.participants.includes(opt.value))}
                                        onChange={(selected) => createForm.setData('participants', selected ? selected.map(o => o.value) : [])}
                                        placeholder="اختر الموظفين..."
                                        classNames={selectClassNames}
                                        unstyled
                                        noOptionsMessage={() => "لا يوجد موظفين"}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                    {createForm.errors.participants && <p className="text-red-500 text-xs mt-1">{createForm.errors.participants}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">طرق إرسال الدعوة (التنبيهات)</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${createForm.data.notification_channels.includes('system') ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'}`}>
                                            <input type="checkbox" checked={createForm.data.notification_channels.includes('system')} onChange={() => toggleCreateChannel('system')} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                                            <div className="flex items-center gap-2">
                                                <Bell size={18} className={createForm.data.notification_channels.includes('system') ? 'text-primary-600' : 'text-slate-400'} />
                                                <span className={`text-sm font-bold ${createForm.data.notification_channels.includes('system') ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>النظام</span>
                                            </div>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${createForm.data.notification_channels.includes('mail') ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'}`}>
                                            <input type="checkbox" checked={createForm.data.notification_channels.includes('mail')} onChange={() => toggleCreateChannel('mail')} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                                            <div className="flex items-center gap-2">
                                                <Mail size={18} className={createForm.data.notification_channels.includes('mail') ? 'text-primary-600' : 'text-slate-400'} />
                                                <span className={`text-sm font-bold ${createForm.data.notification_channels.includes('mail') ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>البريد</span>
                                            </div>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${createForm.data.notification_channels.includes('firebase') ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'}`}>
                                            <input type="checkbox" checked={createForm.data.notification_channels.includes('firebase')} onChange={() => toggleCreateChannel('firebase')} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                                            <div className="flex items-center gap-2">
                                                <Smartphone size={18} className={createForm.data.notification_channels.includes('firebase') ? 'text-primary-600' : 'text-slate-400'} />
                                                <span className={`text-sm font-bold ${createForm.data.notification_channels.includes('firebase') ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>الجوال</span>
                                            </div>
                                        </label>
                                    </div>
                                    {createForm.errors.notification_channels && <p className="text-red-500 text-xs mt-1">{createForm.errors.notification_channels}</p>}
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button 
                                form="createForm" 
                                type="submit" 
                                disabled={createForm.processing}
                                className="px-6 py-2.5 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 transition-colors"
                            >
                                جدولة الاجتماع
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && selectedMeeting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#121820] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                                    <Edit size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                        {selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled' ? 'إعادة جدولة الاجتماع' : 'تعديل الاجتماع'}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled' ? 'هذا الاجتماع مضى وقته، يمكنك فقط تغيير الموعد.' : 'تعديل بيانات الاجتماع والمشاركين'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled' && (
                                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <h4 className="font-bold text-amber-800 text-sm">اجتماع منقضي</h4>
                                        <p className="text-sm text-amber-700 mt-1">هذا الاجتماع قد مضى موعده الأصلي. يمكنك فقط <strong>إعادة جدولته</strong> من خلال اختيار تاريخ ووقت جديدين في المستقبل. بقية الحقول غير قابلة للتعديل.</p>
                                    </div>
                                </div>
                            )}
                            <form id="editForm" onSubmit={handleEditSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان الاجتماع <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={editForm.data.title}
                                        onChange={e => editForm.setData('title', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-800/50"
                                        required
                                        disabled={selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled'}
                                    />
                                    {editForm.errors.title && <p className="text-red-500 text-xs mt-1">{editForm.errors.title}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ الاجتماع <span className="text-red-500">*</span></label>
                                        <FlatpickrInput 
                                            type="date"
                                            value={editForm.data.date}
                                            onChange={(date) => editForm.setData('date', date)}
                                            required
                                        />
                                        {editForm.errors.date && <p className="text-red-500 text-xs mt-1">{editForm.errors.date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">وقت الاجتماع <span className="text-red-500">*</span></label>
                                        <FlatpickrInput 
                                            type="time"
                                            value={editForm.data.time}
                                            onChange={(time) => editForm.setData('time', time)}
                                            required
                                        />
                                        {editForm.errors.time && <p className="text-red-500 text-xs mt-1">{editForm.errors.time}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع الاجتماع <span className="text-red-500">*</span></label>
                                    <div className="flex gap-4">
                                        <label className={`flex items-center gap-2 ${selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                            <input type="radio" name="type" value="in_person" checked={editForm.data.type === 'in_person'} onChange={e => editForm.setData('type', e.target.value)} disabled={selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled'} className="text-primary-600 focus:ring-primary-500 w-4 h-4" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">حضوري</span>
                                        </label>
                                        <label className={`flex items-center gap-2 ${selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                            <input type="radio" name="type" value="online" checked={editForm.data.type === 'online'} onChange={e => editForm.setData('type', e.target.value)} disabled={selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled'} className="text-primary-600 focus:ring-primary-500 w-4 h-4" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">عن بعد (Online)</span>
                                        </label>
                                    </div>
                                    {editForm.errors.type && <p className="text-red-500 text-xs mt-1">{editForm.errors.type}</p>}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">محاور الاجتماع <span className="text-red-500">*</span></label>
                                        {!(selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled') && (
                                            <button type="button" onClick={addEditAgenda} className="text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                                                <PlusCircle size={16} /> إضافة محور
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {editForm.data.agendas.map((agenda, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={agenda}
                                                    onChange={e => updateEditAgenda(idx, e.target.value)}
                                                    placeholder={`المحور ${idx + 1}`}
                                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-800/50"
                                                    required
                                                    disabled={selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled'}
                                                />
                                                {editForm.data.agendas.length > 1 && !(selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled') && (
                                                    <button type="button" onClick={() => removeEditAgenda(idx)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 rounded-xl transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {editForm.errors.agendas && <p className="text-red-500 text-xs mt-1">{editForm.errors.agendas}</p>}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">المدعوون (المشاركون) <span className="text-red-500">*</span></label>
                                        {!(selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled') && (
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => editForm.setData('participants', userOptions.map(opt => opt.value))} className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 px-2 py-1 rounded-md transition-colors">
                                                    تحديد الكل
                                                </button>
                                                <button type="button" onClick={() => editForm.setData('participants', [])} className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-2 py-1 rounded-md transition-colors">
                                                    إلغاء التحديد
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <Select
                                        isMulti
                                        options={userOptions}
                                        value={userOptions.filter(opt => editForm.data.participants.includes(opt.value))}
                                        onChange={(selected) => editForm.setData('participants', selected ? selected.map(o => o.value) : [])}
                                        placeholder="اختر الموظفين..."
                                        classNames={selectClassNames}
                                        unstyled
                                        noOptionsMessage={() => "لا يوجد موظفين"}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        isDisabled={selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() && selectedMeeting.status === 'scheduled'}
                                    />
                                    {editForm.errors.participants && <p className="text-red-500 text-xs mt-1">{editForm.errors.participants}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تنبيه المدعوين الجدد عبر</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${editForm.data.notification_channels.includes('system') ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'}`}>
                                            <input type="checkbox" checked={editForm.data.notification_channels.includes('system')} onChange={() => toggleEditChannel('system')} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                                            <div className="flex items-center gap-2">
                                                <Bell size={18} className={editForm.data.notification_channels.includes('system') ? 'text-primary-600' : 'text-slate-400'} />
                                                <span className={`text-sm font-bold ${editForm.data.notification_channels.includes('system') ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>النظام</span>
                                            </div>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${editForm.data.notification_channels.includes('mail') ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'}`}>
                                            <input type="checkbox" checked={editForm.data.notification_channels.includes('mail')} onChange={() => toggleEditChannel('mail')} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                                            <div className="flex items-center gap-2">
                                                <Mail size={18} className={editForm.data.notification_channels.includes('mail') ? 'text-primary-600' : 'text-slate-400'} />
                                                <span className={`text-sm font-bold ${editForm.data.notification_channels.includes('mail') ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>البريد</span>
                                            </div>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${editForm.data.notification_channels.includes('firebase') ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'}`}>
                                            <input type="checkbox" checked={editForm.data.notification_channels.includes('firebase')} onChange={() => toggleEditChannel('firebase')} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                                            <div className="flex items-center gap-2">
                                                <Smartphone size={18} className={editForm.data.notification_channels.includes('firebase') ? 'text-primary-600' : 'text-slate-400'} />
                                                <span className={`text-sm font-bold ${editForm.data.notification_channels.includes('firebase') ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>الجوال</span>
                                            </div>
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><AlertCircle size={12}/> سيتم أيضاً إرسال تنبيه إلغاء لمن تمت إزالتهم من الاجتماع.</p>
                                    {editForm.errors.notification_channels && <p className="text-red-500 text-xs mt-1">{editForm.errors.notification_channels}</p>}
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button 
                                form="editForm" 
                                type="submit" 
                                disabled={editForm.processing}
                                className="px-6 py-2.5 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 transition-colors"
                            >
                                {selectedMeeting && new Date(`${selectedMeeting.date}T${selectedMeeting.time}`) < new Date() ? 'إعادة الجدولة' : 'حفظ التعديلات'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remind Modal */}
            {isRemindModalOpen && selectedMeeting && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-[#121820] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-100 transform transition-transform">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white">إرسال تذكير</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تنبيه المدعوين باقتراب موعد الاجتماع</p>
                                </div>
                            </div>
                            <button onClick={() => setIsRemindModalOpen(false)} className="text-slate-400 hover:bg-white dark:hover:bg-slate-800 p-2 rounded-xl hover:text-slate-600 dark:hover:text-slate-200 transition-colors shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <form id="remindForm" onSubmit={handleRemindSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">نوع التذكير <span className="text-red-500">*</span></label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all ${remindForm.data.reminder_type === 'now' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/50'}`}>
                                            <input type="radio" name="reminder_type" value="now" checked={remindForm.data.reminder_type === 'now'} onChange={e => remindForm.setData('reminder_type', e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">بدأ الاجتماع الآن</span>
                                        </label>
                                        <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all ${remindForm.data.reminder_type === '5_minutes' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/50'}`}>
                                            <input type="radio" name="reminder_type" value="5_minutes" checked={remindForm.data.reminder_type === '5_minutes'} onChange={e => remindForm.setData('reminder_type', e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">يبدأ بعد 5 دقائق</span>
                                        </label>
                                        <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all ${remindForm.data.reminder_type === '15_minutes' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/50'}`}>
                                            <input type="radio" name="reminder_type" value="15_minutes" checked={remindForm.data.reminder_type === '15_minutes'} onChange={e => remindForm.setData('reminder_type', e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">يبدأ بعد 15 دقيقة</span>
                                        </label>
                                        <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all ${remindForm.data.reminder_type === 'custom' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/50'}`}>
                                            <input type="radio" name="reminder_type" value="custom" checked={remindForm.data.reminder_type === 'custom'} onChange={e => remindForm.setData('reminder_type', e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">رسالة مخصصة</span>
                                        </label>
                                    </div>
                                </div>

                                {remindForm.data.reminder_type === 'custom' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الرسالة المخصصة <span className="text-red-500">*</span></label>
                                        <textarea 
                                            value={remindForm.data.custom_message}
                                            onChange={e => remindForm.setData('custom_message', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                            rows="3"
                                            required={remindForm.data.reminder_type === 'custom'}
                                            placeholder="اكتب التنبيه الخاص بك هنا..."
                                        ></textarea>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">قنوات الإرسال</label>
                                    <div className="flex flex-wrap gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => toggleRemindChannel('system')}
                                            className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all overflow-hidden ${remindForm.data.notification_channels.includes('system') ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 shadow-sm dark:bg-blue-900/40 dark:border-blue-500/50 dark:text-blue-300' : 'bg-white text-slate-500 border-2 border-slate-100 hover:border-slate-300 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-400'}`}
                                        >
                                            {remindForm.data.notification_channels.includes('system') && <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 animate-pulse" />}
                                            {remindForm.data.notification_channels.includes('system') ? <CheckCircle size={18} className="text-blue-600 dark:text-blue-400 relative z-10" /> : <Bell size={18} className="relative z-10" />}
                                            <span className="relative z-10">النظام</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => toggleRemindChannel('mail')}
                                            className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all overflow-hidden ${remindForm.data.notification_channels.includes('mail') ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 shadow-sm dark:bg-blue-900/40 dark:border-blue-500/50 dark:text-blue-300' : 'bg-white text-slate-500 border-2 border-slate-100 hover:border-slate-300 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-400'}`}
                                        >
                                            {remindForm.data.notification_channels.includes('mail') && <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 animate-pulse" />}
                                            {remindForm.data.notification_channels.includes('mail') ? <CheckCircle size={18} className="text-blue-600 dark:text-blue-400 relative z-10" /> : <Mail size={18} className="relative z-10" />}
                                            <span className="relative z-10">البريد</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => toggleRemindChannel('firebase')}
                                            className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all overflow-hidden ${remindForm.data.notification_channels.includes('firebase') ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 shadow-sm dark:bg-blue-900/40 dark:border-blue-500/50 dark:text-blue-300' : 'bg-white text-slate-500 border-2 border-slate-100 hover:border-slate-300 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-400'}`}
                                        >
                                            {remindForm.data.notification_channels.includes('firebase') && <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 animate-pulse" />}
                                            {remindForm.data.notification_channels.includes('firebase') ? <CheckCircle size={18} className="text-blue-600 dark:text-blue-400 relative z-10" /> : <Smartphone size={18} className="relative z-10" />}
                                            <span className="relative z-10">الجوال</span>
                                        </button>
                                    </div>
                                    {remindForm.errors.notification_channels && <p className="text-red-500 text-xs mt-1">{remindForm.errors.notification_channels}</p>}
                                </div>
                            </form>
                        </div>
                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsRemindModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button 
                                form="remindForm" 
                                type="submit" 
                                disabled={remindForm.processing || remindForm.data.notification_channels.length === 0}
                                className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 ${remindForm.processing || remindForm.data.notification_channels.length === 0 ? 'bg-blue-400 cursor-not-allowed dark:bg-blue-800/50' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-500/20 dark:bg-blue-600 dark:hover:bg-blue-500'}`}
                            >
                                {remindForm.processing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>جاري الإرسال...</span>
                                    </>
                                ) : (
                                    <>
                                        <Bell size={18} />
                                        <span>إرسال التنبيه</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {isCancelModalOpen && selectedMeeting && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-[#121820] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-100 transform transition-transform">
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">إلغاء وحذف الاجتماع</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                هل أنت متأكد من رغبتك في إلغاء هذا الاجتماع؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسحه من سجلات النظام.
                            </p>

                            <div className="w-full text-right p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 mb-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">إشعار المدعوين بالإلغاء عبر:</label>
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => toggleCancelChannel('system')}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${cancelForm.data.notification_channels.includes('system') ? 'bg-primary-50 text-primary-700 border border-primary-500 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                                    >
                                        <Bell size={14} /> النظام
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => toggleCancelChannel('mail')}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${cancelForm.data.notification_channels.includes('mail') ? 'bg-purple-50 text-purple-700 border border-purple-500 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                                    >
                                        <Mail size={14} /> البريد
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => toggleCancelChannel('firebase')}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${cancelForm.data.notification_channels.includes('firebase') ? 'bg-amber-50 text-amber-700 border border-amber-500 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                                    >
                                        <Smartphone size={14} /> الجوال
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsCancelModalOpen(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                تراجع
                            </button>
                            <button 
                                onClick={handleCancelSubmit}
                                disabled={cancelForm.processing}
                                className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white transition-all active:scale-[0.98] shadow-md shadow-red-500/20"
                            >
                                تأكيد الإلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
