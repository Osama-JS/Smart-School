import React, { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import { Clock, MapPin, Users, CheckCircle } from 'lucide-react';

export default function PrintMyExamSchedule({ schedule }) {
    dayjs.locale('ar');
    const { logo_url, auth } = usePage().props;
    const schoolName = auth?.user?.branch?.name || 'المدارس الذكية';
    const teacherName = auth?.user?.name || 'المعلم';

    // Group items by date
    const itemsByDate = {};
    const localItems = schedule.items || [];
    
    localItems.forEach(item => {
        if (!itemsByDate[item.exam_date]) {
            itemsByDate[item.exam_date] = [];
        }
        itemsByDate[item.exam_date].push(item);
    });

    const dates = Object.keys(itemsByDate).sort((a, b) => new Date(a) - new Date(b));

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-white" dir="rtl">
            <Head title={`طباعة مهام المراقبة - ${schedule.title}`} />
            
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
                {logo_url ? (
                    <div className="fixed inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                        <img src={logo_url} alt="Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
                    </div>
                ) : (
                    <div className="fixed inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
                        <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                        </svg>
                    </div>
                )}

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 border-b-[3px] border-primary-600 pb-6 relative">
                        <div className="absolute bottom-0 left-0 w-1/3 h-[3px] bg-slate-200"></div>
                        <div className="text-right">
                            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-primary-800 to-primary-600 mb-2">إشعار مهام مراقبة اختبارات</h1>
                            <h2 className="text-xl font-black text-slate-800 mb-1">{schedule.title}</h2>
                            <h3 className="text-lg font-bold text-slate-600">المعلم المكلف: <span className="text-primary-600">{teacherName}</span></h3>
                            <p className="text-sm font-bold text-slate-500 mt-2 bg-slate-100 px-3 py-1 rounded-md inline-block">
                                {schedule.period?.semester?.academicYear?.name} - {schedule.period?.semester?.name}
                            </p>
                        </div>
                        <div className="text-center flex flex-col items-center">
                            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3 overflow-hidden border border-slate-200">
                                {logo_url ? (
                                    <img src={logo_url} alt="شعار المدرسة" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="text-primary-600">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                                    </div>
                                )}
                            </div>
                            <h3 className="font-black text-base text-slate-800 tracking-wide leading-tight">{schoolName}</h3>
                            <p className="font-bold text-[10px] text-slate-500 tracking-wide mt-1">الشؤون الأكاديمية والتقييم</p>
                        </div>
                        <div className="text-left flex flex-col justify-end h-full mt-2 space-y-2 text-xs font-bold text-slate-600">
                            <div className="flex items-center justify-end gap-2">
                                <span>تاريخ الإصدار:</span>
                                <span className="text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200">{dayjs().format('YYYY/MM/DD')}</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <span>رقم الجدول:</span>
                                <span className="text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200">#{schedule.id.toString().padStart(5, '0')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm font-bold">
                        <p className="flex items-center gap-2">
                            <CheckCircle size={16} />
                            يرجى التواجد في قاعات الاختبار المحددة قبل موعد بدء الاختبار بـ 15 دقيقة على الأقل، واستلام كشوفات وأوراق الإجابة من لجنة الكنترول.
                        </p>
                    </div>

                    {/* Schedule List */}
                    <div className="space-y-6">
                        {dates.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 font-bold bg-slate-50 rounded-xl border border-slate-200">
                                لا توجد مهام مراقبة مسندة إليك في هذا الجدول.
                            </div>
                        ) : (
                            dates.map((date) => (
                                <div key={date} className="border border-slate-300 rounded-xl overflow-hidden break-inside-avoid shadow-sm">
                                    <div className="bg-primary-600 px-4 py-3 flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-lg text-white">
                                            <Clock size={20} />
                                        </div>
                                        <div className="text-white">
                                            <div className="font-black text-lg">{dayjs(date).format('dddd، D MMMM YYYY')}</div>
                                        </div>
                                    </div>
                                    
                                    <table className="w-full text-right border-collapse bg-white">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="p-3 font-bold text-slate-700 w-1/3">المادة والصف</th>
                                                <th className="p-3 font-bold text-slate-700 w-1/4 text-center">وقت المراقبة</th>
                                                <th className="p-3 font-bold text-slate-700 w-1/4 text-center">القاعة</th>
                                                <th className="p-3 font-bold text-slate-700">زملاء اللجنة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsByDate[date].map((item, idx) => {
                                                // Filter out the current teacher from the proctors list for "Colleagues" column
                                                const colleagues = item.proctors?.filter(p => p.name !== teacherName) || [];
                                                
                                                return (
                                                    <tr key={item.id} className={idx !== itemsByDate[date].length - 1 ? 'border-b border-slate-100' : ''}>
                                                        <td className="p-4 align-middle">
                                                            <div className="font-black text-slate-800">{item.subject?.name}</div>
                                                            <div className="font-bold text-slate-500 text-sm mt-1">{item.division?.grade?.name} - {item.division?.name}</div>
                                                        </td>
                                                        <td className="p-4 align-middle text-center">
                                                            <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-700" dir="ltr">
                                                                <Clock size={14} className="text-primary-500" />
                                                                {item.start_time ? item.start_time.substring(0, 5) : '?'} - {item.end_time ? item.end_time.substring(0, 5) : '?'}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 align-middle text-center">
                                                            {item.room ? (
                                                                <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 font-bold text-indigo-700">
                                                                    <MapPin size={14} />
                                                                    {item.room}
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400 font-medium">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 align-middle">
                                                            {colleagues.length > 0 ? (
                                                                <div className="flex flex-col gap-1">
                                                                    {colleagues.map(p => (
                                                                        <div key={p.id} className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                                                                            <Users size={12} className="text-slate-400" />
                                                                            {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400 text-sm font-medium text-center block">بمفردك</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer / Signatures */}
                    <div className="mt-16 flex justify-between items-start pt-8 break-inside-avoid">
                        <div className="text-center w-64">
                            <h3 className="font-black text-slate-800 mb-12 text-lg">استلام المعلم المكلف</h3>
                            <div className="border-b-2 border-slate-300 w-full mb-2"></div>
                            <p className="text-sm font-bold text-slate-500">التوقيع / {teacherName}</p>
                        </div>
                        <div className="text-center w-64">
                            <h3 className="font-black text-slate-800 mb-6 text-lg">الختم الرسمي</h3>
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-primary-200 mx-auto flex items-center justify-center bg-primary-50/30">
                                <span className="text-primary-300/80 font-bold text-sm">موضع الختم</span>
                            </div>
                        </div>
                        <div className="text-center w-64">
                            <h3 className="font-black text-slate-800 mb-12 text-lg">لجنة الاختبارات والكنترول</h3>
                            <div className="border-b-2 border-slate-300 w-full mb-2"></div>
                            <p className="text-sm font-bold text-slate-500">الاسم والتوقيع</p>
                        </div>
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
                <p className="text-sm text-slate-500 mt-3">يُفضل تفعيل خيار "Background graphics" في إعدادات الطباعة للحصول على أفضل نتيجة.</p>
            </div>
        </div>
    );
}
