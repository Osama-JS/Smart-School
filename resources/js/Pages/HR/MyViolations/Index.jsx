import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { AlertCircle, CheckCircle, PenTool, FileText, ShieldAlert, Filter, RefreshCw, Eye, X } from 'lucide-react';
import Modal from '@/Components/Modal';
import SignaturePad from '@/Components/SignaturePad';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import Pagination from '@/Components/Pagination';
import SelectInput from '@/Components/SelectInput';
import InputLabel from '@/Components/InputLabel';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function MyViolations({ auth, violations, types, filters }) {
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedViolation, setSelectedViolation] = useState(null);

    const [filterData, setFilterData] = useState({
        violation_type_id: filters?.violation_type_id || '',
        start_date: filters?.start_date || '',
        end_date: filters?.end_date || '',
        status: filters?.status || ''
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        employee_signature: null,
    });

    const applyFilters = () => {
        router.get(route('hr.my-violations'), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFilterData({
            violation_type_id: '',
            start_date: '',
            end_date: '',
            status: ''
        });
        router.get(route('hr.my-violations'));
    };

    const openSignModal = (violation) => {
        setSelectedViolation(violation);
        reset();
        setIsSignModalOpen(true);
    };

    const openPreviewModal = (violation) => {
        setSelectedViolation(violation);
        setIsPreviewModalOpen(true);
    };

    const submitSignature = (e) => {
        e.preventDefault();
        post(route('hr.my-violations.sign', selectedViolation.id), {
            onSuccess: () => setIsSignModalOpen(false)
        });
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="مخالفاتي" />

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-red-50/70 via-white to-white dark:from-red-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-red-100 dark:border-red-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700" />
                    
                    {/* Visual geometric lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-red-600" />
                            <circle cx="250" cy="90" r="4" className="fill-red-500" />
                            <circle cx="500" cy="160" r="6" className="fill-red-400" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <ShieldAlert size={28} className="text-red-600" />
                                سجل مخالفاتي
                            </h1>
                            <p className="text-red-700/80 dark:text-red-300/80 mt-2 text-sm font-semibold">استعراض وتوقيع المخالفات والتنبيهات المسجلة بحقك</p>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                        <Filter size={18} className="text-primary-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white">تصفية النتائج</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="group flex flex-col">
                            <InputLabel value="نوع المخالفة" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.violation_type_id} 
                                onChange={val => setFilterData({...filterData, violation_type_id: val})}
                                options={[
                                    { value: '', label: 'جميع الأنواع' },
                                    ...(types || []).map(t => ({ value: t.id, label: t.name }))
                                ]}
                            />
                        </div>

                        <div className="group flex flex-col">
                            <InputLabel value="حالة التوقيع" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.status} 
                                onChange={val => setFilterData({...filterData, status: val})}
                                options={[
                                    { value: '', label: 'الكل' },
                                    { value: 'unsigned', label: 'بانتظار التوقيع' },
                                    { value: 'signed', label: 'موقّعة' }
                                ]}
                            />
                        </div>

                        <div className="group flex flex-col">
                            <InputLabel value="من تاريخ" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <FlatpickrInput 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 !pl-10"
                                value={filterData.start_date}
                                onChange={val => setFilterData({...filterData, start_date: val})}
                                placeholder="اختر البداية..."
                            />
                        </div>

                        <div className="group flex flex-col">
                            <InputLabel value="إلى تاريخ" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <FlatpickrInput 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 !pl-10"
                                value={filterData.end_date}
                                onChange={val => setFilterData({...filterData, end_date: val})}
                                placeholder="اختر النهاية..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
                        <button 
                            onClick={applyFilters} 
                            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm shadow-primary-500/20"
                        >
                            <Filter size={16} />
                            تطبيق الفرز
                        </button>
                        <button 
                            onClick={resetFilters} 
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <RefreshCw size={16} />
                            إعادة ضبط
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-full">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">التاريخ والنوع</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">التفاصيل</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الإجراء المتخذ</th>
                                    <th className="py-4 px-6 text-center text-sm font-bold text-slate-500 dark:text-slate-400">حالة التوقيع</th>
                                    <th className="py-4 px-6 text-center text-sm font-bold text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {violations.data.length > 0 ? violations.data.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{v.violation_date}</div>
                                            <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">{v.violation_type?.name}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={v.details}>
                                                {v.details}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm text-slate-600 dark:text-slate-400">{v.action_taken}</div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {v.employee_signature ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                                    <CheckCircle size={14} />
                                                    موقّع
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 animate-pulse">
                                                    <AlertCircle size={14} />
                                                    بانتظار التوقيع
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    onClick={() => openPreviewModal(v)}
                                                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors"
                                                    title="معاينة التفاصيل"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {!v.employee_signature && (
                                                    <button
                                                        onClick={() => openSignModal(v)}
                                                        className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 flex items-center justify-center transition-colors"
                                                        title="التوقيع الآن"
                                                    >
                                                        <PenTool size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
                                                <CheckCircle size={32} />
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 font-bold">سجلك نظيف! لا توجد أي مخالفات مسجلة بحقك.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {violations.data.length > 0 && (
                    <div className="mt-8">
                        <Pagination links={violations.links} />
                    </div>
                )}
            </div>

            {/* Sign Modal */}
            <Modal show={isSignModalOpen} onClose={() => setIsSignModalOpen(false)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">إقرار وتوقيع</h2>
                    
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl mb-6">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            أقر أنا الموظف الموقع أدناه باطلاعي على المخالفة 
                            <strong className="mx-1 text-slate-900 dark:text-white">{selectedViolation?.violation_type?.name}</strong>
                            بتاريخ
                            <strong className="mx-1 text-slate-900 dark:text-white">{selectedViolation?.violation_date}</strong>.
                        </p>
                    </div>

                    <form onSubmit={submitSignature}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">توقيعك الإلكتروني:</label>
                            <SignaturePad 
                                onChange={(val) => setData('employee_signature', val)} 
                                error={errors.employee_signature}
                            />
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                            <SecondaryButton onClick={() => setIsSignModalOpen(false)}>إلغاء</SecondaryButton>
                            <PrimaryButton disabled={processing || !data.employee_signature} className="bg-green-600 hover:bg-green-700">اعتماد التوقيع</PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
            
            {/* Preview Modal */}
            <Modal show={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} maxWidth="2xl">
                {selectedViolation && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText size={20} className="text-primary-500" />
                                تفاصيل المخالفة
                            </h2>
                            <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">تاريخ المخالفة</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedViolation.violation_date}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">نوع المخالفة</span>
                                    <span className="text-red-600 dark:text-red-400 font-bold">{selectedViolation.violation_type?.name}</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">التفاصيل الكاملة</span>
                                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed min-h-[100px]">
                                    {selectedViolation.details}
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">الإجراء المتخذ</span>
                                <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 text-orange-800 dark:text-orange-300 font-medium">
                                    {selectedViolation.action_taken}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">توقيع الإدارة</span>
                                    {selectedViolation.admin_signature_url ? (
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 flex justify-center h-32 items-center">
                                            <img src={selectedViolation.admin_signature_url} alt="توقيع الإدارة" className="max-h-full max-w-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 dark:border-slate-700 border-dashed rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-center h-32 items-center text-slate-400 dark:text-slate-500 text-sm">
                                            لا يوجد توقيع
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">توقيع الموظف</span>
                                    {selectedViolation.employee_signature_url ? (
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 flex justify-center h-32 items-center relative">
                                            <div className="absolute top-2 right-2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle size={10} /> معتمد
                                            </div>
                                            <img src={selectedViolation.employee_signature_url} alt="توقيع الموظف" className="max-h-full max-w-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="border border-red-200 dark:border-red-900/50 border-dashed rounded-xl p-4 bg-red-50/50 dark:bg-red-900/10 flex flex-col justify-center h-32 items-center text-red-400 dark:text-red-500 text-sm gap-2">
                                            <AlertCircle size={20} />
                                            <span>بانتظار التوقيع</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedViolation.attachment_url && (
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <a 
                                        href={selectedViolation.attachment_url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-xl transition-colors font-bold text-sm border border-blue-100 dark:border-blue-900/50"
                                    >
                                        <FileText size={18} />
                                        عرض المرفقات
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
