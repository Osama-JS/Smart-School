import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, Calendar, ChevronLeft, Users, AlertCircle, Layers } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';

export default function MonthlyGradesIndex({ periods, divisions, assignedSubjects, isAdmin, isTeacher }) {
    const [selectedPeriod, setSelectedPeriod] = useState(periods[0]?.id || '');
    const [selectedGradeId, setSelectedGradeId] = useState('');
    
    // Extract unique grades from the available divisions
    const grades = useMemo(() => {
        const uniqueGrades = {};
        divisions.forEach(div => {
            if (div.grade) {
                uniqueGrades[div.grade.id] = div.grade;
            }
        });
        return Object.values(uniqueGrades);
    }, [divisions]);

    // Filter divisions by selected grade
    const filteredDivisions = useMemo(() => {
        if (!selectedGradeId) return [];
        return divisions.filter(div => div.grade_id === parseInt(selectedGradeId));
    }, [selectedGradeId, divisions]);

    return (
        <AdminLayout activeMenu="سجل الدرجات">
            <Head title="رصد الدرجات الشهرية" />

            <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 dark:bg-primary-500/5 rounded-bl-full -z-10"></div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800/50 shadow-inner">
                                <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
                                سجل درجات الطلاب
                            </h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            حدد فترة الرصد والصف الدراسي لاستعراض الشعب والمواد المتاحة للرصد.
                        </p>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary-500" /> فترة الرصد الحالية:
                            </label>
                            <SelectInput
                                value={selectedPeriod}
                                onChange={(val) => setSelectedPeriod(val)}
                                className="w-full text-base font-bold"
                                placeholder="-- يرجى اختيار فترة الرصد --"
                                options={periods.map(period => ({
                                    value: period.id,
                                    label: `${period.month_name} (${String(period.fill_start_date).split('T')[0]} إلى ${String(period.fill_end_date).split('T')[0]})`
                                }))}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary-500" /> الصف الدراسي:
                            </label>
                            <SelectInput
                                value={selectedGradeId}
                                onChange={(val) => setSelectedGradeId(val)}
                                className="w-full text-base font-bold"
                                isDisabled={!selectedPeriod}
                                placeholder="-- يرجى اختيار الصف الدراسي --"
                                options={grades.map(grade => ({
                                    value: grade.id,
                                    label: grade.name
                                }))}
                            />
                        </div>
                    </div>

                    {!selectedPeriod ? (
                        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4">
                                <Calendar className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">لم يتم تحديد الفترة</h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                يرجى اختيار فترة الرصد للبدء.
                            </p>
                        </div>
                    ) : !selectedGradeId ? (
                        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4">
                                <Layers className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">لم يتم تحديد الصف</h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                يرجى اختيار الصف الدراسي لعرض الشعب والمواد.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredDivisions.map(division => {
                                // For both teacher and admin, assignedSubjects now contains the correct list 
                                // (teacher: only assigned, admin: all subjects for the grade)
                                const subjects = assignedSubjects[division.id] || [];

                                return (
                                    <div key={division.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50 rounded-3xl overflow-hidden hover:shadow-lg transition-all hover:border-primary-200 dark:hover:border-primary-800/50 group flex flex-col">
                                        <div className="bg-white dark:bg-slate-800 p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between transition-colors group-hover:bg-primary-50/50 dark:group-hover:bg-primary-900/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-lg text-slate-800 dark:text-white leading-tight">
                                                        {division.grade?.name}
                                                    </h3>
                                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                                        {division.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
                                                {subjects.length} مواد
                                            </div>
                                        </div>
                                        
                                        <div className="p-5 flex flex-col gap-3 flex-1">
                                            {subjects.length > 0 ? (
                                                subjects.map(assignment => (
                                                    <Link
                                                        key={assignment.id}
                                                        href={route('academic.monthly-grades.entry', {
                                                            division: division.id,
                                                            subject_id: assignment.subject_id,
                                                            period: selectedPeriod
                                                        })}
                                                        className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 hover:border-primary-500 hover:shadow-md transition-all group/link"
                                                    >
                                                        <span className="font-bold text-slate-700 dark:text-slate-200 group-hover/link:text-primary-600 dark:group-hover/link:text-primary-400 transition-colors">
                                                            {assignment.subject?.name}
                                                        </span>
                                                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover/link:bg-primary-100 dark:group-hover/link:bg-primary-900 group-hover/link:text-primary-600 dark:group-hover/link:text-primary-400 transition-colors">
                                                            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover/link:text-primary-600 dark:group-hover/link:text-primary-400" />
                                                        </div>
                                                    </Link>
                                                ))
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                                    <AlertCircle className="w-6 h-6 text-amber-500 mb-2" />
                                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                                        لا يوجد مواد
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        لم يتم إسناد مواد لهذه الشعبة
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {filteredDivisions.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                                    <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">لا توجد شعب</h3>
                                    <p className="text-slate-500 dark:text-slate-400">
                                        لا توجد شعب مسجلة لهذا الصف الدراسي.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
