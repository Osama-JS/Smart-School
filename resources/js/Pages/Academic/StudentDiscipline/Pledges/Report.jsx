import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ReportPrintLayout from "@/Components/Reports/ReportPrintLayout";
import {
    Search,
    ShieldAlert,
    AlertCircle,
    Calendar,
    Filter,
    PenTool,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Check,
    X
} from 'lucide-react';

export default function Report({ pledges = [], stats = {}, filters = {} }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(route('academic.student-pledges.report'), {
            start_date: startDate,
            end_date: endDate,
            status: status
        }, { preserveState: true });
    };

    const formatDateAr = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric' });
    };

    const [printSettings, setPrintSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('StudentPledgesReportPrintSettings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            title: 'كشف تعهدات الطلاب',
            orientation: 'landscape',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            showKPIs: true,
            showDetails: true,
            ecoMode: false,
            brandColor: '#dc2626' // rose-600
        };
    });

    useEffect(() => {
        localStorage.setItem('StudentPledgesReportPrintSettings', JSON.stringify(printSettings));
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

            const url = route('academic.student-pledges.report.pdf') + '?' + params.toString();
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
        <AdminLayout activeMenu="المخالفات والتعهدات">
            <Head title="كشف تعهدات الطلاب" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header Banner */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/70 via-white to-white dark:from-rose-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-rose-100 dark:border-rose-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 via-red-600 to-amber-600" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center shadow border border-slate-100 dark:border-slate-700">
                                    <ShieldAlert size={28} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">كشف تعهدات الطلاب</h1>
                                    <p className="text-rose-700/80 dark:text-rose-300/80 mt-2 text-sm font-semibold">سجل رسمي لتوثيق ومتابعة التعهدات السلوكية الموقعة من الطلاب وأولياء الأمور</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters Toolbar */}
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
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">إلى تاريخ</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">حالة التوقيع</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all dark:text-white"
                                >
                                    <option value="">الكل</option>
                                    <option value="fully_signed">مكتمل التوقيع (طالب + ولي أمر)</option>
                                    <option value="partially_signed">توقيع جزئي</option>
                                    <option value="unsigned">غير موقع نهائياً</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-2.5 rounded-xl hover:from-rose-700 hover:to-red-700 transition-all font-bold shadow-sm"
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
                        subtitle={startDate && endDate ? `الفترة: ${startDate} إلى ${endDate}` : 'قسم التوجيه والإرشاد والضبط السلوكي'}
                    >
                        {/* KPI Summary Cards */}
                        {printSettings.showKPIs && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">إجمالي التعهدات</p>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white print:text-black">{stats.total || 0}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center print:hidden">
                                        <PenTool size={20} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">مكتمل التوقيع</p>
                                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 print:text-black">{stats.fully_signed || 0}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center print:hidden">
                                        <CheckCircle2 size={20} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">توقيع جزئي</p>
                                        <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 print:text-black">{stats.partially_signed || 0}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center print:hidden">
                                        <AlertTriangle size={20} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">غير موقع</p>
                                        <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 print:text-black">{stats.unsigned || 0}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center print:hidden">
                                        <XCircle size={20} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm relative z-10 print:border-none print:shadow-none print:rounded-none">
                            {pledges.length === 0 ? (
                                <div className="p-12 text-center">
                                    <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد تعهدات مسجلة</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                        لم يتم العثور على تعهدات تطابق معايير التصفية المحددة.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-sm text-right print:border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-black border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-black/30 print:text-slate-800">
                                            <tr>
                                                <th className="w-12 px-3 py-4 text-center border-l border-slate-200 dark:border-slate-700 print:border-black/30 print:rounded-none">م</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">تاريخ التعهد</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">اسم الطالب / الصف</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">المخالفة المرتبطة</th>
                                                <th className="px-6 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30 w-1/3">نص التعهد والالتزام</th>
                                                <th className="px-4 py-4 text-center border-l border-slate-200 dark:border-slate-700 print:border-black/30">توقيع الطالب</th>
                                                <th className="px-4 py-4 text-center border-l border-slate-200 dark:border-slate-700 print:border-black/30">توقيع ولي الأمر</th>
                                                <th className="w-28 px-3 py-4 text-center hidden print:table-cell print:border-black/30">توقيع المرشد</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium print:divide-black/20">
                                            {pledges.map((pledge, idx) => (
                                                <tr key={pledge.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                                                    <td className="px-3 py-4 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        <div className="flex items-center gap-2 text-slate-900 dark:text-white print:text-black font-bold">
                                                            <Calendar className="w-4 h-4 text-slate-400 print:hidden" />
                                                            {formatDateAr(pledge.date)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                                                            {pledge.student?.user?.name || '-'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 print:text-slate-700">
                                                            {pledge.student?.current_enrollment?.division ? 
                                                                `${pledge.student.current_enrollment.division.grade?.name || ''} - ${pledge.student.current_enrollment.division.name || ''}`
                                                            : '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        {pledge.violation ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800 print:bg-transparent print:p-0 print:border-none print:text-black">
                                                                {pledge.violation.violation_type?.name || 'مخالفة سلوكية'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 print:text-slate-600">تعهد عام</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                        <p className="line-clamp-2 print:line-clamp-none font-semibold leading-relaxed">
                                                            {pledge.pledge_text || '-'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-4 text-center border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        {pledge.is_signed_by_student ? (
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                {pledge.student_signature_path ? (
                                                                    <div className="w-20 h-9 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden p-0.5 print:border-none">
                                                                        <img src={`/storage/${pledge.student_signature_path}`} alt="توقيع الطالب" className="max-h-full object-contain" />
                                                                    </div>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 print:border-none print:p-0 print:bg-transparent print:text-black">
                                                                        <Check size={12} /> تم التوقيع
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 print:border-none print:p-0 print:bg-transparent print:text-black">
                                                                <X size={12} /> غير موقع
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-center border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        {pledge.is_signed_by_parent ? (
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                {pledge.parent_signature_path ? (
                                                                    <div className="w-20 h-9 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden p-0.5 print:border-none">
                                                                        <img src={`/storage/${pledge.parent_signature_path}`} alt="توقيع ولي الأمر" className="max-h-full object-contain" />
                                                                    </div>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 print:border-none print:p-0 print:bg-transparent print:text-black">
                                                                        <Check size={12} /> تم التوقيع
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 print:border-none print:p-0 print:bg-transparent print:text-black">
                                                                <X size={12} /> غير موقع
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-4 text-center hidden print:table-cell print:border-black/30">
                                                        {/* Empty cell for live signature in print mode */}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Print Signatures Section */}
                            {pledges.length > 0 && (
                                <div className="hidden print:flex justify-between items-end p-8 mt-12 w-full">
                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">المرشد الطلابي</h4>
                                        <div className="border-b border-black w-full mb-2"></div>
                                        <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                                    </div>
                                    
                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">وكيل شؤون الطلاب</h4>
                                        <div className="border-b border-black w-full mb-2"></div>
                                        <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                                    </div>

                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">مدير المدرسة / الختم</h4>
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
