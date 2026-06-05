import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Check, Save, Settings as SettingsIcon, Building, Clock, ShieldCheck, Upload, Calendar, Lock } from 'lucide-react';

export default function SettingsIndex({ settings }) {
    const { flash, logo_url } = usePage().props;
    const [form, setForm] = useState({
        school_name: settings.school_name || '',
        academic_year: settings.academic_year || '',
        session_timeout: settings.session_timeout || 120,
        max_login_attempts: settings.max_login_attempts || 5,
        logo: null,
    });
    const [logoPreview, setLogoPreview] = useState(logo_url || '');
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security'

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, logo: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);
        router.post(route('admin.settings.update'), form, {
            onFinish: () => setSaving(false),
        });
    };

    return (
        <AdminLayout activeMenu="إعدادات النظام">
            <Head title="إعدادات النظام | النظام الإداري" />

            {flash?.success && (
                <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 px-5 py-4 rounded-2xl text-sm font-bold shadow-sm">
                    <Check size={18} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span>{flash.success}</span>
                </div>
            )}

            {/* Header Section with Brand Colors and Geometric Accent */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none">
                {/* Brand Line Accent */}
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                
                {/* Fine abstract geometric background lines */}
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                        <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                        <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                        <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                    </svg>
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">إعدادات النظام</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">التحكم في الإعدادات العامة والمتغيرات الأساسية للمدرسة</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl">
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Sidebar Tabs Menu */}
                    <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1.5 bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/80">
                        <button
                            type="button"
                            onClick={() => setActiveTab('general')}
                            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative ${
                                activeTab === 'general'
                                    ? 'bg-white dark:bg-[#121820] text-primary-600 dark:text-primary-400 shadow-sm border border-slate-200/40 dark:border-slate-800'
                                    : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250 hover:bg-slate-100/50 dark:hover:bg-slate-900/20'
                            }`}
                        >
                            <Building size={16} className={activeTab === 'general' ? 'text-primary-500' : 'text-slate-400'} />
                            <span>المعلومات الأساسية</span>
                            {activeTab === 'general' && (
                                <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-primary-500 rounded-l-md" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative ${
                                activeTab === 'security'
                                    ? 'bg-white dark:bg-[#121820] text-primary-600 dark:text-primary-400 shadow-sm border border-slate-200/40 dark:border-slate-800'
                                    : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250 hover:bg-slate-100/50 dark:hover:bg-slate-900/20'
                            }`}
                        >
                            <ShieldCheck size={16} className={activeTab === 'security' ? 'text-primary-500' : 'text-slate-400'} />
                            <span>الأمان والوصول</span>
                            {activeTab === 'security' && (
                                <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-primary-500 rounded-l-md" />
                            )}
                        </button>
                    </div>

                    {/* Active Form Panel Card */}
                    <div className="flex-1 w-full bg-white dark:bg-[#121820] rounded-3xl border border-slate-100 dark:border-primary-500/10 shadow-sm dark:shadow-none overflow-hidden relative min-h-[420px] flex flex-col justify-between">
                        {/* Dot Matrix Decorative Background */}
                        <div className="absolute top-0 left-0 w-32 h-32 opacity-[0.03] dark:opacity-[0.05] pointer-events-none overflow-hidden rounded-tr-3xl">
                            <div className="w-full h-full bg-[radial-gradient(#5b8a2d_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
                        </div>

                        <div className="p-6 md:p-8 space-y-8 flex-1">
                            {/* Tab 1: General Info */}
                            <div className={activeTab === 'general' ? 'block space-y-6' : 'hidden'}>
                                <div>
                                    <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-2 flex items-center gap-3">
                                        <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl text-primary-500 dark:text-primary-400 shrink-0">
                                            <Building size={20} />
                                        </div>
                                        <span>المعلومات الأساسية وشعار المدرسة</span>
                                    </h3>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mr-13">تعديل الاسم العام واللوجو الرسمي والنظام الدراسي للمنشأة التعليمية.</p>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-8 items-start pt-4">
                                    {/* School Logo Upload */}
                                    <div className="flex flex-col items-center gap-3 shrink-0 w-full lg:w-auto">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">شعار المدرسة</span>
                                        <div className="relative group cursor-pointer w-32 h-32 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-500/50 bg-slate-50/40 dark:bg-slate-900/20 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 shadow-sm">
                                            {logoPreview ? (
                                                <div className="relative w-full h-full p-2 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl">
                                                    <img src={logoPreview} alt="شعار المدرسة" className="max-w-full max-h-full object-contain" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300 gap-1 rounded-2xl">
                                                        <Upload size={20} className="text-white animate-bounce" />
                                                        <span className="text-[10px] text-white font-bold">تغيير الصورة</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 p-3 text-center">
                                                    <Upload size={24} className="text-slate-400 dark:text-slate-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" />
                                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">اختر صورة</span>
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                name="logo" 
                                                accept="image/*" 
                                                onChange={handleFileChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 text-center max-w-[150px] font-semibold leading-relaxed">يفضل صورة PNG أو JPG بحجم أقل من 2 ميجابايت</span>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="group/input flex flex-col">
                                            <label className="block text-sm font-bold text-dark-900 dark:text-slate-200 mb-2">اسم المدرسة <span className="text-accent-500">*</span></label>
                                            <div className="relative flex items-center">
                                                <Building size={18} className="absolute right-4 text-slate-400 dark:text-slate-500 group-focus-within/input:text-primary-500 dark:group-focus-within/input:text-primary-400 pointer-events-none transition-all duration-300" />
                                                <input type="text" name="school_name" required
                                                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-2xl pr-11 pl-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 transition-all font-semibold text-slate-750 dark:text-slate-100"
                                                    value={form.school_name} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="group/input flex flex-col">
                                            <label className="block text-sm font-bold text-dark-900 dark:text-slate-200 mb-2">العام الدراسي الحالي <span className="text-accent-500">*</span></label>
                                            <div className="relative flex items-center">
                                                <Calendar size={18} className="absolute right-4 text-slate-400 dark:text-slate-500 group-focus-within/input:text-primary-500 dark:group-focus-within/input:text-primary-400 pointer-events-none transition-all duration-300" />
                                                <input type="text" name="academic_year" required
                                                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-2xl pr-11 pl-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 transition-all font-semibold text-slate-750 dark:text-slate-100"
                                                    value={form.academic_year} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tab 2: Security & Session Settings */}
                            <div className={activeTab === 'security' ? 'block space-y-6' : 'hidden'}>
                                <div>
                                    <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-2 flex items-center gap-3">
                                        <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl text-primary-500 dark:text-primary-400 shrink-0">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <span>الأمان وجلسات الاتصال</span>
                                    </h3>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mr-13">تحديد معايير الجلسات وحماية حسابات المستخدمين من محاولات الاختراق.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                    <div className="group/input flex flex-col">
                                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-200 mb-2">مهلة انتهاء الجلسة (بالدقائق) <span className="text-accent-500">*</span></label>
                                        <div className="relative flex items-center">
                                            <Clock size={18} className="absolute right-4 text-slate-400 dark:text-slate-500 group-focus-within/input:text-primary-500 dark:group-focus-within/input:text-primary-400 pointer-events-none transition-all duration-300" />
                                            <input type="number" name="session_timeout" required min="10" max="1440"
                                                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-2xl pr-11 pl-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 transition-all font-semibold text-slate-750 dark:text-slate-100"
                                                value={form.session_timeout} onChange={handleChange} />
                                        </div>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5 mr-1">الحد الأدنى 10 دقائق والحد الأقصى يوم كامل (1440).</span>
                                    </div>
                                    <div className="group/input flex flex-col">
                                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-200 mb-2">أقصى محاولات تسجيل دخول <span className="text-accent-500">*</span></label>
                                        <div className="relative flex items-center">
                                            <Lock size={18} className="absolute right-4 text-slate-400 dark:text-slate-500 group-focus-within/input:text-primary-500 dark:group-focus-within/input:text-primary-400 pointer-events-none transition-all duration-300" />
                                            <input type="number" name="max_login_attempts" required min="3" max="20"
                                                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-2xl pr-11 pl-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 transition-all font-semibold text-slate-750 dark:text-slate-100"
                                                value={form.max_login_attempts} onChange={handleChange} />
                                        </div>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5 mr-1">عدد المحاولات الخاطئة المتاحة قبل قفل الحساب مؤقتاً.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer Submit Action */}
                        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-850 flex justify-end shrink-0">
                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl shadow-md shadow-primary-500/15 transition-all disabled:opacity-60 active:scale-95 hover:scale-[1.02] cursor-pointer">
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>جاري الحفظ...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        <span>حفظ الإعدادات</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
