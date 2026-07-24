import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit2, Trash2, Save, X, PlusCircle, GripVertical, FileSignature, AlertCircle, Sparkles, LayoutTemplate, CheckCircle2, XCircle, CalendarDays, Check, LayoutGrid, List } from 'lucide-react';
import Pagination from '@/Components/Pagination';

// Modern Modal Component
function Modal({ isOpen, onClose, title, children, icon: Icon }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl z-10 overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-indigo-500" />
                <div className="flex items-center justify-between p-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30 shrink-0">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        {Icon ? <div className="p-2 bg-primary-100 dark:bg-primary-500/20 text-primary-600 rounded-xl"><Icon size={20} /></div> : <Sparkles className="w-5 h-5 text-primary-500" />}
                        {title}
                    </h3>
                    <button type="button" onClick={onClose} className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">{children}</div>
            </div>
        </div>
    );
}

export default function StudyPlanTemplatesIndex({ auth, templates, academicYears }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewMode, setViewMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('study_plan_templates_view_mode') || 'table';
        }
        return 'table';
    });

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('study_plan_templates_view_mode', mode);
        }
    };

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        academic_year_id: '',
        semester_id: '',
        month: '',
        columns: [],
        weeks: [],
        is_active: true,
    });

    const openModal = (item = null) => {
        clearErrors();
        if (item) {
            setEditingItem(item);
            setData({
                name: item.name,
                academic_year_id: item.academic_year_id || (academicYears.length > 0 ? academicYears[0].id : ''),
                semester_id: item.semester_id || '',
                month: item.month || '',
                columns: item.columns || [],
                weeks: item.weeks || [],
                is_active: item.is_active,
            });
        } else {
            setEditingItem(null);
            setData({
                name: '',
                academic_year_id: academicYears.length > 0 ? academicYears[0].id : '',
                semester_id: '',
                month: '',
                columns: [
                    { id: 'month', label: 'الشهر', type: 'text' },
                    { id: 'week', label: 'الأسبوع', type: 'text' },
                    { id: 'date_period', label: 'الفترة الزمنية', type: 'text' },
                    { id: 'lesson', label: 'الدرس/الموضوع', type: 'text' },
                    { id: 'topics', label: 'المفردات الدراسية', type: 'textarea' },
                    { id: 'objectives', label: 'الأهداف', type: 'textarea' },
                    { id: 'strategies', label: 'استراتيجيات التدريس', type: 'textarea' },
                    { id: 'aids', label: 'الوسائل', type: 'text' },
                    { id: 'in_class_activities', label: 'الأنشطة الصفية', type: 'textarea' },
                    { id: 'out_class_activities', label: 'الأنشطة اللاصفية', type: 'textarea' },
                    { id: 'evaluation', label: 'أساليب القياس والتقويم', type: 'textarea' },
                ],
                weeks: [],
                is_active: true,
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('academic.study-plan-templates.update', editingItem.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('academic.study-plan-templates.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const deleteTemplate = (id) => {
        if (confirm('هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.')) {
            router.delete(route('academic.study-plan-templates.destroy', id));
        }
    };

    const addColumn = () => {
        setData('columns', [...data.columns, { id: `col_${Date.now()}`, label: '', type: 'text' }]);
    };

    const updateColumn = (index, field, value) => {
        const newCols = [...data.columns];
        newCols[index][field] = value;
        setData('columns', newCols);
    };

    const removeColumn = (index) => {
        setData('columns', data.columns.filter((_, i) => i !== index));
    };

    // Helper to get semesters for selected academic year
    const selectedYearObj = academicYears?.find(y => y.id.toString() === data.academic_year_id?.toString());
    const availableSemesters = selectedYearObj?.semesters || [];

    // Compute months for the selected semester(s)
    const getMonthsForSemesters = (semesters) => {
        const monthsSet = new Set();
        // Fallback array for Arabic months if Intl isn't perfectly supported
        const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        semesters.forEach(sem => {
            if (sem.start_date && sem.end_date) {
                let start = new Date(sem.start_date);
                let end = new Date(sem.end_date);
                // Iterate month by month
                while (start <= end || (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear())) {
                    monthsSet.add(arabicMonths[start.getMonth()]);
                    start.setMonth(start.getMonth() + 1);
                }
            }
        });
        return Array.from(monthsSet);
    };

    let displayedMonths = [];
    if (data.semester_id) {
        const sem = availableSemesters.find(s => s.id.toString() === data.semester_id.toString());
        if (sem) displayedMonths = getMonthsForSemesters([sem]);
    } else if (data.academic_year_id) {
        displayedMonths = getMonthsForSemesters(availableSemesters);
    }

    return (
        <AdminLayout activeMenu="قوالب الخطط الدراسية">
            <Head title="قوالب الخطط الدراسية" />

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
                            <div className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-100 dark:border-slate-700">
                                <FileSignature size={28} className="text-primary-600" />
                            </div>
                            إدارة قوالب الخطط الدراسية
                        </h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold max-w-xl leading-relaxed">
                            قم بتصميم قوالب إلكترونية مرنة واحترافية لتعبئة الخطط الدراسية من قبل المعلمين.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                            <button
                                onClick={() => handleViewModeChange('table')}
                                className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                                    viewMode === 'table' 
                                        ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm border border-slate-200/50 dark:border-slate-600' 
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                                title="عرض كجدول"
                            >
                                <List size={20} />
                            </button>
                            <button
                                onClick={() => handleViewModeChange('grid')}
                                className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                                    viewMode === 'grid' 
                                        ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm border border-slate-200/50 dark:border-slate-600' 
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                                title="عرض كبطاقات"
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                        <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-3.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] font-bold transition-all shadow-lg shadow-primary-500/20">
                            <Plus size={20} /> <span>إنشاء قالب جديد</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                {templates.data && templates.data.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.data.map((item) => (
                                <div key={item.id} className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
                                    {/* Decorative Gradient Top */}
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="flex justify-between items-start mb-6 pt-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                                                <LayoutTemplate size={26} strokeWidth={2} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 dark:text-white text-lg leading-tight mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">{item.name}</h4>
                                                <p className="text-xs text-slate-500 flex items-center gap-1.5 font-bold">
                                                    <CalendarDays size={12} className="text-slate-400" />
                                                    <span dir="ltr">{new Date(item.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                            <button 
                                                onClick={() => openModal(item)} 
                                                className="p-2 rounded-xl text-slate-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/20 dark:hover:text-primary-400 transition-colors"
                                                title="تعديل القالب"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => deleteTemplate(item.id)} 
                                                className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 transition-colors"
                                                title="حذف القالب"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 mb-6 flex-1">
                                        <div className="flex flex-wrap gap-2">
                                            {item.academic_year && (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-xs font-black border border-blue-100/50 dark:border-blue-800/50">
                                                    {item.academic_year.name}
                                                </span>
                                            )}
                                            {item.semester ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-purple-50/80 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 text-xs font-black border border-purple-100/50 dark:border-purple-800/50">
                                                    {item.semester.name}
                                                </span>
                                            ) : item.academic_year ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-xs font-black">
                                                    جميع الفصول
                                                </span>
                                            ) : null}
                                            {item.month && (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-teal-50/80 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 text-xs font-black border border-teal-100/50 dark:border-teal-800/50 shadow-sm">
                                                    {item.month}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center font-black text-lg text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-600">
                                                {item.columns?.length || 0}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">أعمدة (حقول)</span>
                                                <span className="text-xs text-slate-500 font-medium mt-0.5">في هيكل هذا القالب</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500">حالة القالب:</span>
                                            {item.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                                                    <span className="relative flex h-2 w-2">
                                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    نشط ومتاح
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black">
                                                    <XCircle size={12} /> متوقف
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
                                            <th className="px-6 py-5 text-sm font-black text-slate-700 dark:text-slate-300 w-1/3">اسم القالب</th>
                                            <th className="px-6 py-5 text-sm font-black text-slate-700 dark:text-slate-300">السنة / الفصل الدراسي</th>
                                            <th className="px-6 py-5 text-sm font-black text-slate-700 dark:text-slate-300">التفاصيل</th>
                                            <th className="px-6 py-5 text-sm font-black text-slate-700 dark:text-slate-300">الحالة</th>
                                            <th className="px-6 py-5 text-center text-sm font-black text-slate-700 dark:text-slate-300">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {templates.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-200 group border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                                                            <LayoutTemplate size={22} strokeWidth={2} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-800 dark:text-white text-base mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{item.name}</h4>
                                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                                تم الإنشاء: <span dir="ltr">{new Date(item.created_at).toLocaleDateString('en-GB')}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 align-middle">
                                                    <div className="flex flex-col gap-1.5">
                                                        {item.academic_year ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-xs font-bold w-fit">
                                                                {item.academic_year.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">-</span>
                                                        )}
                                                        {item.semester ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 text-xs font-bold w-fit">
                                                                {item.semester.name}
                                                            </span>
                                                        ) : item.academic_year ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-xs font-bold w-fit">
                                                                جميع فصول السنة
                                                            </span>
                                                        ) : null}
                                                        {item.month && (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 text-xs font-bold w-fit mt-1 border border-teal-100 dark:border-teal-800/50">
                                                                {item.month}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 align-middle">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold">
                                                        <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                                                            {item.columns?.length || 0}
                                                        </span>
                                                        حقول
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 align-middle">
                                                    {item.is_active ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-100 dark:border-emerald-500/20">
                                                            <CheckCircle2 size={16} /> فعال
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-bold border border-slate-200 dark:border-slate-700">
                                                            <XCircle size={16} /> غير فعال
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 align-middle">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => openModal(item)} 
                                                            className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-primary-500/20 dark:hover:text-primary-400 transition-colors tooltip"
                                                            title="تعديل القالب"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteTemplate(item.id)} 
                                                            className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 transition-colors tooltip"
                                                            title="حذف القالب"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-primary-500/20 dark:bg-primary-500/10 blur-xl rounded-full"></div>
                                <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center relative border-4 border-slate-50 dark:border-slate-900 shadow-xl">
                                    <LayoutTemplate size={52} strokeWidth={1.5} className="text-primary-500" />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3">لا توجد قوالب خطط حتى الآن</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 font-medium leading-relaxed">يمكنك إنشاء قالب إلكتروني لتحديد الأعمدة والبيانات التي سيعبئها المعلمون في خططهم الدراسية لبدء العمل.</p>
                            <button onClick={() => openModal()} className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] font-bold transition-all shadow-lg shadow-primary-500/20">
                                <Plus size={20} />
                                إضافة قالب جديد
                            </button>
                        </div>
                    </div>
                )}
                
                {templates.links && (
                    <div className="mt-8 flex justify-center">
                        <Pagination links={templates.links} />
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? 'تعديل القالب' : 'إنشاء قالب جديد'} icon={LayoutTemplate}>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">اسم القالب</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-normal"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="مثال: الخطة الفصلية للمرحلة الابتدائية..."
                                    required
                                />
                                {errors.name && <p className="mt-2 text-sm text-red-500 font-bold flex items-center gap-1"><AlertCircle size={14}/> {errors.name}</p>}
                            </div>

                            <div className="hidden">
                                <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">السنة الدراسية</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm font-bold text-slate-800 dark:text-white"
                                    value={data.academic_year_id}
                                    onChange={(e) => {
                                        setData('academic_year_id', e.target.value);
                                        // Reset semester when year changes
                                        setData('semester_id', '');
                                    }}
                                    required
                                >
                                    <option value="" disabled>اختر السنة الدراسية</option>
                                    {academicYears?.map(y => (
                                        <option key={y.id} value={y.id}>{y.name}</option>
                                    ))}
                                </select>
                                {errors.academic_year_id && <p className="mt-2 text-sm text-red-500 font-bold flex items-center gap-1"><AlertCircle size={14}/> {errors.academic_year_id}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-3">الفصل الدراسي</label>
                                
                                {data.academic_year_id ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setData('semester_id', '')}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                                                data.semester_id === '' || data.semester_id === null
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:border-primary-500 dark:text-primary-300 shadow-md shadow-primary-500/20'
                                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-300 hover:bg-primary-50/50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-primary-500/50'
                                            }`}
                                        >
                                            <span className="font-bold text-sm">جميع الفصول</span>
                                            <span className="text-xs opacity-70 mt-1">خطة سنوية كاملة</span>
                                        </button>
                                        
                                        {availableSemesters?.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setData('semester_id', s.id.toString())}
                                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                                                    data.semester_id?.toString() === s.id.toString()
                                                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:border-primary-500 dark:text-primary-300 shadow-md shadow-primary-500/20'
                                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-300 hover:bg-primary-50/50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-primary-500/50'
                                                }`}
                                            >
                                                <span className="font-bold text-sm">{s.name}</span>
                                                <span className="text-xs opacity-70 mt-1">خطة فصلية</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">الرجاء اختيار السنة الدراسية أولاً</p>
                                    </div>
                                )}
                                
                                {errors.semester_id && <p className="mt-2 text-sm text-red-500 font-bold flex items-center gap-1"><AlertCircle size={14}/> {errors.semester_id}</p>}
                                
                                <div className="col-span-2 sm:col-span-4 mt-2 p-5 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800/50 rounded-3xl border border-primary-100 dark:border-primary-800/50 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                    <label className="flex items-center gap-2 text-sm font-black text-primary-800 dark:text-primary-300 mb-4 relative z-10">
                                        <CalendarDays size={18} className="text-primary-500" />
                                        الشهر المخصص لهذا القالب <span className="text-rose-500">*</span>
                                    </label>
                                    
                                    <div className="relative z-10 mb-4">
                                        <input
                                            type="text"
                                            value={data.month}
                                            onChange={(e) => setData('month', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-normal"
                                            placeholder="أدخل اسم الشهر (مثال: محرم 1446 أو يناير)"
                                            required
                                        />
                                    </div>
                                    
                                    {displayedMonths.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 relative z-10">أو اختر من الأشهر الميلادية المقترحة للفصل:</p>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 relative z-10">
                                                {displayedMonths.map((m, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            if (!data.month) setData('month', m);
                                                            else if (!data.month.includes(m)) setData('month', `${data.month} - ${m}`);
                                                        }}
                                                        className={`py-2 px-2 rounded-xl text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1.5 border ${
                                                            data.month.includes(m)
                                                            ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20 transform scale-[1.02]' 
                                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                                                        }`}
                                                    >
                                                        {data.month.includes(m) && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full animate-pulse" />}
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {errors.month && <p className="mt-3 text-sm text-red-500 font-bold flex items-center gap-1"><AlertCircle size={14}/> {errors.month}</p>}
                                </div>
                            </div>
                        </div>

                        <label className={`flex items-center gap-3 p-5 border-2 rounded-2xl cursor-pointer transition-all ${data.is_active ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-primary-300'}`}>
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
                            />
                            <div>
                                <div className={`font-black text-sm ${data.is_active ? 'text-primary-700 dark:text-primary-300' : 'text-slate-800 dark:text-white'}`}>تفعيل القالب</div>
                                <div className="text-xs text-slate-500 mt-0.5">سيكون هذا القالب متاحاً للمعلمين لاستخدامه فور تفعيله.</div>
                            </div>
                        </label>
                    </div>

                    {/* Columns Builder */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 relative">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h4 className="text-base font-black text-slate-800 dark:text-white mb-1">تصميم جدول الخطة</h4>
                                <p className="text-xs text-slate-500 font-medium">قم بإضافة وتعديل الأعمدة التي سيتكون منها الجدول الإلكتروني الخاص بالخطة.</p>
                            </div>
                            <button type="button" onClick={addColumn} className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-primary-600 dark:text-primary-400 font-bold text-sm hover:border-primary-300 hover:shadow-sm transition-all">
                                <PlusCircle size={18} /> إضافة حقل جديد
                            </button>
                        </div>

                        <div className="space-y-3">
                            {data.columns.map((col, index) => (
                                <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm group hover:border-primary-300 hover:shadow-md transition-all">
                                    <div className="flex w-full sm:w-auto items-center gap-3">
                                        <div className="cursor-grab active:cursor-grabbing p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                            <GripVertical size={20} />
                                        </div>
                                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                                            {index + 1}
                                        </span>
                                    </div>

                                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={col.label}
                                                onChange={(e) => updateColumn(index, 'label', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:font-normal"
                                                placeholder="عنوان العمود (مثال: المفردات)"
                                                required
                                            />
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={col.type || 'text'}
                                                onChange={(e) => updateColumn(index, 'type', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all cursor-pointer"
                                            >
                                                <option value="text">نص قصير (سطر واحد)</option>
                                                <option value="textarea">نص طويل (فقرات متعددة)</option>
                                                <option value="date">تاريخ (Date)</option>
                                                <option value="number">رقم (Number)</option>
                                                <option value="checkbox">مربع اختيار (نعم/لا)</option>
                                                <option value="select">قائمة منسدلة (خيارات متعددة)</option>
                                            </select>
                                        </div>
                                        {col.type === 'select' && (
                                            <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
                                                <input
                                                    type="text"
                                                    value={col.options || ''}
                                                    onChange={(e) => updateColumn(index, 'options', e.target.value)}
                                                    className="w-full bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/50 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:font-normal"
                                                    placeholder="أدخل الخيارات مفصولة بفاصلة (,)"
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="w-full sm:w-auto flex justify-end">
                                        <button 
                                            type="button" 
                                            onClick={() => removeColumn(index)} 
                                            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
                                            title="حذف العمود"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {data.columns.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-slate-800/50">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <LayoutTemplate className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-bold mb-2">القالب فارغ حالياً</p>
                                    <p className="text-sm text-slate-400">انقر على الزر أعلاه لإضافة أول حقل في الخطة</p>
                                </div>
                            )}
                            {errors.columns && <p className="mt-2 text-sm text-red-500 font-bold flex items-center gap-1"><AlertCircle size={14}/> {errors.columns}</p>}
                        </div>
                    </div>

                    {/* Weeks Builder */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 relative mt-6 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h4 className="text-base font-black text-slate-800 dark:text-white mb-1">إعداد أسابيع الخطة (الفترة الزمنية)</h4>
                                <p className="text-xs text-slate-500 font-medium">قم بتحديد الأسابيع وتواريخ بدايتها ونهايتها لتظهر تلقائياً للمعلم.</p>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => {
                                    let year = new Date().getFullYear();
                                    let monthIndex = new Date().getMonth();
                                    const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    
                                    if (data.month) {
                                        for (let i = 0; i < arMonths.length; i++) {
                                            if (data.month.includes(arMonths[i])) {
                                                monthIndex = i;
                                                break;
                                            }
                                        }
                                    }
                                    
                                    let d = new Date(year, monthIndex, 1);
                                    while (d.getDay() !== 0) { // Find first Sunday
                                        d.setDate(d.getDate() + 1);
                                    }
                                    
                                    const getHijriString = (dateObj) => {
                                        try {
                                            const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
                                                day: '2-digit', month: '2-digit', year: 'numeric'
                                            });
                                            const parts = formatter.formatToParts(dateObj);
                                            
                                            const toEnglishNumbers = (str) => {
                                                const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
                                                return str.replace(/[٠-٩]/g, w => arabicNumbers.indexOf(w));
                                            };
                                            
                                            let y = '', m = '', day = '';
                                            for (const p of parts) {
                                                if (p.type === 'year') y = toEnglishNumbers(p.value).replace(/\D/g, '');
                                                if (p.type === 'month') m = toEnglishNumbers(p.value).replace(/\D/g, '');
                                                if (p.type === 'day') day = toEnglishNumbers(p.value).replace(/\D/g, '');
                                            }
                                            return `${y}/${m.padStart(2, '0')}/${day.padStart(2, '0')}`;
                                        } catch (e) {
                                            return '';
                                        }
                                    };
                                    
                                    const getGregorianString = (dateObj) => {
                                        const yyyy = dateObj.getFullYear();
                                        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                                        const dd = String(dateObj.getDate()).padStart(2, '0');
                                        return `${yyyy}-${mm}-${dd}`;
                                    };
                                    
                                    const newWeeks = [];
                                    const weekNames = ['الأسبوع الأول', 'الأسبوع الثاني', 'الأسبوع الثالث', 'الأسبوع الرابع'];
                                    
                                    for (let i = 0; i < 4; i++) {
                                        const startG = getGregorianString(d);
                                        const startH = getHijriString(d);
                                        
                                        d.setDate(d.getDate() + 4); // Thursday
                                        const endG = getGregorianString(d);
                                        const endH = getHijriString(d);
                                        
                                        newWeeks.push({
                                            name: weekNames[i],
                                            start_date_gregorian: startG,
                                            end_date_gregorian: endG,
                                            start_date_hijri: startH,
                                            end_date_hijri: endH
                                        });
                                        
                                        d.setDate(d.getDate() + 3); // Next Sunday
                                    }
                                    
                                    setData('weeks', newWeeks);
                                }} className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-teal-600 dark:text-teal-400 font-bold text-sm hover:border-teal-300 hover:shadow-sm transition-all">
                                    <Sparkles size={18} /> توليد 4 أسابيع بذكاء
                                </button>
                                <button type="button" onClick={() => setData('weeks', [...data.weeks, { name: `الأسبوع ${data.weeks.length + 1}`, start_date_gregorian: '', end_date_gregorian: '', start_date_hijri: '', end_date_hijri: '' }])} className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-primary-600 dark:text-primary-400 font-bold text-sm hover:border-primary-300 hover:shadow-sm transition-all">
                                    <PlusCircle size={18} /> إضافة أسبوع جديد
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {data.weeks.map((week, index) => (
                                <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm group hover:border-primary-300 hover:shadow-md transition-all">
                                    <div className="flex w-full sm:w-auto items-center gap-3">
                                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                                            {index + 1}
                                        </span>
                                    </div>

                                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                        <div className="relative lg:col-span-1">
                                            <label className="text-xs text-slate-500 absolute -top-2 right-3 bg-white dark:bg-slate-800 px-1">اسم الأسبوع</label>
                                            <input
                                                type="text"
                                                value={week.name}
                                                onChange={(e) => {
                                                    const newWeeks = [...data.weeks];
                                                    newWeeks[index].name = e.target.value;
                                                    setData('weeks', newWeeks);
                                                }}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:font-normal"
                                                placeholder="الأسبوع الأول"
                                                required
                                            />
                                        </div>
                                        <div className="relative lg:col-span-1">
                                            <label className="text-xs text-slate-500 absolute -top-2 right-3 bg-white dark:bg-slate-800 px-1">من (ميلادي)</label>
                                            <input
                                                type="date"
                                                value={week.start_date_gregorian || ''}
                                                onChange={(e) => {
                                                    const newWeeks = [...data.weeks];
                                                    newWeeks[index].start_date_gregorian = e.target.value;
                                                    setData('weeks', newWeeks);
                                                }}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                            />
                                        </div>
                                        <div className="relative lg:col-span-1">
                                            <label className="text-xs text-slate-500 absolute -top-2 right-3 bg-white dark:bg-slate-800 px-1">إلى (ميلادي)</label>
                                            <input
                                                type="date"
                                                value={week.end_date_gregorian || ''}
                                                onChange={(e) => {
                                                    const newWeeks = [...data.weeks];
                                                    newWeeks[index].end_date_gregorian = e.target.value;
                                                    setData('weeks', newWeeks);
                                                }}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                            />
                                        </div>
                                        <div className="relative lg:col-span-1">
                                            <label className="text-xs text-slate-500 absolute -top-2 right-3 bg-white dark:bg-slate-800 px-1">من (هجري)</label>
                                            <input
                                                type="text"
                                                value={week.start_date_hijri || ''}
                                                onChange={(e) => {
                                                    const newWeeks = [...data.weeks];
                                                    newWeeks[index].start_date_hijri = e.target.value;
                                                    setData('weeks', newWeeks);
                                                }}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:font-normal"
                                                placeholder="مثال: 1446/01/01"
                                            />
                                        </div>
                                        <div className="relative lg:col-span-1">
                                            <label className="text-xs text-slate-500 absolute -top-2 right-3 bg-white dark:bg-slate-800 px-1">إلى (هجري)</label>
                                            <input
                                                type="text"
                                                value={week.end_date_hijri || ''}
                                                onChange={(e) => {
                                                    const newWeeks = [...data.weeks];
                                                    newWeeks[index].end_date_hijri = e.target.value;
                                                    setData('weeks', newWeeks);
                                                }}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:font-normal"
                                                placeholder="مثال: 1446/01/05"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="w-full sm:w-auto flex justify-end">
                                        <button 
                                            type="button" 
                                            onClick={() => setData('weeks', data.weeks.filter((_, i) => i !== index))} 
                                            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
                                            title="حذف الأسبوع"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {data.weeks.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-slate-800/50">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CalendarDays className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-bold mb-2">لم يتم تحديد أسابيع</p>
                                    <p className="text-sm text-slate-400">إذا تركت هذا فارغاً، سيظهر للمعلم عمود أسابيع عادي. إذا أضفت أسابيع، ستُعبأ تلقائياً عند المعلم مع التاريخ.</p>
                                </div>
                            )}
                            {errors.weeks && <p className="mt-2 text-sm text-red-500 font-bold flex items-center gap-1"><AlertCircle size={14}/> {errors.weeks}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={closeModal} className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                            إلغاء
                        </button>
                        <button type="submit" disabled={processing} className="erp-btn-primary px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-500/20">
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            <span>{editingItem ? 'حفظ التعديلات' : 'اعتماد وإنشاء'}</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
