import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit2, Trash2, Users, CheckCircle, AlertTriangle, CalendarDays, Search, X, User, Activity, Clock, FileText, CheckSquare, MessageSquare, Tag, Calendar, AlignLeft } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function Summons({ auth, summons, students, violations }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingSummon, setEditingSummon] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const { data, setData, post, put, delete: destroy, errors, reset } = useForm({
        student_id: '',
        student_violation_id: '',
        summon_date: '',
        reason: '',
        status: 'scheduled',
        notes: '',
    });

    const openModal = (summon = null) => {
        setEditingSummon(summon);
        if (summon) {
            setData({
                student_id: summon.student_id,
                student_violation_id: summon.student_violation_id || '',
                summon_date: summon.summon_date ? summon.summon_date.split('T')[0] : '',
                reason: summon.reason || '',
                status: summon.status || 'scheduled',
                notes: summon.notes || '',
            });
        } else {
            reset();
            setData('status', 'scheduled');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingSummon) {
            put(route('academic.parent-summons.update', editingSummon.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('academic.parent-summons.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDelete = (summon) => {
        setEditingSummon(summon);
        setIsDeleteModalOpen(true);
    };

    const deleteSummon = () => {
        destroy(route('academic.parent-summons.destroy', editingSummon.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const toggleStatus = (summon) => {
        const nextStatus = summon.status === 'scheduled' ? 'attended' : (summon.status === 'attended' ? 'no_show' : 'scheduled');
        router.put(route('academic.parent-summons.update', summon.id), {
            ...summon,
            status: nextStatus
        }, {
            preserveScroll: true
        });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
            case 'attended': return 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
            case 'no_show': return 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
            default: return 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'scheduled': return 'مجدول';
            case 'attended': return 'حضر';
            case 'no_show': return 'لم يحضر';
            default: return 'غير معروف';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'scheduled': return <Clock size={12} />;
            case 'attended': return <CheckCircle size={12} />;
            case 'no_show': return <AlertTriangle size={12} />;
            default: return <Activity size={12} />;
        }
    };

    // Client-side filtering
    const filteredSummons = useMemo(() => {
        return summons.filter(s => {
            const matchesSearch = !searchQuery || 
                s.student?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                s.reason?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === '' || s.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [summons, searchQuery, statusFilter]);

    // Calculate Stats
    const stats = {
        total: summons.length,
        scheduled: summons.filter(s => s.status === 'scheduled').length,
        attended: summons.filter(s => s.status === 'attended').length,
        no_show: summons.filter(s => s.status === 'no_show').length,
    };

    return (
        <AdminLayout user={auth.user} activeMenu="استدعاءات أولياء الأمور">
            <Head title="استدعاءات أولياء الأمور" />

            <div className="max-w-[1600px] mx-auto space-y-6">
                
                {/* Header Section */}
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
                                <Users size={28} className="text-primary-600" />
                                استدعاءات أولياء الأمور
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة وجدولة وتتبع استدعاءات أولياء أمور الطلاب</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>استدعاء جديد</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-2">
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-primary-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <Users className="text-primary-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الاستدعاءات</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.total}</h4>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-amber-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <CalendarDays className="text-amber-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">مجدول (بانتظار الحضور)</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.scheduled}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-emerald-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <CheckCircle className="text-emerald-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">تم الحضور</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.attended}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-rose-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <AlertTriangle className="text-rose-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">تخلف عن الحضور</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.no_show}</h4>
                        </div>
                    </div>
                </div>

                {/* Smart Toolbar */}
                <div className="bg-white dark:bg-[#121820]/60 p-3 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
                    {/* Status Tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto custom-scrollbar shrink-0">
                        {[
                            { value: '', label: 'الكل' }, 
                            { value: 'scheduled', label: 'مجدول' }, 
                            { value: 'attended', label: 'حضر' },
                            { value: 'no_show', label: 'لم يحضر' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${statusFilter === opt.value ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-3 w-full xl:w-auto shrink-0 flex-1 xl:flex-none justify-end">
                        <div className="relative w-full max-w-sm">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث باسم الطالب أو سبب الاستدعاء..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/40 border-none rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الطالب</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">موعد الاستدعاء</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-1/3">السبب / المخالفة المرتبطة</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الحالة</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredSummons.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500">
                                                <Users size={40} className="mb-3 text-slate-300" />
                                                <p className="font-bold">لا توجد استدعاءات مسجلة</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSummons.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{s.student?.user?.name || '-'}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">الرقم: {s.student?.student_number || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    <CalendarDays size={16} className="text-primary-500" />
                                                    {s.summon_date}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                                                    {s.student_violation_id && (
                                                        <p className="mb-1 truncate font-semibold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 inline-block px-2 py-0.5 rounded-lg border border-rose-100 dark:border-rose-500/20">
                                                            <span className="font-black">مخالفة مرتبطة:</span> {s.violation?.violation_type?.name}
                                                        </p>
                                                    )}
                                                    <p className="truncate font-semibold"><span className="text-slate-400">السبب:</span> {s.reason}</p>
                                                    {s.notes && <p className="truncate font-semibold text-slate-400 mt-1"><span className="text-slate-400">ملاحظات:</span> {s.notes}</p>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <button 
                                                    onClick={() => toggleStatus(s)}
                                                    title="انقر لتغيير الحالة"
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all hover:scale-105 cursor-pointer ${getStatusStyle(s.status)}`}
                                                >
                                                    {getStatusIcon(s.status)}
                                                    {getStatusLabel(s.status)}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openModal(s)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/20 transition-all shadow-sm">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => confirmDelete(s)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all shadow-sm">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-auto transform transition-all">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        {editingSummon ? 'تعديل استدعاء ولي الأمر' : 'إنشاء استدعاء جديد'}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">قم بتعبئة بيانات الاستدعاء وتحديد الموعد</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 rounded-2xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="p-8">
                            <form onSubmit={submit} className="space-y-6">
                                {!editingSummon && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الطالب <span className="text-rose-500">*</span></label>
                                            <SelectInput
                                                options={[{ value: '', label: '-- اختر الطالب --' }, ...students.map(s => ({ value: s.id, label: s.user?.name }))]}
                                                value={data.student_id}
                                                onChange={val => setData('student_id', val)}
                                                className="w-full"
                                            />
                                            {errors.student_id && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.student_id}</p>}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ارتباط بمخالفة (اختياري)</label>
                                            <SelectInput
                                                options={[{ value: '', label: '-- بدون مخالفة مرتبطة --' }, ...violations.filter(v => !data.student_id || v.student_id == data.student_id).map(v => ({ value: v.id, label: `${v.violation_type?.name} (${v.violation_date})` }))]}
                                                value={data.student_violation_id}
                                                onChange={val => setData('student_violation_id', val)}
                                                className="w-full"
                                            />
                                            {errors.student_violation_id && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.student_violation_id}</p>}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ الاستدعاء <span className="text-rose-500">*</span></label>
                                        <FlatpickrInput
                                            type="date"
                                            value={data.summon_date}
                                            onChange={(val) => setData('summon_date', val)}
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-5 pr-12 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الحالة</label>
                                        <SelectInput
                                            options={[
                                                { value: 'scheduled', label: 'مجدول' },
                                                { value: 'attended', label: 'حضر' },
                                                { value: 'no_show', label: 'لم يحضر' }
                                            ]}
                                            value={data.status}
                                            onChange={val => setData('status', val)}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">سبب الاستدعاء <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                            value={data.reason}
                                            onChange={e => setData('reason', e.target.value)}
                                            rows="2"
                                            required
                                            placeholder="اكتب سبب استدعاء ولي الأمر بوضوح..."
                                        />
                                        <div className="pointer-events-none absolute top-4 right-0 flex items-center pr-4 text-slate-400">
                                            <FileText size={16} />
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ملاحظات (اختياري)</label>
                                    <div className="relative">
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                            value={data.notes}
                                            onChange={e => setData('notes', e.target.value)}
                                            rows="2"
                                            placeholder="أي ملاحظات إضافية تخص الاستدعاء أو نتائج المقابلة..."
                                        />
                                        <div className="pointer-events-none absolute top-4 right-0 flex items-center pr-4 text-slate-400">
                                            <MessageSquare size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-6 py-3.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold transition-colors">
                                        إلغاء
                                    </button>
                                    <button type="submit" className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 active:scale-95">
                                        <CheckSquare size={18} />
                                        <span>حفظ الاستدعاء</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800 transform transition-all">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <Trash2 size={32} className="relative z-10" />
                            <div className="absolute inset-0 bg-rose-500 opacity-20 rounded-full blur-xl animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold mb-8">
                            هل أنت متأكد من حذف سجل الاستدعاء هذا؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold transition-colors">
                                إلغاء
                            </button>
                            <button onClick={deleteSummon} className="flex-1 py-4 text-white bg-rose-500 hover:bg-rose-600 rounded-2xl font-bold transition-colors shadow-lg shadow-rose-500/20">
                                تأكيد الحذف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
