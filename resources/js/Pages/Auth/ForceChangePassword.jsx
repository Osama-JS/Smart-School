import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { ShieldCheck, Lock, Eye, EyeOff, KeyRound, LogOut } from 'lucide-react';
import InputError from '@/Components/InputError';

export default function ForceChangePassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.force_change.update'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center p-4 text-right" dir="rtl">
            <Head title="تعيين كلمة مرور جديدة" />

            <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
                {/* Header Icon */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <ShieldCheck className="w-9 h-9" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">تعيين كلمة مرور جديدة</h1>
                    <p className="text-sm text-slate-500 mt-2">
                        مرحباً بك! كإجراء أمني إلزامي عند أول تسجيل دخول، يرجى تعيين كلمة مرور شخصية وخاصة بك لمتابعة استخدام النظام.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="space-y-5">
                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            كلمة المرور الجديدة
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                autoFocus
                                required
                                placeholder="8 خانات على الأقل..."
                                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 transition"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <KeyRound className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            تأكيد كلمة المرور
                        </label>
                        <div className="relative">
                            <input
                                id="password_confirmation"
                                type={showConfirm ? 'text' : 'password'}
                                name="password_confirmation"
                                value={data.password_confirmation}
                                required
                                placeholder="أعد إدخال كلمة المرور..."
                                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 transition"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                            />
                            <Lock className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                            >
                                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <InputError message={errors.password_confirmation} className="mt-1" />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" />
                                <span>حفظ وتفعيل الحساب</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Logout Option */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1.5 transition"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>تسجيل الخروج من هذا الحساب</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
