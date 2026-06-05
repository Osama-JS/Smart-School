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
            case 'موافق عليه': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f0f7eb] dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 border border-[#dcefd1] dark:border-primary-900/30">
                        <CheckCircle size={12}/> {status}
                    </span>
                );
            case 'قيد المراجعة': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-warning-50 dark:bg-warning-950/20 text-warning-700 dark:text-warning-400 border border-warning-100 dark:border-warning-900/20">
                        <Clock size={12} className="animate-pulse" /> {status}
                    </span>
                );
            case 'مرفوض': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 border border-accent-100 dark:border-accent-900/20">
                        <XCircle size={12}/> {status}
                    </span>
                );
            default: 
                return <span className="text-slate-650 dark:text-slate-350">{status}</span>;
        }
    };

    return (
        <AdminLayout activeMenu="تقديم طلب">
            <Head title="تقديم طلباتي | النظام الإداري" />

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
                        <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">طلباتي الإدارية</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تقديم ومتابعة طلبات الإجازات، المغادرات، والطلبات الإدارية الأخرى</p>
                    </div>
                    
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <Link href="#" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95">
                            <Send size={18} />
                            <span>تقديم طلب جديد</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'طلبات قيد المراجعة', value: '2', icon: Clock, color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50/50 dark:bg-warning-950/20' },
                    { label: 'الطلبات المعتمدة', value: '15', icon: CheckCircle, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/20' },
                    { label: 'رصيد الإجازات المتبقي', value: '12 يوم', icon: FileText, color: 'text-slate-650 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-slate-900/40' },
                ].map((stat, idx) => {
                    let glowBg = 'bg-slate-500/5';
                    if (stat.color.includes('primary')) glowBg = 'bg-primary-500/5';
                    else if (stat.color.includes('warning')) glowBg = 'bg-warning-500/5';

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

            {/* Search and Table Card */}
            <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-md dark:shadow-none overflow-hidden">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/30 dark:from-transparent dark:to-transparent">
                    <h2 className="text-base font-bold text-dark-900 dark:text-white">سجل الطلبات السابقة</h2>
                    
                    {/* Integrated Search Input */}
                    <div className="relative max-w-sm w-full flex items-center bg-slate-100/60 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 focus-within:bg-white dark:focus-within:bg-[#121820] border border-transparent dark:border-slate-800 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/10 rounded-2xl transition-all p-1">
                        <div className="flex-1 relative flex items-center">
                            <Search size={16} className="absolute right-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                            <input 
                                type="text" 
                                placeholder="ابحث برقم الطلب..." 
                                className="w-full bg-transparent border-none pr-10 pl-3 py-2 text-sm outline-none text-dark-900 dark:text-slate-100 font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-primary-50 via-primary-100/50 to-primary-50 dark:from-primary-950/40 dark:via-primary-900/20 dark:to-primary-950/40 border-b border-primary-200/60 dark:border-primary-900/30">
                                <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">رقم الطلب</th>
                                <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">نوع الطلب</th>
                                <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">التاريخ</th>
                                <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider text-center">إجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                            {dummyRequests.map((req, idx) => (
                                <tr key={idx} className="group border-r-4 border-r-transparent hover:border-r-primary-500 hover:bg-primary-50/20 dark:hover:bg-gradient-to-l dark:hover:from-primary-950/20 dark:hover:to-transparent transition-all duration-300">
                                    <td className="px-6 py-4.5 whitespace-nowrap">
                                        <span className="font-bold text-dark-900 dark:text-white text-sm font-mono">{req.id}</span>
                                    </td>
                                    <td className="px-6 py-4.5 whitespace-nowrap">
                                        <div className="font-bold text-dark-900 dark:text-white text-sm">{req.type}</div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">أولوية: {req.priority}</div>
                                    </td>
                                    <td className="px-6 py-4.5 whitespace-nowrap text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                                        {req.date}
                                    </td>
                                    <td className="px-6 py-4.5 whitespace-nowrap">
                                        {getStatusBadge(req.status)}
                                    </td>
                                    <td className="px-6 py-4.5 whitespace-nowrap text-center">
                                        <button className="text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/30 inline-flex items-center justify-center border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800">
                                            <MoreVertical size={16} />
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
