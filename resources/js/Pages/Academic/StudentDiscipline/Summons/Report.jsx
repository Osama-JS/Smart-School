import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ReportPrintLayout from "@/Components/Reports/ReportPrintLayout";
import {
    Search,
    Megaphone,
    AlertCircle,
    Calendar,
    Filter,
    X,
    ChevronDown,
    Sparkles
} from 'lucide-react';
import Select from 'react-select';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        borderRadius: '1rem',
        borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0', // blue-500
        backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1'
        }
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
        color: state.isSelected ? 'white' : '#1e293b',
        fontWeight: state.isSelected ? 'bold' : 'normal',
    })
};

export default function Report({ summons, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    const [showFilters, setShowFilters] = useState(false);

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(route('academic.parent-summons.report'), {
            start_date: startDate,
            end_date: endDate,
            status: status
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatus('');
        router.get(route('academic.parent-summons.report'));
    };

    const removeFilter = (filterId) => {
        let params = {
            start_date: startDate,
            end_date: endDate,
            status: status
        };
        if (filterId === 'date') { params.start_date = ''; params.end_date = ''; setStartDate(''); setEndDate(''); }
        if (filterId === 'status') { params.status = ''; setStatus(''); }
        router.get(route('academic.parent-summons.report'), params, { preserveState: true });
    };

    const getStatusLabel = (s) => {
        const statuses = {
            'scheduled': 'مجدول',
            'attended': 'تم الحضور',
            'no_show': 'لم يحضر',
            'cancelled': 'ملغى'
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

    const getStatusBadge = (status) => {
        const statuses = {
            'scheduled': { label: 'مجدول', className: 'bg-blue-100 text-blue-800 border-blue-200' },
            'attended': { label: 'تم الحضور', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
            'no_show': { label: 'لم يحضر', className: 'bg-rose-100 text-rose-800 border-rose-200' },
            'cancelled': { label: 'ملغى', className: 'bg-slate-100 text-slate-800 border-slate-200' }
        };
        const s = statuses[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.className} print:bg-transparent print:p-0 print:border-none print:text-black`}>{s.label}</span>;
    };

    // Frontend Smart Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [reasonFilter, setReasonFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedStudent, setSelectedStudent] = useState('');

    const processedSummons = summons.filter(summon => {
        if (selectedStudent && summon.student?.id !== selectedStudent) return false;
        if (statusFilter !== 'all' && summon.status !== statusFilter) return false;
        if (reasonFilter === 'violation' && !summon.violation) return false;
        return true;
    }).sort((a, b) => {
        const dateA = new Date(a.summon_date).getTime();
        const dateB = new Date(b.summon_date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const [printSettings, setPrintSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('ParentSummonsReportPrintSettings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            title: 'كشف استدعاء أولياء الأمور',
            orientation: 'portrait',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            showKPIs: true,
            showDetails: true,
            ecoMode: false,
            brandColor: '#1e293b' // slate-800
        };
    });

    useEffect(() => {
        localStorage.setItem('ParentSummonsReportPrintSettings', JSON.stringify(printSettings));
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

            const url = route('academic.parent-summons.report.pdf') + '?' + params.toString();
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
        <AdminLayout activeMenu="استدعاء أولياء الأمور">
            <Head title="كشف استدعاء أولياء الأمور" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50/70 via-white to-white dark:from-slate-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-slate-100 dark:border-slate-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl flex items-center justify-center shadow border border-slate-100 dark:border-slate-700">
                                    <Megaphone size={28} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">كشف استدعاء أولياء الأمور</h1>
                                    <p className="text-slate-600/80 dark:text-slate-300/80 mt-2 text-sm font-semibold">تقرير مخصص للمتابعة والطباعة للاستدعاءات الموجهة لأولياء الأمور</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="print:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative mb-6">
                        {/* Decorative Top Line */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-600 to-slate-400"></div>
                        
                        <div className="p-6">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                                <div className="flex items-center gap-4 w-full xl:w-auto">
                                    <button 
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`flex items-center gap-3 font-bold px-6 py-3 rounded-xl transition-all duration-300 w-full xl:w-auto ${
                                            showFilters 
                                            ? 'bg-slate-100 text-slate-800 shadow-inner' 
                                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-slate-200 text-slate-700' : 'bg-white shadow-sm text-slate-500'}`}>
                                            <Filter size={18} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[15px]">خيارات التصفية المتقدمة</span>
                                        {activeFilters.length > 0 && (
                                            <span className="flex items-center justify-center bg-slate-700 text-white text-xs font-black w-6 h-6 rounded-full mr-2 shadow-sm">
                                                {activeFilters.length}
                                            </span>
                                        )}
                                        <ChevronDown className={`w-5 h-5 mr-auto transition-transform duration-300 ${showFilters ? 'rotate-180 text-slate-700' : 'text-slate-400'}`} strokeWidth={2.5} />
                                    </button>
                                </div>
                            
                                <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 overflow-x-auto custom-scrollbar w-full xl:w-auto shadow-inner">
                                    <button onClick={() => setPresetDate('today')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-slate-900">اليوم</button>
                                    <button onClick={() => setPresetDate('week')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-slate-900">هذا الأسبوع</button>
                                    <button onClick={() => setPresetDate('month')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-slate-900">هذا الشهر</button>
                                    <button onClick={() => setPresetDate('last_month')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-slate-900">الشهر الماضي</button>
                                    <button onClick={() => setPresetDate('semester')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-slate-900">الفصل الدراسي</button>
                                </div>
                            </div>

                            {activeFilters.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-slate-100">
                                    <span className="text-sm font-bold text-slate-500 ml-2">الفلاتر النشطة:</span>
                                    {activeFilters.map(filter => (
                                        <span key={filter.id} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-300 text-slate-700 text-sm font-bold shadow-sm group">
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
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-sm h-[42px]"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">إلى تاريخ</label>
                                            <input
                                                type="date"
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-sm h-[42px]"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">حالة الاستدعاء</label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-sm h-[42px]"
                                            >
                                                <option value="">الكل</option>
                                                <option value="scheduled">مجدول</option>
                                                <option value="attended">تم الحضور</option>
                                                <option value="no_show">لم يحضر</option>
                                                <option value="cancelled">ملغى</option>
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
                    {summons.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 print:hidden">
                            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Filter size={18} strokeWidth={2.5} />
                                </div>
                                <h3 className="font-black text-slate-800 text-[15px]">أدوات التصفية والفرز (فورية)</h3>
                            </div>
                            
                            <div className="flex flex-col xl:flex-row items-start xl:items-end gap-5 justify-between">
                                <div className="flex flex-wrap items-end gap-5 w-full xl:w-auto">
                                    
                                    {/* Status Segmented Control */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[12px] font-bold text-slate-400 px-1">حالة الاستدعاء:</span>
                                        <div className="flex flex-wrap items-center bg-slate-50/80 border border-slate-200 p-1 rounded-xl shadow-inner gap-1">
                                            <button 
                                                onClick={() => setStatusFilter('all')}
                                                className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'}`}
                                            >الكل</button>
                                            <button 
                                                onClick={() => setStatusFilter('scheduled')}
                                                className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${statusFilter === 'scheduled' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200/80' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'}`}
                                            >مجدول ⏳</button>
                                            <button 
                                                onClick={() => setStatusFilter('no_show')}
                                                className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${statusFilter === 'no_show' ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-200/80' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'}`}
                                            >لم يحضر ❌</button>
                                            <button 
                                                onClick={() => setStatusFilter('attended')}
                                                className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${statusFilter === 'attended' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200/80' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'}`}
                                            >تم الحضور ✅</button>
                                        </div>
                                    </div>

                                    {/* Sort Segmented Control */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[12px] font-bold text-slate-400 px-1">فرز وترتيب:</span>
                                        <div className="flex items-center bg-slate-50/80 border border-slate-200 p-1 rounded-xl shadow-inner gap-1">
                                            <button 
                                                onClick={() => setSortOrder('asc')}
                                                className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${sortOrder === 'asc' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'}`}
                                            >الأقرب موعداً</button>
                                            <button 
                                                onClick={() => setSortOrder('desc')}
                                                className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${sortOrder === 'desc' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'}`}
                                            >الأحدث تسجيلاً</button>
                                        </div>
                                    </div>
                                    
                                    <label className="flex items-center justify-between cursor-pointer group p-1.5 pr-3 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-xl transition-colors h-[40px] w-[180px]" title="الاستدعاءات التي تم توليدها بسبب مخالفة سلوكية للطالب">
                                        <span className="text-[13px] font-bold text-amber-700 group-hover:text-amber-800 transition-colors flex items-center gap-1.5">
                                            <AlertCircle size={16} /> بسبب مخالفة
                                        </span>
                                        <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 shadow-inner ${reasonFilter === 'violation' ? 'bg-amber-500' : 'bg-amber-200'}`} onClick={(e) => { e.preventDefault(); setReasonFilter(reasonFilter === 'violation' ? 'all' : 'violation'); }}>
                                            <div className={`absolute top-0.5 bg-white w-4 h-4 rounded-full shadow transition-all duration-300 ${reasonFilter === 'violation' ? 'left-1' : 'right-1'}`}></div>
                                        </div>
                                    </label>

                                </div>
                                
                                <div className="w-full xl:w-72">
                                    <Select
                                        options={[
                                            { value: '', label: 'الكل (بحث باسم الطالب)' },
                                            ...Array.from(new Map(summons.filter(s => s.student).map(s => [s.student.id, s.student])).values()).map(student => ({ value: student.id, label: student.user?.name || 'غير معروف' }))
                                        ]}
                                        value={selectedStudent ? { value: selectedStudent, label: summons.find(s => s.student?.id === selectedStudent)?.student?.user?.name } : { value: '', label: 'الكل (بحث باسم الطالب)' }}
                                        onChange={(opt) => setSelectedStudent(opt ? opt.value : '')}
                                        placeholder="تتبع استدعاءات الطالب..."
                                        isClearable
                                        styles={{
                                            ...customSelectStyles,
                                            control: (base, state) => ({
                                                ...customSelectStyles.control(base, state),
                                                minHeight: '40px',
                                                borderWidth: '1px'
                                            })
                                        }}
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
                        subtitle={startDate && endDate ? `الفترة: ${startDate} إلى ${endDate}` : 'قسم التوجيه والإرشاد الطلابي'}
                    >
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm relative z-10 print:border-none print:shadow-none print:rounded-none">
                            {processedSummons.length === 0 ? (
                                <div className="p-12 text-center">
                                    <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد استدعاءات</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                        لا يوجد استدعاءات لأولياء الأمور تطابق الفلاتر المحددة.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-sm text-right print:border-collapse">
                                        <thead className="text-white text-xs uppercase font-black border-b print:border-black/30" style={{ backgroundColor: printSettings?.brandColor || '#1e293b', borderColor: printSettings?.brandColor || '#1e293b' }}>
                                            <tr>
                                                <th className="w-12 px-4 py-4 text-center border-l print:border-black/30 print:rounded-none" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>م</th>
                                                <th className="px-4 py-4 border-l print:border-black/30" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>تاريخ الاستدعاء</th>
                                                <th className="px-4 py-4 border-l print:border-black/30" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>اسم الطالب</th>
                                                <th className="px-4 py-4 border-l print:border-black/30" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>الصف / الشعبة</th>
                                                <th className="w-64 px-4 py-4 border-l print:border-black/30" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>سبب الاستدعاء</th>
                                                <th className="px-4 py-4 text-center border-l print:border-black/30" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>الحالة</th>
                                                <th className="w-32 px-4 py-4 text-center hidden print:table-cell print:border-black/30" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>توقيع ولي الأمر</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium print:divide-black/20">
                                            {processedSummons.map((summon, idx) => (
                                                <tr key={summon.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                                                    <td className="px-4 py-4 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        <div className="flex items-center gap-2 text-slate-900 dark:text-white print:text-black font-bold">
                                                            <Calendar className="w-4 h-4 text-slate-400 print:hidden" />
                                                            {new Date(summon.summon_date).toLocaleDateString('ar-SA')}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                                                            {summon.student?.user?.name || 'غير معروف'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 print:hidden">
                                                            {summon.student?.user?.id_number}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                        {summon.student?.active_enrollment ? 
                                                            `${summon.student.active_enrollment.division?.grade?.name || ''} - ${summon.student.active_enrollment.division?.name || ''}`
                                                        : '-'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                        {summon.violation && (
                                                            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-1 print:text-black">
                                                                مخالفة: {summon.violation.violation_type?.name}
                                                            </div>
                                                        )}
                                                        <p className="line-clamp-2 print:line-clamp-none">{summon.reason}</p>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        {getStatusBadge(summon.status)}
                                                    </td>
                                                    <td className="px-4 py-4 text-center hidden print:table-cell print:border-black/30">
                                                        {/* Empty cell for signature in print mode */}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Print Footer / Signatures - Only visible in print mode */}
                            {summons.length > 0 && (
                                <div className="hidden print:flex justify-between items-end p-8 mt-12 w-full">
                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">المرشد الطلابي</h4>
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
