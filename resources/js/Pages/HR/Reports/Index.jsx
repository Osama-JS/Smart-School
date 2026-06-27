import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FileText, ClipboardList, CheckCircle, Clock, CornerUpLeft, Plus, Clock3, RotateCcw } from 'lucide-react';

export default function ReportsIndex({ auth, reportsToReview, stats }) {
    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock size={12} /> قيد المراجعة</span>;
            case 'reviewed':
                return <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> تم الاعتماد</span>;
            case 'returned':
                return <span className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CornerUpLeft size={12} /> مُعاد</span>;
            default:
                return null;
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
            title: 'بانتظار المراجعة',
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
            subText: 'تقارير معلقة'
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
            subText: 'تقارير معتمدة'
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
            subText: 'تقارير بحاجة لتعديل'
        }
    ] : [];

    return (
        <AdminLayout activeMenu="التقارير">
            <Head title="متابعة التقارير" />

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
                                    <ClipboardList className="text-primary-500" size={32} />
                                    متابعة التقارير المرفوعة
                                </h1>
                                <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                    الإطلاع على تقارير الموظفين التابعين للفرع وإدارة عمليات المراجعة والاعتماد.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards Section */}
                    {stats && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {statsItems.map((stat, index) => (
                                <div key={index} className={`bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-none hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden group cursor-default bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:16px_16px] ${stat.hoverBorder}`}>
                                    <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                                    <div className={`absolute top-0 right-0 left-0 h-1 bg-transparent ${stat.topLineHover} transition-colors`} />

                                    <div className="relative z-10 flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{stat.title}</p>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none font-mono tracking-tight">{stat.value}</h3>
                                        </div>
                                        <div className={`relative h-11 w-11 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 transition-all duration-350 group-hover:scale-110 group-hover:-rotate-3`}>
                                            <span className={`absolute inset-0 rounded-2xl border ${stat.ringColor} scale-100 group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                                            <stat.icon size={20} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                    
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

                    {/* Reports pending review by this manager */}
                    <div className="bg-white dark:bg-[#121820] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <ClipboardList className="text-primary-500" />
                                تقارير الفرع
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">القالب</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">مقدم التقرير</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">الدرجة الوظيفية</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">تاريخ التقديم</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">الحالة</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">إجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!reportsToReview || reportsToReview.length === 0) ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 font-medium">لا توجد تقارير متاحة للمراجعة حالياً.</td>
                                        </tr>
                                    ) : (
                                        reportsToReview.map((report) => (
                                            <tr key={report.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">
                                                    {report.template?.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    {report.submitter?.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {report.submitter?.employee?.job_grade?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {new Date(report.created_at).toLocaleDateString('ar-EG')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(report.status)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link 
                                                        href={route('reports.show', report.id)}
                                                        className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                                                    >
                                                        مراجعة التفاصيل
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
        </AdminLayout>
    );
}
