import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Plus, Clock, Edit2, Trash2, MoreVertical, X, Check, AlertTriangle, AlertCircle } from 'lucide-react';

function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-100 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-50">
                    <h3 className="text-lg font-bold text-dark-900">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors">✕</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

function ActionMenu({ shift, onEdit, onDelete }) {
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
                className="text-slate-400 hover:text-primary-600 p-1.5 rounded-xl hover:bg-primary-50 transition-colors">
                <MoreVertical size={18} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-2xl shadow-lg border border-slate-100 z-20 overflow-hidden animate-slide-down">
                    <button onClick={() => { onEdit(shift); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                        <Edit2 size={14} className="text-primary-500" /> تعديل
                    </button>
                    <button onClick={() => { onDelete(shift); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-accent-600 hover:bg-accent-50 transition-colors">
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
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 flex-wrap gap-3">
            <p className="text-xs text-slate-500 font-medium font-sans">عرض {data.from} إلى {data.to} من {data.total}</p>
            <div className="flex items-center gap-1.5 flex-wrap font-sans" dir="ltr">
                {data.links.map((link, i) => (
                    <button key={i} disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ${
                            link.active
                                ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                : link.url
                                    ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-primary-600'
                                    : 'bg-white text-slate-300 border-slate-100 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
            </div>
        </div>
    );
}

export default function ShiftsIndex({ shifts, filters }) {
    const { flash } = usePage().props;
    const [searchValue, setSearch] = useState(filters?.search ?? '');
    const [showAdd, setShowAdd] = useState(false);
    const [editShift, setEditShift] = useState(null);
    const [deleteShift, setDeleteShift] = useState(null);
    const [form, setForm] = useState({ name: '', start_time: '', end_time: '', grace_period_minutes: 15, is_active: true });
    const [processing, setProcessing] = useState(false);
    const searchTimeout = useRef(null);

    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(route('hr.shifts'), { search: val }, { preserveState: true, replace: true });
        }, 400);
    };

    const openAdd = () => { setForm({ name: '', start_time: '', end_time: '', grace_period_minutes: 15, is_active: true }); setShowAdd(true); };
    const openEdit = (s) => { 
        setForm({ 
            name: s.name, 
            start_time: s.start_time.substring(0,5), 
            end_time: s.end_time.substring(0,5), 
            grace_period_minutes: s.grace_period_minutes, 
            is_active: s.is_active 
        }); 
        setEditShift(s); 
    };

    const handleStore = (e) => {
        e.preventDefault(); setProcessing(true);
        router.post(route('hr.shifts.store'), form, { onFinish: () => { setProcessing(false); setShowAdd(false); } });
    };

    const handleUpdate = (e) => {
        e.preventDefault(); setProcessing(true);
        router.put(route('hr.shifts.update', editShift.id), form, { onFinish: () => { setProcessing(false); setEditShift(null); } });
    };

    const handleDelete = () => {
        router.delete(route('hr.shifts.destroy', deleteShift.id), { onFinish: () => setDeleteShift(null) });
    };

    const shiftsData = shifts?.data ?? [];

    const formatTime = (time) => {
        if (!time) return '';
        const [h, m] = time.split(':');
        let hours = parseInt(h);
        const ampm = hours >= 12 ? 'م' : 'ص';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        return `${hours}:${m} ${ampm}`;
    };

    return (
        <AdminLayout activeMenu="الشفتات">
            <Head title="إدارة الشفتات | النظام الإداري" />

            {flash?.success && (
                <div className="mb-6 flex items-center gap-3 bg-primary-50 border border-primary-200 text-primary-700 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down">
                    <Check size={16} /> {flash.success}
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
                        <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">إدارة شفتات العمل</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">التحكم في أوقات الدوام الرسمي وساعات العمل</p>
                    </div>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95">
                        <Plus size={18} /> 
                        <span>إضافة شفت جديد</span>
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="ابحث عن شفت..."
                        className="w-full bg-white border border-slate-200 rounded-2xl pr-11 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all shadow-sm"
                        value={searchValue} onChange={e => handleSearch(e.target.value)} />
                </div>
            </div>

            {shiftsData.length === 0 ? (
                <div className="text-center py-16 text-slate-400 erp-premium-card">
                    <Clock size={40} className="mx-auto mb-3 opacity-40 text-primary-600" />
                    <p className="font-medium">لا توجد شفتات مطابقة</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                        {shiftsData.map((shift) => (
                            <div key={shift.id} className="relative erp-premium-card group overflow-hidden">
                                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-primary-500/5 to-transparent rounded-br-[100px] -z-0" />
                                
                                <div className="relative z-10 flex justify-between items-start mb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/30 flex items-center justify-center text-primary-600 shadow-inner border border-primary-100/20">
                                        <Clock size={24} strokeWidth={1.5} />
                                    </div>
                                    <ActionMenu shift={shift} onEdit={openEdit} onDelete={setDeleteShift} />
                                </div>
                                
                                <div className="relative z-10 mb-6">
                                    <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-primary-600 transition-colors flex items-center gap-2">
                                        {shift.name}
                                        {!shift.is_active && <span className="text-[10px] bg-accent-50 text-accent-600 px-2.5 py-0.5 rounded-full font-bold border border-accent-100">غير فعال</span>}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2 font-sans" dir="rtl">
                                        <span className="text-sm font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">{formatTime(shift.start_time)}</span>
                                        <span className="text-slate-400 text-xs">إلى</span>
                                        <span className="text-sm font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">{formatTime(shift.end_time)}</span>
                                    </div>
                                </div>
                                
                                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100/80">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                        <AlertCircle size={14} className="text-warning-500" />
                                        <span>سماحية: {shift.grace_period_minutes} دقيقة</span>
                                    </div>
                                    <button onClick={() => openEdit(shift)} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination data={shifts} />
                </div>
            )}

            {/* Modals */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة شفت جديد">
                <form onSubmit={handleStore} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم <span className="text-accent-500">*</span></label>
                        <input type="text" required className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">وقت البدء <span className="text-accent-500">*</span></label>
                            <input type="time" required className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">وقت الانتهاء <span className="text-accent-500">*</span></label>
                            <input type="time" required className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">فترة السماح (بالدقائق) <span className="text-accent-500">*</span></label>
                        <input type="number" min="0" required className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all" value={form.grace_period_minutes} onChange={e => setForm({ ...form, grace_period_minutes: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="add_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                        <label htmlFor="add_active" className="text-sm font-bold text-slate-700 cursor-pointer">شفت فعال</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-5 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl disabled:opacity-60 transition-colors shadow-sm">حفظ</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!editShift} onClose={() => setEditShift(null)} title="تعديل الشفت">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم <span className="text-accent-500">*</span></label>
                        <input type="text" required className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">وقت البدء <span className="text-accent-500">*</span></label>
                            <input type="time" required className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">وقت الانتهاء <span className="text-accent-500">*</span></label>
                            <input type="time" required className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">فترة السماح (بالدقائق) <span className="text-accent-500">*</span></label>
                        <input type="number" min="0" required className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all" value={form.grace_period_minutes} onChange={e => setForm({ ...form, grace_period_minutes: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="edit_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                        <label htmlFor="edit_active" className="text-sm font-bold text-slate-700 cursor-pointer">شفت فعال</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setEditShift(null)} className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-5 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl disabled:opacity-60 transition-colors shadow-sm">تعديل</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!deleteShift} onClose={() => setDeleteShift(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-4 animate-scale-in">
                    <div className="w-14 h-14 rounded-full bg-accent-50 flex items-center justify-center">
                        <AlertTriangle size={28} className="text-accent-500 animate-pulse" />
                    </div>
                    <div>
                        <p className="font-bold text-dark-900 mb-1">هل أنت متأكد من الحذف؟</p>
                        <p className="text-sm text-slate-500">سيتم حذف "<span className="font-bold text-accent-500">{deleteShift?.name}</span>".</p>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setDeleteShift(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">إلغاء</button>
                        <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-bold text-white bg-accent-50 rounded-2xl hover:bg-accent-600 transition-colors">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
