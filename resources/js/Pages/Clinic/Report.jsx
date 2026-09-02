import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ReportPrintLayout from "@/Components/Reports/ReportPrintLayout";
import {
    Search,
    Stethoscope,
    AlertCircle,
    Calendar,
    Filter,
    Activity
} from 'lucide-react';

export default function Report({ visits, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(route('clinic.report'), {
            start_date: startDate,
            end_date: endDate,
            status: status
        }, { preserveState: true });
    };

    const getStatusStyle = (status) => {
        const styles = {
            'عادي': { 
                label: 'عادي', 
                badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                row: 'hover:bg-slate-50'
            },
            'طارئ': { 
                label: 'طارئ', 
                badge: 'bg-rose-100 text-rose-800 border-rose-200',
                row: 'bg-rose-50/50 hover:bg-rose-50 print:bg-rose-50/50'
            },
            'متابعة': { 
                label: 'متابعة', 
                badge: 'bg-blue-100 text-blue-800 border-blue-200',
                row: 'hover:bg-slate-50'
            },
            'محول للمستشفى': { 
                label: 'محول للمستشفى', 
                badge: 'bg-amber-100 text-amber-800 border-amber-200',
                row: 'bg-amber-50/50 hover:bg-amber-50 print:bg-amber-50/50'
            }
        };
        return styles[status] || { 
            label: status, 
            badge: 'bg-gray-100 text-gray-800',
            row: 'hover:bg-slate-50'
        };
    };

    const [printSettings, setPrintSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('ClinicReportPrintSettings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            title: 'السجل اليومي للعيادة المدرسية',
            orientation: 'landscape',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            showKPIs: true,
            showDetails: true,
            ecoMode: false,
            brandColor: '#059669' // emerald-600
        };
    });

    useEffect(() => {
        localStorage.setItem('ClinicReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                start_date: startDate || '',
                end_date: endDate || '',
                status: status || '',
                printSettings: JSON.stringify(printSettings)
            });

            const url = route('clinic.report.pdf') + '?' + params.toString();
            window.location.href = url;
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء طلب الملف.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handlePrint = () => window.print();

    return (
        <AdminLayout activeMenu="السجل الطبي ومتابعة الزيارات اليومية">
            <Head title="إدارة السجلات الطبية والزيارات" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 via-white to-white dark:from-emerald-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-emerald-100 dark:border-emerald-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow border border-slate-100 dark:border-slate-700">
                                    <Stethoscope size={28} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">سجل العيادة المدرسية</h1>
                                    <p className="text-emerald-700/80 dark:text-emerald-300/80 mt-2 text-sm font-semibold">تقرير يومي للحالات الطبية والزيارات والإسعافات الأولية</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative z-20">
                        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-bold">
                            <Filter className="w-4 h-4" />
                            <span>تصفية السجل</span>
                        </div>
                        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">من تاريخ</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">إلى تاريخ</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">تصنيف الحالة</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                >
                                    <option value="">الكل</option>
                                    <option value="عادي">عادي</option>
                                    <option value="طارئ">طارئ</option>
                                    <option value="متابعة">متابعة</option>
                                    <option value="محول للمستشفى">محول للمستشفى</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all font-bold shadow-sm"
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
                        onDownloadPdf={handleDownloadPDF}
                        isGeneratingPdf={isGeneratingPdf}
                        subtitle={startDate && endDate ? `الفترة: ${startDate} إلى ${endDate}` : 'إدارة الشؤون الطبية والصحية'}
                    >
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm relative z-10 print:border-none print:shadow-none print:rounded-none">
                            {visits.length === 0 ? (
                                <div className="p-12 text-center">
                                    <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد زيارات</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                        لا توجد زيارات للعيادة مطابقة لمعايير التصفية المحددة للتقرير.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-sm text-right print:border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-black border-b border-slate-200 dark:border-slate-800 print:bg-emerald-50 print:border-black/30 print:text-slate-800">
                                            <tr>
                                                <th className="w-12 px-4 py-4 text-center border-l border-slate-200 dark:border-slate-700 print:border-black/30 print:rounded-none">م</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">التاريخ والوقت</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">اسم الطالب / الصف</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">السجل المرضي</th>
                                                <th className="w-48 px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">الشكوى / الأعراض</th>
                                                <th className="w-48 px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">الإجراء المتخذ</th>
                                                <th className="px-4 py-4 text-center border-l border-slate-200 dark:border-slate-700 print:border-black/30">التصنيف</th>
                                                <th className="w-24 px-4 py-4 text-center hidden print:table-cell print:border-black/30">التوقيع</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium print:divide-black/20">
                                            {visits.map((visit, idx) => {
                                                const style = getStatusStyle(visit.status);
                                                return (
                                                    <tr key={visit.id} className={`${style.row} transition-colors print:hover:bg-transparent`}>
                                                        <td className="px-4 py-4 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                            <div className="flex items-center gap-2 text-slate-900 dark:text-white print:text-black font-bold">
                                                                <Calendar className="w-4 h-4 text-slate-400 print:hidden" />
                                                                {new Date(visit.visited_at).toLocaleString('ar-SA')}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                            <div className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                                                                {visit.student?.user?.name || 'غير معروف'}
                                                            </div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 print:text-slate-700">
                                                                {visit.student?.current_enrollment ? 
                                                                    `${visit.student.current_enrollment.division?.grade?.name || ''} - ${visit.student.current_enrollment.division?.name || ''}`
                                                                : '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                            {visit.student?.medical_record ? (
                                                                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 print:text-black">
                                                                    {visit.student.medical_record.chronic_diseases && (
                                                                        <div><span className="font-bold">أمراض:</span> {visit.student.medical_record.chronic_diseases}</div>
                                                                    )}
                                                                    {visit.student.medical_record.allergies && (
                                                                        <div><span className="font-bold text-rose-600">حساسية:</span> {visit.student.medical_record.allergies}</div>
                                                                    )}
                                                                    {!visit.student.medical_record.chronic_diseases && !visit.student.medical_record.allergies && (
                                                                        <span className="text-slate-400">سليم</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">لا يوجد سجل</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                            <div className="flex items-start gap-2">
                                                                <Activity className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 print:hidden" />
                                                                <p className="line-clamp-2 print:line-clamp-none">{visit.symptoms}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                            <p className="line-clamp-2 print:line-clamp-none">{visit.action_taken}</p>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${style.badge} print:bg-transparent print:p-0 print:border-none print:text-black`}>
                                                                {style.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center hidden print:table-cell print:border-black/30">
                                                            {/* Empty cell for signature in print mode */}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Print Footer / Signatures - Only visible in print mode */}
                            {visits.length > 0 && (
                                <div className="hidden print:flex justify-between items-end p-8 mt-12 w-full">
                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">الممرض / الطبيب المختص</h4>
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
