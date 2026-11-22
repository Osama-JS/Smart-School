import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import {
    Printer, X, ShieldCheck, Copy, Check, Eye, EyeOff,
    KeyRound, Sparkles, MessageCircle, QrCode, Users,
    User, Lock, FileText, AlertTriangle, RefreshCw, Download
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

function normalizeWhatsAppPhone(rawPhone) {
    if (!rawPhone) return '';
    let digits = String(rawPhone).replace(/\D+/g, '');
    if (digits.startsWith('00')) {
        digits = digits.slice(2);
    }
    if (/^05\d{8}$/.test(digits)) {
        digits = '966' + digits.slice(1);
    }
    return digits.length >= 8 ? digits : '';
}

export default function CredentialsPrintModal({
    isOpen,
    credentials,
    logoUrl,
    reportDesign,
    isQuickResetting = false,
    onClose,
    onOpenResetPassword,
    onQuickResetPassword,
    onDownloadSinglePdf,
}) {
    const [showPassword, setShowPassword] = useState(true);
    const [showDetails, setShowDetails] = useState(true);
    const [showQr, setShowQr] = useState(true);
    const [showSignature, setShowSignature] = useState(true);
    const [paperSize, setPaperSize] = useState('a4'); // 'a4' | 'a5'
    const [copiedField, setCopiedField] = useState(null); // 'username' | 'password' | 'all' | null
    const [printError, setPrintError] = useState('');
    const qrRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setShowPassword(true);
            setCopiedField(null);
            setPrintError('');
        }
    }, [isOpen, credentials?.parent_id, credentials?.password, credentials?.issued_at]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !credentials) return null;

    const schoolName = reportDesign?.school_name || 'مدارس القيم الأهلية';
    const rawBrandColor = reportDesign?.default_brand_color || '#5b8a2d';
    const brandColor = /^#[0-9a-fA-F]{3,8}$/.test(rawBrandColor) ? rawBrandColor : '#5b8a2d';
    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
    const hasPassword = Boolean(credentials.password);
    const passwordDisplay = hasPassword
        ? (showPassword ? credentials.password : '••••••••')
        : 'غير محفوظة';

    const waPhone = normalizeWhatsAppPhone(credentials.phone);
    const childrenSummary = credentials.children_summary || '';
    const childrenCount = credentials.children_count || 0;

    const copyText = async (text, field) => {
        if (!text) return;
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setCopiedField(field);
            setTimeout(() => {
                setCopiedField((prev) => (prev === field ? null : prev));
            }, 2000);
        } catch {
            setCopiedField(null);
        }
    };

    const buildShareMessage = () => {
        const lines = [
            `السلام عليكم ولي الأمر الفاضل/ ${credentials.name || ''}`,
            `بيانات الدخول إلى تطبيق وبوابة ${schoolName}:`,
            `رابط الدخول: ${loginUrl}`,
            `اسم المستخدم: ${credentials.username || ''}`,
        ];
        if (hasPassword && showPassword) {
            lines.push(`كلمة المرور: ${credentials.password}`);
        }
        if (childrenSummary) {
            lines.push(`الأبناء المرتبطين (${childrenCount}): ${childrenSummary}`);
        }
        if (credentials.must_change_password) {
            lines.push('ملاحظة: سيُطلب تغيير كلمة المرور عند أول تسجيل دخول.');
        }
        return lines.join('\n');
    };

    const handleWhatsAppShare = () => {
        if (!waPhone) return;
        const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(buildShareMessage())}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handlePrint = () => {
        setPrintError('');
        const printWindow = window.open('', '_blank', 'width=920,height=780');
        if (!printWindow) {
            setPrintError('المتصفح منع فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع ثم المحاولة مجدداً.');
            return;
        }

        const safeName = escapeHtml(credentials.name || 'ولي أمر');
        const safeUsername = escapeHtml(credentials.username || '');
        const safeSchoolName = escapeHtml(schoolName);
        const safeChildren = escapeHtml(childrenSummary);
        const safeLoginUrl = escapeHtml(loginUrl);
        const safeLogoUrl = escapeHtml(logoUrl || '');
        const dateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
        const safeDateStr = escapeHtml(dateStr);

        const pwdHtml = hasPassword
            ? (showPassword
                ? `<span class="pwd-plain">${escapeHtml(credentials.password)}</span>`
                : '<span class="pwd-masked">••••••••</span>')
            : '<span class="pwd-empty">غير محفوظة</span>';

        const qrSvg = showQr ? (qrRef.current?.querySelector('svg')?.outerHTML || '') : '';
        const isCompact = paperSize === 'a5';

        const logoHtml = safeLogoUrl
            ? `<img src="${safeLogoUrl}" class="logo" alt="${safeSchoolName}" />`
            : `<svg class="logo-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>`;

        const noteText = hasPassword
            ? (credentials.must_change_password
                ? 'ملاحظة أمنية: سيُطلب من ولي الأمر تعيين كلمة مرور جديدة عند أول تسجيل دخول.'
                : 'الرجاء الاحتفاظ بهذه الوثيقة في مكان آمن وعدم مشاركة بيانات الدخول مع أي شخص آخر.')
            : 'كلمة المرور غير متاحة للعرض لأنها غير محفوظة. يمكنك توليد كلمة مرور جديدة من المودل قبل الطباعة.';

        printWindow.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8" />
    <title>بطاقة بيانات دخول ولي الأمر - ${safeName}</title>
    <style>
        @page {
            size: ${isCompact ? 'A5 portrait' : 'A4 portrait'};
            margin: ${isCompact ? '8mm' : '12mm'};
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif;
            background: #f1f5f9;
            margin: 0;
            padding: ${isCompact ? '16px' : '28px'};
            display: flex;
            justify-content: center;
            align-items: flex-start;
            color: #0f172a;
        }
        .card {
            width: 100%;
            max-width: ${isCompact ? '520px' : '720px'};
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }
        .header {
            background: ${brandColor};
            color: #ffffff;
            padding: ${isCompact ? '18px 20px 26px' : '26px 28px 34px'};
            text-align: center;
            position: relative;
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: -14px;
            left: 0;
            right: 0;
            height: 28px;
            background: #ffffff;
            border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        }
        .logo-wrap {
            width: ${isCompact ? '56px' : '68px'};
            height: ${isCompact ? '56px' : '68px'};
            margin: 0 auto 10px;
            background: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.12);
            position: relative;
            z-index: 1;
        }
        .logo {
            width: ${isCompact ? '38px' : '46px'};
            height: ${isCompact ? '38px' : '46px'};
            object-fit: contain;
        }
        .logo-svg {
            width: 34px;
            height: 34px;
            color: ${brandColor};
        }
        .school-name {
            margin: 0;
            font-size: ${isCompact ? '17px' : '20px'};
            font-weight: 800;
            position: relative;
            z-index: 1;
        }
        .doc-title {
            margin: 8px 0 2px;
            font-size: ${isCompact ? '18px' : '22px'};
            font-weight: 900;
            position: relative;
            z-index: 1;
        }
        .doc-subtitle {
            margin: 0;
            font-size: 12px;
            opacity: 0.92;
            position: relative;
            z-index: 1;
        }
        .body {
            padding: ${isCompact ? '14px 20px 20px' : '20px 28px 26px'};
        }
        .parent-box {
            text-align: center;
            margin-bottom: ${isCompact ? '14px' : '18px'};
        }
        .parent-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 700;
        }
        .parent-name {
            margin: 4px 0;
            font-size: ${isCompact ? '19px' : '22px'};
            font-weight: 900;
            color: #0f172a;
        }
        .meta-row {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
            margin-top: 6px;
        }
        .meta-tag {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #334155;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
        }
        .cred-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 14px;
        }
        .cred-item {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-right: 5px solid ${brandColor};
            border-radius: 12px;
            padding: ${isCompact ? '10px 12px' : '14px 16px'};
            text-align: center;
        }
        .cred-item.pwd {
            border-right-color: #0f172a;
        }
        .cred-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 700;
            margin-bottom: 6px;
        }
        .cred-val {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: ${isCompact ? '16px' : '19px'};
            font-weight: 900;
            direction: ltr;
            background: #ffffff;
            border: 1px dashed #94a3b8;
            border-radius: 8px;
            padding: 7px 10px;
            word-break: break-all;
            color: #0f172a;
        }
        .pwd-masked { color: #64748b; letter-spacing: 3px; }
        .pwd-empty { color: #b45309; font-family: 'Tajawal', Arial, sans-serif; font-size: 13px; }
        .qr-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px 14px;
            margin-bottom: 14px;
        }
        .qr-box {
            background: #ffffff;
            padding: 6px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .qr-box svg {
            width: ${isCompact ? '60px' : '72px'};
            height: ${isCompact ? '60px' : '72px'};
        }
        .qr-info {
            flex: 1;
            min-width: 0;
        }
        .qr-title {
            font-size: 12px;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 4px;
        }
        .qr-url {
            font-family: ui-monospace, monospace;
            font-size: 11px;
            color: #475569;
            direction: ltr;
            text-align: right;
            word-break: break-all;
        }
        .note-box {
            background: #fffbeb;
            border: 1px solid #fde68a;
            color: #92400e;
            border-radius: 10px;
            padding: 8px 12px;
            font-size: 11px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 14px;
        }
        .sig-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            border-top: 2px dashed #e2e8f0;
            padding-top: 12px;
            margin-top: 10px;
        }
        .sig-cell {
            text-align: center;
            font-size: 11px;
            color: #475569;
            font-weight: 700;
        }
        .sig-line {
            margin-top: 22px;
            border-bottom: 1px dotted #94a3b8;
        }
        .footer {
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
        }
        @media print {
            body {
                background: #ffffff;
                padding: 0;
            }
            .card {
                box-shadow: none;
                max-width: 100%;
                border: 1px solid #cbd5e1;
            }
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="logo-wrap">${logoHtml}</div>
            <h1 class="school-name">${safeSchoolName}</h1>
            <div class="doc-title">بطاقة بيانات دخول ولي الأمر</div>
            <p class="doc-subtitle">وثيقة تسليم بيانات الدخول لمتابعة الأبناء عبر التطبيق والبوابة</p>
        </div>
        <div class="body">
            <div class="parent-box">
                <div class="parent-label">ولي الأمر الفاضل</div>
                <h2 class="parent-name">${safeName}</h2>
                ${showDetails && safeChildren ? `
                    <div class="meta-row">
                        <span class="meta-tag">الأبناء (${childrenCount}): ${safeChildren}</span>
                    </div>
                ` : ''}
            </div>

            <div class="cred-grid">
                <div class="cred-item">
                    <div class="cred-label">اسم المستخدم</div>
                    <div class="cred-val">${safeUsername}</div>
                </div>
                <div class="cred-item pwd">
                    <div class="cred-label">كلمة المرور</div>
                    <div class="cred-val">${pwdHtml}</div>
                </div>
            </div>

            ${showQr ? `
                <div class="qr-row">
                    <div class="qr-info">
                        <div class="qr-title">رابط الدخول السريع لبوابة ولي الأمر</div>
                        <div class="qr-url">${safeLoginUrl}</div>
                    </div>
                    ${qrSvg ? `<div class="qr-box">${qrSvg}</div>` : ''}
                </div>
            ` : ''}

            <div class="note-box">${escapeHtml(noteText)}</div>

            ${showSignature ? `
                <div class="sig-row">
                    <div class="sig-cell">اسم ولي الأمر<div class="sig-line"></div></div>
                    <div class="sig-cell">التوقيع بالاستلام<div class="sig-line"></div></div>
                    <div class="sig-cell">تاريخ التسليم<div class="sig-line"></div></div>
                </div>
            ` : ''}

            <div class="footer">
                <span>تاريخ الإصدار: ${safeDateStr}</span>
                <span>شؤون الطلاب وأولياء الأمور — سري وخاص</span>
            </div>
        </div>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.focus();
                window.print();
            }, 350);
        };
        window.onafterprint = function() {
            window.close();
        };
    </script>
</body>
</html>`);
        printWindow.document.close();
    };

    const dateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl z-10 overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/70 dark:border-indigo-500/20">
                            <Printer size={19} />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                                بطاقة بيانات دخول ولي الأمر والطباعة
                            </h3>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                معاينة حية لبيانات ولي الأمر مع خيارات الطباعة والنسخ والمشاركة وتصدير PDF
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 max-h-[78vh] overflow-y-auto space-y-4">
                    {/* Contextual Success Banner */}
                    {credentials.action === 'create' && (
                        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="shrink-0" />
                                <span>تم إنشاء حساب ولي الأمر بنجاح — البيانات جاهزة للطباعة أو المشاركة.</span>
                            </div>
                        </div>
                    )}

                    {credentials.action === 'reset' && (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} className="shrink-0" />
                                <span>تم إعادة تعيين كلمة المرور بنجاح — كلمة المرور الجديدة ظاهرة وجاهزة للتسليم.</span>
                            </div>
                            {credentials.revoked_tokens && (
                                <span className="px-2.5 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 text-[11px]">
                                    تم إنهاء الجلسات النشطة
                                </span>
                            )}
                        </div>
                    )}

                    {/* Missing Password Banner */}
                    {!hasPassword && credentials.parent_id && (
                        <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 space-y-3">
                            <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs font-bold leading-relaxed">
                                <AlertTriangle size={17} className="shrink-0 mt-0.5" />
                                <div>
                                    كلمة المرور الحالية لولي الأمر غير مخزنة للعرض. يمكنك توليد كلمة مرور سهلة فوراً لتظهر في البطاقة وتُطبع معه:
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    disabled={isQuickResetting}
                                    onClick={() => onQuickResetPassword?.(credentials.parent_id)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={14} className={isQuickResetting ? 'animate-spin' : ''} />
                                    <span>{isQuickResetting ? 'جاري التوليد...' : 'توليد كلمة مرور سريعة الآن'}</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={isQuickResetting}
                                    onClick={() => onOpenResetPassword?.(credentials.parent_id)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
                                >
                                    <KeyRound size={14} />
                                    <span>تعيين كلمة مرور مخصصة</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {printError && (
                        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                            <AlertTriangle size={15} className="shrink-0" />
                            <span>{printError}</span>
                        </div>
                    )}

                    {/* Customization Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {hasPassword && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                        showPassword
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                                            : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                                    }`}
                                >
                                    {showPassword ? <Eye size={13} /> : <EyeOff size={13} />}
                                    <span>إظهار كلمة المرور</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowDetails(!showDetails)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                    showDetails
                                        ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/15 dark:text-primary-300 dark:border-primary-500/30'
                                        : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                                }`}
                            >
                                <Users size={13} />
                                <span>بيانات الأبناء</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowQr(!showQr)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                    showQr
                                        ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/15 dark:text-primary-300 dark:border-primary-500/30'
                                        : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                                }`}
                            >
                                <QrCode size={13} />
                                <span>رمز QR والرابط</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSignature(!showSignature)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                    showSignature
                                        ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/15 dark:text-primary-300 dark:border-primary-500/30'
                                        : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                                }`}
                            >
                                <FileText size={13} />
                                <span>توقيع الاستلام</span>
                            </button>
                        </div>

                        <div className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => setPaperSize('a4')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                    paperSize === 'a4'
                                        ? 'bg-slate-800 text-white dark:bg-slate-700'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                بطاقة A4
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaperSize('a5')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                    paperSize === 'a5'
                                        ? 'bg-slate-800 text-white dark:bg-slate-700'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                مدمجة A5
                            </button>
                        </div>
                    </div>

                    {/* Live Official Card Preview */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                        {/* Card Header */}
                        <div
                            className="px-6 pt-6 pb-8 text-center text-white relative"
                            style={{ backgroundColor: brandColor }}
                        >
                            <div className="w-16 h-16 mx-auto mb-2.5 rounded-full bg-white shadow-md flex items-center justify-center p-2">
                                {logoUrl ? (
                                    <img src={logoUrl} alt={schoolName} className="w-11 h-11 object-contain" />
                                ) : (
                                    <ShieldCheck size={30} style={{ color: brandColor }} />
                                )}
                            </div>
                            <h4 className="text-base font-extrabold">{schoolName}</h4>
                            <div className="text-lg font-black mt-2">بطاقة بيانات دخول ولي الأمر</div>
                            <p className="text-xs opacity-90">وثيقة تسليم بيانات الدخول لمتابعة الأبناء عبر التطبيق والبوابة</p>
                            <div className="absolute -bottom-3 left-0 right-0 h-6 bg-white dark:bg-slate-950 rounded-t-[100%]" />
                        </div>

                        {/* Card Body */}
                        <div className="px-5 sm:px-7 pb-6 pt-3 space-y-4">
                            <div className="text-center">
                                <div className="text-xs font-bold text-slate-400">ولي الأمر الفاضل</div>
                                <div className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
                                    {credentials.name}
                                </div>
                                {showDetails && childrenSummary && (
                                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200/70 dark:border-slate-700">
                                            الأبناء ({childrenCount}): {childrenSummary}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Credentials Boxes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Username */}
                                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-r-4 p-4" style={{ borderRightColor: brandColor }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <User size={14} /> اسم المستخدم
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => copyText(credentials.username, 'username')}
                                            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-primary-600 transition-colors"
                                            title="نسخ اسم المستخدم"
                                        >
                                            {copiedField === 'username' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-center font-mono text-lg font-black text-slate-800 dark:text-white tracking-wide break-all" dir="ltr">
                                        {credentials.username}
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-r-4 border-r-slate-800 dark:border-r-emerald-500 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <Lock size={14} /> كلمة المرور
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {hasPassword && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                                        title={showPassword ? 'إخفاء' : 'إظهار'}
                                                    >
                                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyText(credentials.password, 'password')}
                                                        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-primary-600 transition-colors"
                                                        title="نسخ كلمة المرور"
                                                    >
                                                        {copiedField === 'password' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={`bg-white dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-center font-mono text-lg font-black tracking-wide break-all ${
                                            hasPassword
                                                ? 'text-emerald-700 dark:text-emerald-400'
                                                : 'text-amber-600 dark:text-amber-400 font-sans text-sm'
                                        }`}
                                        dir={hasPassword ? 'ltr' : 'rtl'}
                                    >
                                        {passwordDisplay}
                                    </div>
                                </div>
                            </div>

                            {/* QR + Login URL */}
                            {showQr && (
                                <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                            رابط الدخول السريع لبوابة ولي الأمر
                                        </div>
                                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 break-all text-right" dir="ltr">
                                            {loginUrl}
                                        </div>
                                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                            امسح الرمز بكاميرا الجوال للانتقال المباشر إلى صفحة تسجيل الدخول
                                        </div>
                                    </div>
                                    <div
                                        ref={qrRef}
                                        className="p-2 bg-white rounded-xl border border-slate-200 shrink-0"
                                    >
                                        <QRCode value={loginUrl} size={76} />
                                    </div>
                                </div>
                            )}

                            {/* Must change password notice */}
                            {credentials.must_change_password && (
                                <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold text-center">
                                    ملاحظة: سيُطلب من ولي الأمر تعيين كلمة مرور جديدة عند أول تسجيل دخول
                                </div>
                            )}

                            {/* Signature Receipt Preview */}
                            {showSignature && (
                                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                    <div>
                                        <div>اسم ولي الأمر</div>
                                        <div className="mt-5 border-b border-dotted border-slate-300 dark:border-slate-700" />
                                    </div>
                                    <div>
                                        <div>التوقيع بالاستلام</div>
                                        <div className="mt-5 border-b border-dotted border-slate-300 dark:border-slate-700" />
                                    </div>
                                    <div>
                                        <div>تاريخ التسليم</div>
                                        <div className="mt-5 border-b border-dotted border-slate-300 dark:border-slate-700" />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                                <span>تاريخ الإصدار: {dateStr}</span>
                                <span>شؤون الطلاب وأولياء الأمور — سري وخاص</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary-500/20 transition-all"
                        >
                            <Printer size={16} />
                            <span>طباعة البطاقة الرسمية</span>
                        </button>

                        {credentials.parent_id && (
                            <button
                                type="button"
                                onClick={() => onDownloadSinglePdf?.(credentials.parent_id)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/25 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                            >
                                <Download size={15} />
                                <span>تحميل البطاقة PDF</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => copyText(buildShareMessage(), 'all')}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all ${
                                copiedField === 'all'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            {copiedField === 'all' ? <Check size={15} /> : <Copy size={15} />}
                            <span>{copiedField === 'all' ? 'تم النسخ ✓' : 'نسخ بيانات الدخول'}</span>
                        </button>

                        <button
                            type="button"
                            disabled={!waPhone}
                            onClick={handleWhatsAppShare}
                            title={waPhone ? `إرسال إلى ${credentials.phone}` : 'لا يوجد رقم هاتف مسجل'}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/25 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <MessageCircle size={15} />
                            <span>إرسال عبر واتساب</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasPassword && credentials.parent_id && (
                            <button
                                type="button"
                                onClick={() => onOpenResetPassword?.(credentials.parent_id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <KeyRound size={14} />
                                <span>تغيير كلمة المرور</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
