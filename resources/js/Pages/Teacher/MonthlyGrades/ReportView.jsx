import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, Calculator, ArrowRight, Filter, X, Search, ChevronDown } from 'lucide-react';
import ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';


export default function MonthlyGradesReportView({ division, subject, period, gradeSetting, enrollments, existingGrades }) {
    // 1. Settings
    const isMonthly = period.period_type === 'monthly' || !period.period_type;
    const weeksCount = gradeSetting.weeks_per_month || 4;
    const oralMax = gradeSetting.weekly_oral_max || 5;
    const hwMax = gradeSetting.weekly_homework_max || 5;
    const behaviorMax = gradeSetting.monthly_behavior_max || 10;
    const examMax = gradeSetting.monthly_exam_max || 50;

    let parsedWeeksDates = period.weeks_dates;
    if (typeof parsedWeeksDates === 'string') {
        try { parsedWeeksDates = JSON.parse(parsedWeeksDates); } catch (e) { parsedWeeksDates = null; }
    }
    
    let rawWeeksData = isMonthly ? (parsedWeeksDates || []) : [];
    if (!Array.isArray(rawWeeksData) || rawWeeksData.length === 0) {
        rawWeeksData = isMonthly ? Array.from({ length: weeksCount }, () => ({})) : [];
    }

    const weeksData = rawWeeksData.map((wd, i) => ({
        ...(wd || {}),
        name: (wd && wd.name) ? wd.name : `الأسبوع ${i + 1}`
    }));
    
    const weeks = weeksData.map((_, i) => `week_${i + 1}`);

    const [localGrades] = useState(() => {
        const init = {};
        enrollments.forEach(enrollment => {
            const existing = existingGrades[enrollment.id] || {};
            const weekly = existing.weekly_scores || {};
            const scores = existing.scores || {};
            
            init[enrollment.id] = {
                enrollment_id: enrollment.id,
                weekly: {},
                summary: {
                    behavior: scores.behavior ?? '',
                    monthly_exam: scores.monthly_exam ?? '',
                    note: scores.note ?? ''
                },
                is_submitted: existing.is_submitted || false
            };

            weeks.forEach(w => {
                init[enrollment.id].weekly[w] = {
                    oral: weekly[w]?.oral ?? '',
                    homework: weekly[w]?.homework ?? '',
                    note: weekly[w]?.note ?? ''
                };
            });
        });
        return init;
    });

    const calculateStudentTotals = (studentData) => {
        let oralTotal = 0;
        let hwTotal = 0;
        
        weeks.forEach(w => {
            oralTotal += parseFloat(studentData.weekly[w]?.oral) || 0;
            hwTotal += parseFloat(studentData.weekly[w]?.homework) || 0;
        });

        const behavior = parseFloat(studentData.summary.behavior) || 0;
        const exam = parseFloat(studentData.summary.monthly_exam) || 0;
        const grandTotal = oralTotal + hwTotal + behavior + exam;

        return { oralTotal, hwTotal, behavior, exam, grandTotal };
    };

    const [printSettings, setPrintSettings] = useState(() => {
        const defaultSettings = {
            title: `تقرير درجات ${subject.name} - ${division.grade?.name} (${division.name}) - ${period.month_name}`,
            showKPIs: true,
            showDetails: true,
            orientation: 'landscape',
            ecoMode: false,
            watermark: 'none',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            brandColor: '#2563eb',
        };
        try {
            const saved = localStorage.getItem('MonthlyGradeReportPrintSettings');
            if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {}
        return defaultSettings;
    });

    React.useEffect(() => {
        localStorage.setItem('MonthlyGradeReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                printSettings: JSON.stringify(printSettings)
            });

            const url = route('academic.monthly-grades.report.pdf', {
                division: division.id,
                subject_id: subject.id,
                period: period.id
            }) + '?' + params.toString();
            
            window.location.href = url;
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء طلب الملف.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Frontend Smart Filters
    const [filterLevel, setFilterLevel] = useState('all');
    const [sortBy, setSortBy] = useState('alpha');
    const [hideEmpty, setHideEmpty] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [missingBehavior, setMissingBehavior] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
    const studentSearchRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (studentSearchRef.current && !studentSearchRef.current.contains(e.target)) {
                setStudentDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const selectedEnrollment = enrollments.find(e => e.id === selectedStudent);
    const filteredStudentOptions = enrollments.filter(e =>
        (e.student?.user?.name || e.student?.name || '').includes(studentSearch)
    );

    const maxWeeklyTotal = (oralMax + hwMax) * weeksCount;
    const maxTotalScore = maxWeeklyTotal + behaviorMax + examMax;

    const processedEnrollments = enrollments.map(enrollment => {
        const data = localGrades[enrollment.id];
        const totals = calculateStudentTotals(data);
        return {
            ...enrollment,
            gradeData: data,
            totals: totals,
            percentage: maxTotalScore > 0 ? (totals.grandTotal / maxTotalScore) * 100 : 0
        };
    }).filter(enroll => {
        if (selectedStudent && enroll.id !== selectedStudent) return false;
        
        const hasAnyScore = enroll.totals.grandTotal > 0 || enroll.gradeData.is_submitted;
        if (hideEmpty && !hasAnyScore) return false;
        
        if (missingBehavior && (enroll.totals.behavior < behaviorMax)) return false;

        if (filterLevel === 'excellent' && enroll.percentage < 90) return false;
        if (filterLevel === 'average' && (enroll.percentage < 70 || enroll.percentage >= 90)) return false;
        if (filterLevel === 'weak' && enroll.percentage >= 70) return false;

    }).sort((a, b) => {
        if (sortBy === 'total_desc') return b.totals.grandTotal - a.totals.grandTotal;
        if (sortBy === 'total_asc') return a.totals.grandTotal - b.totals.grandTotal;
        return 0; // alpha
    });

    // KPI Calculations
    const baseEnrollments = enrollments.map(enrollment => {
        const data = localGrades[enrollment.id];
        const totals = calculateStudentTotals(data);
        return {
            ...enrollment,
            gradeData: data,
            totals: totals,
            percentage: maxTotalScore > 0 ? (totals.grandTotal / maxTotalScore) * 100 : 0
        };
    });

    const totalStudents = baseEnrollments.length;
    const submittedCount = baseEnrollments.filter(e => e.gradeData.is_submitted || e.totals.grandTotal > 0).length;
    const submissionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
    
    const excellentCount = baseEnrollments.filter(e => e.percentage >= 90 && e.totals.grandTotal > 0).length;
    const weakCount = baseEnrollments.filter(e => e.percentage < 50 && e.totals.grandTotal > 0).length;
    const passCount = submittedCount - weakCount;
    const passRate = submittedCount > 0 ? Math.round((passCount / submittedCount) * 100) : 0;

    return (
        <AdminLayout activeMenu="الدرجات الشهرية">
            <Head title={`تقرير درجات - ${subject.name}`} />

            <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8">
                {/* Header Card */}
                <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 print:hidden">
                    {/* Top gradient accent */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 via-indigo-500 to-primary-400 z-10" />

                    {/* Decorative background elements */}
                    <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-primary-50/60 to-transparent dark:from-primary-900/20 dark:to-transparent pointer-events-none" />
                    <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-indigo-100/40 dark:bg-indigo-900/20 pointer-events-none" />
                    <div className="absolute -bottom-6 right-16 w-24 h-24 rounded-full bg-primary-100/30 dark:bg-primary-900/10 pointer-events-none" />

                    <div className="relative p-6 md:p-7">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-400 dark:text-slate-500 mb-5">
                            <Link
                                href={route('academic.monthly-grades.report.index')}
                                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                                تقارير الدرجات الشهرية
                            </Link>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <span className="text-slate-600 dark:text-slate-300 font-bold">تقرير المادة</span>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                            {/* Left: Icon + Title + Meta */}
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="relative shrink-0">
                                    <div className="w-14 h-14 rounded-2xl bg-primary-600 dark:bg-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 dark:shadow-primary-900/50">
                                        <Calculator className="w-7 h-7 text-white" />
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white dark:border-slate-800 rounded-full" />
                                </div>

                                {/* Title + chips */}
                                <div>
                                    <h1 className="text-2xl md:text-[26px] font-black text-slate-800 dark:text-white leading-tight mb-2">
                                        {subject.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Grade/Division chip */}
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800/50">
                                            <BookOpen size={11} />
                                            {division.grade?.name} — {division.name}
                                        </span>
                                        {/* Period chip */}
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                                            📅 {period.month_name}
                                        </span>
                                        {/* Date range chip */}
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 font-mono" dir="ltr">
                                            {String(period.fill_start_date).split('T')[0]} → {String(period.fill_end_date).split('T')[0]}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Quick stats */}
                            <div className="flex items-center gap-3 lg:shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="text-center px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 min-w-[80px]">
                                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-0.5">إجمالي الطلاب</p>
                                        <p className="text-2xl font-black text-slate-800 dark:text-white">{enrollments.length}</p>
                                    </div>
                                    <div className="text-center px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 min-w-[80px]">
                                        <p className="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 mb-0.5">النهاية الكبرى</p>
                                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{maxTotalScore}</p>
                                    </div>
                                    <div className="text-center px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 min-w-[80px]">
                                        <p className="text-[11px] font-bold text-amber-500 dark:text-amber-400 mb-0.5">عدد الأسابيع</p>
                                        <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{weeksCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Grid (PDF-style UI) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">نسبة التغطية (الرصد)</p>
                        <div className="flex items-end gap-2">
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{submissionRate}%</h3>
                            <span className="text-sm font-bold text-slate-400 mb-1">({submittedCount} طالب)</span>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">نسبة النجاح (الاجتياز)</p>
                        <div className="flex items-end gap-2">
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{passRate}%</h3>
                            <span className="text-sm font-bold text-slate-400 mb-1">({passCount} طالب)</span>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الطلاب المتميزين (90%+)</p>
                        <div className="flex items-end gap-2">
                            <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{excellentCount}</h3>
                            <span className="text-sm font-bold text-slate-400 mb-1">طالب</span>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الطلاب الضعاف (&lt;50%)</p>
                        <div className="flex items-end gap-2">
                            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400">{weakCount}</h3>
                            <span className="text-sm font-bold text-slate-400 mb-1">طالب</span>
                        </div>
                    </div>
                </div>

                {/* Secondary Frontend Filters */}
                {enrollments.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 print:hidden relative">
                        {/* Top accent bar - using border-top trick instead of overflow-hidden */}
                        <div className="h-1 w-full bg-gradient-to-r from-primary-600 via-indigo-500 to-primary-400 rounded-t-2xl" />

                        <div className="p-5">
                            {/* Header row */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                    <Filter size={15} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <span className="text-[15px] font-black text-slate-700 dark:text-slate-200">فلاتر ذكية</span>
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded-full">فورية · بدون إعادة تحميل</span>
                            </div>

                            <div className="flex flex-col xl:flex-row items-start xl:items-end gap-5">

                                {/* Left: All filter groups */}
                                <div className="flex flex-wrap gap-4 flex-1">

                                    {/* Group 1: Level Filter */}
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pr-1">مستوى الأداء</span>
                                        <div className="flex items-center gap-1.5">
                                            {[
                                                { key: 'all',       label: 'الكل',           color: filterLevel === 'all'       ? 'bg-slate-700 text-white shadow-md'              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600' },
                                                { key: 'excellent', label: 'ممتاز ٪90+',     color: filterLevel === 'excellent' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100' },
                                                { key: 'average',   label: 'متوسط',          color: filterLevel === 'average'   ? 'bg-amber-500 text-white shadow-md shadow-amber-200'   : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100' },
                                                { key: 'weak',      label: 'ضعيف ٪70<',     color: filterLevel === 'weak'      ? 'bg-rose-500 text-white shadow-md shadow-rose-200'     : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100' },
                                            ].map(btn => (
                                                <button
                                                    key={btn.key}
                                                    onClick={() => setFilterLevel(btn.key)}
                                                    className={`px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 ${btn.color}`}
                                                >
                                                    {btn.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="hidden xl:block w-px bg-slate-200 dark:bg-slate-700 self-stretch my-1" />

                                    {/* Group 2: Sort */}
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pr-1">الترتيب</span>
                                        <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-xl p-1 gap-1">
                                            {[
                                                { key: 'alpha',      label: 'أبجدي' },
                                                { key: 'total_desc', label: '▲ الأعلى' },
                                                { key: 'total_asc',  label: '▼ الأقل' },
                                            ].map(btn => (
                                                <button
                                                    key={btn.key}
                                                    onClick={() => setSortBy(btn.key)}
                                                    className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${sortBy === btn.key ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                                >
                                                    {btn.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="hidden xl:block w-px bg-slate-200 dark:bg-slate-700 self-stretch my-1" />

                                    {/* Group 3: Toggle switches */}
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pr-1">خيارات العرض</span>
                                        <div className="flex items-center gap-2">
                                            {/* Toggle: Hide Empty */}
                                            <button
                                                onClick={() => setHideEmpty(!hideEmpty)}
                                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 border ${hideEmpty ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                            >
                                                {/* mini toggle indicator */}
                                                <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ${hideEmpty ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                                    <span className={`absolute h-3 w-3 rounded-full bg-white shadow transition-all duration-200 ${hideEmpty ? 'translate-x-3.5' : 'translate-x-0.5'}`} style={{ backgroundColor: hideEmpty ? 'white' : '#94a3b8' }} />
                                                </span>
                                                إخفاء غير المرصود
                                            </button>

                                            {/* Toggle: Missing Behavior */}
                                            <button
                                                onClick={() => setMissingBehavior(!missingBehavior)}
                                                title="عرض الطلاب الذين لم يُكتمل رصد سلوكهم"
                                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 border ${missingBehavior ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100 dark:shadow-orange-900/20' : 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 border-slate-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                                            >
                                                <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ${missingBehavior ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                                    <span className={`absolute h-3 w-3 rounded-full shadow transition-all duration-200 ${missingBehavior ? 'translate-x-3.5 bg-white' : 'translate-x-0.5 bg-orange-400'}`} />
                                                </span>
                                                نقص السلوك
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Student Search */}
                                <div className="flex flex-col gap-1.5 w-full xl:w-72" ref={studentSearchRef}>
                                    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pr-1">بحث سريع</span>
                                    <div className="relative">
                                        {/* Trigger button */}
                                        <button
                                            type="button"
                                            onClick={() => { setStudentDropdownOpen(v => !v); setStudentSearch(''); }}
                                            className="w-full flex items-center justify-between gap-2 h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:border-primary-400 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold text-slate-700 dark:text-slate-200"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Search size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate">
                                                    {selectedEnrollment
                                                        ? (selectedEnrollment.student?.user?.name || selectedEnrollment.student?.name)
                                                        : 'عرض جميع الطلاب'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {selectedStudent && (
                                                    <span
                                                        role="button"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedStudent(''); setStudentSearch(''); }}
                                                        className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600"
                                                    >
                                                        <X size={13} />
                                                    </span>
                                                )}
                                                <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${studentDropdownOpen ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>

                                        {/* Dropdown panel */}
                                        {studentDropdownOpen && (
                                            <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden">
                                                {/* Search inside dropdown */}
                                                <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-1.5">
                                                        <Search size={13} className="text-slate-400 shrink-0" />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={studentSearch}
                                                            onChange={e => setStudentSearch(e.target.value)}
                                                            placeholder="ابحث باسم الطالب..."
                                                            className="w-full bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none"
                                                        />
                                                        {studentSearch && (
                                                            <button onClick={() => setStudentSearch('')} className="text-slate-400 hover:text-slate-600">
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Options list */}
                                                <div className="max-h-56 overflow-y-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedStudent(''); setStudentDropdownOpen(false); setStudentSearch(''); }}
                                                        className={`w-full text-right px-4 py-2.5 text-sm font-bold transition-colors ${!selectedStudent ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                    >
                                                        عرض جميع الطلاب
                                                    </button>
                                                    {filteredStudentOptions.length === 0 ? (
                                                        <p className="text-center text-sm text-slate-400 py-4">لا توجد نتائج</p>
                                                    ) : filteredStudentOptions.map(e => {
                                                        const name = e.student?.user?.name || e.student?.name;
                                                        return (
                                                            <button
                                                                key={e.id}
                                                                type="button"
                                                                onClick={() => { setSelectedStudent(e.id); setStudentDropdownOpen(false); setStudentSearch(''); }}
                                                                className={`w-full text-right px-4 py-2.5 text-sm font-medium transition-colors ${selectedStudent === e.id ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                            >
                                                                {name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Print Layout Wrap */}
                <ReportPrintLayout 
                    title={printSettings.title} 
                    printSettings={printSettings} 
                    setPrintSettings={setPrintSettings} 
                    onPrint={handlePrint} 
                    onDownloadPdf={handleDownloadPDF} 
                    isGeneratingPdf={isGeneratingPdf} 
                    startDate={String(period.fill_start_date).split('T')[0]} 
                    endDate={String(period.fill_end_date).split('T')[0]}
                >
                    <div className="mb-6 flex flex-col gap-1 items-start text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-transparent print:border-none print:p-0 print:mb-4">
                        <span>المادة: {subject.name}</span>
                        <span>الصف والشعبة: {division.grade?.name} - {division.name}</span>
                        <span>الفترة: {period.month_name} ({String(period.fill_start_date).split('T')[0]} - {String(period.fill_end_date).split('T')[0]})</span>
                    </div>

                    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-300 print:shadow-none print:border-none p-4 print:p-0">
                        <table className="w-full text-sm text-center border-collapse border border-slate-300 dark:border-slate-600 print:border-black">
                            <thead className="print:border-black">
                                <tr className="brand-bg">
                                    <th className="w-10 min-w-[40px] py-3 px-2 font-black text-white border border-slate-300 dark:border-slate-600 print:border-black sticky right-0 z-20 shadow-[-1px_0_0_#cbd5e1_inset] dark:shadow-[-1px_0_0_#475569_inset] print:static print:shadow-none brand-bg" rowSpan="2">م</th>
                                    <th className="w-56 min-w-[224px] py-3 px-4 font-black text-white text-right border border-slate-300 dark:border-slate-600 print:border-black sticky right-[40px] z-20 shadow-[-1px_0_0_#cbd5e1_inset] dark:shadow-[-1px_0_0_#475569_inset] print:static print:shadow-none brand-bg" rowSpan="2">اسم الطالب</th>
                                    
                                    {/* Weeks Headers */}
                                    {weeksData.map((week, idx) => (
                                        <th key={`h-${idx}`} className="py-2 px-2 font-black text-white border border-slate-300 dark:border-slate-600 print:border-black" colSpan="3">
                                            {week.name}
                                        </th>
                                    ))}
                                    
                                    {/* Summary Headers */}
                                    <th className="py-2 px-2 font-black text-white border border-slate-300 dark:border-slate-600 print:border-black" colSpan="3">ملخص الشهر</th>
                                    <th className="py-3 px-4 font-black text-white border border-slate-300 dark:border-slate-600 print:border-black bg-black/10 print:bg-slate-200/50" rowSpan="2">الإجمالي<br/>النهائي</th>
                                    <th className="py-3 px-4 font-black text-white border border-slate-300 dark:border-slate-600 print:border-black" rowSpan="2">ملاحظات</th>
                                </tr>
                                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                    {/* Sub-headers for weeks */}
                                    {weeksData.map((_, idx) => (
                                        <React.Fragment key={`subh-${idx}`}>
                                            <th className="py-2 px-2 text-xs font-bold border border-slate-300 dark:border-slate-600 print:border-black">شفهي</th>
                                            <th className="py-2 px-2 text-xs font-bold border border-slate-300 dark:border-slate-600 print:border-black">واجب</th>
                                            <th className="py-2 px-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 print:border-black">المجموع</th>
                                        </React.Fragment>
                                    ))}
                                    {/* Sub-headers for summary */}
                                    <th className="py-2 px-2 text-xs font-bold border border-slate-300 dark:border-slate-600 print:border-black">مجموع<br/>الأسابيع</th>
                                    <th className="py-2 px-2 text-xs font-bold border border-slate-300 dark:border-slate-600 print:border-black">سلوك<br/>ومواظبة</th>
                                    <th className="py-2 px-2 text-xs font-bold border border-slate-300 dark:border-slate-600 print:border-black">اختبار<br/>شهري</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 print:divide-black/20">
                                {processedEnrollments.length === 0 ? (
                                    <tr>
                                        <td colSpan={weeksData.length * 3 + 7} className="py-12 px-6 text-center text-slate-500 font-bold">
                                            {enrollments.length === 0 ? 'لا يوجد طلاب مسجلين في هذا الفصل.' : 'لا توجد نتائج مطابقة لخيارات الفلترة.'}
                                        </td>
                                    </tr>
                                ) : (
                                    processedEnrollments.map((enrollment, index) => {
                                        const data = enrollment.gradeData;
                                        const totals = enrollment.totals;
                                        const weeklyTotal = totals.oralTotal + totals.hwTotal;
                                        let heatClass = "bg-slate-100/50 print:bg-slate-200/50";
                                        if (totals.grandTotal > 0) {
                                            if (enrollment.percentage >= 90) heatClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-black";
                                            else if (enrollment.percentage >= 75) heatClass = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold";
                                            else if (enrollment.percentage >= 50) heatClass = "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold";
                                            else heatClass = "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-500 font-black";
                                        }

                                        return (
                                            <tr key={enrollment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="w-10 min-w-[40px] py-2 px-2 font-bold text-slate-500 text-xs border border-slate-300 dark:border-slate-600 print:border-black sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 shadow-[-1px_0_0_#cbd5e1_inset] dark:shadow-[-1px_0_0_#475569_inset] transition-colors print:static print:shadow-none">{index + 1}</td>
                                                <td className="w-56 min-w-[224px] py-2 px-4 text-right border border-slate-300 dark:border-slate-600 print:border-black sticky right-[40px] z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 shadow-[-1px_0_0_#cbd5e1_inset] dark:shadow-[-1px_0_0_#475569_inset] transition-colors print:static print:shadow-none">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm whitespace-nowrap">
                                                        {enrollment.student?.user?.name}
                                                    </span>
                                                </td>
                                                
                                                {/* Week cells */}
                                                {weeks.map(w => {
                                                    const wTotal = (parseFloat(data.weekly[w]?.oral) || 0) + (parseFloat(data.weekly[w]?.homework) || 0);
                                                    return (
                                                        <React.Fragment key={`${enrollment.id}-${w}`}>
                                                            <td className="py-2 px-2 text-sm border border-slate-300 dark:border-slate-600 print:border-black">{data.weekly[w]?.oral}</td>
                                                            <td className="py-2 px-2 text-sm border border-slate-300 dark:border-slate-600 print:border-black">{data.weekly[w]?.homework}</td>
                                                            <td className="py-2 px-2 text-sm font-bold bg-slate-50 dark:bg-slate-800/30 border border-slate-300 dark:border-slate-600 print:border-black">{wTotal || ''}</td>
                                                        </React.Fragment>
                                                    );
                                                })}
                                                
                                                {/* Summary cells */}
                                                <td className="py-2 px-2 text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 print:border-black">{weeklyTotal || ''}</td>
                                                <td className="py-2 px-2 text-sm border border-slate-300 dark:border-slate-600 print:border-black">{data.summary.behavior}</td>
                                                <td className="py-2 px-2 text-sm border border-slate-300 dark:border-slate-600 print:border-black">{data.summary.monthly_exam}</td>
                                                <td className={`py-2 px-4 text-sm print:bg-slate-200/50 border border-slate-300 dark:border-slate-600 print:border-black print:text-black ${heatClass}`}>{totals.grandTotal || ''}</td>
                                                <td className="py-2 px-4 text-xs text-slate-500 text-right truncate max-w-[150px] border border-slate-300 dark:border-slate-600 print:border-black" title={data.summary.note}>
                                                    {data.summary.note}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </ReportPrintLayout>
            </div>
        </AdminLayout>
    );
}
