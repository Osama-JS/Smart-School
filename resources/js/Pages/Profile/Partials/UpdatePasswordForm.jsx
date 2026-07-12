import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';
import { ShieldCheck, CheckCircle2, Lock, KeyRound } from 'lucide-react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={24} strokeWidth={2} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white">
                        تحديث كلمة المرور
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        تأكد من استخدام كلمة مرور قوية للحفاظ على أمان حسابك.
                    </p>
                </div>
            </header>

            <form onSubmit={updatePassword} className="space-y-6">
                <div className="relative group">
                    <InputLabel
                        htmlFor="current_password"
                        value="كلمة المرور الحالية"
                        className="mb-2 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                        <Lock size={16} className="text-emerald-500" />
                        كلمة المرور الحالية
                    </InputLabel>

                    <div className="relative flex items-center">
                        <div className="absolute right-3 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                            <Lock size={20} strokeWidth={2} />
                        </div>
                        <TextInput
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) =>
                                setData('current_password', e.target.value)
                            }
                            type="password"
                            className="block w-full bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 pr-11 py-2.5"
                            autoComplete="current-password"
                            placeholder="أدخل كلمة المرور الحالية"
                        />
                    </div>

                    <InputError
                        message={errors.current_password}
                        className="mt-2"
                    />
                </div>

                <div className="relative group">
                    <InputLabel 
                        htmlFor="password" 
                        value="كلمة المرور الجديدة" 
                        className="mb-2 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2" 
                    >
                        <KeyRound size={16} className="text-emerald-500" />
                        كلمة المرور الجديدة
                    </InputLabel>

                    <div className="relative flex items-center">
                        <div className="absolute right-3 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                            <KeyRound size={20} strokeWidth={2} />
                        </div>
                        <TextInput
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type="password"
                            className="block w-full bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 pr-11 py-2.5"
                            autoComplete="new-password"
                            placeholder="أدخل كلمة المرور الجديدة"
                        />
                    </div>

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="relative group">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="تأكيد كلمة المرور"
                        className="mb-2 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                        <ShieldCheck size={16} className="text-emerald-500" />
                        تأكيد كلمة المرور
                    </InputLabel>

                    <div className="relative flex items-center">
                        <div className="absolute right-3 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                            <ShieldCheck size={20} strokeWidth={2} />
                        </div>
                        <TextInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            type="password"
                            className="block w-full bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 pr-11 py-2.5"
                            autoComplete="new-password"
                            placeholder="أعد كتابة كلمة المرور الجديدة"
                        />
                    </div>

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <button 
                        type="submit" 
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Lock size={18} />
                        تحديث كلمة المرور
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out duration-300"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in-out duration-300"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 size={16} />
                            تم التحديث بنجاح
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
