import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import { School, CheckCircle2, User, BookOpen, GraduationCap, Calendar, ShieldCheck } from 'lucide-react';

const weekNames = [
    'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس',
    'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
    'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر'
];

const getWeekName = (index, template = null) => {
    return weekNames[index] || `الأسبوع ${index + 1}`;
};

const toArabicNumerals = (str) => {
    if (!str) return '';
    return str.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
};

const formatGregorian = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return toArabicNumerals(dateStr);
        return d.toLocaleDateString('ar-EG', { calendar: 'gregory', day: 'numeric', month: 'short' });
    } catch {
        return toArabicNumerals(dateStr);
    }
};

const formatHijri = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split(/[-/.]/);
    if (parts.length >= 3) {
        if (parts[0].length === 4) return toArabicNumerals(`${parts[2]}-${parts[1]}`);
        if (parts[2].length === 4) return toArabicNumerals(`${parts[0]}-${parts[1]}`);
    }
    return toArabicNumerals(dateStr);
};

const getWeekDate = (index, template = null) => {
    if (template && template.weeks && template.weeks[index]) {
        const w = template.weeks[index];
        let parts = [];
        if (w.start_date_gregorian || w.end_date_gregorian) {
            parts.push(`${formatGregorian(w.start_date_gregorian)} إلى ${formatGregorian(w.end_date_gregorian)} (م)`);
        }
        if (w.start_date_hijri || w.end_date_hijri) {
            parts.push(`${formatHijri(w.start_date_hijri)} إلى ${formatHijri(w.end_date_hijri)} (هـ)`);
        }
        return parts.join(' | ');
    }
    return '';
};

// This component is designed to be rendered specifically for PDF generation (A4 dimensions).
// It's wrapped in a forwardRef if needed, or simply passed an ID to be captured by html2pdf.
export const StudyPlanPdfTemplate = forwardRef(({ plan }, ref) => {
    if (!plan) return null;

    // A4 dimensions at 96 DPI: ~794px width, 1123px height. We use standard tailwind classes.
    return (
        <div 
            ref={ref}
            id={`pdf-export-plan-${plan.id}`} 
            className="font-cairo overflow-hidden relative"
            style={{ width: '297mm', minHeight: '210mm', padding: '15mm', margin: '0 auto', direction: 'rtl', backgroundColor: '#ffffff', color: '#1e293b' }}
        >
            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                <span className="text-[200px] font-black rotate-45 select-none" style={{ color: '#0f172a' }}>SMART SCHOOL</span>
            </div>

            <div className="relative z-10 h-full flex flex-col">
                
                {/* Premium Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '2px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <img src={`${window.location.origin}/images/school_logo.png`} crossOrigin="anonymous" alt="شعار المدرسة" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>مدارس القيم الأهلية</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                                <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#3b82f6', margin: 0 }}>{plan.title}</h2>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>رمز التحقق للوثيقة</div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', fontFamily: 'monospace' }}>#{String(plan.id).padStart(5, '0')}</div>
                        </div>
                        <div style={{ padding: '8px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                            <QRCode value={plan.verification_url || window.location.origin} size={64} fgColor="#0f172a" />
                        </div>
                    </div>
                </div>

                {/* Premium Metadata Cards */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                    {/* Teacher Card */}
                    <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <div style={{ backgroundColor: '#eff6ff', color: '#3b82f6', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>المعلم</div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>{plan.teacher?.name || 'غير محدد'}</div>
                        </div>
                    </div>
                    
                    {/* Subject Card */}
                    <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookOpen size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>المادة الدراسية</div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>{plan.subject?.name || 'غير محدد'}</div>
                        </div>
                    </div>

                    {/* Grade Card */}
                    <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <div style={{ backgroundColor: '#faf5ff', color: '#a855f7', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <GraduationCap size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>الصف الدراسي</div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>{plan.grade?.name || 'غير محدد'}</div>
                        </div>
                    </div>

                    {/* Status Card (Highlighted) */}
                    <div style={{ flex: 1, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.05)' }}>
                        <div style={{ backgroundColor: '#dcfce7', color: '#15803d', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#166534', marginBottom: '4px' }}>الاعتماد الرسمي</div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#15803d' }}>معتمدة وموثقة</div>
                        </div>
                    </div>
                </div>

                {/* Premium Electronic Table */}
                {plan.template && (plan.rows?.length > 0 || (Array.isArray(plan.content) ? plan.content.length > 0 : plan.content?.rows?.length > 0)) && (
                    <div className="flex-grow">
                        <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff' }}>
                                        {plan.template.columns.map((col, idx) => (
                                            <th key={idx} style={{ 
                                                padding: '14px 12px',
                                                textAlign: 'right',
                                                fontWeight: '800',
                                                borderBottom: '3px solid #3b82f6',
                                                borderLeft: idx !== plan.template.columns.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                            }}>
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(plan.rows && plan.rows.length > 0 ? plan.rows.map(r => r.data) : ((plan.content && typeof plan.content === 'object' && !Array.isArray(plan.content)) ? (plan.content.rows || []) : (plan.content || []))).map((row, rowIdx) => (
                                        <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc', transition: 'background-color 0.2s' }}>
                                            {plan.template.columns.map((col, colIdx) => {
                                                let displayValue = row[col.id];
                                                const isMonth = col.label.includes('شهر') || col.label.toLowerCase().includes('month');
                                                const isWeek = col.label.includes('أسبوع') || col.label.includes('الاسبوع') || col.label.toLowerCase().includes('week');
                                                const isDate = col.label.includes('تاريخ') || col.label.includes('فترة') || col.label.includes('زمني');
                                                
                                                if (isMonth && plan.template?.month) {
                                                    displayValue = plan.template.month;
                                                } else if (isWeek) {
                                                    displayValue = getWeekName(rowIdx, plan.template);
                                                } else if (isDate && getWeekDate(rowIdx, plan.template)) {
                                                    displayValue = getWeekDate(rowIdx, plan.template);
                                                }

                                                return (
                                                    <td key={colIdx} style={{ 
                                                        padding: '14px 12px',
                                                        color: '#334155',
                                                        borderBottom: '1px solid #e2e8f0',
                                                        borderLeft: colIdx !== plan.template.columns.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                        verticalAlign: 'top'
                                                    }}>
                                                        {col.type === 'checkbox' ? (
                                                            (displayValue === 'true' || displayValue === true) ? (
                                                                <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: '100px', fontWeight: '900', fontSize: '10px', display: 'inline-block', border: '1px solid #a7f3d0' }}>نعم</span>
                                                            ) : (
                                                                <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '6px 12px', borderRadius: '100px', fontWeight: '900', fontSize: '10px', display: 'inline-block', border: '1px solid #fecaca' }}>لا</span>
                                                            )
                                                        ) : (
                                                            <div style={{ lineHeight: '1.7', fontWeight: '600' }}>{displayValue || ''}</div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Premium Footer Signatures */}
                <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <School size={16} />
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '800' }}>تصدر هذه الوثيقة وتُعتمد آلياً من نظام المدارس الذكية.</p>
                        </div>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', opacity: 0.8 }}>هذه الوثيقة موثقة بالكامل ولا تتطلب توقيعاً حياً، امسح الرمز للتحقق.</p>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', opacity: 0.8, marginTop: '4px' }}>تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '80px' }}>
                        <div style={{ textAlign: 'center', width: '200px' }}>
                            <p style={{ fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '24px' }}>توقيع المعلم المعتمد</p>
                            <div style={{ borderBottom: '2px dashed #cbd5e1', paddingBottom: '12px', position: 'relative' }}>
                                <span className="font-handwriting text-3xl opacity-80" style={{ color: '#0f172a', position: 'relative', top: '10px' }}>{plan.teacher?.name}</span>
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center', width: '200px', position: 'relative' }}>
                            {/* Decorative Stamp Background */}
                            <div style={{ position: 'absolute', opacity: 0.08, top: '-40px', left: '-20px', transform: 'rotate(15deg)' }}>
                                <CheckCircle2 size={140} color="#16a34a" />
                            </div>
                            
                            <p style={{ fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '24px', position: 'relative', zIndex: 10 }}>الاعتماد الأكاديمي (المشرف)</p>
                            <div style={{ borderBottom: '2px dashed #cbd5e1', paddingBottom: '12px', position: 'relative', zIndex: 10 }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f0fdf4', border: '1px solid #22c55e', padding: '6px 14px', borderRadius: '100px', transform: 'rotate(-2deg)' }}>
                                    <CheckCircle2 size={16} color="#15803d" />
                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#15803d' }}>معتمد إلكترونياً</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
