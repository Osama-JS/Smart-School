import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';
import { CalendarDays, Filter, User, BookOpen, Search, Calculator, FlaskConical, Globe, Laptop, Music, Palette, Microscope, Languages, Feather, Clock } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';

const SUBJECT_ICONS = {
    'BookOpen': BookOpen,
    'Calculator': Calculator,
    'FlaskConical': FlaskConical,
    'Globe': Globe,
    'Laptop': Laptop,
    'Music': Music,
    'Palette': Palette,
    'Microscope': Microscope,
    'Languages': Languages,
    'Feather': Feather,
};

const SUBJECT_COLORS = {
    'BookOpen': 'from-blue-500/10 via-blue-50/50 to-transparent dark:from-blue-500/20 dark:via-blue-900/10 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300',
    'Calculator': 'from-indigo-500/10 via-indigo-50/50 to-transparent dark:from-indigo-500/20 dark:via-indigo-900/10 border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300',
    'FlaskConical': 'from-emerald-500/10 via-emerald-50/50 to-transparent dark:from-emerald-500/20 dark:via-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300',
    'Globe': 'from-teal-500/10 via-teal-50/50 to-transparent dark:from-teal-500/20 dark:via-teal-900/10 border-teal-200 dark:border-teal-800/50 text-teal-700 dark:text-teal-300',
    'Laptop': 'from-purple-500/10 via-purple-50/50 to-transparent dark:from-purple-500/20 dark:via-purple-900/10 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300',
    'Music': 'from-pink-500/10 via-pink-50/50 to-transparent dark:from-pink-500/20 dark:via-pink-900/10 border-pink-200 dark:border-pink-800/50 text-pink-700 dark:text-pink-300',
    'Palette': 'from-rose-500/10 via-rose-50/50 to-transparent dark:from-rose-500/20 dark:via-rose-900/10 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300',
    'Microscope': 'from-cyan-500/10 via-cyan-50/50 to-transparent dark:from-cyan-500/20 dark:via-cyan-900/10 border-cyan-200 dark:border-cyan-800/50 text-cyan-700 dark:text-cyan-300',
    'Languages': 'from-amber-500/10 via-amber-50/50 to-transparent dark:from-amber-500/20 dark:via-amber-900/10 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300',
    'Feather': 'from-orange-500/10 via-orange-50/50 to-transparent dark:from-orange-500/20 dark:via-orange-900/10 border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-300',
};
const DEFAULT_COLOR = 'from-slate-500/10 via-slate-50/50 to-transparent dark:from-slate-500/20 dark:via-slate-900/10 border-slate-200 dark:border-slate-800/50 text-slate-700 dark:text-slate-300';

export default function TimetableReportIndex({ academicYears, sections, periods, timetable, workingDays, daysTranslation, subjects, teachers, filters }) {
    
    // Helpers for defaults
    const getInitialYear = () => filters.academic_year_id || academicYears.find(y => y.is_active)?.id || academicYears[0]?.id || '';
    const initialYearId = getInitialYear();
    const initialSemesters = academicYears.find(y => y.id == initialYearId)?.semesters || [];
    const getInitialSemester = () => filters.semester_id || initialSemesters.find(s => s.is_active)?.id || initialSemesters[0]?.id || '';

    // Cascading Filter States
    const [selectedYear, setSelectedYear] = useState(initialYearId);
    const [availableSemesters, setAvailableSemesters] = useState(initialSemesters);
    const [selectedSemester, setSelectedSemester] = useState(getInitialSemester());
    
    const [selectedSection, setSelectedSection] = useState(filters.section_id || '');
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState(filters.grade_id || '');
    const [availableDivisions, setAvailableDivisions] = useState([]);
    const [selectedDivision, setSelectedDivision] = useState(filters.division_id || '');

    // Setup Cascading lists on load
    useEffect(() => {
        if (selectedYear && academicYears.length > 0) {
            const year = academicYears.find(y => y.id == selectedYear);
            setAvailableSemesters(year ? year.semesters : []);
        }
    }, [selectedYear, academicYears]);

    useEffect(() => {
        if (selectedSection && sections.length > 0) {
            const section = sections.find(s => s.id == selectedSection);
            setAvailableGrades(section ? section.grades : []);
        }
    }, [selectedSection, sections]);

    useEffect(() => {
        if (selectedGrade && availableGrades.length > 0) {
            const grade = availableGrades.find(g => g.id == selectedGrade);
            setAvailableDivisions(grade ? grade.divisions : []);
        }
    }, [selectedGrade, availableGrades]);

    const applyFilters = () => {
        if (!selectedSemester || !selectedDivision) return;
        
        router.get(route('academic.timetable.report'), {
            academic_year_id: selectedYear,
            semester_id: selectedSemester,
            section_id: selectedSection,
            grade_id: selectedGrade,
            division_id: selectedDivision
        }, { preserveState: true });
    };

    // Matrix construction
    const getSlotData = (day, periodId) => {
        return timetable.find(t => t.day_of_week === day && t.period_id === periodId);
    };

    const [printSettings, setPrintSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('TimetableReportPrintSettings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            title: 'الجدول المدرسي العام',
            orientation: 'landscape',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            showKPIs: false,
            showDetails: true,
            ecoMode: false,
            brandColor: '#2563eb'
        };
    });

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    useEffect(() => {
        localStorage.setItem('TimetableReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                academic_year_id: selectedYear || '',
                semester_id: selectedSemester || '',
                section_id: selectedSection || '',
                grade_id: selectedGrade || '',
                division_id: selectedDivision || '',
                printSettings: JSON.stringify(printSettings)
            });
            const url = route('academic.timetable.report.pdf') + '?' + params.toString();
            window.location.href = url;
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء طلب الملف.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <AdminLayout activeMenu="الجدول المدرسي العام">
            <Head title="تقارير الجدول المدرسي" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
                
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Fine abstract geometric background lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                            <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <CalendarDays size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">تقرير الجدول المدرسي العام</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">استعرض واطبع الجدول المدرسي الأسبوعي للشعبة.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative z-20">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-inner relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent"></div>
                                    <Filter size={22} strokeWidth={2} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-900 dark:text-white">محددات الجدول</h3>
                                    <p className="text-xs font-bold text-slate-500">اختر الفصل والشعبة لعرض الشبكة</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={applyFilters}
                                disabled={!selectedSemester || !selectedDivision}
                                className="hidden md:flex items-center gap-2 bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-primary-500/30 transition-all duration-300 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                <Search size={18} strokeWidth={2.5} /> استعراض الجدول
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 px-1">السنة الدراسية</label>
                                <SelectInput
                                    options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                                    value={selectedYear}
                                    onChange={val => { setSelectedYear(val); setSelectedSemester(''); }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 px-1">الفصل الدراسي</label>
                                <SelectInput
                                    options={availableSemesters.map(s => ({ value: s.id, label: s.name }))}
                                    value={selectedSemester}
                                    onChange={setSelectedSemester}
                                    disabled={!selectedYear}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 px-1">القسم</label>
                                <SelectInput
                                    options={sections.map(s => ({ value: s.id, label: s.name }))}
                                    value={selectedSection}
                                    onChange={val => { setSelectedSection(val); setSelectedGrade(''); setSelectedDivision(''); }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 px-1">الصف</label>
                                <SelectInput
                                    options={availableGrades.map(g => ({ value: g.id, label: g.name }))}
                                    value={selectedGrade}
                                    onChange={val => { setSelectedGrade(val); setSelectedDivision(''); }}
                                    disabled={!selectedSection}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 px-1">الشعبة</label>
                                <SelectInput
                                    options={availableDivisions.map(d => ({ value: d.id, label: d.name }))}
                                    value={selectedDivision}
                                    onChange={setSelectedDivision}
                                    disabled={!selectedGrade}
                                />
                            </div>
                        </div>
                        
                        <div className="mt-4 md:hidden">
                            <button 
                                onClick={applyFilters}
                                disabled={!selectedSemester || !selectedDivision}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-l from-primary-600 to-primary-500 text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Search size={18} strokeWidth={2.5} /> استعراض الجدول
                            </button>
                        </div>
                </div>

                {/* Timetable Grid */}
                {selectedDivision && filters.division_id == selectedDivision && filters.semester_id == selectedSemester ? (
                    <ReportPrintLayout 
                        title={printSettings.title} 
                        printSettings={printSettings} 
                        setPrintSettings={setPrintSettings} 
                        onPrint={handlePrint}
                        onDownloadPdf={handleDownloadPDF}
                        isGeneratingPdf={isGeneratingPdf}
                    >
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col relative z-10 print:border-none print:shadow-none print:rounded-none">
                        
                        {/* Selected info in print mode */}
                        <div className="mb-6 flex flex-col gap-1 items-start text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-transparent print:border-none print:p-0 print:mb-4">
                            <span>الشعبة: {availableDivisions.find(d => d.id == selectedDivision)?.name}</span>
                            <span>الفصل الدراسي: {availableSemesters.find(s => s.id == selectedSemester)?.name}</span>
                        </div>

                        <div className="overflow-auto custom-scrollbar flex-1 relative p-2 md:p-4 print:p-0">
                            <table className="w-full text-right border-separate border-spacing-1.5 min-w-max print:border-collapse print:border-spacing-0">
                                <thead className="sticky top-0 z-30">
                                    <tr>
                                        <th className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl min-w-[140px] text-slate-700 dark:text-slate-300 font-black text-center shadow-sm sticky right-0 z-40 border border-slate-200 dark:border-slate-700 print:border-black/20 print:bg-slate-100 print:rounded-none print:border">
                                            اليوم / الحصة
                                        </th>
                                        {periods.map((period, idx) => (
                                            <th key={period.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl min-w-[180px] text-center shadow-sm border border-slate-200 dark:border-slate-700 group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-500/50 print:border-black/20 print:bg-slate-100 print:rounded-none print:border print:p-2">
                                                <div className="font-black text-slate-900 dark:text-white mb-2 text-[15px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors relative z-10 print:mb-1">{period.period_name}</div>
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400 font-bold shadow-sm relative z-10 print:bg-transparent print:shadow-none print:p-0" dir="ltr">
                                                    <Clock size={12} className="text-primary-500 print:hidden" />
                                                    {period.start_time ? period.start_time.substring(0,5) : ''} - {period.end_time ? period.end_time.substring(0,5) : ''}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {workingDays.map(day => (
                                        <tr key={day} className="group/row">
                                            <td className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-black text-slate-800 dark:text-white text-center text-lg sticky right-0 z-20 shadow-sm border border-slate-200 dark:border-slate-700 group-hover/row:bg-primary-50 dark:group-hover/row:bg-primary-900/20 transition-colors print:border-black/20 print:bg-transparent print:rounded-none print:border print:p-2">
                                                {daysTranslation[day] || day}
                                            </td>
                                            {periods.map(period => {
                                                const slot = getSlotData(day, period.id);
                                                const periodName = period.period_name || '';
                                                const isBreak = period.is_break || periodName.includes('فسحة') || periodName.includes('استراحة') || periodName.includes('صلاة');
                                                
                                                if (isBreak) {
                                                    return (
                                                        <td key={`${day}-${period.id}`} className="p-1 min-h-[80px] relative transition-colors print:p-0 print:border print:border-black/20">
                                                            <div className="w-full h-full min-h-[80px] rounded-2xl flex flex-col items-center justify-center opacity-70 group-hover/row:opacity-100 transition-opacity bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(245,158,11,0.05)_10px,rgba(245,158,11,0.05)_20px)] border border-amber-200/30 dark:border-amber-500/20 print:rounded-none print:border-none print:bg-slate-100">
                                                                <span className="font-black text-amber-600 dark:text-amber-500 text-sm tracking-wide bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-lg print:bg-transparent print:text-black">{period.period_name}</span>
                                                            </div>
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={`${day}-${period.id}`} className="p-1 min-h-[80px] relative group/cell print:p-0 print:border print:border-black/20">
                                                        {slot ? (
                                                            <div className={`h-full min-h-[80px] bg-gradient-to-br rounded-2xl border p-4 shadow-sm group-hover/cell:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between group/slot ${SUBJECT_COLORS[slot.subject?.icon] || DEFAULT_COLOR} print:rounded-none print:border-none print:shadow-none print:bg-transparent print:p-2`}>
                                                                <div className="flex items-start gap-3 relative z-10 print:gap-1">
                                                                    <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner print:hidden">
                                                                        {(() => {
                                                                            const IconComponent = SUBJECT_ICONS[slot.subject?.icon] || BookOpen;
                                                                            return <IconComponent size={20} strokeWidth={1.5} className="text-current opacity-80" />;
                                                                        })()}
                                                                    </div>
                                                                    <div className="pt-1 flex-1 min-w-0">
                                                                        <div className="font-black text-sm mb-1 leading-tight line-clamp-2 drop-shadow-sm print:text-xs print:drop-shadow-none" title={slot.subject?.name}>{slot.subject?.name || 'بدون مادة'}</div>
                                                                        
                                                                        <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/40 dark:bg-black/20 px-2 py-1 rounded-lg shadow-sm w-max max-w-full print:bg-transparent print:shadow-none print:p-0 print:border-none">
                                                                            <User size={10} className="shrink-0 opacity-70 print:hidden" />
                                                                            <span className="truncate print:text-[10px] print:text-slate-600" title={slot.teacher?.name}>{slot.teacher?.name || 'بدون معلم'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full min-h-[80px] rounded-xl border border-dashed border-slate-200 bg-slate-50/50 print:border-none print:bg-transparent"></div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </ReportPrintLayout>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8 md:p-16 text-center relative z-10">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 text-primary-600 mb-8 shadow-inner transform rotate-3">
                                <CalendarDays size={48} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white mb-4">الجدول الدراسي العام</h2>
                            <p className="text-dark-500 dark:text-dark-400 mb-10 max-w-lg mx-auto leading-relaxed">اختر محددات الجدول من الأعلى لتتمكن من استعراض الجدول الدراسي الخاص بالشعبة.</p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
