import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ReportPrintLayout from "@/Components/Reports/ReportPrintLayout";
import {
    Search,
    Award,
    AlertCircle,
    Filter,
    X,
    Layers,
    BookOpen,
    Calendar
} from 'lucide-react';
import Select from 'react-select';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        borderRadius: '1rem',
        borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
        backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1'
        }
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
        color: state.isSelected ? 'white' : '#1e293b',
        fontWeight: state.isSelected ? 'bold' : 'normal',
    })
};

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
    const [showFilters, setShowFilters] = useState(true);

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

    const clearFilters = () => {
        setSelectedYear('');
        setSelectedSemester('');
        setSelectedDivision('');
        router.get(route('academic.semester-results.report'));
    };

    const removeFilter = (filterId) => {
        let params = {
            academic_year_id: selectedYear,
            semester_id: selectedSemester,
            division_id: selectedDivision,
        };
        if (filterId === 'year')     { params.academic_year_id = ''; params.semester_id = ''; params.division_id = ''; setSelectedYear(''); setSelectedSemester(''); setSelectedDivision(''); }
        if (filterId === 'semester') { params.semester_id = ''; params.division_id = ''; setSelectedSemester(''); setSelectedDivision(''); }
        if (filterId === 'division') { params.division_id = ''; setSelectedDivision(''); }
        router.get(route('academic.semester-results.report'), params, { preserveState: true });
    };

    const getYearName    = (id) => academicYears.find(y => y.id == id)?.name || id;
    const getSemesterName = (id) => semesters.find(s => s.id == id)?.name || id;
    const getDivisionName = (id) => { const d = divisions.find(d => d.id == id); return d ? `${d.grade?.name} - ${d.name}` : id; };

    const activeFilters = [];
    if (selectedYear)     activeFilters.push({ id: 'year',     label: `العام: ${getYearName(selectedYear)}` });
    if (selectedSemester) activeFilters.push({ id: 'semester', label: `الفصل: ${getSemesterName(selectedSemester)}` });
    if (selectedDivision) activeFilters.push({ id: 'division', label: `الشعبة: ${getDivisionName(selectedDivision)}` });

    const getGradeEstimation = (percentage) => {
        if (percentage >= 90) return { text: 'ممتاز', color: 'text-green-600 print:text-black' };
        if (percentage >= 80) return { text: 'جيد جداً', color: 'text-blue-600 print:text-black' };
        if (percentage >= 70) return { text: 'جيد', color: 'text-yellow-600 print:text-black' };
        if (percentage >= 60) return { text: 'مقبول', color: 'text-orange-600 print:text-black' };
        return { text: 'ضعيف', color: 'text-red-600 font-bold print:text-black' };
    };

    // Frontend Smart Filters
    const [gradeFilter, setGradeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('alpha');
    const [hasFailures, setHasFailures] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState('');

    const processedStudents = studentsData.map(student => {
        return {
            ...student,
            estimation: getGradeEstimation(student.percentage)
        };
    }).filter(student => {
        if (selectedStudent && student.student_id !== selectedStudent) return false;
        
        if (gradeFilter === 'excellent' && student.percentage < 90) return false;
        if (gradeFilter === 'vgood' && (student.percentage < 80 || student.percentage >= 90)) return false;
        if (gradeFilter === 'good' && (student.percentage < 70 || student.percentage >= 80)) return false;
        if (gradeFilter === 'pass' && (student.percentage < 60 || student.percentage >= 70)) return false;
        if (gradeFilter === 'weak' && student.percentage >= 60) return false;

        if (hasFailures) {
            const failedSubject = subjects.some(subject => {
                const score = student.scores[subject.id] || 0;
                const subjectMax = (subject.semester_aggregate_max || 0) + (subject.final_exam_max || 0) || 100;
                return score < (subjectMax / 2);
            });
            if (!failedSubject) return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortBy === 'desc') return b.percentage - a.percentage;
        if (sortBy === 'asc') return a.percentage - b.percentage;
        return 0; // fallback alpha
    });

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

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                academic_year_id: selectedYear || '',
                semester_id: selectedSemester || '',
                division_id: selectedDivision || '',
                printSettings: JSON.stringify(printSettings)
            });

            const url = route('academic.semester-results.report.pdf') + '?' + params.toString();
            window.location.href = url;
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء طلب الملف.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handlePrint = () => window.print();

    // Prepare subtitle
    let subtitle = '';
    if (semesterInfo && divisionInfo) {
        subtitle = `${semesterInfo.name} - ${divisionInfo.grade?.name} (شعبة ${divisionInfo.name})`;
    }

    return (
        <AdminLayout activeMenu="كشف العلامات المجمع">
            <Head title="كشف درجات ونتائج الطلاب" />

            <div className="space-y-6">

                    {/* Header */}
                    <div className="print:hidden relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400 z-20"></div>
                        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary-50 to-transparent pointer-events-none"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="p-3.5 bg-white border border-primary-100 shadow-sm rounded-xl text-primary-600 flex-shrink-0 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <Award size={28} strokeWidth={2} className="relative z-10" />
                            </div>
                            <div>
                                <h1 className="text-[22px] font-black text-slate-800 tracking-tight mb-1">كشف درجات ونتائج الطلاب</h1>
                                <p className="text-[13.5px] font-bold text-slate-500">كشف مجمع لدرجات الطلاب في جميع المواد نهاية الفصل الدراسي</p>
                            </div>
                        </div>
                        <div className="flex gap-3 relative z-10 w-full sm:w-auto">
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-2.5 px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all font-bold text-sm"
                            >
                                طباعة الكشف
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    <div className="print:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>

                        <div className="p-5">
                            {/* Toggle button + current selection summary */}
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-3 font-bold px-6 py-3 rounded-xl transition-all duration-300 w-full xl:w-auto ${
                                        showFilters
                                            ? 'bg-primary-50 text-primary-700 shadow-inner'
                                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-primary-100 text-primary-600' : 'bg-white shadow-sm text-slate-500'}`}>
                                        <Filter size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[15px]">خيارات عرض الكشف</span>
                                    {activeFilters.length > 0 && (
                                        <span className="flex items-center justify-center bg-primary-500 text-white text-xs font-black w-6 h-6 rounded-full shadow-sm">
                                            {activeFilters.length}
                                        </span>
                                    )}
                                    <svg className={`w-5 h-5 mr-auto transition-transform duration-300 ${showFilters ? 'rotate-180 text-primary-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Quick summary pill (visible when panel closed) */}
                                {!showFilters && semesterInfo && divisionInfo && (
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
                                        <Calendar size={15} className="text-primary-500" />
                                        <span>{semesterInfo.name}</span>
                                        <span className="text-slate-300">|</span>
                                        <Layers size={15} className="text-primary-500" />
                                        <span>{divisionInfo.grade?.name} - {divisionInfo.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Active filter chips */}
                            {activeFilters.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-slate-100">
                                    <span className="text-sm font-bold text-slate-500 ml-2">الفلاتر النشطة:</span>
                                    {activeFilters.map(filter => (
                                        <span key={filter.id} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary-200 text-primary-700 text-sm font-bold shadow-sm group">
                                            {filter.label}
                                            <button type="button" onClick={() => removeFilter(filter.id)} className="p-0.5 rounded-full hover:bg-red-50 text-slate-400 group-hover:text-red-500 transition-colors">
                                                <X size={14} strokeWidth={2.5} />
                                            </button>
                                        </span>
                                    ))}
                                    <button onClick={clearFilters} className="text-sm text-slate-400 hover:text-red-600 font-bold px-3 transition-colors mr-auto flex items-center gap-1">
                                        <X size={14} strokeWidth={2.5} /> مسح جميع الفلاتر
                                    </button>
                                </div>
                            )}

                            {/* Collapsible form */}
                            <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                                        {/* Academic Year */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">العام الدراسي</label>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => { setSelectedYear(e.target.value); setSelectedSemester(''); setSelectedDivision(''); }}
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3"
                                            >
                                                <option value="">اختر العام الدراسي...</option>
                                                {academicYears.map(year => (
                                                    <option key={year.id} value={year.id}>{year.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Semester */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">الفصل الدراسي</label>
                                            <select
                                                value={selectedSemester}
                                                onChange={(e) => { setSelectedSemester(e.target.value); setSelectedDivision(''); }}
                                                disabled={!selectedYear}
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <option value="">{!selectedYear ? 'اختر العام أولاً...' : 'اختر الفصل الدراسي...'}</option>
                                                {semesters.map(term => (
                                                    <option key={term.id} value={term.id}>{term.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Division */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">الصف / الشعبة</label>
                                            <select
                                                value={selectedDivision}
                                                onChange={(e) => setSelectedDivision(e.target.value)}
                                                className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3"
                                            >
                                                <option value="">اختر الشعبة...</option>
                                                {divisions.map(div => (
                                                    <option key={div.id} value={div.id}>
                                                        {div.grade?.name} - {div.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Submit + Clear */}
                                        <div className="flex gap-3 items-end">
                                            <button
                                                type="submit"
                                                disabled={!selectedSemester || !selectedDivision}
                                                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Search size={16} strokeWidth={2.5} />
                                                <span>عرض الكشف</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all"
                                            >
                                                <X size={16} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Frontend Filters */}
                    {studentsData.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-5 print:hidden">
                            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 justify-between">
                                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                                    <span className="text-sm font-bold text-slate-500 ml-1">فلاتر ذكية (فورية):</span>
                                    
                                    <div className="flex flex-wrap items-center rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => setGradeFilter('all')}
                                            className={`px-3 py-2 text-sm font-bold transition-all ${gradeFilter === 'all' ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                                        >الكل</button>
                                        <button 
                                            onClick={() => setGradeFilter('excellent')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-r border-slate-200 ${gradeFilter === 'excellent' ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-50 text-emerald-600'}`}
                                        >امتياز</button>
                                        <button 
                                            onClick={() => setGradeFilter('vgood')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-r border-slate-200 ${gradeFilter === 'vgood' ? 'bg-blue-500 text-white' : 'hover:bg-blue-50 text-blue-600'}`}
                                        >جيد جداً</button>
                                        <button 
                                            onClick={() => setGradeFilter('good')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-r border-slate-200 ${gradeFilter === 'good' ? 'bg-yellow-500 text-white' : 'hover:bg-yellow-50 text-yellow-600'}`}
                                        >جيد</button>
                                        <button 
                                            onClick={() => setGradeFilter('pass')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-r border-slate-200 ${gradeFilter === 'pass' ? 'bg-orange-500 text-white' : 'hover:bg-orange-50 text-orange-600'}`}
                                        >مقبول</button>
                                        <button 
                                            onClick={() => setGradeFilter('weak')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-r border-slate-200 ${gradeFilter === 'weak' ? 'bg-red-500 text-white' : 'hover:bg-red-50 text-red-600'}`}
                                        >ضعيف / راسب</button>
                                    </div>

                                    <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
                                        <span className="px-3 py-2 text-sm font-bold text-slate-500 bg-slate-100 border-l border-slate-200">الفرز:</span>
                                        <button 
                                            onClick={() => setSortBy('alpha')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-l border-slate-200 ${sortBy === 'alpha' ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-50 text-indigo-600'}`}
                                        >أبجدي</button>
                                        <button 
                                            onClick={() => setSortBy('desc')}
                                            className={`px-3 py-2 text-sm font-bold transition-all border-l border-slate-200 ${sortBy === 'desc' ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-50 text-indigo-600'}`}
                                        >الأعلى نسبة</button>
                                        <button 
                                            onClick={() => setSortBy('asc')}
                                            className={`px-3 py-2 text-sm font-bold transition-all ${sortBy === 'asc' ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-50 text-indigo-600'}`}
                                        >الأقل نسبة</button>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setHasFailures(!hasFailures)}
                                        className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${hasFailures ? 'bg-red-600 text-white' : 'bg-slate-50 border border-slate-200 text-red-600 hover:bg-slate-100'}`}
                                        title="إظهار الطلاب الذين رسبوا في مادة واحدة على الأقل"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-current"></span>
                                        راسب بمواد
                                    </button>
                                </div>
                                
                                <div className="w-full xl:w-72">
                                    <Select
                                        options={[
                                            { value: '', label: 'الكل (بحث باسم الطالب)' },
                                            ...(studentsData?.map(e => ({ value: e.student_id, label: e.student_name })) || [])
                                        ]}
                                        value={selectedStudent ? { value: selectedStudent, label: studentsData?.find(e => e.student_id === selectedStudent)?.student_name } : { value: '', label: 'الكل (بحث باسم الطالب)' }}
                                        onChange={(opt) => setSelectedStudent(opt ? opt.value : '')}
                                        placeholder="بحث باسم الطالب..."
                                        isClearable
                                        styles={customSelectStyles}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <ReportPrintLayout 
                        title={printSettings.title} 
                        printSettings={printSettings} 
                        setPrintSettings={setPrintSettings} 
                        onPrint={handlePrint}
                        onDownloadPdf={handleDownloadPDF}
                        isGeneratingPdf={isGeneratingPdf}
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
                                            {processedStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={subjects.length + 5} className="py-12 px-6 text-center text-slate-500 font-bold">
                                                        لا توجد نتائج مطابقة لخيارات الفلترة.
                                                    </td>
                                                </tr>
                                            ) : (
                                                processedStudents.map((student, idx) => {
                                                    const estimation = student.estimation;
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
                                                })
                                            )}
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
        </AdminLayout>
    );
}
