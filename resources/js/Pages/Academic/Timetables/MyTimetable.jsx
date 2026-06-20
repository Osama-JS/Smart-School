import React from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { CalendarDays, BookOpen, MapPin, Search, ShieldCheck, AlertCircle, User } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';

export default function MyTimetable({ academicYears, periods, timetable, coverages, workingDays, daysTranslation, selectedSemesterId }) {
    
    const getSlotData = (day, periodId) => {
        return timetable.find(t => t.day_of_week === day && t.period_id === periodId);
    };

    const handleSemesterChange = (val) => {
        if (!val) return;
        router.get(route('academic.my-timetable'), { semester_id: val }, { preserveState: true });
    };

    // Flatten all semesters from all years to show in a single dropdown
    const allSemesters = academicYears.flatMap(y => 
        y.semesters.map(s => ({ value: s.id, label: `${y.name} - ${s.name}` }))
    );

    return (
        <AdminLayout activeMenu="جدولي">
            <Head title="جدولي الدراسي | النظام الأكاديمي" />

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

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
                                <CalendarDays size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">جدولي الدراسي</h1>
                                <p className="text-sm font-semibold text-primary-700/80 dark:text-primary-300/80 mt-1">توزيع حصصك على الفصول الدراسية</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="w-full max-w-md flex items-center gap-4">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">الفصل الدراسي:</label>
                        <div className="flex-1">
                            <SelectInput
                                options={allSemesters}
                                value={selectedSemesterId}
                                onChange={handleSemesterChange}
                                placeholder="اختر الفصل الدراسي"
                            />
                        </div>
                    </div>
                </div>

                {/* Timetable Grid */}
                {selectedSemesterId ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr>
                                        <th className="bg-slate-50 dark:bg-slate-900 border-b border-l border-slate-200 dark:border-slate-700 p-4 min-w-[120px] text-slate-600 dark:text-slate-300 font-bold text-center">
                                            اليوم / الحصة
                                        </th>
                                        {periods.map((period) => (
                                            <th key={period.id} className="bg-slate-50 dark:bg-slate-900 border-b border-l last:border-l-0 border-slate-200 dark:border-slate-700 p-4 min-w-[160px] text-center">
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
                                                    <td key={`${day}-${period.id}`} className={`border-b border-l last:border-l-0 border-slate-200 dark:border-slate-700 p-2 align-top h-28 transition-colors ${slot ? 'bg-primary-50/30 dark:bg-primary-500/5' : ''}`}>
                                                        {slot ? (
                                                            <div className="h-full bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-800 rounded-xl shadow-sm shadow-primary-500/20 p-3 flex flex-col justify-between text-white relative overflow-hidden group hover:-translate-y-0.5 transition-transform cursor-default">
                                                                <div className="absolute -right-4 -bottom-4 opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform">
                                                                    <BookOpen size={64} />
                                                                </div>
                                                                <div className="font-bold text-sm mb-2 relative z-10 flex items-start justify-between">
                                                                    <span>{slot.subject.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-primary-100 text-xs mt-auto relative z-10 bg-black/20 w-fit px-2 py-1 rounded-md">
                                                                    <MapPin size={12} />
                                                                    <span>{slot.division.grade.section.name} / {slot.division.name}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-700">
                                                                -
                                                            </div>
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
                    <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 mb-4">
                            <Search size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">لا توجد فصول دراسية نشطة حالياً</h3>
                    </div>
                )}

                {/* Today's Coverage Assignments */}
                {coverages && coverages.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 p-5 border-b border-amber-100 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white">تغطيات اليوم المكلف بها</h3>
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                                    أنت مكلف بتغطية {coverages.length} حصة اليوم نيابةً عن زملائك
                                </p>
                            </div>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {coverages.map(coverage => (
                                <div key={coverage.id} className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-2xl p-4 text-white shadow-md shadow-amber-500/20 hover:-translate-y-0.5 transition-transform">
                                    <div className="absolute -left-4 -bottom-4 opacity-10">
                                        <ShieldCheck size={72} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold bg-black/20 px-2.5 py-1 rounded-lg">{coverage.period?.period_name}</span>
                                            <span className="text-xs font-mono" dir="ltr">
                                                {coverage.period?.start_time?.substring(0,5)} - {coverage.period?.end_time?.substring(0,5)}
                                            </span>
                                        </div>
                                        <p className="font-bold text-base mb-1">{coverage.subject?.name || 'تغطية'}</p>
                                        <div className="flex items-center gap-1.5 text-amber-100 text-xs mb-2">
                                            <MapPin size={12} />
                                            <span>{coverage.division?.grade?.section?.name} / {coverage.division?.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-amber-100 text-xs bg-black/20 px-2.5 py-1.5 rounded-lg w-fit">
                                            <User size={12} />
                                            <span>نيابةً عن: {coverage.absent_teacher?.name}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
