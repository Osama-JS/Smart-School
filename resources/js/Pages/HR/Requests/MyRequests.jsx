import React, { useState, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SignaturePad from '@/Components/SignaturePad';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import {
    FileText, Plus, Clock, CheckCircle, XCircle, Send, X, ChevronDown, LayoutGrid, List, Eye,
    Umbrella, LogOut, CreditCard, Wrench, Package, Award, PenLine, Users, Briefcase, Calendar, Activity
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
    pending:  { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-500/30',   icon: Clock },
    approved: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30', icon: CheckCircle },
    rejected: { bg: 'bg-red-50 dark:bg-red-500/10',       text: 'text-red-600 dark:text-red-400',       border: 'border-red-200 dark:border-red-500/30',         icon: XCircle },
};

export default function MyRequests({ myRequests, leaveBalances, types, statuses }) {
    const { flash } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [viewingRequest, setViewingRequest] = useState(null);
    const [signatureData, setSignatureData] = useState(null);
    const signaturePadRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        type: '',
        employee_notes: '',
        details: {},
        employee_signature: '',
    });

    const selectedType = data.type;

    const openModal = () => {
        reset();
        setSignatureData(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        setSignatureData(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!signatureData) {
            alert('يرجى التوقيع قبل إرسال الطلب.');
            return;
        }
        post(route('hr.my-requests.store'), {
            onSuccess: () => closeModal(),
        });
    };

    const handleSignature = (dataUrl) => {
        setSignatureData(dataUrl);
        setData('employee_signature', dataUrl || '');
    };

    const updateDetail = (key, value) => {
        setData('details', { ...data.details, [key]: value });
    };

    const totalRequests = myRequests.length;
    const pendingCount  = myRequests.filter(r => r.status === 'pending').length;
    const approvedCount = myRequests.filter(r => r.status === 'approved').length;

    return (
        <AdminLayout activeMenu="طلباتي">
            <Head title="طلباتي" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Hero Header & Command Center */}
                <div className="relative overflow-hidden bg-white/70 dark:bg-[#121820]/80 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 border border-white/50 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-black/20 z-10">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 opacity-80" />
                    <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
                    <div className="absolute top-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 shrink-0 transform -rotate-3">
                                <FileText size={32} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm mb-2">طلباتي</h1>
                                <p className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    متابعة الطلبات الإدارية وتقديم طلبات جديدة
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl shadow-inner border border-slate-200/50 dark:border-slate-800/50">
                                <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
                                    <List size={20} strokeWidth={2.5} />
                                </button>
                                <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
                                    <LayoutGrid size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500 group-hover:duration-200 animate-pulse"></div>
                                <button onClick={openModal} className="relative flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl font-black text-sm transition-all duration-300 hover:shadow-[0_0_2rem_-0.5rem_#0ea5e9] hover:-translate-y-1 active:scale-95">
                                    <Plus size={20} strokeWidth={2.5} />
                                    <span>طلب جديد</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                        { label: 'إجمالي الطلبات', value: totalRequests, color: 'from-blue-500 to-indigo-600', iconColor: 'text-blue-500', bgIcon: 'bg-blue-50 dark:bg-blue-500/10', icon: FileText },
                        { label: 'قيد الانتظار', value: pendingCount, color: 'from-amber-400 to-orange-500', iconColor: 'text-amber-500', bgIcon: 'bg-amber-50 dark:bg-amber-500/10', icon: Clock },
                        { label: 'تم الاعتماد', value: approvedCount, color: 'from-emerald-400 to-emerald-600', iconColor: 'text-emerald-500', bgIcon: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle },
                    ].map((stat, i) => (
                        <div key={i} className="relative group overflow-hidden bg-white/60 dark:bg-[#121820]/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 dark:border-white/5 shadow-lg shadow-slate-200/30 dark:shadow-black/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 rounded-bl-[100px] pointer-events-none group-hover:opacity-10 transition-opacity duration-500`} />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">{stat.label}</p>
                                    <h3 className="text-4xl font-black text-slate-800 dark:text-white drop-shadow-sm">{stat.value}</h3>
                                </div>
                                <div className={`w-16 h-16 ${stat.bgIcon} rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                    <stat.icon size={28} className={stat.iconColor} strokeWidth={2} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Leave Balances */}
                {leaveBalances && leaveBalances.length > 0 && (
                    <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-white/5 p-8 shadow-lg shadow-slate-200/30 dark:shadow-black/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                        <h3 className="font-black text-xl text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                            <div className="p-2 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl text-cyan-500">
                                <Umbrella size={22} strokeWidth={2} />
                            </div>
                            أرصدة الإجازات السنوية
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {leaveBalances.map(balance => {
                                const percentage = balance.total_days > 0 ? Math.min(100, (balance.remaining_days / balance.total_days) * 100) : 0;
                                const isLow = percentage < 20;
                                const barColor = isLow ? 'bg-gradient-to-l from-red-500 to-rose-400' : 'bg-gradient-to-l from-emerald-500 to-teal-400';
                                const textColor = isLow ? 'text-red-500' : 'text-emerald-500';
                                const bgPill = isLow ? 'bg-red-50 dark:bg-red-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10';
                                
                                return (
                                    <div key={balance.id} className="p-5 bg-white dark:bg-slate-900/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                        <p className="text-base font-black text-slate-800 dark:text-slate-200 mb-4">{balance.leave_type_name}</p>
                                        <div className="flex items-end justify-between mb-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">المتبقي</span>
                                                <span className={`text-2xl font-black ${textColor} leading-none`}>
                                                    {balance.remaining_days}
                                                </span>
                                            </div>
                                            <div className={`px-2.5 py-1 rounded-lg ${bgPill} text-[11px] font-bold ${textColor}`}>
                                                من أصل {balance.total_days}
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full rounded-full ${barColor} relative`}
                                                style={{ width: `${percentage}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Requests List */}
                <div className={viewMode === 'table' ? 'w-full' : 'space-y-4'}>
                    {myRequests.length === 0 ? (
                        <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-white/5 py-24 text-center shadow-lg shadow-slate-200/30 dark:shadow-black/10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner transform rotate-6 group-hover:rotate-12 transition-transform duration-500">
                                    <FileText size={40} className="text-slate-400" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">سجل الطلبات فارغ</h3>
                                <p className="text-slate-500 font-semibold max-w-sm">لا يوجد لديك أي طلبات مسجلة في النظام حالياً. يمكنك البدء بتقديم طلب جديد باستخدام الزر بالأعلى.</p>
                            </div>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="overflow-x-auto pb-4 custom-scrollbar">
                            <table className="w-full text-right border-separate border-spacing-y-3">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">نوع الطلب</th>
                                        <th className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">تاريخ التقديم</th>
                                        <th className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">لمحة عن التفاصيل</th>
                                        <th className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myRequests.map(req => {
                                        const TypeIcon = TYPE_ICONS[req.type] || FileText;
                                        const statusCfg = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
                                        const StatusIcon = statusCfg.icon;
                                        return (
                                            <tr key={req.id} className={`group bg-white dark:bg-[#121820]/80 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border border-transparent ${statusCfg.border.replace('border-', 'hover:border-')}`}>
                                                <td className="px-6 py-4 rounded-r-2xl border-y border-r border-slate-100 dark:border-slate-800/50 group-hover:border-transparent transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 ${statusCfg.bg} rounded-[1rem] flex items-center justify-center shrink-0`}>
                                                            <TypeIcon size={20} className={statusCfg.text} />
                                                        </div>
                                                        <span className="font-black text-[15px] text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{req.type_label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-y border-slate-100 dark:border-slate-800/50 group-hover:border-transparent transition-colors text-sm font-bold text-slate-600 dark:text-slate-400">
                                                    {new Date(req.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 border-y border-slate-100 dark:border-slate-800/50 group-hover:border-transparent transition-colors">
                                                    <div className="flex flex-wrap gap-2">
                                                        {req.details && Object.entries(req.details).slice(0, 2).map(([k, v]) => (
                                                            <div key={k} className="text-xs bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                                <span className="text-slate-400 ml-1">{k}:</span>
                                                                <span className="text-slate-700 dark:text-slate-300 font-bold">{v}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 rounded-l-2xl border-y border-l border-slate-100 dark:border-slate-800/50 group-hover:border-transparent transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black inline-flex items-center gap-1.5 shadow-sm ${statusCfg.bg} ${statusCfg.text}`}>
                                                            <StatusIcon size={14} />
                                                            {req.status_label}
                                                        </span>
                                                        <button
                                                            onClick={() => setViewingRequest(req)}
                                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                                                            title="عرض التفاصيل"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        myRequests.map(req => {
                            const TypeIcon = TYPE_ICONS[req.type] || FileText;
                            const statusCfg = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
                            const StatusIcon = statusCfg.icon;
                            const isExpanded = expandedId === req.id;

                            return (
                                <div key={req.id} className={`bg-white dark:bg-[#121820]/80 rounded-[2rem] border transition-all duration-300 shadow-sm ${isExpanded ? 'shadow-md border-slate-300 dark:border-slate-700' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md'}`}>
                                    <div className="p-5 md:p-6 flex items-center gap-5 cursor-pointer select-none" onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                                        <div className={`w-14 h-14 ${statusCfg.bg} rounded-[1.25rem] flex items-center justify-center shrink-0`}>
                                            <TypeIcon size={24} className={statusCfg.text} strokeWidth={1.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap mb-1">
                                                <h4 className="font-black text-lg text-slate-800 dark:text-white">{req.type_label}</h4>
                                                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm ${statusCfg.bg} ${statusCfg.text}`}>
                                                    <StatusIcon size={12} strokeWidth={2.5} />
                                                    {req.status_label}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                                قدمت في: {new Date(req.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 text-primary-500' : 'text-slate-400'}`}>
                                            <ChevronDown size={20} />
                                        </div>
                                    </div>

                                    <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-6">
                                                {/* Request Details Grid */}
                                                {req.details && Object.keys(req.details).length > 0 && (
                                                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50">
                                                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">التفاصيل الفنية</h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {Object.entries(req.details).map(([k, v]) => {
                                                                if(k === 'leave_type_id') return null;
                                                                const formattedKey = {
                                                                    start_date: 'تاريخ البداية', end_date: 'تاريخ النهاية',
                                                                    amount: 'المبلغ', reason: 'السبب',
                                                                    item_name: 'الاسم/العنصر', description: 'الوصف',
                                                                    date: 'التاريخ', hours: 'عدد الساعات'
                                                                }[k] || k;
                                                                return (
                                                                    <div key={k} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                                                                        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">{formattedKey}</span>
                                                                        <strong className="block text-sm text-slate-800 dark:text-slate-200 truncate" title={v}>{v}</strong>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Employee Notes */}
                                                    {req.employee_notes && (
                                                        <div>
                                                            <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">ملاحظاتي</h5>
                                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm text-sm text-slate-700 dark:text-slate-300 leading-relaxed min-h-[80px]">
                                                                {req.employee_notes}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Manager Notes */}
                                                    {req.manager_notes && (
                                                        <div>
                                                            <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">رد الإدارة</h5>
                                                            <div className={`border p-4 rounded-xl shadow-sm text-sm leading-relaxed min-h-[80px] ${req.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                                                                {req.manager_notes}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Signatures */}
                                                <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    {req.employee_signature_url && (
                                                        <div className="flex-1 min-w-[200px]">
                                                            <span className="block text-[11px] font-black text-slate-400 mb-2">توقيع الموظف (أنا)</span>
                                                            <div className="h-16 bg-white border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex items-center justify-center">
                                                                <img src={req.employee_signature_url} alt="توقيعي" className="max-h-full max-w-full object-contain filter dark:invert" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {req.manager_signature_url && (
                                                        <div className="flex-1 min-w-[200px]">
                                                            <span className="block text-[11px] font-black text-slate-400 mb-2">توقيع مدير النظام</span>
                                                            <div className="h-16 bg-white border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex items-center justify-center">
                                                                <img src={req.manager_signature_url} alt="توقيع المدير" className="max-h-full max-w-full object-contain filter dark:invert" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* New Request Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal} />
                    <div className="relative bg-white/95 dark:bg-[#121820]/95 backdrop-blur-xl rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        
                        {/* Decorative background glow */}
                        <div className="absolute top-0 right-0 w-full h-40 bg-gradient-to-b from-primary-500/10 to-transparent pointer-events-none" />
                        <div className="absolute top-10 right-10 w-32 h-32 bg-primary-500/20 rounded-full blur-[50px] pointer-events-none" />

                        {/* Modal Header */}
                        <div className="relative flex items-center justify-between p-6 border-b border-slate-100/50 dark:border-slate-800/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                                    <Send size={22} strokeWidth={2} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">تقديم طلب جديد</h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">الرجاء تعبئة بيانات الطلب بدقة</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 relative z-10">
                            {/* Type Selection */}
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
                                    نوع الطلب <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {Object.entries(types).map(([key, label]) => {
                                        const TypeIcon = TYPE_ICONS[key] || FileText;
                                        const isSelected = data.type === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setData('type', key)}
                                                className={`group flex flex-col items-center justify-center gap-3 p-4 rounded-[1.25rem] border-2 font-bold text-sm transition-all duration-300 ${
                                                    isSelected
                                                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 shadow-sm'
                                                        : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 hover:border-primary-200 dark:hover:border-primary-500/30 hover:bg-white dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 ${isSelected ? 'bg-primary-500 text-white scale-110 shadow-md shadow-primary-500/30' : 'bg-white dark:bg-slate-800 text-slate-400 group-hover:text-primary-500 group-hover:scale-110'}`}>
                                                    <TypeIcon size={20} strokeWidth={isSelected ? 2 : 1.5} />
                                                </div>
                                                <span>{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.type && <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1"><X size={14} />{errors.type}</p>}
                            </div>

                            {/* Dynamic fields based on type */}
                            {selectedType === 'leave' && (
                                <div className="space-y-5 p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 shadow-inner">
                                    <h4 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
                                        <Umbrella size={18} className="text-cyan-500" />
                                        بيانات الإجازة
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">تاريخ البداية</label>
                                            <FlatpickrInput type="date" value={data.details.start_date || ''} onChange={d => updateDetail('start_date', d)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">تاريخ النهاية</label>
                                            <FlatpickrInput type="date" value={data.details.end_date || ''} onChange={d => updateDetail('end_date', d)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">نوع الإجازة</label>
                                        <SelectInput
                                            value={data.details.leave_type_id || ''}
                                            onChange={val => updateDetail('leave_type_id', val)}
                                            options={leaveBalances.map(b => ({ value: b.leave_type_id, label: `${b.leave_type_name} (متبقي: ${b.remaining_days} يوم)` }))}
                                            placeholder="اختر نوع الإجازة"
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedType === 'permission' && (
                                <div className="space-y-5 p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 shadow-inner">
                                    <h4 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
                                        <LogOut size={18} className="text-orange-500" />
                                        بيانات الاستئذان
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">التاريخ</label>
                                            <FlatpickrInput type="date" value={data.details.date || ''} onChange={d => updateDetail('date', d)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">عدد الساعات</label>
                                            <input type="number" min="1" max="8" value={data.details.hours || ''} onChange={e => updateDetail('hours', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm" placeholder="مثال: 2" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedType === 'loan' && (
                                <div className="space-y-5 p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 shadow-inner">
                                    <h4 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
                                        <CreditCard size={18} className="text-emerald-500" />
                                        بيانات السلفة
                                    </h4>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">المبلغ المطلوب</label>
                                        <div className="relative">
                                            <input type="number" min="1" value={data.details.amount || ''} onChange={e => updateDetail('amount', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-12 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm" placeholder="أدخل المبلغ" />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">ر.س</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(selectedType === 'maintenance' || selectedType === 'supplies') && (
                                <div className="p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 shadow-inner">
                                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                        {selectedType === 'maintenance' ? 'تفاصيل العطل / الصيانة المطلوبة' : 'المستلزمات المطلوبة'}
                                    </label>
                                    <textarea rows="3" value={data.details.description || ''} onChange={e => updateDetail('description', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm resize-none" placeholder="اكتب التفاصيل هنا بدقة..." />
                                </div>
                            )}

                            {/* Notes */}
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="w-1.5 h-4 bg-slate-400 rounded-full"></span>
                                    ملاحظات إضافية (اختياري)
                                </label>
                                <textarea
                                    rows="3"
                                    value={data.employee_notes}
                                    onChange={e => setData('employee_notes', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-5 py-4 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-none"
                                    placeholder="أضف أي ملاحظات أو مسوغات تتعلق بطلبك..."
                                />
                            </div>

                            {/* Signature */}
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <PenLine size={18} className="text-primary-500" />
                                    توقيعي الإلكتروني <span className="text-red-500">*</span>
                                </label>
                                <div className="bg-slate-50 dark:bg-[#0f141a] p-2 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-inner">
                                    <SignaturePad
                                        ref={signaturePadRef}
                                        onChange={handleSignature}
                                        error={errors.employee_signature}
                                    />
                                </div>
                                <div className="flex items-center justify-between px-2">
                                    {!signatureData ? (
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            يرجى رسم توقيعك بالماوس أو بالإصبع على اللوحة أعلاه
                                        </p>
                                    ) : (
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                            <CheckCircle size={14} />
                                            تم تسجيل التوقيع بنجاح
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4 pt-4 mt-8 border-t border-slate-100 dark:border-slate-800/50">
                                <button
                                    type="submit"
                                    disabled={processing || !data.type || !signatureData}
                                    className="flex-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-8 py-4 rounded-[1.25rem] font-black text-base flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 active:scale-95"
                                >
                                    <Send size={20} />
                                    {processing ? 'جاري الإرسال...' : 'إرسال الطلب الآن'}
                                </button>
                                <button type="button" onClick={closeModal} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-[1.25rem] font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Read-only View Request Modal */}
            {viewingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setViewingRequest(null)} />
                    <div className="relative bg-white/95 dark:bg-[#121820]/95 backdrop-blur-xl rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 animate-in zoom-in-95 duration-300">
                        {/* Decorative glow */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-500/5 to-transparent pointer-events-none" />
                        
                        <div className="relative flex items-center justify-between p-6 md:p-8 border-b border-slate-100/50 dark:border-slate-800/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shadow-inner">
                                    <Eye size={24} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">تفاصيل الطلب بالكامل</h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">مراجعة بيانات الطلب والموافقات</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingRequest(null)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar relative z-10">
                            {/* Header Information Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5"><Users size={14} className="text-primary-500" />الموظف</p>
                                    <p className="font-bold text-slate-800 dark:text-white truncate" title={viewingRequest.employee?.user?.name}>{viewingRequest.employee?.user?.name || '-'}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5"><Briefcase size={14} className="text-primary-500" />المسمى / الدرجة الوظيفية</p>
                                    <div className="font-bold text-slate-800 dark:text-white flex flex-wrap items-center gap-2">
                                        <span className="truncate max-w-[120px]" title={viewingRequest.employee?.job_title}>{viewingRequest.employee?.job_title || '-'}</span>
                                        {viewingRequest.employee?.job_grade && (
                                            <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full whitespace-nowrap">{viewingRequest.employee.job_grade.name}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5"><FileText size={14} className="text-primary-500" />نوع الطلب</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{viewingRequest.type_label}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5"><Calendar size={14} className="text-primary-500" />تاريخ التقديم</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{new Date(viewingRequest.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center lg:col-span-2">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5"><Activity size={14} className="text-primary-500" />الحالة الحالية</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${viewingRequest.status === 'approved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : viewingRequest.status === 'rejected' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`}></div>
                                        <p className="font-bold text-slate-800 dark:text-white">{viewingRequest.status_label}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {viewingRequest.details && Object.keys(viewingRequest.details).length > 0 && (
                                <div className="bg-white dark:bg-slate-900/30 p-5 rounded-[1.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-3">
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                        <FileText size={16} className="text-primary-500" />
                                        البيانات الإضافية للطلب
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {Object.entries(viewingRequest.details).map(([k, v]) => {
                                            if (k === 'leave_type_id') return null;
                                            const formattedKey = {
                                                start_date: 'تاريخ البداية', end_date: 'تاريخ النهاية',
                                                amount: 'المبلغ', reason: 'السبب',
                                                item_name: 'الاسم/العنصر', description: 'الوصف',
                                                date: 'التاريخ', hours: 'عدد الساعات'
                                            }[k] || k;
                                            return (
                                                <div key={k} className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl">
                                                    <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">{formattedKey}</span>
                                                    <span className="block text-sm font-bold text-slate-800 dark:text-white">{v}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {viewingRequest.employee_notes && (
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">ملاحظاتي</h4>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{viewingRequest.employee_notes}</p>
                                </div>
                            )}

                            {viewingRequest.status !== 'pending' && (
                                <div className={`p-6 border rounded-[1.5rem] space-y-5 shadow-inner ${viewingRequest.status === 'approved' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'}`}>
                                    <h4 className={`font-black text-sm flex items-center gap-2 ${viewingRequest.status === 'approved' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                                        <CheckCircle size={18} />
                                        نتيجة المراجعة والإعتماد
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl">
                                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">تمت المراجعة بواسطة</p>
                                            <p className="font-bold text-slate-800 dark:text-white">{viewingRequest.manager?.name || '-'}</p>
                                        </div>
                                        <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl">
                                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">تاريخ المراجعة</p>
                                            <p className="font-bold text-slate-800 dark:text-white">
                                                {viewingRequest.reviewed_at ? new Date(viewingRequest.reviewed_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    {viewingRequest.manager_notes && (
                                        <div className="bg-white/80 dark:bg-black/30 p-4 rounded-xl border border-white/50 dark:border-white/5">
                                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">ملاحظات الإدارة</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{viewingRequest.manager_notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Signatures */}
                            <div className="flex flex-wrap gap-6 pt-2">
                                {viewingRequest.employee_signature_url && (
                                    <div className="flex-1 min-w-[200px]">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">توقيع الموظف (أنا)</p>
                                        <div className="h-20 bg-white border border-slate-200 dark:border-slate-700 rounded-[1.25rem] p-3 flex items-center justify-center shadow-inner">
                                            <img src={viewingRequest.employee_signature_url} className="max-h-full max-w-full object-contain filter dark:invert opacity-80" alt="توقيع الموظف" />
                                        </div>
                                    </div>
                                )}
                                {viewingRequest.manager_signature_url && (
                                    <div className="flex-1 min-w-[200px]">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">توقيع مدير النظام</p>
                                        <div className="h-20 bg-white border border-slate-200 dark:border-slate-700 rounded-[1.25rem] p-3 flex items-center justify-center shadow-inner">
                                            <img src={viewingRequest.manager_signature_url} className="max-h-full max-w-full object-contain filter dark:invert opacity-80" alt="توقيع المدير" />
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}
