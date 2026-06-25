import React, { useState, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SignaturePad from '@/Components/SignaturePad';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import {
    FileText, Plus, Clock, CheckCircle, XCircle, Send, X, ChevronDown, LayoutGrid, List, Eye,
    Umbrella, LogOut, CreditCard, Wrench, Package, Award, PenLine
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
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">طلباتي</h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تقديم الطلبات الإدارية ومتابعة حالتها</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                    <List size={18} />
                                </button>
                                <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                    <LayoutGrid size={18} />
                                </button>
                            </div>
                            <button onClick={openModal} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-primary-500/20">
                                <Plus size={18} />
                                <span>طلب جديد</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'إجمالي طلباتي', value: totalRequests, color: 'text-slate-700 dark:text-white', bg: 'bg-slate-50 dark:bg-slate-800/50', icon: FileText },
                        { label: 'معلق', value: pendingCount, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Clock },
                        { label: 'معتمد', value: approvedCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                                <stat.icon size={22} className={stat.color} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>
                                <h3 className={`text-2xl font-black ${stat.color}`}>{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Leave Balances */}
                {leaveBalances && leaveBalances.length > 0 && (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 p-6">
                        <h3 className="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Umbrella size={20} className="text-primary-500" />
                            أرصدة إجازاتي
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {leaveBalances.map(balance => (
                                <div key={balance.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">{balance.leave_type_name}</p>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-500 dark:text-slate-400">الكلي: <strong>{balance.total_days}</strong></span>
                                        <span className={balance.remaining_days > 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                            متبقي: {balance.remaining_days}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full ${balance.remaining_days > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                            style={{ width: `${balance.total_days > 0 ? Math.min(100, (balance.remaining_days / balance.total_days) * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Requests List */}
                <div className={viewMode === 'table' ? 'bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden' : 'space-y-3'}>
                    {myRequests.length === 0 ? (
                        <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 py-16 text-center">
                            <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">لا توجد طلبات بعد</h3>
                            <p className="text-slate-400 text-sm mt-1">اضغط على "طلب جديد" لتقديم طلبك الأول</p>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">نوع الطلب</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">تاريخ التقديم</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">التفاصيل</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {myRequests.map(req => {
                                        const TypeIcon = TYPE_ICONS[req.type] || FileText;
                                        const statusCfg = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
                                        const StatusIcon = statusCfg.icon;
                                        return (
                                            <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 ${statusCfg.bg} rounded-xl flex items-center justify-center shrink-0`}>
                                                            <TypeIcon size={18} className={statusCfg.text} />
                                                        </div>
                                                        <span className="font-bold text-slate-800 dark:text-white">{req.type_label}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                                                    {new Date(req.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {req.details && Object.entries(req.details).slice(0, 2).map(([k, v]) => (
                                                        <div key={k} className="text-xs mb-1">
                                                            <span className="text-slate-400">{k}: </span>
                                                            <span className="text-slate-700 dark:text-slate-300 font-bold">{v}</span>
                                                        </div>
                                                    ))}
                                                    {req.manager_notes && (
                                                        <div className="text-xs text-red-500 mt-1 line-clamp-1">رد الإدارة: {req.manager_notes}</div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${statusCfg.bg} ${statusCfg.text}`}>
                                                            <StatusIcon size={12} />
                                                            {req.status_label}
                                                        </span>
                                                        <button
                                                            onClick={() => setViewingRequest(req)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
                                                            title="عرض التفاصيل"
                                                        >
                                                            <Eye size={16} />
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
                                <div key={req.id} className={`bg-white dark:bg-[#121820]/60 rounded-3xl border transition-all ${statusCfg.border}`}>
                                    <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                                        <div className={`w-12 h-12 ${statusCfg.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                                            <TypeIcon size={22} className={statusCfg.text} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-slate-800 dark:text-white">{req.type_label}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                                                    <StatusIcon size={10} className="inline mr-1" />
                                                    {req.status_label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                                {new Date(req.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <ChevronDown size={18} className={`text-slate-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4">
                                            {req.employee_notes && (
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ملاحظاتي</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">{req.employee_notes}</p>
                                                </div>
                                            )}
                                            {req.details && Object.keys(req.details).length > 0 && (
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">تفاصيل الطلب</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {Object.entries(req.details).map(([k, v]) => {
                                                            if(k === 'leave_type_id') return null;
                                                            const formattedKey = {
                                                                start_date: 'تاريخ البداية',
                                                                end_date: 'تاريخ النهاية',
                                                                amount: 'المبلغ',
                                                                reason: 'السبب',
                                                                item_name: 'الاسم/العنصر',
                                                                description: 'الوصف',
                                                                date: 'التاريخ',
                                                                hours: 'عدد الساعات'
                                                            }[k] || k;
                                                            return (
                                                                <div key={k} className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl text-sm">
                                                                    <span className="text-slate-500 dark:text-slate-400 text-xs">{formattedKey}: </span>
                                                                    <strong className="text-slate-700 dark:text-slate-300">{v}</strong>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            {req.manager_notes && (
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ملاحظات الإدارة</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">{req.manager_notes}</p>
                                                </div>
                                            )}
                                            <div className="flex gap-4">
                                                {req.employee_signature_url && (
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 mb-1">توقيعي</p>
                                                        <img src={req.employee_signature_url} alt="توقيعي" className="h-14 border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-white" />
                                                    </div>
                                                )}
                                                {req.manager_signature_url && (
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 mb-1">توقيع المدير</p>
                                                        <img src={req.manager_signature_url} alt="توقيع المدير" className="h-14 border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* New Request Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Send className="text-primary-500" size={20} />
                                تقديم طلب جديد
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-800 dark:text-white mb-3">نوع الطلب <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(types).map(([key, label]) => {
                                        const TypeIcon = TYPE_ICONS[key] || FileText;
                                        const isSelected = data.type === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setData('type', key)}
                                                className={`flex items-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                                                    isSelected
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <TypeIcon size={16} />
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
                            </div>

                            {/* Dynamic fields based on type */}
                            {selectedType === 'leave' && (
                                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Umbrella size={16} />بيانات الإجازة</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">تاريخ البداية</label>
                                            <FlatpickrInput type="date" value={data.details.start_date || ''} onChange={d => updateDetail('start_date', d)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">تاريخ النهاية</label>
                                            <FlatpickrInput type="date" value={data.details.end_date || ''} onChange={d => updateDetail('end_date', d)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">نوع الإجازة</label>
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
                                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><LogOut size={16} />بيانات الاستئذان</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">التاريخ</label>
                                            <FlatpickrInput type="date" value={data.details.date || ''} onChange={d => updateDetail('date', d)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">عدد الساعات</label>
                                            <input type="number" min="1" max="8" value={data.details.hours || ''} onChange={e => updateDetail('hours', e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary-400" placeholder="مثال: 2" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedType === 'loan' && (
                                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><CreditCard size={16} />بيانات السلفة</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">المبلغ المطلوب</label>
                                        <input type="number" min="1" value={data.details.amount || ''} onChange={e => updateDetail('amount', e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary-400" placeholder="أدخل المبلغ" />
                                    </div>
                                </div>
                            )}

                            {(selectedType === 'maintenance' || selectedType === 'supplies') && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                        {selectedType === 'maintenance' ? 'تفاصيل العطل / الصيانة المطلوبة' : 'المستلزمات المطلوبة'}
                                    </label>
                                    <textarea rows="3" value={data.details.description || ''} onChange={e => updateDetail('description', e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none" placeholder="اكتب التفاصيل هنا..." />
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-bold text-slate-800 dark:text-white mb-2">ملاحظات إضافية (اختياري)</label>
                                <textarea
                                    rows="3"
                                    value={data.employee_notes}
                                    onChange={e => setData('employee_notes', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none"
                                    placeholder="أضف أي ملاحظات تتعلق بطلبك..."
                                />
                            </div>

                            {/* Signature */}
                            <div>
                                <label className="block text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <PenLine size={16} className="text-primary-500" />
                                    توقيعي الإلكتروني <span className="text-red-500">*</span>
                                </label>
                                <SignaturePad
                                    ref={signaturePadRef}
                                    onChange={handleSignature}
                                    error={errors.employee_signature}
                                />
                                {!signatureData && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ارسم توقيعك بالماوس أو بالإصبع على اللوحة أعلاه</p>
                                )}
                                {signatureData && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle size={12} />تم تسجيل التوقيع</p>
                                )}
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing || !data.type || !signatureData}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={18} />
                                    {processing ? 'جاري الإرسال...' : 'إرسال الطلب'}
                                </button>
                                <button type="button" onClick={closeModal} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Read-only View Request Modal */}
            {viewingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setViewingRequest(null)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                                <Eye className="text-primary-500" />
                                تفاصيل الطلب بالكامل
                            </h3>
                            <button onClick={() => setViewingRequest(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">الموظف</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{viewingRequest.employee?.user?.name || '-'}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">المسمى / الدرجة الوظيفية</p>
                                    <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        {viewingRequest.employee?.job_title || '-'}
                                        {viewingRequest.employee?.job_grade && (
                                            <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">{viewingRequest.employee.job_grade.name}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">نوع الطلب</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{viewingRequest.type_label}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">تاريخ التقديم</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{new Date(viewingRequest.created_at).toLocaleDateString('ar-SA')}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">الحالة</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{viewingRequest.status_label}</p>
                                </div>
                            </div>
                            
                            {viewingRequest.details && Object.keys(viewingRequest.details).length > 0 && (
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">البيانات الإضافية للطلب</p>
                                    {Object.entries(viewingRequest.details).map(([k, v]) => {
                                        if (k === 'leave_type_id') return null;
                                        const formattedKey = {
                                            start_date: 'تاريخ البداية',
                                            end_date: 'تاريخ النهاية',
                                            amount: 'المبلغ',
                                            reason: 'السبب',
                                            item_name: 'الاسم/العنصر',
                                            description: 'الوصف',
                                            date: 'التاريخ',
                                            hours: 'عدد الساعات'
                                        }[k] || k;
                                        return (
                                            <div key={k} className="flex justify-between text-sm">
                                                <span className="text-slate-500 dark:text-slate-400 font-bold">{formattedKey}</span>
                                                <span className="font-bold text-slate-800 dark:text-white">{v}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {viewingRequest.employee_notes && (
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ملاحظاتي</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{viewingRequest.employee_notes}</p>
                                </div>
                            )}

                            {viewingRequest.status !== 'pending' && (
                                <div className="mt-4 p-4 border border-primary-200 dark:border-primary-500/20 bg-primary-50 dark:bg-primary-500/10 rounded-2xl space-y-4">
                                    <h4 className="font-bold text-primary-700 dark:text-primary-300 text-sm mb-2 border-b border-primary-200 dark:border-primary-500/20 pb-2">بيانات المراجعة والإعتماد</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">تمت المراجعة بواسطة</p>
                                            <p className="font-bold text-slate-800 dark:text-white">{viewingRequest.manager?.name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">تاريخ المراجعة</p>
                                            <p className="font-bold text-slate-800 dark:text-white">
                                                {viewingRequest.reviewed_at ? new Date(viewingRequest.reviewed_at).toLocaleDateString('ar-SA') : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    {viewingRequest.manager_notes && (
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">ملاحظات الإدارة</p>
                                            <p className="text-sm text-slate-800 dark:text-white">{viewingRequest.manager_notes}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-4">
                                        {viewingRequest.employee_signature_url && (
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">توقيعي</p>
                                                <img src={viewingRequest.employee_signature_url} className="h-16 bg-white border border-slate-200 dark:border-slate-700 rounded-xl p-1" alt="توقيع الموظف" />
                                            </div>
                                        )}
                                        {viewingRequest.manager_signature_url && (
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">توقيع المدير</p>
                                                <img src={viewingRequest.manager_signature_url} className="h-16 bg-white border border-slate-200 dark:border-slate-700 rounded-xl p-1" alt="توقيع المدير" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}
