import React, { useState, useMemo } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SignaturePad from '@/Components/SignaturePad';
import {
    FileText, Clock, CheckCircle, XCircle, Filter, Eye,
    X, PenLine, Umbrella, LogOut, CreditCard, Wrench, Package, Award,
    LayoutGrid, Table2, Kanban, Search, Calendar as CalendarIcon, CheckCircle2, ChevronRight, User, Hash, Tag, Activity
} from 'lucide-react';

const TYPE_ICONS = {
    leave:       Umbrella,
    permission:  LogOut,
    loan:        CreditCard,
    maintenance: Wrench,
    supplies:    Package,
    certificate: Award,
};

const STATUS_COLORS = {
    pending:  { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-500/30' },
    approved: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30' },
    rejected: { bg: 'bg-rose-50 dark:bg-rose-500/10',       text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-200 dark:border-rose-500/30' },
};

export default function RequestsIndex({ requests, stats, types, statuses, filters, leaveBalances }) {
    const { flash } = usePage().props;
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'cards', 'table'
    const [searchQuery, setSearchQuery] = useState('');
    
    // Combined Drawer State
    const [drawer, setDrawer] = useState({ isOpen: false, mode: null, request: null }); 
    // mode: 'view', 'approved', 'rejected'
    const [signatureData, setSignatureData] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        status: '',
        manager_notes: '',
        manager_signature: '',
        updated_details: {},
    });

    const openDrawer = (req, mode) => {
        setDrawer({ isOpen: true, mode, request: req });
        setSignatureData(null);
        reset();
        if (mode !== 'view') {
            setData({
                status: mode, // 'approved' or 'rejected'
                manager_notes: '',
                manager_signature: '',
                updated_details: req.details || {},
            });
        }
    };

    const closeDrawer = () => {
        setDrawer({ isOpen: false, mode: null, request: null });
        setSignatureData(null);
        reset();
    };

    const handleSignature = (dataUrl) => {
        setSignatureData(dataUrl);
        setData('manager_signature', dataUrl || '');
    };

    const submitReview = (e) => {
        e.preventDefault();
        if (data.status === 'approved' && !signatureData) {
            alert('يرجى إضافة توقيعك الإلكتروني لاعتماد الطلب.');
            return;
        }
        post(route('hr.requests.review', drawer.request.id), {
            onSuccess: () => closeDrawer(),
        });
    };

    const applyFilter = (key, val) => {
        router.get(route('hr.requests.index'), { ...filters, [key]: val }, { preserveState: true, preserveScroll: true });
    };

    // Client-side filtering for Search
    const filteredRequests = useMemo(() => {
        if (!searchQuery) return requests.data;
        const lowerQ = searchQuery.toLowerCase();
        return requests.data.filter(req => 
            (req.employee?.user?.name && req.employee.user.name.toLowerCase().includes(lowerQ)) ||
            (req.type_label && req.type_label.toLowerCase().includes(lowerQ)) ||
            req.id.toString().includes(lowerQ)
        );
    }, [requests.data, searchQuery]);

    // Grouping for Kanban
    const kanbanData = {
        pending: filteredRequests.filter(r => r.status === 'pending'),
        approved: filteredRequests.filter(r => r.status === 'approved'),
        rejected: filteredRequests.filter(r => r.status === 'rejected'),
    };

    // Card Component
    const RequestCard = ({ req, onClick }) => {
        const TypeIcon = TYPE_ICONS[req.type] || FileText;
        const statusCfg = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
        
        return (
            <div 
                onClick={() => onClick(req, 'view')}
                className="group relative bg-white dark:bg-[#121820]/80 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 p-5 transition-all duration-300 hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] dark:hover:shadow-none hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col h-full"
            >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.06] transition-all duration-500 group-hover:scale-150 ${statusCfg.bg.split(' ')[0].replace('bg-', 'bg-')}`} />
                
                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-[#121820] shadow-sm">
                            {req.employee?.user?.name ? req.employee.user.name.charAt(0) : '?'}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight text-sm truncate max-w-[120px] sm:max-w-[160px]">
                                {req.employee?.user?.name || '-'}
                            </h3>
                            <p className="text-[10px] font-semibold text-slate-500 font-mono mt-0.5">REF: REQ-{req.id}</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold border border-indigo-100/50 dark:border-transparent">
                        <TypeIcon size={12} />
                        {req.type_label}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                        {req.status_label}
                    </span>
                </div>

                <div className="relative z-10 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <CalendarIcon size={12} />
                        {new Date(req.created_at).toLocaleDateString('ar-SA')}
                    </div>
                    {req.status === 'pending' ? (
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openDrawer(req, 'approved')} className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors shadow-sm"><CheckCircle size={14}/></button>
                            <button onClick={() => openDrawer(req, 'rejected')} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors shadow-sm"><XCircle size={14}/></button>
                        </div>
                    ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                            <ChevronRight size={14} className="rtl:rotate-180" />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AdminLayout activeMenu="إدارة الطلبات">
            <Head title="إدارة طلبات الموظفين" />

            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header & KPIs */}
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    <div className="lg:w-1/3 relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 shadow-lg shadow-primary-500/20 text-white">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                        <div className="relative z-10 h-full flex flex-col justify-center">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                                <FileText size={24} className="text-white" />
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-2">إدارة الطلبات</h1>
                            <p className="text-primary-100 text-sm font-medium">مراجعة واعتماد الطلبات الواردة بفعالية</p>
                        </div>
                    </div>
                    
                    <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'قيد الانتظار', value: stats.pending, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Clock },
                            { label: 'معتمدة', value: stats.approved, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle2 },
                            { label: 'مرفوضة', value: stats.rejected, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', icon: XCircle },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center relative overflow-hidden group hover:border-primary-200 transition-colors">
                                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 ${stat.bg.split(' ')[0].replace('bg-', 'bg-')} transition-transform group-hover:scale-150`} />
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                                        <stat.icon size={24} className={stat.color} />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Advanced Filtering & Controls Toolbar */}
                <div className="bg-white dark:bg-[#121820]/60 p-3 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
                    
                    {/* Status Segmented Controls */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto custom-scrollbar shrink-0">
                        {[{ value: '', label: 'الكل' }, { value: 'pending', label: 'قيد الانتظار' }, { value: 'approved', label: 'معتمد' }, { value: 'rejected', label: 'مرفوض' }].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => applyFilter('status', opt.value)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filters.status === opt.value || (!filters.status && opt.value === '') ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Search & Type Filter */}
                    <div className="flex items-center gap-3 w-full xl:w-auto shrink-0 flex-1 xl:flex-none justify-end">
                        <div className="relative w-full max-w-xs hidden sm:block">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث بالاسم..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/40 border-none rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                            />
                        </div>
                        
                        <div className="relative shrink-0">
                            <select 
                                onChange={(e) => applyFilter('type', e.target.value)}
                                value={filters.type || ''}
                                className="appearance-none bg-slate-50 dark:bg-slate-800/40 border-none rounded-2xl py-2.5 pr-10 pl-8 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-700 dark:text-slate-300 font-bold"
                            >
                                <option value="">كل الأنواع</option>
                                {Object.entries(types).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block" />

                        {/* View Toggles */}
                        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl shrink-0">
                            {[
                                { id: 'kanban', icon: Kanban, title: 'لوحة كانبان' },
                                { id: 'cards', icon: LayoutGrid, title: 'بطاقات' },
                                { id: 'table', icon: Table2, title: 'جدول' },
                            ].map(view => (
                                <button
                                    key={view.id}
                                    onClick={() => setViewMode(view.id)}
                                    title={view.title}
                                    className={`p-2 rounded-xl transition-all ${viewMode === view.id ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    <view.icon size={18} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Views Container */}
                <div className="min-h-[500px]">
                    {filteredRequests.length === 0 ? (
                        <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm py-24 text-center flex flex-col items-center">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                                <Search size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">لا توجد طلبات تطابق بحثك</h3>
                            <p className="text-slate-500 text-sm max-w-sm">لم يتم العثور على أي طلبات. حاول تغيير فلاتر البحث أو نوع الطلب.</p>
                        </div>
                    ) : (
                        <>
                            {/* KANBAN VIEW */}
                            {viewMode === 'kanban' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                    {/* Pending Column */}
                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-[2.5rem] p-4 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                                <h3 className="font-bold text-slate-800 dark:text-white">قيد الانتظار</h3>
                                            </div>
                                            <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black px-2 py-1 rounded-lg">{kanbanData.pending.length}</span>
                                        </div>
                                        <div className="space-y-4">
                                            {kanbanData.pending.map(req => <RequestCard key={req.id} req={req} onClick={openDrawer} />)}
                                        </div>
                                    </div>
                                    
                                    {/* Approved Column */}
                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-[2.5rem] p-4 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                <h3 className="font-bold text-slate-800 dark:text-white">تمت الموافقة</h3>
                                            </div>
                                            <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-black px-2 py-1 rounded-lg">{kanbanData.approved.length}</span>
                                        </div>
                                        <div className="space-y-4">
                                            {kanbanData.approved.map(req => <RequestCard key={req.id} req={req} onClick={openDrawer} />)}
                                        </div>
                                    </div>

                                    {/* Rejected Column */}
                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-[2.5rem] p-4 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                                <h3 className="font-bold text-slate-800 dark:text-white">مرفوضة</h3>
                                            </div>
                                            <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-black px-2 py-1 rounded-lg">{kanbanData.rejected.length}</span>
                                        </div>
                                        <div className="space-y-4">
                                            {kanbanData.rejected.map(req => <RequestCard key={req.id} req={req} onClick={openDrawer} />)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CARDS VIEW */}
                            {viewMode === 'cards' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {filteredRequests.map(req => <RequestCard key={req.id} req={req} onClick={openDrawer} />)}
                                </div>
                            )}

                            {/* TABLE VIEW */}
                            {viewMode === 'table' && (
                                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-right min-w-[900px]">
                                            <thead>
                                                <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">مرجع / تاريخ</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الموظف</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">نوع الطلب</th>
                                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الحالة</th>
                                                    <th className="py-4 px-6 text-center text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">إجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredRequests.map(req => {
                                                    const TypeIcon = TYPE_ICONS[req.type] || FileText;
                                                    const statusCfg = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
                                                    return (
                                                        <tr key={req.id} onClick={() => openDrawer(req, 'view')} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group">
                                                            <td className="py-4 px-6">
                                                                <div className="font-mono text-xs font-bold text-slate-500 mb-1">REQ-{req.id.toString().padStart(5, '0')}</div>
                                                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                    <CalendarIcon size={14} className="text-slate-400" />
                                                                    {new Date(req.created_at).toLocaleDateString('ar-SA')}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-[#121820] flex items-center justify-center font-bold text-sm shadow-sm">
                                                                        {req.employee?.user?.name ? req.employee.user.name.charAt(0) : '?'}
                                                                    </div>
                                                                    <div>
                                                                        <span className="block font-black text-slate-800 dark:text-white text-sm group-hover:text-primary-600 transition-colors">{req.employee?.user?.name || '-'}</span>
                                                                        <span className="block text-xs font-semibold text-slate-500">{req.employee?.job_title || 'موظف'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-100/50 dark:border-transparent">
                                                                    <TypeIcon size={14} />
                                                                    {req.type_label}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-bold ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                                                                    {req.status_label}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                                    <button onClick={() => openDrawer(req, 'view')} className="p-2 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm" title="التفاصيل">
                                                                        <Eye size={15} />
                                                                    </button>
                                                                    {req.status === 'pending' && (
                                                                        <>
                                                                            <button onClick={() => openDrawer(req, 'approved')} className="p-2 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="اعتماد">
                                                                                <CheckCircle size={15} />
                                                                            </button>
                                                                            <button onClick={() => openDrawer(req, 'rejected')} className="p-2 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="رفض">
                                                                                <XCircle size={15} />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Slide-over Drawer for Review & Details */}
            {drawer.isOpen && drawer.request && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                        onClick={closeDrawer}
                    />
                    
                    {/* Drawer Panel */}
                    <div className="relative w-full max-w-xl bg-white dark:bg-[#121820] h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-l border-slate-200 dark:border-slate-800">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    {drawer.mode === 'view' ? (
                                        <><Activity className="text-primary-500" size={24} /> تفاصيل الطلب</>
                                    ) : drawer.mode === 'approved' ? (
                                        <><CheckCircle className="text-emerald-500" size={24} /> اعتماد الطلب</>
                                    ) : (
                                        <><XCircle className="text-rose-500" size={24} /> رفض الطلب</>
                                    )}
                                </h3>
                                <p className="text-xs font-bold text-slate-500 font-mono mt-1">REF: REQ-{drawer.request.id}</p>
                            </div>
                            <button onClick={closeDrawer} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            
                            {/* Employee Profile Header */}
                            <div className="flex items-center gap-4 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-black text-slate-600 dark:text-slate-300 ring-4 ring-slate-50 dark:ring-slate-800/50">
                                    {drawer.request.employee?.user?.name ? drawer.request.employee.user.name.charAt(0) : '?'}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{drawer.request.employee?.user?.name || '-'}</h4>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">
                                        <User size={14} />
                                        <span>{drawer.request.employee?.job_title || 'موظف'}</span>
                                        {drawer.request.employee?.job_grade && (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                <span className="text-primary-600 dark:text-primary-400">{drawer.request.employee.job_grade.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Timeline & Status */}
                            <div>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Activity size={18} className="text-primary-500" />
                                    مسار الطلب
                                </h4>
                                <div className="relative pl-6 sm:pl-0 sm:flex sm:items-center sm:justify-between px-4">
                                    {/* Line */}
                                    <div className="absolute left-[27px] sm:left-1/2 sm:right-1/2 top-4 bottom-4 w-0.5 sm:w-auto sm:h-0.5 bg-slate-200 dark:bg-slate-700 sm:top-[27px] sm:-translate-x-1/2 z-0" />
                                    
                                    {/* Step 1: Created */}
                                    <div className="relative z-10 flex sm:flex-col items-center gap-4 sm:gap-2 mb-8 sm:mb-0">
                                        <div className="w-10 h-10 rounded-full bg-primary-500 text-white border-4 border-white dark:border-[#121820] flex items-center justify-center shrink-0">
                                            <FileText size={16} />
                                        </div>
                                        <div className="sm:text-center">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">تقديم الطلب</p>
                                            <p className="text-xs font-bold text-slate-500 mt-0.5">{new Date(drawer.request.created_at).toLocaleDateString('ar-SA')}</p>
                                        </div>
                                    </div>

                                    {/* Step 2: Final Decision */}
                                    <div className="relative z-10 flex sm:flex-col items-center gap-4 sm:gap-2">
                                        <div className={`w-10 h-10 rounded-full border-4 border-white dark:border-[#121820] flex items-center justify-center shrink-0 ${
                                            drawer.request.status === 'approved' ? 'bg-emerald-500 text-white' : 
                                            drawer.request.status === 'rejected' ? 'bg-rose-500 text-white' : 
                                            'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                        }`}>
                                            {drawer.request.status === 'approved' ? <CheckCircle size={16} /> : 
                                             drawer.request.status === 'rejected' ? <XCircle size={16} /> : 
                                             <Clock size={16} />}
                                        </div>
                                        <div className="sm:text-center">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">الاعتماد النهائي</p>
                                            <p className="text-xs font-bold text-slate-500 mt-0.5">
                                                {drawer.request.reviewed_at ? new Date(drawer.request.reviewed_at).toLocaleDateString('ar-SA') : 'قيد الانتظار'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Request Details Grid */}
                            <div>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-primary-500" />
                                    البيانات الأساسية
                                </h4>
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">نوع الطلب</p>
                                            <p className="font-bold text-slate-800 dark:text-white">{drawer.request.type_label}</p>
                                        </div>
                                        {drawer.request.details && Object.entries(drawer.request.details).map(([key, val]) => {
                                            if(key === 'leave_type_id') return null;
                                            const formattedKey = {
                                                start_date: 'تاريخ البداية',
                                                end_date: 'تاريخ النهاية',
                                                amount: 'المبلغ',
                                                reason: 'السبب',
                                                item_name: 'الاسم/العنصر',
                                                description: 'الوصف',
                                                date: 'التاريخ',
                                                hours: 'عدد الساعات'
                                            }[key] || key;
                                            return (
                                                <div key={key}>
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{formattedKey}</p>
                                                    <p className="font-bold text-slate-800 dark:text-white">{val}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {drawer.request.employee_notes && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">ملاحظات إضافية من الموظف</p>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                                {drawer.request.employee_notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Signatures & Approvals view mode */}
                            {drawer.mode === 'view' && (
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <CheckCircle2 size={18} className="text-primary-500" />
                                        سجل الاعتماد والتوقيعات
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Employee */}
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col justify-between">
                                            <div className="flex items-center gap-2 mb-4 text-slate-500">
                                                <User size={16} />
                                                <span className="text-xs font-black uppercase tracking-wider">توقيع الموظف</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-center min-h-[60px] bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                                                {drawer.request.employee_signature_url ? (
                                                    <img src={drawer.request.employee_signature_url} className="max-h-12 object-contain opacity-80 mix-blend-multiply dark:mix-blend-normal" alt="توقيع" />
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400">غير متوفر</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Manager */}
                                        <div className="border border-primary-200 dark:border-primary-800/40 bg-primary-50/30 dark:bg-primary-900/10 rounded-2xl p-4 flex flex-col justify-between">
                                            <div className="flex items-center justify-between mb-4 text-primary-600 dark:text-primary-400">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={16} />
                                                    <span className="text-xs font-black uppercase tracking-wider">اعتماد الإدارة</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col items-center justify-center min-h-[60px] bg-white dark:bg-[#121820]/60 rounded-xl p-2 border border-primary-100 dark:border-primary-800">
                                                {drawer.request.manager_signature_url ? (
                                                    <>
                                                        <img src={drawer.request.manager_signature_url} className="max-h-12 object-contain opacity-80 mix-blend-multiply dark:mix-blend-normal mb-1" alt="توقيع" />
                                                        <span className="text-[10px] font-bold text-primary-600">{drawer.request.manager?.name}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400">بانتظار الاعتماد</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {drawer.request.manager_notes && (
                                        <div className="mt-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border-l-4 border-l-primary-500">
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ملاحظات الإدارة</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{drawer.request.manager_notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ACTION FORM: Approve/Reject */}
                            {drawer.mode !== 'view' && (
                                <form id="reviewForm" onSubmit={submitReview} className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className={`text-sm font-black mb-4 flex items-center gap-2 ${drawer.mode === 'approved' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {drawer.mode === 'approved' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                        {drawer.mode === 'approved' ? 'إجراء الاعتماد' : 'إجراء الرفض'}
                                    </h4>

                                    {/* Leave Type Overrides */}
                                    {drawer.request.type === 'leave' && drawer.mode === 'approved' && (
                                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4">
                                            <label className="block text-sm font-bold text-emerald-900 dark:text-emerald-100 mb-2">تأكيد الرصيد المخصوم</label>
                                            <select
                                                value={data.updated_details.leave_type_id || ''}
                                                onChange={e => setData('updated_details', { ...data.updated_details, leave_type_id: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/30"
                                                required
                                            >
                                                <option value="">-- تأكيد رصيد الإجازة --</option>
                                                {(leaveBalances[drawer.request.employee_id] || []).map(b => (
                                                    <option key={b.leave_type_id} value={b.leave_type_id}>
                                                        {b.leaveType?.name || 'نوع مجهول'} (متبقي: {Math.max(0, b.total_days - b.used_days)} يوم)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 dark:text-white mb-2">
                                            {drawer.mode === 'approved' ? 'ملاحظات (اختياري)' : 'سبب الرفض (مطلوب) *'}
                                        </label>
                                        <textarea
                                            rows="3"
                                            value={data.manager_notes}
                                            onChange={e => setData('manager_notes', e.target.value)}
                                            required={drawer.mode === 'rejected'}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 resize-none"
                                            placeholder={drawer.mode === 'approved' ? 'اكتب أي توجيهات...' : 'اكتب أسباب الرفض بوضوح...'}
                                        />
                                    </div>

                                    {/* Signature */}
                                    {drawer.mode === 'approved' && (
                                        <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                            <label className="flex items-center justify-between text-sm font-bold text-slate-800 dark:text-white mb-3">
                                                <div className="flex items-center gap-2">
                                                    <PenLine size={16} className="text-primary-500" />
                                                    التوقيع الإلكتروني
                                                </div>
                                                <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-black">مطلوب للاعتماد</span>
                                            </label>
                                            <SignaturePad onChange={handleSignature} error={errors.manager_signature} />
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#121820] shrink-0">
                            {drawer.mode === 'view' ? (
                                <button onClick={closeDrawer} className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all">
                                    إغلاق
                                </button>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        form="reviewForm"
                                        disabled={processing || (drawer.mode === 'approved' && !signatureData)}
                                        className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg active:scale-[0.98]
                                            ${drawer.mode === 'approved' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25' : 
                                            'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/25'}`}
                                    >
                                        {drawer.mode === 'approved' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        {processing ? 'جاري الحفظ...' : (drawer.mode === 'approved' ? 'اعتماد الطلب' : 'تأكيد الرفض')}
                                    </button>
                                    <button type="button" onClick={closeDrawer} className="w-1/3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
                                        إلغاء
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
