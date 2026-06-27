import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { CalendarDays, Filter, Plus, User, BookOpen, Trash2, Search, AlertCircle, X, Check, Calculator, FlaskConical, Globe, Laptop, Music, Palette, Microscope, Languages, Feather, Clock } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import Modal from '@/Components/Modal';

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

export default function TimetableIndex({ academicYears, sections, periods, timetable, workingDays, daysTranslation, subjects, teachers, filters }) {
    
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
        
        router.get(route('academic.timetable'), {
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

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetSlot, setTargetSlot] = useState(null); // {day, period}

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        semester_id: selectedSemester,
        division_id: selectedDivision,
        period_id: '',
        day_of_week: '',
        subject_id: '',
        teacher_id: '',
    });

    const openSlotModal = (day, period) => {
        clearErrors();
        setTargetSlot({ day, period });
        setData({
            semester_id: selectedSemester,
            division_id: selectedDivision,
            period_id: period.id,
            day_of_week: day,
            subject_id: '',
            teacher_id: '',
        });
        setIsModalOpen(true);
    };

    const handleAssign = (e) => {
        e.preventDefault();
        post(route('academic.timetable.assign'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            }
        });
    };

    const handleUnassign = (day, periodId) => {
        router.post(route('academic.timetable.unassign'), {
            semester_id: selectedSemester,
            division_id: selectedDivision,
            day_of_week: day,
            period_id: periodId
        }, { preserveScroll: true });
    };

    return (
        <AdminLayout activeMenu="الجدول الدراسي">
            <Head title="الجدول الدراسي | النظام الأكاديمي" />

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
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">الجدول الدراسي العام</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">توزيع الحصص على المعلمين والفصول</p>
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
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col max-h-[75vh] animate-fade-in relative z-10">
                        <div className="overflow-auto custom-scrollbar flex-1 relative p-2 md:p-4">
                            <table className="w-full text-right border-separate border-spacing-1.5 min-w-max">
                                <thead className="sticky top-0 z-30">
                                    <tr>
                                        <th className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl min-w-[140px] text-slate-700 dark:text-slate-300 font-black text-center shadow-sm sticky right-0 z-40 border border-slate-200 dark:border-slate-700">
                                            اليوم / الحصة
                                        </th>
                                        {periods.map((period, idx) => (
                                            <th key={period.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl min-w-[220px] text-center shadow-sm border border-slate-200 dark:border-slate-700 group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-500/50">
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-200/20 dark:to-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute -inset-x-4 bottom-0 h-1 bg-primary-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-right duration-500"></div>
                                                <div className="font-black text-slate-900 dark:text-white mb-2 text-[15px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors relative z-10">{period.period_name}</div>
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400 font-bold shadow-sm relative z-10" dir="ltr">
                                                    <Clock size={12} className="text-primary-500" />
                                                    {period.start_time ? period.start_time.substring(0,5) : ''} - {period.end_time ? period.end_time.substring(0,5) : ''}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {workingDays.map(day => (
                                        <tr key={day} className="group/row">
                                            <td className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-black text-slate-800 dark:text-white text-center text-lg sticky right-0 z-20 shadow-sm border border-slate-200 dark:border-slate-700 group-hover/row:bg-primary-50 dark:group-hover/row:bg-primary-900/20 transition-colors">
                                                {daysTranslation[day] || day}
                                            </td>
                                            {periods.map(period => {
                                                const slot = getSlotData(day, period.id);
                                                const periodName = period.period_name || '';
                                                const isBreak = periodName.includes('فسحة') || periodName.includes('استراحة') || periodName.includes('صلاة');
                                                
                                                if (isBreak) {
                                                    return (
                                                        <td key={`${day}-${period.id}`} className="p-1 min-h-[140px] relative transition-colors">
                                                            <div className="w-full h-full min-h-[140px] rounded-2xl flex flex-col items-center justify-center opacity-70 group-hover/row:opacity-100 transition-opacity bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(245,158,11,0.05)_10px,rgba(245,158,11,0.05)_20px)] border border-amber-200/30 dark:border-amber-500/20">
                                                                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-500 flex items-center justify-center mb-3 shadow-inner">
                                                                    <Clock size={24} className="animate-[pulse_3s_ease-in-out_infinite]" strokeWidth={2} />
                                                                </div>
                                                                <span className="font-black text-amber-600 dark:text-amber-500 text-sm tracking-wide bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-lg">{period.period_name}</span>
                                                            </div>
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={`${day}-${period.id}`} className="p-1 min-h-[140px] relative group/cell">
                                                        {slot ? (
                                                            <div className={`h-full min-h-[140px] bg-gradient-to-br rounded-2xl border p-4 shadow-sm group-hover/cell:shadow-xl group-hover/cell:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group/slot ${SUBJECT_COLORS[slot.subject?.icon] || DEFAULT_COLOR}`}>
                                                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 dark:bg-white/5 rounded-bl-full pointer-events-none opacity-0 group-hover/slot:opacity-100 transition-opacity duration-500" />
                                                                
                                                                <button onClick={() => handleUnassign(day, period.id)} className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-all hover:bg-red-500 hover:text-white hover:scale-110 hover:-rotate-6 z-20 shadow-sm" title="إزالة الحصة">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                                
                                                                <div className="flex items-start gap-3 relative z-10">
                                                                    <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner group-hover/slot:scale-110 group-hover/slot:rotate-6 transition-transform duration-500">
                                                                        {(() => {
                                                                            const IconComponent = SUBJECT_ICONS[slot.subject?.icon] || BookOpen;
                                                                            return <IconComponent size={24} strokeWidth={1.5} className="text-current opacity-80" />;
                                                                        })()}
                                                                    </div>
                                                                    <div className="pt-1 flex-1 min-w-0">
                                                                        <div className="font-black text-base mb-1.5 leading-tight line-clamp-2 drop-shadow-sm" title={slot.subject?.name}>{slot.subject?.name || 'بدون مادة'}</div>
                                                                        
                                                                        <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/40 dark:bg-black/20 px-2 py-1.5 rounded-lg shadow-sm w-max max-w-full group/teacher relative cursor-default">
                                                                            <User size={12} className="shrink-0 opacity-70" />
                                                                            <span className="truncate" title={slot.teacher?.name}>{slot.teacher?.name || 'بدون معلم'}</span>
                                                                            
                                                                            {/* Teacher Tooltip */}
                                                                            {slot.teacher?.name && (
                                                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl opacity-0 group-hover/teacher:opacity-100 pointer-events-none transition-all scale-90 group-hover/teacher:scale-100 whitespace-nowrap z-50 shadow-xl border border-slate-700">
                                                                                    المعلم: {slot.teacher.name}
                                                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700"></div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => openSlotModal(day, period)}
                                                                className="w-full h-full min-h-[140px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800/50 hover:border-primary-400 dark:hover:border-primary-500/50 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-primary-50/80 dark:hover:bg-primary-900/20 transition-all flex flex-col items-center justify-center gap-3 group/btn relative focus:outline-none focus:ring-4 focus:ring-primary-500/20"
                                                            >
                                                                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover/btn:text-primary-600 dark:group-hover/btn:text-primary-400 group-hover/btn:bg-white dark:group-hover/btn:bg-slate-800 transition-all transform group-hover/btn:scale-110 group-hover/btn:shadow-md">
                                                                    <Plus size={24} />
                                                                </div>
                                                                <span className="text-sm font-black text-slate-400 group-hover/btn:text-primary-600 dark:group-hover/btn:text-primary-400 transition-colors tracking-wide">تعيين حصة</span>
                                                            </button>
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
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8 md:p-16 text-center relative z-10">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 text-primary-600 mb-8 shadow-inner transform rotate-3">
                                <CalendarDays size={48} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white mb-4">بناء وإدارة الجدول الدراسي</h2>
                            <p className="text-dark-500 dark:text-dark-400 mb-10 max-w-lg mx-auto leading-relaxed">اختر محددات الجدول من الأعلى لتتمكن من استعراض وبناء الجدول الدراسي بكل سهولة واحترافية.</p>
                            
                            <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6 text-right">
                                <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700 shadow-sm relative overflow-hidden group hover:border-primary-500/30 transition-colors">
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
                                    <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-600 font-black text-xl mb-4">1</span>
                                    <h4 className="font-black text-dark-900 dark:text-white mb-2 relative">تحديد الفصل</h4>
                                    <p className="text-sm text-dark-500 dark:text-dark-400 leading-relaxed relative">اختر السنة والفصل الدراسي المستهدف.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700 shadow-sm relative overflow-hidden group hover:border-primary-500/30 transition-colors">
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
                                    <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-600 font-black text-xl mb-4">2</span>
                                    <h4 className="font-black text-dark-900 dark:text-white mb-2 relative">تحديد الشعبة</h4>
                                    <p className="text-sm text-dark-500 dark:text-dark-400 leading-relaxed relative">حدد القسم، الصف، والشعبة المراد عرض جدولها.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700 shadow-sm relative overflow-hidden group hover:border-primary-500/30 transition-colors">
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
                                    <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-600 font-black text-xl mb-4">3</span>
                                    <h4 className="font-black text-dark-900 dark:text-white mb-2 relative">إدارة الحصص</h4>
                                    <p className="text-sm text-dark-500 dark:text-dark-400 leading-relaxed relative">انقر على الخانات لتعيين المواد والمعلمين للحصص.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md">
                <div className="relative bg-white dark:bg-dark-900 rounded-[2rem] shadow-2xl w-full overflow-hidden border border-dark-100 dark:border-dark-800 transform transition-all">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600" />
                    <div className="p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-dark-100 dark:border-dark-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 flex items-center justify-center shadow-inner">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-dark-900 dark:text-white">تعيين حصة</h2>
                                    {targetSlot && <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-1">{daysTranslation[targetSlot.day]} - {targetSlot.period.period_name}</p>}
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-50 dark:bg-dark-800 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAssign} className="space-y-6">
                            <div>
                                <label className="block text-sm font-black text-dark-800 dark:text-dark-200 mb-2">المادة <span className="text-red-500">*</span></label>
                                <SelectInput
                                    options={subjects.map(s => ({ value: s.id, label: s.name }))}
                                    value={data.subject_id}
                                    onChange={val => setData('subject_id', val)}
                                    placeholder="اختر المادة"
                                    isSearchable={true}
                                />
                                {errors.subject_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errors.subject_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-black text-dark-800 dark:text-dark-200 mb-2">المعلم <span className="text-red-500">*</span></label>
                                <SelectInput
                                    options={teachers.map(t => ({ value: t.id, label: t.name }))}
                                    value={data.teacher_id}
                                    onChange={val => setData('teacher_id', val)}
                                    placeholder="اختر المعلم"
                                    isSearchable={true}
                                />
                                {errors.teacher_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errors.teacher_id}</p>}
                                
                                <div className="mt-4 flex gap-3 items-start text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <p className="text-sm font-bold leading-relaxed">النظام سيمنع الحفظ تلقائياً في حال وجود تعارض لمعلم المادة في نفس الوقت مع شعبة أخرى.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-dark-100 dark:border-dark-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3.5 text-sm font-bold text-dark-600 hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-800 rounded-xl transition-colors">
                                    إلغاء
                                </button>
                                <button type="submit" disabled={processing} className="flex items-center gap-2 bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-8 py-3.5 rounded-xl text-sm font-black shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-70">
                                    {processing ? 'جاري الحفظ...' : <><Check size={18} /> حفظ وتعيين</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
