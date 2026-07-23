import React, { useState } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import { 
    Book, Plus, Edit2, Trash2, Search, X, Layers, FileText, Download,
    BookOpen, Sparkles, AlertCircle, Check, FileDown, Clock, Filter, Calendar, LayoutGrid, List, MessageSquare, Send, User, Printer, CalendarDays
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { StudyPlanPdfTemplate } from '@/Components/StudyPlanPdfTemplate';

export default function TeacherStudyPlansIndex({ studyPlans, grades, subjects, divisions, templates = [], filters }) {
    const { flash, errors } = usePage().props;
    
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
            return localStorage.getItem('teacher_study_plans_view_mode') || 'table';
        }
        return 'table';
    });

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('teacher_study_plans_view_mode', mode);
        }
    };

    const [filterGrade, setFilterGrade] = useState(filters?.grade_id || '');
    const [filterSubject, setFilterSubject] = useState(filters?.subject_id || '');

    const applyFilters = () => {
        router.get(route('teacher.study-plans.index'), { grade_id: filterGrade, subject_id: filterSubject }, { preserveState: true });
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
            text: 'هل أنت متأكد من حذف هذه الخطة؟ سيتم حذف المرفق نهائياً.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('teacher.study-plans.destroy', plan.id));
            }
        });
    };
    return (
        <AdminLayout activeMenu="الخطط الدراسية">
            <Head title="خططي الدراسية | النظام الأكاديمي" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {flash?.success && (
                    <div className="mb-6 flex items-center gap-3 bg-emerald-50 text-emerald-700 px-6 py-4 rounded-2xl text-sm font-bold shadow-sm">
                        <Check size={20} className="text-emerald-500" /> {flash.success}
                    </div>
                )}

                {/* Header */}
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
                                خططي الدراسية (توزيع المناهج)
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                قم برفع وتنظيم خططك الدراسية ومقرراتك هنا
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link href={route('teacher.study-plans.calendar')} className="bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20 px-4 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md">
                                <Calendar size={18} />
                                <span className="hidden sm:inline">التقويم الذكي</span>
                            </Link>
                            <Link href={route('teacher.study-plans.create')} className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 font-bold transition-all shadow-lg shadow-primary-500/20">
                                <Plus size={18} /> <span>رفع خطة جديدة</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filters */}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
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
                                <Filter size={16} /> تصفية
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
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">تاريخ الرفع</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">عنوان الخطة</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">الصف والشعبة والمادة</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">الحالة</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-800/50">
                                    {studyPlans.data.length > 0 ? studyPlans.data.map(plan => {
                                        let divIds = [];
                                        try {
                                            divIds = typeof plan.division_ids === 'string' ? JSON.parse(plan.division_ids) : plan.division_ids;
                                        } catch(e) {}
                                        
                                        return (
                                            <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                        <Calendar size={14} className="text-slate-400" />
                                                        {new Date(plan.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{plan.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        {plan.month && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 text-[10px] font-bold border border-teal-100 dark:border-teal-800/50">
                                                                <CalendarDays size={10} /> {plan.month}
                                                            </span>
                                                        )}
                                                        {plan.notes && (
                                                            <div className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">
                                                                ملاحظة: {plan.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-white font-bold mb-1.5 flex items-center gap-1.5"><Book size={14} className="text-primary-500"/>{plan.subject?.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-1.5"><Layers size={14} className="text-slate-400"/> {plan.grade?.name}</div>
                                                        {Array.isArray(divIds) && divIds.length > 0 && divisions?.length > 0 && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="w-3.5 h-3.5 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-sm">
                                                                    <Filter size={10} className="text-slate-400"/>
                                                                </span>
                                                                <span className="truncate max-w-[150px]" title={divIds.map(id => divisions.find(d => d.id == id)?.name).filter(Boolean).join('، ')}>
                                                                    {divIds.map(id => divisions.find(d => d.id == id)?.name).filter(Boolean).join('، ')}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {getStatusBadge(plan.status)}
                                                    {plan.admin_feedback && plan.status === 'rejected' && (
                                                        <div className="mt-2 text-[10px] text-rose-500 truncate max-w-[120px] mx-auto font-bold" title={plan.admin_feedback}>
                                                            سبب الرفض: {plan.admin_feedback}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {plan.attachment_path && (
                                                            <a 
                                                                href={route('teacher.study-plans.download', plan.id)}
                                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="تحميل الخطة المرفقة"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        {plan.status === 'approved' && plan.content && (
                                                            <button 
                                                                onClick={() => setPdfPlan(plan)}
                                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 transition-colors" title="تصدير كملف PDF معتمد"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {!['pending', 'approved'].includes(plan.status) && (
                                                            <>
                                                                <Link href={route('teacher.study-plans.edit', plan.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 transition-colors" title="تعديل">
                                                                    <Edit2 size={16} />
                                                                </Link>
                                                                <button onClick={() => deletePlan(plan)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-red-500 hover:bg-red-50 transition-colors" title="حذف">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
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
                                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                        <div className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold">
                                                            <Calendar size={12}/> 
                                                            <span>{new Date(plan.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                        </div>
                                                        {plan.month && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 text-[10px] font-bold border border-teal-100 dark:border-teal-800/50">
                                                                <CalendarDays size={10} /> {plan.month}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {getStatusBadge(plan.status)}
                                                {(!['pending', 'approved'].includes(plan.status)) && (
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                        <Link href={route('teacher.study-plans.edit', plan.id)} className="p-2 text-slate-400 hover:text-primary-600 bg-slate-50 dark:bg-slate-800 rounded-xl"><Edit2 size={16} /></Link>
                                                        <button onClick={() => deletePlan(plan)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-800 rounded-xl"><Trash2 size={16} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {plan.admin_feedback && plan.status === 'rejected' && (
                                            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold">
                                                <div className="flex items-center gap-1 mb-1"><AlertCircle size={14}/> سبب الرفض:</div>
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
                                            {plan.month && (
                                                <span className="text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                                    <Calendar size={14} /> {plan.month}
                                                </span>
                                            )}
                                        </div>

                                        {plan.notes && (
                                            <div className="mb-5 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                                                <div className="font-bold mb-1 text-slate-700 dark:text-slate-300">ملاحظات:</div>
                                                {plan.notes}
                                            </div>
                                        )}

                                        {plan.attachment_path && (
                                            <a 
                                                href={route('teacher.study-plans.download', plan.id)}
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
                                        {((Array.isArray(plan.content) && plan.content.length > 0) || (plan.content?.rows?.length > 0)) && (
                                            <Link 
                                                href={route('teacher.study-plans.edit', plan.id)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl font-bold text-sm transition mt-2"
                                            >
                                                <LayoutGrid size={16} /> عرض الجدول الإلكتروني
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>



            {/* Hidden container for PDF rendering */}
            {pdfPlan && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }}>
                    <StudyPlanPdfTemplate plan={pdfPlan} />
                </div>
            )}
        </AdminLayout>
    );
}
