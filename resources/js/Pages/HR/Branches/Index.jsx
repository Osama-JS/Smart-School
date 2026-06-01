import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Plus, MapPin, Phone, Users, Edit2, Trash2, MoreVertical, X, Check, AlertTriangle, Store } from 'lucide-react';

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

function ActionMenu({ branch, onEdit, onDelete }) {
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
                    <button onClick={() => { onEdit(branch); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        <Edit2 size={14} className="text-indigo-500" /> تعديل
                    </button>
                    <button onClick={() => { onDelete(branch); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                        <Trash2 size={14} /> حذف
                    </button>
                </div>
            )}
        </div>
    );
}

function Pagination({ data }) {
    if (!data || data.last_page <= 1) return null;
    return (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-3">
            <p className="text-xs text-slate-500 font-medium">عرض {data.from} إلى {data.to} من {data.total}</p>
            <div className="flex gap-1">
                {data.links.map((link, i) => (
                    <button key={i} disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${link.active ? 'bg-indigo-600 text-white border-indigo-600' : link.url ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' : 'bg-white text-slate-300 border-slate-100'}`}
                        dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
            </div>
        </div>
    );
}

export default function BranchesIndex({ branches, filters }) {
    const { flash, errors } = usePage().props;
    const [searchValue, setSearch] = useState(filters?.search ?? '');
    const [showAdd, setShowAdd] = useState(false);
    const [editBranch, setEditBranch] = useState(null);
    const [deleteBranch, setDeleteBranch] = useState(null);
    const [form, setForm] = useState({ name: '', address: '', phone: '', is_active: true });
    const [processing, setProcessing] = useState(false);
    const searchTimeout = useRef(null);

    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(route('hr.branches'), { search: val }, { preserveState: true, replace: true });
        }, 400);
    };

    const openAdd = () => { setForm({ name: '', address: '', phone: '', is_active: true }); setShowAdd(true); };
    const openEdit = (b) => { setForm({ name: b.name, address: b.address || '', phone: b.phone || '', is_active: b.is_active }); setEditBranch(b); };

    const handleStore = (e) => {
        e.preventDefault(); setProcessing(true);
        router.post(route('hr.branches.store'), form, { onFinish: () => { setProcessing(false); setShowAdd(false); } });
    };

    const handleUpdate = (e) => {
        e.preventDefault(); setProcessing(true);
        router.put(route('hr.branches.update', editBranch.id), form, { onFinish: () => { setProcessing(false); setEditBranch(null); } });
    };

    const handleDelete = () => {
        router.delete(route('hr.branches.destroy', deleteBranch.id), { onFinish: () => setDeleteBranch(null) });
    };

    const branchesData = branches?.data ?? [];

    return (
        <AdminLayout activeMenu="الفروع">
            <Head title="إدارة الفروع | النظام الإداري" />

            {flash?.success && (
                <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
                    <Check size={16} /> {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold">
                    <AlertTriangle size={16} /> {flash.error}
                </div>
            )}

            <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">إدارة فروع المدرسة</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">التحكم في فروع ومقرات العمليات</p>
                    </div>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-600/30 transition-all text-sm font-bold active:scale-95">
                        <Plus size={18} /> إضافة فرع جديد
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="ابحث عن فرع..."
                        className="w-full bg-white border border-slate-200 rounded-xl pr-11 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={searchValue} onChange={e => handleSearch(e.target.value)} />
                </div>
            </div>

            {branchesData.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Store size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">لا توجد فروع مطابقة</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {branchesData.map((branch) => (
                            <div key={branch.id} className="relative bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_10px_-3px_rgba(99,102,241,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-[100px] -z-0" />
                                
                                <div className="relative z-10 flex justify-between items-start mb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-600 shadow-inner border border-indigo-100/50">
                                        <Store size={24} strokeWidth={1.5} />
                                    </div>
                                    <ActionMenu branch={branch} onEdit={openEdit} onDelete={setDeleteBranch} />
                                </div>
                                
                                <div className="relative z-10 mb-6">
                                    <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors flex items-center gap-2">
                                        {branch.name}
                                        {!branch.is_active && <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">مغلق</span>}
                                    </h3>
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <MapPin size={13} className="text-slate-400" /> {branch.address || 'غير محدد'}
                                        </p>
                                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <Phone size={13} className="text-slate-400" /> <span dir="ltr">{branch.phone || 'غير محدد'}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100/80">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><Users size={12}/></div>
                                        <span>{branch.users_count} مستخدم</span>
                                    </div>
                                    <button onClick={() => openEdit(branch)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination data={branches} />
                </div>
            )}

            {/* Modals... */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة فرع جديد">
                <form onSubmit={handleStore} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم <span className="text-rose-500">*</span></label>
                        <input type="text" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">العنوان</label>
                        <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">رقم الهاتف</label>
                        <input type="text" dir="ltr" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                        <label className="text-sm font-bold text-slate-700">فرع نشط</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl disabled:opacity-60">حفظ</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!editBranch} onClose={() => setEditBranch(null)} title="تعديل الفرع">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم <span className="text-rose-500">*</span></label>
                        <input type="text" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">العنوان</label>
                        <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">رقم الهاتف</label>
                        <input type="text" dir="ltr" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                        <label className="text-sm font-bold text-slate-700">فرع نشط</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setEditBranch(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl disabled:opacity-60">تعديل</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!deleteBranch} onClose={() => setDeleteBranch(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
                        <AlertTriangle size={28} className="text-rose-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 mb-1">هل أنت متأكد من الحذف؟</p>
                        <p className="text-sm text-slate-500">سيتم حذف "<span className="font-bold text-rose-600">{deleteBranch?.name}</span>".</p>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setDeleteBranch(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
                        <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
