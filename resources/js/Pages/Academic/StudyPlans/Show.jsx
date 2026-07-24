import React, { useState, useEffect } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Book, User, Check, AlertCircle, MessageSquare, Send, ArrowRight, Download, FileText, Printer, FileDown, X
} from 'lucide-react';
import axios from 'axios';
import { StudyPlanPdfTemplate } from '@/Components/StudyPlanPdfTemplate';
import html2pdf from 'html2pdf.js';

export default function StudyPlanShow({ studyPlan }) {
    const [reviewForm, setReviewForm] = useState({ admin_feedback: '' });
    const [processing, setProcessing] = useState(false);
    
    // Comments State
    const [comments, setComments] = useState([]);
    const [activeCellKey, setActiveCellKey] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    
    const [pdfPlan, setPdfPlan] = useState(null);

    useEffect(() => {
        if (pdfPlan) {
            const element = document.getElementById('pdf-template-container');
            const opt = {
                margin:       10,
                filename:     `الخطة_الدراسية_${pdfPlan.title}.pdf`,
                image:        { type: 'jpeg', quality: 1.0 },
                html2canvas:  { scale: 2, useCORS: true, logging: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                setPdfPlan(null);
            });
        }
    }, [pdfPlan]);

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = await axios.get(route('study-plan-comments.index', studyPlan.id));
            setComments(res.data);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const addComment = async () => {
        if (!newComment.trim() || !activeCellKey) return;
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

    const submitReview = (e, status) => {
        e.preventDefault();
        if (status === 'rejected' && !reviewForm.admin_feedback) {
            alert('يجب كتابة ملاحظات عند رفض الخطة');
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
                router.get(route('academic.study-plans.index'));
            },
            onError: () => setProcessing(false)
        });
    };

    const contentRows = (studyPlan.content && typeof studyPlan.content === 'object' && !Array.isArray(studyPlan.content)) 
        ? (studyPlan.content.rows || []) 
        : (studyPlan.content || []);

    return (
        <AdminLayout>
            <Head title={`مراجعة: ${studyPlan.title}`} />
            
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('academic.study-plans.index')} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition">
                            <ArrowRight size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-1">
                                مراجعة الخطة الدراسية
                            </h1>
                            <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                <Book size={16} className="text-primary-500" />
                                {studyPlan.title}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="px-4 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                            <span className="text-xs text-slate-400 block mb-0.5">المعلم</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{studyPlan.teacher?.name}</span>
                        </div>
                        <div className="px-4 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                            <span className="text-xs text-slate-400 block mb-0.5">المادة</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{studyPlan.subject?.name}</span>
                        </div>
                        <div className="px-4 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                            <span className="text-xs text-slate-400 block mb-0.5">الحالة</span>
                            <span className={`font-bold text-sm ${studyPlan.status === 'approved' ? 'text-emerald-500' : studyPlan.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'}`}>
                                {studyPlan.status === 'approved' ? 'معتمدة' : studyPlan.status === 'rejected' ? 'مرفوضة' : 'قيد المراجعة'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Main Content - Table */}
                    <div className="xl:col-span-3 space-y-6">
                        {contentRows.length > 0 && studyPlan.template && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <FileText className="text-primary-500" size={20} />
                                        محتوى الخطة
                                    </h3>
                                    {studyPlan.status === 'approved' && (
                                        <button 
                                            onClick={() => setPdfPlan(studyPlan)}
                                            className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-xl font-bold text-xs transition flex items-center gap-2 border border-emerald-100 dark:border-emerald-800"
                                        >
                                            <Printer size={14} /> تصدير PDF
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                                            <tr>
                                                {studyPlan.template.columns.map((col, idx) => (
                                                    <th key={idx} className="px-4 py-4 text-right font-black text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 last:border-0 whitespace-nowrap">
                                                        {col.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800/50">
                                            {contentRows.map((row, rowIdx) => (
                                                <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    {studyPlan.template.columns.map((col, colIdx) => {
                                                        const cellKey = `row_${rowIdx}_col_${col.id}`;
                                                        const cellComments = comments.filter(c => c.cell_key === cellKey);
                                                        const hasOpenComments = cellComments.some(c => !c.is_resolved);
                                                        const isSelected = activeCellKey === cellKey;
                                                        return (
                                                            <td 
                                                                key={colIdx} 
                                                                onClick={() => setActiveCellKey(cellKey)}
                                                                className={`px-4 py-4 border-l border-slate-100 dark:border-slate-800 last:border-0 align-top whitespace-pre-wrap cursor-pointer transition-all relative group ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 shadow-[inset_0_0_0_2px_theme(colors.primary.500)]' : ''}`}
                                                            >
                                                                {hasOpenComments && (
                                                                    <div className="absolute top-2 left-2 flex items-center justify-center z-10">
                                                                        <span className="flex h-3 w-3 relative">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="group-hover:opacity-100 opacity-0 absolute top-2 left-2 text-primary-300 transition-opacity z-10">
                                                                    {!hasOpenComments && <MessageSquare size={14} />}
                                                                </div>
                                                                <div className="pr-1 text-slate-600 dark:text-slate-300">
                                                                    {col.type === 'checkbox' 
                                                                        ? (row[col.id] === 'true' || row[col.id] === true ? <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">نعم</span> : <span className="inline-block px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold">لا</span>) 
                                                                        : (row[col.id] || <span className="text-slate-300">-</span>)}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {studyPlan.attachment_path && (
                            <div className="flex items-center justify-between p-5 border border-primary-200 dark:border-primary-800/50 rounded-3xl bg-primary-50/50 dark:bg-primary-900/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center">
                                        <FileDown size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary-900 dark:text-primary-100 mb-1">المرفقات الإضافية</h4>
                                        <p className="text-sm text-primary-600 dark:text-primary-400">قام المعلم برفع ملف مرفق مع هذه الخطة</p>
                                    </div>
                                </div>
                                <a href={route('academic.study-plans.download', studyPlan.id)} className="px-5 py-2.5 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-200 transition border border-slate-200 dark:border-slate-700">
                                    <Download size={16} /> تحميل الملف
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Comments & Actions */}
                    <div className="xl:col-span-1 flex flex-col gap-6">
                        
                        {/* Live Comments */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col h-[500px]">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-xl">
                                    <MessageSquare size={18} />
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white">التعليقات الحية</h3>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
                                {!activeCellKey ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                            <MessageSquare size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm font-medium px-4">انقر على أي خلية في الجدول لإضافة تعليق مباشر للمعلم أو عرض المحادثة.</p>
                                    </div>
                                ) : loadingComments ? (
                                    <div className="text-center text-slate-400 text-sm py-10">جاري التحميل...</div>
                                ) : (
                                    <>
                                        {comments.filter(c => c.cell_key === activeCellKey).length === 0 ? (
                                            <div className="text-center text-slate-400 text-sm py-10 font-medium">لا توجد تعليقات على هذه الخلية.</div>
                                        ) : (
                                            comments.filter(c => c.cell_key === activeCellKey).map(comment => (
                                                <div key={comment.id} className={`p-4 rounded-2xl text-sm transition-all ${comment.is_resolved ? 'bg-slate-100 dark:bg-slate-800 opacity-60' : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700'}`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 text-xs">
                                                                <User size={12} />
                                                            </div>
                                                            {comment.user?.name}
                                                        </span>
                                                        {comment.is_resolved && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">محلول</span>}
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-300 mb-3 font-medium">{comment.comment}</p>
                                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-400">
                                                        <span>{new Date(comment.created_at).toLocaleString('ar-EG')}</span>
                                                        {!comment.is_resolved && (
                                                            <button type="button" onClick={() => resolveComment(comment.id)} className="text-primary-500 hover:text-primary-600 font-bold bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg">حل التعليق</button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                            </div>
                            
                            {activeCellKey && (
                                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-b-3xl">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addComment())}
                                            placeholder="اكتب ملاحظة للمعلم هنا..." 
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={addComment} 
                                            disabled={!newComment.trim()} 
                                            className="absolute left-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-primary-500 text-white rounded-xl disabled:opacity-50 disabled:bg-slate-300 transition-all hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5"
                                        >
                                            <Send size={16} className="rotate-180 -ml-0.5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions (Approve / Reject) */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 space-y-4">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                <AlertCircle size={18} className="text-primary-500" />
                                القرار النهائي
                            </h3>
                            <div>
                                <textarea 
                                    value={reviewForm.admin_feedback} 
                                    onChange={e => setReviewForm({...reviewForm, admin_feedback: e.target.value})} 
                                    placeholder="اكتب ملاحظات الاعتماد أو أسباب الرفض (إلزامي في حال الرفض)..." 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-sm font-medium min-h-[100px] transition-all resize-y" 
                                ></textarea>
                            </div>
                            
                            <div className="flex flex-col gap-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={(e) => submitReview(e, 'approved')} 
                                    disabled={processing || studyPlan.status === 'approved'} 
                                    className="w-full py-3.5 rounded-2xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check size={18}/> اعتماد الخطة النهائية
                                </button>
                                <button 
                                    type="button" 
                                    onClick={(e) => submitReview(e, 'rejected')} 
                                    disabled={processing || studyPlan.status === 'rejected'} 
                                    className="w-full py-3.5 rounded-2xl font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-800"
                                >
                                    <X size={18}/> رفض للإعادة والتعديل
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Hidden container for PDF rendering */}
            {pdfPlan && (
                <div id="pdf-template-container" style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }}>
                    <StudyPlanPdfTemplate plan={pdfPlan} />
                </div>
            )}
        </AdminLayout>
    );
}
