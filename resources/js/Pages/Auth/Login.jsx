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
                <div className="mb-5 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-2xl animate-slide-up">
                    {status}
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-xl font-extrabold text-slate-900">تسجيل الدخول</h3>
                <p className="text-slate-500 text-xs mt-1">الرجاء إدخال اسم المستخدم وكلمة المرور للمتابعة.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                
                {/* Username Input with icon and separator line */}
                <div>
                    <label htmlFor="username" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">اسم المستخدم</label>
                    <div className="relative flex items-center">
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={data.username}
                            className={`peer w-full bg-white dark:bg-slate-900/40 border rounded-2xl pr-13 pl-4 py-3.5 text-sm outline-none transition-all focus:ring-4 ${errors.username ? 'border-accent-300 focus:ring-accent-500/10 focus:border-accent-400' : 'border-slate-200 dark:border-slate-800 focus:ring-primary-500/10 focus:border-primary-500'} text-slate-800 dark:text-slate-100 font-semibold`}
                            autoComplete="username"
                            autoFocus
                            placeholder="أدخل اسم المستخدم"
                            onChange={(e) => setData('username', e.target.value)}
                            dir="ltr"
                            style={{ textAlign: 'right' }}
                        />
                        <div className="absolute right-4 flex items-center gap-2 pointer-events-none text-slate-400 peer-focus:text-primary-500 border-l border-slate-200/80 dark:border-slate-800 peer-focus:border-primary-500/30 pl-2.5 transition-colors duration-200">
                            <User size={18} />
                        </div>
                    </div>
                    <InputError message={errors.username} className="mt-2" />
                </div>

                {/* Password Input with icon, separator line and eye toggle */}
                <div>
                    <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">كلمة المرور</label>
                    <div className="relative flex items-center">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className={`peer w-full bg-white dark:bg-slate-900/40 border rounded-2xl pr-13 pl-12 py-3.5 text-sm outline-none transition-all focus:ring-4 ${errors.password ? 'border-accent-300 focus:ring-accent-500/10 focus:border-accent-400' : 'border-slate-200 dark:border-slate-800 focus:ring-primary-500/10 focus:border-primary-500'} text-slate-800 dark:text-slate-100 font-semibold`}
                            autoComplete="current-password"
                            placeholder="أدخل كلمة المرور"
                            onChange={(e) => setData('password', e.target.value)}
                            dir="ltr"
                            style={{ textAlign: 'right' }}
                        />
                        <div className="absolute right-4 flex items-center gap-2 pointer-events-none text-slate-400 peer-focus:text-primary-500 border-l border-slate-200/80 dark:border-slate-800 peer-focus:border-primary-500/30 pl-2.5 transition-colors duration-200">
                            <Lock size={18} />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:text-slate-600 transition-colors p-1"
                            tabIndex={-1}
                            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* Remember & Forgot Password links */}
                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer group py-1">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="w-[18px] h-[18px] rounded border-slate-300 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 transition-colors cursor-pointer"
                        />
                        <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors select-none font-bold">
                            تذكرني على هذا الجهاز
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-xs text-primary-600 hover:text-primary-700 font-bold transition-colors py-1"
                        >
                            نسيت كلمة المرور؟
                        </Link>
                    )}
                </div>

                {/* Submit button with spinner inside */}
                <button
                    type="submit"
                    disabled={processing}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/15 hover:shadow-primary-500/25 active:scale-[0.98] transition-all w-full text-sm font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
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
