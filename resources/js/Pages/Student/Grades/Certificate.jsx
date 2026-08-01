import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, ChevronRight, Award, ShieldCheck } from 'lucide-react';

export default function Certificate({ 
    studentName, 
    studentId, 
    gradeName, 
    semesterName, 
    academicYear, 
    results, 
    totalMarks, 
    maxPossible, 
    percentage, 
    gradeText, 
    qrUrl, 
    issueDate 
}) {

    // Helper to determine the color of the final grade
    const getGradeColor = (text) => {
        if (text === 'ممتاز') return 'text-emerald-600 border-emerald-200 bg-emerald-50';
        if (text === 'جيد جداً') return 'text-indigo-600 border-indigo-200 bg-indigo-50';
        if (text === 'جيد') return 'text-amber-600 border-amber-200 bg-amber-50';
        return 'text-rose-600 border-rose-200 bg-rose-50';
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white flex justify-center py-8 print:py-0 font-sans" dir="rtl">
            <Head title={`شهادة ${studentName} - ${semesterName}`} />

            {/* Print Control Bar (Hidden on print) */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 print:hidden flex items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-slate-200">
                <button 
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-bold"
                >
                    <ChevronRight size={18} />
                    رجوع
                </button>
                <div className="w-px h-6 bg-slate-200"></div>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                    <Printer size={18} />
                    طباعة / حفظ كـ PDF
                </button>
            </div>

            {/* Certificate A4 Canvas */}
            <div className="w-full max-w-[210mm] bg-white shadow-2xl print:shadow-none print:w-full print:h-screen relative overflow-hidden flex flex-col aspect-[1/1.414] mx-4 sm:mx-auto border border-slate-200 print:border-none">
                
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-full h-8 bg-gradient-to-r from-primary-800 via-primary-600 to-primary-800 print:bg-primary-700 [color-adjust:exact] [-webkit-print-color-adjust:exact]"></div>
                
                <div className="absolute -right-32 -top-32 w-96 h-96 bg-primary-50 rounded-full blur-3xl pointer-events-none [color-adjust:exact] [-webkit-print-color-adjust:exact]"></div>
                <div className="absolute -left-32 bottom-20 w-[30rem] h-[30rem] bg-indigo-50/50 rounded-full blur-3xl pointer-events-none [color-adjust:exact] [-webkit-print-color-adjust:exact]"></div>

                {/* Inner Border */}
                <div className="absolute inset-4 sm:inset-8 border-2 border-primary-100 print:border-primary-200 rounded-3xl pointer-events-none z-0"></div>

                <div className="relative z-10 flex flex-col h-full p-10 sm:p-14">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12">
                        <div className="text-right">
                            <h2 className="text-2xl font-black text-primary-900">نظام إدارة التعلم</h2>
                            <h3 className="text-lg font-bold text-slate-500 mt-1">Smart-School Platform</h3>
                        </div>
                        <div className="text-center px-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-2xl flex items-center justify-center border-4 border-white shadow-sm mx-auto mb-3">
                                <Award size={36} className="text-primary-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-400">وثيقة رسمية</span>
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-600">العام الدراسي: {academicYear}</p>
                            <p className="text-sm font-bold text-slate-600 mt-1">تاريخ الإصدار: <span dir="ltr">{issueDate}</span></p>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-12 relative">
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-800 mb-4 tracking-tight">شهادة نهاية الفصل الدراسي</h1>
                        <div className="inline-block bg-primary-50 text-primary-700 px-6 py-2 rounded-full font-bold text-lg border border-primary-100 [color-adjust:exact] [-webkit-print-color-adjust:exact]">
                            {semesterName}
                        </div>
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-2 gap-6 mb-10 p-6 bg-slate-50/80 rounded-2xl border border-slate-100 [color-adjust:exact] [-webkit-print-color-adjust:exact]">
                        <div>
                            <p className="text-sm font-bold text-slate-400 mb-1">اسم الطالب</p>
                            <p className="text-xl font-black text-slate-800">{studentName}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 mb-1">الرقم الأكاديمي</p>
                            <p className="text-xl font-bold font-mono text-slate-800">{studentId}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 mb-1">الصف</p>
                            <p className="text-lg font-bold text-slate-700">{gradeName}</p>
                        </div>
                    </div>

                    {/* Grades Table */}
                    <div className="flex-1">
                        <table className="w-full text-right border-collapse mb-8">
                            <thead>
                                <tr className="border-b-2 border-slate-200">
                                    <th className="py-3 px-4 text-sm font-black text-slate-500">المادة الدراسية</th>
                                    <th className="py-3 px-4 text-sm font-black text-slate-500 text-center">أعمال السنة</th>
                                    <th className="py-3 px-4 text-sm font-black text-slate-500 text-center">الاختبار النهائي</th>
                                    <th className="py-3 px-4 text-sm font-black text-slate-800 text-center bg-slate-50 rounded-t-xl [color-adjust:exact] [-webkit-print-color-adjust:exact]">المجموع</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {results.map((res, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="py-4 px-4 font-bold text-slate-800">{res.subject?.name}</td>
                                        <td className="py-4 px-4 text-center font-bold text-slate-600 font-mono">{res.monthly_aggregate}</td>
                                        <td className="py-4 px-4 text-center font-bold text-slate-600 font-mono">{res.final_exam_score}</td>
                                        <td className="py-4 px-4 text-center font-black text-primary-700 font-mono bg-slate-50/50 [color-adjust:exact] [-webkit-print-color-adjust:exact]">{res.semester_total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Final Result & Footer */}
                    <div className="mt-auto pt-8 border-t-2 border-dashed border-slate-200 flex items-end justify-between">
                        
                        {/* QR Code */}
                        <div className="flex flex-col items-center">
                            <div className="w-28 h-28 p-2 bg-white border-2 border-slate-200 rounded-xl shadow-sm mb-2">
                                <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <ShieldCheck size={12} />
                                موثقة إلكترونياً
                            </span>
                        </div>

                        {/* Final Score */}
                        <div className="flex-1 flex justify-center">
                            <div className="text-center px-8 border-r border-l border-slate-200">
                                <p className="text-sm font-bold text-slate-400 mb-2">المجموع الكلي</p>
                                <div className="text-4xl font-black text-slate-800 font-mono mb-1">{totalMarks}</div>
                                <div className="text-sm font-bold text-slate-500">من أصل {maxPossible}</div>
                            </div>
                        </div>

                        {/* Percentage & Grade */}
                        <div className="text-center w-48">
                            <p className="text-sm font-bold text-slate-400 mb-2">النسبة والتقدير</p>
                            <div className="text-3xl font-black text-slate-800 font-mono mb-3" dir="ltr">{percentage}%</div>
                            <div className={`px-4 py-2 rounded-xl border-2 font-black text-lg ${getGradeColor(gradeText)} [color-adjust:exact] [-webkit-print-color-adjust:exact]`}>
                                {gradeText}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
