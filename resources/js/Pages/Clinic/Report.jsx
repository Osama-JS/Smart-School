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
    Activity,
    Printer,
    X,
    ChevronDown
} from 'lucide-react';
import Select from 'react-select';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        borderRadius: '1rem',
        borderColor: state.isFocused ? '#10b981' : '#e2e8f0', // emerald-500
        backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? '#10b981' : '#cbd5e1'
        }
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#10b981' : state.isFocused ? '#ecfdf5' : 'white', // emerald-500/50
        color: state.isSelected ? 'white' : '#1e293b',
        fontWeight: state.isSelected ? 'bold' : 'normal',
    })
};

export default function Report({ visits, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    const [showFilters, setShowFilters] = useState(false);

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(route('clinic.report'), {
            start_date: startDate,
            end_date: endDate,
            status: status
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatus('');
        router.get(route('clinic.report'));
    };

    const removeFilter = (filterId) => {
        let params = {
            start_date: startDate,
            end_date: endDate,
            status: status
        };
        if (filterId === 'date') { params.start_date = ''; params.end_date = ''; setStartDate(''); setEndDate(''); }
        if (filterId === 'status') { params.status = ''; setStatus(''); }
        router.get(route('clinic.report'), params, { preserveState: true });
    };

    const activeFilters = [];
    if (startDate || endDate) activeFilters.push({ id: 'date', label: `التاريخ: ${startDate || 'الكل'} إلى ${endDate || 'الكل'}` });
    if (status) activeFilters.push({ id: 'status', label: `التصنيف: ${status}` });

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

    // Frontend Smart Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [healthFilter, setHealthFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedStudent, setSelectedStudent] = useState('');

    const processedVisits = visits.filter(visit => {
        if (selectedStudent && visit.student?.id !== selectedStudent) return false;
        
        if (statusFilter !== 'all' && visit.status !== statusFilter) return false;

        if (healthFilter === 'chronic' && !visit.student?.medical_record?.chronic_diseases) return false;
        if (healthFilter === 'allergies' && !visit.student?.medical_record?.allergies) return false;

        return true;
    }).sort((a, b) => {
        const dateA = new Date(a.visited_at).getTime();
        const dateB = new Date(b.visited_at).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

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
                    <div className="print:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative mb-6">
                        {/* Decorative Top Line */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-600 to-emerald-400"></div>
                        
                        <div className="p-6">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                                <div className="flex items-center gap-4 w-full xl:w-auto">
                                    <button 
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`flex items-center gap-3 font-bold px-6 py-3 rounded-xl transition-all duration-300 w-full xl:w-auto ${
                                            showFilters 
                                            ? 'bg-emerald-50 text-emerald-700 shadow-inner' 
                                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-emerald-100 text-emerald-600' : 'bg-white shadow-sm text-slate-500'}`}>
                                            <Filter size={18} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[15px]">خيارات التصفية المتقدمة</span>
                                        {activeFilters.length > 0 && (
                                            <span className="flex items-center justify-center bg-emerald-500 text-white text-xs font-black w-6 h-6 rounded-full mr-2 shadow-sm">
                                                {activeFilters.length}
                                            </span>
                                        )}
                                        <ChevronDown className={`w-5 h-5 mr-auto transition-transform duration-300 ${showFilters ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`} strokeWidth={2.5} />
                                    </button>
                                </div>
                            
                                <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 overflow-x-auto custom-scrollbar w-full xl:w-auto shadow-inner">
                                    <button onClick={() => setPresetDate('today')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-emerald-700">اليوم</button>
                                    <button onClick={() => setPresetDate('week')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-emerald-700">هذا الأسبوع</button>
                                    <button onClick={() => setPresetDate('month')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-emerald-700">هذا الشهر</button>
                                    <button onClick={() => setPresetDate('last_month')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-emerald-700">الشهر الماضي</button>
                                    <button onClick={() => setPresetDate('semester')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-emerald-700">الفصل الدراسي</button>
                                </div>
                            </div>

                            {activeFilters.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-slate-100">
                                    <span className="text-sm font-bold text-slate-500 ml-2">الفلاتر النشطة:</span>
                                    {activeFilters.map(filter => (
                                        <span key={filter.id} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-700 text-sm font-bold shadow-sm group">
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
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm h-[42px]"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">إلى تاريخ</label>
                                            <input
                                                type="date"
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm h-[42px]"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">تصنيف الحالة</label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm h-[42px]"
                                            >
                                                <option value="">الكل</option>
                                                <option value="عادي">عادي</option>
                                                <option value="طارئ">طارئ</option>
                                                <option value="متابعة">متابعة</option>
                                                <option value="محول للمستشفى">محول للمستشفى</option>
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

                    {/* Secondary Frontend Filters */}
                    {visits.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-5 print:hidden">
                            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 justify-between">
                                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                                    <span className="text-sm font-bold text-slate-500 ml-1">فلاتر ذكية (فورية):</span>
                                    
                                    <div className="flex flex-wrap items-center rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => setStatusFilter('all')}
                                            className={`px-3 py-2 text-sm font-bold transition-all ${statusFilter === 'all' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                                        >الكل</button>
                                        <button 
                                            onClick={() => setStatusFilter('طارئ')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-r border-slate-200 ${statusFilter === 'طارئ' ? 'bg-rose-500 text-white' : 'hover:bg-rose-50 text-rose-600'}`}
                                        >طارئ 🔴</button>
                                        <button 
                                            onClick={() => setStatusFilter('محول للمستشفى')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-r border-slate-200 ${statusFilter === 'محول للمستشفى' ? 'bg-amber-500 text-white' : 'hover:bg-amber-50 text-amber-600'}`}
                                        >محول للمستشفى 🚑</button>
                                        <button 
                                            onClick={() => setStatusFilter('متابعة')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-r border-slate-200 ${statusFilter === 'متابعة' ? 'bg-blue-500 text-white' : 'hover:bg-blue-50 text-blue-600'}`}
                                        >متابعة 🔄</button>
                                    </div>

                                    <div className="flex flex-wrap items-center rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
                                        <span className="px-3 py-2 text-sm font-bold text-slate-500 bg-slate-100 border-l border-slate-200">الفرز:</span>
                                        <button 
                                            onClick={() => setSortOrder('desc')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-l border-slate-200 ${sortOrder === 'desc' ? 'bg-slate-700 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                                        >الأحدث</button>
                                        <button 
                                            onClick={() => setSortOrder('asc')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-l border-slate-200 ${sortOrder === 'asc' ? 'bg-slate-700 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                                        >الأقدم</button>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => setHealthFilter(healthFilter === 'chronic' ? 'all' : 'chronic')}
                                            className={`px-4 py-2 text-sm font-bold transition-all border-l border-slate-200 flex items-center gap-1.5 ${healthFilter === 'chronic' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50 text-indigo-700'}`}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            أمراض مزمنة
                                        </button>
                                        <button 
                                            onClick={() => setHealthFilter(healthFilter === 'allergies' ? 'all' : 'allergies')}
                                            className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-1.5 ${healthFilter === 'allergies' ? 'bg-rose-600 text-white' : 'hover:bg-rose-50 text-rose-700'}`}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            حساسية
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="w-full xl:w-72">
                                    <Select
                                        options={[
                                            { value: '', label: 'الكل (بحث باسم الطالب)' },
                                            ...Array.from(new Map(visits.filter(v => v.student).map(v => [v.student.id, v.student])).values()).map(student => ({ value: student.id, label: student.user?.name || 'غير معروف' }))
                                        ]}
                                        value={selectedStudent ? { value: selectedStudent, label: visits.find(v => v.student?.id === selectedStudent)?.student?.user?.name } : { value: '', label: 'الكل (بحث باسم الطالب)' }}
                                        onChange={(opt) => setSelectedStudent(opt ? opt.value : '')}
                                        placeholder="بحث باسم الطالب..."
                                        isClearable
                                        styles={customSelectStyles}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

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
                            {processedVisits.length === 0 ? (
                                <div className="p-12 text-center">
                                    <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد زيارات</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                        لا توجد زيارات للعيادة مطابقة لمعايير التصفية المحددة للتقرير.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto print:overflow-visible flex justify-center">
                                    <div className="inline-block min-w-full lg:w-4/5 xl:w-3/4 bg-white rounded-xl shadow-sm border-2 border-slate-800 overflow-hidden print:shadow-none print:border-none print:w-full">
                                        <table className="w-full text-right border-collapse text-sm">
                                            <thead className={`${printSettings.ecoMode ? 'bg-slate-100 text-slate-800 border-b-2 border-slate-800' : 'text-white'}`} style={!printSettings.ecoMode ? { backgroundColor: printSettings.brandColor } : {}}>
                                                <tr>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 w-12 text-center">م</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 text-center w-32">التاريخ والوقت</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 w-48">الطالب / الصف</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 w-40">السجل المرضي</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300">الشكوى / الأعراض</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300">الإجراء المتخذ</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 text-center w-24">التصنيف</th>
                                                    <th className="px-4 py-3 font-bold border-y border-slate-300 text-center w-24 hidden print:table-cell">التوقيع</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 font-medium">
                                                {processedVisits.map((visit, idx) => {
                                                    const style = getStatusStyle(visit.status);
                                                    return (
                                                        <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3 text-center border-y border-slate-200 font-bold text-slate-700">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="px-4 py-3 text-center border-y border-slate-200" dir="ltr">
                                                                <div className="font-bold text-slate-800">
                                                                    {new Date(visit.visited_at).toLocaleDateString('en-CA')}
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    {new Date(visit.visited_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 border-y border-slate-200">
                                                                <div className="font-bold text-slate-900">
                                                                    {visit.student?.user?.name || 'غير معروف'}
                                                                </div>
                                                                <div className="text-xs text-slate-600 mt-1">
                                                                    {visit.student?.current_enrollment ? 
                                                                        `${visit.student.current_enrollment.division?.grade?.name || ''} - ${visit.student.current_enrollment.division?.name || ''}`
                                                                    : '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 border-y border-slate-200 text-xs">
                                                                {visit.student?.medical_record ? (
                                                                    <div className="text-slate-700 space-y-1">
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
                                                                    <span className="text-slate-400">لا يوجد سجل</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 border-y border-slate-200 text-sm text-slate-700">
                                                                <p className="line-clamp-2 print:line-clamp-none">{visit.symptoms}</p>
                                                            </td>
                                                            <td className="px-4 py-3 border-y border-slate-200 text-sm text-slate-700">
                                                                <p className="line-clamp-2 print:line-clamp-none">{visit.action_taken}</p>
                                                            </td>
                                                            <td className="px-4 py-3 text-center border-y border-slate-200">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${style.badge} print:bg-transparent print:p-0 print:border-none print:text-black`}>
                                                                    {style.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center hidden print:table-cell border-y border-slate-200">
                                                                {/* Empty cell for signature in print mode */}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
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
