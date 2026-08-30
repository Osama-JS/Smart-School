import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    FileText,
    Search,
    Printer,
    Download,
    Filter,
    Award,
    AlertCircle
} from 'lucide-react';

export default function ClassReport({
    academicYears,
    semesters,
    divisions,
    subjects,
    studentsData,
    divisionInfo,
    semesterInfo,
    filters
}) {
    const [selectedYear, setSelectedYear] = useState(filters.academic_year_id || '');
    const [selectedSemester, setSelectedSemester] = useState(filters.semester_id || '');
    const [selectedDivision, setSelectedDivision] = useState(filters.division_id || '');
    
    useEffect(() => {
        if (filters.academic_year_id && !selectedYear) setSelectedYear(filters.academic_year_id);
        if (filters.semester_id && !selectedSemester) setSelectedSemester(filters.semester_id);
    }, [filters]);

    const handleFilter = () => {
        router.get(route('academic.semester-results.report'), {
            academic_year_id: selectedYear,
            semester_id: selectedSemester,
            division_id: selectedDivision,
        }, { preserveState: true });
    };

    const handlePrint = () => {
        window.print();
    };

    const getGradeEstimation = (percentage) => {
        if (percentage >= 90) return { text: 'ممتاز', color: 'text-green-600' };
        if (percentage >= 80) return { text: 'جيد جداً', color: 'text-blue-600' };
        if (percentage >= 70) return { text: 'جيد', color: 'text-yellow-600' };
        if (percentage >= 60) return { text: 'مقبول', color: 'text-orange-600' };
        return { text: 'ضعيف', color: 'text-red-600 font-bold' };
    };

    return (
        <AdminLayout>
            <Head title="كشف درجات ونتائج الطلاب" />

            {/* Print Styles */}
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: landscape;
                        margin: 1cm;
                    }
                }
                `}
            </style>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                
                {/* Header & Actions */}
                <div className="flex justify-between items-center mb-6 no-print">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-500/10 p-3 rounded-xl">
                            <Award className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">كشف درجات ونتائج الطلاب</h2>
                            <p className="text-slate-500 text-sm mt-1">كشف مجمع لدرجات الطلاب في جميع المواد نهاية الفصل الدراسي</p>
                        </div>
                    </div>
                    
                    {studentsData.length > 0 && (
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                <span>طباعة الكشف</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-5 mb-6 shadow-sm no-print">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">العام الدراسي</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(e.target.value);
                                    // Reset semester when year changes (in real app, we should filter semesters)
                                    setSelectedSemester('');
                                }}
                                className="w-full border-slate-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 bg-slate-50/50"
                            >
                                <option value="">اختر العام الدراسي...</option>
                                {academicYears.map(year => (
                                    <option key={year.id} value={year.id}>{year.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">الفصل الدراسي</label>
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="w-full border-slate-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 bg-slate-50/50"
                                disabled={!selectedYear}
                            >
                                <option value="">اختر الفصل الدراسي...</option>
                                {semesters.map(term => (
                                    <option key={term.id} value={term.id}>{term.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">الصف / الشعبة</label>
                            <select
                                value={selectedDivision}
                                onChange={(e) => setSelectedDivision(e.target.value)}
                                className="w-full border-slate-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 bg-slate-50/50"
                            >
                                <option value="">اختر الشعبة...</option>
                                {divisions.map(div => (
                                    <option key={div.id} value={div.id}>
                                        {div.grade?.name} - {div.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                disabled={!selectedSemester || !selectedDivision}
                                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Search className="w-5 h-5" />
                                <span>عرض الكشف</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Print Area */}
                {studentsData.length > 0 ? (
                    <div className="print-area bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        
                        {/* Print Header (Hidden on screen) */}
                        <div className="hidden print:block p-8 border-b-2 border-slate-800 mb-4">
                            <div className="flex justify-between items-center">
                                <div className="text-right">
                                    <h1 className="text-2xl font-bold text-slate-900 mb-1">المملكة العربية السعودية</h1>
                                    <h2 className="text-xl text-slate-800">وزارة التعليم</h2>
                                    <h3 className="text-lg text-slate-700">إدارة التعليم بمنطقة ...........</h3>
                                </div>
                                <div className="text-center">
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">كشف درجات ونتائج الطلاب</h1>
                                    <h2 className="text-xl font-bold text-slate-800">{semesterInfo?.name}</h2>
                                    <h3 className="text-lg font-semibold text-slate-700">
                                        الفصل: {divisionInfo?.grade?.name} - شعبة {divisionInfo?.name}
                                    </h3>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg text-slate-700">العام الدراسي: {academicYears.find(y => y.id == selectedYear)?.name}</h3>
                                    <h3 className="text-lg text-slate-700">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 table-fixed">
                                <thead>
                                    <tr className="bg-slate-50 print:bg-slate-100">
                                        <th scope="col" className="w-12 px-3 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">م</th>
                                        <th scope="col" className="w-64 px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">اسم الطالب</th>
                                        {/* Subjects Columns */}
                                        {subjects.map(subject => (
                                            <th key={subject.id} scope="col" className="px-2 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">
                                                <div className="writing-mode-vertical-rl transform rotate-180 h-32 m-auto font-bold text-sm">
                                                    {subject.name}
                                                </div>
                                            </th>
                                        ))}
                                        <th scope="col" className="w-24 px-3 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200 bg-slate-100">المجموع</th>
                                        <th scope="col" className="w-24 px-3 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200 bg-slate-100">النسبة</th>
                                        <th scope="col" className="w-24 px-3 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100">التقدير</th>
                                    </tr>
                                    <tr className="bg-slate-100 print:bg-slate-200">
                                        <th colSpan="2" className="px-4 py-2 text-left text-xs font-bold text-slate-600 border-l border-slate-200 border-t border-slate-300">النهاية العظمى</th>
                                        {subjects.map(subject => (
                                            <th key={subject.id} className="px-2 py-2 text-center text-xs font-bold text-slate-700 border-l border-slate-200 border-t border-slate-300">
                                                { (subject.semester_aggregate_max || 0) + (subject.final_exam_max || 0) || 100 }
                                            </th>
                                        ))}
                                        <th className="px-3 py-2 text-center text-xs font-bold text-slate-700 border-l border-slate-200 border-t border-slate-300">
                                            {studentsData[0]?.max_total || 0}
                                        </th>
                                        <th className="px-3 py-2 text-center text-xs font-bold text-slate-700 border-l border-slate-200 border-t border-slate-300">100%</th>
                                        <th className="px-3 py-2 border-t border-slate-300"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {studentsData.map((student, idx) => {
                                        const estimation = getGradeEstimation(student.percentage);
                                        const isFailing = student.percentage < 50;
                                        
                                        return (
                                            <tr key={student.enrollment_id} className={`hover:bg-slate-50 transition-colors ${isFailing ? 'bg-red-50/30' : ''}`}>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-500 text-center border-l border-slate-200 font-medium">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900 border-l border-slate-200">
                                                    {student.student_name}
                                                    <div className="text-xs text-slate-500 font-normal no-print">{student.student_id_number}</div>
                                                </td>
                                                
                                                {/* Subject Scores */}
                                                {subjects.map(subject => {
                                                    const score = student.scores[subject.id] || 0;
                                                    const subjectMax = (subject.semester_aggregate_max || 0) + (subject.final_exam_max || 0) || 100;
                                                    const isSubjectFailing = score < (subjectMax / 2);
                                                    
                                                    return (
                                                        <td key={subject.id} className={`px-2 py-3 whitespace-nowrap text-sm text-center border-l border-slate-200 font-semibold ${isSubjectFailing ? 'text-red-600' : 'text-slate-700'}`}>
                                                            {score > 0 ? score : '-'}
                                                        </td>
                                                    );
                                                })}
                                                
                                                <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-slate-800 text-center border-l border-slate-200 bg-slate-50/50">
                                                    {student.total_score}
                                                </td>
                                                <td className={`px-3 py-3 whitespace-nowrap text-sm font-bold text-center border-l border-slate-200 bg-slate-50/50 ${isFailing ? 'text-red-600' : 'text-slate-800'}`}>
                                                    {student.percentage}%
                                                </td>
                                                <td className={`px-3 py-3 whitespace-nowrap text-sm font-bold text-center bg-slate-50/50 ${estimation.color}`}>
                                                    {estimation.text}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Print Footer / Signatures */}
                        <div className="hidden print:flex justify-between items-end p-8 mt-12">
                            <div className="text-center w-48">
                                <h4 className="font-bold text-slate-800 mb-8">معلم / مربي الصف</h4>
                                <div className="border-b border-slate-400 w-full mb-2"></div>
                                <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                            </div>
                            
                            <div className="text-center w-48">
                                <h4 className="font-bold text-slate-800 mb-8">وكيل الشؤون التعليمية</h4>
                                <div className="border-b border-slate-400 w-full mb-2"></div>
                                <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                            </div>
                            
                            <div className="text-center w-48">
                                <h4 className="font-bold text-slate-800 mb-8">مدير المدرسة / الختم</h4>
                                <div className="border-b border-slate-400 w-full mb-2"></div>
                                <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                            </div>
                        </div>

                    </div>
                ) : (
                    filters.division_id && filters.semester_id && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center no-print">
                            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-1">لا توجد بيانات متاحة</h3>
                            <p className="text-slate-500">لم يتم العثور على درجات لطلاب هذه الشعبة في الفصل المحدد.</p>
                        </div>
                    )
                )}
            </div>
        </AdminLayout>
    );
}
