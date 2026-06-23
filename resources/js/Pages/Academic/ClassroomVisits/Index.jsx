import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SignaturePad from "@/Components/SignaturePad";
import { Toaster, toast } from 'react-hot-toast';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { 
    BookOpen, Search, Filter, Plus, FileText, CheckCircle, RotateCcw,
    X, Edit, Trash2, Calendar, Clock, AlertCircle, ChevronDown, Check, Eye, MoreVertical
} from 'lucide-react';

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ visit, onPreview, onEdit, onDelete, onApprove, onTeacherSign, auth }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const canEdit = !visit.is_approved && (auth.permissions.includes('تعديل زيارة صفية') || auth.role?.name === 'مدير النظام');
    const canDelete = !visit.is_approved && (auth.permissions.includes('حذف زيارة صفية') || auth.role?.name === 'مدير النظام');
    const canApprove = !visit.is_approved && (auth.permissions.includes('اعتماد زيارة صفية') || auth.role?.name === 'مدير النظام');
    const canSign = !visit.is_approved && !visit.teacher_signature && (auth.permissions.includes('تعديل زيارة صفية') || auth.role?.name === 'مدير النظام');

    return (
        <div ref={ref} className="relative">
            <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 p-2 rounded-xl hover:bg-primary-50/70 dark:hover:bg-primary-500/10 transition-colors inline-flex border border-transparent">
                <MoreVertical size={18} />
            </button>
            {open && (
                <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95">
                    <button onClick={() => { setOpen(false); onPreview(visit); }} className="w-full text-right px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors">
                        <Eye size={16} className="text-slate-400" /> عرض التفاصيل
                    </button>
                    {canSign && (
                        <button onClick={() => { setOpen(false); onTeacherSign(visit); }} className="w-full text-right px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors">
                            <Edit size={16} className="text-slate-400" /> توقيع المعلم
                        </button>
                    )}
                    {canEdit && (
                        <button onClick={() => { setOpen(false); onEdit(visit); }} className="w-full text-right px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors">
                            <Edit size={16} className="text-blue-500" /> تعديل
                        </button>
                    )}
                    {canApprove && (
                        <button onClick={() => { setOpen(false); onApprove(visit); }} className="w-full text-right px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-2.5 transition-colors">
                            <CheckCircle size={16} className="text-emerald-500" /> اعتماد الزيارة
                        </button>
                    )}
                    {canDelete && (
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                            <button onClick={() => { setOpen(false); onDelete(visit.id); }} className="w-full text-right px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2.5 transition-colors">
                                <Trash2 size={16} className="text-red-500" /> حذف
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white dark:bg-slate-900 rounded-3xl w-full ${maxWidth} overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col`}>
                {title && (
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {title}
                        </h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                )}
                <div className="p-0 overflow-y-auto custom-scrollbar max-h-[75vh]">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ─── Pagination Component ───
function Pagination({ data }) {
    if (!data || data.last_page <= 1) return null;
    return (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30 flex-wrap gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">
                عرض {data.from ?? 0} إلى {data.to ?? 0} من أصل {data.total} زيارة صفية
            </p>
            <div className="flex items-center gap-1.5 flex-wrap font-sans" dir="ltr">
                {data.links.map((link, i) => (
                    <button key={i} disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ${
                            link.active
                                ? 'bg-primary-500 text-white border-primary-500 shadow-sm dark:bg-primary-600 dark:border-primary-600'
                                : link.url
                                    ? 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-primary-600 dark:hover:text-primary-400'
                                    : 'bg-white dark:bg-slate-950 text-slate-300 dark:text-slate-650 border-slate-100 dark:border-slate-850/50 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function ClassroomVisitsIndex({ auth, visits, teachers, supervisors, grades, filters }) {
    const { flash } = usePage().props;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isTeacherSignModalOpen, setIsTeacherSignModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);

    const [showFilters, setShowFilters] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        teacher_id: '',
        grade_id: '',
        division_id: '',
        visit_date: new Date().toISOString().split('T')[0],
        visit_type: 'توجيهية',
        discussed_points: '',
        notes: '',
        supervisor_signature: null,
    });

    const { data: teacherData, setData: setTeacherData, post: postTeacher, processing: processingTeacher, reset: resetTeacher, clearErrors: clearTeacherErrors, errors: teacherErrors } = useForm({
        teacher_signature: null,
    });

    const { data: approveData, setData: setApproveData, post: postApprove, processing: processingApprove, reset: resetApprove, clearErrors: clearApproveErrors, errors: approveErrors } = useForm({
        score: '',
    });

    const [filterData, setFilterData] = useState({
        teacher_id: filters?.teacher_id || '',
        supervisor_id: filters?.supervisor_id || '',
        grade_id: filters?.grade_id || '',
        date_range: filters?.date_range || '',
    });

    const selectedGrade = grades.find(g => g.id.toString() === data.grade_id?.toString());
    const availableDivisions = selectedGrade ? selectedGrade.divisions : [];

    const handleFilter = () => {
        router.get(route('academic.classroom-visits'), filterData, { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setFilterData({ teacher_id: '', supervisor_id: '', grade_id: '', date_range: '' });
        router.get(route('academic.classroom-visits'), {}, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = filterData.teacher_id !== '' || filterData.supervisor_id !== '' || filterData.grade_id !== '' || filterData.date_range !== '';

    const openCreateModal = () => {
        reset();
        clearErrors();
        setSelectedVisit(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (visit) => {
        if (visit.is_approved) {
            toast.error('لا يمكن تعديل زيارة معتمدة');
            return;
        }
        reset();
        clearErrors();
        setSelectedVisit(visit);
        setData({
            teacher_id: visit.teacher_id,
            grade_id: visit.grade_id,
            division_id: visit.division_id,
            visit_date: visit.visit_date,
            visit_type: visit.visit_type || 'توجيهية',
            discussed_points: visit.discussed_points || '',
            notes: visit.notes || '',
            supervisor_signature: null,
        });
        setIsCreateModalOpen(true);
    };

    const openPreviewModal = (visit) => {
        setSelectedVisit(visit);
        setIsPreviewModalOpen(true);
    };

    const openTeacherSignModal = (visit) => {
        resetTeacher();
        clearTeacherErrors();
        setSelectedVisit(visit);
        setIsTeacherSignModalOpen(true);
    };

    const openApproveModal = (visit) => {
        resetApprove();
        clearApproveErrors();
        setSelectedVisit(visit);
        setApproveData('score', visit.score || '');
        setIsApproveModalOpen(true);
    };



    const submit = (e) => {
        e.preventDefault();
        if (selectedVisit) {
            put(route('academic.classroom-visits.update', selectedVisit.id), {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    toast.success('تم التعديل بنجاح');
                }
            });
        } else {
            post(route('academic.classroom-visits.store'), {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    toast.success('تمت الإضافة بنجاح');
                }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذه الزيارة؟')) {
            destroy(route('academic.classroom-visits.destroy', id), {
                onSuccess: () => toast.success('تم الحذف بنجاح')
            });
        }
    };

    const submitTeacherSign = (e) => {
        e.preventDefault();
        postTeacher(route('academic.classroom-visits.teacher-sign', selectedVisit.id), {
            onSuccess: () => {
                setIsTeacherSignModalOpen(false);
                toast.success('تم حفظ توقيع المعلم بنجاح');
            }
        });
    };

    const submitApprove = (e) => {
        e.preventDefault();
        postApprove(route('academic.classroom-visits.approve', selectedVisit.id), {
            onSuccess: () => {
                setIsApproveModalOpen(false);
                toast.success('تم اعتماد الزيارة بنجاح');
            }
        });
    };

    const getDayName = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('ar-EG', { weekday: 'long' });
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <AdminLayout activeMenu="الزيارات الصفية">
            <Head title="الزيارات الصفية | النظام الأكاديمي" />
            <Toaster position="top-center" />

            <div className="screen-only-content space-y-8 animate-fade-in">
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur border border-emerald-250 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <Check size={16} /> {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-3 bg-red-50/80 dark:bg-red-500/10 backdrop-blur border border-red-250 dark:border-red-500/20 text-red-700 dark:text-red-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <AlertCircle size={16} /> {flash.error}
                    </div>
                )}

                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight">إدارة الزيارات الصفية</h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تسجيل وتقييم واعتماد الزيارات الصفية للمعلمين في المدرسة</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            {(auth.permissions.includes('إضافة زيارة صفية') || auth.role?.name === 'مدير النظام') && (
                                <button
                                    onClick={openCreateModal}
                                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                                >
                                    <Plus size={18} />
                                    <span>زيارة صفية جديدة</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                    
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={18} className="text-primary-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white">تصفية النتائج</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Teacher Filter */}
                        <div className="group flex flex-col">
                            <label className="mb-1.5 text-[11px] font-bold text-slate-500 dark:text-400 uppercase tracking-wider">المعلم</label>
                            <SelectInput 
                                className="w-full" 
                                value={filterData.teacher_id} 
                                onChange={val => setFilterData({...filterData, teacher_id: val})}
                                options={[
                                    { value: '', label: 'جميع المعلمين' },
                                    ...teachers.map(t => ({ value: t.id, label: t.name }))
                                ]}
                            />
                        </div>
                        
                        {/* Supervisor Filter */}
                        <div className="group flex flex-col">
                            <label className="mb-1.5 text-[11px] font-bold text-slate-500 dark:text-400 uppercase tracking-wider">المشرف</label>
                            <SelectInput 
                                className="w-full" 
                                value={filterData.supervisor_id} 
                                onChange={val => setFilterData({...filterData, supervisor_id: val})}
                                options={[
                                    { value: '', label: 'جميع المشرفين' },
                                    ...supervisors.map(s => ({ value: s.id, label: s.name }))
                                ]}
                            />
                        </div>

                        {/* Grade Filter */}
                        <div className="group flex flex-col">
                            <label className="mb-1.5 text-[11px] font-bold text-slate-500 dark:text-400 uppercase tracking-wider">الصف</label>
                            <SelectInput 
                                className="w-full" 
                                value={filterData.grade_id} 
                                onChange={val => setFilterData({...filterData, grade_id: val})}
                                options={[
                                    { value: '', label: 'جميع الصفوف' },
                                    ...grades.map(g => ({ value: g.id, label: g.name }))
                                ]}
                            />
                        </div>

                        {/* Date Range Filter */}
                        <div className="group flex flex-col">
                            <label className="mb-1.5 text-[11px] font-bold text-slate-500 dark:text-400 uppercase tracking-wider">التاريخ (من - إلى)</label>
                            <FlatpickrInput 
                                type="date"
                                options={{ mode: 'range' }}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl !py-[11px] !text-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 !pl-8"
                                value={filterData.date_range}
                                onChange={val => setFilterData({...filterData, date_range: val})}
                                placeholder="اختر الفترة..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
                        <button 
                            onClick={handleFilter} 
                            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:shadow-primary-500/20 text-sm"
                        >
                            <Filter size={16} />
                            تطبيق الفرز
                        </button>
                        {hasActiveFilters && (
                            <button 
                                onClick={resetFilters} 
                                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"
                            >
                                <RotateCcw size={16} />
                                إعادة ضبط
                            </button>
                        )}
                    </div>
                </div>

                {/* Table View */}
                <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">التاريخ</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">المعلم</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الصف والشعبة</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">نوع الزيارة</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الموجه/المشرف</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الحالة</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {visits.data.map((visit) => (
                                    <tr key={visit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{getDayName(visit.visit_date)}</span>
                                                <span className="text-xs text-slate-500 mt-0.5">{formatDate(visit.visit_date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-bold text-xs">
                                                    {visit.teacher?.name?.charAt(0)}
                                                </div>
                                                {visit.teacher?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{visit.grade?.name}</span>
                                                <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 w-max px-2 py-0.5 rounded-md mt-1">{visit.division?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${visit.visit_type === 'نموذجية' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'}`}>
                                                {visit.visit_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                            {visit.supervisor?.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {visit.is_approved ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-full text-[11px] font-bold w-max">
                                                        <CheckCircle size={12} /> معتمدة
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded-full text-[11px] font-bold w-max">
                                                        <Clock size={12} /> قيد المراجعة
                                                    </span>
                                                )}
                                                
                                                <span className={`text-[10px] font-bold ${visit.teacher_signature ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                    {visit.teacher_signature ? '✓ توقيع المعلم' : '× بانتظار المعلم'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ActionMenu 
                                                visit={visit} 
                                                onPreview={openPreviewModal} 
                                                onEdit={openEditModal} 
                                                onDelete={handleDelete} 
                                                onApprove={openApproveModal}
                                                onTeacherSign={openTeacherSignModal}
                                                auth={auth}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {visits.data.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                                <BookOpen size={48} className="mb-4 opacity-20" />
                                                <p className="font-bold text-lg">لا توجد زيارات صفية</p>
                                                <p className="text-sm mt-1">لم يتم العثور على أية زيارات صفية مطابقة.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination data={visits} />
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="max-w-2xl" title={selectedVisit ? 'تعديل الزيارة الصفية' : 'إضافة زيارة صفية جديدة'}>
                <form onSubmit={submit} className="flex flex-col">
                    <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">تاريخ الزيارة</label>
                            <FlatpickrInput
                                value={data.visit_date}
                                onChange={dateStr => setData('visit_date', dateStr)}
                                placeholder="تاريخ الزيارة"
                                required
                            />
                            {errors.visit_date && <p className="text-red-500 text-xs mt-1 font-bold">{errors.visit_date}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">نوع الزيارة</label>
                            <SelectInput
                                value={data.visit_type}
                                onChange={val => setData('visit_type', val)}
                                options={[{value: 'توجيهية', label: 'توجيهية'}, {value: 'نموذجية', label: 'نموذجية'}]}
                                placeholder="نوع الزيارة"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">المعلم</label>
                        <SelectInput
                            value={data.teacher_id}
                            onChange={val => setData('teacher_id', val)}
                            options={teachers.map(t => ({ value: t.id, label: t.name }))}
                            placeholder="-- اختر المعلم --"
                            required
                        />
                        {errors.teacher_id && <p className="text-red-500 text-xs mt-1 font-bold">{errors.teacher_id}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">الصف</label>
                            <SelectInput
                                value={data.grade_id}
                                onChange={val => {
                                    setData({ ...data, grade_id: val, division_id: '' });
                                }}
                                options={grades.map(g => ({ value: g.id, label: g.name }))}
                                placeholder="-- اختر الصف --"
                                required
                            />
                            {errors.grade_id && <p className="text-red-500 text-xs mt-1 font-bold">{errors.grade_id}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">الشعبة</label>
                            <SelectInput
                                value={data.division_id}
                                onChange={val => setData('division_id', val)}
                                options={availableDivisions.map(d => ({ value: d.id, label: d.name }))}
                                placeholder="-- اختر الشعبة --"
                                required
                                disabled={!data.grade_id}
                            />
                            {errors.division_id && <p className="text-red-500 text-xs mt-1 font-bold">{errors.division_id}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">النقاط التي تم مناقشتها مع المعلم</label>
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-toolbar]:border-slate-700 [&_.ql-toolbar]:bg-slate-50 dark:[&_.ql-toolbar]:bg-slate-800/50 [&_.ql-container]:border-none [&_.ql-container]:text-sm [&_.ql-editor]:min-h-[120px] dark:[&_.ql-editor]:text-white dark:[&_.ql-picker]:text-slate-300 dark:[&_.ql-stroke]:stroke-slate-300 dark:[&_.ql-fill]:fill-slate-300 dark:[&_.ql-picker-options]:bg-slate-800 dark:[&_.ql-picker-options]:border-slate-700">
                            <ReactQuill 
                                theme="snow"
                                value={data.discussed_points}
                                onChange={content => setData('discussed_points', content)}
                                placeholder="أدخل النقاط..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">الملاحظات والتوصيات</label>
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-toolbar]:border-slate-700 [&_.ql-toolbar]:bg-slate-50 dark:[&_.ql-toolbar]:bg-slate-800/50 [&_.ql-container]:border-none [&_.ql-container]:text-sm [&_.ql-editor]:min-h-[120px] dark:[&_.ql-editor]:text-white dark:[&_.ql-picker]:text-slate-300 dark:[&_.ql-stroke]:stroke-slate-300 dark:[&_.ql-fill]:fill-slate-300 dark:[&_.ql-picker-options]:bg-slate-800 dark:[&_.ql-picker-options]:border-slate-700">
                            <ReactQuill 
                                theme="snow"
                                value={data.notes}
                                onChange={content => setData('notes', content)}
                                placeholder="ملاحظات وتوصيات المشرف..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                            توقيع المشرف 
                            {selectedVisit && selectedVisit.supervisor_signature && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-normal text-xs mr-2">
                                    (تم إرفاق التوقيع مسبقاً، ارسم لتغييره)
                                </span>
                            )}
                        </label>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
                            <SignaturePad 
                                onChange={(val) => setData('supervisor_signature', val)} 
                                error={errors.supervisor_signature}
                            />
                        </div>
                    </div>

                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors text-sm"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm shadow-sm"
                        >
                            {processing ? 'جاري الحفظ...' : 'حفظ الزيارة'}
                        </button>
                    </div>
                </form>
            </Modal>



            {/* Preview Modal */}
            <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} maxWidth="max-w-3xl" title="تفاصيل الزيارة الصفية">
                {selectedVisit && (
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">اليوم والتاريخ</span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{getDayName(selectedVisit.visit_date)} - {formatDate(selectedVisit.visit_date)}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">نوع الزيارة</span>
                                <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">{selectedVisit.visit_type}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">الاعتماد والتقييم</span>
                                {selectedVisit.is_approved ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-1">
                                        <CheckCircle size={14}/> معتمدة ({selectedVisit.score}%)
                                    </span>
                                ) : (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center gap-1"><Clock size={14}/> قيد المراجعة</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">المعلم</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center font-bold text-xs">{selectedVisit.teacher?.name?.charAt(0)}</div>
                                    <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{selectedVisit.teacher?.name}</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">الصف والشعبة</span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{selectedVisit.grade?.name} — {selectedVisit.division?.name}</span>
                            </div>
                        </div>

                        <div>
                            <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">النقاط التي تم مناقشتها مع المعلم</span>
                            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 min-h-[80px] text-sm leading-relaxed">
                                {selectedVisit.discussed_points ? <div dangerouslySetInnerHTML={{ __html: selectedVisit.discussed_points }} /> : <span className="text-slate-400 italic">لا يوجد</span>}
                            </div>
                        </div>

                        <div>
                            <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">الملاحظات والتوصيات</span>
                            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 min-h-[80px] text-sm leading-relaxed">
                                {selectedVisit.notes ? <div dangerouslySetInnerHTML={{ __html: selectedVisit.notes }} /> : <span className="text-slate-400 italic">لا يوجد</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">توقيع المشرف ({selectedVisit.supervisor?.name})</span>
                                {selectedVisit.supervisor_signature_url ? (
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-2 bg-white dark:bg-slate-800 flex justify-center h-28 items-center overflow-hidden">
                                        <img src={selectedVisit.supervisor_signature_url} alt="توقيع المشرف" className="max-h-full max-w-full object-contain filter dark:invert" />
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 dark:border-slate-700 border-dashed rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-center h-28 items-center text-slate-400 text-sm font-bold">
                                        لا يوجد توقيع
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">توقيع المعلم</span>
                                {selectedVisit.teacher_signature_url ? (
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-2 bg-white dark:bg-slate-800 flex justify-center h-28 items-center relative overflow-hidden">
                                        <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                                            <CheckCircle size={10} /> معتمد
                                        </div>
                                        <img src={selectedVisit.teacher_signature_url} alt="توقيع المعلم" className="max-h-full max-w-full object-contain filter dark:invert" />
                                    </div>
                                ) : (
                                    <div className="border border-amber-200 dark:border-amber-900/50 border-dashed rounded-2xl p-4 bg-amber-50/50 dark:bg-amber-900/10 flex flex-col justify-center h-28 items-center text-amber-500 dark:text-amber-500 text-sm gap-2 font-bold">
                                        <AlertCircle size={20} />
                                        <span>بانتظار توقيع المعلم</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
            {/* Teacher Sign Modal */}
            <Modal isOpen={isTeacherSignModalOpen} onClose={() => setIsTeacherSignModalOpen(false)} maxWidth="max-w-lg" title="توقيع المعلم">
                <form onSubmit={submitTeacherSign} className="flex flex-col">
                    <div className="p-6 space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex gap-3 text-amber-700 dark:text-amber-500">
                            <AlertCircle size={20} className="shrink-0" />
                            <div className="text-sm font-semibold">يجب على المعلم قراءة جميع التفاصيل والملاحظات في المعاينة قبل التوقيع.</div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">توقيع المعلم</label>
                            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
                                <SignaturePad 
                                    onChange={(val) => setTeacherData('teacher_signature', val)} 
                                    error={teacherErrors.teacher_signature}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsTeacherSignModalOpen(false)} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors text-sm">
                            إلغاء
                        </button>
                        <button type="submit" disabled={processingTeacher} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm shadow-sm">
                            {processingTeacher ? 'جاري الحفظ...' : 'حفظ التوقيع'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Approval Modal */}
            <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} maxWidth="max-w-md" title="اعتماد وتقييم الزيارة">
                <form onSubmit={submitApprove} className="flex flex-col">
                    <div className="p-6 space-y-4">
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-2xl flex gap-3 text-emerald-700 dark:text-emerald-500">
                            <CheckCircle size={20} className="shrink-0" />
                            <div className="text-sm font-semibold">بمجرد اعتمادك للزيارة، لن يكون بالإمكان تعديلها أو حذفها لاحقاً.</div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">تقييم المعلم للزيارة الصفية (من 100)</label>
                            <input
                                type="number"
                                min="0" max="100" step="0.01"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500 text-slate-800 dark:text-white font-bold"
                                value={approveData.score}
                                onChange={e => setApproveData('score', e.target.value)}
                                required
                            />
                            {approveErrors.score && <p className="text-red-500 text-xs mt-1 font-bold">{approveErrors.score}</p>}
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsApproveModalOpen(false)} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors text-sm">
                            إلغاء
                        </button>
                        <button type="submit" disabled={processingApprove} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm shadow-sm flex items-center gap-2">
                            <CheckCircle size={16} />
                            {processingApprove ? 'جاري الاعتماد...' : 'اعتماد نهائي'}
                        </button>
                    </div>
                </form>
            </Modal>

        </AdminLayout>
    );
}
