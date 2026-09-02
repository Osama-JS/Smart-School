import React, { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import ReportPrintLayout from "@/Components/Reports/ReportPrintLayout";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Search, Filter, CheckCircle, X } from "lucide-react";

export default function MeetingsReportIndex({ meetings, stats, filters }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('meetings.report'), { search: searchQuery, status: statusFilter }, { preserveState: true });
    };

    const getStatusBadgeColor = (status) => {
        if (status === 'scheduled') return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
        if (status === 'completed') return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
        return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    };

    const getStatusLabel = (status) => {
        if (status === 'scheduled') return 'مجدول';
        if (status === 'completed') return 'مكتمل';
        return 'ملغي';
    };

    const formatDateAr = (dateString) => {
        if (!dateString) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    };

    const formatTimeAr = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const [printSettings, setPrintSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('MeetingReportPrintSettings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            title: 'تقارير محاضر الاجتماعات',
            orientation: 'portrait',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            showKPIs: true,
            showDetails: true,
            ecoMode: false,
            brandColor: '#2563eb'
        };
    });

    useEffect(() => {
        localStorage.setItem('MeetingReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const handlePrint = () => window.print();

    return (
        <AdminLayout activeMenu="محاضر الاجتماعات">
            <Head title="تقارير محاضر الاجتماعات" />
            <div className="p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow border border-slate-100 dark:border-slate-700">
                                    <Users size={28} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">تقارير محاضر الاجتماعات</h1>
                                    <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">عرض وطباعة سجلات الاجتماعات واللجان</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-4 relative z-20">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2 w-full">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ابحث عن اجتماع..."
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                            <button type="submit" className="bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-xl font-bold transition-colors">
                                <Filter size={18} />
                            </button>
                        </form>
                        
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                        
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                            <button 
                                onClick={() => { setStatusFilter(''); router.get(route('meetings.report', { search: searchQuery })); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${!filters.status ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                الكل
                            </button>
                            <button 
                                onClick={() => { setStatusFilter('scheduled'); router.get(route('meetings.report', { status: 'scheduled', search: searchQuery })); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filters.status === 'scheduled' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                مجدولة
                            </button>
                            <button 
                                onClick={() => { setStatusFilter('completed'); router.get(route('meetings.report', { status: 'completed', search: searchQuery })); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filters.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                مكتملة
                            </button>
                            <button 
                                onClick={() => { setStatusFilter('cancelled'); router.get(route('meetings.report', { status: 'cancelled', search: searchQuery })); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filters.status === 'cancelled' ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                ملغاة
                            </button>
                        </div>
                    </div>

                    <ReportPrintLayout 
                        title={printSettings.title} 
                        printSettings={printSettings} 
                        setPrintSettings={setPrintSettings} 
                        onPrint={handlePrint}
                    >
                        {/* KPIs */}
                        {printSettings.showKPIs && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                    <div>
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">إجمالي الاجتماعات</p>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white print:text-black">
                                            {stats.total}
                                        </h3>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 flex items-center justify-center print:bg-slate-100 print:text-black">
                                        <Users size={24} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                    <div>
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">اجتماعات مجدولة</p>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white print:text-black">
                                            {stats.scheduled}
                                        </h3>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center print:bg-slate-100 print:text-black">
                                        <Clock size={24} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between print:border-black/20 print:bg-transparent print:shadow-none">
                                    <div>
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 print:text-slate-700">اجتماعات مكتملة</p>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white print:text-black">
                                            {stats.completed}
                                        </h3>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center print:bg-slate-100 print:text-black">
                                        <CheckCircle size={24} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm relative z-10 print:border-none print:shadow-none print:rounded-none">
                            {meetings.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CalendarIcon size={32} className="text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">لا توجد اجتماعات</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                        لم يتم العثور على اجتماعات تطابق معايير التصفية المحددة للتقرير.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-sm text-right print:border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-black border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-black/30 print:text-slate-800">
                                            <tr>
                                                <th className="px-6 py-4 rounded-tr-3xl print:rounded-none print:border print:border-black/30">الاجتماع</th>
                                                <th className="px-6 py-4 print:border print:border-black/30">التاريخ والوقت</th>
                                                <th className="px-6 py-4 print:border print:border-black/30">النوع</th>
                                                <th className="px-6 py-4 print:border print:border-black/30">المنسق</th>
                                                <th className="px-6 py-4 print:border print:border-black/30">عدد المدعوين</th>
                                                <th className="px-6 py-4 rounded-tl-3xl print:rounded-none print:border print:border-black/30">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium print:divide-black/20">
                                            {meetings.map(meeting => (
                                                <tr key={meeting.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                                                    <td className="px-6 py-4 print:border print:border-black/30">
                                                        <span className="font-bold text-slate-800 dark:text-white print:text-black">
                                                            {meeting.title}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap print:border print:border-black/30">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon size={14} className="text-slate-400 print:hidden" /> 
                                                            <span className="text-slate-700 dark:text-slate-300 print:text-black">{formatDateAr(meeting.date)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 print:text-slate-700">
                                                            <Clock size={12} className="text-slate-400 print:hidden" />
                                                            {formatTimeAr(meeting.time)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap print:border print:border-black/30">
                                                        {meeting.type === 'online' ? (
                                                            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md text-xs font-bold w-max print:bg-transparent print:p-0 print:text-black">
                                                                <Users size={12} className="print:hidden"/> عن بعد
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md text-xs font-bold w-max print:bg-transparent print:p-0 print:text-black">
                                                                <MapPin size={12} className="print:hidden"/> حضوري
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap print:border print:border-black/30 print:text-black">
                                                        {meeting.supervisor?.name || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap print:border print:border-black/30 print:text-black">
                                                        {meeting.participants?.length || 0}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap print:border print:border-black/30">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${getStatusBadgeColor(meeting.status)} print:bg-transparent print:p-0 print:border-none print:text-black`}>
                                                            {getStatusLabel(meeting.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </ReportPrintLayout>
                </div>
            </div>
        </AdminLayout>
    );
}
