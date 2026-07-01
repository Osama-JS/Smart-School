import React, { useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Printer, Download, Award, ShieldCheck, CheckCircle, Star } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function Certificate({ achievement }) {
    const certificateRef = useRef(null);
    const { logo_url } = usePage().props;

    const handlePrint = (e) => {
        e.preventDefault();
        window.print();
    };

    const handleDownloadPdf = async (e) => {
        e.preventDefault();
        try {
            const element = certificateRef.current;
            const opt = {
                margin: 0,
                filename: `شهادة_شكر_وتقدير_${achievement.user.name}.pdf`,
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            const pdfWorker = typeof html2pdf === 'function' ? html2pdf() : html2pdf.default();
            await pdfWorker.set(opt).from(element).save();
        } catch (error) {
            console.error("PDF generation error: ", error);
            alert("حدث خطأ: " + (error.message || JSON.stringify(error)));
        }
    };

    return (
        <div className="min-h-screen bg-dark-50 flex flex-col items-center py-12 px-4 print:py-0 print:px-0 print:bg-white font-cairo">
            <Head title={`شهادة تقدير - ${achievement.user.name}`} />

            <div className="mb-8 flex gap-4 no-print relative z-50">
                <button 
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-dark-200 text-dark-700 font-bold rounded-xl hover:bg-dark-50 transition-all shadow-sm hover:shadow cursor-pointer"
                >
                    <Printer size={18} /> طباعة الشهادة
                </button>
                <button 
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow cursor-pointer"
                >
                    <Download size={18} /> تحميل PDF
                </button>
            </div>

            {/* Certificate Container */}
            <div 
                ref={certificateRef}
                className="w-full max-w-[1123px] aspect-[1.414] bg-white relative overflow-hidden shadow-xl print:shadow-none print:w-full print:max-w-none print:h-screen"
                style={{ direction: 'rtl' }}
            >
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 bg-[url('/images/certificate-bg.png')] bg-cover bg-center opacity-5 pointer-events-none"></div>
                
                {/* Elegant Borders - Fixed for html2canvas compatibility */}
                <div className="absolute inset-6 border-[3px] border-[#9DB833] opacity-90 pointer-events-none z-20"></div>
                <div className="absolute inset-[30px] border border-accent-600 opacity-60 pointer-events-none z-20"></div>
                
                {/* Corner Accents */}
                <div className="absolute top-6 right-6 w-12 h-12 border-t-[3px] border-r-[3px] border-accent-600 pointer-events-none z-20 translate-x-[3px] -translate-y-[3px]"></div>
                <div className="absolute top-6 left-6 w-12 h-12 border-t-[3px] border-l-[3px] border-accent-600 pointer-events-none z-20 -translate-x-[3px] -translate-y-[3px]"></div>
                <div className="absolute bottom-6 right-6 w-12 h-12 border-b-[3px] border-r-[3px] border-accent-600 pointer-events-none z-20 translate-x-[3px] translate-y-[3px]"></div>
                <div className="absolute bottom-6 left-6 w-12 h-12 border-b-[3px] border-l-[3px] border-accent-600 pointer-events-none z-20 -translate-x-[3px] translate-y-[3px]"></div>

                {/* Content */}
                <div className="relative z-30 h-full flex flex-col items-center p-16 text-center">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between w-full px-8 mb-6">
                        <div className="text-right flex-1">
                            <h2 className="text-3xl font-black text-[#9DB833] tracking-tight">مدارس القيم الأهلية</h2>
                            <p className="text-[14px] font-black text-[#9DB833] mt-1 uppercase tracking-[0.18em]">ALQIAM CIVIL SCHOOLS</p>
                        </div>
                        <div className="flex-1 flex justify-center">
                            <img src={logo_url || "/images/logo.png"} alt="شعار مدارس القيم" className="w-24 h-24 object-contain" crossOrigin="anonymous" />
                        </div>
                        <div className="text-left flex-1" dir="ltr">
                            <p className="text-xs font-bold text-dark-400 mb-1 uppercase tracking-wider">Date: <span className="text-dark-700">{achievement.achievement_date}</span></p>
                            <p className="text-xs font-bold text-dark-400 uppercase tracking-wider">Ref: <span className="text-dark-700">CR-{achievement.id}</span></p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col justify-center items-center w-full max-w-4xl space-y-8">
                        <h1 className="text-7xl text-[#9DB833] mb-4 drop-shadow-sm" style={{ fontFamily: 'Aref Ruqaa, serif' }}>
                            شَهَادَةُ شُكْرٍ وَتَقْدِير
                        </h1>
                        
                        <p className="text-xl text-dark-600 font-bold tracking-wide">
                            بكل فخر واعتزاز، تتقدم إدارة مدارس القيم الأهلية بوافر الشكر والتقدير إلى:
                        </p>
                        
                        <div className="relative w-full py-4 flex justify-center">
                            <h2 className="text-5xl font-black text-accent-600 relative z-10 px-12 pb-2">
                                {achievement.user.name}
                            </h2>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-accent-600 opacity-30"></div>
                        </div>
                        
                        <div className="space-y-4 pt-2">
                            <p className="text-lg text-dark-600 font-bold">
                                وذلك لتميزهـ/ـا الملحوظ وإنجازهـ/ـا الرائع في:
                            </p>
                            <h3 className="text-3xl font-black text-[#9DB833] bg-primary-50 inline-block px-8 py-3 rounded-full border border-primary-200">
                                {achievement.achievement_type?.name}
                            </h3>
                            
                            {achievement.details && (
                                <p className="text-lg text-dark-500 leading-relaxed max-w-3xl mx-auto mt-4 font-medium">
                                    "{achievement.details}"
                                </p>
                            )}
                        </div>

                        {/* Badges */}
                        <div className="flex items-center justify-center gap-4 pt-6">
                            {achievement.points > 0 && (
                                <div className="flex items-center gap-2 px-6 py-2 bg-dark-50 rounded-full border border-dark-200">
                                    <Star size={18} className="text-accent-600" fill="currentColor" /> 
                                    <span className="font-bold text-dark-700">مكتسب: {achievement.points} نقطة</span>
                                </div>
                            )}
                            {achievement.achievement_type?.reward && (
                                <div className="flex items-center gap-2 px-6 py-2 bg-dark-50 rounded-full border border-dark-200">
                                    <Award size={18} className="text-[#9DB833]" /> 
                                    <span className="font-bold text-dark-700">مكافأة: {achievement.achievement_type.reward}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="w-full px-16 mt-auto pt-10 flex justify-between items-end">
                        <div className="w-64 text-center">
                            <div className="h-20 flex items-end justify-center mb-2">
                                {achievement.employee_signature ? (
                                    <img src={achievement.employee_signature_url} alt="توقيع الموظف" className="h-16 max-w-full object-contain mix-blend-multiply" crossOrigin="anonymous" />
                                ) : (
                                    <span className="text-dark-300 italic text-sm">بانتظار التوقيع</span>
                                )}
                            </div>
                            <div className="w-full h-px bg-dark-300 mb-2"></div>
                            <h4 className="font-bold text-dark-700">المكرّم</h4>
                        </div>

                        {/* Stamp */}
                        <div className="w-40 flex justify-center pb-2 relative">
                            <div className="w-28 h-28 rounded-full border-2 border-primary-200 flex items-center justify-center rotate-[-15deg] bg-white relative">
                                <div className="absolute inset-1 rounded-full border border-primary-200 border-dashed"></div>
                                <div className="text-center">
                                    <img src={logo_url || "/images/logo.png"} alt="ختم" className="w-10 h-10 mx-auto opacity-20 mb-1 grayscale" crossOrigin="anonymous" />
                                    <span className="text-[8px] font-black text-primary-400 block tracking-widest uppercase">Official Seal</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-64 text-center">
                            <div className="h-20 flex items-end justify-center mb-2">
                                {achievement.admin_signature ? (
                                    <img src={achievement.admin_signature_url} alt="توقيع المدير" className="h-16 max-w-full object-contain mix-blend-multiply" crossOrigin="anonymous" />
                                ) : (
                                    <span className="text-dark-300 italic text-sm">بانتظار التوقيع</span>
                                )}
                            </div>
                            <div className="w-full h-px bg-dark-300 mb-2"></div>
                            <h4 className="font-bold text-dark-700">المدير العام</h4>
                            <p className="text-xs text-dark-500 mt-1">{achievement.admin?.name || 'إدارة مدارس القيم الأهلية'}</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Custom Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: landscape; }
                    body { background-color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
}
