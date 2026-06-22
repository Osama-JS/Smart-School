import React, { useState, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    BookOpen, FileText, CheckCircle, 
    X, Edit, Calendar, AlertCircle 
} from 'lucide-react';
import Modal from '@/Components/Modal';
import SignatureCanvas from 'react-signature-canvas';
import { Toaster, toast } from 'react-hot-toast';

export default function TeacherClassroomVisitsIndex({ auth, visits }) {
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [signaturePadOpen, setSignaturePadOpen] = useState(false);
    const sigCanvas = useRef(null);

    const { data, setData, post, processing, reset } = useForm({
        teacher_signature: null,
    });

    const openPreviewModal = (visit) => {
        setSelectedVisit(visit);
        setIsPreviewModalOpen(true);
    };

    const handleSaveSignature = () => {
        if (sigCanvas.current.isEmpty()) {
            toast.error('يرجى رسم التوقيع أولاً');
            return;
        }
        
        post(route('teacher.my-classroom-visits.sign', selectedVisit.id), {
            data: { teacher_signature: sigCanvas.current.getTrimmedCanvas().toDataURL('image/png') },
            onSuccess: () => {
                setSignaturePadOpen(false);
                setIsPreviewModalOpen(false);
                toast.success('تم التوقيع على الزيارة بنجاح');
            }
        });
    };

    const getDayName = (dateString) => {
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const d = new Date(dateString);
        return days[d.getDay()];
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">زياراتي الصفية</h2>}
        >
            <Head title="زياراتي الصفية" />
            <Toaster position="top-center" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400">
                                    <BookOpen size={28} />
                                </div>
                                زياراتي الصفية
                            </h1>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">
                                استعراض الزيارات الصفية التي تمت لك وتوقيعها
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">اليوم/التاريخ</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">الصف / الشعبة</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">النوع</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">المشرف</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">الحالة والتوقيع</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {visits.data.map((visit) => (
                                        <tr key={visit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{getDayName(visit.visit_date)}</span>
                                                    <span className="text-sm text-slate-500">{visit.visit_date}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{visit.grade?.name}</span>
                                                    <span className="text-xs text-slate-500">{visit.division?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${visit.visit_type === 'نموذجية' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                    {visit.visit_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-600 dark:text-slate-400">{visit.supervisor?.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {visit.teacher_signature ? (
                                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-sm bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full w-max">
                                                        <CheckCircle size={16} /> تم التوقيع
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full w-max">
                                                        <AlertCircle size={16} /> بانتظار توقيعك
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => openPreviewModal(visit)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors flex items-center gap-2 text-sm">
                                                    <FileText size={16} />
                                                    عرض التفاصيل {(!visit.teacher_signature) && "والتوقيع"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {visits.data.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                لا توجد زيارات صفية مسجلة لك حتى الآن.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview & Sign Modal */}
            <Modal show={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} maxWidth="3xl">
                {selectedVisit && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText size={20} className="text-purple-500" />
                                تفاصيل الزيارة الصفية
                            </h2>
                            <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">اليوم والتاريخ</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{getDayName(selectedVisit.visit_date)} - {selectedVisit.visit_date}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">نوع الزيارة</span>
                                    <span className="text-purple-600 dark:text-purple-400 font-bold">{selectedVisit.visit_type}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">الصف / الشعبة</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedVisit.grade?.name} - {selectedVisit.division?.name}</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">النقاط التي تم مناقشتها</span>
                                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 min-h-[80px]">
                                    {selectedVisit.discussed_points || 'لا يوجد'}
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الملاحظات والتوصيات</span>
                                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 min-h-[80px]">
                                    {selectedVisit.notes || 'لا يوجد'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                <div>
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">توقيع المشرف ({selectedVisit.supervisor?.name})</span>
                                    {selectedVisit.supervisor_signature ? (
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 flex justify-center h-32 items-center">
                                            <img src={`/storage/${selectedVisit.supervisor_signature}`} alt="توقيع المشرف" className="max-h-full max-w-full object-contain filter dark:invert" />
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 dark:border-slate-700 border-dashed rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-center h-32 items-center text-slate-400 text-sm">
                                            لا يوجد توقيع
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">توقيع المعلم (أنت)</span>
                                    {selectedVisit.teacher_signature ? (
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 flex justify-center h-32 items-center relative">
                                            <div className="absolute top-2 right-2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle size={10} /> معتمد
                                            </div>
                                            <img src={`/storage/${selectedVisit.teacher_signature}`} alt="توقيع المعلم" className="max-h-full max-w-full object-contain filter dark:invert" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSignaturePadOpen(true)}
                                            className="w-full py-4 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex flex-col items-center justify-center gap-2 h-32"
                                        >
                                            <Edit size={24} />
                                            <span className="font-bold">انقر هنا لرسم توقيعك لاعتماد الزيارة</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Signature Pad Modal */}
            <Modal show={signaturePadOpen} onClose={() => setSignaturePadOpen(false)} maxWidth="lg">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">توقيع المعلم</h3>
                    <p className="text-sm text-slate-500 mb-4">أقر بأنني اطلعت على النقاط والملاحظات المذكورة في هذه الزيارة الصفية.</p>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 overflow-hidden mb-4">
                        <SignatureCanvas 
                            ref={sigCanvas}
                            penColor="blue"
                            canvasProps={{width: 450, height: 200, className: 'sigCanvas'}} 
                        />
                    </div>
                    <div className="flex justify-between">
                        <button type="button" onClick={() => sigCanvas.current.clear()} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-red-500 font-bold">
                            مسح التوقيع
                        </button>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setSignaturePadOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold">
                                إلغاء
                            </button>
                            <button 
                                type="button" 
                                onClick={handleSaveSignature} 
                                disabled={processing}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold disabled:opacity-50"
                            >
                                {processing ? 'جاري الحفظ...' : 'اعتماد التوقيع'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
