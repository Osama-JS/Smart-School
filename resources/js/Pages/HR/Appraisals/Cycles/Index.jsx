import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Calendar, Save, Check, Clock, X, Activity, CalendarDays, BarChart } from 'lucide-react';

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden border border-white/20 dark:border-slate-800/80 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Calendar size={20} className="text-primary-500" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">✕</button>
                </div>
                <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export default function CyclesIndex({ cycles }) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        title: '',
        type: 'monthly',
        start_date: '',
        end_date: '',
        status: 'draft'
    });

    const openModal = (cycle = null) => {
        if (cycle) {
            setEditingId(cycle.id);
            setData({
                title: cycle.title,
                type: cycle.type,
                start_date: cycle.start_date,
                end_date: cycle.end_date,
                status: cycle.status
            });
        } else {
            setEditingId(null);
            reset();
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(route('hr.appraisals.cycles.update', editingId), { onSuccess: () => setShowModal(false) });
        } else {
            post(route('hr.appraisals.cycles.store'), { onSuccess: () => setShowModal(false) });
        }
    };

    const statusConfig = {
        'draft': { label: 'مسودة', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', icon: '📝' },
        'active': { label: 'نشط', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: '✓' },
        'closed': { label: 'مغلق', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: '✗' }
    };

    const typeLabels = { 'monthly': 'شهري', 'semi-annual': 'نصف سنوي', 'annual': 'سنوي' };

    return (
        <AdminLayout activeMenu="دورات التقييم">
            <Head title="دورات التقييم | النظام الإداري" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur border border-emerald-250 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <Check size={16} /> {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <CalendarDays size={28} className="text-primary-600" />
                                دورات التقييم
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة فترات التقييم الدورية (شهرية، نصف سنوية، أو سنوية)</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95">
                                <Plus size={18} />
                                <span>إضافة دورة تقييم</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                            <Calendar className="text-primary-500" size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الدورات</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{cycles.length}</h4>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Activity className="text-emerald-500" size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الدورات النشطة</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{cycles.filter(c => c.status === 'active').length}</h4>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                            <X className="text-rose-500" size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الدورات المغلقة</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{cycles.filter(c => c.status === 'closed').length}</h4>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">العنوان</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">النوع</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">الفترة</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">الحالة</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
                                {cycles.map(cycle => {
                                    const sc = statusConfig[cycle.status] || statusConfig.draft;
                                    return (
                                        <tr key={cycle.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                                                        <Calendar size={18} className="text-primary-500" />
                                                    </div>
                                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{cycle.title}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                    {typeLabels[cycle.type]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                                                    <span className="bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">{cycle.start_date}</span>
                                                    <span className="text-slate-300 dark:text-slate-600">→</span>
                                                    <span className="bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">{cycle.end_date}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>
                                                    {sc.icon} {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openModal(cycle)} className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50/70 dark:hover:bg-primary-500/10 transition-colors"><Edit2 size={16} /></button>
                                                    <button onClick={() => { if (confirm('هل أنت متأكد من الحذف؟')) destroy(route('hr.appraisals.cycles.destroy', cycle.id)); }} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 dark:hover:bg-rose-500/10 transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {cycles.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <Calendar size={28} className="text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <p className="text-slate-400 dark:text-slate-500 font-semibold">لا توجد دورات تقييم</p>
                                                <button onClick={() => openModal()} className="text-primary-500 hover:text-primary-600 text-sm font-bold hover:underline">+ إضافة أول دورة</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'تعديل الدورة' : 'إضافة دورة تقييم جديدة'}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">عنوان الدورة</label>
                            <input type="text" value={data.title} onChange={e => setData('title', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all dark:text-white font-semibold" placeholder="مثال: تقييم شهر يناير 2026" required />
                            {errors.title && <p className="text-rose-500 text-xs mt-1.5 font-semibold">{errors.title}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">نوع التقييم</label>
                                <select value={data.type} onChange={e => setData('type', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all dark:text-white font-semibold">
                                    <option value="monthly">شهري</option>
                                    <option value="semi-annual">نصف سنوي</option>
                                    <option value="annual">سنوي</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">حالة الدورة</label>
                                <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all dark:text-white font-semibold">
                                    <option value="draft">مسودة</option>
                                    <option value="active">نشط (متاح للتقييم)</option>
                                    <option value="closed">مغلق</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">تاريخ البداية</label>
                                <input type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all dark:text-white font-semibold" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">تاريخ النهاية</label>
                                <input type="date" value={data.end_date} onChange={e => setData('end_date', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all dark:text-white font-semibold" required />
                            </div>
                        </div>
                        {errors.end_date && <p className="text-rose-500 text-xs mt-1.5 font-semibold">{errors.end_date}</p>}

                        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                            <button type="submit" disabled={processing} className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-sm hover:from-primary-600 hover:to-primary-700 transition-all flex items-center gap-2 disabled:opacity-50">
                                <Save size={16} /> حفظ الدورة
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AdminLayout>
    );
}
