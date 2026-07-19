import React from 'react';
import dayjs from 'dayjs';
import { Clock, MapPin, AlertCircle, Calendar } from 'lucide-react';

export default function TimelineView({ dates, grades, getGroupedItemsForCell, getSubjectLightColor, searchQuery, checkMatch }) {
    // Timeline config
    const startHour = 7;
    const endHour = 14;
    const totalHours = endHour - startHour;
    
    // Generate hour markers (07:00, 08:00, ..., 14:00)
    const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

    // Calculate left offset percentage and width percentage based on time
    const calculatePosition = (startTime, endTime) => {
        if (!startTime || !endTime) return null;
        
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        
        const startTotalMinutes = (startH * 60) + startM;
        const endTotalMinutes = (endH * 60) + endM;
        const timelineStartMinutes = startHour * 60;
        const timelineTotalMinutes = totalHours * 60;
        
        let leftPercent = ((startTotalMinutes - timelineStartMinutes) / timelineTotalMinutes) * 100;
        let widthPercent = ((endTotalMinutes - startTotalMinutes) / timelineTotalMinutes) * 100;
        
        // Clamp to 0-100% just in case an exam starts before 7am or ends after 2pm
        if (leftPercent < 0) {
            widthPercent += leftPercent;
            leftPercent = 0;
        }
        if (leftPercent + widthPercent > 100) {
            widthPercent = 100 - leftPercent;
        }
        
        return { left: `${leftPercent}%`, width: `${widthPercent}%` };
    };

    return (
        <div className="space-y-12 pb-8">
            {dates.length === 0 ? (
                <div className="mt-8 text-center">
                    <div className="inline-flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2">لا توجد أيام مجدولة بعد</h3>
                    </div>
                </div>
            ) : (
                dates.map(date => {
                    const dateObj = dayjs(date);
                    
                    return (
                        <div key={date} className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-200/60 dark:border-slate-700/60 overflow-hidden relative">
                            {/* Header: Date */}
                            <div className="bg-slate-50/80 dark:bg-slate-900/50 px-8 py-5 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between shadow-sm backdrop-blur-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/50 dark:bg-primary-900/20 rounded-full blur-3xl -mt-10 -mr-10"></div>
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                                        <Calendar size={24} className="text-primary-500" />
                                        {dateObj.format('dddd')}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 text-sm bg-white dark:bg-slate-800 w-fit px-3 py-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">{dateObj.format('YYYY/MM/DD')}</p>
                                </div>
                            </div>
                            
                            {/* Timeline Area */}
                            <div className="p-6 overflow-x-auto custom-scrollbar">
                                <div className="min-w-[800px] relative pt-10 pb-6 pr-[150px]">
                                    
                                    {/* Timeline Grid (Background) */}
                                    <div className="absolute inset-0 right-[150px] flex">
                                        {hours.map((hour, idx) => (
                                            <div key={hour} className="flex-1 border-r border-dashed border-slate-200 dark:border-slate-700/50 relative h-full">
                                                {/* Hour Label */}
                                                <div className="absolute top-2 -right-5 w-10 text-center text-xs font-black text-slate-400 dark:text-slate-500">
                                                    {hour.toString().padStart(2, '0')}:00
                                                </div>
                                                {/* End of timeline label */}
                                                {idx === hours.length - 1 && (
                                                    <div className="absolute top-2 -left-5 w-10 text-center text-xs font-black text-slate-400 dark:text-slate-500">
                                                        {(hour + 1).toString().padStart(2, '0')}:00
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Rows (Grades) */}
                                    <div className="relative z-10 pt-8 space-y-4">
                                        {grades.map(grade => {
                                            const groups = getGroupedItemsForCell(date, grade.id);
                                            const timedExams = groups.filter(g => g.start_time && g.end_time);
                                            const untimedExams = groups.filter(g => !g.start_time || !g.end_time);
                                            
                                            // Don't render grade row if empty
                                            if (groups.length === 0) return null;
                                            
                                            return (
                                                <div key={grade.id} className="flex items-stretch gap-4 min-h-[80px]">
                                                    {/* Grade Label */}
                                                    <div className="absolute right-0 w-[134px] flex-shrink-0 flex items-center justify-center p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-slate-200 dark:border-slate-700/60 font-black text-slate-700 dark:text-slate-300 text-center shadow-sm z-20">
                                                        {grade.name}
                                                    </div>
                                                    
                                                    {/* Bars Area */}
                                                    <div className="flex-1 relative bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl border-2 border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-colors">
                                                        {timedExams.map((exam, idx) => {
                                                            const pos = calculatePosition(exam.start_time, exam.end_time);
                                                            if (!pos) return null;
                                                            
                                                            const bgColor = getSubjectLightColor(exam.subject_id);
                                                            const isMatch = checkMatch ? checkMatch(exam) : true;
                                                            const dimmingClasses = !isMatch && searchQuery ? 'opacity-20 grayscale scale-95 z-0' : (searchQuery ? 'ring-2 ring-primary-500 shadow-lg scale-[1.02] z-30 bg-white dark:bg-slate-800' : '');
                                                            
                                                            return (
                                                                <div 
                                                                    key={idx}
                                                                    className={`absolute top-2 bottom-2 rounded-2xl border-2 p-3 flex flex-col justify-center overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:z-40 cursor-default ${bgColor} ${dimmingClasses} backdrop-blur-sm`}
                                                                    style={{ 
                                                                        right: pos.left, // Because RTL
                                                                        width: pos.width,
                                                                        minWidth: '90px'
                                                                    }}
                                                                >
                                                                    <div className="font-black text-sm md:text-base truncate drop-shadow-sm" title={exam.subject_name}>{exam.subject_name}</div>
                                                                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold opacity-80 flex-wrap">
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock size={12} /> {exam.start_time.substring(0,5)} - {exam.end_time.substring(0,5)}
                                                                        </div>
                                                                        {exam.room && (
                                                                            <div className="flex items-center gap-1">
                                                                                <MapPin size={12} /> {exam.room}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    
                                                    {/* Untimed Exams Bucket */}
                                                    {untimedExams.length > 0 && (
                                                        <div className="w-[200px] flex-shrink-0 flex flex-col gap-2 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-800/50 justify-center">
                                                            <div className="text-xs font-black text-amber-600 dark:text-amber-500 text-center flex items-center justify-center gap-1 mb-1">
                                                                <AlertCircle size={14} /> غير محدد الوقت
                                                            </div>
                                                            {untimedExams.map((exam, idx) => {
                                                                const isMatch = checkMatch ? checkMatch(exam) : true;
                                                                const dimmingClasses = !isMatch && searchQuery ? 'opacity-20 grayscale scale-95' : (searchQuery ? 'ring-2 ring-primary-500 shadow-md scale-105 bg-white dark:bg-slate-800' : '');
                                                                
                                                                return (
                                                                    <div key={idx} className={`p-2 rounded-xl border-2 text-xs font-extrabold truncate text-center transition-all duration-500 ${getSubjectLightColor(exam.subject_id)} ${dimmingClasses}`}>
                                                                        {exam.subject_name}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
