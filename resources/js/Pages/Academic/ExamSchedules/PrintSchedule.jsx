import React, { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import { Clock, MapPin, Users } from 'lucide-react';

export default function PrintSchedule({ examSchedule, grades, settings = {} }) {
    dayjs.locale('ar');
    const { logo_url, auth } = usePage().props;
    const schoolName = auth?.user?.branch?.name || 'المدارس الذكية';

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

    // Group grades by section
    const gradesBySection = grades.reduce((acc, grade) => {
        const sectionId = grade.section?.id || 'unassigned';
        const sectionName = grade.section?.name || 'عام';
        if (!acc[sectionId]) {
            acc[sectionId] = { id: sectionId, name: sectionName, grades: [] };
        }
        acc[sectionId].grades.push(grade);
        return acc;
    }, {});
    
    const sections = Object.values(gradesBySection);

    useEffect(() => {
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

            {sections.map((section, sIdx) => (
                <div key={section.id} className={`max-w-[297mm] mx-auto p-8 relative print:p-0 ${sIdx !== sections.length - 1 ? 'mb-16 print:mb-0' : ''}`} style={sIdx !== sections.length - 1 ? { pageBreakAfter: 'always' } : {}}>
                    {/* Watermark Logo */}
                    {logo_url ? (
                        <div className="fixed inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                            <img src={logo_url} alt="Watermark" className="w-[600px] h-[600px] object-contain grayscale" />
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
                                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-primary-800 to-primary-600 mb-2">جدول الاختبارات</h1>
                                <h2 className="text-2xl font-black text-slate-800 mb-1">{examSchedule.title}</h2>
                                <h3 className="text-xl font-bold text-slate-600">{section.name}</h3>
                                <p className="text-base font-bold text-slate-500 mt-2 bg-slate-100 px-3 py-1 rounded-md inline-block">
                                    {examSchedule.period?.semester?.academicYear?.name} - {examSchedule.period?.semester?.name}
                                </p>
                            </div>
                            <div className="text-center flex flex-col items-center">
                                <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 overflow-hidden border border-slate-200">
                                    {logo_url ? (
                                        <img src={logo_url} alt="شعار المدرسة" className="w-full h-full object-contain p-3" />
                                    ) : (
                                        <div className="text-primary-600">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-black text-lg text-slate-800 tracking-wide leading-tight">{schoolName}</h3>
                                <p className="font-bold text-xs text-slate-500 tracking-wide mt-1">الشؤون الأكاديمية والتقييم</p>
                            </div>
                            <div className="text-left flex flex-col justify-end h-full mt-4 space-y-2 text-sm font-bold text-slate-600">
                                <div className="flex items-center justify-end gap-2">
                                    <span>تاريخ الاعتماد:</span>
                                    <span className="text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200">{dayjs(examSchedule.updated_at).format('YYYY/MM/DD')}</span>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <span>رقم الوثيقة:</span>
                                    <span className="text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200">#{examSchedule.id.toString().padStart(5, '0')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Exam Details */}
                        {examSchedule.details && (
                            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg break-inside-avoid">
                                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    📌 تعليمات الاختبار
                                </h3>
                                <div 
                                    className="prose prose-sm max-w-none text-slate-700"
                                    dangerouslySetInnerHTML={{ __html: examSchedule.details }}
                                />
                            </div>
                        )}

                        {/* Matrix Grid */}
                        <div className="overflow-hidden rounded-xl border border-slate-300 shadow-sm">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr>
                                        <th className="bg-primary-600 border-b border-primary-700 p-4 font-black text-white w-48 text-center">
                                            اليوم والتاريخ
                                        </th>
                                        {section.grades.map(grade => (
                                            <th key={grade.id} className="bg-primary-50 border-b border-r border-slate-200 p-4 font-black text-primary-900 text-center">
                                                {grade.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {dates.length === 0 ? (
                                        <tr>
                                            <td colSpan={section.grades.length + 1} className="p-8 text-center text-slate-500 font-bold bg-white">
                                                لا توجد اختبارات مجدولة
                                            </td>
                                        </tr>
                                    ) : (
                                        dates.map((date, index) => (
                                            <tr key={date} className={`break-inside-avoid ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                {/* Date Column */}
                                                <td className="border-b border-slate-200 p-4 align-middle w-48 text-center relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-primary-500"></div>
                                                    <div className="font-black text-slate-800 text-lg">{dayjs(date).format('dddd')}</div>
                                                    <div className="font-bold text-primary-600 text-sm mt-1">{dayjs(date).format('YYYY/MM/DD')}</div>
                                                </td>

                                                {/* Grade Cells */}
                                                {section.grades.map(grade => {
                                                    const groups = getGroupedItemsForCell(date, grade.id);
                                                    return (
                                                        <td key={grade.id} className="border-b border-r border-slate-200 p-3 align-top">
                                                            <div className="flex flex-col gap-3">
                                                                {groups.length === 0 ? (
                                                                    <div className="text-slate-300 text-center py-4 font-bold text-sm">--</div>
                                                                ) : (
                                                                    groups.map((group, idx) => (
                                                                        <div key={idx} className="bg-white rounded-lg p-3 border-r-4 border-primary-500 border-y border-l border-slate-200 shadow-sm relative overflow-hidden">
                                                                            <h4 className="font-extrabold text-slate-900 text-sm mb-2">{group.subject_name}</h4>
                                                                            
                                                                            <div className="flex flex-col gap-1.5 mt-2">
                                                                                {settings?.showTimes !== false && (group.start_time || group.end_time) && (
                                                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1.5 rounded">
                                                                                        <Clock size={12} className="text-primary-500" />
                                                                                        {group.start_time || '?'} - {group.end_time || '?'}
                                                                                    </div>
                                                                                )}
                                                                                {settings?.showRooms !== false && group.room && (
                                                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1.5 rounded">
                                                                                        <MapPin size={12} className="text-primary-500" />
                                                                                        {group.room}
                                                                                    </div>
                                                                                )}
                                                                                {settings?.showProctors !== false && group.proctors?.length > 0 && (
                                                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-1.5 rounded leading-relaxed">
                                                                                        <Users size={12} className="text-primary-500 shrink-0" />
                                                                                        {group.proctors.map(p => p.name.split(' ')[0]).join('، ')}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            
                                                                            {settings?.showSyllabus === true && group.syllabus && (
                                                                                <div className="mt-2 text-[11px] font-bold text-slate-600 bg-amber-50 border border-amber-100 px-2 py-1.5 rounded leading-relaxed" title={group.syllabus}>
                                                                                    <span className="text-amber-600 font-black">المقرر:</span> {group.syllabus}
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
                        <div className="mt-16 flex justify-between items-start pt-8 break-inside-avoid">
                            <div className="text-center w-64">
                                <h3 className="font-black text-slate-800 mb-12 text-lg">إعداد المشرف الأكاديمي</h3>
                                <div className="border-b-2 border-slate-300 w-full mb-2"></div>
                                <p className="text-sm font-bold text-slate-500">الاسم والتوقيع</p>
                            </div>
                            <div className="text-center w-64">
                                <h3 className="font-black text-slate-800 mb-6 text-lg">الختم الرسمي</h3>
                                <div className="w-28 h-28 rounded-full border-2 border-dashed border-primary-200 mx-auto flex items-center justify-center bg-primary-50/30">
                                    <span className="text-primary-300/80 font-bold text-sm">موضع الختم</span>
                                </div>
                            </div>
                            <div className="text-center w-64">
                                <h3 className="font-black text-slate-800 mb-12 text-lg">يعتمد، مدير المدرسة</h3>
                                <div className="border-b-2 border-slate-300 w-full mb-2"></div>
                                <p className="text-sm font-bold text-slate-500">الاسم والتوقيع</p>
                            </div>
                        </div>

                    </div>
                </div>
            ))}

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
