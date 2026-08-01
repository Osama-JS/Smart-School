import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Clock, ShieldAlert, Calendar, AlertTriangle, CheckCircle, ChevronDown, Activity, AlertCircle, Info, Hash } from 'lucide-react';
import ChildSelector from '@/Components/ChildSelector';

export default function AttendanceIndex({ stats, subjectBreakdown, history, heatmapData, dangerLimitDays, dangerLimitClasses, children, activeChildId }) {
    
    // Calculate danger percentages
    const daysDangerPercentage = Math.min((stats.daysAbsent / dangerLimitDays) * 100, 100);
    const classesDangerPercentage = Math.min((stats.classesAbsent / dangerLimitClasses) * 100, 100);
    
    const getDangerColor = (percentage) => {
        if (percentage < 50) return 'bg-emerald-500';
        if (percentage < 80) return 'bg-amber-500';
        return 'bg-rose-600';
    };

    const getDangerTextColor = (percentage) => {
        if (percentage < 50) return 'text-emerald-600 dark:text-emerald-400';
        if (percentage < 80) return 'text-amber-600 dark:text-amber-400';
        return 'text-rose-600 dark:text-rose-400';
    };

    const translateStatus = (status) => {
        switch(status) {
            case 'present': return { label: 'حاضر', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' };
            case 'absent': return { label: 'غائب', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' };
            case 'late': return { label: 'متأخر', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' };
            case 'excused': return { label: 'مستأذن', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' };
            case 'unexcused': return { label: 'غياب بدون عذر', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' };
            default: return { label: status, color: 'bg-slate-100 text-slate-700' };
        }
    };

    return (
        <AdminLayout activeMenu="الحضور والغياب">
            <Head title="الحضور والغياب" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">
                <ChildSelector children={children} activeChildId={activeChildId} />

                {/* Main Stats Header */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820]/95 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-dark-800" />
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/30 shadow-inner">
                                <Activity size={32} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">الحضور والغياب</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
                                    <Info size={16} />
                                    متابعة المؤشرات الخاصة بانضباطك الأكاديمي
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'أيام الغياب', value: stats.daysAbsent, icon: Calendar, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', glow: 'bg-rose-500/5' },
                        { title: 'حصص الغياب', value: stats.classesAbsent, icon: Hash, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', glow: 'bg-orange-500/5' },
                        { title: 'التأخر (حصص)', value: stats.classesLate, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', glow: 'bg-amber-500/5' },
                        { title: 'الاستئذان', value: stats.classesExcused, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', glow: 'bg-emerald-500/5' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#121820]/40 backdrop-blur-xl border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                            <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glow} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}>
                                    <stat.icon size={24} strokeWidth={2} />
                                </div>
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none font-mono tracking-tight">{stat.value}</h3>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">{stat.title}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Danger Bar: Days */}
                    <div className="bg-white dark:bg-[#121820]/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">مؤشر الخطر (بالأيام)</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className={`text-3xl font-black ${getDangerTextColor(daysDangerPercentage)}`}>{stats.daysAbsent}</span>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold mr-1">/ {dangerLimitDays} أيام</span>
                                </div>
                                <span className={`text-sm font-bold px-3 py-1 rounded-full ${daysDangerPercentage >= 80 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                    {daysDangerPercentage.toFixed(0)}%
                                </span>
                            </div>
                            
                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                <div 
                                    className={`h-full transition-all duration-1000 ${getDangerColor(daysDangerPercentage)}`}
                                    style={{ width: `${daysDangerPercentage}%` }}
                                />
                            </div>
                            
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                                <AlertCircle size={14} />
                                {daysDangerPercentage >= 80 ? 'تحذير: اقتربت جداً من الحد الأقصى للغياب المسموح!' : 'أنت في النطاق الآمن حتى الآن.'}
                            </p>
                        </div>
                    </div>

                    {/* Danger Bar: Classes */}
                    <div className="bg-white dark:bg-[#121820]/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
                                <ShieldAlert size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">مؤشر الخطر (بالحصص)</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className={`text-3xl font-black ${getDangerTextColor(classesDangerPercentage)}`}>{stats.classesAbsent}</span>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold mr-1">/ {dangerLimitClasses} حصة</span>
                                </div>
                                <span className={`text-sm font-bold px-3 py-1 rounded-full ${classesDangerPercentage >= 80 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                    {classesDangerPercentage.toFixed(0)}%
                                </span>
                            </div>
                            
                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                <div 
                                    className={`h-full transition-all duration-1000 ${getDangerColor(classesDangerPercentage)}`}
                                    style={{ width: `${classesDangerPercentage}%` }}
                                />
                            </div>
                            
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                                <AlertCircle size={14} />
                                يشمل هذا العداد غيابك عن الحصص بشكل منفرد خلال اليوم.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Subject Breakdown */}
                    <div className="lg:col-span-1 bg-white dark:bg-[#121820]/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col h-[500px]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <Activity size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">الغياب حسب المادة</h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                            {subjectBreakdown.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                                    <CheckCircle size={48} className="mb-3 text-emerald-400 opacity-50" strokeWidth={1} />
                                    <p className="font-bold">سجلك خالي من الغياب!</p>
                                    <p className="text-sm mt-1">استمر على هذا التميز.</p>
                                </div>
                            ) : (
                                subjectBreakdown.map((item, idx) => {
                                    // Calculate percentage relative to highest for visual scale
                                    const highest = subjectBreakdown[0].absences;
                                    const percent = (item.absences / highest) * 100;
                                    
                                    return (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{item.name}</span>
                                                <span className="text-slate-500 dark:text-slate-400">{item.absences} حصص</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Detailed History */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#121820]/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col h-[500px]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
                                <Clock size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">سجل الغياب والتأخر</h3>
                        </div>
                        
                        <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            {history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                                    <CheckCircle size={48} className="mb-3 text-emerald-400 opacity-50" strokeWidth={1} />
                                    <p className="font-bold">لا يوجد سجلات للعرض.</p>
                                </div>
                            ) : (
                                <table className="w-full text-right border-collapse whitespace-nowrap">
                                    <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur z-10 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-5 py-4 text-sm font-black text-slate-500 dark:text-slate-400">التاريخ</th>
                                            <th className="px-5 py-4 text-sm font-black text-slate-500 dark:text-slate-400">الحصة</th>
                                            <th className="px-5 py-4 text-sm font-black text-slate-500 dark:text-slate-400">المادة</th>
                                            <th className="px-5 py-4 text-sm font-black text-slate-500 dark:text-slate-400">المعلم</th>
                                            <th className="px-5 py-4 text-sm font-black text-slate-500 dark:text-slate-400">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {history.map((record, index) => {
                                            const statusLabel = translateStatus(record.status);
                                            return (
                                                <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <div className="font-bold text-slate-700 dark:text-slate-300 font-mono" dir="ltr">
                                                            {new Date(record.date).toLocaleDateString('en-GB')}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-400">
                                                        {record.period?.name || 'غير محدد'}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-400">
                                                        {record.subject?.name || 'غير محدد'}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-400">
                                                        {record.teacher?.name || 'غير محدد'}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${statusLabel.color}`}>
                                                            {statusLabel.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
