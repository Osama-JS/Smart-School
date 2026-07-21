import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, Calendar, ChevronLeft, Users } from 'lucide-react';

export default function MonthlyGradesIndex({ periods, divisions, assignedSubjects, isAdmin, isTeacher }) {
    const [selectedPeriod, setSelectedPeriod] = useState(periods[0]?.id || '');

    return (
        <AdminLayout activeMenu="سجل الدرجات">
            <Head title="رصد الدرجات الشهرية" />

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-primary" />
                            سجل درجات الطلاب
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            اختر فترة الرصد ثم اختر الفصل والمادة لبدء إدخال درجات الطلاب
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="max-w-sm mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> فترة الرصد:
                        </label>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                        >
                            <option value="">-- اختر فترة الرصد --</option>
                            {periods.map(period => (
                                <option key={period.id} value={period.id}>
                                    {period.month_name} ({period.fill_start_date} إلى {period.fill_end_date})
                                </option>
                            ))}
                        </select>
                    </div>

                    {!selectedPeriod ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            يرجى اختيار فترة الرصد أولاً لعرض الفصول والمواد
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {divisions.map(division => {
                                // For teachers, show only assigned subjects. For admin, maybe show all (but here we just show what's assigned or we'd need another UI for admin to pick subjects).
                                // Usually Admin can just browse through divisions and all subjects. Let's handle isTeacher mainly.
                                const subjects = isTeacher ? (assignedSubjects[division.id] || []) : [];

                                // If admin, we should realistically show a list of all subjects for this division. 
                                // Since we only passed 'divisions', let's just make it simple for the Teacher first as per requirements.
                                if (isTeacher && subjects.length === 0) return null;

                                return (
                                    <div key={division.id} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="bg-primary/10 p-4 border-b border-primary/20 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5 text-primary" />
                                                <h3 className="font-bold text-gray-900 dark:text-white">
                                                    {division.grade?.name} - {division.name}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="p-4 flex flex-col gap-2">
                                            {isTeacher ? (
                                                subjects.map(assignment => (
                                                    <Link
                                                        key={assignment.id}
                                                        href={route('academic.monthly-grades.entry', {
                                                            division: division.id,
                                                            subject_id: assignment.subject_id,
                                                            period: selectedPeriod
                                                        })}
                                                        className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary transition-colors group"
                                                    >
                                                        <span className="font-medium">{assignment.subject?.name}</span>
                                                        <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                                    </Link>
                                                ))
                                            ) : (
                                                <div className="text-sm text-gray-500">
                                                    (صلاحية المدير: يمكنك اختيار مادة بعد الدخول للفصل - غير مدعوم حاليا بالواجهة)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {divisions.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                                    لا توجد فصول مرتبطة بك حالياً أو لا تملك صلاحية الوصول.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
