import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import { 
    Book, Trash2, X, Layers, FileText, Download,
    BookOpen, Sparkles, Filter, User, Check, Clock, AlertCircle, Edit, Calendar, LayoutGrid, List, MessageSquare, Send, Printer
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { StudyPlanPdfTemplate } from '@/Components/StudyPlanPdfTemplate';

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl z-10 overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-indigo-500" />
                <div className="flex items-center justify-between p-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export default function AcademicStudyPlansIndex({ studyPlans, grades, subjects, divisions, filters, teachers }) {
    const { flash } = usePage().props;
    
    const [filterGrade, setFilterGrade] = useState(filters?.grade_id || '');
    const [filterSubject, setFilterSubject] = useState(filters?.subject_id || '');
    const [filterTeacher, setFilterTeacher] = useState(filters?.teacher_id || '');
    const [filterStatus, setFilterStatus] = useState(filters?.status || '');

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewingPlan, setReviewingPlan] = useState(null);
    const [reviewForm, setReviewForm] = useState({ admin_feedback: '' });
    const [processing, setProcessing] = useState(false);
    
    // Comments State
    const [comments, setComments] = useState([]);
    const [activeCellKey, setActiveCellKey] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    
    // PDF Export State
    const [pdfPlan, setPdfPlan] = useState(null);

    React.useEffect(() => {
        if (pdfPlan) {
            const element = document.getElementById(`pdf-export-plan-${pdfPlan.id}`);
            if (element) {
                const opt = {
                    margin:       0,
                    filename:     `الخطة_الدراسية_${pdfPlan.title}.pdf`,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, useCORS: true },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                html2pdf().set(opt).from(element).save().then(() => {
                    setPdfPlan(null); // Reset after download
                });
            }
        }
    }, [pdfPlan]);
    
    // Check localStorage for view mode preference
    const [viewMode, setViewMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('study_plans_view_mode') || 'table';
        }
        return 'table';
    });

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('study_plans_view_mode', mode);
        }
    };

    const applyFilters = () => {
        router.get(route('academic.study-plans.index'), { 
            grade_id: filterGrade, 
            subject_id: filterSubject,
            teacher_id: filterTeacher,
            status: filterStatus
        }, { preserveState: true });
    };

    const fetchComments = async (id) => {
        setLoadingComments(true);
        try {
            const res = await axios.get(route('study-plan-comments.index', id));
            setComments(res.data);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const openReviewModal = (plan) => {
        setReviewingPlan(plan);
        setReviewForm({ admin_feedback: plan.admin_feedback || '' });
        setIsReviewModalOpen(true);
        setActiveCellKey(null);
        setComments([]);
        fetchComments(plan.id);
    };

    const addComment = async () => {
        if (!newComment.trim() || !activeCellKey || !reviewingPlan) return;
        try {
            const res = await axios.post(route('study-plan-comments.store', reviewingPlan.id), {
                cell_key: activeCellKey,
                comment: newComment
            });
            setComments([res.data, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error('Error adding comment:', err);
        }
    };

    const resolveComment = async (commentId) => {
        try {
            await axios.patch(route('study-plan-comments.resolve', commentId));
            setComments(comments.map(c => c.id === commentId ? { ...c, is_resolved: true } : c));
        } catch (err) {
            console.error('Error resolving comment:', err);
        }
    };

    const submitReview = (e, status) => {
        if(e) e.preventDefault();
        setProcessing(true);
        router.post(route('academic.study-plans.review', reviewingPlan.id), {
            status: status,
            admin_feedback: reviewForm.admin_feedback
        }, {
            onSuccess: () => setIsReviewModalOpen(false),
            onFinish: () => setProcessing(false)
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 text-xs rounded-lg font-bold flex items-center gap-1"><Check size={14}/> معتمدة</span>;
            case 'pending': return <span className="bg-amber-100 text-amber-700 px-3 py-1 text-xs rounded-lg font-bold flex items-center gap-1"><Clock size={14}/> قيد المراجعة</span>;
            case 'rejected': return <span className="bg-rose-100 text-rose-700 px-3 py-1 text-xs rounded-lg font-bold flex items-center gap-1"><AlertCircle size={14}/> مرفوضة</span>;
            default: return <span className="bg-slate-100 text-slate-700 px-3 py-1 text-xs rounded-lg font-bold flex items-center gap-1"><FileText size={14}/> مسودة</span>;
        }
    };

    const deletePlan = (plan) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'هل أنت متأكد من حذف الخطة الدراسية الخاصة بالمعلم نهائياً؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('academic.study-plans.destroy', plan.id));
            }
        });
    };

    return (
        <AdminLayout activeMenu="الخطط الدراسية">
            <Head title="متابعة الخطط الدراسية | النظام الأكاديمي" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {flash?.success && (
                    <div className="mb-6 flex items-center gap-3 bg-emerald-50 text-emerald-700 px-6 py-4 rounded-2xl text-sm font-bold shadow-sm">
                        <Sparkles size={20} className="text-emerald-500" /> {flash.success}
                    </div>
                )}

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
                                متابعة الخطط الدراسية
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">استعراض وتحميل الخطط وتوزيع المناهج المرفوعة من قبل المعلمين</p>
                        </div>
                        <div className="flex gap-3">
                            <a href={route('academic.study-plans.analytics')} className="bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                                <Sparkles size={18} />
                                <span>مؤشرات الأداء</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-primary-500" />
                            <h3 className="font-bold text-slate-800 dark:text-white">تصفية النتائج</h3>
                        </div>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button 
                                onClick={() => handleViewModeChange('table')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <List size={16} /> جدول
                            </button>
                            <button 
                                onClick={() => handleViewModeChange('grid')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <LayoutGrid size={16} /> بطاقات
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
                        <div className="group flex flex-col">
                            <label className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">الحالة</label>
                            <SelectInput 
                                className="w-full"
                                value={filterStatus} 
                                onChange={setFilterStatus}
                                options={[
                                    { value: '', label: 'جميع الحالات' }, 
                                    { value: 'pending', label: 'قيد المراجعة' },
                                    { value: 'approved', label: 'معتمدة' },
                                    { value: 'rejected', label: 'مرفوضة' },
                                    { value: 'draft', label: 'مسودة' }
                                ]}
                            />
                        </div>
                        <div className="group flex flex-col">
                            <label className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">المعلم</label>
                            <SelectInput 
                                className="w-full"
                                value={filterTeacher} 
                                onChange={setFilterTeacher}
                                options={[{ value: '', label: 'جميع المعلمين' }, ...teachers.map(t => ({ value: t.id, label: t.name }))]}
                            />
                        </div>
                        <div className="group flex flex-col">
                            <label className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">الصف</label>
                            <SelectInput 
                                className="w-full"
                                value={filterGrade} 
                                onChange={setFilterGrade}
                                options={[{ value: '', label: 'جميع الصفوف' }, ...grades.map(g => ({ value: g.id, label: g.name }))]}
                            />
                        </div>
                        <div className="group flex flex-col">
                            <label className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">المادة</label>
                            <SelectInput 
                                className="w-full"
                                value={filterSubject} 
                                onChange={setFilterSubject}
                                options={[{ value: '', label: 'جميع المواد' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]}
                            />
                        </div>
                        <div className="group flex flex-col">
                            <button onClick={applyFilters} className="w-full px-6 py-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2">
                                <Filter size={16} /> بحث
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {viewMode === 'table' ? (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800">
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800/50">
                            <thead className="bg-gray-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">المعلم وتاريخ الرفع</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">عنوان الخطة</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">الصف والشعبة والمادة</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">الحالة</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-800/50">
                                {studyPlans.data.length > 0 ? studyPlans.data.map(plan => (
                                    <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">
                                                    {plan.teacher?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {plan.teacher?.name || 'غير محدد'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                                        <Calendar size={12} /> {new Date(plan.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                                                <span className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{plan.title}</span>
                                            </div>
                                            {plan.notes && (
                                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-1">
                                                    ملاحظة: {plan.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white font-bold mb-1.5 flex items-center gap-1.5"><Book size={14} className="text-primary-500"/>{plan.subject?.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400 flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5"><Layers size={14} className="text-slate-400"/> {plan.grade?.name}</div>
                                                {(() => {
                                                    let divIds = [];
                                                    try {
                                                        divIds = typeof plan.division_ids === 'string' ? JSON.parse(plan.division_ids) : plan.division_ids;
                                                    } catch(e) {}
                                                    
                                                    return Array.isArray(divIds) && divIds.length > 0 && divisions?.length > 0 ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-3.5 h-3.5 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-sm">
                                                                <Filter size={10} className="text-slate-400"/>
                                                            </span>
                                                            <span className="truncate max-w-[150px]" title={divIds.map(id => divisions.find(d => d.id == id)?.name).filter(Boolean).join('، ')}>
                                                                {divIds.map(id => divisions.find(d => d.id == id)?.name).filter(Boolean).join('، ')}
                                                            </span>
                                                        </div>
                                                    ) : null;
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getStatusBadge(plan.status)}
                                            {plan.admin_feedback && (
                                                <div className="mt-2 text-[10px] text-gray-500 dark:text-slate-400 truncate max-w-[120px] mx-auto" title={plan.admin_feedback}>
                                                    رد: {plan.admin_feedback}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex items-center justify-center gap-2">
                                                <a 
                                                    href={route('academic.study-plans.download', plan.id)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="تحميل الخطة"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                                {plan.status === 'pending' ? (
                                                    <button onClick={() => openReviewModal(plan)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="مراجعة واعتماد">
                                                        <Check size={18} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => openReviewModal(plan)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 transition-colors" title="تعديل التقييم">
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                {plan.status === 'approved' && plan.content && (
                                                    <button 
                                                        onClick={() => setPdfPlan(plan)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 transition-colors" title="تصدير كملف PDF معتمد"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => deletePlan(plan)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-red-500 hover:bg-red-50 transition-colors" title="حذف">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                            <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                            لا توجد خطط دراسية مطابقة للبحث
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                ) : (
                    studyPlans.data.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">لا توجد خطط دراسية</h3>
                            <p className="text-slate-500 text-sm">لم يتم العثور على أي خطط دراسية مطابقة لبحثك.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {studyPlans.data.map(plan => {
                                let divIds = [];
                                try {
                                    divIds = typeof plan.division_ids === 'string' ? JSON.parse(plan.division_ids) : plan.division_ids;
                                } catch(e) {}
                                const hasDivisions = Array.isArray(divIds) && divIds.length > 0 && divisions?.length > 0;

                                return (
                                    <div key={plan.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition relative group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-2xl flex items-center justify-center">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-800 dark:text-white truncate max-w-[180px]" title={plan.title}>{plan.title}</h3>
                                                    <div className="mt-2 inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800/50">
                                                        <User size={14}/> 
                                                        <span>{plan.teacher?.name || 'غير محدد'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {getStatusBadge(plan.status)}
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                    {plan.status === 'pending' && (
                                                        <button onClick={() => openReviewModal(plan)} className="p-2 text-white hover:bg-emerald-700 bg-emerald-500 rounded-xl shadow-md" title="مراجعة واعتماد"><Check size={16} /></button>
                                                    )}
                                                    {plan.status !== 'pending' && (
                                                        <button onClick={() => openReviewModal(plan)} className="p-2 text-slate-500 hover:text-primary-600 bg-slate-50 dark:bg-slate-800 rounded-xl" title="تعديل التقييم"><Edit size={16} /></button>
                                                    )}
                                                    <button onClick={() => deletePlan(plan)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-800 rounded-xl" title="حذف"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {plan.admin_feedback && (
                                            <div className={`mb-4 border p-3 rounded-xl text-xs font-bold ${plan.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
                                                <div className="flex items-center gap-1 mb-1">
                                                    <AlertCircle size={14}/> {plan.status === 'rejected' ? 'سبب الرفض:' : 'ملاحظات المشرف:'}
                                                </div>
                                                {plan.admin_feedback}
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                                <Layers size={14} /> 
                                                {plan.grade?.name} 
                                            </span>
                                            {hasDivisions && (
                                                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                                    <Filter size={14} />
                                                    <span className="truncate max-w-[120px]" title={divIds.map(id => divisions.find(d => d.id == id)?.name).filter(Boolean).join('، ')}>
                                                        {divIds.map(id => divisions.find(d => d.id == id)?.name).filter(Boolean).join('، ')}
                                                    </span>
                                                </span>
                                            )}
                                            <span className="text-xs font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                                <Book size={14} /> {plan.subject?.name}
                                            </span>
                                        </div>

                                        {plan.notes && (
                                            <div className="mb-5 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                                                <div className="font-bold mb-1 text-slate-700 dark:text-slate-300">ملاحظات المعلم:</div>
                                                {plan.notes}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-slate-400 mb-4 border-t dark:border-slate-800 pt-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(plan.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                        </div>

                                        {plan.attachment_path && (
                                            <a 
                                                href={route('academic.study-plans.download', plan.id)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-bold text-sm transition mt-auto"
                                            >
                                                <Download size={16} /> تحميل الخطة المرفقة
                                            </a>
                                        )}
                                        {plan.status === 'approved' && plan.content && (
                                            <button 
                                                onClick={() => setPdfPlan(plan)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl font-bold text-sm transition mt-2 border border-emerald-100 dark:border-emerald-800"
                                            >
                                                <Printer size={16} /> تصدير كملف PDF معتمد
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>

            {/* Review Modal */}
            <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="مراجعة الخطة الدراسية">
                <form className="space-y-6">
                    {reviewingPlan && (
                        <div className="mb-6 space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                                <h4 className="font-bold text-slate-800 dark:text-white mb-2">{reviewingPlan.title}</h4>
                                <div className="text-sm text-slate-500 flex gap-4">
                                    <span>المعلم: {reviewingPlan.teacher?.name}</span>
                                    <span>المادة: {reviewingPlan.subject?.name}</span>
                                </div>
                            </div>

                            {reviewingPlan.content && (Array.isArray(reviewingPlan.content) ? reviewingPlan.content.length > 0 : reviewingPlan.content?.rows?.length > 0) && reviewingPlan.template && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl max-h-[60vh]">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                                            <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                                                <tr>
                                                    {reviewingPlan.template.columns.map((col, idx) => (
                                                        <th key={idx} className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 last:border-0">{col.label}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                                                {((reviewingPlan.content && typeof reviewingPlan.content === 'object' && !Array.isArray(reviewingPlan.content)) ? (reviewingPlan.content.rows || []) : (reviewingPlan.content || [])).map((row, rowIdx) => (
                                                    <tr key={rowIdx}>
                                                        {reviewingPlan.template.columns.map((col, colIdx) => {
                                                            const cellKey = `row_${rowIdx}_col_${col.id}`;
                                                            const cellComments = comments.filter(c => c.cell_key === cellKey);
                                                            const hasOpenComments = cellComments.some(c => !c.is_resolved);
                                                            const isSelected = activeCellKey === cellKey;
                                                            return (
                                                                <td 
                                                                    key={colIdx} 
                                                                    onClick={() => setActiveCellKey(cellKey)}
                                                                    className={`px-4 py-3 border-l border-slate-200 dark:border-slate-700 last:border-0 align-top whitespace-pre-wrap cursor-pointer transition relative group ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-inset ring-primary-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                                >
                                                                    {hasOpenComments && (
                                                                        <div className="absolute top-2 left-2 flex items-center justify-center">
                                                                            <span className="flex h-3 w-3 relative">
                                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div className="group-hover:opacity-100 opacity-0 absolute top-2 left-2 text-slate-300 transition-opacity">
                                                                        {!hasOpenComments && <MessageSquare size={14} />}
                                                                    </div>
                                                                    <div className="pr-2">
                                                                        {col.type === 'checkbox' 
                                                                            ? (row[col.id] === 'true' || row[col.id] === true ? 'نعم' : 'لا') 
                                                                            : (row[col.id] || '-')}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="lg:col-span-1 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 flex flex-col max-h-[60vh]">
                                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-xl font-bold flex items-center gap-2">
                                            <MessageSquare size={18} className="text-primary-500" />
                                            التعليقات الحية
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {!activeCellKey ? (
                                                <div className="text-center text-slate-400 text-sm py-10">
                                                    انقر على أي خلية في الجدول لإضافة تعليق أو عرض المحادثة المرتبطة بها.
                                                </div>
                                            ) : loadingComments ? (
                                                <div className="text-center text-slate-400 text-sm py-10">جاري التحميل...</div>
                                            ) : (
                                                <>
                                                    {comments.filter(c => c.cell_key === activeCellKey).length === 0 ? (
                                                        <div className="text-center text-slate-400 text-sm py-10">لا توجد تعليقات على هذه الخلية بعد.</div>
                                                    ) : (
                                                        comments.filter(c => c.cell_key === activeCellKey).map(comment => (
                                                            <div key={comment.id} className={`p-3 rounded-xl text-sm ${comment.is_resolved ? 'bg-slate-100 dark:bg-slate-800 opacity-60' : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'}`}>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                                        <User size={12} className="text-slate-400" />
                                                                        {comment.user?.name}
                                                                    </span>
                                                                    {comment.is_resolved && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded">محلول</span>}
                                                                </div>
                                                                <p className="text-slate-600 dark:text-slate-300 mb-2">{comment.comment}</p>
                                                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                                                    <span>{new Date(comment.created_at).toLocaleString('ar-EG')}</span>
                                                                    {!comment.is_resolved && (
                                                                        <button type="button" onClick={() => resolveComment(comment.id)} className="text-primary-500 hover:text-primary-700 font-bold">حل التعليق</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {activeCellKey && (
                                            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-xl">
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="text" 
                                                        value={newComment}
                                                        onChange={e => setNewComment(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addComment())}
                                                        placeholder="اكتب تعليقك..." 
                                                        className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                                                    />
                                                    <button type="button" onClick={addComment} disabled={!newComment.trim()} className="absolute left-2 p-1.5 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg disabled:opacity-50 transition">
                                                        <Send size={16} className="rotate-180" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {reviewingPlan.attachment_path && (
                                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-primary-500" />
                                        <span className="font-bold text-slate-700 dark:text-slate-300">يوجد ملف مرفق جاهز</span>
                                    </div>
                                    <a href={route('academic.study-plans.download', reviewingPlan.id)} className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-200 transition">
                                        <Download size={14} /> تحميل الملف
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">ملاحظات الاعتماد / التعديل (اختياري)</label>
                        <textarea 
                            value={reviewForm.admin_feedback} 
                            onChange={e => setReviewForm({...reviewForm, admin_feedback: e.target.value})} 
                            placeholder="اكتب ملاحظاتك للمعلم هنا لتوجيهه بشأن الخطة..." 
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:border-primary-500 text-sm font-bold min-h-[120px]" 
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 mt-6 pt-6">
                        <button type="button" onClick={() => setIsReviewModalOpen(false)} className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">إلغاء</button>
                        <div className="flex gap-3">
                            <button type="button" onClick={(e) => submitReview(e, 'rejected')} disabled={processing} className="px-6 py-3 rounded-xl font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50 flex items-center gap-2">
                                <AlertCircle size={18}/> رفض الخطة
                            </button>
                            <button type="button" onClick={(e) => submitReview(e, 'approved')} disabled={processing} className="px-6 py-3 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2">
                                <Check size={18}/> اعتماد الخطة
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Hidden container for PDF rendering */}
            {pdfPlan && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }}>
                    <StudyPlanPdfTemplate plan={pdfPlan} />
                </div>
            )}
        </AdminLayout>
    );
}
