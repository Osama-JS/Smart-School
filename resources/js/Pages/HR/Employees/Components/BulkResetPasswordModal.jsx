import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    KeyRound, X, RefreshCw, Eye, EyeOff, ShieldCheck,
    LogOut, Printer, Sparkles, Lock, Loader2
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

export default function BulkResetPasswordModal({
    isOpen,
    selectedIds = [],
    onClose,
    onSuccess,
}) {
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
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !processing) onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, processing, onClose]);

    if (!isOpen || selectedIds.length === 0) return null;

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
            employee_ids: selectedIds,
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

        router.post(route('hr.employees.bulk-reset-password'), payload, {
            preserveScroll: true,
            onStart: () => {
                setProcessing(true);
                setErrors({});
            },
            onSuccess: () => {
                onSuccess?.();
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-fade-in"
                onClick={() => !processing && onClose()}
            />

            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl z-10 overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-scale-in">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <KeyRound size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white">
                                إعادة تعيين كلمة المرور جماعياً
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                سيتم التحديث لـ {selectedIds.length} موظف محدد
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={processing}
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    {/* Mode Tabs */}
                    <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setMode('auto')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                                mode === 'auto'
                                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-slate-500'
                            }`}
                        >
                            <Sparkles size={15} />
                            توليد تلقائي لكل موظف
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('manual')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                                mode === 'manual'
                                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-slate-500'
                            }`}
                        >
                            <Lock size={15} />
                            كلمة مرور موحدة للجميع
                        </button>
                    </div>

                    {mode === 'auto' ? (
                        <div className="space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl p-4">
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                سيقوم النظام بتوليد كلمة مرور مستقلة وسهلة القراءة لكل موظف على حدة.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStyle('digits')}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                        style === 'digits'
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    6 أرقام فقط (مثال: 482915)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStyle('alnum')}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                        style === 'alnum'
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    حرفان + 4 أرقام (مثال: ab4829)
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                                    كلمة المرور الموحدة
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleQuickFill('digits')}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"
                                >
                                    <RefreshCw size={12} /> اقتراح كلمة سهلة
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="4 خانات على الأقل..."
                                    className="w-full rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-bold pl-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                placeholder="تأكيد كلمة المرور..."
                                className="w-full rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-bold"
                            />
                            {errors.password && (
                                <p className="text-xs font-bold text-rose-500">{errors.password}</p>
                            )}
                        </div>
                    )}

                    {/* Options */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={mustChangePassword}
                                onChange={(e) => setMustChangePassword(e.target.checked)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <ShieldCheck size={15} className="text-amber-500" />
                            إلزام الموظفين بتغيير كلمة المرور عند أول تسجيل دخول
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={revokeTokens}
                                onChange={(e) => setRevokeTokens(e.target.checked)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <LogOut size={15} className="text-rose-500" />
                            إنهاء جميع جلسات الأجهزة النشطة حالياً
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={openPrintModal}
                                onChange={(e) => setOpenPrintModal(e.target.checked)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <Printer size={15} className="text-indigo-500" />
                            فتح نافذة طباعة بطاقات الدخول الجماعية بعد الحفظ مباشرة
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50"
                        >
                            {processing ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                            {processing ? 'جاري التنفيذ...' : `تعيين لـ ${selectedIds.length} موظف`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
