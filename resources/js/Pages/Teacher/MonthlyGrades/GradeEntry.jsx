import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { BookOpen, Save, ArrowRight, User, AlertCircle, Calculator, Lock } from 'lucide-react';

export default function GradeEntry({ division, subject, period, gradeSetting, enrollments, existingGrades }) {
    // 1. Settings
    const isMonthly = period.period_type === 'monthly' || !period.period_type;
    const weeksCount = gradeSetting.weeks_per_month || 4;
    const oralMax = gradeSetting.weekly_oral_max || 5;
    const hwMax = gradeSetting.weekly_homework_max || 5;
    const behaviorMax = gradeSetting.monthly_behavior_max || 10;
    const examMax = gradeSetting.monthly_exam_max || 50;

    const weeksData = isMonthly ? (period.weeks_dates || Array.from({ length: weeksCount }, (_, i) => ({
        name: `الأسبوع ${i + 1}`,
        start_date: null,
        end_date: null
    }))) : [];
    
    const weeks = weeksData.map((_, i) => `week_${i + 1}`);
    
    // 2. State for Tabs
    const [activeTab, setActiveTab] = useState(isMonthly ? weeks[0] : 'summary');

    // 3. Local State for Grades
    // Structure: { [enrollmentId]: { weekly: { week_1: { oral, homework } }, summary: { behavior, monthly_exam }, is_submitted } }
    const [localGrades, setLocalGrades] = useState(() => {
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

    const isPeriodClosed = (() => {
        const now = new Date().toISOString().split('T')[0];
        const startDate = String(period.fill_start_date).split('T')[0];
        const endDate = String(period.fill_end_date).split('T')[0];
        return now < startDate || now > endDate;
    })();

    const activeWeekIndex = weeks.indexOf(activeTab);
    const activeWeekData = activeWeekIndex !== -1 ? weeksData[activeWeekIndex] : null;
    const isWeekNotStarted = (() => {
        if (!activeWeekData || !activeWeekData.start_date) return false;
        const now = new Date().toISOString().split('T')[0];
        return now < activeWeekData.start_date;
    })();

    // 4. Handlers
    const handleWeeklyChange = (enrollmentId, week, field, value) => {
        setLocalGrades(prev => ({
            ...prev,
            [enrollmentId]: {
                ...prev[enrollmentId],
                weekly: {
                    ...prev[enrollmentId].weekly,
                    [week]: {
                        ...prev[enrollmentId].weekly[week],
                        [field]: field === 'note' ? value : (value === '' ? '' : parseFloat(value))
                    }
                }
            }
        }));
    };

    const handleSummaryChange = (enrollmentId, field, value) => {
        setLocalGrades(prev => ({
            ...prev,
            [enrollmentId]: {
                ...prev[enrollmentId],
                summary: {
                    ...prev[enrollmentId].summary,
                    [field]: field === 'note' ? value : (value === '' ? '' : parseFloat(value))
                }
            }
        }));
    };

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

    const saveWeekly = (e) => {
        e.preventDefault();
        const payload = enrollments.map(e => ({
            enrollment_id: e.id,
            oral: localGrades[e.id].weekly[activeTab].oral,
            homework: localGrades[e.id].weekly[activeTab].homework,
            note: localGrades[e.id].weekly[activeTab].note,
        }));

        router.post(route('academic.monthly-grades.save-weekly', { division: division.id, subject_id: subject.id, period: period.id }), {
            week_key: activeTab,
            grades: payload
        });
    };

    const submitMonth = (e) => {
        e.preventDefault();
        if (!confirm('تأكيد: رفع درجات الشهر نهائياً؟ بعد الرفع لن تتمكن من تعديل الدرجات.')) return;

        const payload = enrollments.map(e => ({
            enrollment_id: e.id,
            behavior: localGrades[e.id].summary.behavior,
            monthly_exam: localGrades[e.id].summary.monthly_exam,
            note: localGrades[e.id].summary.note,
        }));

        router.post(route('academic.monthly-grades.submit-month', { division: division.id, subject_id: subject.id, period: period.id }), {
            grades: payload
        });
    };

    return (
        <AdminLayout activeMenu="سجل الدرجات">
            <Head title="رصد الدرجات" />

            <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8">
                {/* Header Card */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 dark:bg-primary-500/5 rounded-bl-full -z-10"></div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
                            <Link href={route('academic.monthly-grades.index')} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1">
                                سجل الدرجات <ArrowRight className="w-4 h-4" />
                            </Link>
                            <span className="text-slate-400 dark:text-slate-500">رصد التقييمات</span>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800/50 shadow-inner">
                                <Calculator className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
                                {subject.name} - {division.grade?.name} ({division.name})
                            </h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                {period.month_name}
                            </span>
                            الفترة من {String(period.fill_start_date).split('T')[0]} إلى {String(period.fill_end_date).split('T')[0]}
                        </p>
                    </div>
                </div>

                {/* Alerts */}
                {isPeriodClosed && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-400 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        تنبيه: فترة الرصد مغلقة حالياً.
                    </div>
                )}
                {!isPeriodClosed && isWeekNotStarted && activeTab !== 'summary' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-400 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        تنبيه: لا يمكن إدخال درجات هذا الأسبوع لأنه لم يبدأ بعد. تاريخ البداية: {activeWeekData?.start_date}
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
                    {weeks.map((w, index) => {
                        const weekObj = weeksData[index];
                        const dateRange = (weekObj.start_date && weekObj.end_date) 
                            ? ` (${weekObj.start_date.split('-').slice(1).join('/')} - ${weekObj.end_date.split('-').slice(1).join('/')})` 
                            : '';
                            
                        return (
                            <button
                                key={w}
                                onClick={() => setActiveTab(w)}
                                className={`whitespace-nowrap px-6 py-3 rounded-2xl font-bold transition-all text-sm flex items-center gap-2
                                    ${activeTab === w 
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                    }`}
                            >
                                {weekObj.name} <span className="text-xs opacity-80" dir="ltr">{dateRange}</span>
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`whitespace-nowrap px-6 py-3 rounded-2xl font-bold transition-all text-sm flex items-center gap-2
                            ${activeTab === 'summary'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        {isMonthly ? 'ملخص الشهر' : 'رصد الدرجات النهائية'}
                    </button>
                </div>

                {/* Gradebook Table */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                    <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap w-16">م</th>
                                    <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">اسم الطالب</th>
                                    <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">حالة الرفع</th>
                                    
                                    {activeTab !== 'summary' ? (
                                        <>
                                            <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">
                                                شفهي <span className="text-xs text-primary-600">({oralMax})</span>
                                            </th>
                                            <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">
                                                واجبات <span className="text-xs text-primary-600">({hwMax})</span>
                                            </th>
                                            <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center bg-slate-50/50 dark:bg-slate-800/50">
                                                إجمالي الأسبوع <span className="text-xs text-primary-600">({oralMax + hwMax})</span>
                                            </th>
                                            <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">
                                                ملاحظة الأسبوع
                                            </th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">
                                                مجموع الشفهي <span className="text-xs text-primary-600">({oralMax * weeksCount})</span>
                                            </th>
                                            <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">
                                                مجموع الواجبات <span className="text-xs text-primary-600">({hwMax * weeksCount})</span>
                                            </th>
                                            <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">
                                                السلوك <span className="text-xs text-primary-600">({behaviorMax})</span>
                                            </th>
                                            <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">
                                                الاختبار الشهري <span className="text-xs text-primary-600">({examMax})</span>
                                            </th>
                                            <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center bg-slate-100/50 dark:bg-slate-800/50">
                                                {isMonthly ? 'إجمالي الشهر' : 'الإجمالي النهائي'}
                                            </th>
                                            <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">
                                                ملاحظات الإدارة/المعلم
                                            </th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {enrollments.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="py-12 px-6 text-center text-slate-500 font-bold">
                                            لا يوجد طلاب مسجلين في هذا الفصل.
                                        </td>
                                    </tr>
                                ) : (
                                    enrollments.map((enrollment, index) => {
                                        const data = localGrades[enrollment.id];
                                        const isLocked = isPeriodClosed || data.is_submitted || (activeTab !== 'summary' && isWeekNotStarted);
                                        const totals = calculateStudentTotals(data);

                                        return (
                                            <tr key={enrollment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-3 px-6 font-bold text-slate-500 text-sm">{index + 1}</td>
                                                <td className="py-3 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                            <User size={16} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                                                {enrollment.student?.user?.name}
                                                            </span>
                                                            <span className="text-xs font-mono text-slate-400">
                                                                @{enrollment.student?.user?.username}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    {data.is_submitted ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                                            <Lock size={12} />
                                                            مرفوع
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                            مسودة
                                                        </span>
                                                    )}
                                                </td>
                                                
                                                {activeTab !== 'summary' ? (
                                                    <>
                                                        <td className="py-3 px-6 text-center">
                                                            <input
                                                                type="number" min="0" max={oralMax} step="0.5"
                                                                value={data.weekly[activeTab].oral ?? ''}
                                                                onChange={(e) => handleWeeklyChange(enrollment.id, activeTab, 'oral', e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-20 text-center font-black text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-6 text-center">
                                                            <input
                                                                type="number" min="0" max={hwMax} step="0.5"
                                                                value={data.weekly[activeTab].homework ?? ''}
                                                                onChange={(e) => handleWeeklyChange(enrollment.id, activeTab, 'homework', e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-20 text-center font-black text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-6 text-center bg-slate-50/50 dark:bg-slate-900/20">
                                                            <span className="inline-flex min-w-[3rem] px-2 py-1 rounded-lg font-black text-sm text-slate-600 dark:text-slate-400">
                                                                {((parseFloat(data.weekly[activeTab].oral) || 0) + (parseFloat(data.weekly[activeTab].homework) || 0))}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-6 text-center">
                                                            <input
                                                                type="text"
                                                                placeholder="ملاحظة..."
                                                                value={data.weekly[activeTab].note ?? ''}
                                                                onChange={(e) => handleWeeklyChange(enrollment.id, activeTab, 'note', e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-32 text-right text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500 placeholder:text-slate-300"
                                                            />
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="py-3 px-6 text-center font-bold text-slate-700">{totals.oralTotal}</td>
                                                        <td className="py-3 px-6 text-center font-bold text-slate-700">{totals.hwTotal}</td>
                                                        <td className="py-3 px-6 text-center">
                                                            <input
                                                                type="number" min="0" max={behaviorMax} step="0.5"
                                                                value={data.summary.behavior ?? ''}
                                                                onChange={(e) => handleSummaryChange(enrollment.id, 'behavior', e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-20 text-center font-black text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-6 text-center">
                                                            <input
                                                                type="number" min="0" max={examMax} step="0.5"
                                                                value={data.summary.monthly_exam ?? ''}
                                                                onChange={(e) => handleSummaryChange(enrollment.id, 'monthly_exam', e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-20 text-center font-black text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-6 text-center bg-slate-50/50 dark:bg-slate-900/20">
                                                            <span className="inline-flex min-w-[3rem] px-2 py-1 rounded-lg font-black text-sm bg-slate-200 dark:bg-slate-700">
                                                                {totals.grandTotal}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-6 text-center">
                                                            <input
                                                                type="text"
                                                                placeholder="أضف ملاحظة..."
                                                                value={data.summary.note ?? ''}
                                                                onChange={(e) => handleSummaryChange(enrollment.id, 'note', e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-32 text-right text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500 placeholder:text-slate-300"
                                                            />
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Form Actions Footer */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
                        {activeTab !== 'summary' ? (
                            <button
                                onClick={saveWeekly}
                                disabled={isPeriodClosed}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                حفظ مسودة {weeks.indexOf(activeTab) + 1}
                            </button>
                        ) : (
                            <button
                                onClick={submitMonth}
                                disabled={isPeriodClosed}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <Lock className="w-5 h-5" />
                                رفع الشهر نهائياً (لا رجعة)
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
