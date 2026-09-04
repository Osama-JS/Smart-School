import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, Link } from '@inertiajs/react';
import { Search, Calendar, UserX, Clock, Filter, X, CheckCircle, AlertTriangle, BookX } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';

import Select from 'react-select';

// Custom styles for React Select
const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        borderRadius: '0.75rem',
        borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
        backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1'
        }
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: '#eff6ff',
        borderRadius: '0.5rem',
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: '#1d4ed8',
        fontWeight: 'bold',
        fontSize: '0.75rem',
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: '#1d4ed8',
        ':hover': {
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            borderRadius: '0 0.5rem 0.5rem 0',
        },
    }),
};

export default function AttendanceReport({ logs, filters, divisions, grades, studentsList }) {
    const [date, setDate]           = useState(filters.date || new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate]     = useState(filters.end_date || '');
    const [search, setSearch]       = useState(filters.search || '');
    const [status, setStatus]       = useState(filters.status ? (Array.isArray(filters.status) ? filters.status : [filters.status]) : []);
    const [gradeId, setGradeId]     = useState(filters.grade_id || '');
    const [divisionId, setDivisionId] = useState(filters.division_id ? (Array.isArray(filters.division_id) ? filters.division_id : [filters.division_id]) : []);
    const [smartFilter, setSmartFilter] = useState(filters.smart_filter || '');
    const [showFilters, setShowFilters] = useState(false);

    const [printSettings, setPrintSettings] = useState(() => {
        const defaultSettings = {
            title: 'تقرير غياب الطلاب',
            showKPIs: true,
            showDetails: true,
            orientation: 'portrait',
            ecoMode: false,
            watermark: 'none',
            paperSize: 'A4',
            margins: 'normal',
            scale: 1,
            pagesPerSheet: 1,
            brandColor: '#2563eb',
        };
        try {
            const saved = localStorage.getItem('AttendanceReportPrintSettings');
            if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {}
        return defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('AttendanceReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                search: search || '',
                date: date || '',
                start_date: startDate || '',
                end_date: endDate || '',
                status: status || '',
                division_id: divisionId || '',
                printSettings: JSON.stringify(printSettings)
            });
            const url = route('academic.attendances.report.pdf') + '?' + params.toString();
            window.location.href = url;
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء طلب الملف.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handlePrint = () => window.print();

    const applyFilters = (e) => {
        if (e) e.preventDefault();
        router.get(route('academic.attendances.report'), {
            date, search, 
            status, 
            grade_id: gradeId,
            division_id: divisionId, 
            start_date: startDate, 
            end_date: endDate,
            smart_filter: smartFilter
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        setStartDate('');
        setEndDate('');
        setSearch('');
        setStatus([]);
        setGradeId('');
        setDivisionId([]);
        setSmartFilter('');
        router.get(route('academic.attendances.report'), { date: today });
    };

    const removeFilter = (filterId) => {
        let params = { date, search, status, grade_id: gradeId, division_id: divisionId, start_date: startDate, end_date: endDate, smart_filter: smartFilter };
        if (filterId === 'search')   { params.search = '';      setSearch(''); }
        if (filterId === 'status')   { params.status = [];      setStatus([]); }
        if (filterId === 'grade')    { params.grade_id = '';    setGradeId(''); params.division_id = []; setDivisionId([]); }
        if (filterId === 'division') { params.division_id = []; setDivisionId([]); }
        if (filterId === 'range')    { params.start_date = ''; params.end_date = ''; setStartDate(''); setEndDate(''); }
        if (filterId === 'smart_filter') { params.smart_filter = ''; setSmartFilter(''); }
        router.get(route('academic.attendances.report'), params, { preserveState: true, replace: true });
    };

    const applySmartFilter = (filterType) => {
        const newSmartFilter = smartFilter === filterType ? '' : filterType;
        setSmartFilter(newSmartFilter);
        router.get(route('academic.attendances.report'), {
            ...filters,
            smart_filter: newSmartFilter
        }, { preserveState: true, replace: true });
    };

    const setPresetDate = (preset) => {
        const today = new Date();
        let start = new Date(today);
        let end = new Date(today);
        if (preset === 'today') {
            setDate(fmt(today));
            return;
        }
        if (preset === 'week')  { start.setDate(today.getDate() - today.getDay()); }
        if (preset === 'month') { start.setDate(1); }
        if (preset === 'last_month') {
            start.setMonth(today.getMonth() - 1); start.setDate(1);
            end = new Date(today.getFullYear(), today.getMonth(), 0);
        }
        if (preset === 'semester') { start.setMonth(today.getMonth() - 4); }
        setStartDate(fmt(start));
        setEndDate(fmt(end));
    };

    const fmt = (d) => {
        let m = '' + (d.getMonth() + 1);
        let dy = '' + d.getDate();
        if (m.length < 2) m = '0' + m;
        if (dy.length < 2) dy = '0' + dy;
        return [d.getFullYear(), m, dy].join('-');
    };

    const getDivisionName = (id) => {
        const d = divisions?.find(d => d.id == id);
        return d ? `${d.grade?.name} - ${d.name}` : id;
    };
    const getStatusLabel = (s) => {
        const map = { present: 'حاضر', absent: 'غائب', late: 'متأخر', excused: 'عذر / استئذان' };
        return map[s] || s;
    };

    const activeFilters = [];
    if (search)     activeFilters.push({ id: 'search',   label: `بحث: ${search}` });
    if (gradeId) {
        const gName = grades?.find(g => g.id == gradeId)?.name || gradeId;
        activeFilters.push({ id: 'grade', label: `الصف: ${gName}` });
    }
    if (status && status.length > 0) {
        activeFilters.push({ id: 'status',   label: `الحالة: ${status.map(s => getStatusLabel(s)).join(' و ')}` });
    }
    if (divisionId && divisionId.length > 0) {
        activeFilters.push({ id: 'division', label: `الفصول: ${divisionId.map(id => getDivisionName(id)).join(' و ')}` });
    }
    if (startDate || endDate) activeFilters.push({ id: 'range', label: `الفترة: ${startDate || 'الكل'} إلى ${endDate || 'الكل'}` });
    if (smartFilter) {
        const labels = {
            'absent_today': 'غائبون بدون عذر اليوم',
            'frequent_late': 'تأخر متكرر هذا الشهر',
            'frequent_absent': 'غياب متكرر هذا الشهر'
        };
        activeFilters.push({ id: 'smart_filter', label: `فلتر ذكي: ${labels[smartFilter] || smartFilter}` });
    }

    const availableDivisions = gradeId 
        ? divisions?.filter(d => d.grade_id == gradeId)
        : divisions;

    const availableStudents = studentsList?.filter(s => {
        let match = true;
        if (gradeId) {
            match = match && s.grade_id == gradeId;
        }
        if (divisionId && divisionId.length > 0) {
            match = match && divisionId.includes(s.division_id);
        }
        return match;
    });

    const subtitle = startDate && endDate
        ? `من ${startDate} إلى ${endDate}`
        : `بتاريخ ${date}`;

    return (
        <AdminLayout activeMenu="الغياب المدرسي">
            <Head title="تقارير الغياب المدرسي | النظام الإداري" />

            <div className="space-y-6">

                {/* Header */}
                <div className="print:hidden relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400 z-20"></div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary-50 to-transparent pointer-events-none"></div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3.5 bg-white border border-primary-100 shadow-sm rounded-xl text-primary-600 flex-shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <UserX size={28} strokeWidth={2} className="relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-black text-slate-800 tracking-tight mb-1">تقرير غياب الطلاب</h1>
                            <p className="text-[13.5px] font-bold text-slate-500">تتبع الحضور والغياب اليومي للطلاب عن المدرسة</p>
                        </div>
                    </div>

                </div>

                {/* Filter Panel */}
                <div className="print:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>

                    <div className="p-5">
                        {/* Top bar: toggle + date presets */}
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

                            {/* Date Presets */}
                            <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 overflow-x-auto hide-scrollbar w-full xl:w-auto shadow-inner">
                                <button onClick={() => setPresetDate('today')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-primary-700">اليوم</button>
                                <button onClick={() => setPresetDate('week')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-primary-700">هذا الأسبوع</button>
                                <button onClick={() => setPresetDate('month')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-primary-700">هذا الشهر</button>
                                <button onClick={() => setPresetDate('last_month')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-primary-700">الشهر الماضي</button>
                                <button onClick={() => setPresetDate('semester')} className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm focus:text-primary-700">الفصل الدراسي</button>
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

                        {/* Smart Filters Preset Row */}
                        <div className="flex gap-2 print:hidden mt-5 overflow-x-auto hide-scrollbar pt-2 border-t border-slate-100">
                            <span className="text-sm font-bold text-slate-500 ml-2 mt-2">فلاتر ذكية وسريعة:</span>
                            <button 
                                onClick={() => applySmartFilter('absent_today')}
                                className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${smartFilter === 'absent_today' ? 'bg-red-600 text-white' : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'}`}
                            >
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                غائبون بدون عذر
                            </button>
                            <button 
                                onClick={() => applySmartFilter('frequent_late')}
                                className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${smartFilter === 'frequent_late' ? 'bg-amber-500 text-white' : 'bg-white border border-amber-200 text-amber-600 hover:bg-amber-50'}`}
                            >
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                تأخر صباحي متكرر
                            </button>
                            <button 
                                onClick={() => applySmartFilter('frequent_absent')}
                                className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${smartFilter === 'frequent_absent' ? 'bg-indigo-600 text-white' : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}
                            >
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                غياب متكرر
                            </button>
                        </div>

                        {/* Collapsible form */}
                        <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                                    {/* Search */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">البحث باسم الطالب</label>
                                        <Select
                                            options={[
                                                { value: '', label: 'الكل' },
                                                ...(availableStudents || [])
                                            ]}
                                            value={search ? { value: search, label: search } : { value: '', label: 'الكل' }}
                                            onChange={(selected) => setSearch(selected ? selected.value : '')}
                                            placeholder="اختر طالباً..."
                                            isClearable
                                            styles={customSelectStyles}
                                            noOptionsMessage={() => "لا يوجد طلاب في هذا النطاق"}
                                        />
                                    </div>

                                    {/* Date (single) */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">تاريخ محدد</label>
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
                                            onChange={(val) => { setGradeId(val); setDivisionId([]); }} // Reset division on grade change
                                            placeholder="كل الصفوف"
                                            options={[
                                                { value: '', label: 'كل الصفوف' },
                                                ...(grades?.map(g => ({
                                                    value: g.id,
                                                    label: g.name
                                                })) || [])
                                            ]}
                                        />
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">حالة الحضور</label>
                                        <Select
                                            isMulti
                                            options={[
                                                { value: 'present', label: 'حاضر' },
                                                { value: 'late', label: 'متأخر' },
                                                { value: 'absent', label: 'غائب' },
                                                { value: 'excused', label: 'عذر / استئذان' },
                                            ]}
                                            value={status?.map(s => ({ value: s, label: getStatusLabel(s) }))}
                                            onChange={(selected) => setStatus(selected ? selected.map(item => item.value) : [])}
                                            placeholder="كل الحالات"
                                            styles={customSelectStyles}
                                            noOptionsMessage={() => "لا يوجد خيارات"}
                                        />
                                    </div>

                                    {/* Division */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">الفصل / الشعبة</label>
                                        <Select
                                            isMulti
                                            options={[
                                                ...(availableDivisions?.map(div => ({
                                                    value: div.id,
                                                    label: `${div.grade?.name} - ${div.name}`
                                                })) || [])
                                            ]}
                                            value={divisionId?.map(id => ({ value: id, label: getDivisionName(id) }))}
                                            onChange={(selected) => setDivisionId(selected ? selected.map(item => item.value) : [])}
                                            placeholder="كل الفصول"
                                            styles={customSelectStyles}
                                            noOptionsMessage={() => "لا توجد فصول"}
                                        />
                                    </div>

                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">من تاريخ (فترة)</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3"
                                        />
                                    </div>

                                    {/* End Date + Buttons */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">إلى تاريخ (فترة)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="flex-1 border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="md:col-span-2 xl:col-span-3 flex gap-3 pt-1">
                                        <button
                                            type="submit"
                                            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-all font-bold shadow-sm"
                                        >
                                            <Search size={16} strokeWidth={2.5} />
                                            <span>تطبيق الفلترة</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all flex items-center gap-2"
                                        >
                                            <X size={16} strokeWidth={2.5} />
                                            <span className="hidden sm:inline">مسح</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <ReportPrintLayout
                    title={printSettings.title}
                    printSettings={printSettings}
                    setPrintSettings={setPrintSettings}
                    onPrint={handlePrint}
                    onDownloadPdf={handleDownloadPDF}
                    isGeneratingPdf={isGeneratingPdf}
                    subtitle={subtitle}
                    startDate={startDate || date}
                    endDate={endDate || date}
                >
                    <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 print:shadow-none print:border-none">
                        <table className="w-full text-sm text-right">
                            <thead className="text-white border-b print:border-black" style={{ backgroundColor: printSettings?.brandColor || '#1e293b', borderColor: printSettings?.brandColor || '#1e293b' }}>
                                <tr>
                                    <th className="px-6 py-4 font-black">اسم الطالب</th>
                                    <th className="px-6 py-4 font-black border-r" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>تاريخ الحضور</th>
                                    <th className="px-6 py-4 font-black border-r" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0 font-bold text-sm">
                                                        {log.user?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">
                                                            {log.user?.name || 'غير معروف'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                            {log.user?.division}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                                                    {log.attendance_date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.status === 'present' || log.status === 'حاضر' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg text-xs font-black print:bg-transparent print:border print:border-black print:text-black">
                                                        <CheckCircle size={11} className="print:hidden" /> حاضر
                                                    </span>
                                                ) : log.status === 'absent' || log.status === 'غائب' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-lg text-xs font-black print:bg-transparent print:border print:border-black print:text-black">
                                                        <BookX size={11} className="print:hidden" /> غائب
                                                    </span>
                                                ) : log.status === 'late' || log.status === 'متأخر' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg text-xs font-black print:bg-transparent print:border print:border-black print:text-black">
                                                        <Clock size={11} className="print:hidden" /> متأخر
                                                    </span>
                                                ) : log.status === 'excused' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 rounded-lg text-xs font-black print:bg-transparent print:border print:border-black print:text-black">
                                                        <AlertTriangle size={11} className="print:hidden" /> عذر / استئذان
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 rounded-lg text-xs font-black print:bg-transparent print:border print:border-black print:text-black">
                                                        {log.status}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-16 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                                    <UserX size={32} className="text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">لا توجد سجلات</h3>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                                    لا توجد سجلات غياب أو حضور للطلاب بهذه الفلاتر.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </ReportPrintLayout>
            </div>
        </AdminLayout>
    );
}
