import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, ShieldCheck, Check, AlertTriangle, Users as UsersIcon } from 'lucide-react';

// ── Modal ─────────────────────────────────────────────────────────────────────
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
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">✕</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

// ── Action Menu ───────────────────────────────────────────────────────────────
function ActionMenu({ user, onDelete }) {
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
                className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-100 transition-colors inline-flex">
                <MoreVertical size={18} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
                    <Link href={route('users.edit', user.id)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        <Edit2 size={14} className="text-indigo-500" /> تعديل
                    </Link>
                    <button onClick={() => { onDelete(user); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                        <Trash2 size={14} /> حذف
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function UsersIndex({ users, roles, filters }) {
    const { flash } = usePage().props;
    const [searchValue, setSearch] = useState(filters?.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters?.role_id ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');
    const [showFilter, setShowFilter] = useState(false);
    const [showDel, setShowDel] = useState(null);
    const searchTimeout = useRef(null);

    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(route('users.index'), { search: val, role_id: roleFilter, status: statusFilter }, { preserveState: true, replace: true });
        }, 400);
    };

    const applyFilter = () => {
        router.get(route('users.index'), { search: searchValue, role_id: roleFilter, status: statusFilter }, { preserveState: true });
        setShowFilter(false);
    };

    const handleDelete = () => {
        router.delete(route('users.destroy', showDel.id), {
            onFinish: () => setShowDel(null)
        });
    };

    const usersData = users?.data ?? [];

    return (
        <AdminLayout activeMenu="المستخدمون">
            <Head title="إدارة المستخدمين | النظام الإداري" />

            {flash?.success && (
                <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
                    <Check size={16} /> {flash.success}
                </div>
            )}

            <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">إدارة المستخدمين</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">التحكم الكامل في حسابات دخول النظام وصلاحياتها</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowFilter(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-bold shadow-sm">
                            <Filter size={16} /> تصفية
                            {(roleFilter || statusFilter) && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                        </button>
                        <Link href={route('users.create')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg text-sm font-bold">
                            <Plus size={18} /> إضافة مستخدم
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-base font-bold text-slate-800">قائمة المستخدمين</h2>
                    <div className="relative max-w-sm w-full">
                        <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="بحث بالاسم أو اسم المستخدم..."
                            className="w-full bg-slate-50 border-none rounded-xl pr-10 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                            value={searchValue} onChange={e => handleSearch(e.target.value)} />
                    </div>
                </div>

                {usersData.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <UsersIcon size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">لا يوجد مستخدمون مطابقون</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">المستخدم</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الدور (الصلاحية)</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الفرع</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {usersData.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar} className="w-10 h-10 rounded-full" />
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                                                    <p className="text-xs text-slate-400">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                                                <ShieldCheck size={12} /> {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {user.branch}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.is_active ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">نشط</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700">معطل</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <ActionMenu user={user} onDelete={setShowDel} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Filter Modal */}
            <Modal isOpen={showFilter} onClose={() => setShowFilter(false)} title="تصفية المستخدمين">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">الدور</label>
                        <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white"
                            value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                            <option value="">الكل</option>
                            {roles?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">الحالة</label>
                        <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white"
                            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">الكل</option>
                            <option value="active">نشط</option>
                            <option value="inactive">معطل</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => { setRoleFilter(''); setStatusFilter(''); router.get(route('users.index'), { search: searchValue }); setShowFilter(false); }}
                            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">إعادة ضبط</button>
                        <button onClick={applyFilter}
                            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl">تطبيق</button>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={!!showDel} onClose={() => setShowDel(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
                        <AlertTriangle size={28} className="text-rose-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 mb-1">تأكيد حذف المستخدم</p>
                        <p className="text-sm text-slate-500">هل تريد حذف "{showDel?.name}" نهائياً؟</p>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setShowDel(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
                        <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
