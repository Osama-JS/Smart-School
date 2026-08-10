import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import SelectInput from '@/Components/SelectInput';
import { Plus, Edit2, Trash2, X, Save, FileSignature, Layers, Check, BarChart, ChevronDown, ChevronUp, Target, Sparkles, GripVertical, ToggleLeft, ToggleRight, Briefcase, Scale, Eye, EyeOff, AlertCircle } from 'lucide-react';

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 600 }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = parseInt(value) || 0;
        if (end === 0) { setCount(0); return; }
        const step = Math.max(1, Math.floor(end / (duration / 16)));
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return <span>{count}</span>;
}

// ─── KPI Progress Ring ────────────────────────────────────────────────────────
function KpiRing({ count, max = 10 }) {
    const pct = Math.min((count / max) * 100, 100);
    const r = 18, c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;
    return (
        <svg width="48" height="48" className="transform -rotate-90">
            <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" />
            <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="text-primary-500 transition-all duration-700" />
            <text x="24" y="24" textAnchor="middle" dominantBaseline="central" className="fill-primary-600 dark:fill-primary-400 text-[11px] font-black transform rotate-90 origin-center">{count}</text>
        </svg>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
    const overlayRef = useRef(null);
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div ref={overlayRef} className="absolute inset-0 bg-slate-900/50 backdrop-blur-xl animate-fade-in" onClick={onClose} />
            <div className="relative bg-white/95 dark:bg-[#0f1720]/95 backdrop-blur-2xl rounded-[28px] shadow-2xl shadow-slate-900/10 dark:shadow-black/30 w-full max-w-2xl z-10 overflow-hidden border border-white/30 dark:border-slate-700/50 animate-scale-in">
                {/* Modal Header */}
                <div className="relative px-7 py-5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-400 via-primary-500 to-violet-500" />
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                <FileSignature size={18} className="text-white" />
                            </div>
                            {title}
                        </h3>
                        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-500/10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all active:scale-90">
                            <X size={16} />
                        </button>
                    </div>
                </div>
                <div className="p-7 max-h-[75vh] overflow-y-auto custom-scrollbar">{children}</div>
            </div>
        </div>
    );
}

// ─── Template Card ────────────────────────────────────────────────────────────
function TemplateCard({ template, onEdit, onDelete, index }) {
    const [expanded, setExpanded] = useState(false);
    const totalWeight = template.kpis?.reduce((sum, kpi) => sum + (parseInt(kpi.weight) || 0), 0) || 0;

    return (
        <div
            className="group relative bg-white dark:bg-[#121820]/70 rounded-[22px] border border-slate-100/80 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:shadow-primary-500/[0.04] dark:hover:shadow-primary-500/[0.02] transition-all duration-500 hover:-translate-y-1 overflow-hidden"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {/* Top accent */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${template.is_active ? 'from-emerald-400 via-primary-500 to-violet-500' : 'from-slate-300 via-slate-400 to-slate-300 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700'} transition-all duration-300`} />

            {/* Card Body */}
            <div className="p-6">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/70 dark:from-primary-500/15 dark:to-primary-500/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <FileSignature size={22} className="text-primary-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base font-black text-slate-800 dark:text-white truncate mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {template.title}
                            </h3>
                            {template.description && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">{template.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold tracking-wide shrink-0 ${
                        template.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 ring-1 ring-slate-200/50 dark:ring-slate-700/50'
                    }`}>
                        {template.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        {template.is_active ? 'مُفعّل' : 'مُعطّل'}
                    </div>
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap items-center gap-2.5 mb-5">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                        <Briefcase size={13} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{template.job_grade?.name || 'عام لجميع الموظفين'}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50/50 dark:bg-primary-500/5 border border-primary-100/50 dark:border-primary-500/10">
                        <Target size={13} className="text-primary-500" />
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{template.kpis_count || template.kpis?.length || 0} معيار أداء</span>
                    </div>
                    {totalWeight > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50/50 dark:bg-violet-500/5 border border-violet-100/50 dark:border-violet-500/10">
                            <Scale size={13} className="text-violet-500" />
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">وزن إجمالي: {totalWeight}</span>
                        </div>
                    )}
                </div>

                {/* KPIs Preview */}
                {template.kpis && template.kpis.length > 0 && (
                    <div className="mb-4">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/30 transition-colors group/btn"
                        >
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <BarChart size={13} className="text-primary-400" />
                                معايير الأداء ({template.kpis.length})
                            </span>
                            {expanded ? <ChevronUp size={14} className="text-slate-400 group-hover/btn:text-primary-500 transition-colors" /> : <ChevronDown size={14} className="text-slate-400 group-hover/btn:text-primary-500 transition-colors" />}
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-out ${expanded ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                            <div className="space-y-2">
                                {template.kpis.map((kpi, idx) => {
                                    const weightPct = totalWeight > 0 ? ((parseInt(kpi.weight) || 0) / totalWeight) * 100 : 0;
                                    return (
                                        <div key={idx} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-100/60 dark:border-slate-800/40">
                                            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-500/20 dark:to-primary-500/10 flex items-center justify-center text-[10px] font-black text-primary-600 dark:text-primary-400 shrink-0">{idx + 1}</span>
                                            <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{kpi.name}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                    <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-violet-500 transition-all duration-500" style={{ width: `${weightPct}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 w-6 text-left">{kpi.weight}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions Row */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100/80 dark:border-slate-800/40">
                    <button
                        onClick={() => onEdit(template)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50/70 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 border border-primary-200/30 dark:border-primary-500/10 transition-all active:scale-95"
                    >
                        <Edit2 size={13} /> تعديل
                    </button>
                    <button
                        onClick={() => { if (confirm('هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.')) onDelete(template.id); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200/30 dark:border-rose-500/10 transition-all active:scale-95"
                    >
                        <Trash2 size={13} /> حذف
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TemplatesIndex({ templates, jobGrades }) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, inactive

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

    const handleDelete = (id) => {
        destroy(route('hr.appraisals.templates.destroy', id));
    };

    const filteredTemplates = templates.filter(t => {
        if (filter === 'active') return t.is_active;
        if (filter === 'inactive') return !t.is_active;
        return true;
    });

    const activeCount = templates.filter(t => t.is_active).length;
    const totalKpis = templates.reduce((sum, t) => sum + (t.kpis_count || t.kpis?.length || 0), 0);

    return (
        <AdminLayout activeMenu="قوالب التقييم">
            <Head title="قوالب التقييم | النظام الإداري" />

            <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
                {/* Flash Message */}
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur border border-emerald-200/60 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        {flash.success}
                    </div>
                )}

                {/* ── Hero Header ── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/80 via-white to-violet-50/30 dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-violet-500/5 border border-primary-100/70 dark:border-primary-500/10 rounded-[28px] p-7 md:p-9 shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-400 via-primary-600 to-violet-500" />
                    {/* Decorative Background */}
                    <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <path d="M-50 160 C 200 60, 300 220, 500 160 C 700 100, 800 260, 950 160" stroke="currentColor" strokeWidth="1.5" className="text-violet-500" />
                            <circle cx="200" cy="80" r="60" className="fill-primary-500" />
                            <circle cx="600" cy="140" r="40" className="fill-violet-500" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                    <FileSignature size={22} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                                        قوالب التقييم
                                    </h1>
                                </div>
                            </div>
                            <p className="text-primary-700/70 dark:text-primary-300/60 text-sm font-semibold mr-14">
                                تصميم نماذج التقييم ومعايير الأداء لكل درجة وظيفية
                            </p>
                        </div>

                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-xl hover:shadow-primary-500/15 text-sm font-bold transition-all active:scale-[0.97] shrink-0 group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>إضافة قالب جديد</span>
                        </button>
                    </div>
                </div>

                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {[
                        {
                            title: 'إجمالي القوالب', value: templates.length, icon: Layers,
                            iconBg: 'bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-500/15 dark:to-primary-500/5',
                            iconColor: 'text-primary-500', accent: 'from-primary-500/5 to-transparent'
                        },
                        {
                            title: 'القوالب المفعلة', value: activeCount, icon: Check,
                            iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/15 dark:to-emerald-500/5',
                            iconColor: 'text-emerald-500', accent: 'from-emerald-500/5 to-transparent'
                        },
                        {
                            title: 'إجمالي معايير الأداء', value: totalKpis, icon: Target,
                            iconBg: 'bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-500/15 dark:to-violet-500/5',
                            iconColor: 'text-violet-500', accent: 'from-violet-500/5 to-transparent'
                        },
                    ].map((stat, i) => (
                        <div key={i} className="relative bg-white dark:bg-[#121820]/60 p-6 rounded-[22px] border border-slate-100/80 dark:border-slate-800/50 shadow-sm flex items-center gap-5 transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            <div className={`relative w-14 h-14 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className={stat.iconColor} size={26} />
                            </div>
                            <div className="relative">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5 tracking-wide">{stat.title}</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                                    <AnimatedCounter value={stat.value} />
                                </h4>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Filter Tabs ── */}
                <div className="flex items-center gap-2 bg-white/60 dark:bg-[#121820]/40 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800/50 w-fit backdrop-blur-sm">
                    {[
                        { key: 'all', label: 'الكل', count: templates.length },
                        { key: 'active', label: 'المفعلة', count: activeCount },
                        { key: 'inactive', label: 'المعطلة', count: templates.length - activeCount },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                filter === tab.key
                                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {tab.label}
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                                filter === tab.key
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* ── Templates Grid ── */}
                {filteredTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredTemplates.map((template, index) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onEdit={openModal}
                                onDelete={handleDelete}
                                index={index}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-[28px] border border-slate-100 dark:border-slate-800 p-16 text-center">
                        <div className="flex flex-col items-center gap-5">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                                <FileSignature size={36} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-base mb-1">
                                    {filter === 'all' ? 'لا توجد قوالب تقييم مضافة بعد' : filter === 'active' ? 'لا توجد قوالب مفعلة' : 'لا توجد قوالب معطلة'}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                                    {filter === 'all' ? 'ابدأ بإنشاء أول قالب تقييم لموظفيك' : 'جرّب تغيير الفلتر لعرض القوالب الأخرى'}
                                </p>
                            </div>
                            {filter === 'all' && (
                                <button
                                    onClick={() => openModal()}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-primary-500/15 transition-all active:scale-95"
                                >
                                    <Sparkles size={16} /> إنشاء أول قالب
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Modal for Add/Edit ── */}
                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'تعديل القالب' : 'إضافة قالب تقييم جديد'}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Template Title */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                <FileSignature size={13} className="text-primary-400" />
                                عنوان القالب
                            </label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                className="w-full bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                placeholder="مثال: نموذج تقييم مدير قسم"
                                required
                            />
                            {errors.title && <p className="flex items-center gap-1.5 text-rose-500 text-xs mt-2 font-semibold"><AlertCircle size={12} />{errors.title}</p>}
                        </div>

                        {/* Job Grade + Status Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                    <Briefcase size={13} className="text-primary-400" />
                                    الدرجة الوظيفية
                                </label>
                                <SelectInput
                                    value={data.job_grade_id}
                                    onChange={val => setData('job_grade_id', val)}
                                    className="w-full bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                                    options={[
                                        { value: '', label: 'عام لجميع الموظفين' },
                                        ...jobGrades.map(grade => ({ value: grade.id, label: grade.name }))
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                    {data.is_active ? <Eye size={13} className="text-emerald-400" /> : <EyeOff size={13} className="text-slate-400" />}
                                    حالة القالب
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setData('is_active', !data.is_active)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-sm font-bold transition-all ${
                                        data.is_active
                                            ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200/60 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-slate-50/80 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    <span>{data.is_active ? 'مُفعّل — يظهر للموظفين' : 'مُعطّل — مخفي عن الموظفين'}</span>
                                    {data.is_active ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                وصف القالب (اختياري)
                            </label>
                            <textarea
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                rows={2}
                                className="w-full bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none"
                                placeholder="وصف مختصر عن الغرض من هذا القالب..."
                            />
                        </div>

                        {/* KPIs Section */}
                        <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 p-5">
                            <div className="flex items-center justify-between mb-5">
                                <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-2.5 text-sm">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center">
                                        <Target size={14} className="text-white" />
                                    </div>
                                    معايير الأداء (KPIs)
                                </h4>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                    totalWeight > 0
                                        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-200/50 dark:ring-primary-500/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 ring-1 ring-slate-200/50 dark:ring-slate-700/50'
                                }`}>
                                    <Scale size={12} />
                                    الوزن: {totalWeight}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {data.kpis.map((kpi, index) => (
                                    <div key={index} className="flex items-center gap-3 group/kpi bg-white dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100/70 dark:border-slate-800/40 hover:border-primary-200/50 dark:hover:border-primary-500/20 transition-colors">
                                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-500/20 dark:to-primary-500/10 flex items-center justify-center text-[10px] font-black text-primary-600 dark:text-primary-400 shrink-0">
                                            {index + 1}
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="اسم المعيار"
                                            value={kpi.name}
                                            onChange={e => updateKpi(index, 'name', e.target.value)}
                                            className="flex-1 bg-transparent border-0 text-sm focus:ring-0 outline-none dark:text-white font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                            required
                                        />
                                        <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1">
                                            <Scale size={11} className="text-slate-400" />
                                            <input
                                                type="number"
                                                value={kpi.weight}
                                                onChange={e => updateKpi(index, 'weight', e.target.value)}
                                                className="w-10 bg-transparent border-0 text-xs text-center focus:ring-0 outline-none dark:text-white font-black"
                                                required
                                                min="1"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeKpi(index)}
                                            disabled={data.kpis.length <= 1}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addKpi}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm text-primary-600 dark:text-primary-400 font-bold hover:border-primary-300 dark:hover:border-primary-500/30 hover:bg-primary-50/50 dark:hover:bg-primary-500/5 transition-all active:scale-[0.98]"
                            >
                                <Plus size={15} /> إضافة معيار أداء جديد
                            </button>
                        </div>

                        {/* Submit Row */}
                        <div className="flex items-center justify-end gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 disabled:opacity-50 hover:shadow-lg hover:shadow-primary-500/15 active:scale-95"
                            >
                                <Save size={16} />
                                {editingId ? 'تحديث القالب' : 'حفظ القالب'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AdminLayout>
    );
}
