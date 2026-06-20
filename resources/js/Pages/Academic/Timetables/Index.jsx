import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { CalendarDays, Filter, Plus, User, BookOpen, Trash2, Search, AlertCircle, X, Check, Calculator, FlaskConical, Globe, Laptop, Music, Palette, Microscope, Languages, Feather } from 'lucide-react';
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
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-white font-bold">
                        <Filter size={18} className="text-indigo-500" />
                        <h3>حدد مسار الجدول للبدء</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">السنة الدراسية</label>
                            <SelectInput
                                options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                                value={selectedYear}
                                onChange={val => { setSelectedYear(val); setSelectedSemester(''); }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">الفصل (الترم)</label>
                            <SelectInput
                                options={availableSemesters.map(s => ({ value: s.id, label: s.name }))}
                                value={selectedSemester}
                                onChange={setSelectedSemester}
                                disabled={!selectedYear}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">القسم</label>
                            <SelectInput
                                options={sections.map(s => ({ value: s.id, label: s.name }))}
                                value={selectedSection}
                                onChange={val => { setSelectedSection(val); setSelectedGrade(''); setSelectedDivision(''); }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">الصف</label>
                            <SelectInput
                                options={availableGrades.map(g => ({ value: g.id, label: g.name }))}
                                value={selectedGrade}
                                onChange={val => { setSelectedGrade(val); setSelectedDivision(''); }}
                                disabled={!selectedSection}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">الشعبة</label>
                            <SelectInput
                                options={availableDivisions.map(d => ({ value: d.id, label: d.name }))}
                                value={selectedDivision}
                                onChange={setSelectedDivision}
                                disabled={!selectedGrade}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button 
                            onClick={applyFilters}
                            disabled={!selectedSemester || !selectedDivision}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Search size={18} /> عرض الجدول
                        </button>
                    </div>
                </div>

                {/* Timetable Grid */}
                {selectedDivision && filters.division_id == selectedDivision && filters.semester_id == selectedSemester ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr>
                                        <th className="bg-slate-50 dark:bg-slate-900 border-b border-l border-slate-200 dark:border-slate-700 p-4 min-w-[120px] text-slate-600 dark:text-slate-300 font-bold text-center">
                                            اليوم / الحصة
                                        </th>
                                        {periods.map((period, idx) => (
                                            <th key={period.id} className="bg-slate-50 dark:bg-slate-900 border-b border-l last:border-l-0 border-slate-200 dark:border-slate-700 p-4 min-w-[180px] text-center">
                                                <div className="font-bold text-slate-800 dark:text-white mb-1">{period.period_name}</div>
                                                <div className="text-xs text-slate-500 font-mono" dir="ltr">
                                                    {period.start_time.substring(0,5)} - {period.end_time.substring(0,5)}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {workingDays.map(day => (
                                        <tr key={day}>
                                            <td className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-l border-slate-200 dark:border-slate-700 p-4 font-black text-slate-800 dark:text-white text-center">
                                                {daysTranslation[day] || day}
                                            </td>
                                            {periods.map(period => {
                                                const slot = getSlotData(day, period.id);
                                                return (
                                                    <td key={`${day}-${period.id}`} className="border-b border-l last:border-l-0 border-slate-200 dark:border-slate-700 p-2 align-top h-28 relative group">
                                                        {slot ? (
                                                            <div className="h-full bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 p-3 flex flex-col justify-between">
                                                                <button onClick={() => handleUnassign(day, period.id)} className="absolute top-3 left-3 w-6 h-6 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-200">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                                
                                                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm mb-2">
                                                                    {(() => {
                                                                        const IconComponent = SUBJECT_ICONS[slot.subject?.icon] || BookOpen;
                                                                        return <IconComponent size={14} />;
                                                                    })()}
                                                                    <span className="line-clamp-1">{slot.subject.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs mt-auto">
                                                                    <User size={12} className="text-slate-400" />
                                                                    <span className="line-clamp-1">{slot.teacher.name}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => openSlotModal(day, period)} className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 text-slate-400 hover:text-indigo-500 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 focus:opacity-100">
                                                                <Plus size={20} />
                                                                <span className="text-xs font-bold">تعيين مادة</span>
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
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-8 md:p-16 text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 mb-6">
                            <CalendarDays size={48} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-6">كيفية عرض وإدارة الجدول الدراسي؟</h2>
                        <div className="max-w-2xl mx-auto grid gap-4 text-right">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                <span className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-black text-lg">1</span>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">تحديد السنة والفصل الدراسي</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">قم باختيار السنة الدراسية ثم الفصل (الترم) المراد بناء وتعديل الجدول الخاص به. (تلقائياً يكون الفصل النشط هو المحدد).</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                <span className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-black text-lg">2</span>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">تحديد الفئة المستهدفة</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">قم باختيار (القسم) ثم (الصف) ثم (الشعبة). بناء الجداول يتم على مستوى الشعبة الدراسية.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                <span className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-black text-lg">3</span>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">عرض الجدول وتعيين الحصص</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">انقر على زر <strong className="text-indigo-600">عرض الجدول</strong> ليظهر لك الجدول. يمكنك بعدها النقر على أي خانة فارغة لتعيين المادة والمعلم للحصة.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center">
                                <Plus size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">تعيين حصة</h2>
                                {targetSlot && <p className="text-xs text-slate-500 mt-1">{daysTranslation[targetSlot.day]} - {targetSlot.period.period_name}</p>}
                            </div>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleAssign} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المادة <span className="text-rose-500">*</span></label>
                            <SelectInput
                                options={subjects.map(s => ({ value: s.id, label: s.name }))}
                                value={data.subject_id}
                                onChange={val => setData('subject_id', val)}
                                placeholder="اختر المادة"
                                isSearchable={true}
                            />
                            {errors.subject_id && <p className="text-xs text-rose-500 mt-1">{errors.subject_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المعلم <span className="text-rose-500">*</span></label>
                            <SelectInput
                                options={teachers.map(t => ({ value: t.id, label: t.name }))}
                                value={data.teacher_id}
                                onChange={val => setData('teacher_id', val)}
                                placeholder="اختر المعلم"
                                isSearchable={true}
                            />
                            {errors.teacher_id && <p className="text-xs text-rose-500 mt-1">{errors.teacher_id}</p>}
                            <div className="mt-2 flex gap-2 items-start text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-100 dark:border-amber-500/20">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <p className="text-xs">النظام سيمنع الحفظ تلقائياً في حال وجود تعارض لمعلم المادة في نفس الوقت مع شعبة أخرى.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                إلغاء
                            </button>
                            <button type="submit" disabled={processing} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70">
                                {processing ? 'جاري الحفظ...' : <><Check size={18} /> حفظ وتعيين</>}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}
