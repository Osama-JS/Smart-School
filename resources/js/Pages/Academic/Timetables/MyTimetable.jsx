import React from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { CalendarDays, BookOpen, MapPin, Search } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';

export default function MyTimetable({ academicYears, periods, timetable, workingDays, daysTranslation, selectedSemesterId }) {
    
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
                <div className="flex items-center gap-4 bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-500/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-700" />
                    <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner">
                        <CalendarDays size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">جدولي الدراسي</h1>
                        <p className="text-sm text-slate-500 mt-1">توزيع حصصك على الفصول الدراسية</p>
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
                                                    <td key={`${day}-${period.id}`} className={`border-b border-l last:border-l-0 border-slate-200 dark:border-slate-700 p-2 align-top h-28 transition-colors ${slot ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}>
                                                        {slot ? (
                                                            <div className="h-full bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800 rounded-xl shadow-sm shadow-indigo-500/20 p-3 flex flex-col justify-between text-white relative overflow-hidden group hover:-translate-y-0.5 transition-transform cursor-default">
                                                                <div className="absolute -right-4 -bottom-4 opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform">
                                                                    <BookOpen size={64} />
                                                                </div>
                                                                <div className="font-bold text-sm mb-2 relative z-10 flex items-start justify-between">
                                                                    <span>{slot.subject.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-indigo-100 text-xs mt-auto relative z-10 bg-black/20 w-fit px-2 py-1 rounded-md">
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
            </div>
        </AdminLayout>
    );
}
