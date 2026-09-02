import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ReportPrintLayout from "@/Components/Reports/ReportPrintLayout";
import {
    Search,
    UserCheck,
    AlertCircle,
    Calendar,
    Clock,
    Filter,
    User,
    CheckCircle2,
    CalendarDays,
    Clock3,
    XCircle
} from 'lucide-react';

export default function Report({ visits = [], stats = {}, filters = {} }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');
    const [purposeCategory, setPurposeCategory] = useState(filters.purpose_category || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(route('academic.parent-visits.report'), {
            start_date: startDate,
            end_date: endDate,
            status: status,
            purpose_category: purposeCategory
        }, { preserveState: true });
    };

    const getStatusBadge = (status) => {
        const styles = {
            'مجدولة': { badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300' },
            'جارية': { badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300' },
            'مكتملة': { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300' },
            'ملغاة': { badge: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300' }
        };
        const s = styles[status] || { badge: 'bg-slate-100 text-slate-800 border-slate-200' };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.badge} print:bg-transparent print:p-0 print:border-none print:text-black`}>
                {status}
            </span>
        );
    };

    const getPurposeBadge = (category) => {
        const colors = {
            'أكاديمي': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300',
            'سلوكي': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300',
            'مالي': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300',
            'إداري/أخرى': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
        };
        const color = colors[category] || 'bg-slate-100 text-slate-700 border-slate-200';
        return (
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${color} print:bg-transparent print:p-0 print:border-none print:text-black`}>
                {category}
            </span>
        );
    };

    const formatDateAr = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric' });
    };

    const formatTimeAr = (timeString) => {
        if (!timeString) return '';
        try {
            if (timeString.includes('T')) {
                return timeString.substring(11, 16);
            }
            return timeString.substring(0, 5);
        } catch (e) {
            return timeString;
        }
    };

    const [printSettings, setPrintSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('ParentVisitsReportPrintSettings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            title: 'كشف زيارات أولياء الأمور',
            orientation: 'landscape',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            showKPIs: true,
            showDetails: true,
            ecoMode: false,
            brandColor: '#0284c7' // sky-600
        };
    });

    useEffect(() => {
        localStorage.setItem('ParentVisitsReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const handlePrint = () => window.print();

    return (
        <AdminLayout activeMenu="زيارات أولياء الأمور">
            <Head title="كشف زيارات أولياء الأمور" />

            <div className="p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header Banner */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-sky-50/70 via-white to-white dark:from-sky-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-sky-100 dark:border-sky-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center shadow border border-slate-100 dark:border-slate-700">
                                    <UserCheck size={28} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">كشف زيارات أولياء الأمور</h1>
                                    <p className="text-sky-700/80 dark:text-sky-300/80 mt-2 text-sm font-semibold">سجل رسمي لتوثيق ومتابعة زيارات أولياء الأمور للمدرسة والمقررات</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative z-20">
                        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-bold">
                            <Filter className="w-4 h-4" />
                            <span>تصفية الكشف</span>
                        </div>
                        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">من تاريخ</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">إلى تاريخ</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">حالة الزيارة</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all dark:text-white"
                                >
                                    <option value="">الكل</option>
                                    <option value="مجدولة">مجدولة</option>
                                    <option value="جارية">جارية</option>
                                    <option value="مكتملة">مكتملة</option>
                                    <option value="ملغاة">ملغاة</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">تصنيف الغرض</label>
                                <select
                                    value={purposeCategory}
                                    onChange={(e) => setPurposeCategory(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all dark:text-white"
                                >
                                    <option value="">الكل</option>
                                    <option value="أكاديمي">أكاديمي</option>
                                    <option value="سلوكي">سلوكي</option>
                                    <option value="مالي">مالي</option>
                                    <option value="إداري/أخرى">إداري/أخرى</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:from-sky-700 hover:to-blue-700 transition-all font-bold shadow-sm"
                                >
                                    <Search className="w-5 h-5" />
                                    <span>عرض التقرير</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <ReportPrintLayout 
                        title={printSettings.title} 
                        printSettings={printSettings} 
                        setPrintSettings={setPrintSettings} 
                        onPrint={handlePrint}
                        subtitle={startDate && endDate ? `الفترة: ${startDate} إلى ${endDate}` : 'إدارة شؤون الطلاب والإرشاد'}
                    >
                        {/* KPI Summary Cards */}
                        {printSettings.showKPIs && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">إجمالي الزيارات</p>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white print:text-black">{stats.total || 0}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center print:hidden">
                                        <UserCheck size={20} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">زيارات مكتملة</p>
                                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 print:text-black">{stats.completed || 0}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center print:hidden">
                                        <CheckCircle2 size={20} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">زيارات مجدولة</p>
                                        <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 print:text-black">{stats.scheduled || 0}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center print:hidden">
                                        <CalendarDays size={20} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">زيارات جارية</p>
                                        <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 print:text-black">{stats.in_progress || 0}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center print:hidden">
                                        <Clock3 size={20} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm relative z-10 print:border-none print:shadow-none print:rounded-none">
                            {visits.length === 0 ? (
                                <div className="p-12 text-center">
                                    <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد زيارات</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                        لم يتم العثور على زيارات لأولياء الأمور مطابقة لمعايير التصفية المحددة.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-sm text-right print:border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-black border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-black/30 print:text-slate-800">
                                            <tr>
                                                <th className="w-12 px-3 py-4 text-center border-l border-slate-200 dark:border-slate-700 print:border-black/30 print:rounded-none">م</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">تاريخ ووقت الزيارة</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">اسم الزائر / الصلة</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">اسم الطالب / الصف</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">غرض الزيارة والتصنيف</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">الموظف المقابل</th>
                                                <th className="px-3 py-4 text-center border-l border-slate-200 dark:border-slate-700 print:border-black/30">الحالة</th>
                                                <th className="px-4 py-4 border-l border-slate-200 dark:border-slate-700 print:border-black/30">الملاحظات / التوصيات</th>
                                                <th className="w-28 px-3 py-4 text-center hidden print:table-cell print:border-black/30">توقيع الزائر</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium print:divide-black/20">
                                            {visits.map((visit, idx) => (
                                                <tr key={visit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                                                    <td className="px-3 py-4 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        <div className="flex items-center gap-2 text-slate-900 dark:text-white print:text-black font-bold">
                                                            <Calendar className="w-4 h-4 text-slate-400 print:hidden" />
                                                            {formatDateAr(visit.visit_date)}
                                                        </div>
                                                        {visit.visit_time && (
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 print:text-slate-700">
                                                                <Clock className="w-3 h-3 text-slate-400 print:hidden" />
                                                                {formatTimeAr(visit.visit_time)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                                                            {visit.visitor_name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 print:text-slate-700">
                                                            صلة القرابة: {visit.visitor_relation || 'ولي أمر'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        <div className="text-sm font-semibold text-slate-900 dark:text-white print:text-black">
                                                            {visit.student?.user?.name || '-'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 print:text-slate-700">
                                                            {visit.student?.current_enrollment?.division ? 
                                                                `${visit.student.current_enrollment.division.grade?.name || ''} - ${visit.student.current_enrollment.division.name || ''}`
                                                            : '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        <div className="mb-1">
                                                            {getPurposeBadge(visit.purpose_category)}
                                                        </div>
                                                        <p className="text-xs text-slate-700 dark:text-slate-300 print:text-black line-clamp-2 print:line-clamp-none">
                                                            {visit.purpose || '-'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                        {visit.employee?.name || <span className="text-slate-400">—</span>}
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-800 print:border-black/30">
                                                        {getStatusBadge(visit.status)}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 print:border-black/30 print:text-black">
                                                        <p className="line-clamp-2 print:line-clamp-none">
                                                            {visit.notes || '—'}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-4 text-center hidden print:table-cell print:border-black/30">
                                                        {/* Empty cell for signature */}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Print Signatures Section */}
                            {visits.length > 0 && (
                                <div className="hidden print:flex justify-between items-end p-8 mt-12 w-full">
                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">مسؤول الاستقبال / المتابع</h4>
                                        <div className="border-b border-black w-full mb-2"></div>
                                        <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                                    </div>
                                    
                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">المرشد الطلابي</h4>
                                        <div className="border-b border-black w-full mb-2"></div>
                                        <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                                    </div>

                                    <div className="text-center w-48">
                                        <h4 className="font-bold text-slate-800 mb-8">مدير المدرسة / الختم</h4>
                                        <div className="border-b border-black w-full mb-2"></div>
                                        <p className="text-sm text-slate-600">الاسم والتوقيع</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ReportPrintLayout>
                </div>
            </div>
        </AdminLayout>
    );
}
