import React, { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import ReportPrintLayout from "@/Components/Reports/ReportPrintLayout";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Search, Filter, CheckCircle, X, FileDown, Loader2, FileText, Check, AlertCircle } from "lucide-react";
import Modal from "@/Components/Modal";

export default function MeetingsReportIndex({ meetings, stats, filters }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [showFilters, setShowFilters] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                    onDownloadPdf={handleDownloadPDF}
                    isGeneratingPdf={isGeneratingPdf}
                    subtitle={startDate && endDate ? `الفترة: ${startDate} إلى ${endDate}` : 'سجل الاجتماعات واللجان'}
                >
                    {/* KPIs */}
                    {printSettings.showKPIs && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden print:border-black/20 print:bg-transparent print:shadow-none">
                                <div className="absolute top-0 right-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: printSettings.brandColor }}></div>
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 print:bg-slate-100 print:text-black" style={{ color: printSettings.brandColor, backgroundColor: printSettings.brandColor + '20' }}>
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 print:text-slate-700">إجمالي الاجتماعات</p>
                                    <h3 className="text-2xl font-black leading-none text-slate-800 dark:text-white print:text-black">
                                        {stats.total}
                                    </h3>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden print:border-black/20 print:bg-transparent print:shadow-none">
                                <div className="absolute top-0 right-0 bottom-0 w-1 bg-amber-500 opacity-80"></div>
                                <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0 print:bg-slate-100 print:text-black">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 print:text-slate-700">اجتماعات مجدولة</p>
                                    <h3 className="text-2xl font-black leading-none text-amber-600 print:text-black">
                                        {stats.scheduled}
                                    </h3>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden print:border-black/20 print:bg-transparent print:shadow-none">
                                <div className="absolute top-0 right-0 bottom-0 w-1 bg-emerald-500 opacity-80"></div>
                                <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0 print:bg-slate-100 print:text-black">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 print:text-slate-700">اجتماعات مكتملة</p>
                                    <h3 className="text-2xl font-black leading-none text-emerald-600 print:text-black">
                                        {stats.completed}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 overflow-hidden relative z-10">
                        {meetings.length === 0 ? (
                            <div className="p-12 text-center border border-slate-200 dark:border-slate-800 rounded-3xl">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CalendarIcon size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد اجتماعات</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                    لم يتم العثور على اجتماعات تطابق معايير التصفية المحددة للتقرير.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-300 dark:border-slate-700">
                                <table className="w-full text-sm text-right border-collapse">
                                    <thead className="text-white text-[13px] font-bold print:bg-slate-100 print:border-black/30 print:text-slate-800" style={{ backgroundColor: printSettings.brandColor }}>
                                        <tr>
                                            <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-center w-12 print:border-black/30">م</th>
                                            <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 print:border-black/30">الاجتماع</th>
                                            <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-center print:border-black/30">التاريخ والوقت</th>
                                            <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-center print:border-black/30">النوع</th>
                                            <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-center print:border-black/30">المنسق</th>
                                            <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-center print:border-black/30">عدد المدعوين</th>
                                            <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-center print:border-black/30">الحالة</th>
                                            <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-center print:hidden">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-medium bg-white dark:bg-slate-900">
                                        {meetings.map((meeting, index) => (
                                            <tr key={meeting.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 text-center text-slate-500 font-bold print:border-black/30">
                                                    {index + 1}
                                                </td>
                                                <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 print:border-black/30">
                                                    <span className="font-bold text-slate-800 dark:text-white print:text-black">
                                                        {meeting.title}
                                                    </span>
                                                </td>
                                                <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 whitespace-nowrap text-center print:border-black/30">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300 print:text-black">{formatDateAr(meeting.date)}</span>
                                                        <span className="text-xs text-slate-500 mt-1 font-semibold print:text-slate-700" dir="ltr">{formatTimeAr(meeting.time)}</span>
                                                    </div>
                                                </td>
                                                <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 whitespace-nowrap text-center print:border-black/30">
                                                    {meeting.type === 'online' ? (
                                                        <span className="text-blue-600 dark:text-blue-400 text-[13px] font-bold w-max mx-auto print:text-black">عن بعد</span>
                                                    ) : (
                                                        <span className="text-emerald-600 dark:text-emerald-400 text-[13px] font-bold w-max mx-auto print:text-black">حضوري</span>
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 whitespace-nowrap text-center font-bold text-slate-700 dark:text-slate-300 print:border-black/30 print:text-black">
                                                    {meeting.supervisor?.name || '-'}
                                                </td>
                                                <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 whitespace-nowrap text-center font-black text-slate-600 dark:text-slate-400 print:border-black/30 print:text-black">
                                                    {meeting.participants?.length || 0}
                                                </td>
                                                <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 whitespace-nowrap text-center print:border-black/30">
                                                    {meeting.status === 'scheduled' && <span className="text-amber-600 font-bold text-[13px] print:text-black">مجدول</span>}
                                                    {meeting.status === 'completed' && <span className="text-emerald-600 font-bold text-[13px] print:text-black">مكتمل</span>}
                                                    {meeting.status === 'cancelled' && <span className="text-rose-600 font-bold text-[13px] print:text-black">ملغي</span>}
                                                </td>
                                                <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 whitespace-nowrap text-center print:hidden">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedMeeting(meeting);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-primary-50 text-slate-600 hover:text-primary-600 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            <FileText size={14} />
                                                            عرض المحضر
                                                        </button>
                                                        <a
                                                            href={`${route('meetings.single-report.pdf', meeting.id)}?printSettings=${encodeURIComponent(JSON.stringify(printSettings))}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            <FileDown size={14} />
                                                            طباعة PDF
                                                        </a>
                                                    </div>
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

            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="4xl">
                {selectedMeeting && (
                    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden">
                        {/* Header Banner */}
                        <div 
                            className="relative px-6 py-5 flex items-center justify-between"
                            style={{ backgroundColor: printSettings.brandColor }}
                        >
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="absolute -left-12 -top-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            
                            <h2 className="text-xl font-black text-white flex items-center gap-2.5 relative z-10 drop-shadow-md">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <FileText size={22} className="text-white" />
                                </div>
                                <div>
                                    <span className="block text-[11px] text-white/80 font-semibold mb-0.5 tracking-wider">تفاصيل محضر الاجتماع</span>
                                    {selectedMeeting.title}
                                </div>
                            </h2>
                            <div className="flex items-center gap-3 relative z-10">
                                <a
                                    href={`${route('meetings.single-report.pdf', selectedMeeting.id)}?printSettings=${encodeURIComponent(JSON.stringify(printSettings))}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-bold transition-all shadow-sm border border-white/10"
                                >
                                    <FileDown size={18} />
                                    تصدير PDF
                                </a>
                                <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-8 h-[70vh] overflow-y-auto custom-scrollbar">
                            {/* Meeting Info Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${printSettings.brandColor}15`, color: printSettings.brandColor }}>
                                        <CalendarIcon size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-500 font-bold mb-0.5">تاريخ الانعقاد</p>
                                        <p className="text-slate-800 dark:text-white font-black text-sm" dir="ltr">{formatDateAr(selectedMeeting.date)}</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 dark:bg-amber-900/20 text-amber-500">
                                        <Clock size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-500 font-bold mb-0.5">وقت الانعقاد</p>
                                        <p className="text-slate-800 dark:text-white font-black text-sm" dir="ltr">{formatTimeAr(selectedMeeting.time)}</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500">
                                        {selectedMeeting.type === 'online' ? <Users size={22} /> : <MapPin size={22} />}
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-500 font-bold mb-0.5">طبيعة الاجتماع</p>
                                        <p className="text-slate-800 dark:text-white font-black text-sm">
                                            {selectedMeeting.type === 'online' ? 'عن بعد (Online)' : 'حضوري (In-Person)'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 dark:bg-purple-900/20 text-purple-500">
                                        <Users size={22} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[11px] text-slate-500 font-bold mb-0.5">منسق الاجتماع</p>
                                        <p className="text-slate-800 dark:text-white font-black text-sm truncate">
                                            {selectedMeeting.supervisor?.name || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Areas */}
                            <div className="grid grid-cols-1 gap-6">
                                {/* Agendas */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col">
                                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/80">
                                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${printSettings.brandColor}15`, color: printSettings.brandColor }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white">جدول الأعمال والمحاور</h3>
                                    </div>
                                    <div className="p-5">
                                        {selectedMeeting.agendas && selectedMeeting.agendas.length > 0 ? (
                                            <ul className="space-y-3">
                                                {selectedMeeting.agendas.map((agenda, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                                        <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5" style={{ backgroundColor: printSettings.brandColor, color: 'white' }}>{i + 1}</span>
                                                        <span className="pt-0.5 leading-relaxed">{agenda}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
                                                <p className="text-sm">لم يتم تحديد جدول أعمال</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Outcomes & Recommendations (Side by side on large screens) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm overflow-hidden flex flex-col relative">
                                        <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
                                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3 bg-emerald-50/50 dark:bg-emerald-900/10">
                                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-white">القرارات والنتائج</h3>
                                        </div>
                                        <div className="p-5">
                                            {selectedMeeting.outcomes ? (
                                                <div className="text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedMeeting.outcomes }}></div>
                                            ) : (
                                                <p className="text-slate-400 text-sm text-center py-6">لا توجد قرارات أو نتائج مدونة.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-sm overflow-hidden flex flex-col relative">
                                        <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
                                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3 bg-amber-50/50 dark:bg-amber-900/10">
                                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-white">التوصيات</h3>
                                        </div>
                                        <div className="p-5">
                                            {selectedMeeting.recommendations ? (
                                                <div className="text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedMeeting.recommendations }}></div>
                                            ) : (
                                                <p className="text-slate-400 text-sm text-center py-6">لا توجد توصيات مدونة.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Participants Attendance Table */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/80">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                            <Users size={20} strokeWidth={2.5} />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white">كشف الحضور والغياب</h3>
                                    </div>
                                    <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">
                                        الإجمالي: {selectedMeeting.participants?.length || 0}
                                    </span>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-4 w-16 text-center">م</th>
                                                <th className="px-6 py-4">اسم العضو المدعو</th>
                                                <th className="px-6 py-4 text-center">حالة الحضور</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-medium">
                                            {selectedMeeting.participants && selectedMeeting.participants.length > 0 ? (
                                                selectedMeeting.participants.map((participant, index) => (
                                                    <tr key={participant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-6 py-4 text-center text-slate-400">{index + 1}</td>
                                                        <td className="px-6 py-4 text-slate-800 dark:text-white font-bold">{participant.user?.name || 'غير معروف'}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            {participant.attendance_status === 'attended' && (
                                                                <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 w-32 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                                                                    <Check size={16} />
                                                                    حاضر
                                                                </span>
                                                            )}
                                                            {participant.attendance_status === 'absent' && (
                                                                <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 w-32 border border-rose-200 dark:border-rose-800/50 shadow-sm">
                                                                    <X size={16} />
                                                                    غائب
                                                                </span>
                                                            )}
                                                            {(participant.attendance_status === 'pending' || !participant.attendance_status) && (
                                                                <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 w-32 border border-amber-200 dark:border-amber-800/50 shadow-sm">
                                                                    <AlertCircle size={16} />
                                                                    قيد الانتظار
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="px-6 py-8 text-center text-slate-400">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <Users size={24} className="opacity-50" />
                                                            <span>لا يوجد مدعوين لهذا الاجتماع</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
