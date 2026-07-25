import React, { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    BookOpen, Book, User, Layers, FileText, Check, AlertCircle, ArrowRight, MessageSquare, Send, Download
} from 'lucide-react';
import Swal from 'sweetalert2';

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
    const parts = dateStr.split(/[-/.]/);
    if (parts.length >= 3) {
        if (parts[0].length === 4) return toArabicNumerals(`${parts[2]}-${parts[1]}`);
        if (parts[2].length === 4) return toArabicNumerals(`${parts[0]}-${parts[1]}`);
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
export default function AcademicStudyPlansShow({ auth, studyPlan }) {
    const [reviewForm, setReviewForm] = useState({ status: studyPlan.status, admin_feedback: studyPlan.admin_feedback || '' });
    const [processing, setProcessing] = useState(false);
    
    // Comments State
    const [comments, setComments] = useState([]);
    const [activeCellKey, setActiveCellKey] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [isAddingComment, setIsAddingComment] = useState(false);

    useEffect(() => {
        if (studyPlan.id) {
            fetchComments(studyPlan.id);
        }
    }, [studyPlan.id]);

    const fetchComments = async (planId) => {
        setLoadingComments(true);
        try {
            const res = await window.axios.get(route('study-plan-comments.index', planId));
            setComments(res.data);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const addComment = async () => {
        if (!newComment.trim() || !activeCellKey) return;
        setIsAddingComment(true);
        try {
            const res = await window.axios.post(route('study-plan-comments.store', studyPlan.id), {
                cell_key: activeCellKey,
                comment: newComment
            });
            setComments([res.data, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error('Error adding comment:', err);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: err.response?.data?.message || 'حدث خطأ أثناء إضافة التعليق. يرجى المحاولة مرة أخرى.'
            });
        } finally {
            setIsAddingComment(false);
        }
    };

    const resolveComment = async (commentId) => {
        try {
            await window.axios.patch(route('study-plan-comments.resolve', commentId));
            setComments(comments.map(c => c.id === commentId ? { ...c, is_resolved: true } : c));
        } catch (err) {
            console.error('Error resolving comment:', err);
        }
    };

    const submitReview = (e, status) => {
        e.preventDefault();
        
        if (status === 'rejected' && !reviewForm.admin_feedback) {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه',
                text: 'يجب كتابة ملاحظات عند رفض الخطة'
            });
            return;
        }

        setProcessing(true);
        router.post(route('academic.study-plans.review', studyPlan.id), {
            status,
            admin_feedback: reviewForm.admin_feedback
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
            },
            onError: () => {
                setProcessing(false);
            }
        });
    };

    return (
        <AdminLayout activeMenu="الخطط الدراسية">
            <Head title={`مراجعة الخطة: ${studyPlan.title} | النظام الأكاديمي`} />

            {/* Background elements for premium aesthetic */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary-500/5 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]"></div>
            </div>

            <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto relative z-10">
                
                {/* 1. Header & Status */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                            <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <Link href={route('academic.study-plans.index')} className="w-12 h-12 flex items-center justify-center bg-white/80 backdrop-blur-md dark:bg-slate-800/80 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md border border-slate-200/60 dark:border-slate-700/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 group">
                                <ArrowRight size={24} className="group-hover:-translate-x-1 transition-transform" />
                            </Link>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                                    مراجعة الخطة الدراسية
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1.5">{studyPlan.title}</p>
                            </div>
                        </div>
                        {/* Status Badge */}
                        {studyPlan.status === 'pending' ? (
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-3 shadow-sm backdrop-blur-md">
                                <span className="relative flex h-3.5 w-3.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                                </span>
                                بانتظار المراجعة
                            </div>
                        ) : (
                            <div className={`px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-3 shadow-sm backdrop-blur-md border ${studyPlan.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'}`}>
                                {studyPlan.status === 'approved' ? <Check size={20} /> : <AlertCircle size={20} />}
                                {studyPlan.status === 'approved' ? 'تمت الموافقة' : 'مرفوضة'}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Metadata Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-800/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                            <User size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">المعلم</p>
                            <p className="font-black text-lg text-slate-800 dark:text-slate-200">{studyPlan.teacher?.name}</p>
                        </div>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/40 dark:to-sky-800/20 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                            <Book size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">المادة</p>
                            <p className="font-black text-lg text-slate-800 dark:text-slate-200">{studyPlan.subject?.name}</p>
                        </div>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                            <Layers size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">الصف</p>
                            <p className="font-black text-lg text-slate-800 dark:text-slate-200">{studyPlan.grade?.name}</p>
                        </div>
                    </div>
                </div>

                {/* 3. Table and Comments */}
                {(studyPlan.rows?.length > 0 || studyPlan.content) && studyPlan.template && (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 relative z-10">
                        {/* Table */}
                        <div className="xl:col-span-3 overflow-hidden border border-slate-200/80 dark:border-slate-700/80 rounded-[28px] shadow-sm hover:shadow-md transition-shadow bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col max-h-[70vh]">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                                <BookOpen size={18} className="text-slate-400" />
                                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">محتوى الخطة الدراسية</span>
                            </div>
                            <div className="overflow-auto custom-scrollbar flex-1">
                                <table className="min-w-full divide-y divide-gray-200/60 dark:divide-slate-700/60 text-sm">
                                    <thead className="bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm sticky top-0 z-20">
                                        <tr>
                                            {studyPlan.template.columns.map((col, idx) => {
                                                const isDateCol = col.label.includes('شهر') || col.label.includes('أسبوع') || col.label.includes('الاسبوع') || col.label.includes('تاريخ') || col.label.includes('فترة') || col.label.includes('زمني');
                                                const isNumberCol = col.label.includes('أيام') || col.label.includes('ايام') || col.label.includes('حصص') || col.label.includes('يوم');
                                                const widthClass = isDateCol ? 'w-16 min-w-[64px]' : isNumberCol ? 'w-16 min-w-[64px]' : 'min-w-[200px]';
                                                return (
                                                    <th key={idx} className={`px-2 py-4 text-center font-black text-slate-700 dark:text-slate-200 border-l border-slate-200/60 dark:border-slate-700/60 last:border-0 uppercase tracking-wide text-[10px] md:text-[11px] ${widthClass} ${isNumberCol ? 'whitespace-normal leading-tight' : 'whitespace-nowrap'}`}>
                                                        {col.label}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {(studyPlan.rows && studyPlan.rows.length > 0 ? studyPlan.rows.map(r => r.data) : ((studyPlan.content && typeof studyPlan.content === 'object' && !Array.isArray(studyPlan.content)) ? (studyPlan.content.rows || []) : (studyPlan.content || []))).map((row, rowIdx) => (
                                            <tr key={rowIdx} className="group/row hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                {studyPlan.template.columns.map((col, colIdx) => {
                                                    const cellKey = `row_${rowIdx}_col_${col.id}`;
                                                    const cellComments = comments.filter(c => c.cell_key === cellKey);
                                                    const hasOpenComments = cellComments.some(c => !c.is_resolved);
                                                    const isSelected = activeCellKey === cellKey;
                                                    
                                                    const isDateCol = col.label.includes('شهر') || col.label.includes('أسبوع') || col.label.includes('الاسبوع') || col.label.includes('تاريخ') || col.label.includes('فترة') || col.label.includes('زمني');
                                                    const isNumberCol = col.label.includes('أيام') || col.label.includes('ايام') || col.label.includes('حصص') || col.label.includes('يوم');
                                                    const widthClass = isDateCol ? 'w-16 min-w-[64px]' : isNumberCol ? 'w-16 min-w-[64px]' : 'min-w-[200px]';
                                                    
                                                    let displayValue = row[col.id];
                                                    let isReadOnlyCell = false;
                                                    const isMonth = col.label.includes('شهر') || col.label.toLowerCase().includes('month');
                                                    const isWeek = col.label.includes('أسبوع') || col.label.includes('الاسبوع') || col.label.toLowerCase().includes('week');
                                                    const isDate = col.label.includes('تاريخ') || col.label.includes('فترة') || col.label.includes('زمني');
                                                    
                                                    if (isMonth && studyPlan.template?.month) {
                                                        displayValue = studyPlan.template.month;
                                                        isReadOnlyCell = true;
                                                    } else if (isWeek) {
                                                        displayValue = getWeekName(rowIdx, studyPlan.template);
                                                        isReadOnlyCell = true;
                                                    } else if (isDate && getWeekDate(rowIdx, studyPlan.template)) {
                                                        displayValue = getWeekDate(rowIdx, studyPlan.template);
                                                        isReadOnlyCell = true;
                                                    }
                                                    
                                                    return (
                                                        <td 
                                                            key={colIdx} 
                                                            onClick={() => setActiveCellKey(cellKey)}
                                                            className={`p-0 border-l border-slate-100 dark:border-slate-800/60 last:border-0 align-top relative transition-all duration-300 group/cell ${widthClass} ${isSelected ? 'bg-primary-50/80 dark:bg-primary-900/20 ring-2 ring-inset ring-primary-500/50 shadow-inner' : ''}`}
                                                        >
                                                            {hasOpenComments && (
                                                                <div className="absolute top-2 left-2 flex items-center justify-center z-20 pointer-events-none">
                                                                    <span className="flex h-3 w-3 relative">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-sm border border-white dark:border-slate-800"></span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className={`absolute top-2 left-2 text-slate-300 dark:text-slate-600 transition-opacity duration-300 z-10 ${isSelected ? 'opacity-100 text-primary-400' : 'opacity-0 group-hover/cell:opacity-100'}`}>
                                                                {!hasOpenComments && <MessageSquare size={16} />}
                                                            </div>
                                                            
                                                            {isReadOnlyCell ? (
                                                                <div className="w-full h-full min-h-[140px] flex items-center justify-center gap-3 py-4 bg-slate-50/50 dark:bg-slate-800/30 select-none cursor-pointer">
                                                                    {(typeof displayValue === 'string' ? displayValue.split(' | ') : [displayValue]).map((line, i) => (
                                                                        <span 
                                                                            key={i}
                                                                            className="text-slate-500 dark:text-slate-400 font-black text-xs md:text-sm tracking-widest whitespace-nowrap"
                                                                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                                                        >
                                                                            {line}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className={`w-full h-full min-h-[60px] p-4 font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap cursor-pointer ${isNumberCol ? 'text-center' : ''}`}>
                                                                    {col.type === 'checkbox' 
                                                                        ? (row[col.id] === 'true' || row[col.id] === true ? <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1"><Check size={12}/> نعم</span> : <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-xs font-bold">لا</span>) 
                                                                        : (row[col.id] || <span className="text-slate-300 dark:text-slate-600">-</span>)}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Comments Sidebar */}
                        <div className="xl:col-span-1 border border-slate-200/80 dark:border-slate-700/80 rounded-[28px] shadow-sm hover:shadow-md transition-shadow bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl flex flex-col h-[70vh] relative overflow-hidden">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                                <div className="flex items-center gap-2 font-black text-slate-800 dark:text-white">
                                    <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                                        <MessageSquare size={18} />
                                    </div>
                                    التعليقات
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
                                            <p className="text-xs">انقر على أي خلية في الجدول لمشاهدة أو إضافة تعليقات</p>
                                        </div>
                                    </div>
                                ) : loadingComments ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                                        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                                        <p className="text-xs font-bold text-slate-400">جاري التحميل...</p>
                                    </div>
                                ) : comments.filter(c => c.cell_key === activeCellKey).length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3 opacity-60">
                                        <MessageSquare size={32} className="text-slate-300 dark:text-slate-700" />
                                        <p className="text-xs font-bold">لا توجد تعليقات على هذه الخلية</p>
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
                                                        <Check size={14} /> تحديد كتم الحل
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-10">
                                <div className="relative">
                                    <textarea
                                        disabled={!activeCellKey || isAddingComment}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={activeCellKey ? "اكتب تعليقك هنا..." : "حدد خلية للتعليق"}
                                        className="w-full text-sm rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 font-medium custom-scrollbar disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/80 resize-none pr-3 pl-3 py-3"
                                        rows="2"
                                    ></textarea>
                                </div>
                                <button
                                    type="button"
                                    disabled={!activeCellKey || !newComment.trim() || isAddingComment}
                                    onClick={addComment}
                                    className="mt-3 w-full py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
                                >
                                    <Send size={16} className={isAddingComment ? 'animate-pulse' : ''} />
                                    {isAddingComment ? 'جاري الإرسال...' : 'إرسال التعليق'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Attachment */}
                {studyPlan.attachment_path && (
                    <div className="bg-gradient-to-r from-primary-500 to-indigo-500 p-[1px] rounded-[24px] shadow-lg shadow-primary-500/10 relative z-10 hover:-translate-y-0.5 transition-transform">
                        <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-[23px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl gap-4">
                            <div className="flex items-center gap-4 text-center sm:text-right">
                                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-500 shadow-sm border border-primary-100 dark:border-primary-800/30">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 dark:text-slate-200 text-lg">يوجد ملف مرفق جاهز</h3>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">يمكنك تحميل المرفق الإضافي للمراجعة</p>
                                </div>
                            </div>
                            <a href={route('academic.study-plans.download', studyPlan.id)} className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/40">
                                <Download size={18} /> تحميل الملف
                            </a>
                        </div>
                    </div>
                )}

                {/* 5. Action Area */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 rounded-[28px] shadow-lg relative overflow-hidden z-10">
                    <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 mb-4">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                                <MessageSquare size={16} />
                            </div>
                            القرار وملاحظات المراجعة
                        </label>
                        <textarea 
                            className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-sm font-medium p-5 resize-none min-h-[140px] transition-shadow custom-scrollbar placeholder:text-slate-400" 
                            rows="4" 
                            placeholder="اكتب ملاحظاتك وتوجيهاتك للمعلم هنا... (إجبارية في حالة طلب التعديل)"
                            value={reviewForm.admin_feedback}
                            onChange={(e) => setReviewForm({...reviewForm, admin_feedback: e.target.value})}
                        ></textarea>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mt-6">
                            <button 
                                type="button"
                                disabled={processing}
                                onClick={(e) => submitReview(e, 'approved')}
                                className="flex-1 flex justify-center items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-4 px-6 rounded-2xl font-black transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group"
                            >
                                <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform"><Check size={20} strokeWidth={3} /></div>
                                اعتماد الخطة الدراسية
                            </button>
                            <button 
                                type="button"
                                disabled={processing}
                                onClick={(e) => submitReview(e, 'rejected')}
                                className="flex-1 flex justify-center items-center gap-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white py-4 px-6 rounded-2xl font-black transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group"
                            >
                                <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform"><AlertCircle size={20} strokeWidth={3} /></div>
                                طلب تعديل (رفض)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
