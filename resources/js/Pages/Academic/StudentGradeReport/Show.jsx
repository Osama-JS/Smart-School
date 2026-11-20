import React, { useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    FileText, Printer, ArrowRight, Award, BookOpen, Calendar,
    GraduationCap, Layers, Search, TrendingUp, CheckCircle2, Lock, X
} from 'lucide-react';

export default function StudentGradeReport({ student, enrollment, reportData = [] }) {
    const [subjectSearch, setSubjectSearch] = useState('');

    const handlePrint = () => {
        window.print();
    };

    const stats = useMemo(() => {
        const totalSubjects = reportData.length;
        if (totalSubjects === 0) {
            return { totalSubjects: 0, avgYearly: '0.0', totalYearlySum: 0, bestSubject: null };
        }

        let sum = 0;
        let best = reportData[0];
        reportData.forEach((subj) => {
            const val = Number(subj.yearly_total || 0);
            sum += val;
            if (val > Number(best?.yearly_total || 0)) {
                best = subj;
            }
        });

        return {
            totalSubjects,
            totalYearlySum: Number(sum.toFixed(2)),
            avgYearly: (sum / totalSubjects).toFixed(1),
            bestSubject: Number(best?.yearly_total || 0) > 0 ? best : null,
        };
    }, [reportData]);

    const filteredSubjects = useMemo(() => {
        const q = subjectSearch.trim().toLowerCase();
        if (!q) return reportData;
        return reportData.filter((s) => String(s.name || '').toLowerCase().includes(q));
    }, [reportData, subjectSearch]);

    const studentInitial = String(student?.user?.name || 'ط').trim().charAt(0);

    return (
        <AdminLayout activeMenu="الطلاب المسجلين">
            <Head title={`كشف درجات | ${student?.user?.name || ''}`} />

            <div className="max-w-6xl mx-auto space-y-6 sm:px-6 lg:px-8 pb-12 animate-fade-in">
                {/* Action Toolbar (No Print) */}
                <div className="print:hidden bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('academic.students')}
                            className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition-colors border border-slate-200/70 dark:border-slate-700"
                            title="العودة لقائمة الطلاب"
                        >
                            <ArrowRight className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">كشف درجات الطالب التفصيلي</h2>
                                {enrollment?.is_result_blocked && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                        <Lock size={11} /> النتيجة محجوبة
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                سجل أكاديمي متكامل للدرجات الشهرية والفصلية والسنوية
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {reportData.length > 0 && (
                            <div className="relative w-full sm:w-56">
                                <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={subjectSearch}
                                    onChange={(e) => setSubjectSearch(e.target.value)}
                                    placeholder="تصفية حسب المادة..."
                                    className="w-full py-2.5 pr-9 pl-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                                />
                                {subjectSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setSubjectSearch('')}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        )}

                        <Link
                            href={route('academic.certificates.index', { student_id: student.id })}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 transition-colors"
                        >
                            <Award className="w-4 h-4" />
                            مركز الشهادات
                        </Link>

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 bg-gradient-to-l from-lime-700 to-lime-600 hover:from-lime-600 hover:to-lime-500 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-lime-700/20 transition-all"
                        >
                            <Printer className="w-4 h-4" />
                            طباعة الكشف
                        </button>
                    </div>
                </div>

                {/* Printable Report Container */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none print:rounded-none print:bg-white">
                    {/* Top Harmonized Accent Bar */}
                    <div
                        className="h-2 w-full [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                        style={{ background: 'linear-gradient(to left, #18181b 0%, #18181b 20%, #dc2626 20%, #dc2626 42%, #84b819 42%, #4d7c0f 100%)' }}
                    />

                    <div className="p-6 md:p-10 print:p-2 space-y-8">
                        {/* Report Header + Student Card */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b-2 border-lime-600/30">
                            <div className="space-y-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-lime-50 text-lime-800 border border-lime-200 dark:bg-lime-500/15 dark:text-lime-300 dark:border-lime-500/30 [color-adjust:exact] [-webkit-print-color-adjust:exact]">
                                    <GraduationCap size={14} />
                                    السجل الأكاديمي الشامل
                                </span>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white print:text-slate-900">
                                    كشف الدرجات التفصيلي
                                </h1>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Calendar size={15} className="text-lime-700" />
                                    العام الدراسي: <span className="text-slate-800 dark:text-slate-200">{enrollment?.academicYear?.name || '—'}</span>
                                </p>
                            </div>

                            <div className="bg-lime-50/60 dark:bg-slate-800/80 border border-lime-200/80 dark:border-slate-700 border-r-4 border-r-lime-700 rounded-2xl p-4 sm:p-5 min-w-[290px] [color-adjust:exact] [-webkit-print-color-adjust:exact]">
                                <div className="flex items-center gap-3.5 pb-3.5 border-b border-lime-200/60 dark:border-slate-700">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-700 to-lime-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
                                        {studentInitial}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">اسم الطالب</p>
                                        <p className="text-base font-black text-slate-900 dark:text-white">{student?.user?.name}</p>
                                        {student?.user?.username && (
                                            <p className="text-[11px] font-mono font-bold text-slate-400">{student.user.username}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-3">
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">الصف الدراسي</p>
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                                            {enrollment?.division?.grade?.name || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">الشعبة</p>
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                                            {enrollment?.division?.name || '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Overall KPI Summary */}
                        {reportData.length > 0 && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <BookOpen size={13} className="text-lime-700" />
                                        عدد المواد الدراسية
                                    </div>
                                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                                        {stats.totalSubjects}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <Layers size={13} className="text-indigo-600" />
                                        مجموع الدرجات السنوية
                                    </div>
                                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                                        {stats.totalYearlySum}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-lime-50/70 dark:bg-lime-500/10 border border-lime-200/80 dark:border-lime-500/20">
                                    <div className="text-[11px] font-bold text-lime-800 dark:text-lime-300 flex items-center gap-1.5">
                                        <TrendingUp size={13} />
                                        متوسط المادة السنوي
                                    </div>
                                    <div className="text-2xl font-black font-mono text-lime-800 dark:text-lime-300 mt-1">
                                        {stats.avgYearly} <span className="text-xs font-bold opacity-70">/ 100</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <CheckCircle2 size={13} className="text-emerald-600" />
                                        أعلى مادة أداءً
                                    </div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white mt-1.5 truncate">
                                        {stats.bestSubject ? `${stats.bestSubject.name} (${stats.bestSubject.yearly_total})` : '—'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Subjects Loop */}
                        <div className="space-y-8">
                            {filteredSubjects.map((subject) => {
                                const yearlyPct = Math.min(100, Math.max(0, Number(subject.yearly_total || 0)));
                                return (
                                    <div
                                        key={subject.id}
                                        className="break-inside-avoid rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
                                    >
                                        {/* Subject Banner */}
                                        <div
                                            className="px-5 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                                            style={{ backgroundColor: '#4d7c0f' }}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-white" />
                                                </div>
                                                <h3 className="font-black text-lg">{subject.name}</h3>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-lime-100">المجموع السنوي:</span>
                                                <span className="px-3.5 py-1 rounded-xl bg-white text-lime-900 font-mono font-black text-sm shadow-xs">
                                                    {subject.yearly_total} <span className="text-xs font-bold text-slate-400">/ 100</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Yearly Progress Thin Line */}
                                        <div className="w-full h-1.5 bg-lime-100 dark:bg-slate-800">
                                            <div
                                                className="h-full transition-all [color-adjust:exact] [-webkit-print-color-adjust:exact]"
                                                style={{
                                                    width: `${yearlyPct}%`,
                                                    backgroundColor: yearlyPct >= 50 ? '#84b819' : '#dc2626',
                                                }}
                                            />
                                        </div>

                                        <div className="p-5 md:p-6 space-y-6 bg-white dark:bg-slate-900">
                                            {Object.values(subject.semesters || {}).map((semester) => (
                                                <div key={semester.name} className="space-y-4">
                                                    <div className="flex flex-wrap justify-between items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                                                        <h4 className="font-black text-base text-lime-800 dark:text-lime-400 flex items-center gap-2">
                                                            <GraduationCap size={17} />
                                                            {semester.name}
                                                        </h4>

                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {semester.semester_id && (
                                                                <a
                                                                    href={route('academic.certificates.semester', {
                                                                        student: student.id,
                                                                        semester: semester.semester_id,
                                                                    })}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="print:hidden inline-flex items-center gap-1.5 text-xs font-black bg-lime-700 hover:bg-lime-800 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
                                                                >
                                                                    <Award size={13} /> طباعة الشهادة الفصلية
                                                                </a>
                                                            )}
                                                            {semester.result && (
                                                                <span className="text-xs font-black bg-lime-50 dark:bg-lime-500/15 text-lime-800 dark:text-lime-300 border border-lime-200 dark:border-lime-500/30 px-3 py-1.5 rounded-xl">
                                                                    إجمالي الفصل: <span className="font-mono text-sm mr-1">{semester.result.semester_total}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Months */}
                                                    {(!semester.months || semester.months.length === 0) ? (
                                                        <p className="text-slate-400 font-bold text-xs py-2">لا توجد درجات شهرية مسجلة في هذا الفصل.</p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 gap-3.5">
                                                            {semester.months.map((month) => {
                                                                const oralMax = (subject.settings?.weekly_oral_max ?? 5) * (subject.settings?.weeks_per_month ?? 4);
                                                                const hwMax = (subject.settings?.weekly_homework_max ?? 5) * (subject.settings?.weeks_per_month ?? 4);
                                                                return (
                                                                    <div
                                                                        key={month.month_name}
                                                                        className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 p-4"
                                                                    >
                                                                        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                                                                            <h5 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                                                <Calendar size={14} className="text-lime-700 dark:text-lime-400" />
                                                                                {month.month_name}
                                                                            </h5>
                                                                            <div className="flex items-center gap-2">
                                                                                {month.period_id && (
                                                                                    <a
                                                                                        href={route('academic.certificates.monthly', {
                                                                                            student: student.id,
                                                                                            period: month.period_id,
                                                                                        })}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="print:hidden inline-flex items-center gap-1 text-[11px] font-black px-3 py-1 bg-white dark:bg-slate-900 hover:bg-lime-50 text-lime-800 dark:text-lime-300 rounded-xl border border-lime-300 dark:border-lime-500/30 transition-colors"
                                                                                    >
                                                                                        <Award size={12} /> الشهادة الشهرية
                                                                                    </a>
                                                                                )}
                                                                                <span className="text-xs font-black px-3 py-1 bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-mono">
                                                                                    إجمالي الشهر: {month.scores?.grand_total ?? '—'}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                                                                            <div className="bg-white dark:bg-slate-900 py-2.5 px-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
                                                                                <div className="text-slate-400 text-[11px] font-bold">الشفهي</div>
                                                                                <div className="font-mono font-black text-slate-800 dark:text-slate-100 mt-0.5">
                                                                                    {month.scores?.oral_total ?? '—'} <span className="text-[10px] text-slate-400">/ {oralMax}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="bg-white dark:bg-slate-900 py-2.5 px-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
                                                                                <div className="text-slate-400 text-[11px] font-bold">الواجبات</div>
                                                                                <div className="font-mono font-black text-slate-800 dark:text-slate-100 mt-0.5">
                                                                                    {month.scores?.homework_total ?? '—'} <span className="text-[10px] text-slate-400">/ {hwMax}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="bg-white dark:bg-slate-900 py-2.5 px-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
                                                                                <div className="text-slate-400 text-[11px] font-bold">المواظبة</div>
                                                                                <div className="font-mono font-black text-slate-800 dark:text-slate-100 mt-0.5">
                                                                                    {month.scores?.behavior ?? '—'} <span className="text-[10px] text-slate-400">/ {subject.settings?.monthly_behavior_max}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="bg-white dark:bg-slate-900 py-2.5 px-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
                                                                                <div className="text-slate-400 text-[11px] font-bold">الاختبار الشهري</div>
                                                                                <div className="font-mono font-black text-slate-800 dark:text-slate-100 mt-0.5">
                                                                                    {month.scores?.monthly_exam ?? '—'} <span className="text-[10px] text-slate-400">/ {subject.settings?.monthly_exam_max}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {month.scores?.note && (
                                                                            <div className="mt-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-xl px-3 py-2 text-xs text-amber-800 dark:text-amber-300 font-bold">
                                                                                ملاحظة المعلم: {month.scores.note}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Semester Result Summary */}
                                                    {semester.result && (
                                                        <div className="bg-lime-50/80 dark:bg-lime-500/10 rounded-2xl p-4 border border-lime-200 dark:border-lime-500/25 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                                            <div>
                                                                <p className="text-[11px] text-lime-800 dark:text-lime-300 font-bold">المحصلة الفصلية (أعمال السنة)</p>
                                                                <p className="font-mono font-black text-lime-950 dark:text-white text-lg mt-0.5">
                                                                    {semester.result.monthly_aggregate} <span className="text-xs text-slate-400">/ {subject.settings?.semester_aggregate_max}</span>
                                                                </p>
                                                            </div>
                                                            <div className="sm:border-x border-lime-200 dark:border-lime-500/25">
                                                                <p className="text-[11px] text-lime-800 dark:text-lime-300 font-bold">اختبار نهاية الفصل</p>
                                                                <p className="font-mono font-black text-lime-950 dark:text-white text-lg mt-0.5">
                                                                    {semester.result.final_exam_score} <span className="text-xs text-slate-400">/ {subject.settings?.final_exam_max}</span>
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] text-lime-800 dark:text-lime-300 font-bold">إجمالي الفصل</p>
                                                                <p className="font-mono font-black text-lime-800 dark:text-lime-300 text-lg mt-0.5">
                                                                    {semester.result.semester_total}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredSubjects.length === 0 && (
                                <div className="text-center py-14 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <BookOpen size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                    <p className="text-slate-600 dark:text-slate-300 font-black">
                                        {reportData.length === 0
                                            ? 'لم يتم العثور على مواد أو درجات مسجلة للطالب في هذه السنة الدراسية.'
                                            : 'لا توجد مادة مطابقة لعبارة البحث.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                        body { background-color: white !important; }
                        .print\\:hidden { display: none !important; }
                        .print\\:shadow-none { box-shadow: none !important; }
                        .print\\:border-none { border: none !important; }
                        .print\\:p-0 { padding: 0 !important; }
                    }
                `}} />
            </div>
        </AdminLayout>
    );
}
