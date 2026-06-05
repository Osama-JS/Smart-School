import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    CheckSquare, Clock, UserX, UserCheck, AlertTriangle,
    Calendar, Search, Filter, MapPin, Building2, Edit2,
    X, Save, Users, TimerOff
} from 'lucide-react';

// ── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        present: { 
            label: 'حاضر',   
            bg: 'bg-[#f0f7eb] dark:bg-primary-950/20',   
            text: 'text-primary-700 dark:text-primary-400',   
            border: 'border-[#dcefd1] dark:border-primary-900/30',
            dot: 'bg-primary-500' 
        },
        late:    { 
            label: 'متأخر',  
            bg: 'bg-warning-50 dark:bg-warning-950/20',   
            text: 'text-warning-700 dark:text-warning-400',   
            border: 'border-warning-100 dark:border-warning-900/20',
            dot: 'bg-warning-500'  
        },
        absent:  { 
            label: 'غائب',   
            bg: 'bg-accent-50 dark:bg-accent-950/20',    
            text: 'text-accent-700 dark:text-accent-400',    
            border: 'border-accent-100 dark:border-accent-900/20',
            dot: 'bg-accent-500'   
        },
        excused: { 
            label: 'بعذر',   
            bg: 'bg-slate-50 dark:bg-slate-900/40',      
            text: 'text-slate-650 dark:text-slate-350',      
            border: 'border-slate-200 dark:border-slate-800',
            dot: 'bg-slate-400 dark:bg-slate-500'   
        },
    };
    const s = map[status] || map.absent;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${s.bg} ${s.text} border ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
};

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, bg }) => {
    let glowBg = 'bg-slate-500/5';
    if (color.includes('primary')) glowBg = 'bg-primary-500/5';
    else if (color.includes('warning')) glowBg = 'bg-warning-500/5';
    else if (color.includes('accent')) glowBg = 'bg-accent-500/5';

    return (
        <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 p-5 rounded-3xl shadow-sm hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group cursor-default">
            {/* Glowing ambient light */}
            <div className={`absolute -left-6 -top-6 w-24 h-24 ${glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
            
            <div className="relative z-10 min-w-0">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">{label}</p>
                <h3 className="text-2xl font-black text-dark-900 dark:text-white leading-none font-mono tracking-tight">{value ?? 0}</h3>
            </div>
            <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 ${bg} ${color} transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}>
                <Icon size={20} strokeWidth={2.5} />
            </div>
        </div>
    );
};

// ── Edit Modal ────────────────────────────────────────────────
const EditModal = ({ record, onClose }) => {
    const [form, setForm] = useState({
        check_in:    record.check_in    ? record.check_in.slice(0,5)  : '',
        check_out:   record.check_out   ? record.check_out.slice(0,5) : '',
        status:      record.status,
        late_minutes: record.late_minutes ?? 0,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);
        router.put(route('hr.attendance.update', record.id), form, {
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   () =>   setSaving(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#121820] rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800/80">
                    <h3 className="font-bold text-dark-900 dark:text-white text-lg">تعديل سجل الحضور</h3>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-400 transition-colors">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                            {record.employee?.name?.[0] ?? '؟'}
                        </div>
                        <div>
                            <p className="font-bold text-dark-900 dark:text-white text-sm">{record.employee?.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{record.date}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-450 mb-1.5">وقت الدخول</label>
                            <input type="time" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})}
                                className="w-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-450 mb-1.5">وقت الخروج</label>
                            <input type="time" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})}
                                className="w-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-450 mb-1.5">الحالة</label>
                        <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                            className="w-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#121820] text-dark-900 dark:text-slate-100 rounded-2xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all">
                            <option value="present">حاضر</option>
                            <option value="late">متأخر</option>
                            <option value="absent">غائب</option>
                            <option value="excused">غياب بعذر</option>
                        </select>
                    </div>

                    {(form.status === 'late') && (
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-450 mb-1.5">دقائق التأخير</label>
                            <input type="number" min="0" value={form.late_minutes}
                                onChange={e => setForm({...form, late_minutes: +e.target.value})}
                                className="w-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-dark-900 dark:text-slate-100 rounded-2xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all" />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl text-sm font-bold disabled:opacity-60 transition-all shadow-sm">
                            <Save size={15} />
                            <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                        </button>
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold transition-colors">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────
export default function AttendanceIndex({ records, stats, branches, shifts, filters, today }) {
    const { flash } = usePage().props;
    const [editRecord, setEditRecord] = useState(null);
    const [search, setSearch]         = useState(filters.search ?? '');
    const [date, setDate]             = useState(filters.date ?? today);
    const [branchId, setBranchId]     = useState(filters.branch_id ?? '');
    const [shiftId, setShiftId]       = useState(filters.shift_id  ?? '');

    const applyFilter = () => {
        router.get(route('hr.attendance'), { date, branch_id: branchId, shift_id: shiftId, search }, {
            preserveState: true, preserveScroll: true,
        });
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter') applyFilter(); };

    return (
        <AdminLayout activeMenu="سجل الحضور">
            <Head title="سجل الحضور والانصراف | النظام الإداري" />

            <div className="space-y-6">
                {/* Page Header - Branded like User Management */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none">
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

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">سجل الحضور والانصراف اليومي</h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 text-sm mt-2 font-semibold">متابعة حضور الموظفين وتفاصيل الدوام المدرسي اليومي</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 shadow-sm self-end sm:self-auto">
                            <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                onBlur={applyFilter}
                                className="text-sm font-bold text-slate-700 dark:text-slate-200 outline-none bg-transparent cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Flash Success */}
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 text-primary-700 px-5 py-4 rounded-2xl text-sm font-bold shadow-sm animate-slide-down">
                        <div className="h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center shrink-0">
                            <CheckSquare size={14} />
                        </div>
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={UserCheck}   label="حاضرون"  value={stats?.present} color="text-primary-600 dark:text-primary-400" bg="bg-primary-50 dark:bg-primary-950/20" />
                    <StatCard icon={AlertTriangle} label="متأخرون" value={stats?.late}    color="text-warning-600 dark:text-warning-400" bg="bg-warning-50/50 dark:bg-warning-950/20" />
                    <StatCard icon={UserX}        label="غائبون"  value={stats?.absent}  color="text-accent-600 dark:text-accent-400"  bg="bg-accent-50 dark:bg-accent-950/20" />
                    <StatCard icon={TimerOff}     label="بعذر"    value={stats?.excused} color="text-slate-600 dark:text-slate-450"   bg="bg-slate-50 dark:bg-slate-900/40" />
                </div>

                {/* Filters Row */}
                <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-sm p-5">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px] flex items-center bg-slate-100/60 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 focus-within:bg-white dark:focus-within:bg-[#121820] border border-transparent dark:border-slate-800 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/10 rounded-2xl transition-all p-1">
                            <div className="flex-1 relative flex items-center">
                                <Search size={16} className="absolute right-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="بحث باسم الموظف أو الرقم الوظيفي..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full bg-transparent border-none pr-10 pl-3 py-2 text-sm outline-none text-dark-900 dark:text-slate-100 font-medium"
                                />
                            </div>
                        </div>
                        <select value={branchId} onChange={e => setBranchId(e.target.value)}
                            className="border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all bg-white dark:bg-[#121820] text-dark-900 dark:text-slate-200 min-w-[150px]">
                            <option value="">كل الفروع</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <select value={shiftId} onChange={e => setShiftId(e.target.value)}
                            className="border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all bg-white dark:bg-[#121820] text-dark-900 dark:text-slate-200 min-w-[180px]">
                            <option value="">كل الشفتات</option>
                            {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)})</option>)}
                        </select>
                        <button onClick={applyFilter}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/30 transition-all text-sm font-bold active:scale-95">
                            <Filter size={14} /> 
                            <span>تصفية</span>
                        </button>
                    </div>
                </div>

                {/* Records Table Card */}
                <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-md dark:shadow-none overflow-hidden">
                    {records.data.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <CheckSquare size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700 opacity-80 animate-pulse" />
                            <p className="font-bold text-slate-500 text-sm">لا توجد سجلات حضور مطابقة لمعايير البحث</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">جرّب تغيير التاريخ أو معايير التصفية</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-primary-50 via-primary-100/50 to-primary-50 dark:from-primary-950/40 dark:via-primary-900/20 dark:to-primary-950/40 border-b border-primary-200/60 dark:border-primary-900/30">
                                            <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الموظف</th>
                                            <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الفرع</th>
                                            <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الشفت</th>
                                            <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">وقت الدخول</th>
                                            <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">وقت الخروج</th>
                                            <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الحالة</th>
                                            <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">التأخير</th>
                                            <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الموقع</th>
                                            <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider text-center">الإجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                                        {records.data.map(rec => (
                                            <tr key={rec.id} className="group border-r-4 border-r-transparent hover:border-r-primary-500 hover:bg-primary-50/20 dark:hover:bg-gradient-to-l dark:hover:from-primary-950/20 dark:hover:to-transparent transition-all duration-300">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-850 dark:to-slate-950 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
                                                            {rec.employee?.name?.[0] ?? '؟'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-dark-900 dark:text-white text-[14px] leading-snug group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{rec.employee?.name}</p>
                                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{rec.employee?.department?.name ?? '—'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300">
                                                        <Building2 size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                                        <span>{rec.branch?.name ?? '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300">
                                                        <Clock size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                                        <span>{rec.shift?.name ?? '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                                                        {rec.check_in ? rec.check_in.slice(0,5) : <span className="text-slate-350 dark:text-slate-600 font-normal">--:--</span>}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                                                        {rec.check_out ? rec.check_out.slice(0,5) : <span className="text-slate-350 dark:text-slate-600 font-normal">--:--</span>}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge status={rec.status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {rec.late_minutes > 0 ? (
                                                        <span className="text-xs font-bold text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-950/20 px-2 py-1 rounded-lg border border-warning-100 dark:border-warning-900/20 font-mono">{rec.late_minutes} د</span>
                                                    ) : (
                                                        <span className="text-slate-350 dark:text-slate-600 text-xs font-semibold">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {rec.check_in_lat && rec.check_in_lng ? (
                                                        <a
                                                            href={`https://maps.google.com/?q=${rec.check_in_lat},${rec.check_in_lng}`}
                                                            target="_blank" rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline font-extrabold"
                                                        >
                                                            <MapPin size={13} /> 
                                                            <span>عرض</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-350 dark:text-slate-600 text-xs font-semibold">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => setEditRecord(rec)}
                                                        className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 text-slate-400 dark:text-slate-500 inline-flex items-center justify-center transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {records.last_page > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10 flex-wrap gap-3">
                                    <p className="text-xs text-slate-500 dark:text-slate-450 font-bold">
                                        عرض <span className="font-extrabold text-slate-700 dark:text-slate-300">{records.from}</span> - <span className="font-extrabold text-slate-700 dark:text-slate-300">{records.to}</span> من <span className="font-extrabold text-slate-700 dark:text-slate-300">{records.total}</span>
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap font-sans" dir="ltr">
                                        {records.links.map((link, i) => (
                                            <button
                                                key={i}
                                                disabled={!link.url || link.active}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-200 ${
                                                    link.active
                                                        ? 'bg-primary-500 text-white border-primary-500 dark:bg-primary-600 dark:border-primary-600 shadow-sm'
                                                        : !link.url
                                                        ? 'text-slate-300 dark:text-slate-650 border-slate-100 dark:border-slate-850/50 cursor-not-allowed'
                                                        : 'bg-white dark:bg-[#121820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-primary-600 dark:hover:text-primary-400'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editRecord && (
                <EditModal
                    record={editRecord}
                    onClose={() => setEditRecord(null)}
                />
            )}
        </AdminLayout>
    );
}
