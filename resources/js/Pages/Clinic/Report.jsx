import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Printer,
    Search,
    Stethoscope,
    AlertCircle,
    Calendar,
    Filter,
    Activity
} from 'lucide-react';

export default function Report({ visits, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = () => {
        router.get(route('clinic.report'), {
            start_date: startDate,
            end_date: endDate,
            status: status
        }, { preserveState: true });
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusStyle = (status) => {
        const styles = {
            'عادي': { 
                label: 'عادي', 
                badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                row: 'hover:bg-slate-50'
            },
            'طارئ': { 
                label: 'طارئ', 
                badge: 'bg-rose-100 text-rose-800 border-rose-200',
                row: 'bg-rose-50/50 hover:bg-rose-50 print:bg-rose-50/50'
            },
            'متابعة': { 
                label: 'متابعة', 
                badge: 'bg-blue-100 text-blue-800 border-blue-200',
                row: 'hover:bg-slate-50'
            },
            'محول למستشفى': { 
                label: 'محول للمستشفى', 
                badge: 'bg-amber-100 text-amber-800 border-amber-200',
                row: 'bg-amber-50/50 hover:bg-amber-50 print:bg-amber-50/50'
            }
        };
        return styles[status] || { 
            label: status, 
            badge: 'bg-gray-100 text-gray-800',
            row: 'hover:bg-slate-50'
        };
    };

    return (
        <AdminLayout>
            <Head title="إدارة السجلات الطبية والزيارات" />

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
                        size: landscape;
                        margin: 1cm;
                    }
                }
                `}
            </style>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 no-print">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-800/10 p-3 rounded-xl">
                            <Stethoscope className="w-6 h-6 text-emerald-700" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">سجل العيادة المدرسية</h2>
                            <p className="text-slate-500 text-sm mt-1">تقرير يومي للحالات الطبية والزيارات والإسعافات الأولية</p>
                        </div>
                    </div>
                    
                    {visits.length > 0 && (
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
                        <span>تصفية السجل</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">من تاريخ</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">إلى تاريخ</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">تصنيف الحالة</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                            >
                                <option value="">الكل</option>
                                <option value="عادي">عادي</option>
                                <option value="طارئ">طارئ</option>
                                <option value="متابعة">متابعة</option>
                                <option value="محول للمستشفى">محول للمستشفى</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
                            >
                                <Search className="w-5 h-5" />
                                <span>عرض التقرير</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Print Area */}
                {visits.length > 0 ? (
                    <div className="print-area bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        
                        {/* Print Header */}
                        <div className="hidden print:block p-8 border-b-2 border-emerald-800 mb-4">
                            <div className="flex justify-between items-center">
                                <div className="text-right">
                                    <h1 className="text-2xl font-bold text-slate-900 mb-1">المملكة العربية السعودية</h1>
                                    <h2 className="text-xl text-slate-800">وزارة التعليم</h2>
                                    <h3 className="text-lg text-slate-700">إدارة التعليم بمنطقة ...........</h3>
                                </div>
                                <div className="text-center">
                                    <h1 className="text-3xl font-bold text-emerald-800 mb-2">السجل اليومي للعيادة المدرسية</h1>
                                    <h2 className="text-lg font-semibold text-slate-700">
                                        إدارة الشؤون الطبية والصحية
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
                                        <th scope="col" className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">التاريخ والوقت</th>
                                        <th scope="col" className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">اسم الطالب / الصف</th>
                                        <th scope="col" className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">السجل المرضي (أمراض/حساسية)</th>
                                        <th scope="col" className="w-48 px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">الشكوى / الأعراض</th>
                                        <th scope="col" className="w-48 px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">الإجراء المتخذ</th>
                                        <th scope="col" className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">التصنيف</th>
                                        <th scope="col" className="w-24 px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider hidden print:table-cell">التوقيع</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {visits.map((visit, idx) => {
                                        const style = getStatusStyle(visit.status);
                                        return (
                                            <tr key={visit.id} className={`${style.row} transition-colors`}>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 text-center border-l border-slate-200">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap border-l border-slate-200">
                                                    <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                                                        <Calendar className="w-4 h-4 text-slate-400 no-print" />
                                                        {new Date(visit.visited_at).toLocaleString('ar-SA')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 border-l border-slate-200">
                                                    <div className="text-sm font-bold text-slate-900">
                                                        {visit.student?.user?.name || 'غير معروف'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        {visit.student?.current_enrollment ? 
                                                            `${visit.student.current_enrollment.division?.grade?.name || ''} - ${visit.student.current_enrollment.division?.name || ''}`
                                                        : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 border-l border-slate-200">
                                                    {visit.student?.medical_record ? (
                                                        <div className="text-xs text-slate-700 space-y-1">
                                                            {visit.student.medical_record.chronic_diseases && (
                                                                <div><span className="font-semibold">أمراض:</span> {visit.student.medical_record.chronic_diseases}</div>
                                                            )}
                                                            {visit.student.medical_record.allergies && (
                                                                <div><span className="font-semibold text-rose-600">حساسية:</span> {visit.student.medical_record.allergies}</div>
                                                            )}
                                                            {!visit.student.medical_record.chronic_diseases && !visit.student.medical_record.allergies && (
                                                                <span className="text-slate-400">سليم</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">لا يوجد سجل</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-slate-700 border-l border-slate-200">
                                                    <div className="flex items-start gap-2">
                                                        <Activity className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 no-print" />
                                                        <p className="line-clamp-2 print:line-clamp-none">{visit.symptoms}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-slate-700 border-l border-slate-200">
                                                    <p className="line-clamp-2 print:line-clamp-none">{visit.action_taken}</p>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-center border-l border-slate-200">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${style.badge}`}>
                                                        {style.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center border-slate-200 hidden print:table-cell">
                                                    {/* Empty cell for signature in print mode */}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Print Footer / Signatures */}
                        <div className="hidden print:flex justify-between items-end p-8 mt-12">
                            <div className="text-center w-48">
                                <h4 className="font-bold text-slate-800 mb-8">الممرض / الطبيب المختص</h4>
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
                        <h3 className="text-lg font-medium text-slate-900 mb-1">لا توجد زيارات</h3>
                        <p className="text-slate-500">لا توجد زيارات للعيادة مطابقة للفلاتر المحددة.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
