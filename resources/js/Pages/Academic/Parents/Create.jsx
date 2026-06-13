import React, { useState } from 'react';
import { Head, router, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowRight, Save, User, Lock, Phone, Mail, MapPin, Eye, EyeOff, ShieldAlert } from 'lucide-react';

export default function ParentsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        national_id: '',
        address: '',
        is_active: true,
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('academic.parents.store'));
    };

    return (
        <AdminLayout activeMenu="أولياء الأمور">
            <Head title="إضافة ولي أمر | النظام الأكاديمي" />

            <div className="max-w-4xl mx-auto animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link href={route('academic.parents')} className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-all hover:shadow-sm">
                            <ArrowRight size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">إضافة ولي أمر جديد</h1>
                            <p className="text-sm text-slate-500 mt-1">إضافة حساب شخصي لولي أمر لتمكينه من متابعة أبنائه</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex items-center gap-3">
                            <User className="text-primary-500" size={20} />
                            <h2 className="text-lg font-bold text-dark-900 dark:text-white">البيانات الأساسية ومعلومات الدخول</h2>
                        </div>
                        
                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="col-span-full">
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الاسم الرباعي <span className="text-rose-500">*</span></label>
                                <input type="text"
                                    className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.name ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'} rounded-2xl px-4 py-3 text-sm outline-none transition-all`}
                                    value={data.name} onChange={e => setData('name', e.target.value)} placeholder="مثال: أحمد محمد عبدالله القحطاني" />
                                {errors.name && <p className="text-xs text-rose-500 mt-1.5">{errors.name}</p>}
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم المستخدم <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text"
                                        className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.username ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'} rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all`}
                                        value={data.username} onChange={e => setData('username', e.target.value)} dir="ltr" placeholder="ahmed.parent" />
                                </div>
                                {errors.username && <p className="text-xs text-rose-500 mt-1.5">{errors.username}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">كلمة المرور <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type={showPassword ? "text" : "password"}
                                        className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.password ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'} rounded-2xl pr-11 pl-12 py-3 text-sm outline-none transition-all`}
                                        value={data.password} onChange={e => setData('password', e.target.value)} dir="ltr" placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-rose-500 mt-1.5">{errors.password}</p>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم الجوال</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text"
                                        className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.phone ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'} rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all`}
                                        value={data.phone} onChange={e => setData('phone', e.target.value)} dir="ltr" placeholder="05xxxxxxxx" />
                                </div>
                                {errors.phone && <p className="text-xs text-rose-500 mt-1.5">{errors.phone}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">البريد الإلكتروني (اختياري)</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="email"
                                        className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.email ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'} rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all`}
                                        value={data.email} onChange={e => setData('email', e.target.value)} dir="ltr" placeholder="parent@example.com" />
                                </div>
                                {errors.email && <p className="text-xs text-rose-500 mt-1.5">{errors.email}</p>}
                            </div>

                            {/* National ID */}
                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم الهوية / الإقامة (اختياري)</label>
                                <input type="text"
                                    className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.national_id ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'} rounded-2xl px-4 py-3 text-sm outline-none transition-all`}
                                    value={data.national_id} onChange={e => setData('national_id', e.target.value)} dir="ltr" placeholder="10xxxxxxxx" />
                                {errors.national_id && <p className="text-xs text-rose-500 mt-1.5">{errors.national_id}</p>}
                            </div>

                            {/* Address */}
                            <div className="col-span-full">
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">عنوان السكن (اختياري)</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute right-4 top-4 text-slate-400" />
                                    <textarea
                                        className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.address ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'} rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all resize-none h-24`}
                                        value={data.address} onChange={e => setData('address', e.target.value)} placeholder="المدينة، الحي، الشارع..." />
                                </div>
                                {errors.address && <p className="text-xs text-rose-500 mt-1.5">{errors.address}</p>}
                            </div>

                            {/* Is Active Status */}
                            <div className="col-span-full border border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${data.is_active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                        <ShieldAlert size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-800 dark:text-white">حالة الحساب</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">تفعيل أو تعطيل قدرة ولي الأمر على تسجيل الدخول</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Link href={route('academic.parents')} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                            إلغاء
                        </Link>
                        <button type="submit" disabled={processing} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><Save size={18} /> حفظ ولي الأمر</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
