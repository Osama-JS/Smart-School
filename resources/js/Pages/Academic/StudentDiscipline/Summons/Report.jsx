import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ReportPrintLayout from "@/Components/Reports/ReportPrintLayout";
import {
    Search,
    Megaphone,
    AlertCircle,
    Calendar,
    Filter
} from 'lucide-react';

export default function Report({ summons, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(route('academic.parent-summons.report'), {
            start_date: startDate,
            end_date: endDate,
            status: status
        }, { preserveState: true });
    };

    const getStatusBadge = (status) => {
        const statuses = {
            'scheduled': { label: 'مجدول', className: 'bg-blue-100 text-blue-800 border-blue-200' },
            'attended': { label: 'تم الحضور', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
            'no_show': { label: 'لم يحضر', className: 'bg-rose-100 text-rose-800 border-rose-200' },
            'cancelled': { label: 'ملغى', className: 'bg-slate-100 text-slate-800 border-slate-200' }
        };
        const s = statuses[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.className} print:bg-transparent print:p-0 print:border-none print:text-black`}>{s.label}</span>;
    };

    const [printSettings, setPrintSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('ParentSummonsReportPrintSettings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            title: 'كشف استدعاء أولياء الأمور',
            orientation: 'portrait',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            showKPIs: true,
            showDetails: true,
            ecoMode: false,
            brandColor: '#1e293b' // slate-800
        };
    });

    useEffect(() => {
        localStorage.setItem('ParentSummonsReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const handlePrint = () => window.print();

    return (
        <AdminLayout activeMenu="استدعاء أولياء الأمور">
            <Head title="كشف استدعاء أولياء الأمور" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50/70 via-white to-white dark:from-slate-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-slate-100 dark:border-slate-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl flex items-center justify-center shadow border border-slate-100 dark:border-slate-700">
                                    <Megaphone size={28} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">كشف استدعاء أولياء الأمور</h1>
                                    <p className="text-slate-600/80 dark:text-slate-300/80 mt-2 text-sm font-semibold">تقرير مخصص للمتابعة والطباعة للاستدعاءات الموجهة لأولياء الأمور</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative z-20">
                        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-bold">
                            <Filter className="w-4 h-4" />
                            <span>تصفية الكشف</span>
                        </div>
                        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">من تاريخ</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">إلى تاريخ</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">حالة الاستدعاء</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none transition-all dark:text-white"
                                >
                                    <option value="">الكل</option>
                                    <option value="scheduled">مجدول</option>
                                    <option value="attended">تم الحضور</option>
                                    <option value="no_show">لم يحضر</option>
                                    <option value="cancelled">ملغى</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl hover:bg-slate-900 transition-all font-bold shadow-sm dark:bg-slate-700 dark:hover:bg-slate-600"
                                >
                                    <Search className="w-5 h-5" />
                                    <span>عرض التقرير</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <ReportPrintLayout 
                        title={printSettings.title} 
                        printSettings={printSettings} 
                        setPrintSettings={setPrintSettings} 
                        onPrint={handlePrint}
                        subtitle={startDate && endDate ? `الفترة: ${startDate} إلى ${endDate}` : 'قسم التوجيه والإرشاد الطلابي'}
                    >
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm relative z-10 print:border-none print:shadow-none print:rounded-none">
                            {summons.length === 0 ? (
                                <div className="p-12 text-center">
                                    <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد استدعاءات</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                        لا يوجد استدعاءات لأولياء الأمور تطابق الفلاتر المحددة.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-sm text-right print:border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-black border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-black/30 print:text-slate-800">
                                            <tr>
                                                <th className="w-12 px-4 py-4 text-center border-l border-slate-200 dark:border-slate-700 print:border-black/30 print:rounded-none">م</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">تاريخ الاستدعاء</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">اسم الطالب</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">الصف / الشعبة</th>
                                                <th className="w-64 px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">سبب الاستدعاء</th>
                                                <th className="px-4 py-4 text-center border-l border-slate-200 dark:border-slate-700 print:border-black/30">الحالة</th>
                                                <th className="w-32 px-4 py-4 text-center hidden print:table-cell print:border-black/30">توقيع ولي الأمر</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium print:divide-black/20">
                                            {summons.map((summon, idx) => (
                                                <tr key={summon.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                                                    <td className="px-4 py-4 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        <div className="flex items-center gap-2 text-slate-900 dark:text-white print:text-black font-bold">
                                                            <Calendar className="w-4 h-4 text-slate-400 print:hidden" />
                                                            {new Date(summon.summon_date).toLocaleDateString('ar-SA')}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                                                            {summon.student?.user?.name || 'غير معروف'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 print:hidden">
                                                            {summon.student?.user?.id_number}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                        {summon.student?.active_enrollment ? 
                                                            `${summon.student.active_enrollment.division?.grade?.name || ''} - ${summon.student.active_enrollment.division?.name || ''}`
                                                        : '-'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                        {summon.violation && (
                                                            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-1 print:text-black">
                                                                مخالفة: {summon.violation.violation_type?.name}
                                                            </div>
                                                        )}
                                                        <p className="line-clamp-2 print:line-clamp-none">{summon.reason}</p>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        {getStatusBadge(summon.status)}
                                                    </td>
                                                    <td className="px-4 py-4 text-center hidden print:table-cell print:border-black/30">
                                                        {/* Empty cell for signature in print mode */}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Print Footer / Signatures - Only visible in print mode */}
                            {summons.length > 0 && (
                                <div className="hidden print:flex justify-between items-end p-8 mt-12 w-full">
                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">المرشد الطلابي</h4>
                                        <div className="border-b border-black w-full mb-2"></div>
                                        <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                                    </div>
                                    
                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">مدير المدرسة</h4>
                                        <div className="border-b border-black w-full mb-2"></div>
                                        <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ReportPrintLayout>
                </div>
            </div>
        </AdminLayout>
    );
}
