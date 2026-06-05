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
            <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-100 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-50">
                    <div className="text-lg font-bold text-dark-900">{title}</div>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors">✕</button>
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
                className="text-slate-400 hover:text-primary-600 p-2.5 rounded-xl hover:bg-slate-100/80 transition-all inline-flex border border-transparent hover:border-slate-200/50">
                <MoreVertical size={16} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1.5 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-scale-in">
                    <button onClick={() => { onEdit(branch); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                        <Edit2 size={14} className="text-primary-500" /> تعديل الفرع
                    </button>
                    <button onClick={() => { onDelete(branch); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-accent-600 hover:bg-accent-50 transition-colors">
                        <Trash2 size={14} /> حذف الفرع
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
            <div className="flex gap-1.5">
                {data.links.map((link, i) => (
                    <button key={i} disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            link.active
                                ? 'bg-primary-500 text-white border-primary-500'
                                : link.url
                                    ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    : 'bg-white text-slate-300 border-slate-100 cursor-not-allowed'
                        }`}
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

            {/* Header Section with Brand Colors and Geometric Accent */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none">
                {/* Brand Line Accent */}
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                
                {/* Fine abstract geometric background lines */}
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                        <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                        <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                        <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                    </svg>
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">إدارة فروع المدرسة</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">التحكم في فروع ومقرات العمليات</p>
                    </div>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95">
                        <Plus size={18} /> 
                        <span>إضافة فرع جديد</span>
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="ابحث عن فرع..."
                        className="w-full bg-white border border-slate-200 rounded-2xl pr-11 pl-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all font-semibold text-slate-750"
                        value={searchValue} onChange={e => handleSearch(e.target.value)} />
                </div>
            </div>

            {branchesData.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Store size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">لا توجد فروع مطابقة</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {branchesData.map((branch) => (
                            <div key={branch.id} className="relative bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group overflow-hidden border-t-4 border-t-primary-500 hover:border-primary-300">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary-500/5 to-transparent rounded-bl-[100px] -z-0" />
                                
                                <div className="relative z-10 flex justify-between items-start mb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/30 flex items-center justify-center text-primary-600 shadow-inner border border-primary-100/30">
                                        <Store size={24} strokeWidth={1.5} />
                                    </div>
                                    <ActionMenu branch={branch} onEdit={openEdit} onDelete={setDeleteBranch} />
                                </div>
                                
                                <div className="relative z-10 mb-6">
                                    <h3 className="text-lg font-black text-dark-900 mb-2 group-hover:text-primary-700 transition-colors flex items-center gap-2">
                                        {branch.name}
                                        {!branch.is_active && <span className="text-[10px] bg-accent-50 text-accent-600 px-2 py-0.5 rounded-full font-bold">مغلق</span>}
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
                                        <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-primary-600"><Users size={12}/></div>
                                        <span>{branch.users_count} مستخدم</span>
                                    </div>
                                    <button onClick={() => openEdit(branch)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-colors">
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
                <form onSubmit={handleStore} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 mb-2">الاسم <span className="text-accent-500">*</span></label>
                        <input type="text" required className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all font-semibold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 mb-2">العنوان</label>
                        <input type="text" className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all font-semibold" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 mb-2">رقم الهاتف</label>
                        <input type="text" dir="ltr" className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all font-semibold" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="flex items-center pt-2">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div className="relative">
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="sr-only" />
                                <div className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out ${form.is_active ? 'bg-primary-500' : 'bg-slate-200'}`} />
                                <div className={`absolute top-1 right-1 bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-200 ease-in-out ${form.is_active ? '-translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">فرع نشط</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200/70 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 transition-all disabled:opacity-60">حفظ الفرع</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!editBranch} onClose={() => setEditBranch(null)} title="تعديل الفرع">
                <form onSubmit={handleUpdate} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 mb-2">الاسم <span className="text-accent-500">*</span></label>
                        <input type="text" required className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all font-semibold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 mb-2">العنوان</label>
                        <input type="text" className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all font-semibold" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 mb-2">رقم الهاتف</label>
                        <input type="text" dir="ltr" className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all font-semibold" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="flex items-center pt-2">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div className="relative">
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="sr-only" />
                                <div className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out ${form.is_active ? 'bg-primary-500' : 'bg-slate-200'}`} />
                                <div className={`absolute top-1 right-1 bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-200 ease-in-out ${form.is_active ? '-translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">فرع نشط</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setEditBranch(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200/70 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 transition-all disabled:opacity-60">تعديل الفرع</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!deleteBranch} onClose={() => setDeleteBranch(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-accent-50 flex items-center justify-center animate-pulse">
                        <AlertTriangle size={32} className="text-accent-500" />
                    </div>
                    <div>
                        <p className="font-bold text-dark-900 text-lg mb-1">تأكيد الحذف</p>
                        <p className="text-sm text-slate-500">هل أنت متأكد من الحذف؟ سيتم حذف الفرع "<span className="font-bold text-accent-600">{deleteBranch?.name}</span>" نهائياً.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setDeleteBranch(null)} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200/70 transition-colors">إلغاء</button>
                        <button onClick={handleDelete} className="flex-1 py-3 text-sm font-bold text-white bg-accent-500 hover:bg-accent-600 rounded-2xl shadow-md shadow-accent-500/10 transition-all">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
