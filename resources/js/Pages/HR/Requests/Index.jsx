import React, { useState, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SignaturePad from '@/Components/SignaturePad';
import {
    FileText, Clock, CheckCircle, XCircle, Users, Filter, Eye,
    X, PenLine, ChevronDown, Umbrella, LogOut, CreditCard, Wrench, Package, Award
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
    rejected: { bg: 'bg-red-50 dark:bg-red-500/10',       text: 'text-red-600 dark:text-red-400',       border: 'border-red-200 dark:border-red-500/30' },
};

export default function RequestsIndex({ requests, stats, types, statuses, filters, leaveBalances }) {
    const { flash } = usePage().props;
    const [reviewingRequest, setReviewingRequest] = useState(null);
    const [viewingRequest, setViewingRequest] = useState(null);
    const [signatureData, setSignatureData] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        status: '',
        manager_notes: '',
        manager_signature: '',
        updated_details: {},
    });

    const openReview = (req, status) => {
        setReviewingRequest(req);
        setSignatureData(null);
        reset();
        setData({
            status: status,
            manager_notes: '',
            manager_signature: '',
            updated_details: req.details || {},
        });
    };

    const closeReview = () => {
        setReviewingRequest(null);
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
        post(route('hr.requests.review', reviewingRequest.id), {
            onSuccess: () => closeReview(),
        });
    };

    const applyFilter = (key, val) => {
        router.get(route('hr.requests.index'), { ...filters, [key]: val }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout activeMenu="إدارة الطلبات">
            <Head title="إدارة طلبات الموظفين" />

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
                    <div className="relative z-10">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">إدارة طلبات الموظفين</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">مراجعة واعتماد الطلبات الواردة من الموظفين</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'معلقة', value: stats.pending, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Clock },
                        { label: 'معتمدة', value: stats.approved, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle },
                        { label: 'مرفوضة', value: stats.rejected, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', icon: XCircle },
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

                {/* Filters */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 p-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <Filter size={16} className="text-slate-400 shrink-0" />
                        <div className="flex flex-wrap gap-2">
                            {[{ value: '', label: 'الكل' }, { value: 'pending', label: 'معلق' }, { value: 'approved', label: 'معتمد' }, { value: 'rejected', label: 'مرفوض' }].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => applyFilter('status', opt.value)}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${filters.status === opt.value || (!filters.status && opt.value === '') ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2 mr-4 border-r border-slate-200 dark:border-slate-700 pr-4">
                            {[{ value: '', label: 'جميع الأنواع' }, ...Object.entries(types).map(([k, v]) => ({ value: k, label: v }))].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => applyFilter('type', opt.value)}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${filters.type === opt.value || (!filters.type && opt.value === '') ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    {requests.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">لا توجد طلبات</h3>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الموظف</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">نوع الطلب</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الحالة</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">تاريخ التقديم</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">التوقيع</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {requests.data.map(req => {
                                        const TypeIcon = TYPE_ICONS[req.type] || FileText;
                                        const statusCfg = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
                                        return (
                                            <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-slate-800 dark:text-white">{req.employee?.user?.name || '-'}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                                        <TypeIcon size={15} className="text-primary-500" />
                                                        {req.type_label}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                                                        {req.status_label}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                                                    {new Date(req.created_at).toLocaleDateString('ar-EG')}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {req.employee_signature_url ? (
                                                        <img src={req.employee_signature_url} alt="توقيع الموظف" className="h-8 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-white" />
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {req.status === 'pending' ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => openReview(req, 'approved')}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-200 dark:border-emerald-500/30"
                                                            >
                                                                <CheckCircle size={13} />
                                                                اعتماد
                                                            </button>
                                                            <button
                                                                onClick={() => openReview(req, 'rejected')}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/30"
                                                            >
                                                                <XCircle size={13} />
                                                                رفض
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-400">
                                                                {req.manager?.name || 'تم المراجعة'}
                                                            </span>
                                                            <button
                                                                onClick={() => setViewingRequest(req)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {reviewingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeReview} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className={`flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0`}>
                            <h3 className={`text-xl font-bold flex items-center gap-2 ${data.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {data.status === 'approved' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                {data.status === 'approved' ? 'اعتماد الطلب' : 'رفض الطلب'}
                            </h3>
                            <button onClick={closeReview} className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={submitReview} className="p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Request Summary */}
                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">الموظف</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{reviewingRequest.employee?.user?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">نوع الطلب</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{reviewingRequest.type_label}</span>
                                </div>
                                
                                {/* Dynamic Details Display */}
                                {reviewingRequest.details && Object.entries(reviewingRequest.details).map(([key, val]) => {
                                    if(key === 'leave_type_id') return null; // We handle this specifically later
                                    const formattedKey = {
                                        start_date: 'تاريخ البداية',
                                        end_date: 'تاريخ النهاية',
                                        amount: 'المبلغ',
                                        reason: 'السبب',
                                        item_name: 'الاسم/العنصر',
                                        description: 'الوصف',
                                    }[key] || key;
                                    return (
                                        <div key={key} className="flex justify-between text-sm">
                                            <span className="text-slate-500 dark:text-slate-400 font-bold">{formattedKey}</span>
                                            <span className="font-bold text-slate-800 dark:text-white">{val}</span>
                                        </div>
                                    );
                                })}

                                {reviewingRequest.employee_notes && (
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 font-bold text-xs">ملاحظات الموظف</span>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{reviewingRequest.employee_notes}</p>
                                    </div>
                                )}
                                {reviewingRequest.employee_signature_url && (
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 font-bold text-xs">توقيع الموظف</span>
                                        <img src={reviewingRequest.employee_signature_url} alt="توقيع الموظف" className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-white mt-1" />
                                    </div>
                                )}
                            </div>

                            {/* Leave Balances Display and Type Change (Only for leaves & when approving) */}
                            {reviewingRequest.type === 'leave' && data.status === 'approved' && (
                                <div className="bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20 rounded-2xl p-4">
                                    <label className="block text-sm font-bold text-slate-800 dark:text-white mb-2">نوع الإجازة المراد الاستقطاع منها</label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">يمكنك تغيير نوع الإجازة أو الرصيد الذي سيتم خصم الأيام منه</p>
                                    <select
                                        value={data.updated_details.leave_type_id || ''}
                                        onChange={e => setData('updated_details', { ...data.updated_details, leave_type_id: e.target.value })}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-400"
                                        required
                                    >
                                        <option value="">-- اختر الرصيد --</option>
                                        {(leaveBalances[reviewingRequest.employee_id] || []).map(b => (
                                            <option key={b.leave_type_id} value={b.leave_type_id}>
                                                {b.leaveType?.name || 'نوع مجهول'} (متبقي: {Math.max(0, b.total_days - b.used_days)} يوم)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Manager Notes */}
                            <div>
                                <label className="block text-sm font-bold text-slate-800 dark:text-white mb-2">
                                    {data.status === 'approved' ? 'ملاحظات الاعتماد (اختياري)' : 'سبب الرفض *'}
                                </label>
                                <textarea
                                    rows="3"
                                    value={data.manager_notes}
                                    onChange={e => setData('manager_notes', e.target.value)}
                                    required={data.status === 'rejected'}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none"
                                    placeholder={data.status === 'approved' ? 'يمكنك إضافة ملاحظات...' : 'اكتب سبب الرفض...'}
                                />
                                {errors.manager_notes && <p className="text-xs text-red-500 mt-1">{errors.manager_notes}</p>}
                            </div>

                            {/* Manager Signature (required for approval) */}
                            {data.status === 'approved' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                        <PenLine size={16} className="text-primary-500" />
                                        توقيعي الإلكتروني (للاعتماد) <span className="text-red-500">*</span>
                                    </label>
                                    <SignaturePad
                                        onChange={handleSignature}
                                        error={errors.manager_signature}
                                    />
                                    {signatureData && (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle size={12} />تم تسجيل التوقيع</p>
                                    )}
                                </div>
                            )}

                            {/* Submit */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing || (data.status === 'approved' && !signatureData)}
                                    className={`flex-1 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                        ${data.status === 'approved' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
                                >
                                    {data.status === 'approved' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                    {processing ? 'جاري الحفظ...' : (data.status === 'approved' ? 'تأكيد الاعتماد' : 'تأكيد الرفض')}
                                </button>
                                <button type="button" onClick={closeReview} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
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
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">توقيع الموظف</p>
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

                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
