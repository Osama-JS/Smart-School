import React, { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import ReportPrintLayout from "@/Components/Reports/ReportPrintLayout";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Search, Filter, CheckCircle, X, FileDown, Loader2 } from "lucide-react";

export default function MeetingsReportIndex({ meetings, stats, filters }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [showFilters, setShowFilters] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(route('meetings.report'), {
            search: searchQuery,
            status: statusFilter,
            start_date: startDate,
            end_date: endDate,
            type: typeFilter,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setStartDate('');
        setEndDate('');
        setTypeFilter('');
        router.get(route('meetings.report'));
    };

    const removeFilter = (filterId) => {
        let params = {
            search: searchQuery,
            status: statusFilter,
            start_date: startDate,
            end_date: endDate,
            type: typeFilter,
        };
        if (filterId === 'search') { params.search = ''; setSearchQuery(''); }
        if (filterId === 'status') { params.status = ''; setStatusFilter(''); }
        if (filterId === 'date') { params.start_date = ''; params.end_date = ''; setStartDate(''); setEndDate(''); }
        if (filterId === 'type') { params.type = ''; setTypeFilter(''); }
        router.get(route('meetings.report'), params, { preserveState: true });
    };

    const activeFilters = [];
    if (searchQuery) activeFilters.push({ id: 'search', label: `بحث: ${searchQuery}` });
    if (statusFilter) activeFilters.push({ id: 'status', label: `الحالة: ${statusFilter === 'scheduled' ? 'مجدول' : statusFilter === 'completed' ? 'مكتمل' : 'ملغي'}` });
    if (startDate || endDate) activeFilters.push({ id: 'date', label: `التاريخ: ${startDate || 'الكل'} إلى ${endDate || 'الكل'}` });
    if (typeFilter) activeFilters.push({ id: 'type', label: `النوع: ${typeFilter === 'online' ? 'عن بعد' : 'حضوري'}` });

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

    const getStatusBadgeColor = (status) => {
        if (status === 'scheduled') return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
        if (status === 'completed') return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
        return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    };

    const getStatusLabel = (status) => {
        if (status === 'scheduled') return 'مجدول';
        if (status === 'completed') return 'مكتمل';
        return 'ملغي';
    };

    const formatDateAr = (dateString) => {
        if (!dateString) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    };

    const formatTimeAr = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const [printSettings, setPrintSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('MeetingReportPrintSettings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            title: 'تقارير محاضر الاجتماعات',
            orientation: 'portrait',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            showKPIs: true,
            showDetails: true,
            ecoMode: false,
            watermark: 'none',
            brandColor: '#2563eb'
        };
    });

    useEffect(() => {
        localStorage.setItem('MeetingReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                search: searchQuery || '',
                status: statusFilter || '',
                start_date: startDate || '',
                end_date: endDate || '',
                type: typeFilter || '',
                printSettings: JSON.stringify(printSettings)
            });
            const url = route('meetings.report.pdf') + '?' + params.toString();
            window.location.href = url;
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء طلب الملف.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <AdminLayout activeMenu="محاضر الاجتماعات">
            <Head title="تقارير محاضر الاجتماعات" />
            <div className="space-y-6">

                {/* Header */}
                <div className="print:hidden relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400 z-20"></div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary-50 to-transparent pointer-events-none"></div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3.5 bg-white border border-primary-100 shadow-sm rounded-xl text-primary-600 flex-shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <Users size={28} strokeWidth={2} className="relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-black text-slate-800 tracking-tight mb-1">
                                تقارير محاضر الاجتماعات
                            </h1>
                            <p className="text-[13.5px] font-bold text-slate-500">عرض وطباعة سجلات الاجتماعات واللجان</p>
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

                {/* Filters Panel */}
                <div className="print:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>

                    <div className="p-5">
                        {/* Top bar: toggle + date presets */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 w-full xl:w-auto">
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
                            </div>

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

                        {/* Collapsible form */}
                        <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                    {/* Search */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">بحث بالعنوان</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                                <Search size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="اكتب للبحث..."
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl pr-9 pl-3 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px]"
                                            />
                                        </div>
                                    </div>

                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">من تاريخ</label>
                                        <input
                                            type="date"
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px]"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">إلى تاريخ</label>
                                        <input
                                            type="date"
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px]"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>

                                    {/* Status filter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">حالة الاجتماع</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3"
                                        >
                                            <option value="">جميع الحالات</option>
                                            <option value="scheduled">مجدول</option>
                                            <option value="completed">مكتمل</option>
                                            <option value="cancelled">ملغي</option>
                                        </select>
                                    </div>

                                    {/* Type filter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">نوع الاجتماع</label>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3"
                                        >
                                            <option value="">جميع الأنواع</option>
                                            <option value="online">عن بعد</option>
                                            <option value="in_person">حضوري</option>
                                        </select>
                                    </div>

                                    {/* Buttons */}
                                    <div className="md:col-span-2 xl:col-span-1 flex gap-3 items-end">
                                        <button
                                            type="submit"
                                            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all font-bold shadow-sm"
                                        >
                                            <Search size={16} strokeWidth={2.5} />
                                            <span>تطبيق الفلترة</span>
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

                {/* Report Layout */}
                <ReportPrintLayout
                    title={printSettings.title}
                    printSettings={printSettings}
                    setPrintSettings={setPrintSettings}
                    onPrint={handlePrint}
                    onDownloadPdf={handleDownloadPDF}
                    isGeneratingPdf={isGeneratingPdf}
                    subtitle={startDate && endDate ? `الفترة: ${startDate} إلى ${endDate}` : 'سجل الاجتماعات واللجان'}
                >
                    {/* KPIs */}
                    {printSettings.showKPIs && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">إجمالي الاجتماعات</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white print:text-black">
                                        {stats.total}
                                    </h3>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 flex items-center justify-center print:bg-slate-100 print:text-black">
                                    <Users size={24} />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">اجتماعات مجدولة</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white print:text-black">
                                        {stats.scheduled}
                                    </h3>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center print:bg-slate-100 print:text-black">
                                    <Clock size={24} />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">اجتماعات مكتملة</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white print:text-black">
                                        {stats.completed}
                                    </h3>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center print:bg-slate-100 print:text-black">
                                    <CheckCircle size={24} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm relative z-10 print:border-none print:shadow-none print:rounded-none">
                        {meetings.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CalendarIcon size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد اجتماعات</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                    لم يتم العثور على اجتماعات تطابق معايير التصفية المحددة للتقرير.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-right print:border-collapse">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-black border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-black/30 print:text-slate-800">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tr-3xl print:rounded-none print:border print:border-black/30">الاجتماع</th>
                                            <th className="px-6 py-4 print:border print:border-black/30">التاريخ والوقت</th>
                                            <th className="px-6 py-4 print:border print:border-black/30">النوع</th>
                                            <th className="px-6 py-4 print:border print:border-black/30">المنسق</th>
                                            <th className="px-6 py-4 print:border print:border-black/30">عدد المدعوين</th>
                                            <th className="px-6 py-4 rounded-tl-3xl print:rounded-none print:border print:border-black/30">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium print:divide-black/20">
                                        {meetings.map(meeting => (
                                            <tr key={meeting.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                                                <td className="px-6 py-4 print:border print:border-black/30">
                                                    <span className="font-bold text-slate-800 dark:text-white print:text-black">
                                                        {meeting.title}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap print:border print:border-black/30">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon size={14} className="text-slate-400 print:hidden" />
                                                        <span className="text-slate-700 dark:text-slate-300 print:text-black">{formatDateAr(meeting.date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 print:text-slate-700">
                                                        <Clock size={12} className="text-slate-400 print:hidden" />
                                                        {formatTimeAr(meeting.time)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap print:border print:border-black/30">
                                                    {meeting.type === 'online' ? (
                                                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md text-xs font-bold w-max print:bg-transparent print:p-0 print:text-black">
                                                            <Users size={12} className="print:hidden"/> عن بعد
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md text-xs font-bold w-max print:bg-transparent print:p-0 print:text-black">
                                                            <MapPin size={12} className="print:hidden"/> حضوري
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap print:border print:border-black/30 print:text-black">
                                                    {meeting.supervisor?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap print:border print:border-black/30 print:text-black">
                                                    {meeting.participants?.length || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap print:border print:border-black/30">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${getStatusBadgeColor(meeting.status)} print:bg-transparent print:p-0 print:border-none print:text-black`}>
                                                        {getStatusLabel(meeting.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </ReportPrintLayout>
            </div>
        </AdminLayout>
    );
}
