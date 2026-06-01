import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    CheckSquare, Clock, UserX, UserCheck, AlertTriangle,
    Calendar, Search, Filter, MapPin, Building2, Edit2,
    ChevronLeft, ChevronRight, X, Save, Users, TimerOff
} from 'lucide-react';

// ── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        present: { label: 'حاضر',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        late:    { label: 'متأخر',  bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'  },
        absent:  { label: 'غائب',   bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500'   },
        excused: { label: 'بعذر',   bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400'   },
    };
    const s = map[status] || map.absent;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
};

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, gradient }) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-2 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between">
            <div>
                <p className="text-white/75 text-sm font-medium mb-1">{label}</p>
                <p className="text-4xl font-black">{value ?? 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon size={22} />
            </div>
        </div>
    </div>
);

// ── Edit Modal ────────────────────────────────────────────────
const EditModal = ({ record, onClose, branches, shifts }) => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-lg">تعديل سجل الحضور</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                            {record.employee?.name?.[0] ?? '؟'}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{record.employee?.name}</p>
                            <p className="text-xs text-slate-400">{record.date}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">وقت الدخول</label>
                            <input type="time" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})}
                                className="erp-input text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">وقت الخروج</label>
                            <input type="time" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})}
                                className="erp-input text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">الحالة</label>
                        <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="erp-input text-sm">
                            <option value="present">حاضر</option>
                            <option value="late">متأخر</option>
                            <option value="absent">غائب</option>
                            <option value="excused">غياب بعذر</option>
                        </select>
                    </div>

                    {(form.status === 'late') && (
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">دقائق التأخير</label>
                            <input type="number" min="0" value={form.late_minutes}
                                onChange={e => setForm({...form, late_minutes: +e.target.value})}
                                className="erp-input text-sm" />
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={saving}
                            className="erp-btn erp-btn-primary flex-1 gap-2">
                            <Save size={15} />
                            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                        </button>
                        <button type="button" onClick={onClose} className="erp-btn erp-btn-secondary px-4">
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
            <div className="space-y-6">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">سجل الحضور والانصراف</h1>
                        <p className="text-slate-500 text-sm mt-0.5">متابعة حضور الموظفين وتسجيل الدوام اليومي</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
                        <Calendar size={16} className="text-slate-400" />
                        <input
                            type="date"
                            value={date}
                            onChange={e => { setDate(e.target.value); }}
                            onBlur={applyFilter}
                            className="text-sm font-bold text-slate-700 outline-none bg-transparent"
                        />
                    </div>
                </div>

                {/* Flash */}
                {flash?.success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
                        <CheckSquare size={16} /> {flash.success}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={UserCheck}   label="حاضرون"  value={stats?.present} gradient="bg-gradient-to-br from-emerald-500 to-emerald-700" />
                    <StatCard icon={AlertTriangle} label="متأخرون" value={stats?.late}    gradient="bg-gradient-to-br from-amber-400 to-orange-500" />
                    <StatCard icon={UserX}        label="غائبون"  value={stats?.absent}  gradient="bg-gradient-to-br from-rose-500 to-red-700" />
                    <StatCard icon={TimerOff}     label="بعذر"    value={stats?.excused} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
                </div>

                {/* Filters */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[180px]">
                            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="بحث باسم الموظف أو الرقم..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="erp-input pr-9 text-sm"
                            />
                        </div>
                        <select value={branchId} onChange={e => setBranchId(e.target.value)} className="erp-input text-sm w-auto min-w-[150px]">
                            <option value="">كل الفروع</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <select value={shiftId} onChange={e => setShiftId(e.target.value)} className="erp-input text-sm w-auto min-w-[150px]">
                            <option value="">كل الشفتات</option>
                            {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)})</option>)}
                        </select>
                        <button onClick={applyFilter} className="erp-btn erp-btn-primary gap-2 whitespace-nowrap">
                            <Filter size={14} /> تصفية
                        </button>
                    </div>
                </div>

                {/* Records Table */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    {records.data.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <CheckSquare size={44} className="mx-auto mb-3 opacity-30" />
                            <p className="font-semibold text-base">لا توجد سجلات حضور لهذا اليوم</p>
                            <p className="text-sm mt-1 opacity-70">جرّب تغيير التاريخ أو الفرع أو الشفت</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="erp-table">
                                    <thead>
                                        <tr>
                                            <th>الموظف</th>
                                            <th>الفرع</th>
                                            <th>الشفت</th>
                                            <th>وقت الدخول</th>
                                            <th>وقت الخروج</th>
                                            <th>الحالة</th>
                                            <th>التأخير</th>
                                            <th>الموقع</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.data.map(rec => (
                                            <tr key={rec.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                            {rec.employee?.name?.[0] ?? '؟'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{rec.employee?.name}</p>
                                                            <p className="text-xs text-slate-400">{rec.employee?.department?.name ?? '—'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                        <Building2 size={13} className="text-slate-400" />
                                                        {rec.branch?.name ?? '—'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                        <Clock size={13} className="text-slate-400" />
                                                        {rec.shift?.name ?? '—'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-sm font-semibold text-slate-700 tabular-nums">
                                                        {rec.check_in ? rec.check_in.slice(0,5) : <span className="text-slate-300">--:--</span>}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-sm font-semibold text-slate-700 tabular-nums">
                                                        {rec.check_out ? rec.check_out.slice(0,5) : <span className="text-slate-300">--:--</span>}
                                                    </span>
                                                </td>
                                                <td><StatusBadge status={rec.status} /></td>
                                                <td>
                                                    {rec.late_minutes > 0 ? (
                                                        <span className="text-xs font-bold text-amber-600">{rec.late_minutes} د</span>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {rec.check_in_lat && rec.check_in_lng ? (
                                                        <a
                                                            href={`https://maps.google.com/?q=${rec.check_in_lat},${rec.check_in_lng}`}
                                                            target="_blank" rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                        >
                                                            <MapPin size={12} /> عرض
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => setEditRecord(rec)}
                                                        className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400 flex items-center justify-center transition-colors"
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
                                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-500">
                                        عرض <span className="font-bold">{records.from}</span> - <span className="font-bold">{records.to}</span> من <span className="font-bold">{records.total}</span>
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {records.links.map((link, i) => (
                                            <button
                                                key={i}
                                                disabled={!link.url || link.active}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                                className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors ${
                                                    link.active
                                                        ? 'bg-green-600 text-white font-bold'
                                                        : !link.url
                                                        ? 'text-slate-300 cursor-default'
                                                        : 'text-slate-600 hover:bg-slate-100'
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
                    branches={branches}
                    shifts={shifts}
                    onClose={() => setEditRecord(null)}
                />
            )}
        </AdminLayout>
    );
}
