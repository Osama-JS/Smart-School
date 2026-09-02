import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Search, Calendar, UserX, User, Clock, X, Filter, BookOpen, AlertCircle, Save, UserCheck, CheckCheck } from 'lucide-react';
import FlatpickrInput from '@/Components/FlatpickrInput';
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
    const handleDownloadPDF = () => {
        alert('سيتم تفعيل تصدير PDF قريباً');
    };
    const handlePrint = () => {
        window.print();
    };

    const applyFilters = () => {
        router.get(route('academic.attendances.class-report'), { date, grade_id: gradeId, division_id: divisionId }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setDate('');
        setGradeId('');
        setDivisionId('');
        router.get(route('academic.attendances.class-report'));
    };

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

            <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8">
                {/* Header Section with Brand Colors and Geometric Accent */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                            <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <Clock size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    الغياب في الحصص
                                </h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-1 text-sm font-bold">
                                    تتبع حضور وغياب الطلاب في كل حصة دراسية ومادة على حدة
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 md:p-6 flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <Filter size={18} />
                        </div>
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">أدوات الفلترة</h2>
                    </div>

                    <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
                        <div className="w-full sm:w-auto min-w-[160px] relative group">
                            <FlatpickrInput
                                value={date}
                                onChange={(val) => setDate(val)}
                                placeholder="اختر التاريخ..."
                                options={{
                                    altInput: true,
                                    altFormat: "l, Y-m-d", // Shows day name + date
                                    disable: [
                                        function(d) {
                                            const dayMap = {
                                                'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 
                                                'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
                                            };
                                            const wDays = (workingDays && workingDays.length > 0) 
                                                ? workingDays 
                                                : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
                                            const enabledIndexes = wDays.map(name => dayMap[name]);
                                            return !enabledIndexes.includes(d.getDay());
                                        }
                                    ]
                                }}
                                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-4 pr-11 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                            />
                            <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                        </div>
                        
                        <div className="w-full sm:w-48">
                            <SelectInput
                                value={gradeId}
                                onChange={(val) => {
                                    setGradeId(val);
                                    setDivisionId(''); // Reset division when grade changes
                                }}
                                className="w-full text-sm font-bold"
                                placeholder="اختر الصف"
                                options={grades?.map(grade => ({
                                    value: grade.id,
                                    label: grade.name
                                })) || []}
                            />
                        </div>

                        <div className="w-full sm:w-48">
                            <SelectInput
                                value={divisionId}
                                onChange={(val) => setDivisionId(val)}
                                className="w-full text-sm font-bold"
                                placeholder="اختر الشعبة (إلزامي)"
                                options={divisions
                                    ?.filter(div => !gradeId || String(div.grade_id) === String(gradeId))
                                    .map(div => ({
                                        value: div.id,
                                        label: `${div.grade?.name} - ${div.name}`
                                    })) || []
                                }
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <button 
                                onClick={applyFilters}
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-500/20 active:scale-95"
                            >
                                <Search size={16} /> <span className="hidden md:inline">بحث</span>
                            </button>
                            {(filters.date || filters.grade_id || filters.division_id) && (
                                <button 
                                    onClick={clearFilters}
                                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/10 dark:text-slate-400 dark:hover:text-rose-400 rounded-2xl transition-all shrink-0"
                                    title="مسح الفلاتر"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
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
