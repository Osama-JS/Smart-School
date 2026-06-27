import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';

import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { BookOpen, Plus, Edit, Trash, Calendar, Filter, RotateCcw, LayoutGrid, List, X, Save, FileText, CheckCircle, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Index({ auth, preparations, grades, subjects, schedules = [], filters }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        lesson_title: '',
        subject_id: '',
        grade_id: '',
        division_id: '',
        period_id: '',
        preparation_date: '',
        topics_covered: '',
        notes: '',
        homework: '',
        status: 'draft',
    });

    const [viewMode, setViewMode] = useState('cards');

    const openModal = (preparation = null) => {
        clearErrors();
        if (preparation) {
            setEditingId(preparation.id);
            setData({
                lesson_title: preparation.lesson_title || '',
                subject_id: preparation.subject_id || '',
                grade_id: preparation.grade_id || '',
                division_id: preparation.division_id || '',
                period_id: '', // Custom logic might be needed here if period_id was stored
                preparation_date: preparation.preparation_date || '',
                topics_covered: preparation.topics_covered || '',
                notes: preparation.notes || '',
                homework: preparation.homework || '',
                status: preparation.status || 'draft',
            });
        } else {
            setEditingId(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        setEditingId(null);
    };

    const getAvailableSessions = (dateStr) => {
        if (!dateStr) return [];
        // Parse date manually to avoid UTC offset issues (e.g., "2026-06-20" becoming June 19th in negative GMT)
        const parts = dateStr.split('-');
        if (parts.length !== 3) return [];
        const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[date.getDay()];
        return schedules.filter(s => s.day_of_week && s.day_of_week.trim().toLowerCase() === dayName);
    };

    const availableSessions = getAvailableSessions(data.preparation_date);

    const handleSessionChange = (v) => {
        const periodId = v || '';
        setData('period_id', periodId);
        
        if (periodId) {
            const session = availableSessions.find(s => String(s.period_id) === String(periodId));
            if (session) {
                setData(data => ({
                    ...data,
                    period_id: periodId,
                    subject_id: session.subject_id,
                    grade_id: session.division?.grade_id || '',
                    division_id: session.division_id || ''
                }));
            }
        } else {
            setData(data => ({
                ...data,
                period_id: '',
                subject_id: '',
                grade_id: '',
                division_id: ''
            }));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(route('teacher.lesson-preparations.update', editingId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('teacher.lesson-preparations.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDelete = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من التراجع عن هذا!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف!',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('teacher.lesson-preparations.destroy', id));
            }
        });
    };

    const handleFilterChange = (key, value) => {
        router.get(route('teacher.lesson-preparations.index'), {
            ...filters,
            [key]: value
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const selectedGrade = grades.find(g => g.id === data.grade_id);
    const divisions = selectedGrade ? selectedGrade.divisions : [];

    return (
        <AdminLayout user={auth.user}>
            <Head title="دفاتر التحضير والمتابعة" />

            <div className="max-w-7xl mx-auto space-y-6">
                
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
                                <BookOpen size={28} className="text-primary-600" />
                                سجلاتي للتحضير والمتابعة
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة سجلات إنجاز الدروس والواجبات</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={openModal}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>إضافة سجل جديد</span>
                            </button>
                            <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    title="عرض كبطاقات"
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    title="عرض كجدول"
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                    {/* Filters Section */}
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden mb-6">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        
                        <div className="flex items-center gap-2 mb-4">
                            <Filter size={18} className="text-primary-500" />
                            <h3 className="font-bold text-slate-800 dark:text-white">تصفية النتائج</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="group flex flex-col">
                                <InputLabel value="المادة" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                <SelectInput
                                    className="w-full"
                                    options={subjects.map(s => ({ value: s.id, label: s.name }))}
                                    value={filters.subject_id || ''}
                                    onChange={(v) => handleFilterChange('subject_id', v || '')}
                                    placeholder="الكل"
                                    isClearable
                                />
                            </div>
                            <div className="group flex flex-col">
                                <InputLabel value="الصف" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                <SelectInput
                                    className="w-full"
                                    options={grades.map(g => ({ value: g.id, label: g.name }))}
                                    value={filters.grade_id || ''}
                                    onChange={(v) => handleFilterChange('grade_id', v || '')}
                                    placeholder="الكل"
                                    isClearable
                                />
                            </div>
                            <div className="group flex flex-col">
                                <InputLabel value="الفترة الزمنية" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                <div className="mt-1 relative">
                                    <FlatpickrInput
                                        value={filters.date_range || ''}
                                        onChange={(dates, str) => handleFilterChange('date_range', str)}
                                        options={{
                                            mode: 'range',
                                            dateFormat: 'Y-m-d',
                                        }}
                                        placeholder="من - إلى"
                                        className="w-full pl-10 !py-[11px] border-slate-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg shadow-sm"
                                    />
                                    <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preparations Grid/Table */}
                    {viewMode === 'cards' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {preparations.data.length > 0 ? (
                                preparations.data.map((prep) => (
                                    <div key={prep.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                        <div className={`absolute top-0 right-0 w-full h-1 ${prep.status === 'published' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prep.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {prep.status === 'published' ? 'منشور' : 'مسودة'}
                                                        </span>
                                                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{prep.lesson_title}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">
                                                        <Calendar className="w-4 h-4 text-primary-500" />
                                                        <span dir="ltr">{prep.preparation_date}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1">
                                                    <button onClick={() => openModal(prep)} className="p-1.5 text-primary-600 hover:bg-primary-100 dark:hover:bg-slate-700 rounded-md transition-colors" title="تعديل">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => confirmDelete(prep.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-md transition-colors" title="حذف">
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3 mt-4">
                                                <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                                                    <span className="font-bold text-slate-500 dark:text-slate-400 min-w-[60px]">المادة:</span>
                                                    <span className="text-slate-700 dark:text-slate-200 font-bold">{prep.subject?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                                                    <span className="font-bold text-slate-500 dark:text-slate-400 min-w-[60px]">الصف:</span>
                                                    <span className="text-slate-700 dark:text-slate-200 font-bold">{prep.grade?.name} {prep.division ? ` - شعبة ${prep.division.name}` : ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد سجلات</h3>
                                    <p className="mt-1 text-slate-500 font-medium">لم تقم بإضافة أي سجلات تحضير أو متابعة للدروس حتى الآن.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right text-slate-500 dark:text-slate-400">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tr-3xl font-bold">التاريخ</th>
                                            <th className="px-6 py-4 font-bold">الحالة</th>
                                            <th className="px-6 py-4 font-bold">عنوان الدرس</th>
                                            <th className="px-6 py-4 font-bold">المادة</th>
                                            <th className="px-6 py-4 font-bold">الصف والشعبة</th>
                                            <th className="px-6 py-4 rounded-tl-3xl text-center font-bold">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preparations.data.length > 0 ? (
                                            preparations.data.map((prep) => (
                                                <tr key={prep.id} className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap" dir="ltr">{prep.preparation_date}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${prep.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                                                            {prep.status === 'published' ? 'منشور' : 'مسودة'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{prep.lesson_title}</td>
                                                    <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">{prep.subject?.name}</td>
                                                    <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">{prep.grade?.name} {prep.division ? `- ${prep.division.name}` : ''}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => openModal(prep)} className="p-2 text-primary-600 bg-primary-50 dark:bg-primary-500/10 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-lg transition-colors" title="تعديل">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => confirmDelete(prep.id)} className="p-2 text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors" title="حذف">
                                                                <Trash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center">
                                                    <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد سجلات</h3>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="mt-6">
                        <Pagination links={preparations.links} />
                    </div>
                </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
                    <div className="relative bg-white/95 dark:bg-[#121820]/95 backdrop-blur-xl rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
                        
                        {/* Decorative background glow */}
                        <div className="absolute top-0 right-0 w-full h-40 bg-gradient-to-b from-primary-500/10 to-transparent pointer-events-none" />
                        <div className="absolute top-10 right-10 w-32 h-32 bg-primary-500/20 rounded-full blur-[50px] pointer-events-none" />

                        {/* Modal Header */}
                        <div className="relative flex items-center justify-between p-6 border-b border-slate-100/50 dark:border-slate-800/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                                    {editingId ? <Edit size={22} strokeWidth={2} /> : <Plus size={22} strokeWidth={2} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {editingId ? 'تعديل سجل الحصة' : 'إضافة سجل حصة جديد'}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">الرجاء إدخال تفاصيل الدرس بدقة لضمان المتابعة الصحيحة</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={submit} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Date Selection */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
                                        تاريخ التنفيذ <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FlatpickrInput
                                            id="preparation_date"
                                            value={data.preparation_date}
                                            onChange={(dateStr) => setData('preparation_date', dateStr)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
                                            placeholder="اختر التاريخ..."
                                        />
                                        <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                    {errors.preparation_date && <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1"><X size={14} />{errors.preparation_date}</p>}
                                </div>

                                {/* Period/Session Selection */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
                                        الحصة (الدرس) {!editingId && <span className="text-red-500">*</span>}
                                    </label>
                                    <SelectInput
                                        id="period_id"
                                        options={availableSessions.map(s => ({
                                            value: s.period_id,
                                            label: `${s.period?.period_name || 'حصة'} - ${s.subject?.name} (${s.division?.grade?.name} - ${s.division?.name})`
                                        }))}
                                        value={data.period_id}
                                        onChange={handleSessionChange}
                                        placeholder="اختر الحصة..."
                                        isDisabled={!data.preparation_date || availableSessions.length === 0}
                                        className="shadow-sm"
                                    />
                                    {data.preparation_date && availableSessions.length === 0 && (
                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            لا يوجد حصص مسندة لك في هذا اليوم
                                        </p>
                                    )}
                                    {errors.period_id && <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1"><X size={14} />{errors.period_id}</p>}
                                </div>

                                {/* Subject Details Card */}
                                <div className="col-span-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 shadow-inner grid grid-cols-1 sm:grid-cols-3 gap-5">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">المادة</p>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                            {data.subject_id ? subjects.find(s => s.id === data.subject_id)?.name : '-'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">الصف</p>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                            {data.grade_id ? grades.find(g => g.id === data.grade_id)?.name : '-'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">الشعبة</p>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                            {data.division_id ? (grades.find(g => g.id === data.grade_id)?.divisions?.find(d => d.id === data.division_id)?.name || '-') : '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Lesson Title */}
                                <div className="col-span-full space-y-3">
                                    <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
                                        عنوان الحصة / الدرس <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="lesson_title"
                                        value={data.lesson_title}
                                        onChange={(e) => setData('lesson_title', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
                                        placeholder="مثال: مراجعة الفصل الأول..."
                                        required
                                    />
                                    {errors.lesson_title && <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1"><X size={14} />{errors.lesson_title}</p>}
                                </div>

                                {/* Topics Covered */}
                                <div className="col-span-full space-y-3">
                                    <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <FileText size={16} className="text-primary-500" />
                                        ما تم دراسته <span className="text-xs font-semibold text-slate-400">(اختياري)</span>
                                    </label>
                                    <textarea
                                        id="topics_covered"
                                        className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-5 py-4 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-none"
                                        rows="3"
                                        placeholder="اكتب هنا ملخصاً لما تم شرحه في الحصة..."
                                        value={data.topics_covered}
                                        onChange={(e) => setData('topics_covered', e.target.value)}
                                    ></textarea>
                                    {errors.topics_covered && <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1"><X size={14} />{errors.topics_covered}</p>}
                                </div>

                                {/* Homework */}
                                <div className="col-span-full space-y-3">
                                    <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <BookOpen size={16} className="text-emerald-500" />
                                        الواجب المنزلي المطلوب <span className="text-xs font-semibold text-slate-400">(اختياري)</span>
                                    </label>
                                    <textarea
                                        id="homework"
                                        className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-5 py-4 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-none"
                                        rows="2"
                                        placeholder="تفاصيل الواجب المنزلي (إن وجد)..."
                                        value={data.homework}
                                        onChange={(e) => setData('homework', e.target.value)}
                                    ></textarea>
                                    {errors.homework && <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1"><X size={14} />{errors.homework}</p>}
                                </div>

                                {/* Notes */}
                                <div className="col-span-full space-y-3">
                                    <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-slate-400 rounded-full"></span>
                                        الملاحظات <span className="text-xs font-semibold text-slate-400">(اختياري)</span>
                                    </label>
                                    <textarea
                                        id="notes"
                                        className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-5 py-4 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-none"
                                        rows="2"
                                        placeholder="أي ملاحظات إضافية حول الحصة..."
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                    ></textarea>
                                    {errors.notes && <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1"><X size={14} />{errors.notes}</p>}
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4 mt-8 border-t border-slate-100 dark:border-slate-800/50">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        setData('status', 'draft');
                                        setTimeout(() => submit(e), 0);
                                    }}
                                    disabled={processing}
                                    className="flex-1 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:bg-amber-500/20 dark:hover:bg-amber-500 dark:text-amber-400 dark:hover:text-white border border-amber-200 dark:border-amber-500/30 px-6 py-4 rounded-[1.25rem] font-black flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
                                >
                                    <Clock size={20} />
                                    حفظ كمسودة
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        setData('status', 'published');
                                        setTimeout(() => submit(e), 0);
                                    }}
                                    disabled={processing}
                                    className="flex-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-8 py-4 rounded-[1.25rem] font-black flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-primary-500/30 hover:-translate-y-0.5 active:scale-95"
                                >
                                    <CheckCircle size={20} />
                                    نشر الحصة
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="w-full sm:w-auto px-8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-4 rounded-[1.25rem] font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
