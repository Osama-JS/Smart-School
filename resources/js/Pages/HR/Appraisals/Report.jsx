import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Printer, Filter, RefreshCw, FileText, Download, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import Pagination from '@/Components/Pagination'; // Adjust import based on the actual Pagination component
import ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';

export default function AppraisalsReport({ appraisals, cycles = [], departments = [], employees = [], filters = {} }) {
    const [filterData, setFilterData] = useState({
        cycle_id: filters.cycle_id || '',
        department_id: filters.department_id || '',
        employee_id: filters.employee_id || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        search: filters.search || ''
    });

    const [printSettings, setPrintSettings] = useState(() => {
        const defaultSettings = {
            title: 'كشف تقييمات أداء الموظفين',
            showKPIs: true,
            showDetails: true,
            orientation: 'portrait',
            ecoMode: false,
            watermark: 'none',
            paperSize: 'A4',
            margins: 'normal',
            scale: 1,
            pagesPerSheet: 1,
            brandColor: '#1e293b', // slate-800
        };
        try {
            const saved = localStorage.getItem('AppraisalsPrintSettings');
            if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {}
        return defaultSettings;
    });

    React.useEffect(() => {
        localStorage.setItem('AppraisalsPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                search: filterData.search || '',
                date_from: filterData.date_from || '',
                date_to: filterData.date_to || '',
                employee_id: filterData.employee_id || '',
                department_id: filterData.department_id || '',
                cycle_id: filterData.cycle_id || '',
                printSettings: JSON.stringify(printSettings)
            });

            const url = route('hr.appraisals.report.pdf') + '?' + params.toString();
            window.location.href = url;
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء طلب الملف.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('hr.appraisals.report'), filterData, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const clearFilters = () => {
        setFilterData({ cycle_id: '', department_id: '', employee_id: '', date_from: '', date_to: '', search: '' });
        router.get(route('hr.appraisals.report'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handlePrint = () => {
        window.print();
    };

    // Helper to get grade label and color
    const getGradeInfo = (score) => {
        if (!score) return { label: 'لم يقيّم', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', badge: 'bg-slate-500' };
        if (score >= 90) return { label: 'ممتاز', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', badge: 'bg-emerald-500' };
        if (score >= 80) return { label: 'جيد جداً', color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', badge: 'bg-blue-500' };
        if (score >= 70) return { label: 'جيد', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', badge: 'bg-amber-500' };
        return { label: 'يحتاج تحسين', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400', badge: 'bg-rose-500' };
    };

    return (
        <AdminLayout activeMenu="كشف تقييمات الموظفين">
            <Head title="كشف تقييمات الموظفين | النظام الإداري" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in print:p-0 print:m-0 print:max-w-none">
                
                {/* Header (Hidden in Print) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px] print:hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 border-b border-primary-100 dark:border-primary-500/10 pb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <FileText size={28} className="text-primary-600" />
                                كشف تقييمات الموظفين
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">استعراض تفصيلي لدرجات ونتائج تقييم الأداء لجميع الموظفين</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handlePrint} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                                <Printer size={18} /> طباعة الكشف
                            </button>
                        </div>
                    </div>
                    
                    {/* Filter Bar */}
                    <form onSubmit={handleFilter} className="relative z-10 bg-white/50 dark:bg-slate-900/50 p-5 rounded-2xl border border-primary-50 dark:border-primary-500/10 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-4 text-primary-600 dark:text-primary-400 font-bold text-sm">
                            <Filter size={18} /> خيارات التصفية والبحث
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                            <div className="col-span-1 lg:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">بحث برقم الهوية أو الاسم</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <Search size={16} className="text-slate-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={filterData.search}
                                        onChange={e => setFilterData({...filterData, search: e.target.value})}
                                        placeholder="اسم الموظف أو رقم الهوية..."
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="col-span-1 lg:col-span-1">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">دورة التقييم</label>
                                <select 
                                    value={filterData.cycle_id} 
                                    onChange={e => setFilterData({...filterData, cycle_id: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                >
                                    <option value="">الكل</option>
                                    {cycles.map(cycle => (
                                        <option key={cycle.id} value={cycle.id}>{cycle.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1 lg:col-span-1">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">القسم</label>
                                <select 
                                    value={filterData.department_id} 
                                    onChange={e => setFilterData({...filterData, department_id: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                >
                                    <option value="">الكل</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1 lg:col-span-1">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">من تاريخ</label>
                                <input 
                                    type="date"
                                    value={filterData.date_from} 
                                    onChange={e => setFilterData({...filterData, date_from: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                            <div className="col-span-1 lg:col-span-1">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">إلى تاريخ</label>
                                <input 
                                    type="date"
                                    value={filterData.date_to} 
                                    onChange={e => setFilterData({...filterData, date_to: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-2 mt-5 pt-4 border-t border-primary-50 dark:border-primary-500/10">
                            {(filters.cycle_id || filters.department_id || filters.employee_id || filters.date_from || filters.date_to || filters.search) && (
                                <button type="button" onClick={clearFilters} className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2" title="مسح الفلاتر">
                                    <RefreshCw size={16} /> مسح
                                </button>
                            )}
                            <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2">
                                تصفية النتائج
                            </button>
                        </div>
                    </form>
                </div>

                {/* Data Table */}
                <ReportPrintLayout 
                    title={printSettings.title} 
                    printSettings={printSettings} 
                    setPrintSettings={setPrintSettings} 
                    onPrint={handlePrint} 
                    onDownloadPdf={handleDownloadPDF} 
                    isGeneratingPdf={isGeneratingPdf} 
                    startDate={filterData.date_from} 
                    endDate={filterData.date_to}
                >
                    <div className="overflow-x-auto print:overflow-visible flex justify-center">
                        <div className="inline-block min-w-full lg:w-4/5 xl:w-3/4 bg-white rounded-xl shadow-sm border-2 border-slate-800 overflow-hidden print:shadow-none print:border-none print:w-full">
                            <table className="w-full text-right border-collapse text-sm">
                                <thead className={`${printSettings.ecoMode ? 'bg-slate-100 text-slate-800 border-b-2 border-slate-800' : 'text-white'}`} style={!printSettings.ecoMode ? { backgroundColor: printSettings.brandColor } : {}}>
                                    <tr>
                                        <th className="px-4 py-3 font-bold border-y border-slate-300 w-12 text-center">م</th>
                                        <th className="px-4 py-3 font-bold border-y border-slate-300">اسم الموظف</th>
                                        <th className="px-4 py-3 font-bold border-y border-slate-300 text-center">القسم</th>
                                        <th className="px-4 py-3 font-bold border-y border-slate-300 text-center">الدورة</th>
                                        <th className="px-4 py-3 font-bold border-y border-slate-300 text-center">تاريخ التقييم</th>
                                        <th className="px-4 py-3 font-bold border-y border-slate-300 text-center">الدرجة</th>
                                        <th className="px-4 py-3 font-bold border-y border-slate-300 text-center">التقدير</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {appraisals.data.length > 0 ? (
                                        appraisals.data.map((appraisal, index) => {
                                            const gradeInfo = getGradeInfo(appraisal.final_score);
                                            return (
                                                <tr key={appraisal.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 border-y border-slate-200 text-center font-bold text-slate-700">
                                                        {((appraisals.current_page - 1) * appraisals.per_page) + index + 1}
                                                    </td>
                                                    <td className="px-4 py-3 border-y border-slate-200">
                                                        <div className="font-bold text-slate-800">
                                                            {appraisal.employee?.user?.name || 'غير متوفر'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {appraisal.employee?.user?.id_number || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 border-y border-slate-200 text-center font-bold text-slate-700">
                                                        {appraisal.employee?.department?.name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 border-y border-slate-200 text-center font-semibold text-slate-700">
                                                        {appraisal.cycle?.title || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 border-y border-slate-200 text-center text-sm font-medium text-slate-600">
                                                        {new Date(appraisal.created_at).toLocaleDateString('ar-SA')}
                                                    </td>
                                                    <td className="px-4 py-3 border-y border-slate-200 text-center">
                                                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-black ${gradeInfo.color}`}>
                                                            {appraisal.final_score ? `${appraisal.final_score}%` : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 border-y border-slate-200 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${gradeInfo.badge} print:hidden`}></div>
                                                            <span className="text-sm font-bold text-slate-700">{gradeInfo.label}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50">
                                                لا توجد بيانات تطابق محددات البحث والفلاتر المدخلة.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </ReportPrintLayout>

                {/* Pagination (Hidden in Print) */}
                {appraisals.last_page > 1 && (
                    <div className="flex justify-center print:hidden pt-4">
                        <Pagination links={appraisals.links} />
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
