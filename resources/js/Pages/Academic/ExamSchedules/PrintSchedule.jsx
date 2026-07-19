import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import { Clock, MapPin, Users } from 'lucide-react';

export default function PrintSchedule({ examSchedule, grades, settings = {} }) {
    dayjs.locale('ar');

    // Group items by date and grade
    const localItems = examSchedule.items || [];
    
    // Extract unique dates
    const dates = [...new Set(localItems.map(i => i.exam_date))].sort((a, b) => new Date(a) - new Date(b));

    const getGroupedItemsForCell = (date, gradeId) => {
        const itemsInCell = localItems.filter(i => i.exam_date === date && i.division?.grade_id === gradeId);
        const groups = {};
        itemsInCell.forEach(item => {
            const proctorIds = item.proctors ? item.proctors.map(p => p.id).join(',') : '';
            const key = `${item.subject_id}_${item.start_time}_${item.end_time}_${item.room}_${proctorIds}_${item.syllabus}`;
            if (!groups[key]) {
                groups[key] = {
                    subject_name: item.subject?.name,
                    start_time: item.start_time ? item.start_time.substring(0, 5) : '',
                    end_time: item.end_time ? item.end_time.substring(0, 5) : '',
                    room: item.room,
                    proctors: item.proctors || [],
                    syllabus: item.syllabus,
                    items: []
                };
            }
            groups[key].items.push(item);
        });
        return Object.values(groups);
    };

    useEffect(() => {
        // Automatically open print dialog after a short delay to ensure rendering
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-white" dir="rtl">
            <Head title={`طباعة جدول - ${examSchedule.title}`} />
            
            <style>
                {`
                    @media print {
                        @page { size: A4 landscape; margin: 15mm; }
                        body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none !important; }
                        .page-break { page-break-before: always; }
                    }
                `}
            </style>

            <div className="max-w-[297mm] mx-auto p-8 relative print:p-0">
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
                            <h1 className="text-3xl font-black text-slate-900 mb-2">جدول الاختبارات الرسمية</h1>
                            <h2 className="text-xl font-bold text-slate-700">{examSchedule.title}</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {examSchedule.period?.semester?.academicYear?.name} - {examSchedule.period?.semester?.name}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-300 mx-auto mb-2">
                                <span className="font-bold text-slate-400 text-xs">الشعار</span>
                            </div>
                            <p className="font-bold text-sm text-slate-800">إدارة المدرسة</p>
                        </div>
                        <div className="text-left space-y-1 text-sm font-bold text-slate-700">
                            <p>تاريخ الاعتماد: {dayjs(examSchedule.updated_at).format('YYYY/MM/DD')}</p>
                            <p>رقم الجدول: #{examSchedule.id}</p>
                        </div>
                    </div>

                    {/* Matrix Grid */}
                    <div className="overflow-hidden border-2 border-slate-800 rounded-lg">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr>
                                    <th className="bg-slate-100 border-b-2 border-l-2 border-slate-800 p-4 font-black text-slate-800 w-48 shadow-sm">
                                        اليوم / التاريخ
                                    </th>
                                    {grades.map(grade => (
                                        <th key={grade.id} className="bg-slate-50 border-b-2 border-l-2 last:border-l-0 border-slate-800 p-4 font-black text-slate-800 text-center shadow-sm">
                                            {grade.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dates.length === 0 ? (
                                    <tr>
                                        <td colSpan={grades.length + 1} className="p-8 text-center text-slate-500 font-bold">
                                            لا توجد اختبارات مجدولة
                                        </td>
                                    </tr>
                                ) : (
                                    dates.map(date => (
                                        <tr key={date} className="border-b-2 last:border-b-0 border-slate-800 break-inside-avoid">
                                            {/* Date Column */}
                                            <td className="bg-slate-50 border-l-2 border-slate-800 p-4 align-top w-48 shadow-sm">
                                                <div className="font-black text-slate-800 text-lg mb-1">{dayjs(date).format('dddd')}</div>
                                                <div className="font-bold text-slate-500 text-sm">{dayjs(date).format('YYYY/MM/DD')}</div>
                                            </td>

                                            {/* Grade Cells */}
                                            {grades.map(grade => {
                                                const groups = getGroupedItemsForCell(date, grade.id);
                                                return (
                                                    <td key={grade.id} className="border-l-2 last:border-l-0 border-slate-800 p-3 align-top bg-white">
                                                        <div className="flex flex-col gap-3">
                                                            {groups.length === 0 ? (
                                                                <div className="text-slate-300 text-center py-2 font-bold text-sm">--</div>
                                                            ) : (
                                                                groups.map((group, idx) => (
                                                                    <div key={idx} className="bg-slate-100 rounded-lg p-3 border border-slate-300">
                                                                        <h4 className="font-extrabold text-slate-900 text-sm mb-2">{group.subject_name}</h4>
                                                                        
                                                                        <div className="flex flex-col gap-1.5 bg-white px-2 py-1.5 rounded-md border border-slate-200">
                                                                            {settings?.showTimes !== false && (group.start_time || group.end_time) && (
                                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                                                    <Clock size={12} className="text-slate-500" />
                                                                                    {group.start_time || '?'} - {group.end_time || '?'}
                                                                                </div>
                                                                            )}
                                                                            {settings?.showRooms !== false && group.room && (
                                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                                                    <MapPin size={12} className="text-slate-500" />
                                                                                    {group.room}
                                                                                </div>
                                                                            )}
                                                                            {settings?.showProctors !== false && group.proctors?.length > 0 && (
                                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mt-0.5">
                                                                                    <Users size={12} className="text-slate-400" />
                                                                                    {group.proctors.map(p => p.name.split(' ')[0]).join('، ')}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {settings?.showSyllabus === true && group.syllabus && (
                                                                            <div className="mt-2 text-[10px] font-bold text-slate-600 line-clamp-2" title={group.syllabus}>
                                                                                <span className="text-slate-400">المقرر:</span> {group.syllabus}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="mt-12 flex justify-between items-start pt-8 border-t-2 border-slate-800 break-inside-avoid">
                        <div className="text-center w-64">
                            <h3 className="font-bold text-slate-700 mb-8">إعداد المشرف الأكاديمي</h3>
                            <div className="border-b border-dashed border-slate-400 w-full mb-2"></div>
                            <p className="text-sm text-slate-500">الاسم والتوقيع</p>
                        </div>
                        <div className="text-center w-64">
                            <h3 className="font-bold text-slate-700 mb-8">ختم المدرسة</h3>
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 mx-auto mb-2 flex items-center justify-center">
                                <span className="text-slate-300 text-xs">موضع الختم</span>
                            </div>
                        </div>
                        <div className="text-center w-64">
                            <h3 className="font-bold text-slate-700 mb-8">يعتمد، مدير المدرسة</h3>
                            <div className="border-b border-dashed border-slate-400 w-full mb-2"></div>
                            <p className="text-sm text-slate-500">الاسم والتوقيع</p>
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
        </div>
    );
}
