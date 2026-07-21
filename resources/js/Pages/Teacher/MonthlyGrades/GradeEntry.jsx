import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { BookOpen, Save, ArrowRight, User } from 'lucide-react';

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

    return (
        <AdminLayout activeMenu="سجل الدرجات">
            <Head title="رصد الدرجات" />

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Link href={route('academic.monthly-grades.index')} className="hover:text-primary transition-colors flex items-center gap-1">
                                سجل الدرجات <ArrowRight className="w-4 h-4" />
                            </Link>
                            <span>رصد الدرجات</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-primary" />
                            {subject.name} - {division.grade?.name} ({division.name})
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            الفترة: {period.month_name} ({period.fill_start_date} إلى {period.fill_end_date})
                        </p>
                    </div>
                    {!isClosed && (
                        <button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {processing ? 'جاري الحفظ...' : 'حفظ الدرجات'}
                        </button>
                    )}
                </div>

                {isClosed && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                        تنبيه: فترة الرصد مغلقة حالياً. يمكنك استعراض الدرجات فقط.
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">الطالب</th>
                                    {criteria.map((criterion, idx) => (
                                        <th key={idx} className="px-6 py-4 text-center">
                                            {criterion.name}
                                            <div className="text-xs text-gray-400 mt-1 font-normal">من {criterion.max_score}</div>
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-center text-primary">المجموع</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {enrollments.map((enrollment) => {
                                    const scores = localGrades[enrollment.id]?.scores || {};
                                    const total = calculateTotal(scores);

                                    return (
                                        <tr key={enrollment.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/25 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                {enrollment.student?.user?.name || enrollment.student?.name}
                                            </td>
                                            {criteria.map((criterion, idx) => {
                                                const val = scores[criterion.name];
                                                const maxScore = parseFloat(criterion.max_score);
                                                const isInvalid = val !== '' && (val < 0 || val > maxScore);

                                                return (
                                                    <td key={idx} className="px-6 py-4 text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={maxScore}
                                                            step="0.5"
                                                            value={val}
                                                            onChange={(e) => handleScoreChange(enrollment.id, criterion.name, e.target.value)}
                                                            disabled={isClosed}
                                                            className={`w-20 text-center rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm ${
                                                                isInvalid 
                                                                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100' 
                                                                    : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                                                            } ${isClosed ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed border-transparent shadow-none' : ''}`}
                                                        />
                                                    </td>
                                                );
                                            })}
                                            <td className="px-6 py-4 text-center font-bold text-primary text-lg">
                                                {total}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {enrollments.length === 0 && (
                                    <tr>
                                        <td colSpan={criteria.length + 2} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            لا يوجد طلاب مسجلين في هذا الفصل.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
