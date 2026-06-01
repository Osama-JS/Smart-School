import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Search, Plus, Building, Users, FolderTree, ChevronRight,
    ChevronDown, Edit2, Trash2, MoreVertical, X, Check, AlertTriangle
} from 'lucide-react';

// ─── Tree Node Component ───────────────────────────────────────────────────────
function TreeNode({ node, depth = 0 }) {
    const [open, setOpen] = useState(depth < 1);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className={`${depth > 0 ? 'mr-5 border-r-2 border-slate-100 pr-3' : ''}`}>
            <div
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer group"
                onClick={() => hasChildren && setOpen(!open)}
            >
                <span className="text-slate-400 w-4 flex-shrink-0">
                    {hasChildren
                        ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)
                        : <span className="block w-1 h-1 rounded-full bg-slate-300 mx-auto" />}
                </span>
                <Building size={14} className={depth === 0 ? 'text-indigo-500' : 'text-slate-400'} />
                <span className={`text-sm font-semibold ${depth === 0 ? 'text-slate-800' : 'text-slate-600'}`}>
                    {node.name}
                </span>
            </div>
            {open && hasChildren && (
                <div className="mt-0.5">
                    {node.children.map(child => (
                        <TreeNode key={child.id} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Modal Component ───────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ dept, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
                <MoreVertical size={18} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
                    <button
                        onClick={() => { onEdit(dept); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Edit2 size={14} className="text-indigo-500" /> تعديل
                    </button>
                    <button
                        onClick={() => { onDelete(dept); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                        <Trash2 size={14} /> حذف
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ data }) {
    if (!data || data.last_page <= 1) return null;
    return (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-3">
            <p className="text-xs text-slate-500 font-medium">
                عرض {data.from} إلى {data.to} من أصل {data.total} قسم
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
                {data.links.map((link, i) => (
                    <button
                        key={i}
                        disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            link.active
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DepartmentsIndex({ departments, tree, parentOptions, filters }) {
    const { flash } = usePage().props;

    const [view, setView]           = useState('grid'); // 'grid' | 'tree'
    const [searchValue, setSearch]  = useState(filters?.search ?? '');
    const [showAdd, setShowAdd]     = useState(false);
    const [editDept, setEditDept]   = useState(null);
    const [deleteDept, setDeleteDept] = useState(null);
    const [form, setForm]           = useState({ name: '', parent_id: '' });
    const [processing, setProcessing] = useState(false);
    const searchTimeout = useRef(null);

    // Live search with debounce
    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(route('hr.departments'), { search: val }, { preserveState: true, replace: true });
        }, 400);
    };

    const openAdd = () => { setForm({ name: '', parent_id: '' }); setShowAdd(true); };
    const openEdit = (dept) => { setForm({ name: dept.name, parent_id: dept.parent_id ?? '' }); setEditDept(dept); };

    const handleStore = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('hr.departments.store'), form, {
            onFinish: () => { setProcessing(false); setShowAdd(false); }
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.put(route('hr.departments.update', editDept.id), form, {
            onFinish: () => { setProcessing(false); setEditDept(null); }
        });
    };

    const handleDelete = () => {
        router.delete(route('hr.departments.destroy', deleteDept.id), {
            onFinish: () => setDeleteDept(null)
        });
    };

    const deptData = departments?.data ?? [];

    return (
        <AdminLayout activeMenu="الأقسام والإدارات">
            <Head title="إدارة الأقسام | النظام الإداري" />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
                    <Check size={16} /> {flash.success}
                </div>
            )}

            {/* ── Header ── */}
            <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">إدارة الأقسام والإدارات</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">بناء وتعديل الهيكل التنظيمي للمدرسة</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setView(view === 'grid' ? 'tree' : 'grid')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm text-sm font-bold"
                        >
                            <FolderTree size={16} />
                            {view === 'grid' ? 'عرض شجري' : 'عرض البطاقات'}
                        </button>
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-600/30 transition-all text-sm font-bold active:scale-95"
                        >
                            <Plus size={18} /> إضافة قسم جديد
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tree View ── */}
            {view === 'tree' ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <FolderTree size={18} className="text-indigo-500" /> الهيكل التنظيمي الشجري
                    </h2>
                    {tree && tree.length > 0
                        ? tree.map(node => <TreeNode key={node.id} node={node} depth={0} />)
                        : <p className="text-slate-400 text-sm text-center py-8">لا توجد أقسام بعد</p>}
                </div>
            ) : (
                <>
                    {/* ── Search ── */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="ابحث عن قسم..."
                                className="w-full bg-white border border-slate-200 rounded-xl pr-11 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm outline-none"
                                value={searchValue}
                                onChange={e => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ── Cards Grid ── */}
                    {deptData.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <Building size={40} className="mx-auto mb-3 opacity-40" />
                            <p className="font-medium">لا توجد أقسام مطابقة</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {deptData.map((dept) => (
                                    <div
                                        key={dept.id}
                                        className="relative bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-[100px] -z-0" />
                                        
                                        <div className="relative z-10 flex justify-between items-start mb-5">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 shadow-inner border border-blue-100/50">
                                                <Building size={24} strokeWidth={1.5} />
                                            </div>
                                            <ActionMenu dept={dept} onEdit={openEdit} onDelete={setDeleteDept} />
                                        </div>
                                        
                                        <div className="relative z-10 mb-6">
                                            <h3 className="text-lg font-black text-slate-800 mb-1.5 group-hover:text-blue-700 transition-colors">{dept.name}</h3>
                                            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 bg-slate-50 w-fit px-2.5 py-1 rounded-md">
                                                <FolderTree size={12} className="text-slate-300" />
                                                {dept.parent_name ? `يتبع: ${dept.parent_name}` : 'قسم رئيسي (إدارة)'}
                                            </p>
                                        </div>
                                        
                                        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100/80">
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2 rtl:space-x-reverse opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-7 h-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 text-[10px] font-bold"><Users size={12}/></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-500">{dept.employees_count} موظف</span>
                                            </div>
                                            <button
                                                onClick={() => openEdit(dept)}
                                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination data={departments} />
                        </div>
                    )}
                </>
            )}

            {/* ── Add Modal ── */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة قسم جديد">
                <form onSubmit={handleStore} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم القسم <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">القسم الأب (اختياري)</label>
                        <select
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all bg-white"
                            value={form.parent_id}
                            onChange={e => setForm({ ...form, parent_id: e.target.value })}
                        >
                            <option value="">— قسم رئيسي —</option>
                            {parentOptions?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
                            {processing ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Edit Modal ── */}
            <Modal isOpen={!!editDept} onClose={() => setEditDept(null)} title="تعديل القسم">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم القسم <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">القسم الأب (اختياري)</label>
                        <select
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                            value={form.parent_id}
                            onChange={e => setForm({ ...form, parent_id: e.target.value })}
                        >
                            <option value="">— قسم رئيسي —</option>
                            {parentOptions?.filter(p => p.id !== editDept?.id).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setEditDept(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
                            {processing ? 'جاري التعديل...' : 'تعديل'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal isOpen={!!deleteDept} onClose={() => setDeleteDept(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
                        <AlertTriangle size={28} className="text-rose-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 mb-1">هل أنت متأكد من حذف القسم؟</p>
                        <p className="text-sm text-slate-500">سيتم حذف "<span className="font-bold text-rose-600">{deleteDept?.name}</span>" بشكل نهائي.</p>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setDeleteDept(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">إلغاء</button>
                        <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
