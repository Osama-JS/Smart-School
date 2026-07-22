import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import { Clock, MapPin, AlertCircle, Calendar } from 'lucide-react';

export default function TimelineView({ dates, grades, getGroupedItemsForCell, getSubjectLightColor, searchQuery, checkMatch, getConflicts }) {
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
                <div className="mt-8 relative rounded-[2rem] bg-white dark:bg-slate-900 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-700/80 overflow-hidden p-20 flex flex-col items-center text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-800/30 dark:to-slate-900/80 pointer-events-none"></div>
                    <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                        <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-2xl opacity-60"></div>
                        <div className="relative w-28 h-28 bg-gradient-to-br from-white to-primary-50 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] rotate-3 flex items-center justify-center border border-white dark:border-slate-700 shadow-2xl shadow-primary-500/10 transition-transform hover:rotate-6 hover:scale-105 duration-500">
                            <Clock size={48} className="text-primary-400 dark:text-primary-500 -rotate-3" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 mb-3 tracking-tight relative z-10">المخطط الزمني فارغ</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md text-base font-medium leading-relaxed relative z-10">قم بإضافة الأيام والمواد للبدء في عرض المخطط الزمني وتتبع فترات الاختبارات بدقة واحترافية.</p>
                </div>
            ) : (
                dates.map(date => {
                    const dateObj = dayjs(date);
                    
                    return (
                        <div key={date} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-700/80 overflow-hidden relative mb-4">
                            {/* Header: Date */}
                            <div className="bg-slate-50/80 dark:bg-slate-800/50 px-8 py-6 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-sm backdrop-blur-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/40 dark:bg-primary-900/20 rounded-full blur-3xl -mt-20 -mr-20 pointer-events-none"></div>
                                <div className="relative z-10 flex items-center gap-5">
                                    <div className="p-3 bg-gradient-to-br from-primary-600 to-primary-500 dark:from-primary-500 dark:to-primary-400 rounded-2xl text-white shadow-lg shadow-primary-500/25">
                                        <Calendar size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                            {dateObj.locale('ar').format('dddd')}
                                        </h2>
                                        <p className="text-primary-600 dark:text-primary-400 font-bold mt-1.5 text-sm bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-lg border border-primary-100 dark:border-primary-800/30 shadow-sm inline-block">{dateObj.format('YYYY/MM/DD')}</p>
                                    </div>
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
                                                    <div className="absolute right-0 w-[140px] flex-shrink-0 flex items-center justify-center p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-200/80 dark:border-slate-700/80 font-black text-slate-800 dark:text-white text-lg text-center shadow-[4px_0_20px_-5px_rgba(0,0,0,0.05)] z-20">
                                                        {grade.name}
                                                    </div>
                                                    
                                                    {/* Bars Area */}
                                                    <div className="flex-1 relative bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl border-2 border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-colors">
                                                        {timedExams.map((exam, idx) => {
                                                            const pos = calculatePosition(exam.start_time, exam.end_time);
                                                            if (!pos) return null;
                                                            
                                                            const bgColor = getSubjectLightColor(exam.subject_id);
                                                            const isMatch = checkMatch ? checkMatch(exam) : true;
                                                            const conflicts = getConflicts ? getConflicts(exam, date) : [];
                                                            const hasConflict = conflicts.length > 0;
                                                            const dimmingClasses = !isMatch && searchQuery ? 'opacity-20 grayscale scale-95 z-0' : (searchQuery ? 'ring-2 ring-primary-500 shadow-lg scale-[1.02] z-30 bg-white dark:bg-slate-800' : '');
                                                            const conflictClasses = hasConflict ? 'ring-4 ring-red-400/60 dark:ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] !border-red-400 dark:!border-red-500 !bg-red-50/90 dark:!bg-red-900/30' : '';
                                                            
                                                            return (
                                                                <div 
                                                                    key={idx}
                                                                    className={`absolute top-2 bottom-2 rounded-2xl border-2 p-3 flex flex-col justify-center overflow-visible transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:z-40 group/timeline cursor-default ${hasConflict ? conflictClasses : bgColor} ${dimmingClasses} backdrop-blur-sm`}
                                                                    style={{ 
                                                                        right: pos.left, // Because RTL
                                                                        width: pos.width,
                                                                        minWidth: '90px'
                                                                    }}
                                                                >
                                                                    {hasConflict && (
                                                                        <div className="absolute -top-3 -right-3 z-30 flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full shadow-lg shadow-red-500/40 cursor-help animate-pulse">
                                                                            <AlertCircle size={14} />
                                                                            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-56 p-3 bg-slate-800 dark:bg-slate-900 text-white text-xs font-bold rounded-2xl opacity-0 scale-95 group-hover/timeline:opacity-100 group-hover/timeline:scale-100 pointer-events-none transition-all duration-300 shadow-xl shadow-slate-900/20 border border-slate-700 before:content-[''] before:absolute before:left-full before:top-1/2 before:-translate-y-1/2 before:-ml-1 before:border-[6px] before:border-transparent before:border-l-slate-800 dark:before:border-l-slate-900 z-50 text-right">
                                                                                <div className="flex items-center gap-2 mb-2 text-red-400 border-b border-slate-700 pb-2">
                                                                                    <AlertCircle size={14} /> <span className="text-xs">تعارض في الجدول!</span>
                                                                                </div>
                                                                                <ul className="list-disc pr-4 space-y-1 text-slate-200">
                                                                                    {conflicts.map((c, i) => <li key={i}>{c}</li>)}
                                                                                </ul>
                                                                            </div>
                                                                        </div>
                                                                    )}
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
