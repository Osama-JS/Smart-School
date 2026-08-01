import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Users, Activity, TrendingUp, AlertTriangle, 
    Trophy, ChevronLeft, ArrowRight, User
} from 'lucide-react';

const CircularProgress = ({ value, max = 100, colorClass = "text-primary-500", label = "", icon: Icon }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const circleRadius = 30;
    const circleCircumference = 2 * Math.PI * circleRadius;
    const strokeDashoffset = circleCircumference - (percentage / 100) * circleCircumference;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative flex items-center justify-center w-16 h-16">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={circleRadius} stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-100/50 dark:text-slate-800/50" />
                    <circle cx="50" cy="50" r={circleRadius} stroke="currentColor" strokeWidth="8" fill="none" 
                        strokeDasharray={circleCircumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
                        className={`${colorClass} transition-all duration-1000 ease-out`} />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-slate-800 dark:text-white leading-none">{value}</span>
                </div>
            </div>
            {label && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{label}</span>}
        </div>
    );
};

export default function ParentOverview({ auth, children, overviewData, timeline }) {
    return (
        <AdminLayout user={auth.user} activeMenu="مركز التحكم الشامل">
            <Head title="نظرة عامة - بوابة ولي الأمر" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">
                
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/90 via-white to-white dark:from-[#1e293b] dark:via-[#121820] dark:to-[#121820] border border-primary-100 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-dark-800" />
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute right-0 bottom-0 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 z-10">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-amber-500 rounded-2xl blur opacity-30 animate-pulse" />
                                <div className="w-20 h-20 bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-700 rounded-2xl shadow-xl flex items-center justify-center relative overflow-hidden transform rotate-3">
                                    <Users size={36} className="text-primary-500" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
                                    مرحباً، {auth.user.name}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium flex items-center gap-2">
                                    <Activity size={18} />
                                    <span>نظرة عامة على الأبناء ({children.length})</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left/Main Column: Smart Cards */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 px-2">
                            <User className="text-primary-500" />
                            <span>البطاقات الذكية للأبناء</span>
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {children.map((child) => {
                                const stats = overviewData.find(d => d.id === child.id)?.stats || { absences: 0, violations: 0, points: 0 };
                                const enrollment = child.current_enrollment;
                                const gradeSection = enrollment?.division 
                                    ? `${enrollment.division.grade?.name} - شعبة ${enrollment.division.name}` 
                                    : 'غير مسجل';

                                return (
                                    <div key={child.id} className="group relative bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-200 dark:border-slate-700/50 p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-t-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="flex items-start gap-4 mb-6">
                                            {child.user?.profile_photo_path ? (
                                                <img 
                                                    src={`/storage/${child.user.profile_photo_path}`} 
                                                    alt={child.user?.name || 'صورة الطالب'}
                                                    className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white dark:border-slate-700"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-slate-700 dark:to-slate-800 border-2 border-white dark:border-slate-600 shadow-sm flex items-center justify-center">
                                                    <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                                                        {child.user?.name ? child.user.name.charAt(0) : 'ط'}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{child.user?.name || 'طالب غير معروف'}</h3>
                                                <span className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold">
                                                    {gradeSection}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-around items-center py-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl mb-6">
                                            <CircularProgress 
                                                value={stats.points} 
                                                max={100} 
                                                label="نقاط إنجاز" 
                                                colorClass="text-amber-500" 
                                            />
                                            <CircularProgress 
                                                value={stats.absences} 
                                                max={10} 
                                                label="أيام غياب" 
                                                colorClass={stats.absences > 3 ? "text-rose-500" : "text-emerald-500"} 
                                            />
                                            <CircularProgress 
                                                value={stats.violations} 
                                                max={5} 
                                                label="مخالفات" 
                                                colorClass={stats.violations > 0 ? "text-rose-500" : "text-slate-400"} 
                                            />
                                        </div>

                                        <Link 
                                            href={route('parent.dashboard', { child_id: child.id })}
                                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-50 hover:bg-primary-500 text-primary-600 hover:text-white dark:bg-primary-900/20 dark:hover:bg-primary-500 dark:text-primary-400 dark:hover:text-white rounded-xl font-bold transition-colors"
                                        >
                                            <span>لوحة التحكم الخاصة به</span>
                                            <ChevronLeft size={18} />
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Unified Timeline */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 px-2">
                            <Activity className="text-primary-500" />
                            <span>الأحداث الأخيرة المجمعة</span>
                        </h2>
                        
                        <div className="bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-200 dark:border-slate-700/50 p-6 shadow-sm">
                            {timeline.length > 0 ? (
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                                    {timeline.map((item, index) => {
                                        const IconComponent = item.icon === 'AlertTriangle' ? AlertTriangle : Trophy;
                                        
                                        return (
                                            <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                {/* Icon */}
                                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 ${item.bg} ${item.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}>
                                                    <IconComponent size={16} />
                                                </div>
                                                
                                                {/* Card */}
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                                            {item.student_name}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full">
                                                            {item.date}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm font-medium ${item.type === 'violation' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {item.title}
                                                    </p>
                                                    
                                                    <div className="mt-3 text-left">
                                                        <Link href={route('parent.dashboard', { child_id: item.student_id })} className="inline-flex items-center gap-1 text-xs font-bold text-primary-500 hover:text-primary-600">
                                                            <span>عرض</span>
                                                            <ArrowRight size={12} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Activity size={24} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-medium">لا توجد أحداث قريبة</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
