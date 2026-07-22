import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { BookOpen, Save, ArrowRight, User, AlertCircle, Calculator } from 'lucide-react';

export default function GradeEntry({ division, subject, period, gradeSetting, enrollments, existingGrades }) {
    const criteria = gradeSetting.criteria_weights || [];
    
    // Initialize form data
    const [localGrades, setLocalGrades] = useState(() => {
        const init = {};
        enrollments.forEach(enrollment => {
            const existing = existingGrades[enrollment.id]?.scores || {};
            const scores = {};
            criteria.forEach(criterion => {
                scores[criterion.name] = existing[criterion.name] !== undefined ? existing[criterion.name] : '';
            });
            init[enrollment.id] = { enrollment_id: enrollment.id, scores };
        });
        return init;
    });

    const { data, setData, post, processing } = useForm({
        grades: []
    });

    useEffect(() => {
        setData('grades', Object.values(localGrades));
    }, [localGrades]);

    const handleScoreChange = (enrollmentId, criterionName, value) => {
        setLocalGrades(prev => ({
            ...prev,
            [enrollmentId]: {
                ...prev[enrollmentId],
                scores: {
                    ...prev[enrollmentId].scores,
                    [criterionName]: value === '' ? '' : parseFloat(value)
                }
            }
        }));
    };

    const calculateTotal = (scores) => {
        let total = 0;
        criteria.forEach(criterion => {
            const val = parseFloat(scores[criterion.name]);
            if (!isNaN(val)) total += val;
        });
        return total;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('academic.monthly-grades.store', { division: division.id, subject_id: subject.id, period: period.id }));
    };

    const isClosed = (() => {
        const now = new Date().toISOString().split('T')[0];
        return now < period.fill_start_date || now > period.fill_end_date;
    })();

    // Calculate maximum possible score
    const maxTotalScore = criteria.reduce((sum, c) => sum + (parseFloat(c.max_score) || 0), 0);

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
                            الفترة من {period.fill_start_date} إلى {period.fill_end_date}
                        </p>
                    </div>

                    {!isClosed && (
                        <button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all font-black shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 disabled:opacity-50 w-full md:w-auto"
                        >
                            <Save className="w-5 h-5" />
                            {processing ? 'جاري الحفظ...' : 'حفظ الدرجات المدخلة'}
                        </button>
                    )}
                </div>

                {/* Alerts */}
                {isClosed && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-400 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        تنبيه: فترة الرصد مغلقة حالياً. يمكنك فقط استعراض الدرجات التي تم رصدها مسبقاً.
                    </div>
                )}
                
                {criteria.length === 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-400 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        تنبيه: لم يتم ضبط إعدادات توزيع الدرجات لهذه المادة. يرجى التواصل مع الإدارة لضبط الأعمدة قبل الرصد.
                    </div>
                )}

                {/* Gradebook Table */}
                {criteria.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                        <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap w-16">م</th>
                                        <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">اسم الطالب</th>
                                        {criteria.map((c, i) => (
                                            <th key={i} className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">
                                                {c.name}
                                                <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">({c.max_score} درجة)</div>
                                            </th>
                                        ))}
                                        <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center bg-slate-100/50 dark:bg-slate-800/50">
                                            المجموع
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">({maxTotalScore})</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {enrollments.length === 0 ? (
                                        <tr>
                                            <td colSpan={criteria.length + 3} className="py-12 px-6 text-center text-slate-500 font-bold">
                                                لا يوجد طلاب مسجلين في هذا الفصل.
                                            </td>
                                        </tr>
                                    ) : (
                                        enrollments.map((enrollment, index) => {
                                            const scores = localGrades[enrollment.id]?.scores || {};
                                            const total = calculateTotal(scores);

                                            return (
                                                <tr key={enrollment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="py-3 px-6 font-bold text-slate-500 text-sm">{index + 1}</td>
                                                    <td className="py-3 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                                <User size={16} />
                                                            </div>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                                                {enrollment.student?.user?.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {criteria.map((c, i) => (
                                                        <td key={i} className="py-3 px-6 text-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={c.max_score}
                                                                step="0.5"
                                                                value={scores[c.name] ?? ''}
                                                                onChange={(e) => handleScoreChange(enrollment.id, c.name, e.target.value)}
                                                                disabled={isClosed}
                                                                className="w-20 text-center font-black text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 shadow-sm transition-all"
                                                                placeholder="-"
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="py-3 px-6 text-center bg-slate-50/50 dark:bg-slate-900/20">
                                                        <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-black text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                            {total}
                                                        </span>
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
