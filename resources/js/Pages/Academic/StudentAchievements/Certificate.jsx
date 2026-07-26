import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Printer, ArrowRight, Award, Star, Medal } from 'lucide-react';

export default function Certificate({ student, gamification, schoolName }) {
    const { logo_url } = usePage().props;
    const logoUrl = logo_url || '/images/logo.png';

    const handlePrint = () => {
        window.print();
    };

    const formattedDate = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const tierName = gamification.current_tier ? gamification.current_tier.name : 'مستوى متميز';

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 print:p-0 print:bg-white" dir="rtl">
            <Head title={`شهادة تميز - ${student.user?.name}`} />

            {/* Print Controls */}
            <div className="flex gap-4 print:hidden z-50 mb-8 w-full max-w-[1123px] justify-end px-4">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-full shadow-md font-bold hover:bg-slate-50 transition-all hover:-translate-x-1"
                >
                    <ArrowRight size={20} />
                    عودة
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-full shadow-lg font-bold hover:bg-primary-700 transition-all shadow-primary-500/30 hover:-translate-y-1"
                >
                    <Printer size={20} />
                    طباعة الشهادة
                </button>
            </div>

            {/* Responsive Wrapper */}
            <div className="w-full flex justify-center items-start print:block print:w-auto pb-16 print:pb-0 overflow-x-hidden">
                
                {/* Certificate Canvas (A4 Landscape) */}
                <div className="certificate-canvas bg-white relative shadow-2xl print:shadow-none mx-auto overflow-hidden flex flex-col justify-between rounded-xl print:rounded-none">
                    
                    {/* 1. Deep Watermark Logo */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <img src={logoUrl} alt="Watermark" className="w-[600px] h-[600px] object-contain grayscale" />
                    </div>

                    {/* 2. Ornate Border System */}
                    <div className="absolute inset-4 border-[10px] border-primary-900 pointer-events-none z-10 opacity-95"></div>
                    <div className="absolute inset-[26px] border-[2px] border-primary-700 pointer-events-none z-10"></div>
                    
                    {/* Corner Accents */}
                    <div className="absolute top-4 right-4 w-10 h-10 border-t-[6px] border-r-[6px] border-white z-20"></div>
                    <div className="absolute top-4 left-4 w-10 h-10 border-t-[6px] border-l-[6px] border-white z-20"></div>
                    <div className="absolute bottom-4 right-4 w-10 h-10 border-b-[6px] border-r-[6px] border-white z-20"></div>
                    <div className="absolute bottom-4 left-4 w-10 h-10 border-b-[6px] border-l-[6px] border-white z-20"></div>

                    {/* Top Header Section */}
                    <div className="relative z-30 px-16 pt-12 flex justify-between items-start w-full">
                        <div className="text-right flex flex-col gap-1 w-72">
                            <h3 className="font-black text-xl text-primary-900">المملكة العربية السعودية</h3>
                            <h4 className="font-bold text-base text-primary-800">وزارة التعليم</h4>
                            <div className="w-12 h-1 bg-primary-500 my-1"></div>
                            <h4 className="font-bold text-base text-slate-800">مدارس القيم الأهلية</h4>
                            <h4 className="font-semibold text-[10px] text-slate-500 tracking-widest font-sans uppercase">Al-Qiyam Civil Schools</h4>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center -mt-2">
                            <div className="w-32 h-32 bg-white p-2 rounded-2xl shadow-xl border-4 border-primary-100 flex items-center justify-center relative">
                                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain relative z-10" />
                            </div>
                        </div>

                        <div className="text-left flex flex-col gap-1 w-72 items-end">
                            <h3 className="font-black text-xl text-primary-900">إدارة التوجيه والإرشاد</h3>
                            <h4 className="font-bold text-base text-primary-800">برنامج التميز السلوكي</h4>
                            <div className="w-12 h-1 bg-primary-500 my-1"></div>
                            <h4 className="font-bold text-base text-slate-800">تاريخ الإصدار</h4>
                            <h4 className="font-semibold text-base text-primary-600 font-sans">{formattedDate}</h4>
                        </div>
                    </div>

                    {/* Main Body */}
                    <div className="relative z-30 flex-grow flex flex-col items-center justify-center px-12 text-center mt-2">
                        
                        {/* Certificate Title */}
                        <div className="mb-6 relative">
                            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary-700 via-primary-900 to-primary-700 tracking-tight relative z-10 leading-none" style={{ fontFamily: 'Aref Ruqaa, serif' }}>
                                شَهَادَةُ شُكْرٍ وَتَقْدِير
                            </h1>
                            <div className="flex items-center justify-center gap-4 mt-4">
                                <div className="h-px bg-gradient-to-r from-transparent to-primary-400 w-32"></div>
                                <Star className="text-primary-500 fill-primary-500" size={16} />
                                <Star className="text-primary-700 fill-primary-700" size={20} />
                                <Star className="text-primary-500 fill-primary-500" size={16} />
                                <div className="h-px bg-gradient-to-l from-transparent to-primary-400 w-32"></div>
                            </div>
                        </div>

                        <p className="text-2xl text-slate-800 leading-relaxed font-bold mb-4">
                            بكل فخر واعتزاز، تشهد إدارة المدرسة بأن الطالب/ة المتميز/ة:
                        </p>
                        
                        {/* Student Name */}
                        <div className="mb-6 w-full max-w-3xl relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-50 to-transparent opacity-80"></div>
                            <h2 className="text-5xl font-black text-primary-900 py-4 border-y-4 border-double border-primary-300 relative z-10">
                                {student.user?.name}
                            </h2>
                        </div>
                        
                        <p className="text-2xl text-slate-700 leading-relaxed max-w-4xl">
                            المقيد في الصف <span className="font-black text-primary-900 bg-primary-50 px-2 mx-1 rounded">{(student.current_enrollment || student.currentEnrollment)?.division?.grade?.name}</span> شعبة <span className="font-black text-primary-900 bg-primary-50 px-2 mx-1 rounded">{(student.current_enrollment || student.currentEnrollment)?.division?.name}</span>،<br/>
                            قد أثبت تفوقاً وتميزاً استثنائياً في السلوك والأداء، محققاً الجدارة بجمع <span className="font-black text-primary-900 bg-primary-100 px-3 py-1 rounded-lg border border-primary-200 mx-1">{gamification.total_points}</span> نقطة،<br/>
                            مما أهله للارتقاء إلى مستوى <span className="font-black text-primary-900 px-2 mx-1 border-b-4 border-primary-500">{tierName}</span> بامتياز.
                        </p>
                        
                        <p className="text-xl text-slate-500 mt-6 font-semibold">
                            سائلين المولى عز وجل له دوام التوفيق والنجاح، وأن يكون قدوة حسنة لزملائه.
                        </p>
                    </div>

                    {/* Signatures & Stamp */}
                    <div className="relative z-30 px-24 pb-12 flex justify-between items-end w-full">
                        <div className="text-center w-64">
                            <h3 className="font-bold text-xl text-primary-900 mb-8">الموجه الطلابي / رائد النشاط</h3>
                            <div className="w-full h-0.5 bg-slate-400"></div>
                        </div>
                        
                        {/* Official Seal / Stamp */}
                        {gamification.current_tier && (
                            <div className="relative -mt-8 z-40 transform hover:scale-105 transition-transform">
                                {/* Outer Seal */}
                                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary-500 to-primary-800 p-2 shadow-xl flex items-center justify-center relative">
                                    {/* Ribbed edge effect */}
                                    <div className="absolute inset-0 rounded-full" style={{ background: 'repeating-conic-gradient(from 0deg, transparent 0deg 5deg, rgba(0,0,0,0.15) 5deg 10deg)' }}></div>
                                    {/* Inner circle */}
                                    <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center border-[3px] border-primary-700 border-double relative z-10 p-2">
                                        <div className="absolute top-2 w-full text-center">
                                            <span className="text-[9px] font-bold text-primary-800/60 uppercase tracking-widest font-sans">Official Seal</span>
                                        </div>
                                        <div className={`mt-2 mb-1 flex justify-center text-primary-600`}>
                                            <Medal size={48} strokeWidth={1.2} />
                                        </div>
                                        <div className="text-lg font-black text-primary-900 tracking-wider">ختم التميز</div>
                                        <div className="absolute bottom-3 w-full text-center px-4">
                                            <div className="h-px w-full bg-primary-200 mb-1"></div>
                                            <span className="text-[9px] font-bold text-primary-800/80 leading-none block truncate">{schoolName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="text-center w-64">
                            <h3 className="font-bold text-xl text-primary-900 mb-8">مدير المدرسة</h3>
                            <div className="w-full h-0.5 bg-slate-400"></div>
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
                .certificate-canvas {
                    width: 1123px;
                    height: 794px;
                    transform-origin: top center;
                }
                
                @media screen and (max-width: 1150px) {
                    .certificate-canvas {
                        transform: scale(calc((100vw - 2rem) / 1123));
                        margin-bottom: calc(-794px * (1 - ((100vw - 2rem) / 1123)));
                    }
                }

                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                    body {
                        background-color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .certificate-canvas {
                        transform: none !important;
                        width: 100% !important;
                        height: 100vh !important;
                        max-width: 1123px;
                        max-height: 794px;
                        margin: 0 !important;
                        page-break-after: always;
                    }
                }
            `}</style>
        </div>
    );
}
