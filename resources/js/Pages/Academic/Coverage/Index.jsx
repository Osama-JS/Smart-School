import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import {
    ShieldCheck, Plus, Trash2, CalendarDays, User, Clock,
    AlertCircle, TrendingUp, BookOpen, Search, X, CheckCircle2, ChevronLeft
} from 'lucide-react';
import Swal from 'sweetalert2';

const COVERAGE_TYPE_LABELS = {
    substitution: { label: 'نيابة عن', color: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-800' },
    free:         { label: 'حصة حرة',  color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800' },
    merged:       { label: 'دمج فصل', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-800' },
};

export default function CoverageIndex({ coverages, stats, teachers, filters }) {
    const [dateFilter, setDateFilter]       = useState(filters.date || '');
    const [absentFilter, setAbsentFilter]   = useState(filters.absent_teacher_id || '');
    const [subFilter, setSubFilter]         = useState(filters.substitute_teacher_id || '');

    const applyFilters = () => {
        router.get(route('academic.coverage.index'), {
            date: dateFilter || undefined,
            absent_teacher_id: absentFilter || undefined,
            substitute_teacher_id: subFilter || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setDateFilter('');
        setAbsentFilter('');
        setSubFilter('');
        router.get(route('academic.coverage.index'));
    };

    const hasFilters = dateFilter || absentFilter || subFilter;

    const deleteCoverage = (id) => {
        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({
            title: 'حذف سجل التغطية؟',
            text: 'هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: isDark ? '#334155' : '#e2e8f0',
            confirmButtonText: 'نعم، احذفه',
            cancelButtonText: 'إلغاء',
            reverseButtons: true,
            background: isDark ? '#0f172a' : '#ffffff',
            color: isDark ? '#f8fafc' : '#1e293b',
            customClass: {
                confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-white',
                cancelButton: `rounded-xl px-5 py-2.5 font-bold ${isDark ? 'text-white' : 'text-slate-700'}`,
                popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl',
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('academic.coverage.destroy', id));
            }
        });
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-';

    return (
        <AdminLayout activeMenu="التغطية والاحتياط">
            <Head title="إدارة التغطية والاحتياط" />

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
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">التغطية والاحتياط</h1>
                                <p className="text-sm font-semibold text-primary-700/80 dark:text-primary-300/80">سجلات تغطية حصص الغياب وإدارة المعلمين البدلاء</p>
                            </div>
                        </div>
                        <Link
                            href={route('academic.coverage.create')}
                            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 text-sm font-bold shadow-lg shadow-primary-500/20 transition-all shrink-0 active:scale-95"
                        >
                            <Plus size={18} />
                            تسجيل تغطية جديدة
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'اليوم', value: stats.today, icon: CalendarDays, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' },
                        { label: 'هذا الأسبوع', value: stats.this_week, icon: TrendingUp, color: 'text-primary-600 bg-primary-50 dark:bg-primary-500/10 dark:text-primary-400' },
                        { label: 'هذا الشهر', value: stats.this_month, icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' },
                        { label: 'إجمالي السجلات', value: stats.total, icon: BookOpen, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' },
                    ].map((s) => (
                        <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                                <s.icon size={22} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{s.value}</p>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                <Search size={16} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-base font-black text-slate-800 dark:text-white">تصفية السجلات</h2>
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
                                عرض النتائج
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {coverages.data.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-5">
                                <ShieldCheck size={36} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">لا توجد سجلات تغطية</h3>
                            <p className="text-slate-500 mt-2 mb-6">
                                {hasFilters ? 'لا توجد نتائج تطابق الفلاتر المحددة.' : 'ابدأ بتسجيل أول عملية تغطية لحصة غياب.'}
                            </p>
                            <Link href={route('academic.coverage.create')} className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold text-sm">
                                <Plus size={16} /> تسجيل تغطية جديدة
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                        {['التاريخ', 'الحصة', 'الشعبة', 'المعلم الغائب', 'المعلم البديل', 'نوع التغطية', 'الحالة', ''].map(h => (
                                            <th key={h} className="px-5 py-3.5 text-xs font-black text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {coverages.data.map(c => {
                                        const typeInfo = COVERAGE_TYPE_LABELS[c.coverage_type] || COVERAGE_TYPE_LABELS.substitution;
                                        return (
                                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays size={15} className="text-slate-400" />
                                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{formatDate(c.coverage_date)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="text-sm font-bold text-slate-800 dark:text-white">{c.period?.period_name}</div>
                                                    <div className="text-xs text-slate-500 font-mono" dir="ltr">
                                                        {c.period?.start_time?.substring(0,5)} - {c.period?.end_time?.substring(0,5)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                    {c.division?.grade?.section?.name} / {c.division?.name}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                                            <User size={13} />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{c.absent_teacher?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                            <User size={13} />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{c.substitute_teacher?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${typeInfo.color}`}>
                                                        {typeInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {c.substitute_notified ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle2 size={14} /> أُبلغ
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                                            <AlertCircle size={14} /> لم يُبلَّغ
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <button onClick={() => deleteCoverage(c.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {coverages.last_page > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-500">
                                عرض {coverages.from}–{coverages.to} من {coverages.total} سجل
                            </p>
                            <div className="flex gap-2">
                                {coverages.prev_page_url && (
                                    <button onClick={() => router.get(coverages.prev_page_url)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-xl transition-colors">
                                        السابق
                                    </button>
                                )}
                                {coverages.next_page_url && (
                                    <button onClick={() => router.get(coverages.next_page_url)} className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors">
                                        التالي
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
