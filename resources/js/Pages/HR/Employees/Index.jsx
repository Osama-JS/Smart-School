import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Search, Plus, Filter, Mail, Building, ShieldCheck,
    MoreVertical, Edit2, Trash2, X, Check, Users, Calendar, Bell, AlertTriangle
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
                </div>
                <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ emp }) {
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
                className="text-slate-400 hover:text-green-600 p-2 rounded-lg hover:bg-slate-100 transition-colors inline-flex">
                <MoreVertical size={18} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
                    <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        <Edit2 size={14} className="text-indigo-500" /> تعديل البيانات
                    </button>
                    <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        <Calendar size={14} className="text-amber-500" /> سجل الإجازات
                    </button>
                    <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                        <Trash2 size={14} /> حذف الموظف
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
                عرض {data.from ?? 0} إلى {data.to ?? 0} من أصل {data.total} موظف
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
                {data.links.map((link, i) => (
                    <button key={i} disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            link.active
                                ? 'bg-[#6b9b37] text-white border-[#6b9b37]'
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function EmployeesIndex({ employees, stats, departments, filters }) {
    const { flash } = usePage().props;
    const [searchValue, setSearch]  = useState(filters?.search ?? '');
    const [deptFilter, setDeptFilter] = useState(filters?.department_id ?? '');
    const [showFilter, setShowFilter] = useState(false);
    const searchTimeout = useRef(null);

    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(route('hr.employees'), { search: val, department_id: deptFilter }, { preserveState: true, replace: true });
        }, 400);
    };

    const applyFilter = () => {
        router.get(route('hr.employees'), { search: searchValue, department_id: deptFilter }, { preserveState: true });
        setShowFilter(false);
    };

    const empData = employees?.data ?? [];

    const statCards = [
        { label: 'إجمالي الموظفين',  value: stats?.total   ?? 0, icon: Users,       color: 'text-blue-600',    bg: 'bg-blue-50' },
        { label: 'المتواجدون اليوم', value: stats?.active   ?? 0, icon: ShieldCheck,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'في إجازة',          value: stats?.onLeave ?? 0, icon: Calendar,    color: 'text-amber-600',   bg: 'bg-amber-50' },
        { label: 'طلبات معلقة',       value: stats?.pending ?? 0, icon: Bell,        color: 'text-rose-600',    bg: 'bg-rose-50' },
    ];

    return (
        <AdminLayout activeMenu="دليل الموظفين">
            <Head title="دليل الموظفين | النظام الإداري" />

            {flash?.success && (
                <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
                    <Check size={16} /> {flash.success}
                </div>
            )}

            {/* ── Header ── */}
            <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-[#6b9b37]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">دليل الموظفين الإداريين</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">إدارة ومتابعة الهيكل التنظيمي لجميع موظفي المدرسة</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowFilter(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm text-sm font-bold">
                            <Filter size={16} /> تصفية
                            {deptFilter && <span className="w-2 h-2 rounded-full bg-[#6b9b37]" />}
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6b9b37] to-[#4c7523] text-white rounded-xl hover:shadow-lg hover:shadow-[#6b9b37]/30 transition-all text-sm font-bold active:scale-95">
                            <Plus size={18} /> إضافة موظف
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 cursor-default">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                            <stat.icon size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-0.5">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Table Card ── */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-base font-bold text-slate-800">قائمة الموظفين</h2>
                    <div className="relative max-w-sm w-full">
                        <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="ابحث باسم الموظف..."
                            className="w-full bg-slate-50 border-none rounded-xl pr-10 py-2.5 text-sm focus:ring-2 focus:ring-[#6b9b37]/20 focus:bg-white transition-all outline-none"
                            value={searchValue} onChange={e => handleSearch(e.target.value)} />
                    </div>
                </div>

                {empData.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <Users size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">لا يوجد موظفون مطابقون للبحث</p>
                        <p className="text-xs mt-1">جرّب تغيير كلمة البحث أو إزالة التصفية</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الموظف</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">بريد المستخدم</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">القسم / الدرجة</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">تاريخ التعيين</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {empData.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="relative shrink-0">
                                                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow"
                                                        src={emp.avatar} alt={emp.name} />
                                                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm group-hover:text-[#6b9b37] transition-colors">{emp.name}</div>
                                                    <div className="text-xs text-slate-400 mt-0.5">@{emp.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Mail size={13} className="text-slate-300" />
                                                <span className="text-xs">{emp.username}@school.com</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                                                    <Building size={11} /> {emp.department}
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                                                    <ShieldCheck size={11} /> {emp.jobGrade}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                                            {emp.hire_date ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <ActionMenu emp={emp} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination data={employees} />
            </div>

            {/* ── Filter Modal ── */}
            <Modal isOpen={showFilter} onClose={() => setShowFilter(false)} title="تصفية الموظفين">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">القسم</label>
                        <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6b9b37]/20 bg-white"
                            value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                            <option value="">— جميع الأقسام —</option>
                            {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => { setDeptFilter(''); router.get(route('hr.employees'), { search: searchValue }); setShowFilter(false); }}
                            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إعادة ضبط</button>
                        <button onClick={applyFilter}
                            className="px-5 py-2 text-sm font-bold text-white bg-[#6b9b37] rounded-xl hover:bg-[#5a822e]">تطبيق</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
