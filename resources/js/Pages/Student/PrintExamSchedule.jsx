import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import { Clock, MapPin, BookOpen } from 'lucide-react';

export default function PrintExamSchedule({ examSchedule, student }) {
    dayjs.locale('ar');

    const items = examSchedule.items || [];

    useEffect(() => {
        // Automatically open print dialog after a short delay
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-white" dir="rtl">
            <Head title={`طباعة جدول الاختبارات - ${student ? student.name_ar : 'الطالب'}`} />
            
            <style>
                {`
                    @media print {
                        @page { size: A4 portrait; margin: 15mm; }
                        body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none !important; }
                    }
                `}
            </style>

            <div className="max-w-[210mm] mx-auto p-8 relative print:p-0">
                {/* Watermark Logo */}
                <div className="fixed inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
                    <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                    </svg>
                </div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8 border-b-2 border-slate-800 pb-4">
                        <div className="text-right">
                            <h1 className="text-2xl font-black text-slate-900 mb-1">إشعار جدول اختبارات</h1>
                            <h2 className="text-lg font-bold text-slate-700">{examSchedule.title}</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {examSchedule.period?.semester?.academicYear?.name} - {examSchedule.period?.semester?.name}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-300 mx-auto mb-2">
                                <span className="font-bold text-slate-400 text-[10px]">الشعار</span>
                            </div>
                            <p className="font-bold text-xs text-slate-800">إدارة المدرسة</p>
                        </div>
                        <div className="text-left space-y-2">
                            <p className="text-sm font-bold text-slate-700">تاريخ الإصدار: {dayjs().format('YYYY/MM/DD')}</p>
                            {student && (
                                <div className="bg-slate-100 p-2 rounded border border-slate-300 inline-block text-right">
                                    <p className="text-xs font-bold text-slate-800">اسم الطالب: {student.name_ar}</p>
                                    <p className="text-xs font-bold text-slate-600">الرقم الأكاديمي: {student.academic_number}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Guidelines / Important Notes (Optional) */}
                    <div className="mb-6 p-4 bg-slate-50 border border-slate-300 rounded-lg">
                        <h3 className="font-bold text-slate-800 mb-2 text-sm">تعليمات هامة للطالب:</h3>
                        <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                            <li>يُرجى التواجد في قاعة الاختبار قبل الموعد بـ 15 دقيقة على الأقل.</li>
                            <li>يُمنع اصطحاب الهواتف المحمولة أو الأجهزة الذكية إلى قاعة الاختبار.</li>
                            <li>تأكد من إحضار أدواتك الشخصية، حيث يمنع استعارة الأدوات أثناء الاختبار.</li>
                            <li>الالتزام بالزي المدرسي الرسمي أثناء تأدية الاختبارات.</li>
                        </ul>
                    </div>

                    {/* Schedule List */}
                    <div className="border-2 border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border-b-2 border-l-2 border-slate-800 p-3 font-black text-slate-800 w-1/4">اليوم / التاريخ</th>
                                    <th className="border-b-2 border-l-2 border-slate-800 p-3 font-black text-slate-800 w-1/4">المادة</th>
                                    <th className="border-b-2 border-l-2 border-slate-800 p-3 font-black text-slate-800 w-1/4">الوقت والقاعة</th>
                                    <th className="border-b-2 border-slate-800 p-3 font-black text-slate-800 w-1/4">المقرر</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500 font-bold">
                                            لا توجد اختبارات مجدولة لك حالياً.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, idx) => (
                                        <tr key={item.id || idx} className="border-b border-slate-300 last:border-b-0 break-inside-avoid">
                                            <td className="border-l border-slate-300 p-3 align-top bg-slate-50/50">
                                                <div className="font-bold text-slate-800">{dayjs(item.exam_date).format('dddd')}</div>
                                                <div className="text-sm text-slate-600">{dayjs(item.exam_date).format('YYYY/MM/DD')}</div>
                                            </td>
                                            <td className="border-l border-slate-300 p-3 align-top">
                                                <div className="font-bold text-slate-900">{item.subject?.name}</div>
                                            </td>
                                            <td className="border-l border-slate-300 p-3 align-top">
                                                {(item.start_time || item.end_time) && (
                                                    <div className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-1">
                                                        <Clock size={12} className="text-slate-500" />
                                                        {item.start_time ? item.start_time.substring(0, 5) : '?'} - {item.end_time ? item.end_time.substring(0, 5) : '?'}
                                                    </div>
                                                )}
                                                {item.room && (
                                                    <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                                                        <MapPin size={12} className="text-slate-500" />
                                                        {item.room}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 align-top">
                                                {item.syllabus ? (
                                                    <div className="text-xs text-slate-700 flex gap-1">
                                                        <BookOpen size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                                        <span className="whitespace-pre-line">{item.syllabus}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">--</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="mt-16 flex justify-between items-end pt-8 border-t-2 border-slate-800 break-inside-avoid">
                        <div className="text-center w-48">
                            <h3 className="font-bold text-slate-700 mb-6">ختم المدرسة</h3>
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 mx-auto flex items-center justify-center">
                                <span className="text-slate-300 text-xs">موضع الختم</span>
                            </div>
                        </div>
                        <div className="text-center w-48">
                            <h3 className="font-bold text-slate-700 mb-6">مع تمنياتنا لكم بالتوفيق والنجاح</h3>
                        </div>
                        <div className="text-center w-48">
                            <h3 className="font-bold text-slate-700 mb-6">يعتمد، مدير المدرسة</h3>
                            <div className="border-b border-dashed border-slate-400 w-full mb-1"></div>
                            <p className="text-xs text-slate-500">التوقيع</p>
                        </div>
                    </div>

                </div>

                <div className="mt-8 text-center no-print pb-8">
                    <button 
                        onClick={() => window.print()}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg"
                    >
                        طباعة / حفظ PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
