import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    KeyRound, X, RefreshCw, Eye, EyeOff, ShieldCheck,
    CheckCircle2, AlertTriangle, LogOut, Printer, Sparkles, Lock, GraduationCap
} from 'lucide-react';

function generateClientSimplePassword(style = 'digits') {
    if (style === 'alnum') {
        const letters = 'abcdefghjkmnpqrstuvwxyz';
        const p1 = letters[Math.floor(Math.random() * letters.length)];
        const p2 = letters[Math.floor(Math.random() * letters.length)];
        const num = Math.floor(1000 + Math.random() * 9000);
        return `${p1}${p2}${num}`;
    }
    return String(Math.floor(100000 + Math.random() * 900000));
}

export default function ResetPasswordModal({ isOpen, student, onClose }) {
    const [mode, setMode] = useState('auto'); // 'auto' | 'manual'
    const [style, setStyle] = useState('digits'); // 'digits' | 'alnum'
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(true);
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [revokeTokens, setRevokeTokens] = useState(false);
    const [openPrintModal, setOpenPrintModal] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setMode('auto');
            setStyle('digits');
            setPassword('');
            setPasswordConfirmation('');
            setShowPassword(true);
            setMustChangePassword(false);
            setRevokeTokens(false);
            setOpenPrintModal(true);
            setProcessing(false);
            setErrors({});
        }
    }, [isOpen, student?.id]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !processing) {
                onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, processing, onClose]);

    if (!isOpen || !student) return null;

    const handleQuickFill = (fillStyle) => {
        const simple = generateClientSimplePassword(fillStyle);
        setPassword(simple);
        setPasswordConfirmation(simple);
        setShowPassword(true);
        setErrors({});
    };

    const isManualValid = password.length >= 4 && password.length <= 50 && password === passwordConfirmation;
    const canSubmit = !processing && (mode === 'auto' || isManualValid);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        const payload = {
            mode,
            style,
            must_change_password: mustChangePassword,
            revoke_tokens: revokeTokens,
            open_print_modal: openPrintModal,
        };

        if (mode === 'manual') {
            payload.password = password;
            payload.password_confirmation = passwordConfirmation;
        }

        router.post(route('academic.students.reset-password', student.id), payload, {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);
                setErrors({});
            },
            onSuccess: () => {
                onClose();
            },
            onError: (errs) => {
                setErrors(errs || {});
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const initialChar = (student.name || 'ط').charAt(0);
    const academicMeta = [
        student.section_name && student.section_name !== 'غير محدد' ? student.section_name : null,
        student.grade_name && student.grade_name !== 'غير محدد' ? student.grade_name : null,
        student.division_name && student.division_name !== 'غير محدد' ? student.division_name : null,
    ].filter(Boolean).join(' • ');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-fade-in"
                onClick={() => !processing && onClose()}
            />

            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl z-10 overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-500/20">
                            <KeyRound size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">إعادة تعيين كلمة مرور الطالب</h3>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                توليد كلمة مرور سهلة أو تخصيصها لحساب الطالب
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={processing}
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-40"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
                    {/* Student Summary Card */}
                    <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/40 text-primary-700 dark:text-primary-300 font-black text-lg flex items-center justify-center border border-primary-200 dark:border-primary-700 shrink-0">
                                {initialChar}
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-slate-800 dark:text-white text-sm truncate">
                                    {student.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5" dir="ltr">
                                    @{student.username}
                                </div>
                                {academicMeta && (
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate flex items-center gap-1">
                                        <GraduationCap size={12} className="shrink-0 text-primary-500" />
                                        <span>{academicMeta}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                                    student.is_active
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20'
                                }`}
                            >
                                {student.is_active ? 'حساب نشط' : 'حساب معطل'}
                            </span>
                            {student.must_change_password && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
                                    مطلوب تغييرها عند الدخول
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Mode Switcher */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                            طريقة تعيين كلمة المرور
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <button
                                type="button"
                                onClick={() => { setMode('auto'); setErrors({}); }}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    mode === 'auto'
                                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            >
                                <Sparkles size={15} />
                                <span>توليد تلقائي سهل</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMode('manual'); setErrors({}); }}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    mode === 'manual'
                                        ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            >
                                <Lock size={15} />
                                <span>كلمة مرور مخصصة</span>
                            </button>
                        </div>
                    </div>

                    {/* Mode 1: Auto Easy */}
                    {mode === 'auto' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setStyle('digits')}
                                className={`text-right p-4 rounded-2xl border-2 transition-all ${
                                    style === 'digits'
                                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-black text-slate-800 dark:text-white">أرقام سهلة (6 أرقام)</span>
                                    <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-200 dark:border-emerald-700" dir="ltr">
                                        482915
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    سهلة الكتابة على الجوال والكمبيوتر بدون تبديل لغة لوحة المفاتيح.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStyle('alnum')}
                                className={`text-right p-4 rounded-2xl border-2 transition-all ${
                                    style === 'alnum'
                                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-black text-slate-800 dark:text-white">حروف وأرقام بسيطة</span>
                                    <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-200 dark:border-emerald-700" dir="ltr">
                                        km4829
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    حرفان إنجليزيان واضحان + 4 أرقام بدون رموز معقدة أو حروف متشابهة.
                                </p>
                            </button>
                        </div>
                    ) : (
                        /* Mode 2: Manual Simple */
                        <div className="space-y-3.5 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    تعبئة سريعة سهلة:
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleQuickFill('digits')}
                                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                    >
                                        توليد 6 أرقام سهلة
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickFill('alnum')}
                                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                                    >
                                        توليد حروف + أرقام
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                    كلمة المرور الجديدة (4 خانات فأكثر)
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        dir="ltr"
                                        minLength={4}
                                        maxLength={50}
                                        required
                                        placeholder="مثال: 123456"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 pl-11 text-sm font-mono font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                        title={showPassword ? 'إخفاء' : 'إظهار'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-xs font-bold text-rose-600 dark:text-rose-400">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                    تأكيد كلمة المرور
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    dir="ltr"
                                    minLength={4}
                                    maxLength={50}
                                    required
                                    placeholder="أعد كتابة كلمة المرور"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-mono font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                />
                                {errors.password_confirmation && (
                                    <p className="mt-1 text-xs font-bold text-rose-600 dark:text-rose-400">{errors.password_confirmation}</p>
                                )}
                            </div>

                            {/* Friendly validation hint */}
                            {password.length > 0 && (
                                <div className="pt-1">
                                    {password.length < 4 ? (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                                            <AlertTriangle size={14} />
                                            <span>الحد الأدنى 4 خانات على الأقل</span>
                                        </div>
                                    ) : password !== passwordConfirmation ? (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                                            <AlertTriangle size={14} />
                                            <span>تأكيد كلمة المرور غير متطابق بعد</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 size={14} />
                                            <span>كلمة المرور جاهزة ومتطابقة — سهلة وصالحة للتسليم</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Security & Print Options */}
                    <div className="space-y-2.5 pt-1">
                        <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={mustChangePassword}
                                onChange={(e) => setMustChangePassword(e.target.checked)}
                                className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div>
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-amber-500" />
                                    <span>إلزام الطالب بتغيير كلمة المرور عند أول تسجيل دخول</span>
                                </div>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    يمكنك إلغاء التحديد إذا أردت أن يدخل الطالب مباشرة دون طلب تغيير فوري.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={revokeTokens}
                                onChange={(e) => setRevokeTokens(e.target.checked)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <LogOut size={14} className="text-rose-500" />
                                <span>تسجيل الخروج من تطبيق الهاتف والأجهزة الأخرى</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={openPrintModal}
                                onChange={(e) => setOpenPrintModal(e.target.checked)}
                                className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                <Printer size={14} className="text-emerald-600 dark:text-emerald-400" />
                                <span>فتح مودال طباعة وتسليم بيانات الدخول فور الحفظ</span>
                            </div>
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-2xl transition-colors disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 rounded-2xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={16} className={processing ? 'animate-spin' : ''} />
                            <span>{processing ? 'جاري التعيين...' : 'حفظ وإعادة التعيين'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
