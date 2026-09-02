import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Printer, Filter, RefreshCw, CalendarDays, CheckCircle2, XCircle, Clock } from 'lucide-react';
import ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';

export default function WeeklyReport({ students, weekDays = {}, divisionInfo, grades = [], divisions = [], filters = {} }) {
    const [filterData, setFilterData] = useState({
        grade_id: filters.grade_id || '',
        division_id: filters.division_id || '',
        date: filters.date || ''
    });

    const [printSettings, setPrintSettings] = useState(() => {
        const defaultSettings = {
            title: 'كشف حضور وغياب الطلاب الأسبوعي',
            showKPIs: true,
            showDetails: true,
            orientation: 'portrait',
            ecoMode: false,
            watermark: 'none',
            paperSize: 'A4',
            margins: 'normal',
            scale: 1,
            pagesPerSheet: 1,
            brandColor: '#2563eb', // blue-600
        };
        try {
            const saved = localStorage.getItem('WeeklyReportPrintSettings');
            if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {}
        return defaultSettings;
    });

    React.useEffect(() => {
        localStorage.setItem('WeeklyReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                date: filterData.date || '',
                grade_id: filterData.grade_id || '',
                division_id: filterData.division_id || '',
                printSettings: JSON.stringify(printSettings)
            });

            const url = route('academic.attendances.weekly-report.pdf') + '?' + params.toString();
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
        router.get(route('academic.attendances.weekly-report'), filterData, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleGradeChange = (e) => {
        const grade_id = e.target.value;
        const availableDivisions = divisions.filter(d => d.grade_id == grade_id);
        const division_id = availableDivisions.length > 0 ? availableDivisions[0].id : '';
        setFilterData({ ...filterData, grade_id, division_id });
    };

    const clearFilters = () => {
        setFilterData({ grade_id: '', division_id: '', date: '' });
        router.get(route('academic.attendances.weekly-report'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />;
            case 'absent':
                return <XCircle size={18} className="text-rose-500 mx-auto" />;
            case 'late':
                return <Clock size={18} className="text-amber-500 mx-auto" />;
            case 'excused':
                return <span className="text-blue-500 font-bold text-xs">بعذر</span>;
            default:
                return <span className="text-slate-300">-</span>;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'present': return 'حاضر';
            case 'absent': return 'غائب';
            case 'late': return 'متأخر';
            case 'excused': return 'بعذر';
            default: return '-';
        }
    };

    return (
        <AdminLayout activeMenu="كشف الغياب الأسبوعي">
            <Head title="كشف حضور وغياب الطلاب الأسبوعي" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in print:p-0 print:m-0 print:max-w-none">
                
                {/* Header (Hidden in Print) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px] print:hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 border-b border-primary-100 dark:border-primary-500/10 pb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <CalendarDays size={28} className="text-primary-600" />
                                كشف الحضور والغياب الأسبوعي
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                متابعة تفصيلية لحضور الطلاب لصف محدد خلال أسبوع كامل.
                            </p>
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
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">المرحلة الدراسية</label>
                                <select 
                                    value={filterData.grade_id} 
                                    onChange={handleGradeChange}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                >
                                    <option value="">اختر المرحلة...</option>
                                    {grades.map(grade => (
                                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">الشعبة / الصف</label>
                                <select 
                                    value={filterData.division_id} 
                                    onChange={e => setFilterData({...filterData, division_id: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                >
                                    {filterData.grade_id ? (
                                        divisions.filter(d => d.grade_id == filterData.grade_id).map(div => (
                                            <option key={div.id} value={div.id}>{div.name}</option>
                                        ))
                                    ) : (
                                        <option value="">الرجاء اختيار المرحلة أولاً</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">حدد أي يوم في الأسبوع المطلوب</label>
                                <input 
                                    type="date"
                                    value={filterData.date} 
                                    onChange={e => setFilterData({...filterData, date: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-2 mt-5 pt-4 border-t border-primary-50 dark:border-primary-500/10">
                            {(filters.grade_id || filters.date) && (
                                <button type="button" onClick={clearFilters} className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                                    <RefreshCw size={16} /> مسح
                                </button>
                            )}
                            <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2">
                                عرض الكشف
                            </button>
                        </div>
                    </form>
                </div>

                {/* Data Table */}
                {divisionInfo && students.length > 0 ? (
                    <ReportPrintLayout 
                        title={printSettings.title} 
                        printSettings={printSettings} 
                        setPrintSettings={setPrintSettings} 
                        onPrint={handlePrint} 
                        onDownloadPdf={handleDownloadPDF} 
                        isGeneratingPdf={isGeneratingPdf} 
                        startDate={weekDays?.sunday?.date} 
                        endDate={weekDays?.thursday?.date}
                    >
                        <div className="mb-6 flex flex-col gap-1 items-start text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-transparent print:border-none print:p-0 print:mb-4">
                            <span>المرحلة: {divisionInfo.grade.name}</span>
                            <span>الصف/الشعبة: {divisionInfo.name}</span>
                        </div>

                        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none">
                            <table className="w-full text-center print:text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100">
                                        <th className="px-4 py-4 text-right text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 print:border-black w-12">م</th>
                                        <th className="px-4 py-4 text-right text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 print:border-black min-w-[200px]">اسم الطالب</th>
                                        
                                        {/* Days Columns */}
                                        {Object.values(weekDays).map((day, index) => (
                                            <th key={index} className="px-2 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 print:border-black w-24">
                                                <div className="block">{day.name}</div>
                                                <div className="text-xs font-normal text-slate-500 mt-1">{day.date}</div>
                                            </th>
                                        ))}
                                        
                                        <th className="px-4 py-4 text-sm font-black text-rose-600 dark:text-rose-400 border-b border-slate-200 dark:border-slate-700 print:border-black bg-rose-50/50 dark:bg-rose-500/10 w-24">إجمالي الغياب</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 print:divide-black">
                                    {students.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors print:hover:bg-transparent">
                                            <td className="px-4 py-3 text-sm text-slate-500 font-medium text-right print:border-b print:border-slate-300">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-3 text-right print:border-b print:border-slate-300">
                                                <div className="font-bold text-slate-800 dark:text-white">
                                                    {student.name}
                                                </div>
                                            </td>
                                            
                                            {/* Status logic */}
                                            {Object.keys(weekDays).map(dayKey => {
                                                const status = student.days[dayKey]?.status;
                                                return (
                                                    <td key={dayKey} className="px-2 py-3 print:border-b print:border-slate-300 align-middle">
                                                        <div className="print:hidden">
                                                            {getStatusIcon(status)}
                                                        </div>
                                                        <div className="hidden print:block text-xs font-bold">
                                                            {getStatusText(status)}
                                                        </div>
                                                    </td>
                                                );
                                            })}

                                            <td className="px-4 py-3 font-black text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-500/5 print:border-b print:border-slate-300">
                                                {student.stats.absences > 0 ? student.stats.absences : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700 print:bg-transparent print:border-none print:mt-10">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 print:hidden">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><CheckCircle2 size={14} className="text-emerald-500" /> حاضر</div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><XCircle size={14} className="text-rose-500" /> غائب</div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Clock size={14} className="text-amber-500" /> متأخر</div>
                                </div>
                            </div>

                            <div className="hidden print:flex justify-between items-end mt-12 text-center text-sm font-bold text-slate-800">
                                <div className="w-40 border-t border-slate-400 pt-2">المرشد الطلابي</div>
                                <div className="w-40 border-t border-slate-400 pt-2">وكيل الشؤون الطلابية</div>
                                <div className="w-40 border-t border-slate-400 pt-2">مدير المدرسة</div>
                            </div>
                        </div>
                    </ReportPrintLayout>
                ) : (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm print:hidden">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarDays size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                            {divisionInfo ? 'لا يوجد طلاب مسجلين في هذه الشعبة' : 'الرجاء اختيار المرحلة والشعبة لعرض الكشف'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                            استخدم أدوات الفلترة في الأعلى لتحديد الصف وتاريخ الأسبوع المطلوب وسيقوم النظام بتوليد كشف الغياب الأسبوعي.
                        </p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
