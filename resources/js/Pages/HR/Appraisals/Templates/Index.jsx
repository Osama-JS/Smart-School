import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, X, Save, FileSignature, Layers, Check, BarChart, Weight } from 'lucide-react';

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
            <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden border border-white/20 dark:border-slate-800/80 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileSignature size={20} className="text-primary-500" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">✕</button>
                </div>
                <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export default function TemplatesIndex({ templates, jobGrades }) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        title: '',
        job_grade_id: '',
        description: '',
        is_active: true,
        kpis: [{ name: '', weight: 1 }]
    });

    const openModal = (template = null) => {
        if (template) {
            setEditingId(template.id);
            setData({
                title: template.title,
                job_grade_id: template.job_grade_id || '',
                description: template.description || '',
                is_active: template.is_active,
                kpis: template.kpis?.length ? template.kpis : [{ name: '', weight: 1 }]
            });
        } else {
            setEditingId(null);
            reset();
            setData('kpis', [{ name: '', weight: 1 }]);
        }
        setShowModal(true);
    };

    const addKpi = () => {
        setData('kpis', [...data.kpis, { name: '', weight: 1 }]);
    };

    const removeKpi = (index) => {
        if (data.kpis.length > 1) {
            setData('kpis', data.kpis.filter((_, i) => i !== index));
        }
    };

    const updateKpi = (index, field, value) => {
        const newKpis = [...data.kpis];
        newKpis[index][field] = value;
        setData('kpis', newKpis);
    };

    const totalWeight = data.kpis.reduce((sum, kpi) => sum + (parseInt(kpi.weight) || 0), 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(route('hr.appraisals.templates.update', editingId), { onSuccess: () => setShowModal(false) });
        } else {
            post(route('hr.appraisals.templates.store'), { onSuccess: () => setShowModal(false) });
        }
    };

    return (
        <AdminLayout activeMenu="قوالب التقييم">
            <Head title="قوالب التقييم | النظام الإداري" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur border border-emerald-250 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <Check size={16} /> {flash.success}
                    </div>
                )}

                {/* Header Section */}
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
                                <FileSignature size={28} className="text-primary-600" />
                                قوالب التقييم الإداري
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تصميم نماذج التقييم ومعايير الأداء (KPIs) لكل مسمى وظيفي</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95">
                                <Plus size={18} />
                                <span>إضافة قالب جديد</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                            <Layers className="text-primary-500" size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي القوالب</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{templates.length}</h4>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Check className="text-emerald-500" size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">القوالب المفعلة</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{templates.filter(t => t.is_active).length}</h4>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                            <BarChart className="text-amber-500" size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي المعايير</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{templates.reduce((sum, t) => sum + (t.kpis_count || 0), 0)}</h4>
                        </div>
                    </div>
                </div>

                {/* Templates Table */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">عنوان القالب</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">المسمى الوظيفي</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">عدد المعايير</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">الحالة</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
                                {templates.map(template => (
                                    <tr key={template.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                                                    <FileSignature size={18} className="text-primary-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{template.title}</p>
                                                    {template.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{template.description}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                {template.job_grade?.name || 'عام'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">
                                                <BarChart size={12} /> {template.kpis_count} معايير
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${template.is_active ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                {template.is_active ? '✓ مفعّل' : '✗ معطّل'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal(template)} className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50/70 dark:hover:bg-primary-500/10 transition-colors" title="تعديل">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا القالب؟')) destroy(route('hr.appraisals.templates.destroy', template.id)); }} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 dark:hover:bg-rose-500/10 transition-colors" title="حذف">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {templates.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <FileSignature size={28} className="text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <p className="text-slate-400 dark:text-slate-500 font-semibold">لا توجد قوالب تقييم مضافة بعد</p>
                                                <button onClick={() => openModal()} className="text-primary-500 hover:text-primary-600 text-sm font-bold hover:underline">+ إضافة أول قالب</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal for Add/Edit */}
                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'تعديل القالب' : 'إضافة قالب تقييم جديد'}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">عنوان القالب</label>
                            <input type="text" value={data.title} onChange={e => setData('title', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold" placeholder="مثال: نموذج تقييم مدير قسم" required />
                            {errors.title && <p className="text-rose-500 text-xs mt-1.5 font-semibold">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">المسمى الوظيفي المرتبط (اختياري)</label>
                            <select value={data.job_grade_id} onChange={e => setData('job_grade_id', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold">
                                <option value="">-- عام لجميع الموظفين --</option>
                                {jobGrades.map(grade => (
                                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* KPIs Section */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                                    <BarChart size={16} className="text-primary-500" /> معايير التقييم (KPIs)
                                </h4>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${totalWeight > 0 ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    إجمالي الأوزان: {totalWeight}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {data.kpis.map((kpi, index) => (
                                    <div key={index} className="flex items-center gap-3 group">
                                        <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">{index + 1}</span>
                                        <input type="text" placeholder="اسم المعيار" value={kpi.name} onChange={e => updateKpi(index, 'name', e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all dark:text-white font-semibold" required />
                                        <div className="relative w-20 shrink-0">
                                            <input type="number" placeholder="الوزن" value={kpi.weight} onChange={e => updateKpi(index, 'weight', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-center focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all dark:text-white font-bold" required min="1" />
                                        </div>
                                        <button type="button" onClick={() => removeKpi(index)} disabled={data.kpis.length <= 1} className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addKpi} className="mt-3 text-sm text-primary-600 dark:text-primary-400 font-bold flex items-center gap-1.5 hover:underline transition-colors">
                                <Plus size={14} /> إضافة معيار آخر
                            </button>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                            <button type="submit" disabled={processing} className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-sm hover:from-primary-600 hover:to-primary-700 transition-all flex items-center gap-2 disabled:opacity-50">
                                <Save size={16} /> حفظ القالب
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AdminLayout>
    );
}
