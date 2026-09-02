import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Printer, Filter, Calendar, Users, Briefcase, FileDown, Search, ArrowRight, X, AlertTriangle, Trophy, ChevronDown, XCircle, Clock, CheckCircle, UserCheck, Loader2 } from 'lucide-react';
import ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';
import Select from 'react-select';
import pdfMakeLib from 'pdfmake/build/pdfmake';
const pdfMake = pdfMakeLib.default || pdfMakeLib;
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Pagination from '@/Components/Pagination';

const formatDateStr = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return dateString;
};

export default function EmployeeLeaves({ employeesData, kpis, departmentChartData, allEmployees, departments, periodStart, periodEnd, filters }) {
    const safeEmployees = Array.isArray(employeesData) ? employeesData : (employeesData ? Object.values(employeesData) : []);
    const safeDepartments = Array.isArray(departments) ? departments : (departments ? Object.values(departments) : []);
    const safeChartData = Array.isArray(departmentChartData) ? departmentChartData : (departmentChartData ? Object.values(departmentChartData) : []);
    const safeAllEmployees = Array.isArray(allEmployees) ? allEmployees : (allEmployees ? Object.values(allEmployees) : []);

    const [startDate, setStartDate] = useState(filters?.start_date || periodStart || '');
    const [endDate, setEndDate] = useState(filters?.end_date || periodEnd || '');
    const [selectedDepartment, setSelectedDepartment] = useState(
        filters?.department_id ? { value: filters.department_id, label: safeDepartments.find(d => d.id == filters.department_id)?.name } : null
    );
    const [selectedEmployee, setSelectedEmployee] = useState(
        filters?.employee_id ? { value: filters.employee_id, label: safeAllEmployees.find(t => t.id == filters.employee_id)?.name } : null
    );
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [achieversOnly, setAchieversOnly] = useState(filters.achievers_only === true || filters.achievers_only === 'true');
    const [showFilters, setShowFilters] = useState(false);
    
    // Print Settings State
    const [printSettings, setPrintSettings] = useState(() => {
        const defaultSettings = {
            title: 'تقرير إجازات الموظفين',
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
            const saved = localStorage.getItem('EmployeeLeavesPrintSettings');
            if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {}
        return defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('EmployeeLeavesPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);// KPIs Calculations (from backend)
    const { totalLeaves = 0, totalLeaveDays = 0, uniqueEmployeesOnLeave = 0, mostAchievingDept = '-' } = kpis || {};
    const uniqueAchievers = kpis?.unique_achievers || 0;
    
    const chartData = safeChartData || [];

    let sortedEmployeesData = [...safeEmployees].sort((a, b) => {
        return (b.total_days || 0) - (a.total_days || 0);
    });

    if (achieversOnly) {
        sortedEmployeesData = sortedEmployeesData.filter(data => {
            return data.total_leaves > 0;
        });
    }

    const handleFilter = (e) => {
        if(e) e.preventDefault();
        router.get(route('hr.reports.employee-leaves'), {
            start_date: startDate,
            end_date: endDate,
            department_id: selectedDepartment?.value || '',
            employee_id: selectedEmployee?.value || '',
            achievers_only: achieversOnly
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedDepartment(null);
        setSelectedEmployee(null);
        setAchieversOnly(false);
        router.get(route('hr.reports.employee-leaves'));
    };

    const removeFilter = (filterId) => {
        if (filterId === 'achievers') {
            setAchieversOnly(false);
            router.get(route('hr.reports.employee-leaves'), {
                start_date: startDate,
                end_date: endDate,
                department_id: selectedDepartment?.value || '',
                employee_id: selectedEmployee?.value || '',
                achievers_only: false
            }, { preserveState: true });
            return;
        }

        let newStartDate = startDate;
        let newEndDate = endDate;
        let newDept = selectedDepartment;
        let newEmployee = selectedEmployee;

        if (filterId === 'date') { newStartDate = ''; newEndDate = ''; setStartDate(''); setEndDate(''); }
        if (filterId === 'dept') { newDept = null; setSelectedDepartment(null); }
        if (filterId === 'employee') { newEmployee = null; setSelectedEmployee(null); }

        router.get(route('hr.reports.employee-leaves'), {
            start_date: newStartDate,
            end_date: newEndDate,
            department_id: newDept?.value || '',
            employee_id: newEmployee?.value || '',
            achievers_only: achieversOnly
        }, { preserveState: true });
    };

    const activeFilters = [];
    if (startDate || endDate) activeFilters.push({ id: 'date', label: `التاريخ: ${startDate || 'الكل'} إلى ${endDate || 'الكل'}` });
    if (selectedDepartment) activeFilters.push({ id: 'dept', label: `القسم: ${selectedDepartment.label}` });
    if (selectedEmployee) activeFilters.push({ id: 'employee', label: `الموظف: ${selectedEmployee.label}` });
    if (achieversOnly) activeFilters.push({ id: 'achievers', label: `المجازين فقط` });

    const setPresetDate = (preset) => {
        const today = new Date();
        let start = new Date(today);
        let end = new Date(today);
        
        if (preset === 'today') {
            // Already today
        } else if (preset === 'week') {
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

    // Helper to fetch font and convert to base64
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
            // Fetch the local Arabic font from the public directory
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
                // Header row
                [
                    { text: 'م', style: 'tableHeader', alignment: 'center' },
                    { text: 'اسم الموظف', style: 'tableHeader', alignment: 'center' },
                    { text: 'القسم', style: 'tableHeader', alignment: 'center' },
                    { text: 'تاريخ الإجازة', style: 'tableHeader', alignment: 'center' },
                    { text: 'نوع الإجازة', style: 'tableHeader', alignment: 'center' },
                    { text: 'الأيام', style: 'tableHeader', alignment: 'center' },
                    { text: 'التفاصيل', style: 'tableHeader', alignment: 'center' }
                ]
            ];

            let count = 1;
            sortedEmployeesData.forEach(data => {
                data.records.forEach(record => {
                    tableBody.push([
                        { text: count.toString(), alignment: 'center' },
                        { text: data.employee_name, alignment: 'right' },
                        { text: data.department || '-', alignment: 'right' },
                        { text: formatDateStr(record.leave_date), alignment: 'center' },
                        { text: record.type_name, alignment: 'center' },
                        { text: record.days ? record.days.toString() : '-', alignment: 'center' },
                        { text: record.details ? record.details : '-', alignment: 'center' }
                    ]);
                    count++;
                });
            });

            if (tableBody.length === 1) {
                tableBody.push([{ text: 'لا توجد بيانات', colSpan: 7, alignment: 'center' }, {}, {}, {}, {}, {}, {}]);
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
                    { text: printSettings.title || 'تقرير إجازات الموظفين', style: 'header' },
                    {
                        columns: [
                            { text: `من: ${startDate || '-'}`, alignment: 'right' },
                            { text: `إلى: ${endDate || '-'}`, alignment: 'right' },
                            { text: `إجمالي الإجازات: ${totalLeaves}`, alignment: 'right' },
                            { text: `إجمالي الأيام: ${totalLeaveDays}`, alignment: 'right' }
                        ],
                        margin: [0, 0, 0, 20]
                    },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['auto', '*', '*', 'auto', 'auto', 'auto', 'auto'],
                            body: tableBody
                        },
                        layout: 'lightHorizontalLines'
                    }
                ]
            };

            pdfMake.createPdf(docDefinition).download('employee_leaves.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء توليد الملف: ' + (error.message || error));
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const customStyles = {
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
        <AdminLayout activeMenu="التقارير">
            <Head title="تقرير إجازات الموظفين" />

            <div className="bg-slate-50/50 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 font-cairo print:bg-white print:p-0">
                <div className="space-y-6">
                <div className="print:hidden relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    {/* Decorative Top Line */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400 z-20"></div>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary-50 to-transparent pointer-events-none"></div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3.5 bg-white border border-primary-100 shadow-sm rounded-xl text-primary-600 flex-shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <Trophy size={28} strokeWidth={2} className="relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-black text-slate-800 tracking-tight mb-1">
                                تقرير إجازات الموظفين
                            </h1>
                            <p className="text-[13.5px] font-bold text-slate-500">عرض وطباعة سجلات الإجازات للموظفين</p>
                        </div>
                    </div>
                    <div className="flex gap-3 relative z-10 w-full sm:w-auto">
                        <button
                            onClick={handlePrintClick}
                            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all font-bold"
                        >
                            <Printer size={18} strokeWidth={2.5} />
                            <span>طباعة التقرير</span>
                        </button>
                    </div>
                </div>

                <div className="print:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative mb-6">
                    {/* Decorative Top Line */}
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
                                <button onClick={() => setPresetDate('today')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-primary-700">اليوم</button>
                                <button onClick={() => setPresetDate('week')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-primary-700">هذا الأسبوع</button>
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
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">القسم</label>
                                    <Select
                                        options={safeDepartments.map(d => ({ value: d.id, label: d.name }))}
                                        value={selectedDepartment}
                                        onChange={setSelectedDepartment}
                                        placeholder="اختر القسم..."
                                        isClearable
                                        styles={{
                                            ...customStyles,
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
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">الموظف</label>
                                    <Select
                                        options={safeAllEmployees.map(t => ({ value: t.id, label: t.name }))}
                                        value={selectedEmployee}
                                        onChange={setSelectedEmployee}
                                        placeholder="ابحث عن موظف..."
                                        isClearable
                                        styles={{
                                            ...customStyles,
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
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer w-full xl:w-auto ${achieversOnly ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                                        onClick={() => setAchieversOnly(!achieversOnly)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${achieversOnly ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${achieversOnly ? 'left-1' : 'right-1'}`}></div>
                                            </div>
                                            <div>
                                                <div className={`font-bold text-[15px] leading-none mb-1 ${achieversOnly ? 'text-emerald-700' : 'text-slate-700'}`}>عرض المجازين فقط</div>
                                                <div className={`text-xs font-semibold ${achieversOnly ? 'text-emerald-500' : 'text-slate-500'}`}>من لديه إجازات</div>
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
        </div>

        <ReportPrintLayout title={printSettings.title} printSettings={printSettings} setPrintSettings={setPrintSettings} onPrint={handlePrintClick} onDownloadPdf={handleDownloadPDF} isGeneratingPdf={isGeneratingPdf} startDate={startDate} endDate={endDate}>

                    {printSettings.showKPIs && sortedEmployeesData.length > 0 && (
                        <div className="grid grid-cols-4 gap-3 mb-8">
                            {/* Card 1 */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm print:shadow-none print:border-slate-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: printSettings.brandColor }}></div>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style={{ backgroundColor: `${printSettings.brandColor}15`, color: printSettings.brandColor }}>
                                    <XCircle size={18} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold mb-0.5">إجمالي الإجازات</p>
                                    <p className="text-lg font-black leading-none text-slate-800">{totalLeaves}</p>
                                </div>
                            </div>
                            
                            {/* Card 2 */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm print:shadow-none print:border-slate-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: printSettings.brandColor }}></div>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style={{ backgroundColor: `${printSettings.brandColor}15`, color: printSettings.brandColor }}>
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold mb-0.5">إجمالي الأيام</p>
                                    <p className="text-lg font-black leading-none text-slate-800">{totalLeaveDays}</p>
                                </div>
                            </div>
                            
                            {/* Card 3 */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm print:shadow-none print:border-slate-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: printSettings.brandColor }}></div>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style={{ backgroundColor: `${printSettings.brandColor}15`, color: printSettings.brandColor }}>
                                    <Users size={18} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold mb-0.5">الموظفين المجازين</p>
                                    <p className="text-lg font-black leading-none text-slate-800">{uniqueEmployeesOnLeave}</p>
                                </div>
                            </div>
                            
                            {/* Card 4 */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm print:shadow-none print:border-slate-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: printSettings.brandColor }}></div>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center mr-1" style={{ backgroundColor: `${printSettings.brandColor}15`, color: printSettings.brandColor }}>
                                    <AlertTriangle size={18} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-slate-500 text-xs font-bold mb-0.5 truncate">القسم الأكثر إجازةاً</p>
                                    <p className="text-sm font-black leading-tight text-slate-800 truncate" title={mostAchievingDept}>{mostAchievingDept}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Graphical Executive Summary (Bar Chart) */}
                    {printSettings.showKPIs && chartData.length > 0 && (
                        <div className="mt-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm print:shadow-none print:border-slate-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: printSettings.brandColor }}></div>
                            <h4 className="text-[15px] font-black text-slate-800 mb-5 flex items-center gap-2">
                                الإحصائيات حسب الأقسام
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
                                        <Bar dataKey="total_leaves" name="إجمالي الإجازات" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
                                        <Bar dataKey="total_days" name="إجمالي الأيام" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {sortedEmployeesData.length > 0 ? (
                        <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:rounded-none bg-white">
                            <table className="w-full text-right border-collapse text-sm">
                                <thead className={`${printSettings.ecoMode ? 'bg-slate-100 text-slate-800 border-b-2 border-slate-800' : 'text-white'}`} style={!printSettings.ecoMode ? { backgroundColor: printSettings.brandColor } : {}}>
                                    <tr>
                                        <th className="py-3 px-4 font-bold text-center w-12 border-l border-white/20 first:rounded-tr-xl print:first:rounded-none">م</th>
                                        <th className="py-3 px-4 font-bold border-l border-white/20">نوع الإجازة</th>
                                        <th className="py-3 px-4 font-bold text-center w-32 border-l border-white/20">الأيام</th>
                                        <th className="py-3 px-4 font-bold text-center w-32 border-l border-white/20 last:rounded-tl-xl print:last:rounded-none">التفاصيل</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedEmployeesData.map((data) => (
                                        <EmployeeRowGroup 
                                            key={data.id} 
                                            employeeName={data.employee_name} 
                                            data={data} 
                                            printSettings={printSettings}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 border-dashed print:hidden">
                            <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-800 mb-1">لا توجد سجلات إجازات</h3>
                            <p className="text-slate-500">لم يتم العثور على أي إجازات تطابق الفلاتر المحددة.</p>
                        </div>
                    )}

                </ReportPrintLayout>
            </div>
        </AdminLayout>
    );
}

const EmployeeRowGroup = ({ employeeName, data, printSettings }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const recordsArray = Array.isArray(data?.records) ? data.records : (data?.records ? Object.values(data.records) : []);
    const leavesCount = recordsArray.length;
    const totalLeaveDays = recordsArray.reduce((sum, r) => sum + (Number(r.days) || 0), 0);
    const isHighAchiever = totalLeaveDays >= 50 || leavesCount >= 5;

    return (
        <React.Fragment>
            <tr 
                className={`group cursor-pointer border-y ${isHighAchiever ? 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/60' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'} transition-all duration-300 break-inside-avoid print:break-inside-avoid`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <td colSpan="4" className={`py-3.5 px-4 border-r-[3px] ${isHighAchiever ? 'border-r-amber-500' : ''}`} style={!isHighAchiever ? { borderRightColor: printSettings.brandColor } : {}}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl transition-transform duration-300 ${isExpanded ? 'bg-slate-200/50 rotate-180 text-slate-600' : 'bg-white shadow-sm text-slate-400 border border-slate-200 group-hover:border-slate-300'} print:hidden`}>
                                <ChevronDown size={16} />
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isHighAchiever ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                    <Users size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-black text-lg ${isHighAchiever ? 'text-amber-900' : 'text-slate-800'}`}>{employeeName}</span>
                                        {isHighAchiever && <Trophy size={16} className="text-amber-500 animate-pulse print:animate-none print:text-amber-700 hidden print:block" />}
                                    </div>
                                    <div className={`text-xs font-medium mt-0.5 ${isHighAchiever ? 'text-amber-600/80' : 'text-slate-500'}`}>
                                        قسم {data.department}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            {leavesCount > 0 && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10 print:bg-transparent print:ring-amber-700">
                                    <Trophy size={14} className="print:hidden text-amber-500" />
                                    <span>عدد الإجازات: {leavesCount}</span>
                                </div>
                            )}
                            {totalLeaveDays > 0 && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 print:bg-transparent print:ring-emerald-700">
                                    <CheckCircle size={14} className="print:hidden text-emerald-500" />
                                    <div className="flex flex-col sm:flex-row items-center sm:gap-1.5">
                                        <span>الأيام: {totalLeaveDays}</span>
                                    </div>
                                </div>
                            )}
                            {leavesCount === 0 && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 print:bg-transparent print:ring-slate-700">
                                    <XCircle size={14} className="print:hidden text-slate-500" />
                                    <span>لا توجد إجازات</span>
                                </div>
                            )}
                        </div>
                    </div>
                </td>
            </tr>
            {recordsArray.map((leave, index) => (
                <tr 
                    key={leave.id} 
                    className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors print:border-slate-300 ${isExpanded ? '' : 'hidden print:table-row'} bg-white break-inside-avoid print:break-inside-avoid`}
                >
                    <td className="py-3 px-4 text-slate-400 text-sm text-center font-medium">{index + 1}</td>
                    <td className="py-3 px-4 text-slate-700 font-bold">{leave.type_name}</td>
                    <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-emerald-600">+{leave.days ? leave.days : '0'}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-slate-600 text-sm">{leave.details ? leave.details : '-'}</span>
                    </td>
                </tr>
            ))}
        </React.Fragment>
    );
};

