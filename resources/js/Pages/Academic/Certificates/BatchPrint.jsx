import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, ChevronRight, Trophy, MessageSquare, QrCode, PenTool, FileWarning } from 'lucide-react';
import StudentCertificateSheet from '@/Components/StudentCertificateSheet';

export default function BatchPrint({ certificates = [], division, type = 'semester' }) {
    const [showRank, setShowRank] = useState(true);
    const [showNotes, setShowNotes] = useState(true);
    const [showQr, setShowQr] = useState(true);
    const [showSignatures, setShowSignatures] = useState(true);

    const divisionTitle = division ? `${division.grade?.name || ''} - ${division.name || ''}` : '';

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white py-8 print:py-0 px-3 print:px-0 font-sans" dir="rtl">
            <Head title={`طباعة شهادات ${divisionTitle}`} />

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
                    <span className="text-xs font-black text-slate-700">
                        {divisionTitle} ({certificates.length} شهادة)
                    </span>
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
                    {type === 'monthly' && (
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
                    )}
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
                        التوقيعات
                    </label>
                </div>

                <button
                    type="button"
                    disabled={certificates.length === 0}
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md disabled:opacity-50"
                >
                    <Printer size={15} />
                    طباعة الكل ({certificates.length})
                </button>
            </div>

            {certificates.length === 0 ? (
                <div className="max-w-[210mm] mx-auto bg-white rounded-3xl border border-slate-200 p-14 text-center">
                    <FileWarning size={40} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="text-lg font-black text-slate-700">لا توجد شهادات جاهزة للطباعة</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                        لم يتم رصد درجات لطلاب هذه الشعبة في الفترة المحددة.
                    </p>
                </div>
            ) : (
                <div className="space-y-8 print:space-y-0">
                    {certificates.map((cert, idx) => (
                        <div
                            key={cert.enrollment?.id || idx}
                            className={idx < certificates.length - 1 ? 'break-after-page print:break-after-page' : ''}
                        >
                            <StudentCertificateSheet
                                certificate={cert}
                                isAdminView={true}
                                options={{ showRank, showNotes, showQr, showSignatures }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
