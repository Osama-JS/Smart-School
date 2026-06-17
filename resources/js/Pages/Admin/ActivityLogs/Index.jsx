import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Activity, Search, Filter, Eye, Clock, User, 
    Database, MapPin, Plus, Edit2, Trash2, ShieldAlert
} from 'lucide-react';
function Pagination({ data }) {
    if (!data || data.last_page <= 1) return null;
    return (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/85 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10 flex-wrap gap-3 no-print">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
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
                                    ? 'bg-white dark:bg-[#121820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                                    : 'bg-white dark:bg-[#121820]/40 text-slate-300 dark:text-slate-650 border-slate-100 dark:border-slate-800/50 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}
import Modal from '@/Components/Modal';
import SelectInput from '@/Components/SelectInput';

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
        if (actionStr === 'إنشاء') return <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200 flex items-center gap-1"><Plus size={12}/> إنشاء</span>;
        if (actionStr === 'تحديث') return <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-bold border border-blue-200 flex items-center gap-1"><Edit2 size={12}/> تحديث</span>;
        if (actionStr === 'حذف') return <span className="px-2 py-1 rounded-md bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200 flex items-center gap-1"><Trash2 size={12}/> حذف</span>;
        return <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">{actionStr}</span>;
    };

    const formatJson = (obj) => {
        if (!obj) return 'لا يوجد بيانات';
        return JSON.stringify(obj, null, 2);
    };

    const renderDiff = (log) => {
        if (!log) return null;
        
        const oldKeys = log.old_values ? Object.keys(log.old_values) : [];
        const newKeys = log.new_values ? Object.keys(log.new_values) : [];
        const allKeys = [...new Set([...oldKeys, ...newKeys])];

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1 font-bold">المستخدم</p>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <User size={14} className="text-primary-500"/> 
                            {log.user?.name || 'النظام'}
                        </p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1 font-bold">الجدول (النموذج)</p>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Database size={14} className="text-emerald-500"/> 
                            {log.table_name}
                        </p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1 font-bold">تاريخ الحركة</p>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Clock size={14} className="text-amber-500"/> 
                            {new Date(log.created_at).toLocaleString('ar-SA')}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800 p-3 text-xs font-black text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <div>الحقل</div>
                        <div>القيمة القديمة</div>
                        <div>القيمة الجديدة</div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-[50vh] overflow-y-auto">
                        {allKeys.map(key => {
                            const oldVal = log.old_values ? log.old_values[key] : undefined;
                            const newVal = log.new_values ? log.new_values[key] : undefined;
                            const isChanged = oldVal !== newVal;
                            
                            return (
                                <div key={key} className={`grid grid-cols-3 p-3 text-sm font-mono ${isChanged ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                                    <div className="font-bold text-slate-600 dark:text-slate-400 break-words pr-2">{key}</div>
                                    <div className="text-rose-600 dark:text-rose-400 break-words pr-2 whitespace-pre-wrap">{oldVal !== undefined ? (typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)) : '-'}</div>
                                    <div className="text-emerald-600 dark:text-emerald-400 break-words pr-2 whitespace-pre-wrap">{newVal !== undefined ? (typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)) : '-'}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout activeMenu="سجل النشاطات">
            <Head title="سجل نشاطات النظام" />

            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-black text-dark-900 dark:text-white flex items-center gap-2">
                        <Activity className="text-primary-500" size={28} />
                        سجل نشاطات النظام (Audit Trail)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
                        تتبع كافة حركات الإضافة والتعديل والحذف التي تمت على مستوى النظام
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
                <form onSubmit={handleFilter} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">بحث شامل (مستخدم، جدول)</label>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-white"
                                placeholder="ابحث..."
                            />
                        </div>
                    </div>
                    <div className="w-full sm:w-48 group/select flex flex-col">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">نوع الحركة</label>
                        <SelectInput
                            value={action}
                            onChange={(val) => setAction(val)}
                            options={[
                                { value: '', label: 'الكل' },
                                { value: 'إنشاء', label: 'إنشاء' },
                                { value: 'تحديث', label: 'تحديث' },
                                { value: 'حذف', label: 'حذف' }
                            ]}
                        />
                    </div>
                    <div className="w-full sm:w-48 group/select flex flex-col">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">الجدول</label>
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
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">الفرع</label>
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
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">القسم</label>
                        <SelectInput
                            value={departmentId}
                            onChange={(val) => setDepartmentId(val)}
                            options={[
                                { value: '', label: 'كل الأقسام' },
                                ...departments.map(d => ({ value: String(d.id), label: d.name }))
                            ]}
                        />
                    </div>

                    <button type="submit" className="w-full sm:w-auto px-6 py-[10px] bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary-500/20">
                        <Filter size={16} /> تصفية
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 w-16">#</th>
                                <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400">المستخدم</th>
                                <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400">الفرع</th>
                                <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400">الحركة</th>
                                <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400">الجدول المستهدف</th>
                                <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400">التاريخ والوقت</th>
                                <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 w-24">تفاصيل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {logs.data.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4 text-sm font-bold text-slate-500">{log.id}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <User size={14} className="text-primary-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{log.user?.name || 'نظام'}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{log.user?.role?.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                                            <MapPin size={12} /> {log.branch?.name || 'النظام العام'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {getActionBadge(log.action)}
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                                            <Database size={10} className="text-slate-400" />
                                            {log.table_name}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            <Clock size={12} />
                                            <span dir="ltr">{new Date(log.created_at).toLocaleString('en-US', { hour12: false })}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors"
                                        >
                                            <Eye size={14} strokeWidth={2.5} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {logs.data.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">
                                        <ShieldAlert size={32} className="mx-auto mb-3 opacity-30" />
                                        <p className="font-bold">لا توجد سجلات نشاط تطابق الفلتر</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {logs.data.length > 0 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <Pagination data={logs} />
                    </div>
                )}
            </div>

            <Modal show={!!selectedLog} onClose={() => setSelectedLog(null)} maxWidth="2xl">
                <div className="p-6 dark:bg-[#121820]">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">تفاصيل الحركة والتغييرات</h2>
                        <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            ✕
                        </button>
                    </div>
                    {renderDiff(selectedLog)}
                </div>
            </Modal>
        </AdminLayout>
    );
}
