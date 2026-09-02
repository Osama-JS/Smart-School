import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ReportPrintLayout from "@/Components/Reports/ReportPrintLayout";
import {
    Search,
    Award,
    AlertCircle,
    Filter
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

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(route('academic.semester-results.report'), {
            academic_year_id: selectedYear,
            semester_id: selectedSemester,
            division_id: selectedDivision,
        }, { preserveState: true });
    };

    const getGradeEstimation = (percentage) => {
        if (percentage >= 90) return { text: 'ممتاز', color: 'text-green-600 print:text-black' };
        if (percentage >= 80) return { text: 'جيد جداً', color: 'text-blue-600 print:text-black' };
        if (percentage >= 70) return { text: 'جيد', color: 'text-yellow-600 print:text-black' };
        if (percentage >= 60) return { text: 'مقبول', color: 'text-orange-600 print:text-black' };
        return { text: 'ضعيف', color: 'text-red-600 font-bold print:text-black' };
    };

    const [printSettings, setPrintSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('ClassReportPrintSettings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            title: 'كشف درجات ونتائج الطلاب',
            orientation: 'landscape',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            showKPIs: true,
            showDetails: true,
            ecoMode: false,
            brandColor: '#2563eb' // blue-600
        };
    });

    useEffect(() => {
        localStorage.setItem('ClassReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const handlePrint = () => window.print();

    // Prepare subtitle
    let subtitle = '';
    if (semesterInfo && divisionInfo) {
        subtitle = `${semesterInfo.name} - ${divisionInfo.grade?.name} (شعبة ${divisionInfo.name})`;
    }

    return (
        <AdminLayout activeMenu="كشف العلامات المجمع">
            <Head title="كشف درجات ونتائج الطلاب" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow border border-slate-100 dark:border-slate-700">
                                    <Award size={28} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">كشف درجات ونتائج الطلاب</h1>
                                    <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">كشف مجمع لدرجات الطلاب في جميع المواد نهاية الفصل الدراسي</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative z-20">
                        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-bold">
                            <Filter className="w-4 h-4" />
                            <span>خيارات عرض الكشف</span>
                        </div>
                        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">العام الدراسي</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => {
                                        setSelectedYear(e.target.value);
                                        setSelectedSemester('');
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                >
                                    <option value="">اختر العام الدراسي...</option>
                                    {academicYears.map(year => (
                                        <option key={year.id} value={year.id}>{year.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الفصل الدراسي</label>
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                    disabled={!selectedYear}
                                >
                                    <option value="">اختر الفصل الدراسي...</option>
                                    {semesters.map(term => (
                                        <option key={term.id} value={term.id}>{term.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الصف / الشعبة</label>
                                <select
                                    value={selectedDivision}
                                    onChange={(e) => setSelectedDivision(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
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
                                    type="submit"
                                    disabled={!selectedSemester || !selectedDivision}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2.5 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Search className="w-5 h-5" />
                                    <span>عرض الكشف</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <ReportPrintLayout 
                        title={printSettings.title} 
                        printSettings={printSettings} 
                        setPrintSettings={setPrintSettings} 
                        onPrint={handlePrint}
                        subtitle={subtitle || 'كشف علامات ونهاية فصل'}
                    >
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm relative z-10 print:border-none print:shadow-none print:rounded-none">
                            {studentsData.length > 0 ? (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="min-w-full divide-y divide-slate-200 table-fixed print:border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-black border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-black/30 print:text-slate-800">
                                            <tr>
                                                <th scope="col" className="w-12 px-3 py-4 text-center border-l border-slate-200 dark:border-slate-700 print:border-black/30 print:rounded-none">م</th>
                                                <th scope="col" className="w-64 px-4 py-4 text-right border-l border-slate-200 dark:border-slate-700 print:border-black/30">اسم الطالب</th>
                                                {/* Subjects Columns */}
                                                {subjects.map(subject => (
                                                    <th key={subject.id} scope="col" className="px-2 py-4 text-center border-l border-slate-200 dark:border-slate-700 print:border-black/30">
                                                        <div className="writing-mode-vertical-rl transform rotate-180 h-32 m-auto font-bold text-sm">
                                                            {subject.name}
                                                        </div>
                                                    </th>
                                                ))}
                                                <th scope="col" className="w-24 px-3 py-4 text-center border-l border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 print:bg-transparent print:border-black/30">المجموع</th>
                                                <th scope="col" className="w-24 px-3 py-4 text-center border-l border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 print:bg-transparent print:border-black/30">النسبة</th>
                                                <th scope="col" className="w-24 px-3 py-4 text-center bg-slate-100 dark:bg-slate-800 print:bg-transparent print:border-black/30">التقدير</th>
                                            </tr>
                                            <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200">
                                                <th colSpan="2" className="px-4 py-2 text-left text-xs font-bold text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 border-t border-slate-300 dark:border-slate-600 print:border-black/30 print:text-slate-800">النهاية العظمى</th>
                                                {subjects.map(subject => (
                                                    <th key={subject.id} className="px-2 py-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 border-t border-slate-300 dark:border-slate-600 print:border-black/30 print:text-black">
                                                        { (subject.semester_aggregate_max || 0) + (subject.final_exam_max || 0) || 100 }
                                                    </th>
                                                ))}
                                                <th className="px-3 py-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 border-t border-slate-300 dark:border-slate-600 print:border-black/30 print:text-black">
                                                    {studentsData[0]?.max_total || 0}
                                                </th>
                                                <th className="px-3 py-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 border-t border-slate-300 dark:border-slate-600 print:border-black/30 print:text-black">100%</th>
                                                <th className="px-3 py-2 border-t border-slate-300 dark:border-slate-600 print:border-black/30"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {studentsData.map((student, idx) => {
                                                const estimation = getGradeEstimation(student.percentage);
                                                const isFailing = student.percentage < 50;
                                                
                                                return (
                                                    <tr key={student.enrollment_id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${isFailing ? 'bg-red-50/30 dark:bg-red-900/10' : ''} print:hover:bg-transparent ${isFailing ? 'print:bg-red-50' : ''}`}>
                                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-500 text-center border-l border-slate-200 dark:border-slate-800 font-medium print:border-black/30 print:text-black">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                            {student.student_name}
                                                            <div className="text-xs text-slate-500 font-normal print:hidden">{student.student_id_number}</div>
                                                        </td>
                                                        
                                                        {/* Subject Scores */}
                                                        {subjects.map(subject => {
                                                            const score = student.scores[subject.id] || 0;
                                                            const subjectMax = (subject.semester_aggregate_max || 0) + (subject.final_exam_max || 0) || 100;
                                                            const isSubjectFailing = score < (subjectMax / 2);
                                                            
                                                            return (
                                                                <td key={subject.id} className={`px-2 py-3 whitespace-nowrap text-sm text-center border-l border-slate-200 dark:border-slate-800 font-semibold ${isSubjectFailing ? 'text-red-600 dark:text-red-400 print:text-red-700 print:font-black' : 'text-slate-700 dark:text-slate-300 print:text-black'} print:border-black/30`}>
                                                                    {score > 0 ? score : '-'}
                                                                </td>
                                                            );
                                                        })}
                                                        
                                                        <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-white text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 print:bg-transparent print:border-black/30 print:text-black">
                                                            {student.total_score}
                                                        </td>
                                                        <td className={`px-3 py-3 whitespace-nowrap text-sm font-bold text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 ${isFailing ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'} print:bg-transparent print:border-black/30 ${isFailing ? 'print:text-red-700 print:font-black' : 'print:text-black'}`}>
                                                            {student.percentage}%
                                                        </td>
                                                        <td className={`px-3 py-3 whitespace-nowrap text-sm font-bold text-center bg-slate-50/50 dark:bg-slate-800/50 print:bg-transparent print:border-black/30 print:border-r ${estimation.color}`}>
                                                            {estimation.text}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                filters.division_id && filters.semester_id && (
                                    <div className="p-12 text-center">
                                        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد بيانات متاحة</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                            لم يتم العثور على درجات لطلاب هذه الشعبة في الفصل المحدد.
                                        </p>
                                    </div>
                                )
                            )}

                            {/* Print Footer / Signatures - Only visible in print mode */}
                            {studentsData.length > 0 && (
                                <div className="hidden print:flex justify-between items-end p-8 mt-12 w-full">
                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">معلم / مربي الصف</h4>
                                        <div className="border-b border-black w-full mb-2"></div>
                                        <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                                    </div>
                                    
                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">وكيل الشؤون التعليمية</h4>
                                        <div className="border-b border-black w-full mb-2"></div>
                                        <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                                    </div>
                                    
                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">مدير المدرسة / الختم</h4>
                                        <div className="border-b border-black w-full mb-2"></div>
                                        <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ReportPrintLayout>
                </div>
            </div>
        </AdminLayout>
    );
}
