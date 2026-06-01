import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Search, Plus, ShieldCheck, Star, Users, Edit2, Trash2,
    MoreVertical, X, Check, AlertTriangle, ArrowUpRight
} from 'lucide-react';

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ grade, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div ref={ref} className="relative">
            <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                <MoreVertical size={18} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
                    <button onClick={() => { onEdit(grade); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        <Edit2 size={14} className="text-indigo-500" /> تعديل
                    </button>
                    <button onClick={() => { onDelete(grade); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                        <Trash2 size={14} /> حذف
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ data }) {
    if (!data || data.last_page <= 1) return null;
    return (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-3">
            <p className="text-xs text-slate-500 font-medium">
                عرض {data.from} إلى {data.to} من أصل {data.total} درجة
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
                {data.links.map((link, i) => (
                    <button key={i} disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            link.active
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : link.url
                                    ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    : 'bg-white text-slate-300 border-slate-100 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Level Badge ──────────────────────────────────────────────────────────────
const levelColor = (level) => {
    if (level >= 9) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (level >= 7) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (level >= 5) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function JobGradesIndex({ jobGrades, filters }) {
    const { flash } = usePage().props;
    const [searchValue, setSearch] = useState(filters?.search ?? '');
    const [showAdd, setShowAdd]    = useState(false);
    const [editGrade, setEditGrade] = useState(null);
    const [deleteGrade, setDeleteGrade] = useState(null);
    const [form, setForm]          = useState({ name: '', level: '' });
    const [processing, setProcessing] = useState(false);
    const searchTimeout = useRef(null);

    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(route('hr.job-grades'), { search: val }, { preserveState: true, replace: true });
        }, 400);
    };

    const openAdd  = () => { setForm({ name: '', level: '' }); setShowAdd(true); };
    const openEdit = (g) => { setForm({ name: g.name, level: g.level }); setEditGrade(g); };

    const handleStore = (e) => {
        e.preventDefault(); setProcessing(true);
        router.post(route('hr.job-grades.store'), form, {
            onFinish: () => { setProcessing(false); setShowAdd(false); }
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault(); setProcessing(true);
        router.put(route('hr.job-grades.update', editGrade.id), form, {
            onFinish: () => { setProcessing(false); setEditGrade(null); }
        });
    };

    const handleDelete = () => {
        router.delete(route('hr.job-grades.destroy', deleteGrade.id), {
            onFinish: () => setDeleteGrade(null)
        });
    };

    const gradesData = jobGrades?.data ?? [];

    return (
        <AdminLayout activeMenu="الدرجات الوظيفية">
            <Head title="الدرجات الوظيفية | النظام الإداري" />

            {flash?.success && (
                <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
                    <Check size={16} /> {flash.success}
                </div>
            )}

            {/* ── Header ── */}
            <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">الدرجات الوظيفية والصلاحيات</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">إدارة الهيكل الهرمي والمسميات الوظيفية</p>
                    </div>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-600/30 transition-all text-sm font-bold active:scale-95">
                        <Plus size={18} /> إضافة درجة وظيفية
                    </button>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="ابحث عن درجة وظيفية..."
                        className="w-full bg-white border border-slate-200 rounded-xl pr-11 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm outline-none"
                        value={searchValue} onChange={e => handleSearch(e.target.value)} />
                </div>
            </div>

            {/* ── Cards Grid ── */}
            {gradesData.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <ShieldCheck size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">لا توجد درجات وظيفية مطابقة</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                        {gradesData.map((grade) => (
                            <div key={grade.id}
                                className="relative bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_10px_-3px_rgba(99,102,241,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-br-[100px] -z-0" />
                                
                                <div className="relative z-10 flex justify-between items-start mb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-600 shadow-inner border border-indigo-100/50">
                                        <ShieldCheck size={24} strokeWidth={1.5} />
                                    </div>
                                    <ActionMenu grade={grade} onEdit={openEdit} onDelete={setDeleteGrade} />
                                </div>
                                
                                <div className="relative z-10 mb-6">
                                    <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors">{grade.name}</h3>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${levelColor(grade.level)}`}>
                                        <Star size={12} className="fill-current" /> مستوى {grade.level}
                                    </span>
                                </div>
                                
                                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100/80">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <Users size={12} />
                                        </div>
                                        <span>{grade.employees_count} موظف</span>
                                    </div>
                                    <button onClick={() => openEdit(grade)}
                                        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination data={jobGrades} />
                </div>
            )}

            {/* ── Add Modal ── */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة درجة وظيفية جديدة">
                <form onSubmit={handleStore} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم <span className="text-rose-500">*</span></label>
                        <input type="text" required
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">المستوى الوظيفي (1-15) <span className="text-rose-500">*</span></label>
                        <input type="number" min="1" max="15" required
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowAdd(false)}
                            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
                        <button type="submit" disabled={processing}
                            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60">
                            {processing ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Edit Modal ── */}
            <Modal isOpen={!!editGrade} onClose={() => setEditGrade(null)} title="تعديل الدرجة الوظيفية">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم <span className="text-rose-500">*</span></label>
                        <input type="text" required
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">المستوى الوظيفي (1-15)</label>
                        <input type="number" min="1" max="15" required
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setEditGrade(null)}
                            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
                        <button type="submit" disabled={processing}
                            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60">
                            {processing ? 'جاري التعديل...' : 'تعديل'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Confirm ── */}
            <Modal isOpen={!!deleteGrade} onClose={() => setDeleteGrade(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
                        <AlertTriangle size={28} className="text-rose-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 mb-1">هل أنت متأكد من الحذف؟</p>
                        <p className="text-sm text-slate-500">سيتم حذف "<span className="font-bold text-rose-600">{deleteGrade?.name}</span>" نهائياً.</p>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setDeleteGrade(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
                        <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
