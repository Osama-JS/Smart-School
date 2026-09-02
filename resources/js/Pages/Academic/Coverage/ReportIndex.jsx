import React, { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import {
    ShieldCheck, CalendarDays, User, Clock,
    AlertCircle, TrendingUp, BookOpen, Search, X, CheckCircle2
} from 'lucide-react';

const COVERAGE_TYPE_LABELS = {
    substitution: { label: 'نيابة عن', color: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-800' },
    free:         { label: 'حصة حرة',  color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800' },
    merged:       { label: 'دمج فصل', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-800' },
};

export default function CoverageReportIndex({ coverages, stats, teachers, filters }) {
    const [dateFilter, setDateFilter]       = useState(filters.date || '');
    const [absentFilter, setAbsentFilter]   = useState(filters.absent_teacher_id || '');
    const [subFilter, setSubFilter]         = useState(filters.substitute_teacher_id || '');

    const applyFilters = () => {
        router.get(route('academic.coverage.report'), {
            date: dateFilter || undefined,
            absent_teacher_id: absentFilter || undefined,
            substitute_teacher_id: subFilter || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setDateFilter('');
        setAbsentFilter('');
        setSubFilter('');
        router.get(route('academic.coverage.report'));
    };

    const hasFilters = dateFilter || absentFilter || subFilter;

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-';

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
            brandColor: '#2563eb'
        };
    });

    useEffect(() => {
        localStorage.setItem('CoverageReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const handlePrint = () => window.print();

    return (
        <AdminLayout activeMenu="التغطية والاحتياط">
            <Head title="تقرير التغطية والاحتياط" />

            <div className="max-w-7xl mx-auto space-y-6 pb-12">

                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="600" cy="150" r="6" className="fill-primary-400" />
                        </svg>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow border border-slate-100 dark:border-slate-700">
                                <ShieldCheck size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">تقارير التغطية والاحتياط</h1>
                                <p className="text-sm font-semibold text-primary-700/80 dark:text-primary-300/80">عرض وطباعة سجلات التغطية وحصص الاحتياط</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative z-20">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                <Search size={16} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-base font-black text-slate-800 dark:text-white">تصفية التقرير</h2>
                        </div>
                        {hasFilters && (
                            <button onClick={clearFilters} className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 transition-colors">
                                <X size={14} strokeWidth={2.5} /> مسح التصفية
                            </button>
                        )}
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">التاريخ</label>
                            <FlatpickrInput type="date" value={dateFilter} onChange={setDateFilter} placeholder="حدد التاريخ..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">المعلم الغائب</label>
                            <SelectInput
                                options={[{ value: '', label: 'الكل' }, ...teachers.map(t => ({ value: t.id, label: t.name }))]}
                                value={absentFilter}
                                onChange={setAbsentFilter}
                                isSearchable={true}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">المعلم البديل</label>
                            <SelectInput
                                options={[{ value: '', label: 'الكل' }, ...teachers.map(t => ({ value: t.id, label: t.name }))]}
                                value={subFilter}
                                onChange={setSubFilter}
                                isSearchable={true}
                            />
                        </div>
                        <div>
                            <button onClick={applyFilters} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white h-[42px] rounded-2xl font-bold transition-all shadow-md shadow-primary-500/20 active:scale-[0.98]">
                                عرض التقرير
                            </button>
                        </div>
                    </div>
                </div>

                <ReportPrintLayout 
                    title={printSettings.title} 
                    printSettings={printSettings} 
                    setPrintSettings={setPrintSettings} 
                    onPrint={handlePrint}
                >
                    {/* Stats inside print if kpis enabled */}
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
