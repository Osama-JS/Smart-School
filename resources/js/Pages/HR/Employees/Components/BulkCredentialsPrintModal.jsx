import React, { useEffect, useState } from 'react';
import {
    Printer, X, Eye, EyeOff, ShieldCheck, Building, User, Lock, AlertTriangle
} from 'lucide-react';

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export default function BulkCredentialsPrintModal({
    isOpen,
    credentialsList = [],
    logoUrl,
    reportDesign,
    onClose,
}) {
    const [showPasswords, setShowPasswords] = useState(true);
    const [showDetails, setShowDetails] = useState(true);
    const [cardsPerPage, setCardsPerPage] = useState(4); // 2 | 4
    const [printError, setPrintError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setShowPasswords(true);
            setPrintError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !Array.isArray(credentialsList) || credentialsList.length === 0) return null;

    const schoolName = reportDesign?.school_name || 'مدارس القيم الأهلية';
    const rawBrandColor = reportDesign?.default_brand_color || '#5b8a2d';
    const brandColor = /^#[0-9a-fA-F]{3,8}$/.test(rawBrandColor) ? rawBrandColor : '#5b8a2d';
    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
    const missingPasswordsCount = credentialsList.filter((c) => !c.password).length;

    const handlePrint = () => {
        setPrintError('');
        const printWin = window.open('', '_blank', 'width=960,height=720');
        if (!printWin) {
            setPrintError('قام المتصفح بحظر نافذة الطباعة المنبثقة. يرجى السماح بالنوافذ المنبثقة ثم المحاولة مجدداً.');
            return;
        }

        const cardsHtml = credentialsList
            .map((cred) => {
                const pwdText = cred.password
                    ? (showPasswords ? cred.password : '••••••••')
                    : 'غير محفوظة (أعد التعيين)';
                const roleLine = [cred.department, cred.jobGrade].filter(Boolean).join(' • ');

                return `
                    <div class="card">
                        <div class="card-top">
                            <div class="school">${escapeHtml(schoolName)}</div>
                            <div class="badge">بطاقة بيانات الدخول</div>
                        </div>
                        <div class="emp-name">${escapeHtml(cred.name || '')}</div>
                        ${showDetails && roleLine ? `<div class="emp-meta">${escapeHtml(roleLine)}</div>` : ''}
                        <div class="creds-box">
                            <div class="row">
                                <span class="lbl">اسم المستخدم:</span>
                                <span class="val mono">${escapeHtml(cred.username || '')}</span>
                            </div>
                            <div class="row">
                                <span class="lbl">كلمة المرور:</span>
                                <span class="val mono">${escapeHtml(pwdText)}</span>
                            </div>
                        </div>
                        <div class="footer">
                            <span>رابط الدخول: <span class="mono">${escapeHtml(loginUrl)}</span></span>
                            ${cred.must_change_password ? '<span class="warn">يلزم التغيير عند الدخول</span>' : ''}
                        </div>
                    </div>
                `;
            })
            .join('');

        const gridCols = cardsPerPage === 2 ? '1fr' : '1fr 1fr';

        printWin.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="utf-8" />
                <title>بطاقات بيانات دخول الموظفين</title>
                <style>
                    @page { size: A4; margin: 12mm; }
                    body { font-family: Tahoma, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; }
                    .grid { display: grid; grid-template-columns: ${gridCols}; gap: 12px; }
                    .card { border: 1.5px solid #cbd5e1; border-top: 4px solid ${brandColor}; border-radius: 12px; padding: 14px; page-break-inside: avoid; break-inside: avoid; background: #fff; }
                    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                    .school { font-size: 12px; font-weight: bold; color: ${brandColor}; }
                    .badge { font-size: 10px; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 999px; font-weight: bold; }
                    .emp-name { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
                    .emp-meta { font-size: 11px; color: #64748b; margin-bottom: 10px; }
                    .creds-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; margin-top: 6px; }
                    .row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 12px; }
                    .lbl { color: #64748b; font-weight: bold; }
                    .val { font-weight: bold; color: #0f172a; }
                    .mono { font-family: Consolas, monospace; direction: ltr; unicode-bidi: embed; }
                    .footer { margin-top: 10px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap; }
                    .warn { color: #b45309; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="grid">${cardsHtml}</div>
                <script>window.onload = function(){ window.print(); };</script>
            </body>
            </html>
        `);
        printWin.document.close();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl z-10 overflow-hidden border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[90vh] animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Printer size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white">
                                طباعة بطاقات بيانات الدخول ({credentialsList.length} موظف)
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                معاينة جماعية قبل الطباعة
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                        >
                            {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showPasswords ? 'إخفاء كلمات المرور' : 'إظهار كلمات المرور'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                        >
                            <Building size={14} />
                            {showDetails ? 'إخفاء القسم/الدرجة' : 'إظهار القسم/الدرجة'}
                        </button>
                        <select
                            value={cardsPerPage}
                            onChange={(e) => setCardsPerPage(Number(e.target.value))}
                            className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold py-1.5"
                        >
                            <option value={4}>عمودان (مضغوط)</option>
                            <option value={2}>عمود واحد (كبير)</option>
                        </select>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {missingPasswordsCount > 0 && (
                        <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-2xl text-xs font-bold">
                            <AlertTriangle size={16} className="shrink-0" />
                            يوجد {missingPasswordsCount} موظف بدون كلمة مرور محفوظة للعرض. يمكنك استخدام زر "إعادة تعيين كلمة المرور" الجماعي لتوليد كلمات مرور جديدة لهم.
                        </div>
                    )}

                    {printError && (
                        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-2xl text-xs font-bold">
                            {printError}
                        </div>
                    )}

                    <div className={`grid gap-4 ${cardsPerPage === 2 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {credentialsList.map((cred, idx) => (
                            <div
                                key={`${cred.employee_id}_${idx}`}
                                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 p-4 space-y-3"
                                style={{ borderTopWidth: '4px', borderTopColor: brandColor }}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        {logoUrl && <img src={logoUrl} alt="" className="w-7 h-7 rounded-lg object-contain" />}
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{schoolName}</span>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300">
                                        بطاقة دخول
                                    </span>
                                </div>

                                <div>
                                    <div className="font-black text-sm text-slate-900 dark:text-white">{cred.name}</div>
                                    {showDetails && (
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                            {[cred.department, cred.jobGrade].filter(Boolean).join(' • ')}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1 font-bold text-slate-500">
                                            <User size={12} /> اسم المستخدم:
                                        </span>
                                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100" dir="ltr">
                                            {cred.username}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1 font-bold text-slate-500">
                                            <Lock size={12} /> كلمة المرور:
                                        </span>
                                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100" dir="ltr">
                                            {cred.password
                                                ? (showPasswords ? cred.password : '••••••••')
                                                : 'غير محفوظة'}
                                        </span>
                                    </div>
                                </div>

                                {cred.must_change_password && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                        <ShieldCheck size={13} />
                                        يلزم تغيير كلمة المرور عند أول دخول
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                        إغلاق
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                    >
                        <Printer size={15} />
                        طباعة البطاقات ({credentialsList.length})
                    </button>
                </div>
            </div>
        </div>
    );
}
