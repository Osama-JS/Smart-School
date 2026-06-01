import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Plus, Filter, MoreVertical, CheckCircle, XCircle, Bell, Clock, Info } from 'lucide-react';

export default function ApprovalsIndex() {
    const [searchQuery, setSearchQuery] = useState('');

    // Dummy data for visual representation
    const dummyApprovals = [
        { id: 'REQ-012', employee: 'أحمد محمود', type: 'إجازة اعتيادية', date: '2023-10-30', status: 'بانتظار اعتمادك', priority: 'عالية' },
        { id: 'REQ-015', employee: 'نورة محمد', type: 'سلفة مالية', date: '2023-10-31', status: 'بانتظار اعتمادك', priority: 'عادية' },
        { id: 'REQ-002', employee: 'عمر عبدالله', type: 'طلب مغادرة', date: '2023-10-26', status: 'معتمد', priority: 'عالية' },
    ];

    const getStatusBadge = (status) => {
        switch(status) {
            case 'بانتظار اعتمادك': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"><Clock size={12}/> {status}</span>;
            case 'معتمد': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle size={12}/> {status}</span>;
            case 'مرفوض': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100"><XCircle size={12}/> {status}</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <AdminLayout activeMenu="صندوق الموافقات">
            <Head title="صندوق الموافقات | النظام الإداري" />

            {/* Header Section with Glassmorphism */}
            <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">صندوق الموافقات الإدارية</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">البت في الطلبات المعلقة المرفوعة من قبل الموظفين التابعين لإدارتك</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'بانتظار الاعتماد', value: '2', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'تم اعتمادها اليوم', value: '4', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'مرفوضة', value: '0', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
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

            {/* Approvals Table */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-800">الطلبات الواردة</h2>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-bold">
                            <Filter size={16} /> تصفية
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الطلب</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الموظف</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">تاريخ التقديم</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">الإجراء المتاح</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {dummyApprovals.map((req, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-slate-800 text-sm">{req.type}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">#{req.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-indigo-700 text-sm">{req.employee}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {req.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(req.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center flex items-center justify-center gap-2">
                                        {req.status === 'بانتظار اعتمادك' ? (
                                            <>
                                                <button className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1">
                                                    <CheckCircle size={14}/> قبول
                                                </button>
                                                <button className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1">
                                                    <XCircle size={14}/> رفض
                                                </button>
                                            </>
                                        ) : (
                                            <button className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-indigo-50 inline-flex items-center justify-center">
                                                <Info size={18} />
                                            </button>
                                        )}
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
