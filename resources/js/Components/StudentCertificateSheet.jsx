import React from 'react';
import QRCode from 'react-qr-code';
import { Award, ShieldCheck, Lock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const GRADE_COLORS = {
    excellent: 'text-lime-800 border-lime-300 bg-lime-50',
    vgood: 'text-indigo-700 border-indigo-300 bg-indigo-50',
    good: 'text-sky-700 border-sky-300 bg-sky-50',
    pass: 'text-amber-700 border-amber-300 bg-amber-50',
    weak: 'text-orange-700 border-orange-300 bg-orange-50',
    fail: 'text-red-700 border-red-300 bg-red-50',
};

export default function StudentCertificateSheet({
    certificate,
    isAdminView = false,
    options = {},
    className = '',
}) {
    if (!certificate) return null;

    const {
        showRank = true,
        showNotes = true,
        showQr = true,
        showSignatures = true,
    } = options;

    const {
        type,
        student = {},
        enrollment = {},
        period,
        semester = {},
        academicYear = '',
        rows = [],
        summary = {},
        design = {},
        logoUrl,
        qrText = '',
        issueDate = '',
    } = certificate;

    const isMonthly = type === 'monthly';
    const rawBrandColor = design.default_brand_color || '';
    const isValidHex = /^#[0-9a-fA-F]{3,8}$/.test(rawBrandColor);
    const useLogoPalette = !isValidHex || rawBrandColor.toLowerCase() === '#059669';

    const primaryDark = useLogoPalette ? '#4d7c0f' : rawBrandColor;
    const primaryBright = useLogoPalette ? '#84b819' : rawBrandColor;
    const accentRed = '#dc2626';
    const charcoal = '#18181b';
    const tintBg = useLogoPalette ? '#f7fbe9' : '#f8fafc';

    const gradeBadgeCls = GRADE_COLORS[summary.grade_code] || GRADE_COLORS.pass;
    const hasNotes = isMonthly && showNotes && rows.some((r) => Boolean(r.note));
    const stampUrl = design.stamp_image
        ? (design.stamp_image.startsWith('http') ? design.stamp_image : `/storage/${design.stamp_image.replace(/^\/+/, '')}`)
        : null;

    const signatures = [
        { active: design.sig1_active !== false, title: design.sig1_title || 'إعداد / المختص', name: design.sig1_name || '' },
        { active: design.sig2_active !== false, title: design.sig2_title || 'مراجعة / وكيل المدرسة', name: design.sig2_name || '' },
        { active: design.sig3_active !== false, title: design.sig3_title || 'اعتماد / مدير الفرع', name: design.sig3_name || '' },
    ].filter((s) => s.active);

    return (
        <div
            className={`w-full max-w-[210mm] min-h-[297mm] bg-white text-zinc-900 shadow-2xl print:shadow-none relative overflow-hidden flex flex-col mx-auto rounded-2xl print:rounded-none p-2 print:p-1 ${className}`}
            style={{ border: `2px solid ${primaryDark}` }}
            dir="rtl"
        >
            {/* Inner Official Certificate Frame */}
            <div
                className="relative flex flex-col flex-1 rounded-xl overflow-hidden bg-white"
                style={{ border: `1px solid ${primaryBright}88` }}
            >
                {/* Top Tricolor Logo Ribbon */}
                <div
                    className="w-full h-2 [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                    style={{
                        background: `linear-gradient(to left, ${charcoal} 0%, ${charcoal} 22%, ${accentRed} 22%, ${accentRed} 44%, ${primaryBright} 44%, ${primaryDark} 100%)`,
                    }}
                />

                {/* Subtle Centered Watermark */}
                {logoUrl && (
                    <img
                        src={logoUrl}
                        alt=""
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 object-contain opacity-[0.045] pointer-events-none select-none z-0"
                    />
                )}

                <div className="relative z-10 flex flex-col flex-1 p-6 sm:p-8">
                    {/* Admin-only notices */}
                    {isAdminView && enrollment.is_result_blocked && (
                        <div className="print:hidden mb-4 flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-2.5 rounded-xl text-xs font-bold">
                            <Lock size={15} className="shrink-0" />
                            تنبيه للإدارة: نتيجة هذا الطالب محجوبة حالياً عن بوابة الطالب وولي الأمر.
                        </div>
                    )}

                    {isAdminView && (summary.has_draft || summary.has_unsubmitted) && (
                        <div className="print:hidden mb-4 flex items-center gap-2 bg-lime-50 border border-lime-300 text-lime-900 px-4 py-2.5 rounded-xl text-xs font-bold">
                            <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                            {isMonthly
                                ? 'تتضمن هذه الشهادة درجات شهرية لم تُرفع وتُقفل نهائياً بعد (معاينة مسودة).'
                                : 'تتضمن هذه الشهادة مواد بحالة مسودة لم تُعتمد نهائياً بعد.'}
                        </div>
                    )}

                    {/* Official School Header */}
                    <div
                        className="flex justify-between items-center gap-4 pb-4 mb-5 border-b-2"
                        style={{ borderColor: primaryBright }}
                    >
                        <div className="w-[36%] text-right space-y-0.5">
                            <p className="text-[11px] font-black text-zinc-900">{design.republic || 'الجمهورية اليمنية'}</p>
                            <p className="text-[11px] font-bold text-zinc-600">{design.ministry || 'وزارة التربية والتعليم والبحث العلمي'}</p>
                            <h2 className="text-lg font-black pt-1" style={{ color: primaryDark }}>
                                {design.school_name || 'مدارس القيم الأهلية'}
                            </h2>
                            <p className="text-xs font-bold text-zinc-500">
                                {design.branch_name || 'المركز الرئيسي'} {design.department_name ? `• ${design.department_name}` : ''}
                            </p>
                        </div>

                        <div className="w-[26%] flex flex-col items-center justify-center">
                            <div
                                className="w-21 h-21 rounded-full p-2 flex items-center justify-center shadow-xs [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                                style={{
                                    border: `2px solid ${primaryBright}66`,
                                    backgroundColor: tintBg,
                                }}
                            >
                                {logoUrl ? (
                                    <img src={logoUrl} alt="شعار المدرسة" className="w-full h-full object-contain" />
                                ) : (
                                    <Award size={38} style={{ color: primaryDark }} />
                                )}
                            </div>
                            <span
                                className="mt-1.5 px-3 py-0.5 rounded-full text-[9px] font-black text-white [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                                style={{ backgroundColor: charcoal }}
                            >
                                وثيقة درجات رسمية
                            </span>
                        </div>

                        <div className="w-[38%] text-left text-xs">
                            <div
                                className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1 [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                                style={{ borderRight: `3px solid ${accentRed}` }}
                            >
                                <div className="flex justify-between gap-2">
                                    <span className="text-zinc-500 font-bold">العام الدراسي:</span>
                                    <span className="font-black text-zinc-900">{academicYear || '—'}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-zinc-500 font-bold">الفصل الدراسي:</span>
                                    <span className="font-black text-zinc-900">{semester.name || '—'}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-zinc-500 font-bold">تاريخ الإصدار:</span>
                                    <span className="font-bold font-mono text-zinc-900" dir="ltr">{issueDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Certificate Title */}
                    <div className="text-center mb-5">
                        <h1 className="text-2xl sm:text-[26px] font-black text-zinc-900 mb-2">
                            {isMonthly ? 'شهادة الدرجات الشهرية' : 'شهادة نتائج نهاية الفصل الدراسي'}
                        </h1>
                        <div
                            className="w-24 h-[3px] mx-auto mb-2.5 rounded-full [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                            style={{ background: `linear-gradient(to left, ${accentRed}, ${primaryBright})` }}
                        />
                        <div className="inline-flex flex-wrap items-center justify-center gap-2">
                            {semester.name && (
                                <span
                                    className="px-4 py-1 rounded-full text-xs font-black [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                                    style={{
                                        backgroundColor: isMonthly ? tintBg : primaryDark,
                                        color: isMonthly ? primaryDark : '#ffffff',
                                        border: isMonthly ? `1px solid ${primaryBright}88` : 'none',
                                    }}
                                >
                                    {semester.name}
                                </span>
                            )}
                            {isMonthly && period?.month_name && (
                                <span
                                    className="px-4 py-1 rounded-full text-xs font-black text-white [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                                    style={{ backgroundColor: primaryDark }}
                                >
                                    {period.month_name}
                                </span>
                            )}
                            {(summary.has_draft || summary.has_unsubmitted) && (
                                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                                    نسخة مسودة
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Student Info Card */}
                    <div
                        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 p-3.5 rounded-xl [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                        style={{
                            backgroundColor: tintBg,
                            border: `1px solid ${primaryBright}77`,
                            borderRight: `4px solid ${primaryDark}`,
                        }}
                    >
                        <div className="col-span-2 sm:col-span-1">
                            <p className="text-[10px] font-bold text-zinc-500">اسم الطالب</p>
                            <p className="text-sm font-black text-zinc-900 mt-0.5">{student.name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500">الرقم الأكاديمي</p>
                            <p className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                                {student.username || student.id}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500">الصف الدراسي</p>
                            <p className="text-sm font-bold text-zinc-900 mt-0.5">{enrollment.grade_name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500">الشعبة</p>
                            <p className="text-sm font-bold text-zinc-900 mt-0.5">{enrollment.division_name || '—'}</p>
                        </div>
                    </div>

                    {/* Grades Table */}
                    <div className="flex-1 mb-5">
                        <table className="w-full text-right border-collapse border border-zinc-300 text-xs">
                            <thead>
                                <tr
                                    className="text-white [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                                    style={{ backgroundColor: primaryDark }}
                                >
                                    <th className="py-2.5 px-2.5 border border-white/20 text-center w-8">#</th>
                                    <th className="py-2.5 px-3 border border-white/20">المادة الدراسية</th>
                                    {isMonthly ? (
                                        <>
                                            <th className="py-2.5 px-2 border border-white/20 text-center">الشفهي</th>
                                            <th className="py-2.5 px-2 border border-white/20 text-center">الواجبات</th>
                                            <th className="py-2.5 px-2 border border-white/20 text-center">المواظبة</th>
                                            <th className="py-2.5 px-2 border border-white/20 text-center">الاختبار</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="py-2.5 px-2 border border-white/20 text-center">أعمال السنة</th>
                                            <th className="py-2.5 px-2 border border-white/20 text-center">الاختبار النهائي</th>
                                        </>
                                    )}
                                    <th className="py-2.5 px-2 border border-white/20 text-center">المجموع</th>
                                    <th className="py-2.5 px-2 border border-white/20 text-center">العظمى</th>
                                    <th className="py-2.5 px-2 border border-white/20 text-center">التقدير</th>
                                    {!isMonthly && (
                                        <th className="py-2.5 px-2 border border-white/20 text-center">الحالة</th>
                                    )}
                                    {hasNotes && (
                                        <th className="py-2.5 px-2.5 border border-white/20">ملاحظة المعلم</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr
                                        key={row.subject_id || idx}
                                        className="[color-adjust:exact] [-webkit-print-color-adjust:exact]"
                                        style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fbf5' }}
                                    >
                                        <td className="py-2.5 px-2 border border-zinc-200 text-center font-bold text-zinc-400">
                                            {idx + 1}
                                        </td>
                                        <td className="py-2.5 px-3 border border-zinc-200 font-black text-zinc-900">
                                            {row.subject_name}
                                        </td>
                                        {isMonthly ? (
                                            <>
                                                <td className="py-2.5 px-2 border border-zinc-200 text-center font-mono font-bold text-zinc-700">
                                                    {row.oral_total} <span className="text-[10px] text-zinc-400">/{row.oral_max}</span>
                                                </td>
                                                <td className="py-2.5 px-2 border border-zinc-200 text-center font-mono font-bold text-zinc-700">
                                                    {row.homework_total} <span className="text-[10px] text-zinc-400">/{row.homework_max}</span>
                                                </td>
                                                <td className="py-2.5 px-2 border border-zinc-200 text-center font-mono font-bold text-zinc-700">
                                                    {row.behavior} <span className="text-[10px] text-zinc-400">/{row.behavior_max}</span>
                                                </td>
                                                <td className="py-2.5 px-2 border border-zinc-200 text-center font-mono font-bold text-zinc-700">
                                                    {row.monthly_exam} <span className="text-[10px] text-zinc-400">/{row.exam_max}</span>
                                                </td>
                                                <td
                                                    className="py-2.5 px-2 border border-zinc-200 text-center font-mono font-black [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                                                    style={{ backgroundColor: tintBg, color: primaryDark }}
                                                >
                                                    {row.grand_total}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="py-2.5 px-2 border border-zinc-200 text-center font-mono font-bold text-zinc-700">
                                                    {row.monthly_aggregate} <span className="text-[10px] text-zinc-400">/{row.aggregate_max}</span>
                                                </td>
                                                <td className="py-2.5 px-2 border border-zinc-200 text-center font-mono font-bold text-zinc-700">
                                                    {row.final_exam_score} <span className="text-[10px] text-zinc-400">/{row.final_exam_max}</span>
                                                </td>
                                                <td
                                                    className="py-2.5 px-2 border border-zinc-200 text-center font-mono font-black [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                                                    style={{ backgroundColor: tintBg, color: primaryDark }}
                                                >
                                                    {row.semester_total}
                                                </td>
                                            </>
                                        )}
                                        <td className="py-2.5 px-2 border border-zinc-200 text-center font-mono font-bold text-zinc-500">
                                            {row.max_total}
                                        </td>
                                        <td
                                            className="py-2.5 px-2 border border-zinc-200 text-center font-black"
                                            style={{ color: row.passed ? primaryDark : accentRed }}
                                        >
                                            {row.grade_text}
                                        </td>
                                        {!isMonthly && (
                                            <td className="py-2.5 px-2 border border-zinc-200 text-center">
                                                {row.passed ? (
                                                    <span className="inline-flex items-center gap-0.5 font-black" style={{ color: primaryDark }}>
                                                        <CheckCircle2 size={12} /> ناجح
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 font-black" style={{ color: accentRed }}>
                                                        <XCircle size={12} /> راسب
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        {hasNotes && (
                                            <td className="py-2.5 px-2.5 border border-zinc-200 text-zinc-600">
                                                {row.note || '—'}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Bar */}
                    <div
                        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3.5 rounded-xl bg-zinc-50 [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                        style={{ border: `1.5px solid ${primaryBright}88` }}
                    >
                        <div className="text-center border-l border-zinc-200 pl-2">
                            <p className="text-[10px] font-bold text-zinc-500">المجموع الكلي</p>
                            <p className="text-xl font-black font-mono text-zinc-900 mt-0.5">
                                {summary.total_marks} <span className="text-xs font-bold text-zinc-400">/ {summary.max_possible}</span>
                            </p>
                        </div>
                        <div className="text-center sm:border-l border-zinc-200 pl-2">
                            <p className="text-[10px] font-bold text-zinc-500">النسبة المئوية</p>
                            <p className="text-xl font-black font-mono mt-0.5" style={{ color: primaryDark }}>
                                {summary.percentage}%
                            </p>
                        </div>
                        <div className="text-center border-l border-zinc-200 pl-2">
                            <p className="text-[10px] font-bold text-zinc-500">التقدير العام</p>
                            <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-black border ${gradeBadgeCls}`}>
                                {summary.grade_text}
                            </span>
                        </div>
                        <div className="text-center">
                            {showRank && summary.rank ? (
                                <>
                                    <p className="text-[10px] font-bold text-zinc-500">الترتيب على الشعبة</p>
                                    <p className="text-xl font-black font-mono text-zinc-900 mt-0.5">
                                        #{summary.rank} <span className="text-xs font-bold text-zinc-400">من {summary.division_students_count}</span>
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-[10px] font-bold text-zinc-500">النتيجة النهائية</p>
                                    <p
                                        className="text-base font-black mt-1"
                                        style={{ color: summary.passed ? primaryDark : accentRed }}
                                    >
                                        {summary.passed ? 'ناجح' : `راسب (${summary.failed_subjects_count} مواد)`}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer: Signatures, Stamp, QR */}
                    <div
                        className="mt-auto pt-4 border-t-2 border-dashed flex flex-wrap items-end justify-between gap-6"
                        style={{ borderColor: `${primaryBright}aa` }}
                    >
                        {showQr && qrText && (
                            <div className="flex flex-col items-center">
                                <div
                                    className="p-2 bg-white border border-zinc-200 rounded-xl shadow-xs"
                                    style={{ borderRight: `3px solid ${charcoal}` }}
                                >
                                    <QRCode value={qrText} size={74} level="M" />
                                </div>
                                <span className="text-[10px] font-bold text-zinc-500 mt-1 flex items-center gap-1">
                                    <ShieldCheck size={11} style={{ color: primaryDark }} /> موثقة إلكترونياً
                                </span>
                            </div>
                        )}

                        {showSignatures && (
                            <div className="flex-1 flex flex-wrap justify-around items-end gap-4">
                                {signatures.map((sig, i) => (
                                    <div key={i} className="text-center min-w-[115px]">
                                        <p className="text-xs font-black text-zinc-800 mb-7">{sig.title}</p>
                                        <div className="border-b border-zinc-400 w-32 mx-auto mb-1" />
                                        <p className="text-[11px] font-bold text-zinc-500">{sig.name || 'التوقيع'}</p>
                                    </div>
                                ))}

                                {design.show_stamp !== false && (
                                    <div className="text-center min-w-[85px]">
                                        {stampUrl ? (
                                            <img src={stampUrl} alt="ختم المدرسة" className="w-20 h-20 object-contain mx-auto opacity-85" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-300 flex items-center justify-center mx-auto text-[10px] font-bold text-zinc-400">
                                                الختم الرسمي
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
