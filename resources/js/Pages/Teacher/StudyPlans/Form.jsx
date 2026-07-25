import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import { 
    Book, Plus, Edit2, Trash2, Search, X, Layers, FileText, Download,
    BookOpen, Sparkles, AlertCircle, Check, FileDown, Clock, Filter, Calendar, MessageSquare, Send, User, CalendarDays, ArrowRight
} from 'lucide-react';
import axios from 'axios';

const weekNames = ['الأسبوع الأول', 'الأسبوع الثاني', 'الأسبوع الثالث', 'الأسبوع الرابع', 'الأسبوع الخامس', 'الأسبوع السادس', 'الأسبوع السابع', 'الأسبوع الثامن', 'الأسبوع التاسع', 'الأسبوع العاشر', 'الأسبوع الحادي عشر', 'الأسبوع الثاني عشر', 'الأسبوع الثالث عشر', 'الأسبوع الرابع عشر', 'الأسبوع الخامس عشر', 'الأسبوع السادس عشر', 'الأسبوع السابع عشر', 'الأسبوع الثامن عشر'];
const getWeekName = (index, template = null) => {
    if (template && template.weeks && template.weeks[index]) {
        return template.weeks[index].name;
    }
    return weekNames[index] || `الأسبوع ${index + 1}`;
};

const toArabicNumerals = (str) => {
    if (!str) return '';
    return str.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
};

const formatGregorian = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return toArabicNumerals(dateStr);
        return d.toLocaleDateString('ar-EG', { calendar: 'gregory', day: 'numeric', month: 'short' });
    } catch {
        return toArabicNumerals(dateStr);
    }
};

const formatHijri = (dateStr) => {
    if (!dateStr) return '';
    // Split by dash, slash, or any non-digit
    const parts = dateStr.split(/[-/.]/);
    if (parts.length >= 3) {
        // usually format is YYYY-MM-DD or YYYY/MM/DD
        // parts[0] is year (length 4)
        if (parts[0].length === 4) {
            return toArabicNumerals(`${parts[2]}-${parts[1]}`);
        }
        // if format is DD-MM-YYYY
        if (parts[2].length === 4) {
            return toArabicNumerals(`${parts[0]}-${parts[1]}`);
        }
    }
    return toArabicNumerals(dateStr);
};

const getWeekDate = (index, template = null) => {
    if (template && template.weeks && template.weeks[index]) {
        const w = template.weeks[index];
        let parts = [];
        
        if (w.start_date_gregorian || w.end_date_gregorian) {
            parts.push(`${formatGregorian(w.start_date_gregorian)} إلى ${formatGregorian(w.end_date_gregorian)} (م)`);
        }
        
        if (w.start_date_hijri || w.end_date_hijri) {
            parts.push(`${formatHijri(w.start_date_hijri)} إلى ${formatHijri(w.end_date_hijri)} (هـ)`);
        }
        
        return parts.join(' | ');
    }
    return '';
};

function MultiSelectDivisions({ options, selected, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggle = (id) => {
        if (selected.includes(id)) {
            onChange(selected.filter(x => x !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 flex items-center justify-between cursor-pointer focus:border-primary-500 transition-all"
            >
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate pl-4">
                    {selected.length === 0 ? 'جميع الشعب' : options.filter(opt => selected.includes(opt.id)).map(opt => opt.name).join('، ')}
                </span>
                <span className={`text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-hidden">
                    {options.map(opt => (
                        <label key={opt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                            <input 
                                type="checkbox" 
                                checked={selected.includes(opt.id)} 
                                onChange={() => toggle(opt.id)}
                                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                            />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{opt.name}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function TeacherStudyPlanForm({ studyPlan, grades, subjects, divisions, templates = [] }) {
    const { errors } = usePage().props;
    const isEdit = !!studyPlan;

    const [form, setForm] = useState({ 
        title: studyPlan?.title || '', 
        subject_id: studyPlan?.subject_id || '', 
        grade_id: studyPlan?.grade_id || '', 
        division_ids: studyPlan?.division_ids ? (typeof studyPlan.division_ids === 'string' ? JSON.parse(studyPlan.division_ids) : studyPlan.division_ids) : [], 
        notes: studyPlan?.notes || '', 
        template_id: studyPlan?.template_id || '', 
        content: studyPlan?.rows ? studyPlan.rows.map(r => r.data) : ((studyPlan?.content && typeof studyPlan.content === 'object' && !Array.isArray(studyPlan.content) && studyPlan.content.rows) ? studyPlan.content.rows : (Array.isArray(studyPlan?.content) ? studyPlan.content : [])), 
        attachment: null 
    });
    
    const [processing, setProcessing] = useState(false);

    // Comments State
    const [comments, setComments] = useState([]);
    const [activeCellKey, setActiveCellKey] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    useEffect(() => {
        if (isEdit) {
            fetchComments(studyPlan.id);
        }
    }, [isEdit]);

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

    const addComment = async () => {
        if (!newComment.trim() || !activeCellKey || !isEdit) return;
        try {
            const res = await axios.post(route('study-plan-comments.store', studyPlan.id), {
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

    const submitForm = (e, action = 'draft') => {
        if(e) e.preventDefault();
        setProcessing(true);

        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('subject_id', form.subject_id);
        formData.append('grade_id', form.grade_id);
        if (form.division_ids && form.division_ids.length > 0) {
            form.division_ids.forEach((id, index) => {
                formData.append(`division_ids[${index}]`, id);
            });
        }
        if (form.notes) formData.append('notes', form.notes);
        if (form.template_id) formData.append('template_id', form.template_id);
        
        if (form.content && form.content.length > 0) {
            const template = templates.find(t => t.id == form.template_id);
            form.content.forEach((row, rowIndex) => {
                let finalRow = { ...row };
                if (template) {
                    template.columns.forEach(col => {
                        const isWeek = col.label.includes('أسبوع') || col.label.includes('الاسبوع') || col.label.toLowerCase().includes('week');
                        const isDate = col.label.includes('تاريخ') || col.label.includes('فترة') || col.label.includes('زمني');
                        if (isWeek) {
                            finalRow[col.id] = getWeekName(rowIndex, template);
                        } else if (isDate && getWeekDate(rowIndex, template)) {
                            finalRow[col.id] = getWeekDate(rowIndex, template);
                        }
                    });
                }
                Object.keys(finalRow).forEach(colKey => {
                    formData.append(`content[${rowIndex}][${colKey}]`, finalRow[colKey] || '');
                });
            });
        }
        
        formData.append('action', action);
        if (form.attachment) formData.append('attachment', form.attachment);

        if (isEdit) {
            formData.append('_method', 'put');
            router.post(route('teacher.study-plans.update', studyPlan.id), formData, {
                onFinish: () => setProcessing(false)
            });
        } else {
            router.post(route('teacher.study-plans.store'), formData, {
                onFinish: () => setProcessing(false)
            });
        }
    };

    return (
        <AdminLayout activeMenu="الخطط الدراسية">
            <Head title={isEdit ? 'تعديل الخطة الدراسية | النظام الأكاديمي' : 'رفع خطة جديدة | النظام الأكاديمي'} />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <Link href={route('teacher.study-plans.index')} className="text-primary-600 dark:text-primary-400 font-bold flex items-center gap-2 mb-4 hover:underline w-fit">
                                <ArrowRight size={16} /> العودة إلى قائمة الخطط
                            </Link>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                {isEdit ? <Edit2 size={28} className="text-primary-600" /> : <Sparkles size={28} className="text-primary-600" />}
                                {isEdit ? 'تعديل الخطة الدراسية' : 'رفع خطة دراسية جديدة'}
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                {isEdit ? 'قم بتعديل تفاصيل الخطة والمحتوى هنا' : 'قم بإنشاء خطتك الدراسية سواء برفع ملف جاهز أو باستخدام القوالب الإلكترونية'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#121820]/60 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative">
                    <form onSubmit={submitForm} className="space-y-6">
                        <div>
                            <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">عنوان الخطة <span className="text-rose-500">*</span></label>
                            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="مثال: توزيع منهج الرياضيات الفصل الأول" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:border-primary-500 text-sm font-bold" required />
                            {errors.title && <p className="text-rose-500 text-xs font-bold mt-1">{errors.title}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="col-span-3 md:col-span-1">
                                <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">الصف <span className="text-rose-500">*</span></label>
                                <SelectInput value={form.grade_id} onChange={val => setForm({...form, grade_id: val, division_ids: []})} options={[{ value: '', label: 'اختر الصف...' }, ...grades.map(g => ({ value: g.id, label: g.name }))]} required />
                                {errors.grade_id && <p className="text-rose-500 text-xs font-bold mt-1">{errors.grade_id}</p>}
                            </div>
                            <div className="col-span-3 md:col-span-1">
                                <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">الشعبة (اختياري)</label>
                                <MultiSelectDivisions 
                                    options={form.grade_id ? divisions.filter(d => d.grade_id == form.grade_id) : divisions} 
                                    selected={form.division_ids} 
                                    onChange={val => setForm({...form, division_ids: val})} 
                                />
                                {errors.division_ids && <p className="text-rose-500 text-xs font-bold mt-1">{errors.division_ids}</p>}
                            </div>
                            <div className="col-span-3 md:col-span-1">
                                <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">المادة <span className="text-rose-500">*</span></label>
                                <SelectInput value={form.subject_id} onChange={val => setForm({...form, subject_id: val})} options={[{ value: '', label: 'اختر المادة...' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]} required />
                                {errors.subject_id && <p className="text-rose-500 text-xs font-bold mt-1">{errors.subject_id}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">الملاحظات (اختياري)</label>
                            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="اكتب ملاحظات إضافية حول الخطة هنا..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:border-primary-500 text-sm font-bold min-h-[80px]" />
                            {errors.notes && <p className="text-rose-500 text-xs font-bold mt-1">{errors.notes}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">طريقة الإدخال <span className="text-rose-500">*</span></label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`border rounded-2xl p-4 cursor-pointer transition ${!form.template_id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'}`} onClick={() => setForm({...form, template_id: '', content: []})}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${!form.template_id ? 'border-primary-500' : 'border-slate-300'}`}>
                                            {!form.template_id && <div className="w-3 h-3 bg-primary-500 rounded-full" />}
                                        </div>
                                        <span className="font-bold text-slate-800 dark:text-white">رفع ملف جاهز</span>
                                    </div>
                                </div>
                                <div className={`border rounded-2xl p-4 cursor-pointer transition ${form.template_id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'}`} onClick={() => {
                                    if(templates.length > 0) {
                                        const template = templates[0];
                                        const initialContent = template.weeks?.length > 0 
                                            ? Array.from({ length: template.weeks.length }, () => ({}))
                                            : [{}];
                                        setForm({...form, template_id: template.id, content: initialContent});
                                    }
                                }}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${form.template_id ? 'border-primary-500' : 'border-slate-300'}`}>
                                            {form.template_id && <div className="w-3 h-3 bg-primary-500 rounded-full" />}
                                        </div>
                                        <span className="font-bold text-slate-800 dark:text-white">استخدام القالب الإلكتروني (جدول)</span>
                                    </div>
                                    {templates.length === 0 && <span className="text-xs text-rose-500 block mt-2">لا توجد قوالب متاحة. يرجى التواصل مع الإدارة.</span>}
                                </div>
                            </div>
                        </div>

                        {form.template_id && templates.find(t => t.id == form.template_id) && (
                            <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/30">
                                <div>
                                    <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">اختر القالب</label>
                                    <SelectInput 
                                        value={form.template_id} 
                                        onChange={val => {
                                            const template = templates.find(t => t.id == val);
                                            const initialContent = template?.weeks?.length > 0 
                                                ? Array.from({ length: template.weeks.length }, () => ({}))
                                                : [{}];
                                            setForm({...form, template_id: val, content: initialContent});
                                        }} 
                                        options={templates.map(t => ({ value: t.id, label: t.name }))} 
                                    />
                                </div>
                                
                                {templates.find(t => t.id == form.template_id)?.month && (
                                    <div className="flex items-center gap-2 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/50 rounded-xl">
                                        <div className="p-1.5 bg-teal-100 dark:bg-teal-800/50 rounded-lg text-teal-600 dark:text-teal-400">
                                            <CalendarDays size={16} />
                                        </div>
                                        <div className="text-sm font-bold text-teal-800 dark:text-teal-300">
                                            الشهر المخصص لهذه الخطة: {templates.find(t => t.id == form.template_id).month}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mt-4 space-y-6">
                                    <div className="w-full overflow-hidden border border-slate-200/80 dark:border-slate-700/80 rounded-[28px] shadow-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl relative">
                                        <div className="overflow-x-auto custom-scrollbar">
                                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60">
                                                <thead className="bg-slate-50/80 dark:bg-slate-800/40 backdrop-blur-md">
                                                    <tr>
                                                        {templates.find(t => t.id == form.template_id).columns.map((col, idx) => {
                                                            const isDateCol = col.label.includes('شهر') || col.label.includes('أسبوع') || col.label.includes('الاسبوع') || col.label.includes('تاريخ') || col.label.includes('فترة') || col.label.includes('زمني');
                                                            const isNumberCol = col.label.includes('أيام') || col.label.includes('ايام') || col.label.includes('حصص') || col.label.includes('يوم');
                                                            const widthClass = isDateCol ? 'w-16 min-w-[64px]' : isNumberCol ? 'w-16 min-w-[64px]' : 'min-w-[200px]';
                                                            return (
                                                                <th key={idx} className={`px-2 py-4 text-center text-[10px] md:text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-l border-slate-100 dark:border-slate-800/60 last:border-0 ${widthClass} ${isNumberCol ? 'whitespace-normal leading-tight' : 'whitespace-nowrap'}`}>
                                                                    {col.label}
                                                                </th>
                                                            );
                                                        })}
                                                        {!(templates.find(t => t.id == form.template_id)?.weeks?.length > 0) && (
                                                            <th className="px-4 py-4 w-12 border-l border-slate-100 dark:border-slate-800/60 last:border-0"></th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                    {form.content.map((row, rowIdx) => (
                                                        <tr key={rowIdx} className="group/row hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200">
                                                            {templates.find(t => t.id == form.template_id).columns.map((col, colIdx) => {
                                                                const cellKey = `row_${rowIdx}_col_${col.id}`;
                                                                const cellComments = comments.filter(c => c.cell_key === cellKey);
                                                                const hasOpenComments = cellComments.some(c => !c.is_resolved);
                                                                const isSelected = activeCellKey === cellKey;
                                                                
                                                                const isDateCol = col.label.includes('شهر') || col.label.includes('أسبوع') || col.label.includes('الاسبوع') || col.label.includes('تاريخ') || col.label.includes('فترة') || col.label.includes('زمني');
                                                                const isNumberCol = col.label.includes('أيام') || col.label.includes('ايام') || col.label.includes('حصص') || col.label.includes('يوم');
                                                                const widthClass = isDateCol ? 'w-16 min-w-[64px]' : isNumberCol ? 'w-16 min-w-[64px]' : 'min-w-[200px]';
                                                                
                                                                return (
                                                                    <td 
                                                                        key={colIdx} 
                                                                        onClick={() => setActiveCellKey(cellKey)}
                                                                        className={`p-0 border-l border-slate-100 dark:border-slate-800/60 last:border-0 align-top relative transition-all duration-300 ${widthClass} ${isSelected ? 'bg-primary-50/80 dark:bg-primary-900/20 ring-2 ring-inset ring-primary-500/50 shadow-inner' : ''}`}
                                                                    >
                                                                        {hasOpenComments && (
                                                                            <div className="absolute top-2 right-2 flex items-center justify-center z-20 pointer-events-none">
                                                                                <span className="flex h-3 w-3 relative">
                                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-sm border border-white dark:border-slate-800"></span>
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {(() => {
                                                                            const template = templates.find(t => t.id == form.template_id);
                                                                            const isMonth = col.label.includes('شهر') || col.label.toLowerCase().includes('month');
                                                                            const isWeek = col.label.includes('أسبوع') || col.label.includes('الاسبوع') || col.label.toLowerCase().includes('week');
                                                                            const isDate = col.label.includes('تاريخ') || col.label.includes('فترة') || col.label.includes('زمني');
                                                                            
                                                                            let displayValue = row[col.id] || '';
                                                                            let isReadOnlyCell = false;

                                                                            if (isMonth && template?.month) {
                                                                                displayValue = template.month;
                                                                                isReadOnlyCell = true;
                                                                            } else if (isWeek) {
                                                                                displayValue = getWeekName(rowIdx, template);
                                                                                isReadOnlyCell = true;
                                                                            } else if (isDate && getWeekDate(rowIdx, template)) {
                                                                                displayValue = getWeekDate(rowIdx, template);
                                                                                isReadOnlyCell = true;
                                                                            }
                                                                            
                                                                            if (isReadOnlyCell) {
                                                                                const lines = typeof displayValue === 'string' ? displayValue.split(' | ') : [displayValue];
                                                                                return (
                                                                                    <div className="w-full h-full min-h-[140px] flex items-center justify-center gap-3 py-4 bg-slate-50/80 dark:bg-slate-800/50 select-none">
                                                                                        {lines.map((line, i) => (
                                                                                            <span 
                                                                                                key={i}
                                                                                                className="text-slate-500 dark:text-slate-400 font-black text-xs md:text-sm tracking-widest whitespace-nowrap"
                                                                                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                                                                            >
                                                                                                {line}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            
                                                                            const isNumberInput = col.type === 'number';
                                                                            const baseInputStyles = `w-full h-full min-h-[60px] text-sm ${isNumberInput ? 'px-1 text-center' : 'px-4'} py-3 border-0 bg-transparent focus:ring-0 resize-none transition-colors duration-200 outline-none ${isSelected ? 'text-primary-900 dark:text-primary-100 font-semibold' : 'text-slate-700 dark:text-slate-300 font-medium'} hover:bg-slate-50/50 dark:hover:bg-slate-800/30`;
                                                                            if (col.type === 'textarea') {
                                                                                return (
                                                                                    <textarea 
                                                                                        className={`${baseInputStyles} custom-scrollbar`}
                                                                                        value={displayValue} 
                                                                                        readOnly={isReadOnlyCell}
                                                                                        placeholder={isReadOnlyCell ? '' : 'اكتب هنا...'}
                                                                                        onChange={e => {
                                                                                            if (isReadOnlyCell) return;
                                                                                            const newContent = [...form.content];
                                                                                            if(!newContent[rowIdx]) newContent[rowIdx] = {};
                                                                                            newContent[rowIdx][col.id] = e.target.value;
                                                                                            setForm({...form, content: newContent});
                                                                                        }}
                                                                                    />
                                                                                );
                                                                            } else if (col.type === 'select') {
                                                                                return (
                                                                                    <select 
                                                                                        className={`${baseInputStyles} cursor-pointer appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1.2em_1.2em]`}
                                                                                        style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")` }}
                                                                                        value={row[col.id] || ''} 
                                                                                        onChange={e => {
                                                                                            const newContent = [...form.content];
                                                                                            if(!newContent[rowIdx]) newContent[rowIdx] = {};
                                                                                            newContent[rowIdx][col.id] = e.target.value;
                                                                                            setForm({...form, content: newContent});
                                                                                        }}
                                                                                    >
                                                                                        <option value="">اختر...</option>
                                                                                        {col.options?.split(',').map(o => o.trim()).filter(Boolean).map(opt => (
                                                                                            <option key={opt} value={opt}>{opt}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                );
                                                                            } else if (col.type === 'checkbox') {
                                                                                return (
                                                                                    <div className={`w-full h-full min-h-[60px] flex items-center justify-center p-3 ${isReadOnlyCell ? 'bg-slate-50/80 dark:bg-slate-800/50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'} transition-colors`}>
                                                                                        <label className="relative flex items-center justify-center cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                                                                            <input 
                                                                                                type="checkbox" 
                                                                                                className="peer sr-only"
                                                                                                checked={row[col.id] === 'true' || row[col.id] === true} 
                                                                                                onChange={e => {
                                                                                                    if (isReadOnlyCell) return;
                                                                                                    const newContent = [...form.content];
                                                                                                    if(!newContent[rowIdx]) newContent[rowIdx] = {};
                                                                                                    newContent[rowIdx][col.id] = e.target.checked ? 'true' : 'false';
                                                                                                    setForm({...form, content: newContent});
                                                                                                }}
                                                                                            />
                                                                                            <div className="w-6 h-6 rounded-md border-2 border-slate-300 dark:border-slate-600 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all flex items-center justify-center">
                                                                                                <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                                </svg>
                                                                                            </div>
                                                                                        </label>
                                                                                    </div>
                                                                                );
                                                                            } else {
                                                                                return (
                                                                                    <input 
                                                                                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'} 
                                                                                        className={`${baseInputStyles}`}
                                                                                        value={displayValue} 
                                                                                        readOnly={isReadOnlyCell}
                                                                                        placeholder={isReadOnlyCell ? '' : 'اكتب هنا...'}
                                                                                        onChange={e => {
                                                                                            if (isReadOnlyCell) return;
                                                                                            const newContent = [...form.content];
                                                                                            if(!newContent[rowIdx]) newContent[rowIdx] = {};
                                                                                            newContent[rowIdx][col.id] = e.target.value;
                                                                                            setForm({...form, content: newContent});
                                                                                        }}
                                                                                    />
                                                                                );
                                                                            }
                                                                        })()}
                                                                    </td>
                                                                );
                                                            })}
                                                            {!(templates.find(t => t.id == form.template_id)?.weeks?.length > 0) && (
                                                                <td className="p-2 border-l border-slate-100 dark:border-slate-800/60 text-center align-middle">
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => setForm({...form, content: form.content.filter((_, i) => i !== rowIdx)})} 
                                                                        className="w-8 h-8 mx-auto flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover/row:opacity-100"
                                                                        title="حذف الصف"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    {isEdit && (
                                        <div className="w-full border border-slate-200/80 dark:border-slate-700/80 rounded-[28px] shadow-sm hover:shadow-md transition-shadow bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl flex flex-col h-[400px] relative overflow-hidden">
                                            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                                                <div className="flex items-center gap-2 font-black text-slate-800 dark:text-white">
                                                    <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                                                        <MessageSquare size={18} />
                                                    </div>
                                                    التعليقات الحية
                                                </div>
                                                {activeCellKey && (
                                                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full">خلية محددة</span>
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30">
                                                {!activeCellKey ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 space-y-4 opacity-70 p-4">
                                                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                            <MessageSquare size={28} className="text-slate-300 dark:text-slate-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm mb-1">لا يوجد تحديد</p>
                                                            <p className="text-xs">انقر على أي خلية في الجدول لإضافة تعليق أو عرض المحادثة</p>
                                                        </div>
                                                    </div>
                                                ) : loadingComments ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                                                        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                                                        <p className="text-xs font-bold text-slate-400">جاري التحميل...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {comments.filter(c => c.cell_key === activeCellKey).length === 0 ? (
                                                            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3 opacity-60">
                                                                <MessageSquare size={32} className="text-slate-300 dark:text-slate-700" />
                                                                <p className="text-xs font-bold">لا توجد تعليقات على هذه الخلية بعد</p>
                                                            </div>
                                                        ) : (
                                                            comments.filter(c => c.cell_key === activeCellKey).map(comment => (
                                                                <div key={comment.id} className="flex gap-3 group/comment relative">
                                                                    <div className="flex-shrink-0 mt-1">
                                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-primary-500/20">
                                                                            {comment.user?.name?.charAt(0)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className={`p-3.5 rounded-2xl text-sm shadow-sm relative ${comment.is_resolved ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 rounded-tr-sm border border-emerald-100 dark:border-emerald-800/30' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tr-sm border border-slate-100 dark:border-slate-700'}`}>
                                                                            <div className="flex justify-between items-center mb-1.5">
                                                                                <span className="font-bold text-[11px] opacity-75">{comment.user?.name}</span>
                                                                                <span className="text-[10px] opacity-50">{new Date(comment.created_at).toLocaleDateString('ar-EG')}</span>
                                                                            </div>
                                                                            <p className="leading-relaxed font-medium">{comment.comment}</p>
                                                                        </div>
                                                                        {!comment.is_resolved && (
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => resolveComment(comment.id)}
                                                                                className="mt-2 text-[11px] text-primary-600 dark:text-primary-400 hover:text-primary-700 font-bold flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                                                            >
                                                                                <Check size={14} /> حل التعليق
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            <div className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-10">
                                                <div className="relative">
                                                    <textarea
                                                        disabled={!activeCellKey}
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                                                        placeholder={activeCellKey ? "اكتب تعليقك للرد هنا..." : "حدد خلية للتعليق"}
                                                        className="w-full text-sm rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 font-medium custom-scrollbar disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/80 resize-none pr-3 pl-3 py-3"
                                                        rows="2"
                                                    ></textarea>
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={!activeCellKey || !newComment.trim()}
                                                    onClick={addComment}
                                                    className="mt-3 w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-500/20 active:scale-[0.98]"
                                                >
                                                    <Send size={16} className="rotate-180" />
                                                    إرسال الرد
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {!(templates.find(t => t.id == form.template_id)?.weeks?.length > 0) && (
                                    <button type="button" onClick={() => setForm({...form, content: [...form.content, {}]})} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-bold mt-2">
                                        <Plus size={16} /> إضافة صف جديد
                                    </button>
                                )}
                                {errors.content && <p className="text-rose-500 text-xs font-bold mt-1">{errors.content}</p>}
                            </div>
                        )}

                        {!form.template_id && (
                            <div>
                                <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">الملف المرفق (PDF/Doc) {isEdit && studyPlan?.attachment_path ? '' : <span className="text-rose-500">*</span>}</label>
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                    <input type="file" id="attachment" className="hidden" accept=".pdf,.doc,.docx" onChange={e => setForm({...form, attachment: e.target.files[0]})} />
                                    <label htmlFor="attachment" className="cursor-pointer flex flex-col items-center justify-center">
                                        <FileDown className="w-8 h-8 text-slate-400 mb-2" />
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{form.attachment ? form.attachment.name : (isEdit && studyPlan?.attachment_path ? 'اختر ملفاً جديداً لاستبدال الملف الحالي' : 'اضغط لاختيار ملف')}</span>
                                        <span className="text-xs text-slate-400 mt-1">الحد الأقصى 10 ميجابايت</span>
                                    </label>
                                </div>
                                {errors.attachment && <p className="text-rose-500 text-xs font-bold mt-1">{errors.attachment}</p>}
                            </div>
                        )}

                        <div className="pt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                            <Link href={route('teacher.study-plans.index')} className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">إلغاء</Link>
                            <button type="button" onClick={(e) => submitForm(e, 'draft')} disabled={processing} className="px-6 py-3 rounded-xl font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors disabled:opacity-50">
                                حفظ كمسودة
                            </button>
                            <button type="button" onClick={(e) => submitForm(e, 'pending')} disabled={processing} className="px-6 py-3 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50">
                                إرسال للمراجعة
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
