import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { User, Save, CheckCircle2, Mail, BadgeCheck } from 'lucide-react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl text-primary-600 dark:text-primary-400">
                    <User size={24} strokeWidth={2} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white">
                        المعلومات الشخصية
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        قم بتحديث معلومات حسابك الشخصي والبريد الإلكتروني.
                    </p>
                </div>
            </header>

            <form onSubmit={submit} className="space-y-6">
                <div className="relative group">
                    <InputLabel htmlFor="name" value="الاسم بالكامل" className="mb-2 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <User size={16} className="text-primary-500" />
                        الاسم بالكامل
                    </InputLabel>
                    <div className="relative flex items-center">
                        <div className="absolute right-3 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                            <User size={20} strokeWidth={2} />
                        </div>
                        <TextInput
                            id="name"
                            className="block w-full bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 pr-11 py-2.5"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            isFocused
                            autoComplete="name"
                            placeholder="أدخل اسمك الكامل"
                        />
                    </div>
                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div className="relative group">
                    <InputLabel htmlFor="email" value="البريد الإلكتروني" className="mb-2 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Mail size={16} className="text-primary-500" />
                        البريد الإلكتروني
                    </InputLabel>
                    <div className="relative flex items-center">
                        <div className="absolute right-3 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                            <Mail size={20} strokeWidth={2} />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            className="block w-full bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 pr-11 py-2.5"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                            placeholder="example@qschool.com"
                        />
                    </div>
                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
                        <p className="text-sm text-amber-800 dark:text-amber-400 font-semibold">
                            البريد الإلكتروني الخاص بك غير مفعل.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="mx-2 underline decoration-amber-500/50 hover:decoration-amber-500 text-amber-900 dark:text-amber-300 transition-all focus:outline-none"
                            >
                                انقر هنا لإعادة إرسال رابط التفعيل.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                تم إرسال رابط التفعيل إلى بريدك الإلكتروني بنجاح.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-4">
                    <button 
                        type="submit" 
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Save size={18} />
                        حفظ التغييرات
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
                            تم الحفظ بنجاح
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
