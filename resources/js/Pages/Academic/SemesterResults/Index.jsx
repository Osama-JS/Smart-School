import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import SelectInput from '@/Components/SelectInput';
import { Save, Lock, Search, AlertCircle, FileText, BookOpen, Calendar, Layers, User, Paperclip, Upload } from 'lucide-react';

export default function SemesterResultsIndex({ academicYears, semesters, semester, divisions, subjects, studentsData, filters, gradeSetting, error }) {
    const { data, setData, post, processing } = useForm({
        semester_id: semester?.id || filters.semester_id || '',
        subject_id: filters.subject_id || '',
        grades: studentsData || []
    });

    useEffect(() => {
        setData('grades', studentsData || []);
    }, [studentsData]);

    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        if (field === 'academic_year_id') {
            newFilters.semester_id = '';
            newFilters.division_id = '';
            newFilters.subject_id = '';
        }
        if (field === 'semester_id') {
            newFilters.division_id = '';
            newFilters.subject_id = '';
        }
        if (field === 'division_id') newFilters.subject_id = '';
        
        router.get(route('academic.semester-results.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleScoreChange = (index, value) => {
        const newGrades = [...data.grades];
        newGrades[index].final_exam_score = value;
        setData('grades', newGrades);
    };

    const handleSave = (e) => {
        e.preventDefault();
        post(route('academic.semester-results.store'), {
            preserveScroll: true
        });
    };

    const handleLock = () => {
        if (!confirm('تأكيد: اعتماد وقفل درجات الفصل النهائي؟ لن تتمكن من التعديل بعد ذلك.')) return;
        router.post(route('academic.semester-results.lock'), {
            semester_id: semester.id,
            subject_id: filters.subject_id
        }, { preserveScroll: true });
    };

    // Derived flags
    const isSubjectSelected = !!filters.subject_id;
    const isLocked = studentsData?.length > 0 && studentsData[0].status === 'locked';

    const maxAggregate = gradeSetting ? gradeSetting.semester_aggregate_max : 20;
    const maxExam = gradeSetting ? gradeSetting.final_exam_max : 30;

    return (
        <AdminLayout activeMenu="نتائج الفصل">
            <Head title="نتائج الفصل الدراسي" />

            <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 dark:bg-primary-500/5 rounded-bl-full -z-10"></div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800/50 shadow-inner">
                                <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">نتائج الفصل الدراسي</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            إدخال اختبارات نهاية الفصل واعتماد النتيجة النهائية ({semester?.full_name || '...'})
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 px-6 py-4 rounded-2xl font-bold flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary-500" /> العام الدراسي:
                            </label>
                            <SelectInput
                                value={filters.academic_year_id || ''}
                                onChange={(val) => handleFilterChange('academic_year_id', val)}
                                className="w-full text-base font-bold"
                                options={academicYears?.map(y => ({ value: y.id, label: y.name })) || []}
                                placeholder="-- يرجى اختيار العام الدراسي --"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary-500" /> الفصل الدراسي:
                            </label>
                            <SelectInput
                                value={filters.semester_id || semester?.id || ''}
                                onChange={(val) => handleFilterChange('semester_id', val)}
                                className="w-full text-base font-bold"
                                options={semesters?.map(s => ({ value: s.id, label: s.name })) || []}
                                placeholder="-- يرجى اختيار الفصل الدراسي --"
                                isDisabled={!filters.academic_year_id && !filters.semester_id && !semester}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Search className="w-4 h-4 text-primary-500" /> الفصل/الشعبة:
                            </label>
                            <SelectInput
                                value={filters.division_id || ''}
                                onChange={(val) => handleFilterChange('division_id', val)}
                                className="w-full text-base font-bold"
                                options={divisions.map(d => ({ value: d.id, label: `${d.grade?.name} - ${d.name}` }))}
                                placeholder="-- يرجى اختيار الشعبة --"
                                isDisabled={!filters.semester_id && !semester}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary-500" /> المادة الدراسية:
                            </label>
                            <SelectInput
                                value={filters.subject_id || ''}
                                onChange={(val) => handleFilterChange('subject_id', val)}
                                className="w-full text-base font-bold"
                                options={subjects.map(s => ({ value: s.id, label: s.name }))}
                                placeholder="-- يرجى اختيار المادة الدراسية --"
                                isDisabled={!filters.division_id}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                {!filters.division_id ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">لم يتم تحديد الشعبة</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            يرجى اختيار الفصل/الشعبة لعرض المواد المتاحة.
                        </p>
                    </div>
                ) : !filters.subject_id ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4">
                            <BookOpen className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">لم يتم تحديد المادة</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            يرجى اختيار المادة الدراسية للبدء في رصد درجات الاختبار النهائي.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                        <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap w-16">م</th>
                                        <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">اسم الطالب</th>
                                        <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">المحصلة ({maxAggregate})</th>
                                        <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">اختبار نهائي ({maxExam})</th>
                                        <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center bg-slate-100 dark:bg-slate-800">الإجمالي ({parseFloat(maxAggregate) + parseFloat(maxExam)})</th>
                                        <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">ملاحظات</th>
                                        <th className="py-4 px-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap text-center">مرفق الاختبار</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {data.grades.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-slate-500 font-bold">لا يوجد طلاب</td>
                                        </tr>
                                    ) : (
                                        data.grades.map((student, idx) => {
                                            const total = (parseFloat(student.monthly_aggregate) || 0) + (parseFloat(student.final_exam_score) || 0);
                                            return (
                                                <tr key={student.enrollment_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="py-4 px-6 font-bold text-slate-500 text-sm">{idx + 1}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                                <User size={16} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                                                    {student.student_name}
                                                                </span>
                                                                <span className="text-xs font-mono text-slate-400">
                                                                    @{student.student_username}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="inline-flex items-center justify-center min-w-[3rem] h-8 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-black border border-indigo-100 dark:border-indigo-800/50">
                                                            {student.monthly_aggregate}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <input
                                                            type="number" min="0" max={maxExam} step="0.5"
                                                            value={student.final_exam_score}
                                                            onChange={(e) => {
                                                                const newGrades = [...data.grades];
                                                                newGrades[idx].final_exam_score = e.target.value;
                                                                setData('grades', newGrades);
                                                            }}
                                                            disabled={isLocked}
                                                            className="w-24 text-center font-black text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all focus:border-primary-500 outline-none hover:border-primary-300"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-6 text-center bg-slate-50/50 dark:bg-slate-900/20">
                                                        <span className="inline-flex items-center justify-center min-w-[3rem] h-8 px-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black border border-slate-300 dark:border-slate-600">
                                                            {total.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <input
                                                            type="text"
                                                            value={student.notes || ''}
                                                            onChange={(e) => {
                                                                const newGrades = [...data.grades];
                                                                newGrades[idx].notes = e.target.value;
                                                                setData('grades', newGrades);
                                                            }}
                                                            placeholder="ملاحظات..."
                                                            disabled={isLocked}
                                                            className="w-32 text-right text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all focus:border-primary-500 outline-none hover:border-primary-300"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {student.attachment_path && (
                                                                <a href={`/storage/${student.attachment_path}`} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 bg-primary-50 dark:bg-primary-900/30 p-2 rounded-lg transition-colors" title="عرض المرفق الحالي">
                                                                    <Paperclip size={16} />
                                                                </a>
                                                            )}
                                                            <label className={`cursor-pointer flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:border-primary-500 hover:text-primary-500 transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`} title="رفع ورقة الإجابة">
                                                                <Upload size={14} />
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    disabled={isLocked}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            const newGrades = [...data.grades];
                                                                            newGrades[idx].attachment = file;
                                                                            setData('grades', newGrades);
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                            {student.attachment && <span className="text-xs text-green-600 font-bold truncate max-w-[60px]" title={student.attachment.name}>تم الرفع</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {data.grades.length > 0 && (
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end gap-4">
                                {!isLocked && (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            disabled={processing}
                                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2"
                                        >
                                            <Save className="w-5 h-5" />
                                            حفظ مسودة الفصل
                                        </button>
                                        <button
                                            onClick={handleLock}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                                        >
                                            <Lock className="w-5 h-5" />
                                            اعتماد وقفل نهائي
                                        </button>
                                    </>
                                )}
                                {isLocked && (
                                    <div className="text-emerald-600 font-black flex items-center gap-2 bg-emerald-50 px-6 py-3 rounded-xl border border-emerald-200">
                                        <Lock className="w-5 h-5" />
                                        النتيجة معتمدة ومقفلة
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
