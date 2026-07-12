import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function ImportModal({ show, onClose, onSuccess }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
    });
    
    const [importErrors, setImportErrors] = useState([]);

    const handleFileChange = (e) => {
        setData('file', e.target.files[0]);
    };

    const submit = (e) => {
        e.preventDefault();
        setImportErrors([]);
        
        post(route('hr.employees.import'), {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = page.props.flash || {};
                const importErrs = flash.import_errors || [];
                
                if (importErrs.length > 0) {
                    setImportErrors(importErrs);
                } else {
                    reset();
                    onClose();
                    if (onSuccess) onSuccess();
                }
            },
        });
    };

    const handleClose = () => {
        reset();
        setImportErrors([]);
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-[#5b8a2d]" />
                        استيراد الموظفين من ملف
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        تعليمات هامة للاستيراد:
                    </h3>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                        <li><strong>كلمة المرور الافتراضية:</strong> للموظفين الجدد ستكون من 1 إلى 7 (1234567).</li>
                        <li><strong>تطابق البيانات:</strong> يجب كتابة اسم القسم والصلاحية (Role) والدرجة الوظيفية بدقة كما هي في النظام وإلا سيفشل استيراد الموظف.</li>
                        <li><strong>معالجة الأخطاء:</strong> سيتم استيراد الموظفين ذوي البيانات الصحيحة، وسيتم إخبارك بالسجلات الخاطئة إن وجدت.</li>
                    </ul>
                </div>

                <div className="mb-6 flex justify-center">
                    <a 
                        href={route('hr.employees.template')} 
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium border border-gray-200 shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        تحميل نموذج الإكسل المعتمد
                    </a>
                </div>

                <form onSubmit={submit}>
                    <div className="mb-6">
                        <div className="mt-2 flex justify-center rounded-xl border border-dashed border-gray-300 px-6 py-10 bg-gray-50 hover:bg-gray-100 transition-colors relative">
                            <div className="text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                                <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                                    <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer rounded-md bg-white font-semibold text-[#5b8a2d] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#5b8a2d] focus-within:ring-offset-2 hover:text-[#4a7224] px-2"
                                    >
                                        <span>اختر ملفاً</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv,.xlsx,.xls" />
                                    </label>
                                    <p className="pl-1">أو قم بسحبه وإفلاته هنا</p>
                                </div>
                                <p className="text-xs leading-5 text-gray-500 mt-2">CSV, XLS, XLSX حتى 5MB</p>
                                {data.file && (
                                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[#5b8a2d]/10 text-[#5b8a2d] rounded-full text-sm font-medium">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {data.file.name}
                                    </div>
                                )}
                            </div>
                        </div>
                        {errors.file && <p className="mt-2 text-sm text-red-600">{errors.file}</p>}
                    </div>

                    {importErrors.length > 0 && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 overflow-hidden">
                            <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                أخطاء في بعض السجلات:
                            </h3>
                            <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                    {importErrors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            إغلاق
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.file}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#5b8a2d] to-[#4a7224] text-white rounded-lg hover:shadow-lg hover:shadow-[#5b8a2d]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            بدء الاستيراد
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
