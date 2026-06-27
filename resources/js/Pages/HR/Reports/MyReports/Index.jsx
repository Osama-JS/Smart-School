import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FileText, Plus, Calendar, Clock, CheckCircle, Clock3, RotateCcw, Eye, ChevronLeft } from 'lucide-react';

export default function MyReportsIndex({ auth, templates, myReports, stats }) {
    
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock3 size={16} className="text-yellow-500" />;
            case 'reviewed': return <CheckCircle size={16} className="text-green-500" />;
            case 'returned': return <RotateCcw size={16} className="text-red-500" />;
            default: return <Clock3 size={16} className="text-slate-400" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'قيد المراجعة';
            case 'reviewed': return 'تمت المراجعة';
            case 'returned': return 'معاد للمراجعة';
            default: return status;
        }
    };

    const getPeriodTypeText = (type) => {
        switch (type) {
            case 'daily': return 'يومي';
            case 'weekly': return 'أسبوعي';
            case 'monthly': return 'شهري';
            case 'quarterly': return 'فصلي';
            case 'yearly': return 'سنوي';
            case 'custom': return 'مخصص';
            default: return type;
        }
    };

    const statsItems = stats ? [
        {
            title: 'إجمالي التقارير',
            value: stats.total,
            icon: FileText,
            color: 'primary',
            iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400',
            progressWidth: '100%',
            progressColor: 'bg-gradient-to-r from-primary-400 to-primary-600',
            glowBg: 'bg-primary-500/5',
            hoverBorder: 'hover:border-primary-200 dark:hover:border-primary-800/30',
            topLineHover: 'group-hover:bg-primary-500/20',
            ringColor: 'border-primary-500/20',
            badgeClass: 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 border-primary-100/30 dark:border-primary-500/20',
            badgeText: '100%',
            subText: 'من إجمالي التقارير'
        },
        {
            title: 'قيد المراجعة',
            value: stats.pending,
            icon: Clock3,
            color: 'warning',
            iconBg: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400',
            progressWidth: stats.total > 0 ? `${((stats.pending / stats.total) * 100).toFixed(1)}%` : '0%',
            progressColor: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
            glowBg: 'bg-yellow-500/5',
            hoverBorder: 'hover:border-yellow-200 dark:hover:border-yellow-800/30',
            topLineHover: 'group-hover:bg-yellow-500/20',
            ringColor: 'border-yellow-500/20',
            badgeClass: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-100/30 dark:border-yellow-500/20',
            badgeText: stats.total > 0 ? `${((stats.pending / stats.total) * 100).toFixed(0)}%` : '0%',
            subText: 'نسبة التقارير قيد المراجعة'
        },
        {
            title: 'تمت المراجعة',
            value: stats.reviewed,
            icon: CheckCircle,
            color: 'success',
            iconBg: 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400',
            progressWidth: stats.total > 0 ? `${((stats.reviewed / stats.total) * 100).toFixed(1)}%` : '0%',
            progressColor: 'bg-gradient-to-r from-green-400 to-green-600',
            glowBg: 'bg-green-500/5',
            hoverBorder: 'hover:border-green-200 dark:hover:border-green-800/30',
            topLineHover: 'group-hover:bg-green-500/20',
            ringColor: 'border-green-500/20',
            badgeClass: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100/30 dark:border-green-500/20',
            badgeText: stats.total > 0 ? `${((stats.reviewed / stats.total) * 100).toFixed(0)}%` : '0%',
            subText: 'التقارير المعتمدة'
        },
        {
            title: 'معادة للتعديل',
            value: stats.returned,
            icon: RotateCcw,
            color: 'danger',
            iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400',
            progressWidth: stats.total > 0 ? `${((stats.returned / stats.total) * 100).toFixed(1)}%` : '0%',
            progressColor: 'bg-gradient-to-r from-red-400 to-red-600',
            glowBg: 'bg-red-500/5',
            hoverBorder: 'hover:border-red-200 dark:hover:border-red-800/30',
            topLineHover: 'group-hover:bg-red-500/20',
            ringColor: 'border-red-500/20',
            badgeClass: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100/30 dark:border-red-500/20',
            badgeText: stats.total > 0 ? `${((stats.returned / stats.total) * 100).toFixed(0)}%` : '0%',
            subText: 'يجب تعديلها'
        }
    ] : [];

    return (
        <AdminLayout user={auth.user}>
            <Head title="تقاريري" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Visual geometric lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight flex items-center gap-3">
                                <FileText className="text-primary-500" size={32} />
                                تقاريري
                            </h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">استعرض التقارير المرفوعة مسبقاً، وقم بإنشاء تقارير جديدة من القوالب المتاحة لدرجتك الوظيفية.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="flex items-center gap-2">
                        <FileText size={20} className="text-primary-500" />
                        <h2 className="text-lg font-black text-slate-800 dark:text-white">نماذج التقارير المتاحة</h2>
                    </div>
                    {templates.length === 0 ? (
                        <div className="bg-white/50 dark:bg-[#121820]/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] p-10 text-center shadow-inner">
                            <FileText className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={56} strokeWidth={1.5} />
                            <h3 className="text-slate-800 dark:text-slate-200 font-black text-lg mb-2">لا توجد قوالب متاحة</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">لم يتم تعيين أي قوالب تقارير لدرجتك الوظيفية حالياً. يرجى مراجعة إدارة النظام.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {templates.map(template => (
                                <div key={template.id} className="group bg-white/70 dark:bg-[#121820]/60 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 rounded-[1.5rem] p-5 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                                    {/* Ambient glow */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all duration-500 pointer-events-none" />
                                    
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                                <FileText size={24} strokeWidth={1.5} />
                                            </div>
                                            <span className="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-black shadow-sm">
                                                {getPeriodTypeText(template.period_type)}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-white text-base mb-1.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{template.name}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed line-clamp-2">{template.description || 'لا يوجد وصف متاح لهذا القالب.'}</p>
                                    </div>
                                    <Link 
                                        href={route('hr.reports.my-reports.create', template.id)} 
                                        className="relative z-10 mt-6 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 active:scale-95 group/btn"
                                    >
                                        <Plus size={16} strokeWidth={2.5} />
                                        كتابة تقرير
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats Cards Section */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {statsItems.map((stat, index) => (
                            <div key={index} className={`bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-none hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden group cursor-default bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:16px_16px] ${stat.hoverBorder}`}>
                                {/* Glowing ambient light */}
                                <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                                <div className={`absolute top-0 right-0 left-0 h-1 bg-transparent ${stat.topLineHover} transition-colors`} />

                                <div className="relative z-10 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{stat.title}</p>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none font-mono tracking-tight">{stat.value}</h3>
                                    </div>
                                    <div className={`relative h-11 w-11 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 transition-all duration-350 group-hover:scale-110 group-hover:-rotate-3`}>
                                        {/* Double ring hover overlay */}
                                        <span className={`absolute inset-0 rounded-2xl border ${stat.ringColor} scale-100 group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                                        <stat.icon size={20} strokeWidth={2.5} />
                                    </div>
                                </div>
                                
                                {/* Progress bar and trend badge */}
                                <div className="relative z-10 space-y-2.5 mt-1">
                                    <div className="w-full bg-slate-100/80 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${stat.progressColor}`} style={{ width: stat.progressWidth }} />
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <div className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full border ${stat.badgeClass}`}>
                                            <span>{stat.badgeText}</span>
                                        </div>
                                        <span className="text-slate-400 dark:text-slate-505">{stat.subText}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 space-y-5">
                    <div className="flex items-center gap-2">
                        <Clock size={20} className="text-primary-500" />
                        <h2 className="text-lg font-black text-slate-800 dark:text-white">التقارير السابقة</h2>
                    </div>
                    
                    <div className="space-y-4">
                        {myReports.data.length === 0 ? (
                            <div className="bg-white/50 dark:bg-[#121820]/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] p-10 text-center shadow-inner">
                                <FileText className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} strokeWidth={1.5} />
                                <h3 className="text-slate-800 dark:text-slate-200 font-black text-lg mb-2">لم تقم برفع أي تقارير بعد</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">استخدم القوالب المتاحة أعلاه لإنشاء تقريرك الأول.</p>
                            </div>
                        ) : (
                            myReports.data.map(report => (
                                <div key={report.id} className="group bg-white dark:bg-[#121820]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-[1.5rem] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 hover:border-primary-200 dark:hover:border-primary-800/50 transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 ${
                                            report.status === 'pending' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            report.status === 'reviewed' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                            'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            <FileText size={24} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 dark:text-white text-base mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {report.template?.name || 'قالب محذوف'}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-primary-500" />
                                                    {report.period_label || 'لا يوجد'}
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={14} className="text-primary-500" />
                                                    {new Date(report.created_at).toLocaleDateString('ar-SA')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-none border-slate-100 dark:border-slate-800">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${
                                            report.status === 'pending' ? 'bg-yellow-50/80 text-yellow-700 border border-yellow-200/60 dark:bg-yellow-900/20 dark:border-yellow-800/40 dark:text-yellow-400' :
                                            report.status === 'reviewed' ? 'bg-green-50/80 text-green-700 border border-green-200/60 dark:bg-green-900/20 dark:border-green-800/40 dark:text-green-400' :
                                            'bg-red-50/80 text-red-700 border border-red-200/60 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-400'
                                        }`}>
                                            <span className={`w-2 h-2 rounded-full ${
                                                report.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                                                report.status === 'reviewed' ? 'bg-green-500' :
                                                'bg-red-500'
                                            }`}></span>
                                            {getStatusText(report.status)}
                                        </div>

                                        <Link 
                                            href={route('hr.reports.my-reports.show', report.id)} 
                                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 dark:bg-slate-800/50 dark:hover:bg-primary-900/30 dark:text-slate-300 dark:hover:text-primary-400 border border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800/50 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 group/btn"
                                        >
                                            عرض
                                            <ChevronLeft size={14} className="group-hover/btn:-translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
