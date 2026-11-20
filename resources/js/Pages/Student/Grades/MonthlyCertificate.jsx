import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, ChevronRight, Download, Trophy, MessageSquare, QrCode, PenTool } from 'lucide-react';
import StudentCertificateSheet from '@/Components/StudentCertificateSheet';

export default function MonthlyCertificate({ certificate, isAdminView = false, pdfUrl = null }) {
    const [showRank, setShowRank] = useState(true);
    const [showNotes, setShowNotes] = useState(true);
    const [showQr, setShowQr] = useState(true);
    const [showSignatures, setShowSignatures] = useState(true);

    const studentName = certificate?.student?.name || '';
    const periodName = certificate?.period?.month_name || '';

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white py-8 print:py-0 px-3 print:px-0 font-sans" dir="rtl">
            <Head title={`شهادة ${studentName} - ${periodName}`} />

            {/* Print Control Bar */}
            <div className="max-w-[210mm] mx-auto mb-6 print:hidden flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-lg border border-slate-200">
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-sm"
                    >
                        <ChevronRight size={18} />
                        رجوع
                    </button>
                    <div className="w-px h-5 bg-slate-200" />
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showRank}
                            onChange={(e) => setShowRank(e.target.checked)}
                            className="rounded border-slate-300 text-primary-600"
                        />
                        <Trophy size={13} className="text-amber-500" />
                        الترتيب
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showNotes}
                            onChange={(e) => setShowNotes(e.target.checked)}
                            className="rounded border-slate-300 text-primary-600"
                        />
                        <MessageSquare size={13} className="text-sky-500" />
                        الملاحظات
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showQr}
                            onChange={(e) => setShowQr(e.target.checked)}
                            className="rounded border-slate-300 text-primary-600"
                        />
                        <QrCode size={13} className="text-indigo-500" />
                        QR
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showSignatures}
                            onChange={(e) => setShowSignatures(e.target.checked)}
                            className="rounded border-slate-300 text-primary-600"
                        />
                        <PenTool size={13} className="text-emerald-600" />
                        التوقيعات والختم
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    {pdfUrl && (
                        <a
                            href={`${pdfUrl}&show_rank=${showRank ? 1 : 0}&show_notes=${showNotes ? 1 : 0}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                            <Download size={15} />
                            تحميل PDF
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md transition-all"
                    >
                        <Printer size={15} />
                        طباعة / حفظ كـ PDF
                    </button>
                </div>
            </div>

            <StudentCertificateSheet
                certificate={certificate}
                isAdminView={isAdminView}
                options={{ showRank, showNotes, showQr, showSignatures }}
            />
        </div>
    );
}
