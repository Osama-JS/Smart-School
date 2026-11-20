import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import {
    Award, Filter, Printer, Download, Search, Users, Lock,
    CheckCircle2, Clock, Layers, GraduationCap, Calendar,
    Sparkles, TrendingUp, FileCheck2, Eye, ShieldAlert, BarChart3, X
} from 'lucide-react';

const getGradeBadgeStyle = (code) => {
    switch (code) {
        case 'excellent':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25';
        case 'vgood':
            return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/25';
        case 'good':
            return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25';
        case 'pass':
            return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25';
        case 'weak':
            return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/25';
        case 'fail':
            return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/25';
        default:
            return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
};

const getProgressBarColor = (pct) => {
    if (pct >= 90) return 'bg-emerald-500';
    if (pct >= 80) return 'bg-indigo-500';
    if (pct >= 70) return 'bg-sky-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
};

const getRankBadgeStyle = (rank) => {
    if (rank === 1) return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
    if (rank === 2) return 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30';
    return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

export default function CertificatesIndex({
    academicYears = [],
    semesters = [],
    periods = [],
    divisions = [],
    roster = [],
    filters = {},
}) {
    const [yearId, setYearId] = useState(filters.academic_year_id || '');
    const [semesterId, setSemesterId] = useState(filters.semester_id || '');
    const [periodId, setPeriodId] = useState(filters.period_id || '');
    const [divisionId, setDivisionId] = useState(filters.division_id || '');
    const [certType, setCertType] = useState(filters.type || 'semester');
    const [onlyOfficial, setOnlyOfficial] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const isMonthly = certType === 'monthly';

    const applyFilter = (overrides = {}) => {
        const params = {
            academic_year_id: overrides.academic_year_id ?? yearId,
            semester_id: overrides.semester_id ?? semesterId,
            period_id: overrides.period_id ?? periodId,
            division_id: overrides.division_id ?? divisionId,
            type: overrides.type ?? certType,
        };
        router.get(route('academic.certificates.index'), params, {
            preserveState: false,
            replace: true,
        });
    };

    const stats = useMemo(() => {
        const total = roster.length;
        let ready = 0;
        let officialFull = 0;
        let draftCount = 0;
        let blocked = 0;
        let pctSum = 0;
        let pctCount = 0;

        roster.forEach((item) => {
            const officialCount = isMonthly ? item.submitted_count : item.locked_count;
            const printable = onlyOfficial ? officialCount > 0 : item.has_grades;
            if (printable) ready += 1;
            const isFullOfficial = item.has_grades && officialCount === item.subjects_count && item.subjects_count > 0;
            if (isFullOfficial) {
                officialFull += 1;
            } else if (item.has_grades) {
                draftCount += 1;
            }
            if (item.is_result_blocked) blocked += 1;
            if (item.has_grades) {
                pctSum += Number(item.percentage || 0);
                pctCount += 1;
            }
        });

        const avgPct = pctCount > 0 ? (pctSum / pctCount).toFixed(1) : '0.0';
        return { total, ready, officialFull, draftCount, blocked, avgPct };
    }, [roster, isMonthly, onlyOfficial]);

    const filteredRoster = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return (roster || []).filter((item) => {
            const officialCount = isMonthly ? item.submitted_count : item.locked_count;
            const isFullOfficial = item.has_grades && officialCount === item.subjects_count && item.subjects_count > 0;
            const isDraft = item.has_grades && !isFullOfficial;

            if (statusFilter === 'ready' && !(onlyOfficial ? officialCount > 0 : item.has_grades)) return false;
            if (statusFilter === 'official' && !isFullOfficial) return false;
            if (statusFilter === 'draft' && !isDraft) return false;
            if (statusFilter === 'blocked' && !item.is_result_blocked) return false;

            if (!q) return true;
            return (
                String(item.student_name || '').toLowerCase().includes(q) ||
                String(item.username || '').toLowerCase().includes(q)
            );
        });
    }, [roster, searchQuery, statusFilter, isMonthly, onlyOfficial]);

    const selectedDivisionObj = useMemo(
        () => divisions.find((d) => String(d.id) === String(divisionId)),
        [divisions, divisionId]
    );
    const selectedSemesterObj = useMemo(
        () => semesters.find((s) => String(s.id) === String(semesterId)),
        [semesters, semesterId]
    );
    const selectedPeriodObj = useMemo(
        () => periods.find((p) => String(p.id) === String(periodId)),
        [periods, periodId]
    );

    const canOpenBatch = Boolean(divisionId && stats.ready > 0 && (isMonthly ? periodId : semesterId));

    const buildStudentCertUrl = (studentId) => {
        if (isMonthly) {
            return route('academic.certificates.monthly', {
                student: studentId,
                period: periodId,
                only_submitted: onlyOfficial ? 1 : 0,
            });
        }
        return route('academic.certificates.semester', {
            student: studentId,
            semester: semesterId,
            only_locked: onlyOfficial ? 1 : 0,
        });
    };

    const buildStudentPdfUrl = (studentId) => {
        if (isMonthly) {
            return route('academic.certificates.monthly.pdf', {
                student: studentId,
                period: periodId,
                only_submitted: onlyOfficial ? 1 : 0,
            });
        }
        return route('academic.certificates.semester.pdf', {
            student: studentId,
            semester: semesterId,
            only_locked: onlyOfficial ? 1 : 0,
        });
    };

    const buildBatchUrl = () => {
        return route('academic.certificates.batch', {
            division: divisionId,
            type: certType,
            ...(isMonthly ? { period_id: periodId } : { semester_id: semesterId }),
            only_official: onlyOfficial ? 1 : 0,
        });
    };

    return (
        <AdminLayout activeMenu="إصدار الشهادات">
            <Head title="مركز إصدار الشهادات | النظام الأكاديمي" />

            <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in">
                {/* Executive Hero Header (Logo-Harmonized Palette) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#f7fbe9] via-white to-red-50/35 dark:from-slate-900 dark:via-slate-900 dark:to-lime-950/25 border border-lime-200/70 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div
                        className="absolute top-0 right-0 left-0 h-1.5"
                        style={{ background: 'linear-gradient(to left, #18181b 0%, #18181b 20%, #dc2626 20%, #dc2626 42%, #84b819 42%, #4d7c0f 100%)' }}
                    />
                    <div className="absolute -left-16 -top-16 w-56 h-56 rounded-full bg-[#84b819]/15 blur-3xl pointer-events-none" />
                    <div className="absolute -right-12 -bottom-20 w-56 h-56 rounded-full bg-[#dc2626]/10 blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-[#4d7c0f] to-[#84b819] text-white flex items-center justify-center shadow-lg shadow-lime-700/25 ring-4 ring-lime-500/15">
                                <Award size={32} />
                            </div>
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-[#f7fbe9] text-[#4d7c0f] border border-[#84b819]/40 dark:bg-lime-500/15 dark:text-lime-300 dark:border-lime-500/30">
                                    <Sparkles size={12} className="text-[#dc2626] dark:text-red-400" />
                                    الشؤون الأكاديمية • الشهادات والنتائج
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                                    مركز إصدار وطباعة الشهادات
                                </h1>
                                <p className="text-sm font-medium text-zinc-500 dark:text-slate-400">
                                    استعراض وطباعة الشهادات الشهرية والفصلية للطلاب بشكل فردي، أو تصدير PDF، أو طباعة شعبة كاملة بضغطة واحدة.
                                </p>

                                {selectedDivisionObj && (
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-white/95 dark:bg-slate-800 border border-lime-200/80 dark:border-slate-700 text-zinc-800 dark:text-slate-200 shadow-xs">
                                            <Users size={13} className="text-[#4d7c0f] dark:text-lime-400" />
                                            {selectedDivisionObj.grade?.name} - {selectedDivisionObj.name}
                                        </span>
                                        {selectedSemesterObj && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-white/95 dark:bg-slate-800 border border-lime-200/80 dark:border-slate-700 text-zinc-800 dark:text-slate-200 shadow-xs">
                                                <GraduationCap size={13} className="text-[#dc2626] dark:text-red-400" />
                                                {selectedSemesterObj.name}
                                            </span>
                                        )}
                                        {isMonthly && selectedPeriodObj && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-white/95 dark:bg-slate-800 border border-lime-200/80 dark:border-slate-700 text-zinc-800 dark:text-slate-200 shadow-xs">
                                                <Calendar size={13} className="text-[#84b819]" />
                                                {selectedPeriodObj.month_name}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            {canOpenBatch ? (
                                <a
                                    href={buildBatchUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-l from-[#4d7c0f] to-[#65a30d] hover:from-[#3f6212] hover:to-[#4d7c0f] text-white shadow-lg shadow-lime-700/25 hover:-translate-y-0.5 transition-all"
                                >
                                    <Layers size={18} />
                                    <span>طباعة شهادات الشعبة كاملة</span>
                                    <span className="px-2 py-0.5 rounded-lg bg-white/20 text-xs font-mono">
                                        {stats.ready}
                                    </span>
                                </a>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold bg-zinc-100/90 dark:bg-slate-800/80 text-zinc-600 dark:text-slate-400 border border-zinc-200 dark:border-slate-700">
                                    <Layers size={16} className="text-[#4d7c0f] dark:text-lime-400" />
                                    {divisionId ? 'لا توجد شهادات جاهزة للطباعة الجماعية' : 'اختر الشعبة لتفعيل الطباعة الجماعية'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                {divisionId && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي طلاب الشعبة</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{stats.total}</div>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                                <Users size={22} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {onlyOfficial ? 'جاهز (معتمد فقط)' : 'شهادات جاهزة للإصدار'}
                                </div>
                                <div className="text-2xl font-black text-primary-600 dark:text-primary-400 mt-1 font-mono">{stats.ready}</div>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                <FileCheck2 size={22} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">مكتملة الاعتماد</div>
                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{stats.officialFull}</div>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <CheckCircle2 size={22} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">متوسط نسبة الشعبة</div>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{stats.avgPct}%</span>
                                    {stats.blocked > 0 && (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                            {stats.blocked} محجوب
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                <TrendingUp size={22} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Controls Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 shadow-sm space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-white font-black text-base">
                            <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                <Filter size={18} />
                            </div>
                            <div>
                                <div>محددات الشهادة والبحث</div>
                                <div className="text-[11px] font-semibold text-slate-400">اختر نوع الشهادة والفترة والشعبة لعرض النتائج</div>
                            </div>
                        </div>

                        {/* Certificate Type Switcher */}
                        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
                            <button
                                type="button"
                                onClick={() => {
                                    setCertType('semester');
                                    applyFilter({ type: 'semester' });
                                }}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                    !isMonthly
                                        ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <GraduationCap size={15} />
                                شهادة فصلية
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCertType('monthly');
                                    applyFilter({ type: 'monthly' });
                                }}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                    isMonthly
                                        ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <Calendar size={15} />
                                شهادة شهرية
                            </button>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isMonthly ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300 mb-2">
                                <Calendar size={13} className="text-primary-500" />
                                السنة الدراسية
                            </label>
                            <SelectInput
                                value={yearId}
                                onChange={(val) => {
                                    const v = val || '';
                                    setYearId(v);
                                    applyFilter({ academic_year_id: v, semester_id: '', period_id: '', division_id: '' });
                                }}
                                options={academicYears.map((y) => ({
                                    value: y.id,
                                    label: `${y.name}${y.is_active ? ' (نشطة)' : ''}`,
                                }))}
                                placeholder="اختر السنة الدراسية..."
                                noOptionsMessage={() => 'لا توجد سنوات دراسية'}
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300 mb-2">
                                <GraduationCap size={13} className="text-indigo-500" />
                                الفصل الدراسي
                            </label>
                            <SelectInput
                                value={semesterId}
                                onChange={(val) => {
                                    const v = val || '';
                                    setSemesterId(v);
                                    applyFilter({ semester_id: v, period_id: '' });
                                }}
                                options={semesters.map((s) => ({
                                    value: s.id,
                                    label: `${s.name}${s.is_active ? ' (نشط)' : ''}`,
                                }))}
                                placeholder="اختر الفصل الدراسي..."
                                isDisabled={!yearId && semesters.length === 0}
                                noOptionsMessage={() => 'لا توجد فصول دراسية'}
                            />
                        </div>

                        {isMonthly && (
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300 mb-2">
                                    <Clock size={13} className="text-emerald-500" />
                                    فترة الشهر
                                </label>
                                <SelectInput
                                    value={periodId}
                                    onChange={(val) => {
                                        const v = val || '';
                                        setPeriodId(v);
                                        applyFilter({ period_id: v });
                                    }}
                                    options={periods.map((p) => ({
                                        value: p.id,
                                        label: p.month_name,
                                    }))}
                                    placeholder="اختر الشهر..."
                                    isDisabled={!semesterId && periods.length === 0}
                                    noOptionsMessage={() => 'لا توجد فترات شهرية'}
                                />
                            </div>
                        )}

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300 mb-2">
                                <Users size={13} className="text-primary-600" />
                                الصف والشعبة
                            </label>
                            <SelectInput
                                value={divisionId}
                                onChange={(val) => {
                                    const v = val || '';
                                    setDivisionId(v);
                                    applyFilter({ division_id: v });
                                }}
                                options={divisions.map((d) => ({
                                    value: d.id,
                                    label: `${d.grade?.name || ''} - ${d.name}`,
                                }))}
                                placeholder="اختر الصف والشعبة..."
                                noOptionsMessage={() => 'لا توجد شعب متاحة'}
                            />
                        </div>
                    </div>

                    {/* Search, Status Chips & Official Toggle */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            <div className="relative w-full sm:w-80 group">
                                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 flex items-center justify-center transition-colors group-focus-within:bg-primary-600 group-focus-within:text-white">
                                    <Search size={14} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ابحث باسم الطالب أو اسم المستخدم..."
                                    className="w-full py-2.5 pr-12 pl-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        title="مسح البحث"
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <label className="inline-flex items-center gap-3 cursor-pointer select-none px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70">
                            <input
                                type="checkbox"
                                checked={onlyOfficial}
                                onChange={(e) => setOnlyOfficial(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-10 h-5.5 bg-slate-300 dark:bg-slate-700 rounded-full relative transition-colors peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:w-4.5 after:h-4.5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:-translate-x-4.5" />
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                اعتماد الدرجات المقفلة/المعتمدة نهائياً فقط
                            </span>
                        </label>
                    </div>
                </div>

                {/* Roster Table or Onboarding Empty State */}
                {!divisionId ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-12 shadow-sm">
                        <div className="max-w-2xl mx-auto text-center space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                <Award size={34} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">اختر الشعبة لعرض كشف الشهادات</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
                                    بمجرد تحديد الشعبة من الفلاتر أعلاه، سيظهر كشف الطلاب مع إحصائيات النجاح والترتيب وخيارات الطباعة الفردية والجماعية.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right pt-2">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                                    <div className="text-xs font-black text-primary-600 dark:text-primary-400 mb-1">1. حدد النوع والفترة</div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">اختر شهادة فصلية أو شهرية وحدد الفصل أو الشهر المطلوب.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                                    <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-1">2. اختر الشعبة</div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ستُعرض درجات كل طالب ونسبته وترتيبه داخل الشعبة تلقائياً.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mb-1">3. عاين واطبع</div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">اطبع شهادة طالب واحد أو حمّلها PDF أو اطبع الشعبة كاملة.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Tabbed Table Navigation */}
                        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-4 pt-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'all', label: 'الكل', count: stats.total, icon: Users },
                                    { id: 'ready', label: 'جاهز للطباعة', count: stats.ready, icon: FileCheck2 },
                                    { id: 'official', label: 'معتمد بالكامل', count: stats.officialFull, icon: CheckCircle2 },
                                    { id: 'draft', label: 'مسودة', count: stats.draftCount, icon: Clock },
                                    { id: 'blocked', label: 'محجوبة', count: stats.blocked, icon: Lock },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = statusFilter === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setStatusFilter(tab.id)}
                                            className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-black whitespace-nowrap transition-all border-b-2 ${
                                                isActive
                                                    ? 'bg-white dark:bg-slate-900 text-[#4d7c0f] dark:text-lime-400 border-[#4d7c0f] dark:border-lime-400 shadow-xs'
                                                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                                            }`}
                                        >
                                            <Icon size={14} />
                                            <span>{tab.label}</span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                                                    isActive
                                                        ? 'bg-[#f7fbe9] text-[#4d7c0f] dark:bg-lime-500/15 dark:text-lime-300'
                                                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                {tab.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {onlyOfficial && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#4d7c0f] dark:text-lime-300 bg-[#f7fbe9] dark:bg-lime-500/15 border border-[#84b819]/40 px-3 py-1 rounded-full mb-2 lg:mb-1 self-start lg:self-auto">
                                    <CheckCircle2 size={12} />
                                    وضع الدرجات المعتمدة فقط مفعّل
                                </span>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase">
                                        <th className="py-3.5 px-4 text-center w-12">#</th>
                                        <th className="py-3.5 px-4">الطالب</th>
                                        <th className="py-3.5 px-4 text-center">المواد</th>
                                        <th className="py-3.5 px-4 text-center">المجموع</th>
                                        <th className="py-3.5 px-4 text-center w-36">النسبة المئوية</th>
                                        <th className="py-3.5 px-4 text-center">التقدير</th>
                                        <th className="py-3.5 px-4 text-center">الترتيب</th>
                                        <th className="py-3.5 px-4 text-center">الحالة</th>
                                        <th className="py-3.5 px-4 text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    {filteredRoster.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-14 text-center">
                                                <ShieldAlert size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                                <div className="font-black text-slate-600 dark:text-slate-300">
                                                    لا يوجد طلاب مطابقون للبحث أو التصفية الحالية
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-1">
                                                    جرّب مسح نص البحث أو تغيير فلتر الحالة إلى «الكل».
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRoster.map((item, idx) => {
                                            const officialCount = isMonthly ? item.submitted_count : item.locked_count;
                                            const canPrintStudent = onlyOfficial ? officialCount > 0 : item.has_grades;
                                            const initial = String(item.student_name || 'ط').trim().charAt(0);

                                            return (
                                                <tr
                                                    key={item.enrollment_id}
                                                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                                >
                                                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-primary-500/15 to-indigo-500/15 text-primary-700 dark:text-primary-300 font-black flex items-center justify-center border border-primary-500/15">
                                                                {initial}
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-slate-800 dark:text-white flex flex-wrap items-center gap-2">
                                                                    <span>{item.student_name}</span>
                                                                    {item.is_result_blocked && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                                            <Lock size={10} /> محجوبة عن الطالب
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] font-mono text-slate-400">{item.username}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                                        {item.subjects_count}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center font-mono font-black text-slate-800 dark:text-white">
                                                        {item.has_grades ? `${item.total_marks} / ${item.max_possible}` : '—'}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        {item.has_grades ? (
                                                            <div className="space-y-1.5">
                                                                <div className="text-center font-mono font-black text-slate-800 dark:text-white">
                                                                    {item.percentage}%
                                                                </div>
                                                                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${getProgressBarColor(Number(item.percentage || 0))}`}
                                                                        style={{ width: `${Math.min(100, Math.max(0, Number(item.percentage || 0)))}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="block text-center text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        {item.has_grades ? (
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-xl border text-[11px] font-black ${getGradeBadgeStyle(item.grade_code)}`}>
                                                                {item.grade_text}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        {item.rank ? (
                                                            <span className={`inline-flex items-center justify-center min-w-[2.2rem] px-2 py-0.5 rounded-lg border font-mono font-black text-xs ${getRankBadgeStyle(item.rank)}`}>
                                                                #{item.rank}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        {!item.has_grades ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                                                                لا توجد درجات
                                                            </span>
                                                        ) : officialCount === item.subjects_count ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 font-black">
                                                                <CheckCircle2 size={12} /> معتمد ({officialCount})
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 font-black">
                                                                <Clock size={12} /> مسودة ({officialCount}/{item.subjects_count})
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {canPrintStudent ? (
                                                                <>
                                                                    <a
                                                                        href={buildStudentCertUrl(item.student_id)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        title="معاينة وطباعة الشهادة"
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-black shadow-xs transition-all"
                                                                    >
                                                                        <Eye size={13} />
                                                                        <span>معاينة</span>
                                                                    </a>
                                                                    <a
                                                                        href={buildStudentPdfUrl(item.student_id)}
                                                                        title="تحميل الشهادة كملف PDF"
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-black transition-colors"
                                                                    >
                                                                        <Download size={13} />
                                                                        <span>PDF</span>
                                                                    </a>
                                                                </>
                                                            ) : (
                                                                <span className="text-[11px] font-bold text-slate-400 px-2">
                                                                    {item.has_grades && onlyOfficial ? 'بانتظار الاعتماد' : '—'}
                                                                </span>
                                                            )}
                                                            <a
                                                                href={route('academic.students.grade-report', item.student_id)}
                                                                title="تقرير الدرجات التفصيلي"
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                                            >
                                                                <BarChart3 size={14} />
                                                            </a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
