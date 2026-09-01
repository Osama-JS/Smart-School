import React, { useState, useEffect } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Printer, Filter, Calendar, Users, Briefcase, FileDown, Search, ArrowRight, X, 
    AlertTriangle, ChevronDown, XCircle, Clock, CheckCircle, UserCheck, Loader2, 
    BookOpen, Settings, Download, Eye, AlertCircle, FileText, Check, Award, Star 
} from 'lucide-react';
import Select from 'react-select';
import pdfMakeLib from 'pdfmake/build/pdfmake';
const pdfMake = pdfMakeLib.default || pdfMakeLib;
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Swal from 'sweetalert2';

const formatDateStr = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return dateString;
};

export default function ClassroomVisitsReport({ 
    auth, 
    teachers = [], 
    kpis = {}, 
    departmentChartData = [], 
    allTeachers = [], 
    allSupervisors = [],
    periodStart = '',
    periodEnd = '',
    filters = {} 
}) {
    const safeTeachers = Array.isArray(teachers) ? teachers : (teachers ? Object.values(teachers) : []);
    const safeAllTeachers = Array.isArray(allTeachers) ? allTeachers : (allTeachers ? Object.values(allTeachers) : []);
    const safeAllSupervisors = Array.isArray(allSupervisors) ? allSupervisors : (allSupervisors ? Object.values(allSupervisors) : []);
    const safeChartData = Array.isArray(departmentChartData) ? departmentChartData : (departmentChartData ? Object.values(departmentChartData) : []);

    const [startDate, setStartDate] = useState(filters?.start_date || periodStart || '');
    const [endDate, setEndDate] = useState(filters?.end_date || periodEnd || '');
    const [selectedTeacher, setSelectedTeacher] = useState(
        filters?.employee_id ? { value: filters.employee_id, label: safeAllTeachers.find(t => t.id == filters.employee_id)?.name } : null
    );
    const [selectedSupervisor, setSelectedSupervisor] = useState(
        filters?.supervisor_id ? { value: filters.supervisor_id, label: safeAllSupervisors.find(s => s.id == filters.supervisor_id)?.name } : null
    );
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [violatorsOnly, setViolatorsOnly] = useState(filters.violators_only === true || filters.violators_only === 'true');
    const [showFilters, setShowFilters] = useState(false);

    // Print Settings State
    const [printSettings, setPrintSettings] = useState(() => {
        const defaultSettings = {
            title: 'تقارير الزيارات الصفية (المشرف)',
            showKPIs: true,
            showDetails: true,
            orientation: 'portrait',
            ecoMode: false,
            watermark: 'none',
            paperSize: 'A4',
            margins: 'normal',
            scale: 1,
            pagesPerSheet: 1,
            brandColor: '#63a22f',
        };
        try {
            const saved = localStorage.getItem('classroomVisitsReportPrintSettings');
            if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {}
        return defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('classroomVisitsReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const getPaperDimensions = () => {
        if (printSettings.orientation === 'landscape') {
            return printSettings.paperSize === 'A4' ? { maxWidth: '297mm', minHeight: '210mm' } : { maxWidth: '420mm', minHeight: '297mm' };
        }
        return printSettings.paperSize === 'A4' ? { maxWidth: '210mm', minHeight: '297mm' } : { maxWidth: '297mm', minHeight: '420mm' };
    };
    const paperDims = getPaperDimensions();

    // KPIs Calculations (from backend)
    const totalVisits = kpis?.total_visits || 0;
    const approvedVisits = kpis?.approved_visits || 0;
    const pendingVisits = kpis?.pending_visits || 0;
    const averageScore = kpis?.average_score || 0;
    const uniqueTeachers = kpis?.unique_teachers || 0;

    const chartData = safeChartData || [];

    let sortedTeachers = [...safeTeachers].sort((a, b) => (a.avg_score || 0) - (b.avg_score || 0));

    if (violatorsOnly) {
        sortedTeachers = sortedTeachers.filter(t => t.avg_score < 75 || t.total_visits === 0);
    }

    const handleFilter = (e) => {
        if(e) e.preventDefault();
        router.get(route('hr.reports.classroom-visits'), {
            start_date: startDate,
            end_date: endDate,
            employee_id: selectedTeacher?.value || '',
            supervisor_id: selectedSupervisor?.value || '',
            violators_only: violatorsOnly,
            search: filters.search || ''
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedTeacher(null);
        setSelectedSupervisor(null);
        setViolatorsOnly(false);
        router.get(route('hr.reports.classroom-visits'));
    };

    const removeFilter = (filterId) => {
        if (filterId === 'violators') {
            setViolatorsOnly(false);
            router.get(route('hr.reports.classroom-visits'), {
                start_date: startDate,
                end_date: endDate,
                employee_id: selectedTeacher?.value || '',
                supervisor_id: selectedSupervisor?.value || '',
                violators_only: false
            }, { preserveState: true });
            return;
        }

        let newStartDate = startDate;
        let newEndDate = endDate;
        let newTeacher = selectedTeacher;
        let newSupervisor = selectedSupervisor;

        if (filterId === 'date') { newStartDate = ''; newEndDate = ''; setStartDate(''); setEndDate(''); }
        if (filterId === 'teacher') { newTeacher = null; setSelectedTeacher(null); }
        if (filterId === 'supervisor') { newSupervisor = null; setSelectedSupervisor(null); }

        router.get(route('hr.reports.classroom-visits'), {
            start_date: newStartDate,
            end_date: newEndDate,
            employee_id: newTeacher?.value || '',
            supervisor_id: newSupervisor?.value || '',
            violators_only: violatorsOnly
        }, { preserveState: true });
    };

    const activeFilters = [];
    if (startDate || endDate) activeFilters.push({ id: 'date', label: `التاريخ: ${startDate || 'الكل'} إلى ${endDate || 'الكل'}` });
    if (selectedTeacher) activeFilters.push({ id: 'teacher', label: `المعلم: ${selectedTeacher.label}` });
    if (selectedSupervisor) activeFilters.push({ id: 'supervisor', label: `المشرف: ${selectedSupervisor.label}` });
    if (violatorsOnly) activeFilters.push({ id: 'violators', label: `أداء منخفض / بدون زيارات فقط` });

    const setPresetDate = (preset) => {
        const today = new Date();
        let start = new Date(today);
        let end = new Date(today);
        
        if (preset === 'month') {
            start.setDate(1);
        } else if (preset === 'last_month') {
            start.setMonth(today.getMonth() - 1);
            start.setDate(1);
            end = new Date(today.getFullYear(), today.getMonth(), 0);
        } else if (preset === 'semester') {
            start.setMonth(today.getMonth() - 4);
        }
        
        const formatDate = (d) => {
            let month = '' + (d.getMonth() + 1);
            let day = '' + d.getDate();
            const year = d.getFullYear();
            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;
            return [year, month, day].join('-');
        };
        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
    };

    const handleExportCSV = () => {
        const csvRows = [];
        csvRows.push(['اسم المعلم', 'القسم', 'تاريخ الزيارة', 'نوع الزيارة', 'اسم المشرف', 'التقييم (%)', 'الحالة', 'النقاط المناقشة', 'الملاحظات']);

        sortedTeachers.forEach(teacher => {
            const records = Array.isArray(teacher.records) ? teacher.records : [];
            records.forEach(r => {
                csvRows.push([
                    teacher.employee_name || teacher.name,
                    teacher.department || '-',
                    r.visit_date || '',
                    r.visit_type || '',
                    r.supervisor_name || '',
                    r.score || '0',
                    r.status || '',
                    r.discussed_points || '',
                    r.notes || ''
                ]);
            });
        });

        const csvContent = "\uFEFF" + csvRows.map(e => e.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `classroom_visits_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchFontAsBase64 = async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch font');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const preparePdfMake = async () => {
        if (!pdfMake.vfs || !pdfMake.vfs['Amiri-Regular.ttf']) {
            pdfMake.vfs = pdfMake.vfs || {};
            const base64Font = await fetchFontAsBase64('/Smart-School/public/fonts/arabic.ttf');
            pdfMake.vfs['Amiri-Regular.ttf'] = base64Font;
            pdfMake.fonts = {
                Amiri: {
                    normal: 'Amiri-Regular.ttf',
                    bold: 'Amiri-Regular.ttf',
                    italics: 'Amiri-Regular.ttf',
                    bolditalics: 'Amiri-Regular.ttf'
                }
            };
        }
    };

    const handlePrintClick = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            await preparePdfMake();

            const tableBody = [
                [
                    { text: 'م', style: 'tableHeader', alignment: 'center' },
                    { text: 'اسم المعلم', style: 'tableHeader', alignment: 'center' },
                    { text: 'القسم', style: 'tableHeader', alignment: 'center' },
                    { text: 'عدد الزيارات', style: 'tableHeader', alignment: 'center' },
                    { text: 'المعتمدة', style: 'tableHeader', alignment: 'center' },
                    { text: 'متوسط التقييم', style: 'tableHeader', alignment: 'center' }
                ]
            ];

            let count = 1;
            sortedTeachers.forEach(teacher => {
                tableBody.push([
                    { text: count.toString(), alignment: 'center' },
                    { text: teacher.employee_name || teacher.name, alignment: 'right' },
                    { text: teacher.department || '-', alignment: 'right' },
                    { text: (teacher.total_visits || 0).toString(), alignment: 'center' },
                    { text: (teacher.approved_visits || 0).toString(), alignment: 'center' },
                    { text: `${teacher.avg_score || 0}%`, alignment: 'center' }
                ]);
                count++;
            });

            if (tableBody.length === 1) {
                tableBody.push([{ text: 'لا توجد بيانات', colSpan: 6, alignment: 'center' }, {}, {}, {}, {}, {}]);
            }

            const docDefinition = {
                pageSize: printSettings.paperSize || 'A4',
                pageOrientation: printSettings.orientation || 'portrait',
                defaultStyle: {
                    font: 'Amiri',
                    fontSize: 10,
                    direction: 'rtl'
                },
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true,
                        alignment: 'center',
                        margin: [0, 0, 0, 20],
                        color: printSettings.brandColor || '#63a22f'
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 11,
                        fillColor: '#f1f5f9',
                        color: '#334155'
                    }
                },
                content: [
                    { text: printSettings.title || 'تقارير الزيارات الصفية (المشرف)', style: 'header' },
                    {
                        columns: [
                            { text: `الفترة من: ${startDate || '-'} إلى: ${endDate || '-'}`, alignment: 'right' },
                            { text: `إجمالي الزيارات: ${totalVisits}`, alignment: 'right' },
                            { text: `الزيارات المعتمدة: ${approvedVisits}`, alignment: 'right' },
                            { text: `متوسط التقييم العام: ${averageScore}%`, alignment: 'right' }
                        ],
                        margin: [0, 0, 0, 20]
                    },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['auto', '*', '*', 'auto', 'auto', 'auto'],
                            body: tableBody
                        },
                        layout: 'lightHorizontalLines'
                    }
                ]
            };

            pdfMake.createPdf(docDefinition).download('classroom_visits_report.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء توليد الملف: ' + (error.message || error));
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const customSelectStyles = {
        control: (provided) => ({
            ...provided,
            borderRadius: '0.75rem',
            borderColor: '#e2e8f0',
            padding: '2px',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#cbd5e1'
            }
        })
    };

    return (
        <AdminLayout user={auth?.user} activeMenu="التقارير">
            <Head title="تقارير الزيارات الصفية (المشرف)" />

            <div className="space-y-6">
                
                {/* Header Card */}
                <div className="print:hidden relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400 z-20"></div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary-50 to-transparent pointer-events-none"></div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3.5 bg-white border border-primary-100 shadow-sm rounded-xl text-primary-600 flex-shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <Eye size={28} strokeWidth={2} className="relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-black text-slate-800 tracking-tight mb-1">
                                تقارير الزيارات الصفية (المشرف)
                            </h1>
                            <p className="text-[13.5px] font-bold text-slate-500">متابعة وتقييم الزيارات الصفية الميدانية للمشرفين الأكاديميين ونسب أداء المعلمين</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 hover:shadow-md transition-all font-bold"
                        >
                            <Download size={18} strokeWidth={2.5} />
                            <span>تصدير (CSV)</span>
                        </button>
                        <button
                            onClick={handlePrintClick}
                            className="flex items-center justify-center gap-2.5 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 hover:shadow-md transition-all font-bold"
                        >
                            <Printer size={18} strokeWidth={2.5} />
                            <span>طباعة التقرير</span>
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="print:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative mb-6">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>
                    
                    <div className="p-6">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                            <div className="flex items-center gap-4 w-full xl:w-auto">
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
                                        <span className="flex items-center justify-center bg-primary-500 text-white text-xs font-black w-6 h-6 rounded-full mr-2 shadow-sm">
                                            {activeFilters.length}
                                        </span>
                                    )}
                                    <svg className={`w-5 h-5 mr-auto transition-transform duration-300 ${showFilters ? 'rotate-180 text-primary-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        
                            <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 overflow-x-auto hide-scrollbar w-full xl:w-auto shadow-inner">
                                <button onClick={() => setPresetDate('month')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-primary-700">هذا الشهر</button>
                                <button onClick={() => setPresetDate('last_month')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-primary-700">الشهر الماضي</button>
                                <button onClick={() => setPresetDate('semester')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-primary-700">الفصل الدراسي</button>
                            </div>
                        </div>

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
                    
                        <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">من تاريخ</label>
                                        <input
                                            type="date"
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px]"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">إلى تاريخ</label>
                                        <input
                                            type="date"
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px]"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">المعلم المزار</label>
                                        <Select
                                            options={safeAllTeachers.map(t => ({ value: t.id, label: t.name }))}
                                            value={selectedTeacher}
                                            onChange={setSelectedTeacher}
                                            placeholder="ابحث عن معلم..."
                                            isClearable
                                            styles={{
                                                ...customSelectStyles,
                                                control: (provided, state) => ({
                                                    ...provided,
                                                    borderRadius: '0.75rem',
                                                    borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
                                                    backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc',
                                                    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                                                    minHeight: '42px',
                                                })
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">المشرف الأكاديمي</label>
                                        <Select
                                            options={safeAllSupervisors.map(s => ({ value: s.id, label: s.name }))}
                                            value={selectedSupervisor}
                                            onChange={setSelectedSupervisor}
                                            placeholder="ابحث عن مشرف..."
                                            isClearable
                                            styles={{
                                                ...customSelectStyles,
                                                control: (provided, state) => ({
                                                    ...provided,
                                                    borderRadius: '0.75rem',
                                                    borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
                                                    backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc',
                                                    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                                                    minHeight: '42px',
                                                })
                                            }}
                                        />
                                    </div>
                                    
                                    <div className="xl:col-span-4 flex flex-col xl:flex-row justify-between items-center gap-4 mt-2">
                                        <div 
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer w-full xl:w-auto ${violatorsOnly ? 'bg-rose-50/50 border-rose-200 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                                            onClick={() => setViolatorsOnly(!violatorsOnly)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${violatorsOnly ? 'bg-rose-500' : 'bg-slate-300'}`}>
                                                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${violatorsOnly ? 'left-1' : 'right-1'}`}></div>
                                                </div>
                                                <div>
                                                    <div className={`font-bold text-[15px] leading-none mb-1 ${violatorsOnly ? 'text-rose-700' : 'text-slate-700'}`}>عرض الأداء المنخفض / بدون زيارات فقط</div>
                                                    <div className={`text-xs font-semibold ${violatorsOnly ? 'text-rose-500' : 'text-slate-500'}`}>من لديهم متوسط تقييم أقل من 75% أو عدم وجود زيارات</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 w-full xl:w-auto">
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="px-6 py-3 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-all font-bold flex items-center justify-center gap-2 flex-1 xl:flex-none shadow-sm"
                                            >
                                                <X size={18} strokeWidth={2.5} />
                                                مسح الفلاتر
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 hover:shadow-md hover:-translate-y-0.5 rounded-xl transition-all font-bold shadow-sm flex items-center justify-center gap-2 flex-1 xl:flex-none"
                                            >
                                                <Search size={18} strokeWidth={2.5} />
                                                تطبيق الفلاتر
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-8 items-start relative">
                    
                    {/* Sticky Settings Sidebar */}
                    <div className="w-full lg:w-[340px] shrink-0 print:hidden lg:sticky lg:top-6 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>

                            <div className="p-6">
                                <h3 className="text-[17px] font-black text-slate-800 flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                                    <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                        <Printer size={20} strokeWidth={2.5} />
                                    </div>
                                    إعدادات وتخصيص الطباعة
                                </h3>
                                
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-700 mb-1.5">عنوان التقرير</label>
                                        <input 
                                            type="text" 
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-semibold transition-all h-[42px] px-3 shadow-sm"
                                            value={printSettings.title}
                                            onChange={(e) => setPrintSettings({...printSettings, title: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-700 mb-1.5">اللون الأساسي للتقرير</label>
                                        <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-200 rounded-xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                                            <input
                                                type="color"
                                                value={printSettings.brandColor}
                                                onChange={(e) => setPrintSettings({ ...printSettings, brandColor: e.target.value })}
                                                className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0 bg-transparent shadow-sm"
                                            />
                                            <span className="text-sm text-slate-700 font-bold font-mono tracking-wider" dir="ltr">{printSettings.brandColor.toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">مقاس الورقة</label>
                                            <select 
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-[13px] font-semibold h-[42px] transition-all shadow-sm px-2 cursor-pointer"
                                                value={printSettings.paperSize}
                                                onChange={(e) => setPrintSettings({...printSettings, paperSize: e.target.value})}
                                            >
                                                <option value="A3">A3</option>
                                                <option value="A4">A4</option>
                                                <option value="A5">A5</option>
                                                <option value="letter">Letter</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">العلامة المائية</label>
                                            <select 
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-[13px] font-semibold h-[42px] transition-all shadow-sm px-2 cursor-pointer"
                                                value={printSettings.watermark}
                                                onChange={(e) => setPrintSettings({...printSettings, watermark: e.target.value})}
                                            >
                                                <option value="none">بدون</option>
                                                <option value="confidential">سري</option>
                                                <option value="draft">مسودة</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-2">
                                        <label className="flex items-center justify-between">
                                            <span className="text-[13px] font-bold text-slate-700">حجم الطباعة (Scale)</span>
                                            <span className="text-[11px] font-black text-primary-700 bg-primary-100 border border-primary-200 px-2 py-0.5 rounded-md shadow-sm" dir="ltr">{Math.round(printSettings.scale * 100)}%</span>
                                        </label>
                                        <input 
                                            type="range" 
                                            min="0.5" 
                                            max="2" 
                                            step="0.1" 
                                            value={printSettings.scale}
                                            onChange={(e) => setPrintSettings({...printSettings, scale: parseFloat(e.target.value)})}
                                            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600 hover:accent-primary-700"
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 space-y-3.5">
                                        <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                                            <span className="text-[14px] font-bold text-slate-700 group-hover:text-primary-700 transition-colors">اتجاه الطباعة (عرضي)</span>
                                            <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 shadow-inner ${printSettings.orientation === 'landscape' ? 'bg-primary-500' : 'bg-slate-300'}`} onClick={() => setPrintSettings({...printSettings, orientation: printSettings.orientation === 'landscape' ? 'portrait' : 'landscape'})}>
                                                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow transition-all duration-300 ${printSettings.orientation === 'landscape' ? 'left-1' : 'right-1'}`}></div>
                                            </div>
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                                            <span className="text-[14px] font-bold text-slate-700 group-hover:text-primary-700 transition-colors">طباعة اقتصادية</span>
                                            <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 shadow-inner ${printSettings.ecoMode ? 'bg-primary-500' : 'bg-slate-300'}`} onClick={() => setPrintSettings({...printSettings, ecoMode: !printSettings.ecoMode})}>
                                                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow transition-all duration-300 ${printSettings.ecoMode ? 'left-1' : 'right-1'}`}></div>
                                            </div>
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                                            <span className="text-[14px] font-bold text-slate-700 group-hover:text-primary-700 transition-colors">إظهار الإحصائيات</span>
                                            <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 shadow-inner ${printSettings.showKPIs ? 'bg-primary-500' : 'bg-slate-300'}`} onClick={() => setPrintSettings({...printSettings, showKPIs: !printSettings.showKPIs})}>
                                                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow transition-all duration-300 ${printSettings.showKPIs ? 'left-1' : 'right-1'}`}></div>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="flex flex-col gap-3 mt-6 pt-4">
                                        <button onClick={handlePrintClick} className="w-full px-6 py-3.5 bg-slate-800 text-white hover:bg-slate-700 rounded-xl transition-all font-black shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                            <Printer size={18} strokeWidth={2.5} />
                                            طباعة التقرير
                                        </button>
                                        <button 
                                            onClick={handleDownloadPDF} 
                                            disabled={isGeneratingPdf}
                                            className={`w-full px-6 py-3.5 bg-rose-600 text-white rounded-xl transition-all font-black shadow-md flex items-center justify-center gap-2 ${isGeneratingPdf ? 'opacity-70 cursor-not-allowed' : 'hover:bg-rose-700 hover:-translate-y-0.5'}`}
                                        >
                                            {isGeneratingPdf ? (
                                                <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
                                            ) : (
                                                <FileDown size={18} strokeWidth={2.5} />
                                            )}
                                            {isGeneratingPdf ? 'جاري التحضير...' : 'تنزيل كملف (PDF)'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Paper Document Container */}
                    <div className="flex-1 w-full overflow-x-auto print:overflow-visible flex justify-center">
                        <div 
                            data-eco={printSettings.ecoMode}
                            style={{ 
                                maxWidth: paperDims.maxWidth, 
                                minHeight: paperDims.minHeight,
                                transform: `scale(${printSettings.scale})`,
                                transformOrigin: 'top center'
                            }}
                            className={`relative bg-white p-8 pt-6 border border-slate-200 w-full flex flex-col paper-container ${isGeneratingPdf ? 'shadow-none' : 'shadow-2xl'}`}
                        >
                            {/* Watermark Overlay */}
                            {printSettings.watermark !== 'none' && (
                                <div className="absolute inset-0 z-0 flex items-center justify-center opacity-5 pointer-events-none print:opacity-[0.03]">
                                    <img src="/Smart-School/public/images/logo.png" className="w-[400px] h-[400px] object-contain grayscale" alt="watermark" onError={(e) => { e.target.onerror = null; e.target.src = '/Smart-School/public/images/school_logo.png' }} />
                                </div>
                            )}

                            {/* Header Banner */}
                            <div className="relative mb-5 pb-4 border-b-2" style={{ borderColor: printSettings.brandColor }}>
                                <div className="absolute -top-6 inset-x-0 h-1.5 print:opacity-100 opacity-100" style={{ backgroundColor: printSettings.brandColor }}></div>
                                {!isGeneratingPdf && (
                                    <div className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none" style={{ background: `linear-gradient(to bottom left, ${printSettings.brandColor}, transparent)` }}></div>
                                )}
                                
                                <div className="flex justify-between items-start pt-4">
                                    {/* Right side: School info & Title */}
                                    <div className="flex flex-col gap-0.5 z-10 w-[38%] pt-0.5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: printSettings.brandColor }}></div>
                                            <h3 className="text-[11px] font-black text-slate-600 tracking-wide">الجمهورية اليمنية</h3>
                                        </div>
                                        <h3 className="text-[11px] font-bold text-slate-600 pr-3.5">وزارة التربية والتعليم والبحث العلمي</h3>
                                        <h2 className="text-lg font-black text-slate-900 mt-1.5 pr-3.5 leading-tight tracking-tight">مدارس القيم الأهلية</h2>
                                        <h3 className="text-[11px] font-semibold text-slate-500 pr-3.5 flex items-center gap-1.5 mt-0.5">المركز الرئيسي <span className="w-1 h-1 rounded-full bg-slate-300"></span> الشؤون الأكاديمية والتوجيه</h3>
                                        
                                        <div className="mt-3 pr-3 border-r-[3px] py-0.5" style={{ borderColor: printSettings.brandColor }}>
                                            <h1 className="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap leading-none">
                                                {printSettings.title}
                                            </h1>
                                        </div>
                                    </div>

                                    {/* Center: Logo */}
                                    <div className="flex flex-col items-center justify-start w-[24%] z-10">
                                        <div className="w-20 h-20 bg-white flex items-center justify-center p-1 relative group">
                                            <img src="/Smart-School/public/images/logo.png" alt="شعار المدرسة" className="w-full h-full object-contain filter drop-shadow-sm" onError={(e) => { e.target.onerror = null; e.target.src = '/Smart-School/public/images/school_logo.png' }} />
                                        </div>
                                    </div>

                                    {/* Left side: Meta details & Period */}
                                    <div className="flex flex-col items-end w-[38%] z-10">
                                        <div className="w-full max-w-[230px] bg-slate-50/50 print:bg-transparent border border-slate-200 print:border-slate-300 rounded-lg overflow-hidden shadow-sm print:shadow-none">
                                            <div className="h-1 w-full" style={{ backgroundColor: printSettings.brandColor }}></div>
                                            
                                            <div className="p-3 flex flex-col gap-2.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">رقم التقرير</span>
                                                    <span className="font-black text-slate-800 text-[11px]" dir="ltr">CV-{new Date().getFullYear().toString().substr(-2)}0{Math.floor(Math.random() * 900) + 100}</span>
                                                </div>
                                                
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تاريخ الطباعة</span>
                                                    <span className="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">{formatDateStr(new Date().toISOString().split('T')[0])}</span>
                                                </div>
                                                
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">متوسط التقييم</span>
                                                    <span className="font-bold text-emerald-700 text-[11px] font-mono tracking-wide" dir="ltr">{averageScore}%</span>
                                                </div>

                                                <div className="h-px w-full bg-slate-200 print:bg-slate-300 my-0.5"></div>
                                                
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1.5 text-slate-500">
                                                        <Calendar size={12} className="text-slate-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">الفترة</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-[10px] text-slate-800 font-mono tracking-wider" dir="ltr">{startDate ? formatDateStr(startDate) : 'بداية'}</span>
                                                        <span className="font-bold text-[10px] text-slate-800 font-mono tracking-wider" dir="ltr">{endDate ? formatDateStr(endDate) : 'اليوم'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Executive KPI Summary Cards */}
                            {printSettings.showKPIs && sortedTeachers.length > 0 && (
                                <div className="grid grid-cols-4 gap-3 mb-8">
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm print:shadow-none print:border-slate-300 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: printSettings.brandColor }}></div>
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style={{ backgroundColor: `${printSettings.brandColor}15`, color: printSettings.brandColor }}>
                                            <Eye size={18} />
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs font-bold mb-0.5">إجمالي الزيارات</p>
                                            <p className="text-lg font-black leading-none text-slate-800">{totalVisits}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm print:shadow-none print:border-slate-300 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: printSettings.brandColor }}></div>
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center mr-1 bg-emerald-50 text-emerald-600">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs font-bold mb-0.5">الزيارات المعتمدة</p>
                                            <p className="text-lg font-black leading-none text-emerald-700">{approvedVisits}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm print:shadow-none print:border-slate-300 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: printSettings.brandColor }}></div>
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center mr-1 bg-amber-50 text-amber-600">
                                            <Award size={18} />
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs font-bold mb-0.5">متوسط التقييم العام</p>
                                            <p className="text-lg font-black leading-none text-amber-700">{averageScore}%</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm print:shadow-none print:border-slate-300 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: printSettings.brandColor }}></div>
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center mr-1 bg-blue-50 text-blue-600">
                                            <Users size={18} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-slate-500 text-xs font-bold mb-0.5 truncate">عدد المعلمين المزارين</p>
                                            <p className="text-lg font-black leading-none text-blue-700">{uniqueTeachers}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Graphical Executive Summary (Bar Chart) */}
                            {printSettings.showKPIs && chartData.length > 0 && (
                                <div className="mt-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm print:shadow-none print:border-slate-300 relative overflow-hidden mb-6">
                                    <div className="absolute top-0 right-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: printSettings.brandColor }}></div>
                                    <h4 className="text-[15px] font-black text-slate-800 mb-5 flex items-center gap-2">
                                        إحصائيات تقييمات الزيارات الصفية حسب الأقسام
                                    </h4>
                                    <div className="h-[240px] w-full" dir="ltr">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                                                <Tooltip 
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', textAlign: 'right', direction: 'rtl', padding: '12px 16px' }}
                                                    itemStyle={{ fontWeight: 'bold', fontSize: '13px', padding: '4px 0' }}
                                                    labelStyle={{ color: '#475569', fontWeight: '900', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}
                                                />
                                                <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '13px', fontWeight: '600' }} iconType="circle" />
                                                <Bar dataKey="approved" name="معتمدة" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={28} />
                                                <Bar dataKey="pending" name="قيد الاعتماد" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Detailed Grouped Teacher Rows Table */}
                            {sortedTeachers.length > 0 ? (
                                <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:rounded-none bg-white">
                                    <table className="w-full text-right border-collapse text-sm">
                                        <thead className={`${printSettings.ecoMode ? 'bg-slate-100 text-slate-800 border-b-2 border-slate-800' : 'text-white'}`} style={!printSettings.ecoMode ? { backgroundColor: printSettings.brandColor } : {}}>
                                            <tr>
                                                <th className="py-3 px-4 font-bold text-center w-12 border-l border-white/20 first:rounded-tr-xl print:first:rounded-none">م</th>
                                                <th className="py-3 px-4 font-bold border-l border-white/20">نوع الزيارة</th>
                                                <th className="py-3 px-4 font-bold border-l border-white/20">الصف والشعبة</th>
                                                <th className="py-3 px-4 font-bold border-l border-white/20">المشرف الأكاديمي</th>
                                                <th className="py-3 px-4 font-bold text-center w-32 border-l border-white/20">تاريخ الزيارة</th>
                                                <th className="py-3 px-4 font-bold text-center w-28 border-l border-white/20 last:rounded-tl-xl print:last:rounded-none">التقييم (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedTeachers.map((teacher) => (
                                                <TeacherVisitGroup 
                                                    key={teacher.id} 
                                                    teacher={teacher} 
                                                    printSettings={printSettings}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 border-dashed print:hidden">
                                    <Eye className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">لا توجد سجلات زيارات صفية</h3>
                                    <p className="text-slate-500">لم يتم العثور على أي زيارات صفية تطابق الفلاتر المحددة.</p>
                                </div>
                            )}

                            {/* Signatures & Footer */}
                            <div className="mt-auto pt-16 relative">
                                <div className="absolute top-0 inset-x-0 h-px bg-slate-200"></div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1.5 rounded-b-lg" style={{ backgroundColor: printSettings.brandColor }}></div>

                                {/* Official Signature Placeholders */}
                                <div className="grid grid-cols-3 gap-6 mb-8 text-center print:grid">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 mb-12">مُعد التقرير (المشرف الأكاديمي)</p>
                                        <p className="text-sm font-black text-slate-800">....................................</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 mb-12">رئيس القسم / الوكيل الأكاديمي</p>
                                        <p className="text-sm font-black text-slate-800">....................................</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 mb-12">اعتماد مدير المدرسة</p>
                                        <p className="text-sm font-black text-slate-800">....................................</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 font-medium pb-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: printSettings.brandColor }}></span>
                                        <span>أُصدر هذا التقرير آلياً من نظام <strong className="px-1" style={{ color: printSettings.brandColor }}>SMART SCHOOL ERP</strong></span>
                                    </div>
                                    <div className="flex items-center gap-4" dir="ltr">
                                        <span>{new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: ${paperDims.maxWidth} ${paperDims.minHeight};
                        margin: ${printSettings.margins};
                    }
                    
                    body {
                        zoom: ${printSettings.scale};
                    }

                    body * {
                        visibility: hidden;
                    }
                    
                    .paper-container, .paper-container * {
                        visibility: visible;
                    }
                    
                    .paper-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }

                    /* Eco Mode Styling */
                    [data-eco="true"] {
                        filter: grayscale(100%) contrast(1.2);
                    }
                    [data-eco="true"] * {
                        background-color: transparent !important;
                        box-shadow: none !important;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </AdminLayout>
    );
}

const TeacherVisitGroup = ({ teacher, printSettings }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const recordsArray = Array.isArray(teacher?.records) ? teacher.records : (teacher?.records ? Object.values(teacher.records) : []);
    
    const approvedCount = teacher.approved_visits || 0;
    const pendingCount = teacher.pending_visits || 0;
    const avgScore = teacher.avg_score || 0;
    
    const isWarning = avgScore > 0 && avgScore < 75;

    return (
        <React.Fragment>
            <tr 
                className={`group cursor-pointer border-y ${isWarning ? 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/60' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'} transition-all duration-300 break-inside-avoid print:break-inside-avoid`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <td colSpan="6" className={`py-3.5 px-4 border-r-[3px] ${isWarning ? 'border-r-amber-500' : ''}`} style={!isWarning ? { borderRightColor: printSettings.brandColor } : {}}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl transition-transform duration-300 ${isExpanded ? 'bg-slate-200/50 rotate-180 text-slate-600' : 'bg-white shadow-sm text-slate-400 border border-slate-200 group-hover:border-slate-300'} print:hidden`}>
                                <ChevronDown size={16} />
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isWarning ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                    <Users size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-black text-lg ${isWarning ? 'text-amber-900' : 'text-slate-800'}`}>{teacher.employee_name || teacher.name}</span>
                                        {isWarning && <AlertTriangle size={16} className="text-amber-500 animate-pulse print:animate-none print:text-amber-700 hidden print:block" />}
                                    </div>
                                    <div className={`text-xs font-medium mt-0.5 ${isWarning ? 'text-amber-700/80' : 'text-slate-500'}`}>
                                        قسم {teacher.department} • إجمالي الزيارات: {teacher.total_visits || recordsArray.length}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 items-center">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-black ${avgScore >= 85 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : avgScore >= 70 ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20'}`}>
                                <Star size={14} className="fill-current" />
                                <span>متوسط التقييم: {avgScore}%</span>
                            </div>
                            {approvedCount > 0 && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 print:bg-transparent print:ring-emerald-700">
                                    <CheckCircle size={14} className="print:hidden text-emerald-500" />
                                    <span>معتمدة: {approvedCount}</span>
                                </div>
                            )}
                            {pendingCount > 0 && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 print:bg-transparent print:ring-amber-700">
                                    <Clock size={14} className="print:hidden text-amber-500" />
                                    <span>قيد الاعتماد: {pendingCount}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </td>
            </tr>

            {recordsArray.map((record, index) => (
                <tr 
                    key={record.id} 
                    className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors print:border-slate-300 ${isExpanded ? '' : 'hidden print:table-row'} bg-white break-inside-avoid print:break-inside-avoid`}
                >
                    <td className="py-3 px-4 text-slate-400 text-sm text-center font-medium">{index + 1}</td>
                    <td className="py-3 px-4 text-slate-800 font-bold">{record.visit_type}</td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                        {record.grade_name} {record.division_name ? `(${record.division_name})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{record.supervisor_name}</td>
                    <td className="py-3 px-4 text-center" dir="ltr">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-600 font-mono text-xs tracking-wider shadow-sm print:shadow-none print:bg-transparent print:border-none print:p-0">
                            <Calendar size={12} className="text-slate-400 print:hidden" />
                            <span>{formatDateStr(record.visit_date)}</span>
                        </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 justify-center px-3 py-1 text-xs font-black rounded-md ${record.score >= 85 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : record.score >= 70 ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20'}`}>
                            {record.score}%
                        </span>
                    </td>
                </tr>
            ))}
        </React.Fragment>
    );
};
