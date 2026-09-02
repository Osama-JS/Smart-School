import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';
import SelectInput from '@/Components/SelectInput';
import {
    ShieldCheck, CalendarDays, User, Clock,
    AlertCircle, TrendingUp, BookOpen, Search, X, CheckCircle2, Filter, FileDown, Loader2
} from 'lucide-react';

const COVERAGE_TYPE_LABELS = {
    substitution: { label: 'نيابة عن', color: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-800' },
    free:         { label: 'حصة حرة',  color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800' },
    merged:       { label: 'دمج فصل', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-800' },
};

export default function CoverageReportIndex({ coverages, stats, teachers, filters }) {
    const [startDate, setStartDate]       = useState(filters.start_date || filters.date || '');
    const [endDate, setEndDate]           = useState(filters.end_date || '');
    const [absentFilter, setAbsentFilter] = useState(filters.absent_teacher_id || '');
    const [subFilter, setSubFilter]       = useState(filters.substitute_teacher_id || '');
    const [typeFilter, setTypeFilter]     = useState(filters.coverage_type || '');
    const [showFilters, setShowFilters]   = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const applyFilters = (e) => {
        if (e) e.preventDefault();
        router.get(route('academic.coverage.report'), {
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            absent_teacher_id: absentFilter || undefined,
            substitute_teacher_id: subFilter || undefined,
            coverage_type: typeFilter || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setAbsentFilter('');
        setSubFilter('');
        setTypeFilter('');
        router.get(route('academic.coverage.report'));
    };

    const removeFilter = (filterId) => {
        let params = {
            start_date: startDate,
            end_date: endDate,
            absent_teacher_id: absentFilter,
            substitute_teacher_id: subFilter,
            coverage_type: typeFilter,
        };
        if (filterId === 'date') { params.start_date = ''; params.end_date = ''; setStartDate(''); setEndDate(''); }
        if (filterId === 'absent') { params.absent_teacher_id = ''; setAbsentFilter(''); }
        if (filterId === 'sub') { params.substitute_teacher_id = ''; setSubFilter(''); }
        if (filterId === 'type') { params.coverage_type = ''; setTypeFilter(''); }
        router.get(route('academic.coverage.report'), params, { preserveState: true });
    };

    const getAbsentTeacherName = (id) => teachers.find(t => t.id == id)?.name || id;
    const getSubTeacherName = (id) => teachers.find(t => t.id == id)?.name || id;
    const getTypeName = (type) => COVERAGE_TYPE_LABELS[type]?.label || type;

    const activeFilters = [];
    if (startDate || endDate) activeFilters.push({ id: 'date', label: `التاريخ: ${startDate || 'الكل'} إلى ${endDate || 'الكل'}` });
    if (absentFilter) activeFilters.push({ id: 'absent', label: `الغائب: ${getAbsentTeacherName(absentFilter)}` });
    if (subFilter) activeFilters.push({ id: 'sub', label: `البديل: ${getSubTeacherName(subFilter)}` });
    if (typeFilter) activeFilters.push({ id: 'type', label: `النوع: ${getTypeName(typeFilter)}` });

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

    const formatDate = (d) => d
        ? new Date(d).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '-';

    const [printSettings, setPrintSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('CoverageReportPrintSettings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            title: 'تقرير سجلات التغطية والاحتياط',
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
        localStorage.setItem('CoverageReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                start_date: startDate || '',
                end_date: endDate || '',
                absent_teacher_id: absentFilter || '',
                substitute_teacher_id: subFilter || '',
                coverage_type: typeFilter || '',
                printSettings: JSON.stringify(printSettings)
            });
            const url = route('academic.coverage.report.pdf') + '?' + params.toString();
            window.location.href = url;
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء طلب الملف.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <AdminLayout activeMenu="التغطية والاحتياط">
            <Head title="تقرير التغطية والاحتياط" />

            <div className="space-y-6 pb-12">

                {/* Header */}
                <div className="print:hidden relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400 z-20"></div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary-50 to-transparent pointer-events-none"></div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3.5 bg-white border border-primary-100 shadow-sm rounded-xl text-primary-600 flex-shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <ShieldCheck size={28} strokeWidth={2} className="relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-black text-slate-800 tracking-tight mb-1">
                                تقارير التغطية والاحتياط
                            </h1>
                            <p className="text-[13.5px] font-bold text-slate-500">عرض وطباعة سجلات التغطية وحصص الاحتياط</p>
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
                                <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">من تاريخ</label>
                                        <input
                                            type="date"
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">إلى تاريخ</label>
                                        <input
                                            type="date"
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>

                                    {/* Coverage Type */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">نوع التغطية</label>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3"
                                        >
                                            <option value="">جميع الأنواع</option>
                                            <option value="substitution">نيابة عن</option>
                                            <option value="free">حصة حرة</option>
                                            <option value="merged">دمج فصل</option>
                                        </select>
                                    </div>

                                    {/* Absent Teacher */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">المعلم الغائب</label>
                                        <SelectInput
                                            options={[{ value: '', label: 'الكل' }, ...teachers.map(t => ({ value: t.id, label: t.name }))]}
                                            value={absentFilter}
                                            onChange={setAbsentFilter}
                                            isSearchable={true}
                                        />
                                    </div>

                                    {/* Substitute Teacher */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">المعلم البديل</label>
                                        <SelectInput
                                            options={[{ value: '', label: 'الكل' }, ...teachers.map(t => ({ value: t.id, label: t.name }))]}
                                            value={subFilter}
                                            onChange={setSubFilter}
                                            isSearchable={true}
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3 items-end">
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
                    subtitle={startDate && endDate ? `الفترة: ${startDate} إلى ${endDate}` : 'سجل التغطية والاحتياط'}
                >
                    {/* KPIs */}
                    {printSettings.showKPIs && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'اليوم', value: stats.today, icon: CalendarDays, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' },
                                { label: 'هذا الأسبوع', value: stats.this_week, icon: TrendingUp, color: 'text-primary-600 bg-primary-50 dark:bg-primary-500/10 dark:text-primary-400' },
                                { label: 'هذا الشهر', value: stats.this_month, icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' },
                                { label: 'إجمالي السجلات', value: stats.total, icon: BookOpen, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' },
                            ].map((s) => (
                                <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm print:shadow-none print:border-black/20 print:bg-transparent">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.color} print:text-black print:bg-slate-100`}>
                                        <s.icon size={22} className="print:text-black" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-800 dark:text-white print:text-black">{s.value}</p>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5 print:text-slate-700">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative z-10 print:border-none print:shadow-none print:rounded-none">
                        {coverages.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-5">
                                    <ShieldCheck size={36} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">لا توجد سجلات تغطية</h3>
                                <p className="text-slate-500 mt-2 mb-6">
                                    لا توجد نتائج تطابق الفلاتر المحددة للتقرير.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right print:border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100 print:border-black/30">
                                            {['التاريخ', 'الحصة', 'الشعبة', 'المعلم الغائب', 'المعلم البديل', 'نوع التغطية', 'الحالة'].map(h => (
                                                <th key={h} className="px-5 py-3.5 text-xs font-black text-slate-500 dark:text-slate-400 whitespace-nowrap print:text-slate-800 print:border print:border-black/30">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black/20">
                                        {coverages.map(c => {
                                            const typeInfo = COVERAGE_TYPE_LABELS[c.coverage_type] || COVERAGE_TYPE_LABELS.substitution;
                                            return (
                                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                                                    <td className="px-5 py-4 print:border print:border-black/30 print:p-2">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarDays size={15} className="text-slate-400 print:hidden" />
                                                            <span className="text-sm font-bold text-slate-800 dark:text-white print:text-black">{formatDate(c.coverage_date)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 print:border print:border-black/30 print:p-2">
                                                        <div className="text-sm font-bold text-slate-800 dark:text-white print:text-black">{c.period?.period_name}</div>
                                                        <div className="text-xs text-slate-500 font-mono print:text-slate-700" dir="ltr">
                                                            {c.period?.start_time?.substring(0,5)} - {c.period?.end_time?.substring(0,5)}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300 print:text-black print:border print:border-black/30 print:p-2">
                                                        {c.division?.grade?.section?.name} / {c.division?.name}
                                                    </td>
                                                    <td className="px-5 py-4 print:border print:border-black/30 print:p-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 print:hidden">
                                                                <User size={13} />
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-800 dark:text-white print:text-black">{c.absent_teacher?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 print:border print:border-black/30 print:p-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 print:hidden">
                                                                <User size={13} />
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-800 dark:text-white print:text-black">{c.substitute_teacher?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 print:border print:border-black/30 print:p-2">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${typeInfo.color} print:border-none print:p-0 print:bg-transparent print:text-black`}>
                                                            {typeInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 print:border print:border-black/30 print:p-2">
                                                        {c.substitute_notified ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 print:text-black">
                                                                <CheckCircle2 size={14} className="print:hidden" /> أُبلغ
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 print:text-black">
                                                                <AlertCircle size={14} className="print:hidden" /> لم يُبلَّغ
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
