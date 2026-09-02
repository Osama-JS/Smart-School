import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, Calendar, ChevronLeft, Users, AlertCircle, Layers, Filter, X, ChevronDown } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';

export default function MonthlyGradesReportIndex({ periods, divisions, assignedSubjects, isAdmin, isTeacher }) {
    const [selectedPeriod, setSelectedPeriod] = useState(periods[0]?.id || '');
    const [selectedGradeId, setSelectedGradeId] = useState('');
    const [showFilters, setShowFilters] = useState(true);

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

    const selectedPeriodObj = periods.find(p => p.id == selectedPeriod);
    const selectedGradeObj  = grades.find(g => g.id == selectedGradeId);

    const activeFilters = [];
    if (selectedPeriodObj) activeFilters.push({ id: 'period', label: `فترة الرصد: ${selectedPeriodObj.month_name}` });
    if (selectedGradeObj)  activeFilters.push({ id: 'grade',  label: `الصف: ${selectedGradeObj.name}` });

    const removeFilter = (filterId) => {
        if (filterId === 'period') { setSelectedPeriod(''); setSelectedGradeId(''); }
        if (filterId === 'grade')  { setSelectedGradeId(''); }
    };

    const clearFilters = () => {
        setSelectedPeriod('');
        setSelectedGradeId('');
    };

    return (
        <AdminLayout activeMenu="الدرجات الشهرية">
            <Head title="تقارير الدرجات الشهرية" />

            <div className="space-y-6">

                {/* Header */}
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400 z-20"></div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary-50 to-transparent pointer-events-none"></div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3.5 bg-white border border-primary-100 shadow-sm rounded-xl text-primary-600 flex-shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <BookOpen size={28} strokeWidth={2} className="relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-black text-slate-800 tracking-tight mb-1">
                                تقارير الدرجات الشهرية
                            </h1>
                            <p className="text-[13.5px] font-bold text-slate-500">
                                استعرض واطبع تقارير درجات الطلاب لكل شعبة ومادة
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>

                    <div className="p-5">
                        {/* Toggle button */}
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
                                <span className="text-[15px]">خيارات اختيار فترة الرصد والصف</span>
                                {activeFilters.length > 0 && (
                                    <span className="flex items-center justify-center bg-primary-500 text-white text-xs font-black w-6 h-6 rounded-full shadow-sm">
                                        {activeFilters.length}
                                    </span>
                                )}
                                <svg
                                    className={`w-5 h-5 mr-auto transition-transform duration-300 ${showFilters ? 'rotate-180 text-primary-600' : 'text-slate-400'}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Quick period summary */}
                            {selectedPeriodObj && !showFilters && (
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
                                    <Calendar size={16} className="text-primary-500" />
                                    <span>{selectedPeriodObj.month_name}</span>
                                    {selectedGradeObj && (
                                        <>
                                            <span className="text-slate-300">|</span>
                                            <Layers size={16} className="text-primary-500" />
                                            <span>{selectedGradeObj.name}</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Active filter chips */}
                        {activeFilters.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-slate-100">
                                <span className="text-sm font-bold text-slate-500 ml-2">الاختيارات النشطة:</span>
                                {activeFilters.map(filter => (
                                    <span key={filter.id} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary-200 text-primary-700 text-sm font-bold shadow-sm group">
                                        {filter.label}
                                        <button type="button" onClick={() => removeFilter(filter.id)} className="p-0.5 rounded-full hover:bg-red-50 text-slate-400 group-hover:text-red-500 transition-colors">
                                            <X size={14} strokeWidth={2.5} />
                                        </button>
                                    </span>
                                ))}
                                <button onClick={clearFilters} className="text-sm text-slate-400 hover:text-red-600 font-bold px-3 transition-colors mr-auto flex items-center gap-1">
                                    <X size={14} strokeWidth={2.5} /> مسح الاختيارات
                                </button>
                            </div>
                        )}

                        {/* Collapsible filter fields */}
                        <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Period Selector */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                                            <Calendar size={15} className="text-primary-500" />
                                            فترة الرصد
                                        </label>
                                        <SelectInput
                                            value={selectedPeriod}
                                            onChange={(val) => { setSelectedPeriod(val); setSelectedGradeId(''); }}
                                            placeholder="-- يرجى اختيار فترة الرصد --"
                                            options={periods.map(period => ({
                                                value: period.id,
                                                label: `${period.month_name} (${String(period.fill_start_date).split('T')[0]} إلى ${String(period.fill_end_date).split('T')[0]})`
                                            }))}
                                        />
                                        {selectedPeriodObj && (
                                            <p className="text-xs text-slate-500 font-semibold mt-1.5 pr-1">
                                                من {String(selectedPeriodObj.fill_start_date).split('T')[0]} إلى {String(selectedPeriodObj.fill_end_date).split('T')[0]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Grade Selector */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                                            <Layers size={15} className="text-primary-500" />
                                            الصف الدراسي
                                        </label>
                                        <SelectInput
                                            value={selectedGradeId}
                                            onChange={(val) => setSelectedGradeId(val)}
                                            isDisabled={!selectedPeriod}
                                            placeholder={!selectedPeriod ? 'اختر فترة الرصد أولاً...' : '-- يرجى اختيار الصف الدراسي --'}
                                            options={grades.map(grade => ({
                                                value: grade.id,
                                                label: grade.name
                                            }))}
                                        />
                                        {!selectedPeriod && (
                                            <p className="text-xs text-amber-600 font-semibold mt-1.5 pr-1 flex items-center gap-1">
                                                <AlertCircle size={12} /> يجب اختيار فترة الرصد أولاً
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div>
                    {!selectedPeriod ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-5">
                                <Calendar className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-600 dark:text-slate-400 mb-2">لم يتم تحديد فترة الرصد</h3>
                            <p className="text-slate-400 font-semibold mb-6">يرجى اختيار فترة الرصد من لوحة الفلترة للبدء.</p>
                            <button
                                onClick={() => setShowFilters(true)}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-sm"
                            >
                                <Filter size={16} strokeWidth={2.5} />
                                فتح خيارات الفلترة
                            </button>
                        </div>
                    ) : !selectedGradeId ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-5">
                                <Layers className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-600 dark:text-slate-400 mb-2">لم يتم تحديد الصف الدراسي</h3>
                            <p className="text-slate-400 font-semibold mb-1">
                                تم تحديد فترة الرصد: <span className="text-primary-600 font-black">{selectedPeriodObj?.month_name}</span>
                            </p>
                            <p className="text-slate-400 font-semibold mb-6">يرجى اختيار الصف الدراسي لعرض الشعب والمواد المتاحة.</p>
                            <button
                                onClick={() => setShowFilters(true)}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-sm"
                            >
                                <Layers size={16} strokeWidth={2.5} />
                                اختيار الصف الدراسي
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Section header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-7 bg-primary-500 rounded-full"></div>
                                    <h2 className="text-lg font-black text-slate-700">
                                        شعب {selectedGradeObj?.name}
                                        <span className="text-sm font-bold text-slate-400 mr-2">— {selectedPeriodObj?.month_name}</span>
                                    </h2>
                                </div>
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                                    {filteredDivisions.length} شعبة
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredDivisions.map(division => {
                                    const subjects = assignedSubjects[division.id] || [];
                                    return (
                                        <div key={division.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all group flex flex-col shadow-sm">
                                            {/* Division header */}
                                            <div className="bg-gradient-to-r from-slate-50 to-white p-5 border-b border-slate-100 flex items-center justify-between group-hover:from-primary-50/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center font-bold shadow-sm">
                                                        <Users className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-base text-slate-800 leading-tight">
                                                            {division.grade?.name}
                                                        </h3>
                                                        <p className="text-sm font-bold text-slate-500">
                                                            شعبة {division.name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="px-2.5 py-1 bg-slate-100 group-hover:bg-primary-100 group-hover:text-primary-700 rounded-lg text-xs font-black text-slate-500 transition-colors">
                                                        {subjects.length} مواد
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Subject links */}
                                            <div className="p-4 flex flex-col gap-2.5 flex-1">
                                                {subjects.length > 0 ? (
                                                    subjects.map(assignment => (
                                                        <Link
                                                            key={assignment.id}
                                                            href={route('academic.monthly-grades.report.view', {
                                                                division: division.id,
                                                                subject_id: assignment.subject_id,
                                                                period: selectedPeriod
                                                            })}
                                                            className="flex items-center justify-between bg-slate-50 hover:bg-primary-50 p-3.5 rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-sm transition-all group/link"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-2 h-2 rounded-full bg-primary-300 group-hover/link:bg-primary-500 transition-colors"></div>
                                                                <span className="font-bold text-slate-700 group-hover/link:text-primary-700 transition-colors text-sm">
                                                                    {assignment.subject?.name}
                                                                </span>
                                                            </div>
                                                            <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover/link:bg-primary-100 group-hover/link:border-primary-300 group-hover/link:text-primary-600 transition-all shadow-sm">
                                                                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover/link:text-primary-600" />
                                                            </div>
                                                        </Link>
                                                    ))
                                                ) : (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                                                        <AlertCircle className="w-6 h-6 text-amber-400 mb-2" />
                                                        <p className="text-sm font-bold text-slate-500">لا توجد مواد مسندة</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">لم يتم إسناد مواد لهذه الشعبة</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredDivisions.length === 0 && (
                                    <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                                        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-600 mb-1">لا توجد شعب</h3>
                                        <p className="text-slate-400 font-semibold">
                                            لا توجد شعب مسجلة لصف {selectedGradeObj?.name}.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
