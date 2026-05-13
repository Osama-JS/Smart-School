import { Link } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';

export default function GuestLayout({ children }) {
    return (
        <div className="login-bg min-h-screen flex items-center justify-center p-4 font-sans" dir="rtl">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-72 h-72 bg-[#6b9b37]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#cc2b2b]/4 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex flex-col items-center gap-4 group">
                        <img 
                            src="/alqiam_school/public/images/logo.png" 
                            alt="مدارس القيم" 
                            className="h-24 w-24 rounded-2xl object-contain bg-white/95 p-2 shadow-2xl shadow-black/20 group-hover:shadow-black/30 transition-all duration-300 group-hover:scale-105"
                        />
                        <div className="leading-tight">
                            <h1 className="font-bold text-white text-3xl tracking-tight">مدارس القيم</h1>
                            <div className="flex items-center justify-center gap-1.5 mt-1.5">
                                <Sparkles size={12} className="text-[#6b9b37]" />
                                <p className="text-sm text-slate-400 font-medium">نظام القيم ERP المتكامل</p>
                                <Sparkles size={12} className="text-[#6b9b37]" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Login Card */}
                <div className="login-card px-8 py-10 animate-slide-up">
                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-xs mt-6">
                    © {new Date().getFullYear()} مدارس القيم — جميع الحقوق محفوظة
                </p>
            </div>
        </div>
    );
}
