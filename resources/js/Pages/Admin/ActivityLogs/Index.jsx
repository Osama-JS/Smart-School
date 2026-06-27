import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import {
    Activity, Search, Filter, Eye, Clock, User,
    Database, MapPin, Plus, Edit2, Trash2, ShieldAlert,
    History, CheckCircle2, BarChart3
} from 'lucide-react';
import Modal from '@/Components/Modal';
import SelectInput from '@/Components/SelectInput';

function Pagination({ data }) {
    if (!data || data.last_page <= 1) return null;
    return (
        <div className="px-6 py-4 border-t border-dark-100 dark:border-dark-800/85 flex items-center justify-between bg-dark-50/50 dark:bg-dark-900/10 flex-wrap gap-3 no-print">
            <p className="text-xs text-dark-500 dark:text-dark-400 font-bold">
                عرض {data.from ?? 0} إلى {data.to ?? 0} من أصل {data.total}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
                {data.links.map((link, i) => (
                    <button key={i} disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            link.active
                                ? 'bg-primary-500 text-white border-primary-500 dark:bg-primary-600 dark:border-primary-600 shadow-sm'
                                : link.url
                                    ? 'bg-white dark:bg-dark-900 text-dark-600 dark:text-dark-300 border-dark-200 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-800'
                                    : 'bg-white dark:bg-dark-900/40 text-dark-300 dark:text-dark-600 border-dark-100 dark:border-dark-800/50 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function ActivityLogsIndex({ logs, filters, tables, branches = [], departments = [], isSystemAdmin }) {
    const [search, setSearch] = useState(filters.search || '');
    const [action, setAction] = useState(filters.action || '');
    const [tableName, setTableName] = useState(filters.table_name || '');
    const [branchId, setBranchId] = useState(filters.branch_id || '');
    const [departmentId, setDepartmentId] = useState(filters.department_id || '');
    const [selectedLog, setSelectedLog] = useState(null);

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('admin.activity-logs.index'), {
            search, action, table_name: tableName, branch_id: branchId, department_id: departmentId
        }, { preserveState: true, preserveScroll: true });
    };

    const getActionBadge = (actionStr) => {
        if (actionStr === 'إنشاء') return <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5 shadow-sm w-fit"><Plus size={14} strokeWidth={2.5}/> إنشاء</span>;
        if (actionStr === 'تحديث') return <span className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-500/20 flex items-center gap-1.5 shadow-sm w-fit"><Edit2 size={14} strokeWidth={2.5}/> تحديث</span>;
        if (actionStr === 'حذف') return <span className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-500/20 flex items-center gap-1.5 shadow-sm w-fit"><Trash2 size={14} strokeWidth={2.5}/> حذف</span>;
        return <span className="px-2.5 py-1.5 rounded-lg bg-dark-100 text-dark-600 dark:bg-dark-800 dark:text-dark-300 text-xs font-bold border border-dark-200 dark:border-dark-700 shadow-sm w-fit">{actionStr}</span>;
    };

    const renderDiff = (log) => {
        if (!log) return null;

        const oldKeys = log.old_values ? Object.keys(log.old_values) : [];
        const newKeys = log.new_values ? Object.keys(log.new_values) : [];
        const allKeys = [...new Set([...oldKeys, ...newKeys])].filter(key => {
            const oldVal = log.old_values ? log.old_values[key] : undefined;
            const newVal = log.new_values ? log.new_values[key] : undefined;
            return oldVal !== newVal;
        });

        return (
            <div className="space-y-5">
                {/* Header info strip */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-dark-50 dark:bg-dark-800/50 rounded-2xl border border-dark-100 dark:border-dark-700/50">
                    <div className="flex-1 min-w-[130px]">
                        <p className="text-xs text-dark-500 dark:text-dark-400 mb-1 font-bold">المستخدم</p>
                        <p className="text-sm font-black text-dark-800 dark:text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                                <User size={11} strokeWidth={2.5} />
                            </span>
                            {log.user?.name || 'النظام'}
                        </p>
                    </div>
                    <div className="w-px h-8 bg-dark-200 dark:bg-dark-700 hidden sm:block" />
                    <div className="flex-1 min-w-[130px]">
                        <p className="text-xs text-dark-500 dark:text-dark-400 mb-1 font-bold">الجدول</p>
                        <p className="text-sm font-black text-dark-800 dark:text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Database size={11} strokeWidth={2.5} />
                            </span>
                            {log.table_name}
                        </p>
                    </div>
                    <div className="w-px h-8 bg-dark-200 dark:bg-dark-700 hidden sm:block" />
                    <div className="flex-1 min-w-[100px]">
                        <p className="text-xs text-dark-500 dark:text-dark-400 mb-1 font-bold">نوع العملية</p>
                        <p className="text-sm font-black text-dark-800 dark:text-white">{getActionBadge(log.action)}</p>
                    </div>
                    <div className="w-px h-8 bg-dark-200 dark:bg-dark-700 hidden sm:block" />
                    <div className="flex-1 min-w-[130px]">
                        <p className="text-xs text-dark-500 dark:text-dark-400 mb-1 font-bold">تاريخ الحركة</p>
                        <p className="text-sm font-black text-dark-800 dark:text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Clock size={11} strokeWidth={2.5} />
                            </span>
                            <span dir="ltr">{new Date(log.created_at).toLocaleString('en-US')}</span>
                        </p>
                    </div>
                </div>

                {/* Changes table */}
                <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-dark-100 dark:border-dark-700">
                    {allKeys.length === 0 ? (
                        <div className="p-10 text-center text-dark-400 dark:text-dark-500 bg-dark-50 dark:bg-dark-900/50 flex flex-col items-center">
                            <CheckCircle2 size={36} className="mb-3 text-emerald-500 opacity-80" />
                            <p className="font-black text-base text-dark-800 dark:text-dark-200">لا توجد حقول معدلة فعلياً</p>
                            <p className="text-sm mt-1">يبدو أن هذه الحركة لم تغير أي بيانات.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-dark-50 dark:bg-dark-800">
                                    <th className="text-right px-4 py-3 font-black text-dark-600 dark:text-dark-300 border-b border-dark-100 dark:border-dark-700 w-1/4">الحقل</th>
                                    <th className="text-right px-4 py-3 font-black text-rose-600 dark:text-rose-400 border-b border-l border-dark-100 dark:border-dark-700 w-[37.5%]">القيمة القديمة</th>
                                    <th className="text-right px-4 py-3 font-black text-emerald-600 dark:text-emerald-400 border-b border-l border-dark-100 dark:border-dark-700 w-[37.5%]">القيمة الجديدة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allKeys.map((key, i) => {
                                    const oldVal = log.old_values ? log.old_values[key] : undefined;
                                    const newVal = log.new_values ? log.new_values[key] : undefined;
                                    const oldStr = oldVal !== undefined ? (typeof oldVal === 'object' ? JSON.stringify(oldVal, null, 2) : String(oldVal)) : null;
                                    const newStr = newVal !== undefined ? (typeof newVal === 'object' ? JSON.stringify(newVal, null, 2) : String(newVal)) : null;
                                    return (
                                        <tr key={key} className={i % 2 === 0 ? 'bg-white dark:bg-dark-900' : 'bg-dark-50/50 dark:bg-dark-800/20'}>
                                            <td className="px-4 py-3 border-b border-dark-100 dark:border-dark-700 font-mono text-xs font-bold text-dark-700 dark:text-dark-300 align-top">
                                                {key}
                                            </td>
                                            <td className="px-4 py-3 border-b border-l border-dark-100 dark:border-dark-700 text-rose-700 dark:text-rose-300 font-mono text-xs break-words whitespace-pre-wrap align-top bg-rose-50/30 dark:bg-rose-900/5">
                                                {oldStr !== null ? oldStr : <span className="opacity-40 italic">NULL</span>}
                                            </td>
                                            <td className="px-4 py-3 border-b border-l border-dark-100 dark:border-dark-700 text-emerald-700 dark:text-emerald-300 font-mono text-xs break-words whitespace-pre-wrap align-top bg-emerald-50/30 dark:bg-emerald-900/5">
                                                {newStr !== null ? newStr : <span className="opacity-40 italic">NULL</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AdminLayout activeMenu="سجل النشاطات">
            <Head title="سجل نشاطات النظام" />

            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-black text-dark-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-inner">
                            <Activity size={24} strokeWidth={2.5} />
                        </div>
                        سجل نشاطات النظام
                    </h1>
                    <p className="text-dark-500 dark:text-dark-400 mt-2 font-semibold text-sm">
                        تتبع كافة حركات الإضافة والتعديل والحذف التي تمت على مستوى النظام (Audit Trail)
                    </p>
                </div>
            </div>

            {/* Analytics Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/60 dark:bg-dark-900/40 backdrop-blur-xl border border-dark-100 dark:border-dark-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-xs font-bold text-dark-500 mb-1">إجمالي الحركات الكلية</p>
                        <p className="text-2xl font-black text-dark-900 dark:text-white">{logs.total || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center">
                        <BarChart3 size={24} />
                    </div>
                </div>
                <div className="bg-white/60 dark:bg-dark-900/40 backdrop-blur-xl border border-dark-100 dark:border-dark-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-xs font-bold text-dark-500 mb-1">عمليات الإنشاء (الصفحة الحالية)</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{logs.data.filter(l => l.action === 'إنشاء').length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
                        <Plus size={24} />
                    </div>
                </div>
                <div className="bg-white/60 dark:bg-dark-900/40 backdrop-blur-xl border border-dark-100 dark:border-dark-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-xs font-bold text-dark-500 mb-1">عمليات الحذف (الصفحة الحالية)</p>
                        <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{logs.data.filter(l => l.action === 'حذف').length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center">
                        <Trash2 size={24} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/60 dark:bg-dark-900/40 backdrop-blur-xl p-5 rounded-[2rem] shadow-sm border border-dark-100 dark:border-dark-800 mb-8">
                <form onSubmit={handleFilter} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-dark-500 dark:text-dark-400 mb-2">بحث شامل (مستخدم، جدول)</label>
                        <div className="relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pr-11 pl-4 py-3 bg-dark-50 dark:bg-dark-800/50 border-2 border-transparent dark:border-transparent focus:border-primary-500 dark:focus:border-primary-500 rounded-xl text-sm font-bold text-dark-900 dark:text-white placeholder:text-dark-400 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                                placeholder="ابحث باسم المستخدم أو الجدول..."
                            />
                        </div>
                    </div>
                    <div className="w-full sm:w-48 group/select flex flex-col">
                        <label className="block text-xs font-bold text-dark-500 dark:text-dark-400 mb-2">نوع الحركة</label>
                        <SelectInput
                            value={action}
                            onChange={(val) => setAction(val)}
                            options={[
                                { value: '', label: 'الكل' },
                                { value: 'إنشاء', label: 'إنشاء (Create)' },
                                { value: 'تحديث', label: 'تحديث (Update)' },
                                { value: 'حذف', label: 'حذف (Delete)' }
                            ]}
                        />
                    </div>
                    <div className="w-full sm:w-48 group/select flex flex-col">
                        <label className="block text-xs font-bold text-dark-500 dark:text-dark-400 mb-2">الجدول (النموذج)</label>
                        <SelectInput
                            value={tableName}
                            onChange={(val) => setTableName(val)}
                            options={[
                                { value: '', label: 'كل الجداول' },
                                ...tables.map(tbl => ({ value: tbl, label: tbl }))
                            ]}
                        />
                    </div>

                    {isSystemAdmin && (
                        <div className="w-full sm:w-48 group/select flex flex-col">
                            <label className="block text-xs font-bold text-dark-500 dark:text-dark-400 mb-2">الفرع</label>
                            <SelectInput
                                value={branchId}
                                onChange={(val) => setBranchId(val)}
                                options={[
                                    { value: '', label: 'كل الفروع' },
                                    ...branches.map(b => ({ value: String(b.id), label: b.name }))
                                ]}
                            />
                        </div>
                    )}

                    <div className="w-full sm:w-48 group/select flex flex-col">
                        <label className="block text-xs font-bold text-dark-500 dark:text-dark-400 mb-2">القسم</label>
                        <SelectInput
                            value={departmentId}
                            onChange={(val) => setDepartmentId(val)}
                            options={[
                                { value: '', label: 'كل الأقسام' },
                                ...departments.map(d => ({ value: String(d.id), label: d.name }))
                            ]}
                        />
                    </div>

                    <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:-translate-y-0.5">
                        <Filter size={18} /> تصفية السجلات
                    </button>
                </form>
            </div>

            {/* Timeline View */}
            <div className="relative mb-6 pb-6">
                <div className="absolute right-[23px] sm:right-[31px] top-6 bottom-0 w-[2px] bg-dark-100 dark:bg-dark-800 rounded-full z-0"></div>

                <div className="space-y-6 relative z-10">
                    {logs.data.map((log) => (
                        <div key={log.id} className="relative pr-14 sm:pr-20 group">
                            {/* Dot */}
                            <div className={`absolute right-3 sm:right-5 top-5 w-7 h-7 rounded-full border-4 border-white dark:border-dark-950 flex items-center justify-center z-10 transition-transform group-hover:scale-125 shadow-sm ${
                                log.action === 'إنشاء' ? 'bg-emerald-500' :
                                log.action === 'تحديث' ? 'bg-blue-500' :
                                log.action === 'حذف' ? 'bg-rose-500' : 'bg-dark-400'
                            }`}>
                                {log.action === 'إنشاء' && <Plus size={12} className="text-white" strokeWidth={4} />}
                                {log.action === 'تحديث' && <Edit2 size={12} className="text-white" strokeWidth={4} />}
                                {log.action === 'حذف' && <Trash2 size={12} className="text-white" strokeWidth={4} />}
                                {log.action !== 'إنشاء' && log.action !== 'تحديث' && log.action !== 'حذف' && <Activity size={12} className="text-white" strokeWidth={3} />}
                            </div>

                            {/* Card */}
                            <div className="bg-white dark:bg-dark-900 border border-dark-100 dark:border-dark-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg dark:hover:shadow-black/40 transition-all group-hover:border-primary-500/30">
                                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                    <div className="flex gap-4 items-start xl:items-center">
                                        <div className="w-12 h-12 rounded-2xl bg-dark-50 dark:bg-dark-800 flex items-center justify-center shrink-0 border border-dark-200 dark:border-dark-700">
                                            <User size={20} className="text-primary-500 dark:text-primary-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-dark-900 dark:text-dark-100 leading-relaxed flex flex-wrap items-center gap-1.5">
                                                <span className="text-dark-600 dark:text-dark-400">قام</span>
                                                <span className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-md border border-primary-100 dark:border-primary-800/50">{log.user?.name || 'النظام (System)'}</span>
                                                <span className="text-dark-600 dark:text-dark-400">بإجراء عملية</span>
                                                <span className={`font-bold px-2 py-0.5 rounded-md border ${
                                                    log.action === 'إنشاء' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400' :
                                                    log.action === 'تحديث' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-400' :
                                                    log.action === 'حذف' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-400' :
                                                    'bg-dark-100 border-dark-200 text-dark-700 dark:bg-dark-700 dark:border-dark-600 dark:text-dark-200'
                                                }`}>{log.action}</span>
                                                <span className="text-dark-600 dark:text-dark-400">في جدول</span>
                                                <span className="font-mono bg-dark-50 dark:bg-dark-800 px-2 py-0.5 rounded-md border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300">
                                                    <Database size={10} className="inline mr-1 mb-0.5 opacity-50" />
                                                    {log.table_name}
                                                </span>
                                            </p>
                                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-bold text-dark-500 dark:text-dark-400">
                                                <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary-500 dark:text-primary-400" /> <span dir="ltr">{new Date(log.created_at).toLocaleString('en-US', { hour12: true, dateStyle: 'medium', timeStyle: 'short' })}</span></span>
                                                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-emerald-500 dark:text-emerald-400" /> {log.branch?.name || 'النظام العام'}</span>
                                                <span className="flex items-center gap-1.5 bg-dark-50 dark:bg-dark-800 border border-dark-100 dark:border-dark-700 px-2 py-0.5 rounded-md text-dark-500 dark:text-dark-400"><ShieldAlert size={14} className="text-amber-500 dark:text-amber-400" /> معرف الحركة: #{log.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 xl:ml-2 mr-16 xl:mr-0">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="w-full xl:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-dark-50 dark:bg-dark-800 text-dark-700 dark:text-dark-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-black text-xs border border-dark-200 dark:border-dark-700 hover:border-primary-200 dark:hover:border-primary-700 group/btn"
                                        >
                                            <Eye size={16} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform" /> تفاصيل التغييرات
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {logs.data.length === 0 && (
                        <div className="p-16 text-center bg-white dark:bg-dark-900 rounded-[2rem] border border-dashed border-dark-200 dark:border-dark-700">
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-24 h-24 bg-dark-50 dark:bg-dark-800 rounded-full flex items-center justify-center mb-6 border border-dark-100 dark:border-dark-700">
                                    <History size={40} className="text-dark-300 dark:text-dark-500" />
                                </div>
                                <p className="font-black text-xl text-dark-900 dark:text-dark-100 mb-2">لا يوجد سجلات في هذا النطاق الزمني</p>
                                <p className="text-dark-500 dark:text-dark-400 font-semibold text-sm">حاول تغيير خيارات البحث أو الفلترة للحصول على نتائج.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {logs.data.length > 0 && (
                <div className="bg-white/60 dark:bg-dark-900/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm border border-dark-100 dark:border-dark-800">
                    <Pagination data={logs} />
                </div>
            )}

            {/* Details Modal */}
            <Modal show={!!selectedLog} onClose={() => setSelectedLog(null)} maxWidth="2xl">
                <div className="relative bg-white dark:bg-dark-900 rounded-[2rem] shadow-2xl w-full overflow-hidden border border-dark-100 dark:border-dark-800">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-500 via-emerald-400 to-primary-600" />
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-dark-100 dark:border-dark-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 flex items-center justify-center shadow-inner">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-dark-900 dark:text-white">تفاصيل الحركة والتغييرات</h2>
                                    <p className="text-xs font-bold text-dark-500 mt-0.5">مقارنة بين البيانات السابقة والحالية</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-50 dark:bg-dark-800 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
                                <span className="text-xl font-black">✕</span>
                            </button>
                        </div>
                        {renderDiff(selectedLog)}
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
