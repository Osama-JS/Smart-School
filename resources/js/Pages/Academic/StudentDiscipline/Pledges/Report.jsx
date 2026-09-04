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
    X,
    ChevronDown
} from 'lucide-react';

export default function Report({ pledges = [], stats = {}, filters = {} }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    const [showFilters, setShowFilters] = useState(false);

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(route('academic.student-pledges.report'), {
            start_date: startDate,
            end_date: endDate,
            status: status
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatus('');
        router.get(route('academic.student-pledges.report'));
    };

    const removeFilter = (filterId) => {
        let params = {
            start_date: startDate,
            end_date: endDate,
            status: status
        };
        if (filterId === 'date') { params.start_date = ''; params.end_date = ''; setStartDate(''); setEndDate(''); }
        if (filterId === 'status') { params.status = ''; setStatus(''); }
        router.get(route('academic.student-pledges.report'), params, { preserveState: true });
    };

    const getStatusLabel = (s) => {
        const statuses = {
            'fully_signed': 'مكتمل التوقيع',
            'partially_signed': 'توقيع جزئي',
            'unsigned': 'غير موقع'
        };
        return statuses[s] || s;
    };

    const activeFilters = [];
    if (startDate || endDate) activeFilters.push({ id: 'date', label: `التاريخ: ${startDate || 'الكل'} إلى ${endDate || 'الكل'}` });
    if (status) activeFilters.push({ id: 'status', label: `الحالة: ${getStatusLabel(status)}` });

    const setPresetDate = (preset) => {
        const today = new Date();
        let start = new Date(today);
        let end = new Date(today);
        
        if (preset === 'week') {
            start.setDate(today.getDate() - today.getDay());
        } else if (preset === 'month') {
            start.setDate(1);
        } else if (preset === 'last_month') {
            start.setMonth(today.getMonth() - 1);
            start.setDate(1);
            end = new Date(today.getFullYear(), today.getMonth(), 0);
        } else if (preset === 'semester') {
            start.setMonth(today.getMonth() - 4);
        }

        const fmt = (d) => {
            let m = '' + (d.getMonth() + 1);
            let dy = '' + d.getDate();
            if (m.length < 2) m = '0' + m;
            if (dy.length < 2) dy = '0' + dy;
            return [d.getFullYear(), m, dy].join('-');
        };

        setStartDate(fmt(start));
        setEndDate(fmt(end));
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

                    {/* Filters */}
                    <div className="print:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative mb-6">
                        {/* Decorative Top Line */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-600 to-rose-400"></div>
                        
                        <div className="p-6">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                                <div className="flex items-center gap-4 w-full xl:w-auto">
                                    <button 
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`flex items-center gap-3 font-bold px-6 py-3 rounded-xl transition-all duration-300 w-full xl:w-auto ${
                                            showFilters 
                                            ? 'bg-rose-50 text-rose-700 shadow-inner' 
                                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-rose-100 text-rose-600' : 'bg-white shadow-sm text-slate-500'}`}>
                                            <Filter size={18} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[15px]">خيارات التصفية المتقدمة</span>
                                        {activeFilters.length > 0 && (
                                            <span className="flex items-center justify-center bg-rose-500 text-white text-xs font-black w-6 h-6 rounded-full mr-2 shadow-sm">
                                                {activeFilters.length}
                                            </span>
                                        )}
                                        <ChevronDown className={`w-5 h-5 mr-auto transition-transform duration-300 ${showFilters ? 'rotate-180 text-rose-600' : 'text-slate-400'}`} strokeWidth={2.5} />
                                    </button>
                                </div>
                            
                                <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 overflow-x-auto custom-scrollbar w-full xl:w-auto shadow-inner">
                                    <button onClick={() => setPresetDate('today')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-rose-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-rose-700">اليوم</button>
                                    <button onClick={() => setPresetDate('week')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-rose-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-rose-700">هذا الأسبوع</button>
                                    <button onClick={() => setPresetDate('month')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-rose-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-rose-700">هذا الشهر</button>
                                    <button onClick={() => setPresetDate('last_month')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-rose-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-rose-700">الشهر الماضي</button>
                                    <button onClick={() => setPresetDate('semester')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-rose-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-rose-700">الفصل الدراسي</button>
                                </div>
                            </div>

                            {activeFilters.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-slate-100">
                                    <span className="text-sm font-bold text-slate-500 ml-2">الفلاتر النشطة:</span>
                                    {activeFilters.map(filter => (
                                        <span key={filter.id} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-rose-200 text-rose-700 text-sm font-bold shadow-sm group">
                                            {filter.label}
                                            <button type="button" onClick={() => removeFilter(filter.id)} className="p-0.5 rounded-full hover:bg-red-50 text-slate-400 group-hover:text-red-500 transition-colors">
                                                <X size={14} strokeWidth={2.5} />
                                            </button>
                                        </span>
                                    ))}
                                    <button onClick={clearFilters} className="text-sm text-slate-400 hover:text-red-600 font-bold px-3 transition-colors mr-auto flex items-center gap-1">
                                        <X size={14} strokeWidth={2.5} /> مسح جميع الفلاتر
                                    </button>
                                </div>
                            )}
                        
                            <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">من تاريخ</label>
                                            <input
                                                type="date"
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm h-[42px]"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">إلى تاريخ</label>
                                            <input
                                                type="date"
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm h-[42px]"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">حالة التوقيع</label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm h-[42px]"
                                            >
                                                <option value="">الكل</option>
                                                <option value="fully_signed">مكتمل التوقيع</option>
                                                <option value="partially_signed">توقيع جزئي</option>
                                                <option value="unsigned">غير موقع</option>
                                            </select>
                                        </div>
                                        
                                        <div className="flex items-end md:col-span-3 xl:col-span-1">
                                            <button
                                                type="submit"
                                                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-xl hover:bg-slate-700 transition-all font-bold shadow-sm h-[42px]"
                                            >
                                                <Search size={18} strokeWidth={2.5} />
                                                <span>عرض التقرير</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
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
                            <div className="flex flex-wrap gap-4 mb-6">
                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                                    <div className="text-[10px] font-bold text-slate-500">إجمالي التعهدات</div>
                                    <div className="text-xl font-black text-slate-800">{stats.total || 0}</div>
                                </div>
                                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center shadow-sm">
                                    <div className="text-[10px] font-bold text-emerald-600">مكتمل التوقيع</div>
                                    <div className="text-xl font-black text-emerald-700">{stats.fully_signed || 0}</div>
                                </div>
                                <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center shadow-sm">
                                    <div className="text-[10px] font-bold text-amber-600">توقيع جزئي</div>
                                    <div className="text-xl font-black text-amber-700">{stats.partially_signed || 0}</div>
                                </div>
                                <div className="flex-1 bg-rose-50 border border-rose-200 rounded-xl p-3 text-center shadow-sm">
                                    <div className="text-[10px] font-bold text-rose-600">غير موقع</div>
                                    <div className="text-xl font-black text-rose-700">{stats.unsigned || 0}</div>
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
                                <div className="overflow-x-auto print:overflow-visible flex justify-center">
                                    <div className="inline-block min-w-full lg:w-4/5 xl:w-5/6 bg-white rounded-xl shadow-sm border-2 border-slate-800 overflow-hidden print:shadow-none print:border-none print:w-full">
                                        <table className="w-full text-right border-collapse text-sm">
                                            <thead className={`${printSettings.ecoMode ? 'bg-slate-100 text-slate-800 border-b-2 border-slate-800' : 'text-white'}`} style={!printSettings.ecoMode ? { backgroundColor: printSettings.brandColor } : {}}>
                                                <tr>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 w-10 text-center">م</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 w-28">تاريخ التعهد</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 w-40">اسم الطالب / الصف</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 w-40">المخالفة المرتبطة</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300">نص التعهد والالتزام</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 text-center w-24">توقيع الطالب</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 text-center w-24">توقيع ولي الأمر</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 text-center w-24 hidden print:table-cell">توقيع المرشد</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 font-medium">
                                                {pledges.map((pledge, idx) => (
                                                    <tr key={pledge.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 text-center border-y border-slate-200 font-bold text-slate-700">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-4 py-3 border-y border-slate-200 text-center">
                                                            <div className="font-bold text-slate-800" dir="ltr">
                                                                {formatDateAr(pledge.date)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 border-y border-slate-200">
                                                            <div className="font-bold text-slate-900">
                                                                {pledge.student?.user?.name || '-'}
                                                            </div>
                                                            <div className="text-xs text-slate-600 mt-0.5">
                                                                {pledge.student?.current_enrollment?.division ? 
                                                                    `${pledge.student.current_enrollment.division.grade?.name || ''} - ${pledge.student.current_enrollment.division.name || ''}`
                                                                : '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 border-y border-slate-200">
                                                            {pledge.violation ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 print:bg-transparent print:p-0 print:border-none print:text-black">
                                                                    {pledge.violation.violation_type?.name || 'مخالفة سلوكية'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 print:text-slate-600">تعهد عام</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 border-y border-slate-200 text-xs text-slate-700">
                                                            <p className="line-clamp-2 print:line-clamp-none font-semibold leading-relaxed">
                                                                {pledge.pledge_text || '-'}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3 border-y border-slate-200 text-center">
                                                            {pledge.is_signed_by_student ? (
                                                                <div className="flex flex-col items-center justify-center gap-1">
                                                                    {pledge.student_signature_path ? (
                                                                        <div className="w-20 h-9 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden p-0.5 print:border-none">
                                                                            <img src={`/storage/${pledge.student_signature_path}`} alt="توقيع الطالب" className="max-h-full object-contain" />
                                                                        </div>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 print:border-none print:p-0 print:bg-transparent print:text-black">
                                                                            <Check size={12} /> تم التوقيع
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 print:border-none print:p-0 print:bg-transparent print:text-black">
                                                                    <X size={12} /> غير موقع
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 border-y border-slate-200 text-center">
                                                            {pledge.is_signed_by_parent ? (
                                                                <div className="flex flex-col items-center justify-center gap-1">
                                                                    {pledge.parent_signature_path ? (
                                                                        <div className="w-20 h-9 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden p-0.5 print:border-none">
                                                                            <img src={`/storage/${pledge.parent_signature_path}`} alt="توقيع ولي الأمر" className="max-h-full object-contain" />
                                                                        </div>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 print:border-none print:p-0 print:bg-transparent print:text-black">
                                                                            <Check size={12} /> تم التوقيع
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 print:border-none print:p-0 print:bg-transparent print:text-black">
                                                                    <X size={12} /> غير موقع
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 border-y border-slate-200 text-center hidden print:table-cell">
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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
