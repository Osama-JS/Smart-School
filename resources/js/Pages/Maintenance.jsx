import React from 'react';
import { Head } from '@inertiajs/react';
import { Settings, Clock } from 'lucide-react';

export default function Maintenance({ message }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f141a] flex flex-col items-center justify-center p-4 relative overflow-hidden dir-rtl">
            <Head title="النظام تحت الصيانة" />
            
            {/* Background elements */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-[0.03]">
                <div className="w-[600px] h-[600px] bg-primary-500 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-lg bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 p-8 sm:p-12 rounded-[2rem] shadow-2xl shadow-primary-500/5 text-center animate-in fade-in zoom-in duration-700">
                <div className="mx-auto w-24 h-24 bg-primary-50 dark:bg-primary-500/10 rounded-3xl flex items-center justify-center mb-8 shadow-inner rotate-3 transition-transform hover:rotate-6">
                    <Settings className="w-12 h-12 text-primary-500 animate-[spin_4s_linear_infinite]" />
                </div>
                
                <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">النظام تحت الصيانة</h1>
                
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-base sm:text-lg leading-relaxed mb-8">
                    {message || 'نقوم حالياً ببعض التحديثات الهامة على النظام لتقديم تجربة أفضل وأكثر استقراراً. سنعود للعمل قريباً جداً.'}
                </p>

                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm">
                    <Clock size={16} className="text-primary-500 animate-pulse" />
                    <span>شكراً لصبركم وتفهمكم</span>
                </div>
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-600 tracking-wider uppercase">Smart School System</span>
            </div>
        </div>
    );
}
