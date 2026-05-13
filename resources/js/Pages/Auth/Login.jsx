import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="تسجيل الدخول" />

            {status && (
                <div className="mb-5 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-lg animate-slide-up">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                {/* Username */}
                <div>
                    <label htmlFor="username" className="erp-label">اسم المستخدم</label>
                    <div className="relative">
                        <User size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={data.username}
                            className={`erp-input pr-11 ${errors.username ? 'error' : ''}`}
                            autoComplete="username"
                            autoFocus
                            placeholder="أدخل اسم المستخدم"
                            onChange={(e) => setData('username', e.target.value)}
                            dir="ltr"
                            style={{ textAlign: 'right' }}
                        />
                    </div>
                    <InputError message={errors.username} className="mt-2" />
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="erp-label">كلمة المرور</label>
                    <div className="relative">
                        <Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className={`erp-input pr-11 pl-11 ${errors.password ? 'error' : ''}`}
                            autoComplete="current-password"
                            placeholder="أدخل كلمة المرور"
                            onChange={(e) => setData('password', e.target.value)}
                            dir="ltr"
                            style={{ textAlign: 'right' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-[#6b9b37] focus:ring-[#6b9b37] focus:ring-offset-0 transition-colors"
                        />
                        <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors select-none">
                            تذكرني
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm text-[#6b9b37] hover:text-[#558a2a] font-medium transition-colors"
                        >
                            نسيت كلمة المرور؟
                        </Link>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={processing}
                    className="erp-btn erp-btn-primary w-full !py-3 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <>
                            <LogIn size={18} />
                            <span>تسجيل الدخول</span>
                        </>
                    )}
                </button>
            </form>
        </GuestLayout>
    );
}
