import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { 
    Search, Plus, Printer, Users, Network, FileEdit, Trash2, Unlock,
    ChevronRight, ChevronLeft, X, Upload, FileSpreadsheet, 
    Filter, MoreHorizontal, UserCheck, UserX, Eye
} from 'lucide-react';

export default function Index({ users, filters }) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [typeFilter, setTypeFilter] = useState(filters?.type || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const isFirstRender = useRef(true);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        file: null,
    });

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            router.get(route('users.index'), { 
                search: searchQuery, type: typeFilter, status: statusFilter 
            }, { preserveState: true, replace: true });
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('users.index'), { search: searchQuery, type: typeFilter, status: statusFilter }, { preserveState: true, replace: true });
    };

    const handleImport = (e) => {
        e.preventDefault();
        post(route('users.import'), {
            onSuccess: () => { setIsImportModalOpen(false); reset(); },
        });
    };

    const getRoleBadge = (type) => {
        const roles = {
            'admin': { label: 'مدير', class: 'erp-badge-danger' },
            'supervisor': { label: 'مشرف', class: 'erp-badge-primary' },
            'teacher': { label: 'معلم', class: 'erp-badge-success' },
            'student': { label: 'طالب', class: 'erp-badge-warning' },
        };
        const role = roles[type] || { label: type, class: 'erp-badge-primary' };
        return <span className={`erp-badge ${role.class}`}>{role.label}</span>;
    };

    return (
        <AdminLayout activeMenu="المستخدمون">
            <Head title="المستخدمون" />

            <div className="space-y-5">
                {/* Page Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">إدارة المستخدمين</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            إدارة وتنظيم حسابات المستخدمين في النظام
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="erp-btn erp-btn-secondary"
                        >
                            <Upload size={15} />
                            <span>استيراد Excel</span>
                        </button>
                        <button className="erp-btn erp-btn-secondary">
                            <Printer size={15} />
                            <span>طباعة</span>
                        </button>
                        <Link 
                            href={route('users.create')}
                            className="erp-btn erp-btn-primary"
                        >
                            <Plus size={16} />
                            <span>إضافة مستخدم</span>
                        </Link>
                    </div>
                </div>

                {/* Filters Card */}
                <div className="erp-card">
                    <div className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                            <input 
                                type="text"
                                placeholder="ابحث بالاسم أو اسم المستخدم..."
                                className="erp-input pr-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                            />
                        </div>
                        
                        {/* Type Filter */}
                        <div className="w-full md:w-44 relative">
                            <select 
                                className="erp-select"
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value);
                                    router.get(route('users.index'), { search: searchQuery, type: e.target.value, status: statusFilter }, { preserveState: true, replace: true });
                                }}
                            >
                                <option value="">جميع الأنواع</option>
                                <option value="admin">مدير</option>
                                <option value="supervisor">مشرف</option>
                                <option value="teacher">معلم</option>
                                <option value="student">طالب</option>
                            </select>
                            <ChevronLeft size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-[-90deg]" />
                        </div>

                        {/* Status Filter */}
                        <div className="w-full md:w-44 relative">
                            <select 
                                className="erp-select"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    router.get(route('users.index'), { search: searchQuery, type: typeFilter, status: e.target.value }, { preserveState: true, replace: true });
                                }}
                            >
                                <option value="">جميع الحالات</option>
                                <option value="active">نشط</option>
                                <option value="inactive">غير نشط</option>
                            </select>
                            <ChevronLeft size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-[-90deg]" />
                        </div>

                        <button 
                            onClick={handleSearch}
                            className="erp-btn erp-btn-primary"
                        >
                            <Filter size={15} />
                            <span>تصفية</span>
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="erp-table-wrapper">
                    {/* Pagination Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-sm text-slate-500">
                            عرض <span className="font-semibold text-slate-700">{users.data?.length || 0}</span> من <span className="font-semibold text-slate-700">{users.total || 0}</span> مستخدم
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button 
                                onClick={() => users.prev_page_url && router.get(users.prev_page_url)}
                                disabled={!users.prev_page_url}
                                className={`erp-action-btn ${users.prev_page_url ? 'hover:border-[#96cf75] hover:text-[#558a2a] hover:bg-[#f0f7eb]' : 'opacity-40 cursor-not-allowed'}`}
                            >
                                <ChevronRight size={16} />
                            </button>
                            <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md min-w-[80px] text-center">
                                {users.current_page} / {users.last_page}
                            </span>
                            <button 
                                onClick={() => users.next_page_url && router.get(users.next_page_url)}
                                disabled={!users.next_page_url}
                                className={`erp-action-btn ${users.next_page_url ? 'hover:border-[#96cf75] hover:text-[#558a2a] hover:bg-[#f0f7eb]' : 'opacity-40 cursor-not-allowed'}`}
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="erp-table">
                            <thead>
                                <tr>
                                    <th>المستخدم</th>
                                    <th>اسم الدخول</th>
                                    <th>الدور</th>
                                    <th>الحالة</th>
                                    <th className="text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data && users.data.length > 0 ? (
                                    users.data.map((user, idx) => (
                                        <tr key={user.id} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                                                        <Users size={16} className="text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-600">
                                                    {user.username}
                                                </code>
                                            </td>
                                            <td>{getRoleBadge(user.type)}</td>
                                            <td>
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${user.is_active !== false ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                    <span className={`text-xs font-medium ${user.is_active !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {user.is_active !== false ? 'نشط' : 'معطّل'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Link href={route('users.edit', user.id)} className="erp-action-btn edit">
                                                        <FileEdit size={15} />
                                                    </Link>
                                                    <button className="erp-action-btn view">
                                                        <Unlock size={15} />
                                                    </button>
                                                    <button className="erp-action-btn delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5">
                                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                                <Users size={48} className="mb-3 opacity-30" />
                                                <p className="text-base font-medium">لا يوجد مستخدمين</p>
                                                <p className="text-sm mt-1">قم بإضافة مستخدم جديد للبدء</p>
                                                <Link href={route('users.create')} className="erp-btn erp-btn-primary mt-4">
                                                    <Plus size={16} />
                                                    <span>إضافة مستخدم</span>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="erp-overlay" dir="rtl">
                    <div className="erp-modal max-w-md animate-scale-in">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center">
                                    <FileSpreadsheet size={18} className="text-[#558a2a]" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">استيراد المستخدمين</h3>
                            </div>
                            <button 
                                onClick={() => { setIsImportModalOpen(false); reset(); clearErrors(); }}
                                className="erp-btn-ghost"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleImport} className="p-6">
                            <div className="mb-6">
                                <label className="erp-label mb-3">ملف Excel أو CSV</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-sky-300 transition-all p-8 text-center cursor-pointer group">
                                    <div className="flex flex-col items-center">
                                        <div className="h-14 w-14 rounded-2xl bg-[#f0f7eb] flex items-center justify-center mb-3 group-hover:bg-[#dcefd1] transition-colors">
                                            <Upload size={24} className="text-[#6b9b37]" />
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-slate-600">
                                            <label htmlFor="file-upload" className="font-semibold text-[#6b9b37] hover:text-[#558a2a] cursor-pointer">
                                                اختر ملفاً
                                                <input 
                                                    id="file-upload" 
                                                    type="file" 
                                                    className="sr-only" 
                                                    accept=".xlsx, .xls, .csv"
                                                    onChange={e => {
                                                        setData('file', e.target.files[0]);
                                                        clearErrors('file');
                                                    }}
                                                />
                                            </label>
                                            <span>أو اسحب وأفلت هنا</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">XLSX, XLS, CSV — حتى 10MB</p>
                                    </div>
                                </div>
                                {data.file && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                        <FileSpreadsheet size={16} />
                                        <span>{data.file.name}</span>
                                    </div>
                                )}
                                {errors.file && <p className="text-red-500 text-sm mt-2">{errors.file}</p>}
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsImportModalOpen(false); reset(); clearErrors(); }}
                                    className="erp-btn erp-btn-secondary"
                                    disabled={processing}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="erp-btn erp-btn-primary min-w-[100px]"
                                    disabled={processing || !data.file}
                                >
                                    {processing ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    ) : 'استيراد'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
