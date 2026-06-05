import { Link, usePage } from '@inertiajs/react';
import { Sparkles, GraduationCap, CheckCircle, Trophy, ShieldCheck, Heart } from 'lucide-react';

export default function GuestLayout({ children }) {
    const { logo_url } = usePage().props;
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:grid lg:grid-cols-12 font-sans" dir="rtl">
            {/* Branding Panel (Right Column on Arabic desktop screens) */}
            <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#5b8a2d] via-primary-900 to-dark-900 flex-col justify-between p-12 text-white relative overflow-hidden border-l border-white/5">
                {/* Ambient lights */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col gap-8">
                    {/* Brand Logo & Name */}
                    <Link href="/" className="inline-flex items-center gap-4 group">
                        <img 
                            src={logo_url || '/images/logo.png'} 
                            alt="مدارس القيم" 
                            className="h-16 w-16 rounded-2xl object-contain bg-white/95 p-1.5 shadow-xl transition-all duration-300 group-hover:scale-105"
                        />
                        <div>
                            <h2 className="font-extrabold text-white text-2xl tracking-tight">مدارس القيم</h2>
                            <span className="text-xs text-primary-300 font-medium">نظام القيم ERP المتكامل</span>
                        </div>
                    </Link>

                    {/* Intro / Motto */}
                    <div className="mt-8 space-y-4">
                        <h1 className="text-3xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-primary-200">
                            منظومة تعليمية متكاملة بلمسة ذكية
                        </h1>
                        <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                            نسعى في مدارس القيم إلى تقديم بيئة تعليمية محفزة ومبتكرة تدمج التطور التقني بالقيم الأخلاقية، لتمكين جيل واعد يقود المستقبل.
                        </p>
                    </div>

                    {/* Features list */}
                    <div className="mt-10 space-y-6">
                        <div className="flex gap-4 items-start group">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-primary-400 group-hover:bg-primary-500/10 group-hover:border-primary-500/30 transition-all">
                                <GraduationCap size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-100 text-base mb-1">التميز الأكاديمي والتربوي</h3>
                                <p className="text-slate-400 text-xs leading-normal">مناهج متطورة وأساليب تعليمية تفاعلية تعزز مهارات التفكير والابتكار.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start group">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-primary-400 group-hover:bg-primary-500/10 group-hover:border-primary-500/30 transition-all">
                                <ShieldCheck size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-100 text-base mb-1">بيئة آمنة وحوكمة ذكية</h3>
                                <p className="text-slate-400 text-xs leading-normal">إدارة رقمية متكاملة لضمان الخصوصية، الدقة، والشفافية في متابعة الطلاب.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start group">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-primary-400 group-hover:bg-primary-500/10 group-hover:border-primary-500/30 transition-all">
                                <Trophy size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-100 text-base mb-1">تقارير تفاعلية ومؤشرات أداء</h3>
                                <p className="text-slate-400 text-xs leading-normal">متابعة فورية ومستمرة لتقدم الطلاب مع لوحات إحصائية تفصيلية لأولياء الأمور والشركاء.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer on left panel */}
                <div className="relative z-10 pt-6 border-t border-white/5 text-slate-500 text-xs flex items-center justify-between">
                    <span>مدارس القيم — التميز رائدنا والقيم أساسنا</span>
                    <Heart size={14} className="text-accent-500 fill-accent-500 animate-pulse" />
                </div>
            </div>

            {/* Form Panel (Left/Main Column) */}
            <div className="col-span-12 lg:col-span-7 flex flex-col justify-center min-h-screen relative p-4 sm:p-8 md:p-12 lg:p-16 bg-slate-50 dark:bg-[#090d11]">
                {/* Decorative background blurs for mobile/tablet */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
                    <div className="absolute top-10 right-10 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 left-10 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl" />
                </div>

                <div className="w-full max-w-md mx-auto relative z-10">
                    {/* Mobile Logo & header */}
                    <div className="text-center lg:hidden mb-8">
                        <Link href="/" className="inline-flex flex-col items-center gap-3">
                            <img 
                                src={logo_url || '/images/logo.png'} 
                                alt="مدارس القيم" 
                                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-contain bg-white p-2 shadow-lg"
                            />
                            <div>
                                <h1 className="font-black text-slate-900 dark:text-white text-xl sm:text-2xl">مدارس القيم</h1>
                                <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                                    <Sparkles size={11} className="text-primary-500" />
                                    نظام القيم ERP المتكامل
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Logo/Greeting for desktop (hidden on mobile) */}
                    <div className="hidden lg:block mb-8">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">مرحباً بك مجدداً!</h2>
                        <p className="text-slate-500 text-sm mt-2">سجل دخولك للوصول إلى لوحة التحكم الخاصة بك والمتابعة المباشرة.</p>
                    </div>

                    {/* Children card wrapped inside clean white card with subtle shadows */}
                    <div className="bg-white dark:bg-[#121820]/95 border border-slate-100 dark:border-primary-500/10 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-100/50 dark:shadow-2xl dark:shadow-black/40 animate-slide-up">
                        {children}
                    </div>

                    {/* Footer for Form Panel */}
                    <p className="text-center text-slate-400 text-xs mt-6">
                        © {new Date().getFullYear()} مدارس القيم. جميع الحقوق محفوظة.
                    </p>
                </div>
            </div>
        </div>
    );
}
