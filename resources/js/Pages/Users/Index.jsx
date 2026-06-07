import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, ShieldCheck, Check, AlertTriangle, Users as UsersIcon, Shield, Store, ChevronDown, UserCheck, RotateCcw, Key, Lock, Eye, EyeOff, Calendar, LayoutGrid, List, Download, Printer, ArrowUpDown, ArrowUp, ArrowDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#121820] rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="text-lg font-bold text-dark-900 dark:text-white">{title}</div>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-400 dark:text-slate-500 transition-colors">✕</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

// ── Action Menu ───────────────────────────────────────────────────────────────
function ActionMenu({ user, onDelete, onResetPassword }) {
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
                className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 p-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-900/60 transition-all inline-flex border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800">
                <MoreVertical size={16} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1.5 w-48 bg-white dark:bg-[#121820] rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/60 border border-slate-100 dark:border-slate-800 z-20 overflow-hidden animate-scale-in">
                    <Link href={route('users.edit', user.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-700 dark:hover:text-primary-450 transition-colors">
                        <Edit2 size={14} className="text-primary-500" /> تعديل الحساب
                    </Link>
                    <button onClick={() => { onResetPassword(user); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                        <Key size={14} className="text-slate-400" /> تعيين كلمة المرور
                    </button>
                    <button onClick={() => { onDelete(user); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950/20 transition-colors">
                        <Trash2 size={14} /> حذف المستخدم
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
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/85 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10 flex-wrap gap-3 no-print">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                عرض {data.from ?? 0} إلى {data.to ?? 0} من أصل {data.total} مستخدم
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

// ── Main ─────────────────────────────────────────────────────────────────────
export default function UsersIndex({ users, roles, branches, filters, stats }) {
    const { flash } = usePage().props;
    const [searchValue, setSearch] = useState(filters?.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters?.role_id ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');
    const [branchFilter, setBranchFilter] = useState(filters?.branch_id ?? '');
    const [dateFilter, setDateFilter] = useState(filters?.created_at ?? '');
    const [showFilter, setShowFilter] = useState(false);
    const [showDel, setShowDel] = useState(null);
    const searchTimeout = useRef(null);

    // Advanced features states
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [sortBy, setSortBy] = useState(filters?.sort_by ?? 'created_at');
    const [sortDir, setSortDir] = useState(filters?.sort_dir ?? 'desc');

    // Column visibility toggle states
    const [visibleColumns, setVisibleColumns] = useState({
        checkbox: true,
        user: true,
        role: true,
        branch: true,
        status: true,
        actions: true
    });
    const [showColumnToggle, setShowColumnToggle] = useState(false);
    const columnToggleRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (columnToggleRef.current && !columnToggleRef.current.contains(e.target)) {
                setShowColumnToggle(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Bulk selection states
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [bulkBranchModal, setBulkBranchModal] = useState(false);
    const [bulkBranchId, setBulkBranchId] = useState('');
    const [showBulkDel, setShowBulkDel] = useState(false);

    // Quick reset password states
    const [resetUser, setResetUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Navigation and filters with sorting support
    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(route('users.index'), {
                search: val,
                role_id: roleFilter,
                status: statusFilter,
                branch_id: branchFilter,
                created_at: dateFilter,
                sort_by: sortBy,
                sort_dir: sortDir
            }, { preserveState: true, replace: true });
        }, 400);
    };

    const triggerSearch = () => {
        router.get(route('users.index'), {
            search: searchValue,
            role_id: roleFilter,
            status: statusFilter,
            branch_id: branchFilter,
            created_at: dateFilter,
            sort_by: sortBy,
            sort_dir: sortDir
        }, { preserveState: true });
    };

    const handleFilterChange = (roleVal, statusVal, branchVal, dateVal) => {
        setRoleFilter(roleVal);
        setStatusFilter(statusVal);
        setBranchFilter(branchVal);
        setDateFilter(dateVal);
        router.get(route('users.index'), {
            search: searchValue,
            role_id: roleVal,
            status: statusVal,
            branch_id: branchVal,
            created_at: dateVal,
            sort_by: sortBy,
            sort_dir: sortDir
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setRoleFilter('');
        setStatusFilter('');
        setBranchFilter('');
        setDateFilter('');
        router.get(route('users.index'), {
            search: searchValue,
            sort_by: sortBy,
            sort_dir: sortDir
        }, { preserveState: true });
    };

    const handleSort = (field) => {
        const nextDir = sortBy === field && sortDir === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortDir(nextDir);
        router.get(route('users.index'), {
            search: searchValue,
            role_id: roleFilter,
            status: statusFilter,
            branch_id: branchFilter,
            created_at: dateFilter,
            sort_by: field,
            sort_dir: nextDir
        }, { preserveState: true });
    };

    const toggleUserStatus = (userObj) => {
        router.patch(route('users.quick-update', userObj.id), {
            is_active: !userObj.is_active
        }, {
            preserveScroll: true,
            preserveState: true
        });
    };

    const exportToCSV = () => {
        const usersToExport = selectedUsers.length > 0
            ? (users?.data ?? []).filter(u => selectedUsers.includes(u.id))
            : (users?.data ?? []);

        if (usersToExport.length === 0) return;

        const headers = ["الرقم التعريفي", "الاسم كامل", "اسم المستخدم", "الدور / الصلاحية", "الفرع", "حالة الحساب", "آخر ظهور", "الجهاز المستعمل"];
        const rows = usersToExport.map(u => [
            u.id,
            u.name,
            u.username,
            u.role,
            u.branch,
            u.is_active ? "نشط" : "معطل",
            u.last_login,
            u.device
        ]);

        const csvContent = "\uFEFF" + [headers, ...rows]
            .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `users_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const triggerPrint = () => {
        window.print();
    };

    const handleDelete = () => {
        router.delete(route('users.destroy', showDel.id), {
            onFinish: () => setShowDel(null)
        });
    };

    // Bulk action triggers
    const runBulkAction = (action, branchId = null) => {
        router.post(route('users.bulk'), {
            ids: selectedUsers,
            action,
            branch_id: branchId,
        }, {
            onSuccess: () => {
                setSelectedUsers([]);
                setBulkBranchModal(false);
            }
        });
    };

    // Quick Reset Password action
    const handleResetPassword = (e) => {
        e.preventDefault();
        router.post(route('users.reset-password', resetUser.id), {
            password: newPassword,
        }, {
            onSuccess: () => {
                setResetUser(null);
                setNewPassword('');
                setShowPassword(false);
            }
        });
    };

    const usersData = users?.data ?? [];
    const activeFiltersCount = (roleFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (branchFilter ? 1 : 0) + (dateFilter ? 1 : 0);

    const statsItems = stats ? [
        {
            title: 'إجمالي الحسابات',
            value: stats.total,
            icon: UsersIcon,
            color: 'primary',
            iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400',
            progressWidth: '100%',
            progressColor: 'bg-gradient-to-r from-primary-400 to-primary-600',
            glowBg: 'bg-primary-500/5',
            hoverBorder: 'hover:border-primary-200 dark:hover:border-primary-800/30',
            topLineHover: 'group-hover:bg-primary-500/20',
            ringColor: 'border-primary-500/20',
            badgeClass: 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 border-primary-100/30 dark:border-primary-500/20',
            badgeIcon: <ArrowUpRight size={10} strokeWidth={3} />,
            badgeText: '100%',
            subText: 'من إجمالي مستخدمي النظام'
        },
        {
            title: 'المعلمون',
            value: stats.teachers,
            icon: ShieldCheck,
            color: 'emerald',
            iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
            progressWidth: stats.total > 0 ? `${((stats.teachers / stats.total) * 100).toFixed(1)}%` : '0%',
            progressColor: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
            glowBg: 'bg-emerald-500/5',
            hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800/30',
            topLineHover: 'group-hover:bg-emerald-500/20',
            ringColor: 'border-emerald-500/20',
            badgeClass: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100/30 dark:border-emerald-500/20',
            badgeIcon: <ArrowUpRight size={10} strokeWidth={3} />,
            badgeText: stats.total > 0 ? `${((stats.teachers / stats.total) * 100).toFixed(0)}%` : '0%',
            subText: 'نسبة المعلمين بالنظام'
        },
        {
            title: 'مدراء النظام',
            value: stats.admins,
            icon: Shield,
            color: 'dark',
            iconBg: 'bg-dark-100 text-dark-700 dark:bg-dark-900/40 dark:text-dark-300',
            progressWidth: stats.total > 0 ? `${((stats.admins / stats.total) * 100).toFixed(1)}%` : '0%',
            progressColor: 'bg-gradient-to-r from-dark-500 to-dark-700 dark:from-dark-400 dark:to-dark-600',
            glowBg: 'bg-dark-500/5',
            hoverBorder: 'hover:border-dark-300 dark:hover:border-dark-800/30',
            topLineHover: 'group-hover:bg-dark-500/20',
            ringColor: 'border-dark-500/20',
            badgeClass: 'bg-dark-100 dark:bg-dark-500/10 text-dark-800 dark:text-dark-300 border-dark-200/30 dark:border-dark-500/20',
            badgeIcon: <ArrowUpRight size={10} strokeWidth={3} />,
            badgeText: stats.total > 0 ? `${((stats.admins / stats.total) * 100).toFixed(0)}%` : '0%',
            subText: 'نسبة مدراء النظام'
        },
        {
            title: 'الحسابات المعطلة',
            value: stats.inactive,
            icon: AlertTriangle,
            color: 'accent',
            iconBg: 'bg-accent-50 text-accent-600 dark:bg-accent-950/20 dark:text-accent-400',
            progressWidth: stats.total > 0 ? `${((stats.inactive / stats.total) * 100).toFixed(1)}%` : '0%',
            progressColor: 'bg-gradient-to-r from-accent-400 to-accent-600',
            glowBg: 'bg-accent-500/5',
            hoverBorder: 'hover:border-accent-200 dark:hover:border-accent-800/30',
            topLineHover: 'group-hover:bg-accent-500/20',
            ringColor: 'border-accent-500/20',
            badgeClass: 'bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-400 border-accent-100/20 dark:border-accent-500/20',
            badgeIcon: <ArrowDownRight size={10} strokeWidth={3} />,
            badgeText: stats.total > 0 ? `${((stats.inactive / stats.total) * 100).toFixed(0)}%` : '0%',
            subText: 'نسبة الحسابات المعطلة'
        }
    ] : [];

    const toggleUser = (id) => {
        setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        const pageIds = usersData.map(u => u.id);
        const allSelected = pageIds.every(id => selectedUsers.includes(id));
        if (allSelected) {
            setSelectedUsers(prev => prev.filter(id => !pageIds.includes(id)));
        } else {
            setSelectedUsers(prev => [...new Set([...prev, ...pageIds])]);
        }
    };
    const renderSortHeader = (label, field) => {
        const isSorted = sortBy === field;
        return (
            <th onClick={() => handleSort(field)} className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-850/50 select-none transition-all no-print">
                <div className="flex items-center gap-1.5 justify-start">
                    <span>{label}</span>
                    {isSorted ? (
                        sortDir === 'asc' ? <ArrowUp size={12} className="text-primary-500" /> : <ArrowDown size={12} className="text-primary-500" />
                    ) : (
                        <ArrowUpDown size={12} className="text-slate-400 dark:text-slate-500 opacity-65" />
                    )}
                </div>
            </th>
        );
    };

    return (
        <AdminLayout activeMenu="المستخدمون">
            <Head title="إدارة المستخدمين | النظام الإداري" />

            {/* Injecting Print Stylesheet dynamically */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    aside, nav, header, .no-print, button, a, [type="checkbox"], select, input, .print\\:hidden {
                        display: none !important;
                    }
                    main, .print\\:w-full {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body {
                        background-color: white !important;
                        color: black !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                    .print\\:border {
                        border: 1px solid #e2e8f0 !important;
                    }
                }
            `}} />

            {/* Print Only Header Banner */}
            <div className="hidden print:block mb-8 text-right font-sans" dir="rtl">
                <div className="flex items-center justify-between border-b-2 border-primary-600 pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-black text-dark-900">مدارس القيم الأهلية</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-1">كشف المستخدمين المسجلين في النظام الإداري</p>
                    </div>
                    <div className="text-left font-semibold">
                        <p className="text-xs text-slate-500">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                        <p className="text-xs text-slate-500 mt-1">عدد الحسابات المطبوعة: {usersData.length} حساب</p>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {flash?.success && (
                <div className="mb-6 flex items-center gap-3 bg-primary-50 border border-primary-200 text-primary-700 px-5 py-4 rounded-2xl text-sm font-bold shadow-sm animate-slide-down no-print">
                    <div className="h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center shrink-0">
                        <Check size={14} />
                    </div>
                    <span>{flash.success}</span>
                </div>
            )}

            {/* Header Banner - Developed and Premium styled in Brand colors (Styled like Staff Directory) */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none no-print bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                
                {/* Visual geometric lines */}
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                        <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                        <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight">إدارة المستخدمين</h1>
                        <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">التحكم الكامل في حسابات دخول النظام وصلاحياتها</p>
                    </div>
                    
                    {/* Buttons on Left in RTL */}
                    <div className="flex items-center gap-3 self-end sm:self-auto" ref={columnToggleRef}>
                        {/* View Mode Toggle (Grid vs Table) */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-1 border border-slate-200/50 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-xl transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-[#121820] text-primary-500 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                                title="عرض جدول"
                            >
                                <List size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-[#121820] text-primary-500 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                                title="عرض بطاقات"
                            >
                                <LayoutGrid size={16} />
                            </button>
                        </div>

                        {/* Export CSV button */}
                        <button
                            type="button"
                            onClick={exportToCSV}
                            className="flex items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121820] text-slate-550 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary-300 shadow-sm transition-all"
                            title="تصدير كملف Excel (CSV)"
                        >
                            <Download size={16} />
                        </button>

                        {/* Print PDF button */}
                        <button
                            type="button"
                            onClick={triggerPrint}
                            className="flex items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121820] text-slate-550 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary-300 shadow-sm transition-all"
                            title="طباعة أو تصدير PDF"
                        >
                            <Printer size={16} />
                        </button>

                        {/* Columns Selector Dropdown */}
                        <div className="relative">
                            <button onClick={() => setShowColumnToggle(!showColumnToggle)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-bold shadow-sm transition-all shrink-0 ${
                                    showColumnToggle
                                        ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-300 dark:border-primary-500/30 text-primary-700 dark:text-primary-400'
                                        : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-800 text-dark-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary-300'
                                }`}>
                                <UsersIcon size={16} className={showColumnToggle ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400'} />
                                <span>الأعمدة</span>
                            </button>
                            {showColumnToggle && (
                                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-3 flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">تحديد الأعمدة الظاهرة:</span>
                                    <label className="flex items-center gap-2.5 px-2 py-1 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-lg">
                                        <input type="checkbox" checked={visibleColumns.user}
                                            onChange={() => setVisibleColumns({...visibleColumns, user: !visibleColumns.user})}
                                            className="rounded text-primary-500 focus:ring-primary-500/10" />
                                        <span>المستخدم</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 px-2 py-1 text-xs font-bold text-slate-655 dark:text-slate-350 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-lg">
                                        <input type="checkbox" checked={visibleColumns.role}
                                            onChange={() => setVisibleColumns({...visibleColumns, role: !visibleColumns.role})}
                                            className="rounded text-primary-500 focus:ring-primary-500/10" />
                                        <span>الدور (الصلاحية)</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 px-2 py-1 text-xs font-bold text-slate-655 dark:text-slate-350 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-lg">
                                        <input type="checkbox" checked={visibleColumns.branch}
                                            onChange={() => setVisibleColumns({...visibleColumns, branch: !visibleColumns.branch})}
                                            className="rounded text-primary-500 focus:ring-primary-500/10" />
                                        <span>الفرع</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 px-2 py-1 text-xs font-bold text-slate-655 dark:text-slate-350 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-lg">
                                        <input type="checkbox" checked={visibleColumns.status}
                                            onChange={() => setVisibleColumns({...visibleColumns, status: !visibleColumns.status})}
                                            className="rounded text-primary-500 focus:ring-primary-500/10" />
                                        <span>الحالة</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setShowFilter(!showFilter)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-bold shadow-sm transition-all shrink-0 ${
                                showFilter 
                                    ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-300 dark:border-primary-500/30 text-primary-700 dark:text-primary-400' 
                                    : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-800 text-dark-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary-300'
                            }`}>
                            <Filter size={16} className={showFilter ? 'text-primary-500 dark:text-primary-450' : 'text-slate-500 dark:text-slate-400'} /> 
                            <span>تصفية</span>
                            {activeFiltersCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px] font-bold font-mono">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                        <Link href={route('users.create')}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0">
                            <Plus size={18} /> 
                            <span>إضافة مستخدم</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards Section */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statsItems.map((stat, index) => (
                        <div key={index} className={`bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-none hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden group cursor-default bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:16px_16px] ${stat.hoverBorder}`}>
                            {/* Glowing ambient light */}
                            <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                            <div className={`absolute top-0 right-0 left-0 h-1 bg-transparent ${stat.topLineHover} transition-colors`} />

                            <div className="relative z-10 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{stat.title}</p>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none font-mono tracking-tight">{stat.value}</h3>
                                </div>
                                <div className={`relative h-11 w-11 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 transition-all duration-350 group-hover:scale-110 group-hover:-rotate-3`}>
                                    {/* Double ring hover overlay */}
                                    <span className={`absolute inset-0 rounded-2xl border ${stat.ringColor} scale-100 group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                                    <stat.icon size={20} strokeWidth={2.5} />
                                </div>
                            </div>
                            
                            {/* Progress bar and trend badge */}
                            <div className="relative z-10 space-y-2.5 mt-1">
                                <div className="w-full bg-slate-100/80 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${stat.progressColor}`} style={{ width: stat.progressWidth }} />
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                    <div className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full border ${stat.badgeClass}`}>
                                        {stat.badgeIcon}
                                        <span>{stat.badgeText}</span>
                                    </div>
                                    <span className="text-slate-400 dark:text-slate-505">{stat.subText}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List Container with refined borders and shadows */}
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 rounded-3xl shadow-sm dark:shadow-none overflow-hidden animate-fade-in">
                {/* Search Header - Refactored search container with integrated button */}
                <div className="p-6 border-b border-slate-50 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/30 dark:from-transparent dark:to-transparent">
                    <h2 className="text-base font-bold text-dark-900 dark:text-white">قائمة المستخدمين</h2>
                    
                    {/* Integrated Search Input and Search Button */}
                    <div className="relative max-w-sm w-full flex items-center bg-slate-100/60 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 focus-within:bg-white dark:focus-within:bg-[#121820] border border-transparent dark:border-slate-800 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/10 rounded-2xl transition-all p-1">
                        <div className="flex-1 relative flex items-center">
                            <Search size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                            <input type="text" placeholder="بحث بالاسم أو اسم المستخدم..."
                                className="w-full bg-transparent border-none pr-10 pl-3 py-2 text-sm outline-none text-dark-900 dark:text-slate-100 font-medium"
                                value={searchValue} 
                                onChange={e => handleSearch(e.target.value)} 
                                onKeyDown={e => { if (e.key === 'Enter') triggerSearch(); }}
                            />
                        </div>
                        <button 
                            onClick={triggerSearch}
                            className="px-4 py-2 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all shadow-sm hover:shadow shrink-0 ml-1 flex items-center gap-1"
                        >
                            <Search size={12} />
                            <span>بحث</span>
                        </button>
                    </div>
                </div>

                {/* Expandable Advanced Filters Panel */}
                {showFilter && (
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/10 relative">
                        {/* Decorative Grid Line inside panel */}
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                            {/* Role Filter */}
                            <div className="group/select flex flex-col">
                                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">الدور والصلاحية</label>
                                <div className="relative flex items-center">
                                    <div className="absolute right-4 text-slate-400 dark:text-slate-500 pointer-events-none">
                                        <Shield size={16} />
                                    </div>
                                    <select
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 pl-10 py-3 text-xs bg-white dark:bg-[#121820] text-slate-700 dark:text-slate-200 font-bold outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 transition-all appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
                                        value={roleFilter}
                                        onChange={e => handleFilterChange(e.target.value, statusFilter, branchFilter, dateFilter)}
                                    >
                                        <option value="">كل الأدوار</option>
                                        {roles?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="group/select flex flex-col">
                                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">الحالة</label>
                                <div className="relative flex items-center">
                                    <div className="absolute right-4 text-slate-400 dark:text-slate-500 pointer-events-none">
                                        <UserCheck size={16} />
                                    </div>
                                    <select
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 pl-10 py-3 text-xs bg-white dark:bg-[#121820] text-slate-700 dark:text-slate-200 font-bold outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 transition-all appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
                                        value={statusFilter}
                                        onChange={e => handleFilterChange(roleFilter, e.target.value, branchFilter, dateFilter)}
                                    >
                                        <option value="">كل الحالات</option>
                                        <option value="active">نشط</option>
                                        <option value="inactive">معطل</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Branch Filter */}
                            <div className="group/select flex flex-col">
                                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">الفرع المدرسي</label>
                                <div className="relative flex items-center">
                                    <div className="absolute right-4 text-slate-400 dark:text-slate-500 pointer-events-none">
                                        <Store size={16} />
                                    </div>
                                    <select
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 pl-10 py-3 text-xs bg-white dark:bg-[#121820] text-slate-700 dark:text-slate-200 font-bold outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 transition-all appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
                                        value={branchFilter}
                                        onChange={e => handleFilterChange(roleFilter, statusFilter, e.target.value, dateFilter)}
                                    >
                                        <option value="">كل الفروع</option>
                                        {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Date Registered Filter */}
                            <div className="group/select flex flex-col">
                                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">تاريخ التسجيل</label>
                                <div className="relative flex items-center">
                                    <div className="absolute right-4 text-slate-400 dark:text-slate-500 pointer-events-none">
                                        <Calendar size={16} />
                                    </div>
                                    <select
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 pl-10 py-3 text-xs bg-white dark:bg-[#121820] text-slate-700 dark:text-slate-200 font-bold outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 transition-all appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
                                        value={dateFilter}
                                        onChange={e => handleFilterChange(roleFilter, statusFilter, branchFilter, e.target.value)}
                                    >
                                        <option value="">كل الأوقات</option>
                                        <option value="today">اليوم</option>
                                        <option value="week">هذا الأسبوع</option>
                                        <option value="month">هذا الشهر</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Active Filters list */}
                        {activeFiltersCount > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">التصفيات النشطة:</span>
                                    {roleFilter && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold border border-primary-200/50 dark:border-primary-800/20">
                                            <span>الدور: {roles?.find(r => String(r.id) === String(roleFilter))?.name}</span>
                                            <button type="button" onClick={() => handleFilterChange('', statusFilter, branchFilter, dateFilter)} className="hover:text-accent-500 text-slate-450 dark:text-slate-500 transition-colors mr-1">✕</button>
                                        </span>
                                    )}
                                    {statusFilter && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold border border-primary-200/50 dark:border-primary-800/20">
                                            <span>الحالة: {statusFilter === 'active' ? 'نشط' : 'معطل'}</span>
                                            <button type="button" onClick={() => handleFilterChange(roleFilter, '', branchFilter, dateFilter)} className="hover:text-accent-500 text-slate-450 dark:text-slate-500 transition-colors mr-1">✕</button>
                                        </span>
                                    )}
                                    {branchFilter && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold border border-primary-200/50 dark:border-primary-800/20">
                                            <span>الفرع: {branches?.find(b => String(b.id) === String(branchFilter))?.name}</span>
                                            <button type="button" onClick={() => handleFilterChange(roleFilter, statusFilter, '', dateFilter)} className="hover:text-accent-500 text-slate-450 dark:text-slate-500 transition-colors mr-1">✕</button>
                                        </span>
                                    )}
                                    {dateFilter && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold border border-primary-200/50 dark:border-primary-800/20">
                                            <span>التاريخ: {dateFilter === 'today' ? 'اليوم' : dateFilter === 'week' ? 'هذا الأسبوع' : 'هذا الشهر'}</span>
                                            <button type="button" onClick={() => handleFilterChange(roleFilter, statusFilter, branchFilter, '')} className="hover:text-accent-500 text-slate-450 dark:text-slate-500 transition-colors mr-1">✕</button>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Pre-configured filter presets toolbar */}
                <div className="px-6 py-3.5 border-b border-slate-100/80 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/10 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-2">مرشحات سريعة:</span>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            !roleFilter && !statusFilter && !branchFilter && !dateFilter
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
                        }`}
                    >
                        الكل
                    </button>
                    <button
                        type="button"
                        onClick={() => handleFilterChange(roles?.find(r => r.name.includes('مدير'))?.id ?? '', '', '', '')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            roleFilter && roles?.find(r => r.id === roleFilter)?.name.includes('مدير')
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
                        }`}
                    >
                        المدراء
                    </button>
                    <button
                        type="button"
                        onClick={() => handleFilterChange(roles?.find(r => r.name.includes('معلم'))?.id ?? '', '', '', '')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            roleFilter && roles?.find(r => r.id === roleFilter)?.name.includes('معلم')
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
                        }`}
                    >
                        المعلمون
                    </button>
                    <button
                        type="button"
                        onClick={() => handleFilterChange('', 'active', '', '')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            statusFilter === 'active' && !roleFilter && !branchFilter && !dateFilter
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
                        }`}
                    >
                        النشطون
                    </button>
                    <button
                        type="button"
                        onClick={() => handleFilterChange('', 'inactive', '', '')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            statusFilter === 'inactive' && !roleFilter && !branchFilter && !dateFilter
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
                        }`}
                    >
                        المعطلون
                    </button>
                </div>

                {/* Table or Grid Data */}
                {usersData.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 dark:text-slate-500 no-print">
                        <UsersIcon size={48} className="mx-auto mb-4 text-slate-300 opacity-80 animate-pulse" />
                        <p className="font-bold text-slate-500 text-sm">لا يوجد مستخدمون مطابقون لمعايير البحث</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {usersData.map(user => {
                                    const isAdmin = user.role?.includes('مدير');
                                    const isTeacher = user.role?.includes('معلم');
                                    const isSelected = selectedUsers.includes(user.id);
                                    return (
                                        <div key={user.id} className={`relative bg-white dark:bg-slate-900/40 border rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:hover:shadow-none hover:-translate-y-1.5 transition-all duration-300 group ${isSelected ? 'border-primary-500 dark:border-primary-600 bg-primary-50/10 dark:bg-primary-950/10' : 'border-slate-100 dark:border-slate-800/80'}`}>
                                            {/* Ambient Glow */}
                                            <div className="absolute -left-6 -top-6 w-20 h-20 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                                            
                                            {/* Card Header: Checkbox, Role & Quick Status Toggle & Actions */}
                                            <div className="flex items-center justify-between gap-2 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox"
                                                        className="w-4 h-4 text-primary-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-primary-500/20 cursor-pointer no-print"
                                                        checked={isSelected}
                                                        onChange={() => toggleUser(user.id)}
                                                    />
                                                    {isAdmin ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-900 dark:bg-slate-900 text-white dark:text-slate-100 text-[10.5px] font-bold border border-dark-900 dark:border-slate-800">
                                                            <Shield size={10} className="text-primary-400" /> {user.role}
                                                        </span>
                                                    ) : isTeacher ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300 text-[10.5px] font-bold border border-primary-200/50 dark:border-primary-800/40">
                                                            <ShieldCheck size={10} /> {user.role}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 text-[10.5px] font-bold border border-slate-200/60 dark:border-slate-800/50">
                                                            <ShieldCheck size={10} /> {user.role}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 no-print">
                                                    {/* Quick Status Toggle inside Grid Card */}
                                                    <button onClick={() => toggleUserStatus(user)} title="اضغط لتغيير الحالة فورياً" className="transition-all hover:scale-105 shrink-0 cursor-pointer">
                                                        {user.is_active ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-[#f0f7eb] dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 border border-[#dcefd1] dark:border-primary-900/30">
                                                                <span className="relative flex h-1.5 w-1.5 shrink-0">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-500"></span>
                                                                </span>
                                                                <span>نشط</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 border border-accent-100 dark:border-accent-900/20">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shrink-0" />
                                                                <span>معطل</span>
                                                            </span>
                                                        )}
                                                    </button>
                                                    <ActionMenu user={user} onDelete={setShowDel} onResetPassword={setResetUser} />
                                                </div>
                                            </div>

                                            {/* Card Body: User Avatar & Info */}
                                            <div className="flex flex-col items-center text-center mt-2 mb-4">
                                                <div className="relative mb-3 shrink-0">
                                                    <img src={user.avatar} className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 object-cover shadow-sm transition-transform duration-300 group-hover:scale-105" />
                                                    {user.is_active && (
                                                        <span className="absolute bottom-0 left-0 w-4 h-4 bg-primary-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-dark-900 dark:text-white text-[15px] leading-snug group-hover:text-primary-700 dark:group-hover:text-primary-405 transition-colors">{user.name}</h4>
                                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 block">@{user.username}</span>
                                                </div>
                                            </div>

                                            {/* Card Footer Details */}
                                            <div className="border-t border-slate-100/70 dark:border-slate-800/60 pt-4 mt-2 space-y-2">
                                                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    <span className="text-slate-400 dark:text-slate-500">الفرع:</span>
                                                    <div className="flex items-center gap-1">
                                                        <Store size={12} className="text-slate-400" />
                                                        <span>{user.branch}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-slate-650 dark:text-slate-355">
                                                    <span className="text-slate-400 dark:text-slate-500">آخر ظهور:</span>
                                                    <span className={user.last_login === 'نشط الآن' ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}>{user.last_login}</span>
                                                </div>
                                                {user.device && user.device !== '—' && (
                                                    <div className="flex items-center justify-between text-[11px] text-slate-650 dark:text-slate-350">
                                                        <span className="text-slate-400 dark:text-slate-500">الجهاز:</span>
                                                        <span className="text-slate-400/90 dark:text-slate-500 font-medium font-mono">{user.device}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100/80 dark:border-slate-800/85">
                                            <th className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider text-center w-12 no-print">
                                                <input type="checkbox"
                                                    className="w-4 h-4 text-primary-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-primary-500/20 cursor-pointer"
                                                    checked={usersData.length > 0 && usersData.every(u => selectedUsers.includes(u.id))}
                                                    onChange={toggleAll}
                                                />
                                            </th>
                                            {visibleColumns.user && renderSortHeader("المستخدم", "name")}
                                            {visibleColumns.role && renderSortHeader("الدور (الصلاحية)", "role_id")}
                                            {visibleColumns.branch && renderSortHeader("الفرع", "branch_id")}
                                            {visibleColumns.status && renderSortHeader("الحالة", "is_active")}
                                            <th className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider text-center no-print">إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                                        {usersData.map(user => {
                                            const isAdmin = user.role?.includes('مدير');
                                            const isTeacher = user.role?.includes('معلم');
                                            const isSelected = selectedUsers.includes(user.id);
                                            
                                            return (
                                                <tr key={user.id} className={`group border-r-4 border-r-transparent transition-all duration-200 cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-primary-50/10 dark:bg-primary-950/10 border-r-primary-500' 
                                                        : !user.is_active
                                                            ? 'hover:border-r-rose-500 hover:bg-rose-50/5 dark:hover:bg-rose-950/5 border-r-rose-500/20'
                                                            : 'hover:border-r-primary-500 hover:bg-slate-50/40 dark:hover:bg-primary-500/5'
                                                }`}>
                                                    {/* Checkbox column */}
                                                    <td className="px-6 py-4.5 whitespace-nowrap text-center no-print">
                                                        <input type="checkbox"
                                                            className="w-4 h-4 text-primary-600 dark:text-[#5b8a2d] rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-primary-500/20 cursor-pointer"
                                                            checked={isSelected}
                                                            onChange={() => toggleUser(user.id)}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                    </td>
                                                    {/* User Info */}
                                                    {visibleColumns.user && (
                                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                                            <div className="flex items-center gap-3.5">
                                                                <div className="relative shrink-0 no-print">
                                                                    <img src={user.avatar} className="w-11 h-11 rounded-full border border-slate-200/80 dark:border-slate-800 object-cover shadow-sm transition-transform duration-300 group-hover:scale-105" />
                                                                    {user.is_active && (
                                                                        <span className="absolute bottom-0 left-0 w-3 h-3 bg-primary-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-dark-900 dark:text-white text-[14px] leading-snug group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{user.name}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">@{user.username}</p>
                                                                        <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold no-print">•</span>
                                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1.5 no-print">
                                                                            <span className={user.last_login === 'نشط الآن' ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}>{user.last_login}</span>
                                                                            {user.device && user.device !== '—' && (
                                                                                <>
                                                                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                                                                    <span className="text-slate-400/90 dark:text-slate-500 font-medium">{user.device}</span>
                                                                                </>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    
                                                    {/* Role Badge */}
                                                    {visibleColumns.role && (
                                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                                            {isAdmin ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-900 dark:bg-slate-900 text-white dark:text-slate-100 text-[11.5px] font-bold shadow-sm border border-dark-900 dark:border-slate-800 transition-all hover:shadow hover:bg-black dark:hover:bg-slate-850">
                                                                    <Shield size={12} className="text-primary-400 no-print" /> {user.role}
                                                                </span>
                                                            ) : isTeacher ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-950/20 dark:to-primary-900/20 text-primary-700 dark:text-primary-300 text-[11.5px] font-bold border border-primary-200/60 dark:border-primary-800/40 transition-all hover:bg-primary-100/30 dark:hover:bg-primary-900/40">
                                                                    <ShieldCheck size={12} className="no-print" /> {user.role}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 text-[11.5px] font-bold border border-slate-200/60 dark:border-slate-800/50 transition-all hover:bg-slate-100/60 dark:hover:bg-slate-900/80">
                                                                    <ShieldCheck size={12} className="no-print" /> {user.role}
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                    
                                                    {/* Branch */}
                                                    {visibleColumns.branch && (
                                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                                            <div className="flex items-center gap-1.5 text-[13.5px] font-bold text-slate-600 dark:text-slate-300">
                                                                <Store size={14} className="text-slate-400 dark:text-slate-500 shrink-0 no-print" />
                                                                <span>{user.branch}</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    
                                                    {/* Status Badge - Clickable Status toggle */}
                                                    {visibleColumns.status && (
                                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                                            <button onClick={() => toggleUserStatus(user)} title="اضغط لتغيير الحالة فورياً" className="transition-all hover:scale-105 shrink-0 no-print cursor-pointer">
                                                                {user.is_active ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20">
                                                                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                                        </span>
                                                                        <span>نشط</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-455 border border-rose-100/50 dark:border-rose-500/20">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                                                        <span>معطل</span>
                                                                    </span>
                                                                )}
                                                            </button>
                                                            {/* Print view only static text */}
                                                            <span className="hidden print:inline text-xs font-bold">
                                                                {user.is_active ? 'نشط' : 'معطل'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    
                                                    {/* Action Menu */}
                                                    <td className="px-6 py-4.5 whitespace-nowrap text-center no-print">
                                                        <ActionMenu user={user} onDelete={setShowDel} onResetPassword={setResetUser} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <Pagination data={users} />
                    </>
                )}
            </div>

            {/* Floating Bulk Actions Bar */}
            {selectedUsers.length > 0 && (
                <div className="fixed bottom-6 right-1/2 translate-x-1/2 z-40 bg-dark-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 animate-slide-up border border-dark-800 max-w-2xl w-[90%] md:w-auto">
                    <div className="flex items-center gap-2 shrink-0 border-l border-white/10 pl-4">
                        <span className="h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold font-mono">
                            {selectedUsers.length}
                        </span>
                        <span className="text-xs font-bold text-slate-300">محدد</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button onClick={() => runBulkAction('activate')}
                            className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3.5 py-2.5 rounded-xl transition-all">
                            <Check size={14} className="text-primary-400" />
                            <span>تفعيل</span>
                        </button>
                        <button onClick={() => runBulkAction('deactivate')}
                            className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3.5 py-2.5 rounded-xl transition-all">
                            <AlertTriangle size={14} className="text-amber-400" />
                            <span>تعطيل</span>
                        </button>
                        <button onClick={() => setBulkBranchModal(true)}
                            className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3.5 py-2.5 rounded-xl transition-all">
                            <Store size={14} className="text-blue-400" />
                            <span>تغيير الفرع</span>
                        </button>
                        <button onClick={() => setShowBulkDel(true)}
                            className="flex items-center gap-1.5 text-xs font-bold bg-accent-500/20 hover:bg-accent-500/30 text-accent-400 px-3.5 py-2.5 rounded-xl transition-all">
                            <Trash2 size={14} />
                            <span>حذف جماعي</span>
                        </button>
                    </div>
                </div>
            )}



            {/* Quick Reset Password Modal */}
            <Modal isOpen={!!resetUser} onClose={() => setResetUser(null)} title={
                <div className="flex items-center gap-2 text-dark-900 dark:text-white">
                    <Key size={18} className="text-primary-500" />
                    <span>إعادة تعيين كلمة المرور</span>
                </div>
            }>
                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mb-2">تعيين كلمة مرور جديدة للمستخدم:</p>
                        <p className="text-sm font-black text-dark-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">{resetUser?.name} (@{resetUser?.username})</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-200 mb-2">كلمة المرور الجديدة</label>
                        <div className="relative">
                            <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                            <input type={showPassword ? "text" : "password"} required minLength="8" dir="ltr"
                                placeholder="••••••••"
                                className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 pl-12 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 bg-white dark:bg-slate-900 text-dark-900 dark:text-white transition-all"
                                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-xl">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-3">
                        <button type="button" onClick={() => { setResetUser(null); setNewPassword(''); setShowPassword(false); }}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button type="submit"
                            className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 transition-all cursor-pointer">تحديث كلمة المرور</button>
                    </div>
                </form>
            </Modal>

            {/* Bulk Branch Selection Modal */}
            <Modal isOpen={bulkBranchModal} onClose={() => setBulkBranchModal(false)} title="تغيير فرع المستخدمين">
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-slate-200 mb-2">اختر الفرع الجديد</label>
                        <div className="relative flex items-center">
                            <div className="absolute right-4 flex items-center gap-2 pointer-events-none text-slate-400 border-l border-slate-200/80 dark:border-slate-800 pl-2.5">
                                <Store size={18} className="text-[#6b9b37] dark:text-primary-450" />
                            </div>
                            <select className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl pr-13 pl-10 py-3.5 text-sm bg-white dark:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all appearance-none cursor-pointer text-slate-700 dark:text-slate-200 font-bold hover:border-slate-300 dark:hover:border-slate-700"
                                value={bulkBranchId} onChange={e => setBulkBranchId(e.target.value)}>
                                <option value="" disabled>اختر الفرع</option>
                                {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-3">
                        <button onClick={() => setBulkBranchModal(false)}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button onClick={() => runBulkAction('change_branch', bulkBranchId)} disabled={!bulkBranchId}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 transition-all disabled:opacity-50 cursor-pointer">حفظ وتغيير الفرع</button>
                    </div>
                </div>
            </Modal>

            {/* Single Delete Modal in Accent Red */}
            <Modal isOpen={!!showDel} onClose={() => setShowDel(null)} title="تأكيد الحذف">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-950/20 flex items-center justify-center animate-pulse">
                        <AlertTriangle size={32} className="text-accent-500 dark:text-accent-400" />
                    </div>
                    <div>
                        <p className="font-bold text-dark-900 dark:text-white text-lg mb-1">تأكيد حذف المستخدم</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">هل تريد حذف "{showDel?.name}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setShowDel(null)} className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button onClick={handleDelete} className="flex-1 py-3 text-sm font-bold text-white bg-accent-500 hover:bg-accent-600 rounded-2xl shadow-md shadow-accent-500/10 transition-all cursor-pointer">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>

            {/* Bulk Delete Modal */}
            <Modal isOpen={showBulkDel} onClose={() => setShowBulkDel(null)} title="تأكيد الحذف الجماعي">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-950/20 flex items-center justify-center animate-pulse">
                        <AlertTriangle size={32} className="text-accent-500 dark:text-accent-400" />
                    </div>
                    <div>
                        <p className="font-bold text-dark-900 dark:text-white text-lg mb-1">تأكيد حذف المستخدمين المحددين</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">هل تريد حذف {selectedUsers.length} مستخدمين محددين نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setShowBulkDel(null)} className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
                        <button onClick={() => { runBulkAction('delete'); setShowBulkDel(false); }} className="flex-1 py-3 text-sm font-bold text-white bg-accent-500 hover:bg-accent-600 rounded-2xl shadow-md shadow-accent-500/10 transition-all cursor-pointer">حذف نهائياً</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
