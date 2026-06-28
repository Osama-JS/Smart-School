import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import SelectInput from '@/Components/SelectInput';
import Pagination from '@/Components/Pagination';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { FileText, ClipboardList, CheckCircle, Clock, CornerUpLeft, Plus, Clock3, RotateCcw, Trash2, Eye, AlertCircle, X, Search, Filter, RotateCcw as ResetIcon } from 'lucide-react';

export default function ReportsIndex({ auth, reportsToReview, stats, filters }) {
    const [reportToDelete, setReportToDelete] = useState(null);

    const closeDeleteModal = () => {
        setReportToDelete(null);
    };

    const confirmDelete = () => {
        if (!reportToDelete) return;
        router.delete(route('reports.destroy', reportToDelete.id), {
            preserveScroll: true,
            onSuccess: () => closeDeleteModal(),
        });
    };
    
    const [filterData, setFilterData] = useState({
        search: filters?.search || '',
        status: filters?.status || 'all',
        date_start: filters?.date_start || '',
        date_end: filters?.date_end || '',
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = (e) => {
        if (e) e.preventDefault();
        router.get(route('reports.index'), filterData, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };
    
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

                    {/* Filters Section */}
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative z-40 mb-6">
                        <form onSubmit={applyFilters}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="relative flex-1 max-w-md group">
                                    <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-405 group-focus-within:text-primary-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="ابحث باسم الموظف أو القالب..."
                                        className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 pl-12 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                                        value={filterData.search} 
                                        onChange={handleFilterChange} 
                                        name="search"
                                    />
                                    {filterData.search && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setFilterData(prev => ({ ...prev, search: '' }));
                                            }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-805 rounded-lg text-slate-450 hover:text-slate-650 transition-all">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button type="submit" className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-primary-500 text-white border-primary-500 shadow-sm transition-all hover:bg-primary-600">
                                        <Filter size={16} />
                                        <span>تطبيق الفرز</span>
                                    </button>
                                    <Link href={route('reports.index')} className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10 hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-all border border-accent-100 dark:border-accent-550/10">
                                        <ResetIcon size={16} />
                                        <span>إعادة تعيين</span>
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الحالة التشغيلية</label>
                                    <SelectInput
                                        name="status"
                                        value={filterData.status}
                                        onChange={handleFilterChange}
                                        className="w-full"
                                        options={[
                                            { value: 'all', label: 'الكل' },
                                            { value: 'pending', label: 'قيد المراجعة' },
                                            { value: 'reviewed', label: 'معتمد' },
                                            { value: 'returned', label: 'معاد للتعديل' },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">من تاريخ</label>
                                    <FlatpickrInput
                                        value={filterData.date_start}
                                        onChange={(date) => setFilterData(prev => ({ ...prev, date_start: date }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">إلى تاريخ</label>
                                    <FlatpickrInput
                                        value={filterData.date_end}
                                        onChange={(date) => setFilterData(prev => ({ ...prev, date_end: date }))}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

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
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300 w-16">#</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">مقدم التقرير</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">القالب</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">الدرجة الوظيفية</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">تاريخ ووقت التقديم</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">المراجع/المعتمد</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">الحالة</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">إجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!reportsToReview || !reportsToReview.data || reportsToReview.data.length === 0) ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 font-medium">لا توجد تقارير متاحة حالياً بناءً على محددات البحث.</td>
                                        </tr>
                                    ) : (
                                        reportsToReview.data.map((report, index) => (
                                            <tr key={report.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                                                    {(reportsToReview.current_page - 1) * reportsToReview.per_page + index + 1}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    {report.submitter?.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">
                                                    {report.template?.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {report.submitter?.employee?.job_grade?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400" dir="ltr">
                                                    {new Date(report.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {report.reviewer?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(report.status)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Link 
                                                            href={route('reports.show', report.id)}
                                                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 dark:text-primary-400 border border-primary-100 dark:border-primary-800/30 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95 group/btn"
                                                        >
                                                            <Eye size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                            مراجعة
                                                        </Link>
                                                        {report.status === 'returned' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setReportToDelete(report)}
                                                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95 group/btn"
                                                            >
                                                                <Trash2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                                حذف
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {reportsToReview && reportsToReview.links && reportsToReview.links.length > 3 && (
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                                <Pagination links={reportsToReview.links} />
                            </div>
                        )}
                    </div>
                </div>

                <Modal show={reportToDelete !== null} onClose={closeDeleteModal} maxWidth="md">
                    <div className="p-6 text-right">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-rose-100 dark:bg-rose-900/30 rounded-full mb-4">
                            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 text-center">
                            تأكيد حذف التقرير
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center font-semibold leading-relaxed">
                            هل أنت متأكد من رغبتك في حذف هذا التقرير المرفوض بشكل نهائي؟ لا يمكن التراجع عن هذه الخطوة.
                        </p>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all"
                            >
                                إلغاء
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                تأكيد الحذف
                            </button>
                        </div>
                    </div>
                </Modal>
        </AdminLayout>
    );
}
