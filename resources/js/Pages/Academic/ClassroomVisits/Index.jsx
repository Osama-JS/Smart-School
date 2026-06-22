import React, { useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    BookOpen, Search, Filter, Plus, FileText, CheckCircle, 
    X, Edit, Trash2, Calendar, User, Clock, AlertCircle 
} from 'lucide-react';
import Modal from '@/Components/Modal';
import SignatureCanvas from 'react-signature-canvas';
import { Toaster, toast } from 'react-hot-toast';

export default function ClassroomVisitsIndex({ auth, visits, teachers, grades, filters }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [signaturePadOpen, setSignaturePadOpen] = useState(false);
    const sigCanvas = useRef(null);

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

    const [filterData, setFilterData] = useState({
        teacher_id: filters?.teacher_id || '',
        grade_id: filters?.grade_id || '',
    });

    // جلب الشعب بناءً على الصف المختار
    const selectedGrade = grades.find(g => g.id.toString() === data.grade_id?.toString());
    const availableDivisions = selectedGrade ? selectedGrade.divisions : [];

    const handleFilter = () => {
        router.get(route('academic.classroom-visits'), filterData, { preserveState: true, preserveScroll: true });
    };

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

    const handleSaveSignature = () => {
        if (sigCanvas.current.isEmpty()) {
            toast.error('يرجى رسم التوقيع أولاً');
            return;
        }
        setData('supervisor_signature', sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
        setSignaturePadOpen(false);
        toast.success('تم حفظ التوقيع مؤقتاً، قم بحفظ الزيارة لإتمامه.');
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

    const handleApprove = (id) => {
        if (confirm('هل أنت متأكد من اعتماد الزيارة؟ لا يمكن تعديلها بعد الاعتماد.')) {
            router.post(route('academic.classroom-visits.approve', id), {}, {
                onSuccess: () => toast.success('تم الاعتماد بنجاح')
            });
        }
    };

    const getDayName = (dateString) => {
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const d = new Date(dateString);
        return days[d.getDay()];
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">الزيارات الصفية</h2>}
        >
            <Head title="الزيارات الصفية" />
            <Toaster position="top-center" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header & Stats */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                                    <BookOpen size={28} />
                                </div>
                                إدارة الزيارات الصفية
                            </h1>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">
                                تسجيل وتقييم واعتماد الزيارات الصفية للمعلمين
                            </p>
                        </div>
                        {auth.permissions.includes('إضافة زيارة صفية') && (
                            <button
                                onClick={openCreateModal}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-600/20"
                            >
                                <Plus size={20} />
                                زيارة صفية جديدة
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">المعلم</label>
                                <select
                                    value={filterData.teacher_id}
                                    onChange={e => setFilterData({...filterData, teacher_id: e.target.value})}
                                    className="w-full border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">الكل</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الصف</label>
                                <select
                                    value={filterData.grade_id}
                                    onChange={e => setFilterData({...filterData, grade_id: e.target.value})}
                                    className="w-full border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">الكل</option>
                                    {grades.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleFilter}
                                    className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
                                >
                                    <Filter size={20} />
                                    تصفية النتائج
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">اليوم/التاريخ</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">المعلم</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">الصف / الشعبة</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">النوع</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">المشرف</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">الحالة</th>
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
                                                <div className="font-semibold text-slate-800 dark:text-slate-200">{visit.teacher?.name}</div>
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
                                                {visit.is_approved ? (
                                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-sm bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full w-max">
                                                        <CheckCircle size={16} />
                                                        معتمدة
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-sm bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full w-max">
                                                        <Clock size={16} />
                                                        بانتظار الاعتماد
                                                    </span>
                                                )}
                                                {visit.teacher_signature ? (
                                                    <span className="block mt-1 text-xs text-green-500">تم توقيع المعلم</span>
                                                ) : (
                                                    <span className="block mt-1 text-xs text-red-400">بانتظار توقيع المعلم</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openPreviewModal(visit)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors" title="عرض التفاصيل">
                                                        <FileText size={18} />
                                                    </button>
                                                    
                                                    {!visit.is_approved && (
                                                        <>
                                                            {auth.permissions.includes('تعديل زيارة صفية') && (
                                                                <button onClick={() => openEditModal(visit)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors" title="تعديل">
                                                                    <Edit size={18} />
                                                                </button>
                                                            )}
                                                            {auth.permissions.includes('حذف زيارة صفية') && (
                                                                <button onClick={() => handleDelete(visit.id)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors" title="حذف">
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                            {auth.permissions.includes('اعتماد زيارة صفية') && (
                                                                <button onClick={() => handleApprove(visit.id)} className="p-2 text-slate-400 hover:text-green-600 dark:hover:text-green-400 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors" title="اعتماد الزيارة نهائياً">
                                                                    <CheckCircle size={18} />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {visits.data.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                لا توجد زيارات صفية مسجلة حتى الآن.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="2xl">
                <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {selectedVisit ? <Edit size={20} className="text-indigo-500" /> : <Plus size={20} className="text-indigo-500" />}
                            {selectedVisit ? 'تعديل زيارة صفية' : 'إضافة زيارة صفية جديدة'}
                        </h2>
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ الزيارة</label>
                                <input
                                    type="date"
                                    value={data.visit_date}
                                    onChange={e => setData('visit_date', e.target.value)}
                                    className="w-full border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                                {errors.visit_date && <p className="text-red-500 text-xs mt-1">{errors.visit_date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع الزيارة</label>
                                <select
                                    value={data.visit_type}
                                    onChange={e => setData('visit_type', e.target.value)}
                                    className="w-full border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="توجيهية">توجيهية</option>
                                    <option value="نموذجية">نموذجية</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المعلم</label>
                            <select
                                value={data.teacher_id}
                                onChange={e => setData('teacher_id', e.target.value)}
                                className="w-full border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            >
                                <option value="">-- اختر المعلم --</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            {errors.teacher_id && <p className="text-red-500 text-xs mt-1">{errors.teacher_id}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الصف</label>
                                <select
                                    value={data.grade_id}
                                    onChange={e => {
                                        setData('grade_id', e.target.value);
                                        setData('division_id', ''); // Reset division
                                    }}
                                    className="w-full border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="">-- اختر الصف --</option>
                                    {grades.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                                {errors.grade_id && <p className="text-red-500 text-xs mt-1">{errors.grade_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الشعبة</label>
                                <select
                                    value={data.division_id}
                                    onChange={e => setData('division_id', e.target.value)}
                                    className="w-full border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                    disabled={!data.grade_id}
                                >
                                    <option value="">-- اختر الشعبة --</option>
                                    {availableDivisions.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                {errors.division_id && <p className="text-red-500 text-xs mt-1">{errors.division_id}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">النقاط التي تم مناقشتها مع المعلم</label>
                            <textarea
                                value={data.discussed_points}
                                onChange={e => setData('discussed_points', e.target.value)}
                                className="w-full border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                rows="3"
                                placeholder="أدخل النقاط..."
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الملاحظات والتوصيات</label>
                            <textarea
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                                className="w-full border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                rows="3"
                                placeholder="ملاحظات وتوصيات المشرف..."
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">توقيع المشرف (اختياري الآن)</label>
                            {data.supervisor_signature || (selectedVisit && selectedVisit.supervisor_signature) ? (
                                <div className="border border-green-200 dark:border-green-800 rounded-xl p-4 bg-green-50 dark:bg-green-900/10 flex flex-col items-center justify-center">
                                    <CheckCircle className="text-green-500 mb-2" size={24} />
                                    <span className="text-green-700 dark:text-green-400 font-bold">تم إرفاق التوقيع</span>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setData('supervisor_signature', null);
                                            if(selectedVisit) selectedVisit.supervisor_signature = null;
                                        }}
                                        className="text-xs text-red-500 mt-2 underline"
                                    >
                                        إزالة وإعادة التوقيع
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setSignaturePadOpen(true)}
                                    className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    <Edit size={24} />
                                    <span>انقر هنا لرسم توقيعك</span>
                                </button>
                            )}
                        </div>

                    </div>

                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            {processing ? 'جاري الحفظ...' : 'حفظ الزيارة'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Signature Pad Modal */}
            <Modal show={signaturePadOpen} onClose={() => setSignaturePadOpen(false)} maxWidth="lg">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">توقيع المشرف</h3>
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
                            <button type="button" onClick={handleSaveSignature} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">
                                اعتماد التوقيع
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Preview Modal */}
            <Modal show={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} maxWidth="3xl">
                {selectedVisit && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText size={20} className="text-indigo-500" />
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
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedVisit.visit_type}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">حالة الاعتماد</span>
                                    {selectedVisit.is_approved ? (
                                        <span className="text-green-600 dark:text-green-400 font-bold">معتمدة</span>
                                    ) : (
                                        <span className="text-amber-600 dark:text-amber-400 font-bold">بانتظار الاعتماد</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">المعلم</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedVisit.teacher?.name}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">الصف / الشعبة</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedVisit.grade?.name} - {selectedVisit.division?.name}</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">النقاط التي تم مناقشتها مع المعلم</span>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">توقيع المعلم</span>
                                    {selectedVisit.teacher_signature ? (
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 flex justify-center h-32 items-center relative">
                                            <div className="absolute top-2 right-2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle size={10} /> معتمد
                                            </div>
                                            <img src={`/storage/${selectedVisit.teacher_signature}`} alt="توقيع المعلم" className="max-h-full max-w-full object-contain filter dark:invert" />
                                        </div>
                                    ) : (
                                        <div className="border border-red-200 dark:border-red-900/50 border-dashed rounded-xl p-4 bg-red-50/50 dark:bg-red-900/10 flex flex-col justify-center h-32 items-center text-red-400 dark:text-red-500 text-sm gap-2">
                                            <AlertCircle size={20} />
                                            <span>بانتظار توقيع المعلم</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
