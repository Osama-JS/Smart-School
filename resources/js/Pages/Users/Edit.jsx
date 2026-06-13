import React, { useState } from 'react';
import { Head, router, Link, usePage, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import { ArrowRight, Save, User, Lock, Shield, Store, ChevronDown, Eye, EyeOff, UserCheck } from 'lucide-react';

export default function UsersEdit({ user, roles, branches = [], isAdmin = false }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name || '',
        username: user.username || '',
        password: '',
        role_id: user.role_id || '',
        branch_id: user.branch_id || '',
        is_active: user.is_active === 1 || user.is_active === true,
    });
    
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('users.update', user.id));
    };

    return (
        <AdminLayout activeMenu="المستخدمون">
            <Head title={`تعديل مستخدم: ${user.name} | النظام الإداري`} />

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
                        <div className="flex items-center gap-2 mb-2">
                            <Link href={route('users.index')} className="text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/60">
                                <ArrowRight size={20} />
                            </Link>
                            <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">تعديل حساب المستخدم</h1>
                        </div>
                        <p className="text-primary-700/80 dark:text-primary-300/80 text-sm font-semibold pr-10">{user.name}</p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md shadow-slate-100/50 overflow-hidden max-w-4xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-bold text-dark-900 mb-2">الاسم الكامل <span className="text-accent-500">*</span></label>
                                <div className="relative">
                                    <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input type="text" required
                                        placeholder="الاسم الكامل باللغة العربية"
                                        className={`w-full border rounded-2xl pr-11 pl-4 py-3.5 text-sm outline-none transition-all focus:ring-4 ${errors.name ? 'border-accent-300 focus:ring-accent-500/10 focus:border-accent-400' : 'border-slate-200 focus:ring-primary-500/10 focus:border-primary-400'}`}
                                        value={data.name} onChange={e => setData('name', e.target.value)} />
                                </div>
                                {errors.name && <p className="text-xs text-accent-500 mt-1">{errors.name}</p>}
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-bold text-dark-900 mb-2">اسم المستخدم <span className="text-accent-500">*</span></label>
                                <div className="relative">
                                    <UserCheck size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input type="text" required dir="ltr"
                                        placeholder="username"
                                        className={`w-full border rounded-2xl pr-11 pl-4 py-3.5 text-sm outline-none transition-all focus:ring-4 ${errors.username ? 'border-accent-300 focus:ring-accent-500/10 focus:border-accent-400' : 'border-slate-200 focus:ring-primary-500/10 focus:border-primary-400'}`}
                                        value={data.username} onChange={e => setData('username', e.target.value)} />
                                </div>
                                {errors.username && <p className="text-xs text-accent-500 mt-1">{errors.username}</p>}
                            </div>

                            {/* Password (Optional) with Eye Show/Hide */}
                            <div>
                                <label className="block text-sm font-bold text-dark-900 mb-2">كلمة المرور (اختياري)</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input type={showPassword ? "text" : "password"} minLength="8" dir="ltr" placeholder="اتركه فارغاً للإبقاء على الحالية"
                                        className={`w-full border rounded-2xl pr-11 pl-12 py-3.5 text-sm outline-none transition-all focus:ring-4 ${errors.password ? 'border-accent-300 focus:ring-accent-500/10 focus:border-accent-400' : 'border-slate-200 focus:ring-primary-500/10 focus:border-primary-400'}`}
                                        value={data.password} onChange={e => setData('password', e.target.value)} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-xl">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-accent-500 mt-1">{errors.password}</p>}
                            </div>

                            {/* Role Selection with separator and custom icon */}
                            <div>
                                <label className="block text-sm font-bold text-dark-900 mb-2">الدور والصلاحية <span className="text-accent-500">*</span></label>
                                <SelectInput
                                    value={data.role_id}
                                    onChange={val => setData('role_id', val)}
                                    options={[
                                        ...(roles || []).map(r => ({ value: r.id, label: r.name }))
                                    ]}
                                    required
                                />
                                {errors.role_id && <p className="text-xs text-accent-500 mt-1">{errors.role_id}</p>}
                            </div>

                            {/* Branch Selection - Only for Admins */}
                            {isAdmin && (
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 mb-2">الفرع <span className="text-accent-500">*</span></label>
                                    <SelectInput
                                        value={data.branch_id}
                                        onChange={val => setData('branch_id', val)}
                                        options={[
                                            { value: '', label: 'اختر الفرع' },
                                            ...(branches || []).map(b => ({ value: b.id, label: b.name }))
                                        ]}
                                        required
                                    />
                                    {errors.branch_id && <p className="text-xs text-accent-500 mt-1">{errors.branch_id}</p>}
                                </div>
                            )}

                            {/* Custom Toggle Switch for Active Status */}
                            <div className="flex items-center pt-8">
                                <label className="flex items-center gap-3.5 cursor-pointer select-none">
                                    <div className="relative">
                                        <input type="checkbox"
                                            className="sr-only"
                                            checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                                        <div className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out ${data.is_active ? 'bg-primary-500' : 'bg-slate-200'}`} />
                                        <div className={`absolute top-1 right-1 bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-200 ease-in-out ${data.is_active ? '-translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">حساب نشط</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions footer */}
                    <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <Link href={route('users.index')} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
                            إلغاء
                        </Link>
                        <button type="submit" disabled={processing} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary-500 rounded-2xl hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/10 transition-all disabled:opacity-60">
                            <Save size={16} /> {processing ? 'جاري الحفظ...' : 'تحديث البيانات'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
