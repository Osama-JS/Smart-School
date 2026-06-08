import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FileText, ClipboardList, CheckCircle, Clock, CornerUpLeft, Plus } from 'lucide-react';

export default function ReportsIndex({ auth, availableTemplates, myReports, reportsToReview }) {
    
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

    return (
        <AdminLayout activeMenu="التقارير">
            <Head title="التقارير" />

            <div className="py-12" style={{ direction: 'rtl' }}>
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Available Templates (Submit Report) */}
                    {availableTemplates && availableTemplates.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Plus className="text-primary-500" />
                                تقديم تقرير جديد
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableTemplates.map(template => (
                                    <Link 
                                        key={template.id} 
                                        href={route('reports.submit.view', template.id)}
                                        className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-primary-200 dark:hover:border-primary-900 group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <FileText size={20} />
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-base">{template.name}</h4>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{template.description || 'اضغط هنا لتعبئة هذا التقرير ورفعه لمديرك المباشر.'}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reports pending review by this manager */}
                    {reportsToReview && reportsToReview.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <ClipboardList className="text-amber-500" />
                                تقارير بانتظار مراجعتك
                            </h3>
                            <div className="bg-white dark:bg-[#121820] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
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
                                            {reportsToReview.map((report) => (
                                                <tr key={report.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">
                                                        {report.template?.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                        {report.submitter?.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                        {report.submitter?.employee?.job_grade?.name || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {new Date(report.created_at).toLocaleDateString('ar-EG')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getStatusBadge(report.status)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Link 
                                                            href={route('reports.show', report.id)}
                                                            className="text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline"
                                                        >
                                                            مراجعة التقرير
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* My Reports */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="text-blue-500" />
                            تقاريري السابقة
                        </h3>
                        <div className="bg-white dark:bg-[#121820] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">القالب</th>
                                            <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">تاريخ التقديم</th>
                                            <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">الحالة</th>
                                            <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">المراجع (المدير)</th>
                                            <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">التفاصيل</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!myReports || myReports.length === 0) ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">لم تقم بتقديم أي تقارير بعد.</td>
                                            </tr>
                                        ) : (
                                            myReports.map((report) => (
                                                <tr key={report.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">
                                                        {report.template?.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {new Date(report.created_at).toLocaleDateString('ar-EG')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getStatusBadge(report.status)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                        {report.reviewer?.name || '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Link 
                                                            href={route('reports.show', report.id)}
                                                            className="text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline"
                                                        >
                                                            عرض
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

                </div>
            </div>
        </AdminLayout>
    );
}
