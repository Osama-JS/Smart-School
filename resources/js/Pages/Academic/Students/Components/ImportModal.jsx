import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/Components/Modal';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X, Loader2, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export default function ImportModal({ show, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState(null);
    const [importErrors, setImportErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeBatchId, setActiveBatchId] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [progressData, setProgressData] = useState({ progress: 0, total: 0, success: 0 });
    const pollIntervalRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFileError(null);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!file) {
            setFileError('يرجى اختيار ملف الإكسل أولاً.');
            return;
        }

        setImportErrors([]);
        setFileError(null);
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(route('academic.students.import'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data && res.data.success) {
                const total = res.data.total || res.data.count || 0;
                const count = res.data.count || 0;
                const errs = res.data.errors || [];
                const creds = res.data.credentials || [];

                setIsPolling(true);
                setProgressData({
                    progress: 100,
                    total: total,
                    success: count,
                });

                if (errs.length > 0) {
                    setImportErrors(errs);
                    setIsSubmitting(false);
                }

                if (count > 0) {
                    setTimeout(() => {
                        handleClose();
                        if (onSuccess) onSuccess(creds);
                    }, 1200);
                } else if (errs.length > 0) {
                    setIsSubmitting(false);
                    setIsPolling(false);
                }
            } else {
                setIsSubmitting(false);
                setFileError('لم يتم استلام استجابة صحيحة من السيرفر.');
            }
        } catch (err) {
            setIsSubmitting(false);
            if (err.response?.data?.errors?.file) {
                setFileError(err.response.data.errors.file[0]);
            } else if (err.response?.data?.message) {
                setFileError(err.response.data.message);
            } else {
                setFileError('حدث خطأ أثناء رفع الملف، يرجى التأكد من صيغة الملف وحجمه.');
            }
        }
    };

    // مراقبة تقدم المهمة في الخلفية عبر polling
    useEffect(() => {
        if (!activeBatchId || !isPolling) return;

        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await axios.get(route('academic.students.import-status', activeBatchId));
                const status = res.data;

                if (status.status === 'processing') {
                    setProgressData({
                        progress: status.progress || 0,
                        total: status.total || 0,
                        success: status.success || 0,
                    });
                    if (status.errors && status.errors.length > 0) {
                        setImportErrors(status.errors);
                    }
                } else if (status.status === 'completed') {
                    clearInterval(pollIntervalRef.current);
                    setIsPolling(false);
                    setIsSubmitting(false);
                    setProgressData({ progress: 100, total: status.total, success: status.success });

                    if (status.errors && status.errors.length > 0) {
                        setImportErrors(status.errors);
                    }

                    // جلب البطاقات لتجهيز الطباعة
                    try {
                        const credRes = await axios.get(route('academic.students.import-credentials', activeBatchId));
                        const credentials = credRes.data.credentials || [];
                        handleClose();
                        if (onSuccess) onSuccess(credentials);
                    } catch (e) {
                        handleClose();
                        if (onSuccess) onSuccess([]);
                    }
                } else if (status.status === 'failed') {
                    clearInterval(pollIntervalRef.current);
                    setIsPolling(false);
                    setIsSubmitting(false);
                    setImportErrors(status.errors || ['تعذرت المعالجة في الخلفية.']);
                }
            } catch (err) {
                console.error('Error polling import status', err);
            }
        }, 1200);

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [activeBatchId, isPolling]);

    const handleClose = () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setFile(null);
        setFileError(null);
        setImportErrors([]);
        setActiveBatchId(null);
        setIsSubmitting(false);
        setIsPolling(false);
        setProgressData({ progress: 0, total: 0, success: 0 });
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <div className="p-6 text-right" dir="rtl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-[#5b8a2d]" />
                        استيراد الطلاب من ملف الإكسل (المعالجة السحابية)
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                    <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        نظام الأمان والخصوصية:
                    </h3>
                    <ul className="list-disc list-inside text-sm text-emerald-700 space-y-1">
                        <li><strong>كلمات مرور فريدة:</strong> سيقوم النظام بتوليد كلمة مرور عشوائية وآمنة لكل طالب تطبع على بطاقته الفردية.</li>
                        <li><strong>تفعيل إلزامي:</strong> يُلزم الطالب بتعيين كلمة مرور شخصية جديدة عند أول تسجيل دخول له لحماية حسابه.</li>
                        <li><strong>معالجة في الخلفية:</strong> تتم معالجة البيانات بسرعة فائقة بدون أي تجميد للصفحة.</li>
                    </ul>
                </div>

                <div className="mb-6 flex justify-center">
                    <a 
                        href={route('academic.students.template')} 
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium border border-gray-200 shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        تحميل النموذج المعتمد للإكسل
                    </a>
                </div>

                {isSubmitting || isPolling ? (
                    <div className="py-8 text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-[#5b8a2d] animate-spin mx-auto" />
                        <h3 className="text-lg font-bold text-gray-800">
                            {isPolling ? 'جاري استيراد الطلاب وتوليد البطاقات في الخلفية...' : 'جاري رفع الملف وبدء المهمة...'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {progressData.total > 0 
                                ? `تمت معالجة ${progressData.success} من أصل ${progressData.total} طالب`
                                : 'جاري تجهيز وتوزيع البيانات...'}
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden border border-gray-100 shadow-inner">
                            <div 
                                className="bg-gradient-to-r from-[#5b8a2d] to-[#4a7224] h-4 rounded-full transition-all duration-300" 
                                style={{ width: `${Math.max(progressData.progress, 5)}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold text-[#5b8a2d]">{progressData.progress}% مكتمل</span>

                        <div className="pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="text-sm text-gray-500 hover:text-gray-700 underline"
                            >
                                يمكنك إغلاق النافذة ومتابعة عملك، وسيصلك إشعار فور اكتمال الاستيراد
                            </button>
                        </div>
                    </div>
                ) : (
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
                                    <p className="text-xs leading-5 text-gray-500 mt-2">CSV, XLS, XLSX حتى 10MB</p>
                                    {file && (
                                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[#5b8a2d]/10 text-[#5b8a2d] rounded-full text-sm font-medium">
                                            <CheckCircle2 className="w-4 h-4" />
                                            {file.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {fileError && <p className="mt-2 text-sm text-red-600 font-medium">{fileError}</p>}
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
                                disabled={isSubmitting || !file}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#5b8a2d] to-[#4a7224] text-white rounded-lg hover:shadow-lg hover:shadow-[#5b8a2d]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                بدء الاستيراد في الخلفية
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}
