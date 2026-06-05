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
                className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all inline-flex border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800">
                <MoreVertical size={18} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1.5 w-44 bg-white dark:bg-[#121820] rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/60 border border-slate-100 dark:border-slate-800 z-20 overflow-hidden animate-scale-in">
                    <button className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-700 dark:hover:text-primary-450 transition-colors">
                        <Edit2 size={14} className="text-primary-500" /> تعديل البيانات
                    </button>
                    <button className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                        <Calendar size={14} className="text-amber-500" /> سجل الإجازات
                    </button>
                    <button className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
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
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10 flex-wrap gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                عرض {data.from ?? 0} إلى {data.to ?? 0} من أصل {data.total} موظف
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
                {data.links.map((link, i) => (
                    <button key={i} disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            link.active
                                ? 'bg-primary-500 text-white border-primary-500 dark:bg-primary-600 dark:border-primary-600 shadow-sm'
                                : link.url
                                    ? 'bg-white dark:bg-[#121820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                                    : 'bg-white dark:bg-[#121820]/40 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-850/50 cursor-not-allowed'
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
        { label: 'إجمالي الموظفين',  value: stats?.total   ?? 0, icon: Users,       color: 'text-primary-600 dark:text-primary-400',    bg: 'bg-primary-50 dark:bg-primary-950/20' },
        { label: 'المتواجدون اليوم', value: stats?.active   ?? 0, icon: ShieldCheck,  color: 'text-primary-700 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/20' },
        { label: 'في إجازة',          value: stats?.onLeave ?? 0, icon: Calendar,    color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/20' },
        { label: 'طلبات معلقة',       value: stats?.pending ?? 0, icon: Bell,        color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-950/20' },
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
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-[#5b8a2d]/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-[#6b9b37]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">دليل الموظفين الإداريين</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">إدارة ومتابعة الهيكل التنظيمي لجميع موظفي المدرسة</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowFilter(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all shadow-sm text-sm font-bold">
                            <Filter size={16} /> تصفية
                            {deptFilter && <span className="w-2 h-2 rounded-full bg-[#6b9b37]" />}
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6b9b37] to-[#4c7523] text-white rounded-xl hover:shadow-lg hover:shadow-[#6b9b37]/30 transition-all text-sm font-bold active:scale-95">
                            <Plus size={18} /> إضافة موظف
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat, idx) => {
                    let glowBg = 'bg-slate-500/5';
                    if (stat.color.includes('primary')) glowBg = 'bg-primary-500/5';
                    else if (stat.color.includes('amber')) glowBg = 'bg-amber-500/5';
                    else if (stat.color.includes('rose')) glowBg = 'bg-rose-500/5';

                    return (
                        <div key={idx} className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 p-5 rounded-3xl shadow-sm hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group cursor-default">
                            {/* Glowing ambient light */}
                            <div className={`absolute -left-6 -top-6 w-24 h-24 ${glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                            
                            <div className="relative z-10 min-w-0">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">{stat.label}</p>
                                <h3 className="text-2xl font-black text-dark-900 dark:text-white leading-none font-mono tracking-tight">{stat.value}</h3>
                            </div>
                            <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}>
                                <stat.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Table Card ── */}
            <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-md dark:shadow-none overflow-hidden">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/30 dark:from-transparent dark:to-transparent">
                    <h2 className="text-base font-bold text-dark-900 dark:text-white">قائمة الموظفين</h2>
                    
                    {/* Integrated Search Input */}
                    <div className="relative max-w-sm w-full flex items-center bg-slate-100/60 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 focus-within:bg-white dark:focus-within:bg-[#121820] border border-transparent dark:border-slate-800 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/10 rounded-2xl transition-all p-1">
                        <div className="flex-1 relative flex items-center">
                            <Search size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                            <input type="text" placeholder="ابحث باسم الموظف..."
                                className="w-full bg-transparent border-none pr-10 pl-3 py-2.5 text-sm outline-none text-dark-900 dark:text-slate-100 font-medium"
                                value={searchValue} onChange={e => handleSearch(e.target.value)} />
                        </div>
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
                                <tr className="bg-gradient-to-r from-primary-50 via-primary-100/50 to-primary-50 dark:from-primary-950/40 dark:via-primary-900/20 dark:to-primary-950/40 border-b border-primary-200/60 dark:border-primary-900/30">
                                    <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الموظف</th>
                                    <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">بريد المستخدم</th>
                                    <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">القسم / الدرجة</th>
                                    <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">تاريخ التعيين</th>
                                    <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الحالة</th>
                                    <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider w-16 text-center">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                                {empData.map((emp) => (
                                    <tr key={emp.id} className="group border-r-4 border-r-transparent hover:border-r-primary-500 hover:bg-primary-50/20 dark:hover:bg-gradient-to-l dark:hover:from-primary-950/20 dark:hover:to-transparent transition-all duration-300">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="relative shrink-0">
                                                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 border dark:border-slate-800 group-hover:border-primary-500/50 dark:group-hover:border-primary-500/50 shadow transition-all duration-300 group-hover:scale-105"
                                                        src={emp.avatar} alt={emp.name} />
                                                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-[#6b9b37] dark:group-hover:text-primary-400 transition-colors">{emp.name}</div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">@{emp.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <Mail size={13} className="text-slate-300 dark:text-slate-600" />
                                                <span className="text-xs">{emp.username}@school.com</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-950/20 dark:to-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-bold border border-primary-200/60 dark:border-primary-800/40 w-fit">
                                                    <Building size={11} /> {emp.department}
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200/60 dark:border-slate-800/50 w-fit">
                                                    <ShieldCheck size={11} /> {emp.jobGrade}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {emp.hire_date ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#f0f7eb] dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 border border-[#dcefd1] dark:border-primary-900/30">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                                <span>{emp.status}</span>
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

            <Modal isOpen={showFilter} onClose={() => setShowFilter(false)} title="تصفية الموظفين">
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 mb-2">القسم</label>
                        <select className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all bg-white text-slate-750 font-bold"
                            value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                            <option value="">— جميع الأقسام —</option>
                            {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => { setDeptFilter(''); router.get(route('hr.employees'), { search: searchValue }); setShowFilter(false); }}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200/70 transition-colors">إعادة ضبط</button>
                        <button onClick={applyFilter}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 rounded-2xl hover:bg-primary-600 shadow-md shadow-primary-500/10 transition-all">تطبيق التصفية</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
