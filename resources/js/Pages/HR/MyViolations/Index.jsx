import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { AlertCircle, CheckCircle, PenTool, FileText, ShieldAlert } from 'lucide-react';
import Modal from '@/Components/Modal';
import SignaturePad from '@/Components/SignaturePad';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import Pagination from '@/Components/Pagination';

export default function MyViolations({ auth, violations }) {
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [selectedViolation, setSelectedViolation] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        employee_signature: null,
    });

    const openSignModal = (violation) => {
        setSelectedViolation(violation);
        reset();
        setIsSignModalOpen(true);
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {violations.data.map(v => (
                            <div key={v.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-all hover:shadow-md">
                                <div className={`h-2 w-full ${v.employee_signature ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{v.violation_date}</span>
                                        </div>
                                        {v.employee_signature ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                                                <CheckCircle size={16} />
                                                موقّع
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-medium animate-pulse">
                                                <AlertCircle size={16} />
                                                بانتظار توقيعك
                                            </span>
                                        )}
                                    </div>
                                    
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{v.violation_type?.name}</h4>
                                    
                                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-1">
                                        <span className="font-semibold block mb-1">التفاصيل:</span>
                                        <p className="line-clamp-3">{v.details}</p>
                                    </div>

                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl mb-4 border border-orange-100 dark:border-orange-900/30">
                                        <span className="text-xs font-semibold text-orange-800 dark:text-orange-400 block mb-1">الإجراء المتخذ:</span>
                                        <p className="text-sm text-orange-900 dark:text-orange-300">{v.action_taken}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                                        {v.attachment_path ? (
                                            <a href={`/storage/${v.attachment_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                                <FileText size={16} />
                                                عرض المرفقات
                                            </a>
                                        ) : <span></span>}

                                        {!v.employee_signature && (
                                            <PrimaryButton onClick={() => openSignModal(v)} className="!bg-red-600 hover:!bg-red-700 !px-3 !py-1.5 text-xs">
                                                <PenTool size={14} className="me-1.5" />
                                                التوقيع الآن
                                            </PrimaryButton>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {violations.data.length === 0 && (
                            <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">سجلك نظيف!</h3>
                                <p className="text-gray-500 dark:text-gray-400">لا توجد أي مخالفات مسجلة بحقك.</p>
                            </div>
                        )}
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
        </AdminLayout>
    );
}
