import React from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { CalendarDays, BookOpen, MapPin, Search, ShieldCheck, AlertCircle, User, Calculator, FlaskConical, Globe, Laptop, Music, Palette, Microscope, Languages, Feather, Clock } from 'lucide-react';
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
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-inner">
                                <Search size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white">الفصل الدراسي الحالي</h3>
                                <p className="text-xs font-bold text-slate-500">اختر الفصل لعرض حصصك وتكليفاتك</p>
                            </div>
                        </div>
                        <div className="w-full md:max-w-[300px]">
                            <SelectInput
                                options={allSemesters}
                                value={selectedSemesterId}
                                onChange={handleSemesterChange}
                                placeholder="اختر الفصل الدراسي"
                            />
                        </div>
                </div>

                {/* Timetable Grid */}
                {selectedSemesterId ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col relative z-10">
                        <div className="overflow-x-auto p-2 md:p-4 custom-scrollbar">
                            <table className="w-full text-right border-separate border-spacing-2">
                                <thead>
                                    <tr>
                                        <th className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl min-w-[140px] text-slate-700 dark:text-slate-300 font-black text-center shadow-sm sticky right-0 z-40 border border-slate-200 dark:border-slate-700">
                                            اليوم / الحصة
                                        </th>
                                        {periods.map((period) => (
                                            <th key={period.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl min-w-[200px] text-center shadow-sm border border-slate-200 dark:border-slate-700 group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-500/50">
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-200/20 dark:to-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute -inset-x-4 bottom-0 h-1 bg-primary-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-right duration-500"></div>
                                                <div className="font-black text-slate-900 dark:text-white mb-2 text-[15px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors relative z-10">{period.period_name}</div>
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400 font-bold shadow-sm relative z-10" dir="ltr">
                                                    <Clock size={12} className="text-primary-500" />
                                                    {period.start_time?.substring(0,5)} - {period.end_time?.substring(0,5)}
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
                                                            <div className="w-full h-full min-h-[140px] rounded-2xl flex flex-col items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(245,158,11,0.05)_10px,rgba(245,158,11,0.05)_20px)] border border-amber-200/30 dark:border-amber-500/20">
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
                                                                {(() => {
                                                                    const IconComponent = SUBJECT_ICONS[slot.subject?.icon] || BookOpen;
                                                                    return <div className="absolute -left-6 -bottom-6 opacity-[0.07] transform -rotate-12 group-hover/slot:scale-125 transition-transform duration-700 pointer-events-none"><IconComponent size={120} /></div>;
                                                                })()}
                                                                
                                                                <div className="relative z-10 flex items-start justify-between gap-2 mb-2">
                                                                    <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner group-hover/slot:scale-110 group-hover/slot:rotate-6 transition-transform duration-500">
                                                                        {(() => {
                                                                            const IconComponent = SUBJECT_ICONS[slot.subject?.icon] || BookOpen;
                                                                            return <IconComponent size={20} strokeWidth={1.5} className="text-current opacity-90" />;
                                                                        })()}
                                                                    </div>
                                                                    <div className="text-right flex-1 min-w-0 pt-0.5">
                                                                        <div className="font-black text-[15px] leading-tight line-clamp-2 drop-shadow-sm truncate" title={slot.subject?.name}>{slot.subject?.name}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs font-bold bg-white/40 dark:bg-black/20 px-2.5 py-1.5 rounded-xl shadow-sm w-max max-w-full relative z-10 mt-auto">
                                                                    <MapPin size={12} className="shrink-0 opacity-70" />
                                                                    <span className="truncate">{slot.division?.grade?.section?.name} / {slot.division?.name}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full min-h-[140px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/10 flex items-center justify-center text-slate-300 dark:text-slate-700">
                                                                <span className="opacity-0 group-hover/cell:opacity-100 transition-opacity text-xs font-black">فارغ</span>
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
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center relative overflow-hidden">
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-800 text-slate-400 mb-6 shadow-inner transform rotate-3">
                                <Search size={40} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">الجدول الدراسي غير متوفر</h3>
                            <p className="text-slate-500 font-semibold text-sm">قم باختيار الفصل الدراسي من الأعلى لاستعراض حصصك</p>
                        </div>
                    </div>
                )}

                {/* Today's Coverage Assignments */}
                {coverages && coverages.length > 0 && (
                    <div className="relative group/coverage mt-10 z-20">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 rounded-[2.5rem] blur opacity-25 animate-[pulse_4s_ease-in-out_infinite]"></div>
                        <div className="relative bg-white/80 dark:bg-[#121820]/90 backdrop-blur-2xl rounded-[2.5rem] border border-amber-200/50 dark:border-amber-500/20 shadow-xl shadow-amber-500/10 overflow-hidden">
                            <div className="flex items-center justify-between p-6 md:p-8 border-b border-amber-100/50 dark:border-amber-500/10 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-900/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                                        <AlertCircle size={28} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-slate-900 dark:text-white mb-1">تغطياتك لليوم</h3>
                                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                            لديك تكليف بتغطية {coverages.length} حصة نيابةً عن زملائك المعلمين
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 bg-gradient-to-b from-transparent to-slate-50/30 dark:to-slate-900/30">
                                {coverages.map(coverage => (
                                    <div key={coverage.id} className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-3xl p-5 border border-amber-200/50 dark:border-amber-500/30 shadow-md hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-1 transition-all duration-300 group/card">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                                        <div className="absolute -left-6 -bottom-6 opacity-[0.05] text-amber-600 transform -rotate-12 group-hover/card:scale-125 transition-transform duration-700 pointer-events-none">
                                            <ShieldCheck size={120} />
                                        </div>
                                        
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-xs font-black bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-xl shadow-sm border border-amber-200/50 dark:border-amber-500/30">
                                                    {coverage.period?.period_name}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg" dir="ltr">
                                                    <Clock size={12} className="text-amber-500" />
                                                    {coverage.period?.start_time?.substring(0,5)} - {coverage.period?.end_time?.substring(0,5)}
                                                </span>
                                            </div>
                                            
                                            <div className="mb-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0 shadow-inner group-hover/card:scale-110 group-hover/card:rotate-6 transition-transform duration-500">
                                                        <BookOpen size={20} strokeWidth={1.5} />
                                                    </div>
                                                    <p className="font-black text-lg text-slate-900 dark:text-white leading-tight drop-shadow-sm">{coverage.subject?.name || 'تغطية طارئة'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-auto space-y-2">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-bold bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                                    <MapPin size={14} className="text-amber-500 shrink-0" />
                                                    <span>الفصل: {coverage.division?.grade?.section?.name} / {coverage.division?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-bold bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-100 dark:border-amber-500/20">
                                                    <User size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                                    <span className="text-amber-700 dark:text-amber-400">نيابةً عن: {coverage.absent_teacher?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
