import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Printer,
    Search,
    Megaphone,
    AlertCircle,
    Calendar,
    Filter
} from 'lucide-react';

export default function Report({ summons, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = () => {
        router.get(route('academic.parent-summons.report'), {
            start_date: startDate,
            end_date: endDate,
            status: status
        }, { preserveState: true });
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusBadge = (status) => {
        const statuses = {
            'scheduled': { label: 'مجدول', className: 'bg-blue-100 text-blue-800 border-blue-200' },
            'attended': { label: 'تم الحضور', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
            'no_show': { label: 'لم يحضر', className: 'bg-rose-100 text-rose-800 border-rose-200' },
            'cancelled': { label: 'ملغى', className: 'bg-slate-100 text-slate-800 border-slate-200' }
        };
        const s = statuses[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${s.className}`}>{s.label}</span>;
    };

    return (
        <AdminLayout>
            <Head title="كشف استدعاء أولياء الأمور" />

            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: portrait;
                        margin: 1cm;
                    }
                }
                `}
            </style>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 no-print">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-800/10 p-3 rounded-xl">
                            <Megaphone className="w-6 h-6 text-slate-800" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">كشف استدعاء أولياء الأمور</h2>
                            <p className="text-slate-500 text-sm mt-1">تقرير مخصص للمتابعة والطباعة للاستدعاءات الموجهة لأولياء الأمور</p>
                        </div>
                    </div>
                    
                    {summons.length > 0 && (
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <Printer className="w-4 h-4" />
                            <span>طباعة الكشف</span>
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-5 mb-6 shadow-sm no-print">
                    <div className="flex items-center gap-2 mb-4 text-slate-700 font-medium">
                        <Filter className="w-4 h-4" />
                        <span>تصفية الكشف</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">من تاريخ</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border-slate-200 rounded-xl focus:ring-slate-500 focus:border-slate-500 bg-slate-50/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">إلى تاريخ</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border-slate-200 rounded-xl focus:ring-slate-500 focus:border-slate-500 bg-slate-50/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">حالة الاستدعاء</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full border-slate-200 rounded-xl focus:ring-slate-500 focus:border-slate-500 bg-slate-50/50"
                            >
                                <option value="">الكل</option>
                                <option value="scheduled">مجدول</option>
                                <option value="attended">تم الحضور</option>
                                <option value="no_show">لم يحضر</option>
                                <option value="cancelled">ملغى</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl hover:bg-slate-900 transition-colors"
                            >
                                <Search className="w-5 h-5" />
                                <span>عرض التقرير</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Print Area */}
                {summons.length > 0 ? (
                    <div className="print-area bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        
                        {/* Print Header */}
                        <div className="hidden print:block p-8 border-b-2 border-slate-800 mb-4">
                            <div className="flex justify-between items-center">
                                <div className="text-right">
                                    <h1 className="text-2xl font-bold text-slate-900 mb-1">المملكة العربية السعودية</h1>
                                    <h2 className="text-xl text-slate-800">وزارة التعليم</h2>
                                    <h3 className="text-lg text-slate-700">إدارة التعليم بمنطقة ...........</h3>
                                </div>
                                <div className="text-center">
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">كشف استدعاء أولياء الأمور</h1>
                                    <h2 className="text-lg font-semibold text-slate-700">
                                        قسم التوجيه والإرشاد الطلابي
                                    </h2>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg text-slate-700">التاريخ: {new Date().toLocaleDateString('ar-SA')}</h3>
                                    {startDate && endDate && (
                                        <h3 className="text-sm text-slate-600 mt-1">
                                            الفترة: {startDate} إلى {endDate}
                                        </h3>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead>
                                    <tr className="bg-slate-50 print:bg-slate-100">
                                        <th scope="col" className="w-12 px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">م</th>
                                        <th scope="col" className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">تاريخ الاستدعاء</th>
                                        <th scope="col" className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">اسم الطالب</th>
                                        <th scope="col" className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">الصف / الشعبة</th>
                                        <th scope="col" className="w-64 px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">سبب الاستدعاء</th>
                                        <th scope="col" className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">الحالة</th>
                                        <th scope="col" className="w-32 px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider hidden print:table-cell">توقيع ولي الأمر</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {summons.map((summon, idx) => (
                                        <tr key={summon.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 text-center border-l border-slate-200">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap border-l border-slate-200">
                                                <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                                                    <Calendar className="w-4 h-4 text-slate-400 no-print" />
                                                    {new Date(summon.summon_date).toLocaleDateString('ar-SA')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 border-l border-slate-200">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    {summon.student?.user?.name || 'غير معروف'}
                                                </div>
                                                <div className="text-xs text-slate-500 no-print mt-1">
                                                    {summon.student?.user?.id_number}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 border-l border-slate-200">
                                                {summon.student?.active_enrollment ? 
                                                    `${summon.student.active_enrollment.division?.grade?.name || ''} - ${summon.student.active_enrollment.division?.name || ''}`
                                                : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-700 border-l border-slate-200">
                                                {summon.violation && (
                                                    <div className="text-xs font-bold text-rose-600 mb-1">
                                                        مخالفة: {summon.violation.violation_type?.name}
                                                    </div>
                                                )}
                                                <p className="line-clamp-2 print:line-clamp-none">{summon.reason}</p>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center border-l border-slate-200">
                                                {getStatusBadge(summon.status)}
                                            </td>
                                            <td className="px-4 py-4 text-center border-slate-200 hidden print:table-cell">
                                                {/* Empty cell for signature in print mode */}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Print Footer / Signatures */}
                        <div className="hidden print:flex justify-between items-end p-8 mt-12">
                            <div className="text-center w-48">
                                <h4 className="font-bold text-slate-800 mb-8">المرشد الطلابي</h4>
                                <div className="border-b border-slate-400 w-full mb-2"></div>
                                <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                            </div>
                            
                            <div className="text-center w-48">
                                <h4 className="font-bold text-slate-800 mb-8">مدير المدرسة</h4>
                                <div className="border-b border-slate-400 w-full mb-2"></div>
                                <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center no-print">
                        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-1">لا توجد استدعاءات</h3>
                        <p className="text-slate-500">لا يوجد استدعاءات لأولياء الأمور تطابق الفلاتر المحددة.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
