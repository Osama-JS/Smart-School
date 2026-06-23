import React, { useState, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import SignaturePad from '@/Components/SignaturePad';
import { Toaster, toast } from 'react-hot-toast';
import { 
    BookOpen, FileText, CheckCircle, 
    X, Edit, Calendar, AlertCircle, Clock, ChevronDown, Check
} from 'lucide-react';

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
    React.useEffect(() => {
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

export default function TeacherClassroomVisitsIndex({ auth, visits }) {
    const { flash } = usePage().props;
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [signaturePadOpen, setSignaturePadOpen] = useState(false);
    const [isSigning, setIsSigning] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        teacher_signature: null,
    });

    const openPreviewModal = (visit) => {
        setSelectedVisit(visit);
        setIsPreviewModalOpen(true);
    };

    const handleSaveSignature = () => {
        setIsSigning(true);
        router.post(route('teacher.my-classroom-visits.sign', selectedVisit.id), {
            teacher_signature: data.teacher_signature
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSignaturePadOpen(false);
                setIsPreviewModalOpen(false);
                toast.success('تم التوقيع على الزيارة بنجاح');
            },
            onFinish: () => setIsSigning(false)
        });
    };

    const getDayName = (dateString) => {
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const d = new Date(dateString);
        return days[d.getDay()];
    };

    return (
        <AdminLayout activeMenu="زياراتي الصفية">
            <Head title="زياراتي الصفية | النظام الأكاديمي" />
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
                            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight">زياراتي الصفية</h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">استعراض تفاصيل الزيارات الصفية التي تمت لك وتوقيعها إلكترونياً</p>
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">التاريخ</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الصف والشعبة</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">نوع الزيارة</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الموجه/المشرف</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الحالة والتوقيع</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {visits.data.map((visit) => (
                                    <tr key={visit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{getDayName(visit.visit_date)}</span>
                                                <span className="text-xs text-slate-500 mt-0.5">{visit.visit_date}</span>
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
                                            {visit.teacher_signature ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1.5 rounded-full text-xs font-bold w-max">
                                                    <CheckCircle size={14} /> تم التوقيع
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2.5 py-1.5 rounded-full text-xs font-bold w-max">
                                                    <AlertCircle size={14} /> بانتظار توقيعك
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => openPreviewModal(visit)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm ${!visit.teacher_signature ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                                                <FileText size={16} />
                                                <span>عرض التفاصيل {(!visit.teacher_signature) && "والتوقيع"}</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {visits.data.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                                <BookOpen size={48} className="mb-4 opacity-20" />
                                                <p className="font-bold text-lg">لا توجد زيارات صفية</p>
                                                <p className="text-sm mt-1">لم يتم العثور على أية زيارات صفية مسجلة لك حتى الآن.</p>
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

            {/* Preview & Sign Modal */}
            <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} maxWidth="max-w-3xl" title="تفاصيل الزيارة الصفية">
                {selectedVisit && (
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">اليوم والتاريخ</span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{getDayName(selectedVisit.visit_date)} - {selectedVisit.visit_date}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">نوع الزيارة</span>
                                <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">{selectedVisit.visit_type}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">الصف والشعبة</span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{selectedVisit.grade?.name} — {selectedVisit.division?.name}</span>
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
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-2 bg-white dark:bg-slate-800 flex justify-center h-32 items-center overflow-hidden">
                                        <img src={selectedVisit.supervisor_signature_url} alt="توقيع المشرف" className="max-h-full max-w-full object-contain filter dark:invert" />
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 dark:border-slate-700 border-dashed rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-center h-32 items-center text-slate-400 text-sm font-bold">
                                        لا يوجد توقيع
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">توقيع المعلم (أنت)</span>
                                {selectedVisit.teacher_signature_url ? (
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-2 bg-white dark:bg-slate-800 flex justify-center h-32 items-center relative overflow-hidden">
                                        <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                                            <CheckCircle size={10} /> معتمد
                                        </div>
                                        <img src={selectedVisit.teacher_signature_url} alt="توقيع المعلم" className="max-h-full max-w-full object-contain filter dark:invert" />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSignaturePadOpen(true)}
                                        className="w-full py-4 border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-2xl text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex flex-col items-center justify-center gap-3 h-32"
                                    >
                                        <Edit size={24} />
                                        <span className="font-bold text-sm">انقر هنا لرسم توقيعك لاعتماد الزيارة</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Signature Pad Modal */}
            <Modal isOpen={signaturePadOpen} onClose={() => setSignaturePadOpen(false)} maxWidth="max-w-lg" title="توقيع المعلم">
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        أقر بأنني اطلعت على النقاط والملاحظات المذكورة في هذه الزيارة الصفية.
                    </p>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 overflow-hidden shadow-inner">
                        <SignaturePad 
                            onChange={(val) => setData('teacher_signature', val)} 
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => setSignaturePadOpen(false)} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm">
                            إلغاء
                        </button>
                        <button 
                            type="button" 
                            onClick={handleSaveSignature} 
                            disabled={isSigning || !data.teacher_signature}
                            className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-sm disabled:opacity-50"
                        >
                            {isSigning ? 'جاري الحفظ...' : 'اعتماد التوقيع'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
