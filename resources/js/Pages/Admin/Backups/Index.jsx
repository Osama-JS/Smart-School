import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Database, Download, Trash2, PlusCircle, AlertCircle, Clock, FileText, CheckCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function BackupsIndex({ backups }) {
    const { post, processing } = useForm();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleCreateBackup = () => {
        setIsGenerating(true);
        post(route('admin.backups.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsGenerating(false);
                Swal.fire({
                    icon: 'success',
                    title: 'تم إنشاء النسخة بنجاح!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            },
            onError: (errors) => {
                setIsGenerating(false);
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: errors.error || 'حدث خطأ أثناء إنشاء النسخة الاحتياطية',
                    confirmButtonText: 'حسناً',
                    confirmButtonColor: '#0ea5e9'
                });
            }
        });
    };

    const handleDelete = (filename) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: `سيتم حذف النسخة ${filename} ولن تتمكن من التراجع!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذفها!',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.backups.destroy', filename), {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'تم الحذف!',
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000
                        });
                    }
                });
            }
        });
    };

    return (
        <AdminLayout activeMenu="النسخ الاحتياطي">
            <Head title="إدارة النسخ الاحتياطي | لوحة تحكم النظام" />

            <div className="max-w-[100rem] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* Premium Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-900 shadow-md flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                                <Database size={32} className="text-primary-500 drop-shadow-sm" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-805 dark:text-white tracking-tight">
                                    لوحة إدارة النسخ الاحتياطي
                                </h1>
                                <p className="text-primary-705/80 dark:text-primary-300/80 mt-1.5 text-xs sm:text-sm font-semibold">
                                    قم بأخذ نسخ احتياطية لقاعدة البيانات بضغطة زر واحدة لتأمين بيانات النظام
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={handleCreateBackup}
                            disabled={isGenerating}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-[0_8px_20px_rgb(14,165,233,0.25)] hover:shadow-[0_8px_25px_rgb(14,165,233,0.4)] ${isGenerating ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 hover:-translate-y-1'} text-white shrink-0`}
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>جاري الإنشاء...</span>
                                </>
                            ) : (
                                <>
                                    <PlusCircle size={20} />
                                    <span>إنشاء نسخة جديدة</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Backups List */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
                    <div className="flex items-center gap-2 border-b border-slate-100/80 dark:border-slate-800/60 pb-4 mb-6">
                        <FileText size={18} className="text-slate-500 dark:text-slate-400" />
                        <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base">سجل النسخ الاحتياطية ({backups.length})</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50 font-black rounded-xl">
                                <tr>
                                    <th className="px-6 py-4 rounded-r-xl">اسم الملف</th>
                                    <th className="px-6 py-4">الحجم</th>
                                    <th className="px-6 py-4">تاريخ الإنشاء</th>
                                    <th className="px-6 py-4 rounded-l-xl text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="font-semibold text-slate-700 dark:text-slate-300">
                                {backups.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                                            <Database size={40} className="mx-auto mb-3 opacity-30" />
                                            لا توجد نسخ احتياطية حتى الآن.
                                        </td>
                                    </tr>
                                ) : (
                                    backups.map((backup, index) => (
                                        <tr key={index} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-primary-600 dark:text-primary-400 text-left dir-ltr">
                                                {backup.name}
                                            </td>
                                            <td className="px-6 py-4 text-left dir-ltr">{backup.size}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-slate-400" />
                                                    {backup.date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <a 
                                                        href={route('admin.backups.download', backup.name)} 
                                                        className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors tooltip"
                                                        title="تحميل الملف"
                                                    >
                                                        <Download size={18} />
                                                    </a>
                                                    <button 
                                                        onClick={() => handleDelete(backup.name)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors tooltip"
                                                        title="حذف النسخة"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
