import React from 'react';
import QRCode from 'react-qr-code';
import { School, CheckCircle2 } from 'lucide-react';

// This component is designed to be rendered specifically for PDF generation (A4 dimensions).
// It's wrapped in a forwardRef if needed, or simply passed an ID to be captured by html2pdf.
export const StudyPlanPdfTemplate = React.forwardRef(({ plan }, ref) => {
    if (!plan) return null;

    // A4 dimensions at 96 DPI: ~794px width, 1123px height. We use standard tailwind classes.
    return (
        <div 
            ref={ref}
            id={`pdf-export-plan-${plan.id}`} 
            className="bg-white text-slate-800 font-cairo overflow-hidden relative"
            style={{ width: '210mm', minHeight: '297mm', padding: '15mm', margin: '0 auto', direction: 'rtl' }}
        >
            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                <School size={600} />
            </div>

            <div className="relative z-10 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-primary-600 pb-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100">
                            <School size={40} className="text-primary-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">نظام المدارس الذكية</h1>
                            <h2 className="text-primary-600 font-bold text-lg mt-1">الخطة الدراسية المعتمدة (توزيع المنهج)</h2>
                        </div>
                    </div>
                    <div className="text-left flex flex-col items-end">
                        <div className="text-xs font-bold text-slate-500 mb-1">رمز التحقق (QR)</div>
                        <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <QRCode value={plan.verification_url || window.location.origin} size={70} />
                        </div>
                    </div>
                </div>

                {/* Plan Metadata */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
                    <h3 className="text-xl font-black text-slate-800 mb-4">{plan.title}</h3>
                    <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                            <span className="block text-slate-500 font-bold mb-1">المعلم:</span>
                            <span className="font-black text-slate-800">{plan.teacher?.name || 'غير محدد'}</span>
                        </div>
                        <div>
                            <span className="block text-slate-500 font-bold mb-1">المادة:</span>
                            <span className="font-black text-slate-800">{plan.subject?.name || 'غير محدد'}</span>
                        </div>
                        <div>
                            <span className="block text-slate-500 font-bold mb-1">الصف:</span>
                            <span className="font-black text-slate-800">{plan.grade?.name || 'غير محدد'}</span>
                        </div>
                        <div>
                            <span className="block text-slate-500 font-bold mb-1">تاريخ الرفع:</span>
                            <span className="font-black text-slate-800" dir="ltr">
                                {new Date(plan.created_at).toLocaleDateString('ar-EG')}
                            </span>
                        </div>
                        <div>
                            <span className="block text-slate-500 font-bold mb-1">حالة الخطة:</span>
                            <span className="font-black text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={16} /> معتمدة رسمياً
                            </span>
                        </div>
                        <div>
                            <span className="block text-slate-500 font-bold mb-1">الرقم المرجعي:</span>
                            <span className="font-black text-slate-800">#{plan.id}</span>
                        </div>
                    </div>
                </div>

                {/* Electronic Table Content */}
                {plan.template && plan.content && (Array.isArray(plan.content) ? plan.content.length > 0 : plan.content?.rows?.length > 0) && (
                    <div className="flex-grow">
                        <table className="w-full border-collapse border border-slate-300 text-sm">
                            <thead>
                                <tr className="bg-primary-600 text-white">
                                    {plan.template.columns.map((col, idx) => (
                                        <th key={idx} className="border border-primary-700 px-3 py-2 text-right font-bold">
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {((plan.content && typeof plan.content === 'object' && !Array.isArray(plan.content)) ? (plan.content.rows || []) : (plan.content || [])).map((row, rowIdx) => (
                                    <tr key={rowIdx} className="even:bg-slate-50">
                                        {plan.template.columns.map((col, colIdx) => (
                                            <td key={colIdx} className="border border-slate-300 px-3 py-2 text-slate-700">
                                                {col.type === 'checkbox' 
                                                    ? (row[col.id] === 'true' || row[col.id] === true ? 'نعم' : 'لا') 
                                                    : (row[col.id] || '')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer Signatures */}
                <div className="mt-12 pt-8 border-t border-slate-200 flex items-start justify-between">
                    <div className="text-center w-48">
                        <p className="font-bold text-slate-600 mb-6">توقيع المعلم</p>
                        <div className="border-b border-dashed border-slate-400 pb-2">
                            <span className="font-handwriting text-2xl text-slate-800 opacity-80">{plan.teacher?.name}</span>
                        </div>
                    </div>
                    <div className="text-center w-48">
                        <div className="absolute opacity-20 -mt-8 -ml-8 rotate-12">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Approved_stamp.svg/1200px-Approved_stamp.svg.png" className="w-24 h-24 grayscale" alt="Approved" style={{filter: 'hue-rotate(200deg)'}}/>
                        </div>
                        <p className="font-bold text-slate-600 mb-6">اعتماد المشرف التربوي</p>
                        <div className="border-b border-dashed border-slate-400 pb-2 relative z-10">
                            <span className="font-bold text-emerald-600">تم الاعتماد إلكترونياً</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-slate-400">
                    <p>هذا المستند تم إصداره آلياً من نظام المدارس الذكية ويعتبر وثيقة رسمية.</p>
                    <p>يمكن التحقق من صحة المستند عبر مسح رمز الاستجابة السريعة (QR Code) المرفق.</p>
                </div>
            </div>
        </div>
    );
});
