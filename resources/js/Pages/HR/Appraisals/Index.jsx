import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Play, Star, Clock, CheckCircle, Users, BarChart, AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';

export const getGrade = (score) => {
    if (score == null) return null;
    if (score >= 90) return { label: 'ممتاز', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: '🟢' };
    if (score >= 80) return { label: 'جيد جداً', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: '🔵' };
    if (score >= 70) return { label: 'جيد', bg: 'bg-yellow-50 dark:bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', icon: '🟡' };
    if (score >= 60) return { label: 'مقبول', bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', icon: '🟠' };
    return { label: 'يحتاج تحسين', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: '🔴' };
};

export default function AppraisalsIndex({ appraisals, activeCycles }) {
    const { flash } = usePage().props;
    const [processing, setProcessing] = useState(false);

    const startAppraisal = (cycleId) => {
        setProcessing(true);
        router.post(route('hr.appraisals.store'), { cycle_id: cycleId }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false)
        });
    };

    const statusConfig = {
        'pending_self': { label: 'بانتظار التقييم الذاتي', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: Clock },
        'pending_manager': { label: 'بانتظار تقييم المدير', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: Users },
        'pending_hr': { label: 'بانتظار اعتماد HR', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: AlertTriangle },
        'completed': { label: 'مكتمل', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle }
    };

    return (
        <AdminLayout activeMenu="تقييمات الأداء">
            <Head title="تقييمات الأداء | النظام الإداري" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur border border-emerald-250 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <Check size={16} /> {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <Star size={28} className="text-primary-600" />
                                تقييمات الأداء
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">التقييم الذاتي وتقييمات المدير المباشر واعتماد الموارد البشرية</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
                            <Link href={route('hr.appraisals.dashboard')} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl shadow-sm text-sm font-bold transition-all active:scale-95">
                                <BarChart size={18} className="text-primary-500" />
                                <span>لوحة بيانات التقييم</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Active Cycles Banner */}
                {activeCycles && activeCycles.length > 0 && (
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/30 dark:from-emerald-500/10 dark:to-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-3xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <Play size={18} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">دورات تقييم متاحة حالياً</p>
                                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">اختر الدورة المناسبة لبدء التقييم الذاتي</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                {activeCycles.map(cycle => (
                                    <button
                                        key={cycle.id}
                                        onClick={() => startAppraisal(cycle.id)}
                                        disabled={processing}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-sm hover:shadow-md hover:shadow-emerald-500/10 disabled:opacity-50"
                                    >
                                        <Play size={14} /> ابدأ تقييم ({cycle.title})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'إجمالي التقييمات', value: appraisals.length, icon: BarChart, iconBg: 'bg-primary-50 dark:bg-primary-500/10', iconColor: 'text-primary-500' },
                        { title: 'بانتظار التقييم الذاتي', value: appraisals.filter(a => a.status === 'pending_self').length, icon: Clock, iconBg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-500' },
                        { title: 'بانتظار المدير', value: appraisals.filter(a => a.status === 'pending_manager').length, icon: Users, iconBg: 'bg-blue-50 dark:bg-blue-500/10', iconColor: 'text-blue-500' },
                        { title: 'مكتمل', value: appraisals.filter(a => a.status === 'completed').length, icon: CheckCircle, iconBg: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
                            <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                                <stat.icon className={stat.iconColor} size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{stat.title}</p>
                                <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{stat.value}</h4>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">الموظف</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">الدورة</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">القالب</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">الحالة</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">النتيجة</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
                                {appraisals.map(appraisal => {
                                    const sc = statusConfig[appraisal.status] || statusConfig.pending_self;
                                    const StatusIcon = sc.icon;
                                    return (
                                        <tr key={appraisal.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/20 dark:to-primary-500/10 flex items-center justify-center shrink-0">
                                                        <span className="text-primary-700 dark:text-primary-400 font-black text-sm">{(appraisal.employee?.user?.name || '?').charAt(0)}</span>
                                                    </div>
                                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{appraisal.employee?.user?.name || 'غير معروف'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-semibold">{appraisal.cycle?.title}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-semibold">{appraisal.template?.title}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>
                                                    <StatusIcon size={12} /> {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {appraisal.final_score != null ? (
                                                    (() => {
                                                        const grade = getGrade(appraisal.final_score);
                                                        return (
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${grade.bg} ${grade.text}`}>
                                                                    {appraisal.final_score.toFixed(0)}%
                                                                </span>
                                                                <span className={`text-[10px] font-bold ${grade.text} opacity-80`}>
                                                                    {grade.icon} {grade.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link href={route('hr.appraisals.show', appraisal.id)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors">
                                                    <Eye size={14} /> عرض التقييم
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {appraisals.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <Star size={28} className="text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <p className="text-slate-400 dark:text-slate-500 font-semibold">لا توجد تقييمات سابقة</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">سيظهر هنا زر "ابدأ التقييم" عند توفر دورة تقييم نشطة</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
