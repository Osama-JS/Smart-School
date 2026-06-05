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
            case 'بانتظار اعتمادك': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-warning-50 dark:bg-warning-950/20 text-warning-700 dark:text-warning-400 border border-warning-200 dark:border-warning-900/30">
                        <Clock size={12} className="animate-pulse" /> {status}
                    </span>
                );
            case 'معتمد': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f0f7eb] dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 border border-[#dcefd1] dark:border-primary-900/30">
                        <CheckCircle size={12}/> {status}
                    </span>
                );
            case 'مرفوض': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 border border-accent-100 dark:border-accent-900/20">
                        <XCircle size={12}/> {status}
                    </span>
                );
            default: 
                return <span className="text-slate-600 dark:text-slate-350">{status}</span>;
        }
    };

    return (
        <AdminLayout activeMenu="صندوق الموافقات">
            <Head title="صندوق الموافقات | النظام الإداري" />

            {/* Header Section with Brand Colors and Geometric Accent */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none">
                {/* Brand Line Accent */}
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                
                {/* Fine abstract geometric background lines */}
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                        <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                        <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                        <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                    </svg>
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">صندوق الموافقات الإدارية</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">البت في الطلبات المعلقة المرفوعة من قبل الموظفين التابعين لإدارتك</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'بانتظار الاعتماد', value: '2', icon: Clock, color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50/50 dark:bg-warning-950/20' },
                    { label: 'تم اعتمادها اليوم', value: '4', icon: CheckCircle, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/20' },
                    { label: 'مرفوضة', value: '0', icon: XCircle, color: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-950/20' },
                ].map((stat, idx) => {
                    let glowBg = 'bg-slate-500/5';
                    if (stat.color.includes('primary')) glowBg = 'bg-primary-500/5';
                    else if (stat.color.includes('warning')) glowBg = 'bg-warning-500/5';
                    else if (stat.color.includes('accent')) glowBg = 'bg-accent-500/5';

                    return (
                        <div key={idx} className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 p-5 rounded-3xl shadow-sm hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group cursor-default">
                            {/* Glowing ambient light */}
                            <div className={`absolute -left-6 -top-6 w-24 h-24 ${glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                            
                            <div className="relative z-10 min-w-0">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">{stat.label}</p>
                                <h3 className="text-2xl font-black text-dark-900 dark:text-white leading-none font-mono tracking-tight">{stat.value}</h3>
                            </div>
                            <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}>
                                <stat.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Approvals Table */}
            <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-md dark:shadow-none overflow-hidden">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/30 dark:from-transparent dark:to-transparent">
                    <h2 className="text-base font-bold text-dark-900 dark:text-white">الطلبات الواردة</h2>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all text-sm font-bold shadow-sm">
                            <Filter size={16} className="text-slate-500 dark:text-slate-400" /> 
                            <span>تصفية</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-primary-50 via-primary-100/50 to-primary-50 dark:from-primary-950/40 dark:via-primary-900/20 dark:to-primary-950/40 border-b border-primary-200/60 dark:border-primary-900/30">
                                <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الطلب</th>
                                <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الموظف</th>
                                <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">تاريخ التقديم</th>
                                <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider text-center">الإجراء المتاح</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                            {dummyApprovals.map((req, idx) => (
                                <tr key={idx} className="group border-r-4 border-r-transparent hover:border-r-primary-500 hover:bg-primary-50/20 dark:hover:bg-gradient-to-l dark:hover:from-primary-950/20 dark:hover:to-transparent transition-all duration-300">
                                    <td className="px-6 py-4.5 whitespace-nowrap">
                                        <div className="font-bold text-dark-900 dark:text-white text-sm">{req.type}</div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">#{req.id}</div>
                                    </td>
                                    <td className="px-6 py-4.5 whitespace-nowrap">
                                        <div className="font-bold text-primary-700 dark:text-primary-400 text-sm">{req.employee}</div>
                                    </td>
                                    <td className="px-6 py-4.5 whitespace-nowrap text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                                        {req.date}
                                    </td>
                                    <td className="px-6 py-4.5 whitespace-nowrap">
                                        {getStatusBadge(req.status)}
                                    </td>
                                    <td className="px-6 py-4.5 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {req.status === 'بانتظار اعتمادك' ? (
                                                <>
                                                    <button className="px-3.5 py-1.5 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 hover:bg-primary-500 dark:hover:bg-primary-600 hover:text-white dark:hover:text-white border border-primary-100 dark:border-primary-900/30 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5">
                                                        <CheckCircle size={14}/> 
                                                        <span>قبول</span>
                                                    </button>
                                                    <button className="px-3.5 py-1.5 bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 hover:bg-accent-500 dark:hover:bg-accent-600 hover:text-white dark:hover:text-white border border-accent-100 dark:border-accent-900/20 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5">
                                                        <XCircle size={14}/> 
                                                        <span>رفض</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <button className="text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/30 inline-flex items-center justify-center border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800">
                                                    <Info size={16} />
                                                </button>
                                            )}
                                        </div>
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
