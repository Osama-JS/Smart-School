import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Search, Calendar, UserX, Clock, X, Filter, BookOpen, AlertCircle, Layers } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';

export default function ClassAttendanceReport({ students, periods, grades, divisions, filters, workingDays, timetable }) {
    const [date, setDate] = useState(filters.date || new Date().toISOString().split('T')[0]);
    const [gradeId, setGradeId] = useState(filters.grade_id || '');
    const [divisionId, setDivisionId] = useState(filters.division_id || '');

    const [printSettings, setPrintSettings] = useState(() => {
        const defaultSettings = {
            title: 'تقرير الغياب بالحصص',
            showKPIs: true,
            showDetails: true,
            orientation: 'landscape',
            ecoMode: false,
            watermark: 'none',
            paperSize: 'A4',
            margins: 'normal',
            scale: 1,
            pagesPerSheet: 1,
            brandColor: '#2563eb', // blue-600
        };
        try {
            const saved = localStorage.getItem('ClassAttendanceReportPrintSettings');
            if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {}
        return defaultSettings;
    });

    React.useEffect(() => {
        localStorage.setItem('ClassAttendanceReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                date: date || '',
                grade_id: gradeId || '',
                division_id: divisionId || '',
                printSettings: JSON.stringify(printSettings)
            });

            const url = route('academic.attendances.class-report.pdf') + '?' + params.toString();
            window.location.href = url;
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء طلب الملف.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    const handlePrint = () => {
        window.print();
    };

    const [showFilters, setShowFilters] = useState(false);

    const applyFilters = (e) => {
        if (e) e.preventDefault();
        router.get(route('academic.attendances.class-report'), { date, grade_id: gradeId, division_id: divisionId }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        setGradeId('');
        setDivisionId('');
        router.get(route('academic.attendances.class-report'));
    };

    const removeFilter = (filterId) => {
        let params = { date, grade_id: gradeId, division_id: divisionId };
        if (filterId === 'grade')    { params.grade_id = ''; params.division_id = ''; setGradeId(''); setDivisionId(''); }
        if (filterId === 'division') { params.division_id = ''; setDivisionId(''); }
        router.get(route('academic.attendances.class-report'), params, { preserveState: true, replace: true });
    };

    const setPresetDate = (preset) => {
        const today = new Date();
        const fmt = (d) => {
            let m = '' + (d.getMonth() + 1);
            let dy = '' + d.getDate();
            if (m.length < 2) m = '0' + m;
            if (dy.length < 2) dy = '0' + dy;
            return [d.getFullYear(), m, dy].join('-');
        };
        if (preset === 'today') { setDate(fmt(today)); }
    };

    const getGradeName    = (id) => grades?.find(g => g.id == id)?.name || id;
    const getDivisionName = (id) => { const d = divisions?.find(d => d.id == id); return d ? `${d.grade?.name} - ${d.name}` : id; };

    const activeFilters = [];
    if (gradeId)    activeFilters.push({ id: 'grade',    label: `الصف: ${getGradeName(gradeId)}` });
    if (divisionId) activeFilters.push({ id: 'division', label: `الشعبة: ${getDivisionName(divisionId)}` });

    const submitBulkAttendance = (periodId) => {
        if (!confirm('هل أنت متأكد من حفظ الحضور لجميع الطلاب كحاضرين لهذه الحصة؟ (لن يتم تجاوز من تم تحضيرهم مسبقاً)')) {
            return;
        }
        
        router.post(route('academic.attendances.classes.storeBulk'), {
            division_id: divisionId,
            period_id: periodId,
            date: date,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'present':
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded text-xs font-black">حاضر</span>;
            case 'late':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded text-xs font-black">متأخر</span>;
            case 'absent':
                return <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded text-xs font-black">غائب</span>;
            default:
                return <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded text-xs font-black">غير محدد</span>;
        }
    };

    return (
        <AdminLayout activeMenu="غياب الحصص">
            <Head title="تقارير غياب الحصص | النظام الإداري" />

            <div className="space-y-6">

                {/* Header */}
                <div className="print:hidden relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400 z-20"></div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary-50 to-transparent pointer-events-none"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3.5 bg-white border border-primary-100 shadow-sm rounded-xl text-primary-600 flex-shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <Clock size={28} strokeWidth={2} className="relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-black text-slate-800 tracking-tight mb-1">الغياب في الحصص</h1>
                            <p className="text-[13.5px] font-bold text-slate-500">تتبع حضور وغياب الطلاب في كل حصة دراسية ومادة على حدة</p>
                        </div>
                    </div>
                    <div className="flex gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            onClick={handlePrint}
                            className="flex items-center justify-center gap-2.5 px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all font-bold text-sm"
                        >
                            طباعة التقرير
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                <div className="print:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>

                    <div className="p-5">
                        {/* Toggle button + Date presets */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-3 font-bold px-6 py-3 rounded-xl transition-all duration-300 w-full xl:w-auto ${
                                    showFilters
                                        ? 'bg-primary-50 text-primary-700 shadow-inner'
                                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                            >
                                <div className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-primary-100 text-primary-600' : 'bg-white shadow-sm text-slate-500'}`}>
                                    <Filter size={18} strokeWidth={2.5} />
                                </div>
                                <span className="text-[15px]">خيارات التصفية المتقدمة</span>
                                {activeFilters.length > 0 && (
                                    <span className="flex items-center justify-center bg-primary-500 text-white text-xs font-black w-6 h-6 rounded-full shadow-sm">
                                        {activeFilters.length}
                                    </span>
                                )}
                                <svg className={`w-5 h-5 mr-auto transition-transform duration-300 ${showFilters ? 'rotate-180 text-primary-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Today button + Date display */}
                            <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 overflow-x-auto hide-scrollbar w-full xl:w-auto shadow-inner gap-1">
                                <button
                                    onClick={() => setPresetDate('today')}
                                    className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all"
                                >
                                    اليوم
                                </button>
                                {date && (
                                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-700 bg-white rounded-lg shadow-sm border border-primary-100">
                                        <Calendar size={14} className="text-primary-500" />
                                        <span>{date}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Active filter chips */}
                        {activeFilters.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-slate-100">
                                <span className="text-sm font-bold text-slate-500 ml-2">الفلاتر النشطة:</span>
                                {activeFilters.map(filter => (
                                    <span key={filter.id} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary-200 text-primary-700 text-sm font-bold shadow-sm group">
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

                        {/* Collapsible form */}
                        <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">التاريخ</label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3"
                                        />
                                    </div>

                                    {/* Grade */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">الصف الدراسي</label>
                                        <SelectInput
                                            value={gradeId}
                                            onChange={(val) => { setGradeId(val); setDivisionId(''); }}
                                            placeholder="اختر الصف..."
                                            options={grades?.map(grade => ({
                                                value: grade.id,
                                                label: grade.name
                                            })) || []}
                                        />
                                    </div>

                                    {/* Division */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            الشعبة <span className="text-rose-500 text-xs font-bold">(إلزامي)</span>
                                        </label>
                                        <SelectInput
                                            value={divisionId}
                                            onChange={(val) => setDivisionId(val)}
                                            placeholder="اختر الشعبة..."
                                            options={divisions
                                                ?.filter(div => !gradeId || String(div.grade_id) === String(gradeId))
                                                .map(div => ({
                                                    value: div.id,
                                                    label: `${div.grade?.name} - ${div.name}`
                                                })) || []
                                            }
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3 items-end">
                                        <button
                                            type="submit"
                                            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all font-bold shadow-sm"
                                        >
                                            <Search size={16} strokeWidth={2.5} />
                                            <span>عرض التقرير</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all"
                                        >
                                            <X size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {!divisionId ? (
                        <div className="px-6 py-16 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                    <Filter size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">يرجى تحديد الشعبة</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    قم باختيار الشعبة الدراسية من أدوات الفلترة في الأعلى لعرض سجل الحضور التفصيلي.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ReportPrintLayout 
                            title={printSettings.title} 
                            printSettings={printSettings} 
                            setPrintSettings={setPrintSettings} 
                            onPrint={handlePrint} 
                            onDownloadPdf={handleDownloadPDF} 
                            isGeneratingPdf={isGeneratingPdf} 
                            startDate={date} 
                            endDate={date}
                        >
                            <div className="mb-6 flex flex-col gap-1 items-start text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-transparent print:border-none print:p-0 print:mb-4">
                                <span>الصف والشعبة: {divisions?.find(d => d.id == divisionId)?.grade?.name} - {divisions?.find(d => d.id == divisionId)?.name}</span>
                                <span>التاريخ: {date}</span>
                            </div>
                            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 print:bg-slate-100 print:border-black">
                                    <tr>
                                        <th className="px-6 py-4 font-black text-slate-700 dark:text-slate-300 whitespace-nowrap bg-slate-50/80 dark:bg-slate-800/50 sticky right-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-none">
                                            الطالب
                                        </th>
                                        <th className="px-6 py-4 font-black text-slate-700 dark:text-slate-300 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-700">
                                            الغياب اليومي (الباب)
                                        </th>
                                        {periods.map(period => {
                                            const slot = timetable ? timetable[period.id] : null;
                                            return (
                                                <th key={period.id} className="px-6 py-4 font-black text-slate-700 dark:text-slate-300 whitespace-nowrap text-center min-w-[140px]">
                                                    {period.period_name}
                                                    {slot && (
                                                        <div className="text-[10px] text-slate-400 font-bold mb-1 line-clamp-1 border-b border-slate-100 dark:border-slate-700 pb-1 w-full text-center print:border-black/10">
                                                            {slot.subject ? slot.subject.name : 'فراغ'}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] font-normal text-slate-500 mt-1">
                                                        {period.start_time ? period.start_time.substring(0,5) : ''} - {period.end_time ? period.end_time.substring(0,5) : ''}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {students.length > 0 ? (
                                        students.map((student) => (
                                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 bg-white dark:bg-slate-900 sticky right-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-none">
                                                    <div className="flex items-center gap-3 min-w-[150px]">
                                                        <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0 font-bold">
                                                            {student.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                            {student.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center border-l border-slate-100 dark:border-slate-800/50">
                                                    {renderStatusBadge(student.daily_status)}
                                                </td>
                                                {periods.map(period => {
                                                    const cellData = student.periods[period.id];
                                                    return (
                                                        <td key={period.id} className="px-3 py-3 border-x border-slate-100 dark:border-slate-800/50 print:border-black">
                                                            <div className="flex flex-col items-center justify-center relative min-h-[60px] w-full group">
                                                                {cellData ? (
                                                                    <div className="flex flex-col items-center justify-center gap-1.5 w-full">
                                                                        {renderStatusBadge(cellData.status)}
                                                                        
                                                                        {cellData.subject_name && (
                                                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-700">
                                                                                <BookOpen size={10} />
                                                                                <span className="truncate max-w-[80px]">{cellData.subject_name}</span>
                                                                            </span>
                                                                        )}

                                                                        {cellData.notes && (
                                                                            <div className="group/note relative flex justify-center w-full mt-0.5">
                                                                                <AlertCircle size={14} className="text-amber-500 cursor-help" />
                                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/note:opacity-100 group-hover/note:visible transition-all z-20">
                                                                                    {cellData.notes}
                                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 group-hover/cell:border-primary-300 dark:group-hover/cell:border-primary-500/50 flex items-center justify-center transition-colors">
                                                                        <span className="text-slate-300 dark:text-slate-600 text-lg font-bold">+</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={periods.length + 2} className="px-6 py-16 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                                        <UserX size={32} className="text-slate-400" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">لا يوجد طلاب</h3>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                                                        هذه الشعبة لا تحتوي على طلاب مسجلين.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            </div>
                        </ReportPrintLayout>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
