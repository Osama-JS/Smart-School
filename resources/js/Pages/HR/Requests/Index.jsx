import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Plus, Filter, MoreVertical, FileText, CheckCircle, Clock, XCircle, Send } from 'lucide-react';

export default function RequestsIndex() {
    const [searchQuery, setSearchQuery] = useState('');

    // Dummy data for visual representation
    const dummyRequests = [
        { id: 'REQ-001', type: 'إجازة اعتيادية', date: '2023-10-25', status: 'موافق عليه', priority: 'عادية' },
        { id: 'REQ-002', type: 'طلب مغادرة مبكرة', date: '2023-10-26', status: 'قيد المراجعة', priority: 'عالية' },
        { id: 'REQ-003', type: 'سلفة مالية', date: '2023-10-20', status: 'مرفوض', priority: 'عادية' },
        { id: 'REQ-004', type: 'إجازة مرضية', date: '2023-10-28', status: 'قيد المراجعة', priority: 'عالية' },
    ];

    const getStatusBadge = (status) => {
        switch(status) {
            case 'موافق عليه': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle size={12}/> {status}</span>;
            case 'قيد المراجعة': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"><Clock size={12}/> {status}</span>;
            case 'مرفوض': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100"><XCircle size={12}/> {status}</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <AdminLayout activeMenu="تقديم طلب">
            <Head title="تقديم طلباتي | النظام الإداري" />

            {/* Header Section with Glassmorphism */}
            <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-gradient-to-tr from-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">طلباتي الإدارية</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">تقديم ومتابعة طلبات الإجازات، المغادرات، والطلبات الإدارية الأخرى</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link href="#" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm font-bold active:scale-95">
                            <Send size={18} />
                            <span>تقديم طلب جديد</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'طلبات قيد المراجعة', value: '2', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'الطلبات المعتمدة', value: '15', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'رصيد الإجازات المتبقي', value: '12 يوم', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 cursor-default">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                            <stat.icon size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Table */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-800">سجل الطلبات السابقة</h2>
                    <div className="relative max-w-md w-full sm:w-64">
                        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="ابحث برقم الطلب..." 
                            className="w-full bg-slate-50 border-none rounded-xl pr-10 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">رقم الطلب</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">نوع الطلب</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">التاريخ</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">إجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {dummyRequests.map((req, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-bold text-slate-700">{req.id}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-slate-800 text-sm">{req.type}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">أولوية: {req.priority}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {req.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(req.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button className="text-slate-400 hover:text-amber-600 transition-colors p-2 rounded-lg hover:bg-amber-50 inline-flex items-center justify-center">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
