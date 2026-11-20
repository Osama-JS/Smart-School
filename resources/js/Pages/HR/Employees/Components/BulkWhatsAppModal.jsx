import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    MessageCircle, X, Send, Sparkles, ExternalLink, AlertTriangle, Loader2, PhoneOff
} from 'lucide-react';

function normalizeWhatsAppPhone(rawPhone) {
    if (!rawPhone) return '';
    let digits = String(rawPhone).replace(/\D+/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (/^05\d{8}$/.test(digits)) digits = '966' + digits.slice(1);
    return digits.length >= 8 ? digits : '';
}

const PRESET_TEMPLATES = [
    {
        id: 'notice',
        label: 'تنبيه إداري',
        text: 'السلام عليكم أ/ {name}،\nيرجى الاطلاع على التعميم الإداري الجديد عبر بوابة النظام:\n{login_url}',
    },
    {
        id: 'credentials',
        label: 'بيانات الدخول',
        text: 'مرحباً أ/ {name}،\nبيانات الدخول الخاصة بك في النظام:\nرابط الدخول: {login_url}\nاسم المستخدم: {username}\nكلمة المرور: {password}',
    },
    {
        id: 'meeting',
        label: 'تذكير باجتماع',
        text: 'السلام عليكم أ/ {name} ({department})،\nنذكركم بموعد الاجتماع الإداري اليوم، نرجو الحضور في الوقت المحدد.',
    },
];

export default function BulkWhatsAppModal({
    isOpen,
    selectedEmployees = [],
    onClose,
    onSuccess,
}) {
    const [message, setMessage] = useState(PRESET_TEMPLATES[0].text);
    const [processing, setProcessing] = useState(false);
    const [showDirectLinks, setShowDirectLinks] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setMessage(PRESET_TEMPLATES[0].text);
            setProcessing(false);
            setShowDirectLinks(false);
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

    const employeesWithPhones = useMemo(() => {
        return selectedEmployees.map((emp) => ({
            ...emp,
            waPhone: normalizeWhatsAppPhone(emp.phone),
        }));
    }, [selectedEmployees]);

    const readyCount = employeesWithPhones.filter((e) => Boolean(e.waPhone)).length;
    const missingCount = employeesWithPhones.length - readyCount;

    if (!isOpen || selectedEmployees.length === 0) return null;

    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';

    const buildPersonalizedMessage = (emp) => {
        return message
            .replace(/\{name\}/g, emp.name || '')
            .replace(/\{username\}/g, emp.username || '')
            .replace(/\{password\}/g, emp.login_password || 'غير محفوظة')
            .replace(/\{department\}/g, emp.department || 'غير محدد')
            .replace(/\{job_grade\}/g, emp.jobGrade || 'غير محدد')
            .replace(/\{login_url\}/g, loginUrl);
    };

    const insertPlaceholder = (token) => {
        setMessage((prev) => `${prev}${prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : ''}${token}`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (processing || !message.trim() || readyCount === 0) return;

        router.post(
            route('hr.employees.bulk-whatsapp'),
            {
                employee_ids: selectedEmployees.map((e) => e.id),
                message,
            },
            {
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
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
            <div
                className="absolute inset-0 bg-slate-900/55 backdrop-blur-md animate-fade-in"
                onClick={() => !processing && onClose()}
            />

            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-scale-in flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white">
                                إرسال جماعي عبر واتساب
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                المحددون: {selectedEmployees.length} • لديهم رقم جوال: {readyCount}
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

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                    {missingCount > 0 && (
                        <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-2xl text-xs font-bold">
                            <AlertTriangle size={16} className="shrink-0" />
                            يوجد {missingCount} موظف بدون رقم جوال مسجل وسيتم تخطيهم عند الإرسال.
                        </div>
                    )}

                    {/* Presets */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300">
                                <Sparkles size={14} className="text-emerald-500" />
                                قوالب سريعة
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_TEMPLATES.map((tpl) => (
                                <button
                                    key={tpl.id}
                                    type="button"
                                    onClick={() => setMessage(tpl.text)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-200 transition-colors"
                                >
                                    {tpl.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message Textarea + Placeholders */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-black text-slate-700 dark:text-slate-200">
                                نص الرسالة
                            </label>
                            <span className="text-[11px] font-bold text-slate-400">
                                {message.length} / 2000
                            </span>
                        </div>
                        <textarea
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={2000}
                            placeholder="اكتب رسالتك هنا..."
                            className="w-full rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-semibold p-3.5 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.message && (
                            <p className="text-xs font-bold text-rose-500 mt-1">{errors.message}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[11px] font-bold text-slate-400 ml-1">متغيرات تلقائية:</span>
                            {[
                                { token: '{name}', label: 'الاسم' },
                                { token: '{username}', label: 'اسم المستخدم' },
                                { token: '{password}', label: 'كلمة المرور' },
                                { token: '{department}', label: 'القسم' },
                                { token: '{job_grade}', label: 'الدرجة' },
                                { token: '{login_url}', label: 'رابط الدخول' },
                            ].map((ph) => (
                                <button
                                    key={ph.token}
                                    type="button"
                                    onClick={() => insertPlaceholder(ph.token)}
                                    className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/20 hover:bg-emerald-100"
                                >
                                    + {ph.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview for first ready employee */}
                    {employeesWithPhones[0] && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3.5 space-y-1">
                            <div className="text-[11px] font-black text-slate-400">
                                معاينة الرسالة لـ ({employeesWithPhones[0].name}):
                            </div>
                            <pre className="text-xs font-sans text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                {buildPersonalizedMessage(employeesWithPhones[0])}
                            </pre>
                        </div>
                    )}

                    {/* Optional manual wa.me fallback list */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                        <button
                            type="button"
                            onClick={() => setShowDirectLinks(!showDirectLinks)}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                        >
                            <ExternalLink size={13} />
                            {showDirectLinks
                                ? 'إخفاء روابط الإرسال اليدوي (wa.me)'
                                : 'عرض روابط الإرسال اليدوي عبر واتساب ويب (wa.me)'}
                        </button>

                        {showDirectLinks && (
                            <div className="mt-3 max-h-40 overflow-y-auto space-y-1.5 pr-1">
                                {employeesWithPhones.map((emp) => {
                                    const waText = encodeURIComponent(buildPersonalizedMessage(emp));
                                    return (
                                        <div
                                            key={emp.id}
                                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                                        >
                                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                                                {emp.name}
                                            </span>
                                            {emp.waPhone ? (
                                                <a
                                                    href={`https://wa.me/${emp.waPhone}?text=${waText}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0"
                                                >
                                                    <MessageCircle size={12} /> فتح واتساب
                                                </a>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-slate-400 font-bold">
                                                    <PhoneOff size={12} /> بدون رقم
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
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
                            disabled={processing || !message.trim() || readyCount === 0}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                        >
                            {processing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                            {processing ? 'جاري الإرسال...' : `إرسال عبر الخادم (${readyCount})`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
