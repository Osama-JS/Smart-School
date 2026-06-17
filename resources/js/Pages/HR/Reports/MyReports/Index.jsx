import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FileText, Plus, Calendar, Clock, CheckCircle, Clock3, RotateCcw } from 'lucide-react';

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

                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">نماذج التقارير</h2>
                    {templates.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                            <FileText className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
                            <h3 className="text-slate-700 dark:text-slate-300 font-bold text-lg mb-1">لا توجد قوالب متاحة</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">لم يتم تعيين أي قوالب تقارير لدرجتك الوظيفية حالياً.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map(template => (
                                <div key={template.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center shrink-0">
                                                <FileText size={20} />
                                            </div>
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold">
                                                {getPeriodTypeText(template.period_type)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-white text-base mb-1">{template.name}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2">{template.description || 'لا يوجد وصف'}</p>
                                    </div>
                                    <Link 
                                        href={route('hr.reports.my-reports.create', template.id)} 
                                        className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 text-primary-600 dark:text-primary-400 font-bold text-sm rounded-xl transition-colors"
                                    >
                                        <Plus size={16} />
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

                <div className="mt-8 space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">التقارير السابقة</h2>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">القالب</th>
                                        <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">الفترة الزمنية</th>
                                        <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">تاريخ الرفع</th>
                                        <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">الحالة</th>
                                        <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300 text-left">إجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {myReports.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                                لم تقم برفع أي تقارير بعد
                                            </td>
                                        </tr>
                                    ) : (
                                        myReports.data.map(report => (
                                            <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                                                    {report.template?.name || 'قالب محذوف'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {report.period_label ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold">
                                                            <Calendar size={14} />
                                                            {report.period_label}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">لا يوجد</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                                                    {new Date(report.created_at).toLocaleDateString('ar-SA')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                        report.status === 'pending' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                        report.status === 'reviewed' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                                                        'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                                    }`}>
                                                        {getStatusIcon(report.status)}
                                                        {getStatusText(report.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    <button className="text-primary-500 hover:text-primary-600 font-bold text-xs">عرض</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
