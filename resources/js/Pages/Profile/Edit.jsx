import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { User } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AdminLayout activeMenu="الملف الشخصي">
            <Head title="الملف الشخصي | نظام القيم ERP" />

            <div className="space-y-8 animate-fade-in pb-12">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-500/20 shadow-inner">
                                <User size={32} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                    الملف الشخصي
                                </h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-1.5 text-xs sm:text-sm font-semibold">
                                    تحديث بيانات حسابك وإعدادات الأمان الخاصة بك.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-5xl space-y-8">
                    {/* Update Profile Info */}
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-transparent group-hover:bg-primary-500/20 transition-colors" />
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    {/* Update Password */}
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-transparent group-hover:bg-emerald-500/20 transition-colors" />
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    {/* Delete Account */}
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-transparent group-hover:bg-rose-500/20 transition-colors" />
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
