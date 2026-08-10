import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Shield, Plus, Trash2, Check, AlertTriangle, Users, Pencil,
    ChevronDown, ChevronUp, Lock, Smartphone, Search, FolderSymlink,
} from 'lucide-react';

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dark-900/60 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800">
                    <div className="text-lg font-bold text-dark-900 dark:text-white">{title}</div>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors">✕</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

// ── Permission Toggle ─────────────────────────────────────────────────────────
function PermissionToggle({ enabled, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'
            }`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? '-translate-x-5' : 'translate-x-0'
            }`} />
        </button>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PermissionsIndex({ roles = [], permissions = [], modules: modulesProp = [] }) {
    const { flash } = usePage().props;
    const [selectedRole, setSelectedRole] = useState(roles[0] ?? null);
    const [rolePerms, setRolePerms]       = useState(() => {
        const r = roles[0];
        return r ? new Set(r.permissions) : new Set();
    });
    const [saving, setSaving]     = useState(false);
    const [showAdd, setShowAdd]   = useState(false);
    const [showDel, setShowDel]   = useState(null);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleAccessType, setNewRoleAccessType] = useState('dashboard');
    const [showEditRole, setShowEditRole] = useState(false);
    const [editRoleData, setEditRoleData] = useState(null);
    const [expandedModules, setExpandedModules] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    // Edit-module modal state
    const [editingPerm, setEditingPerm]           = useState(null);
    const [editTargetModule, setEditTargetModule] = useState('');
    const [editSaving, setEditSaving]             = useState(false);

    // Module management state
    const [showAddModule, setShowAddModule] = useState(false);
    const [showDelModule, setShowDelModule] = useState(null); // module object
    const [newModuleKey, setNewModuleKey]   = useState('');
    const [newModuleLabel, setNewModuleLabel] = useState('');
    const [moduleSaving, setModuleSaving]   = useState(false);
    const [activeTab, setActiveTab]         = useState('permissions'); // 'permissions' | 'modules'

    // All modules from the backend (includes empty ones)
    const allModules = React.useMemo(() => modulesProp.map(m => m.key), [modulesProp]);

    // قائمة الصلاحيات المرتبطة بتطبيق الجوال
    const appPermissions = React.useMemo(() => [
        'إضافة حضور وانصراف', 'تسجيل حضور', 'عرض الحضور والانصراف',
        'عرض الجداول الدراسية', 'إدارة تحضيري للدروس', 'إدارة دفاتر التحضير',
        'عرض دفاتر التحضير', 'إدارة الطلبات الإدارية', 'عرض الطلبات الإدارية',
        'إضافة طلب إداري', 'مراجعة الحضور والانصراف', 'عرض الزيارات الصفية',
        'إدارة الزيارات الصفية', 'إضافة زيارة صفية', 'عرض زياراتي الصفية',
        'عرض مخالفاتي', 'عرض إنجازاتي', 'عرض التقارير', 'إضافة تقرير'
    ], []);

    // تجميع صلاحيات التطبيق في قسم منفصل
    const groupedPermissions = React.useMemo(() => {
        const result = [];
        const mobileItems = [];

        permissions.forEach(group => {
            const moduleItems = [];
            group.items.forEach(perm => {
                const enriched = { ...perm, originalModule: group.module };
                if (appPermissions.includes(perm.name)) {
                    mobileItems.push(enriched);
                } else {
                    moduleItems.push(enriched);
                }
            });
            result.push({ module: group.module, items: moduleItems });
        });

        if (mobileItems.length > 0) {
            result.unshift({ module: 'mobile_app', items: mobileItems });
        }

        return result;
    }, [permissions, appPermissions]);

    const moduleLabels = React.useMemo(() => {
        const map = {};
        modulesProp.forEach(m => { map[m.key] = m.label; });
        return map;
    }, [modulesProp]);
    const moduleLabel = (m) => moduleLabels[m] ?? m;

    const filteredGroupedPermissions = React.useMemo(() => {
        if (!searchQuery) return groupedPermissions;
        
        return groupedPermissions.map(group => {
            const label = moduleLabel(group.module).toLowerCase();
            const query = searchQuery.toLowerCase();
            const matchesModule = label.includes(query) || group.module.toLowerCase().includes(query);
            
            if (matchesModule) {
                return { ...group }; // If the section matches the search, show it with all its permissions
            }
            
            return {
                ...group,
                items: group.items.filter(item => item.name.toLowerCase().includes(query))
            };
        }).filter(group => group.items.length > 0 || moduleLabel(group.module).toLowerCase().includes(searchQuery.toLowerCase()) || group.module.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [groupedPermissions, searchQuery, moduleLabels]);

    const totalPermissionsCount = React.useMemo(() => {
        return permissions.reduce((acc, group) => acc + (group.items?.length || 0), 0);
    }, [permissions]);

    const selectRole = (role) => {
        setSelectedRole(role);
        setRolePerms(new Set(role.permissions));
    };

    const togglePerm = (permName) => {
        const next = new Set(rolePerms);
        next.has(permName) ? next.delete(permName) : next.add(permName);
        setRolePerms(next);
    };

    const savePermissions = () => {
        if (!selectedRole) return;
        setSaving(true);
        router.post(route('admin.roles.permissions', selectedRole.id), {
            permissions: [...rolePerms]
        }, { onFinish: () => setSaving(false) });
    };

    const addRole = (e) => {
        e.preventDefault();
        router.post(route('admin.roles.store'), { name: newRoleName, access_type: newRoleAccessType }, {
            onFinish: () => { setShowAdd(false); setNewRoleName(''); setNewRoleAccessType('dashboard'); }
        });
    };

    const updateRole = (e) => {
        e.preventDefault();
        if (!editRoleData) return;
        router.patch(route('admin.roles.update', editRoleData.id), { 
            name: editRoleData.name, 
            access_type: editRoleData.access_type 
        }, {
            onSuccess: () => { setShowEditRole(false); setEditRoleData(null); }
        });
    };

    const deleteRole = () => {
        router.delete(route('admin.roles.destroy', showDel.id), {
            onFinish: () => setShowDel(null)
        });
    };

    const toggleModule = (module) => {
        setExpandedModules(p => ({ ...p, [module]: !p[module] }));
    };

    // Edit-module handlers
    const openEditModule = (perm, currentModule) => {
        setEditingPerm({ ...perm, module: currentModule });
        setEditTargetModule(currentModule);
    };

    const saveEditModule = () => {
        if (!editingPerm || editTargetModule === editingPerm.module) { setEditingPerm(null); return; }
        setEditSaving(true);
        router.patch(
            route('admin.permissions.update-module', editingPerm.id),
            { module: editTargetModule },
            { onSuccess: () => setEditingPerm(null), onFinish: () => setEditSaving(false) }
        );
    };

    // Edit-module handlers
    const createModule = (e) => {
        e.preventDefault();
        setModuleSaving(true);
        router.post(route('admin.permission-modules.store'), {
            key: newModuleKey, label: newModuleLabel
        }, {
            onSuccess: () => { setShowAddModule(false); setNewModuleKey(''); setNewModuleLabel(''); },
            onFinish: () => setModuleSaving(false),
        });
    };

    const deleteModule = () => {
        if (!showDelModule) return;
        router.delete(route('admin.permission-modules.destroy', showDelModule.key), {
            onFinish: () => setShowDelModule(null),
        });
    };


    const allPermsInModule = (module) =>
        groupedPermissions.find(p => p.module === module)?.items.map(i => i.name) ?? [];

    const allModuleSelected = (module) =>
        allPermsInModule(module).every(n => rolePerms.has(n));

    const toggleModule_perms = (module) => {
        const names = allPermsInModule(module);
        const next = new Set(rolePerms);
        if (names.every(n => next.has(n))) {
            names.forEach(n => next.delete(n));
        } else {
            names.forEach(n => next.add(n));
        }
        setRolePerms(next);
    };

    return (
        <AdminLayout activeMenu="الصلاحيات">
            <Head title="إدارة الأدوار والصلاحيات | النظام الإداري" />

            {flash?.success && (
                <div className="mb-6 flex items-center gap-3 bg-primary-50 border border-primary-200 text-primary-700 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down">
                    <Check size={18} className="text-primary-600" /> {flash.success}
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
                        <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">إدارة الأدوار والصلاحيات</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تحديد ما يستطيع كل دور رؤيته وفعله داخل النظام</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => setShowAddModule(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-bold transition-all active:scale-95">
                            <FolderSymlink size={16} />
                            <span>قسم جديد</span>
                        </button>
                        <button onClick={() => setShowAdd(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95">
                            <Plus size={18} />
                            <span>دور جديد</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 mb-6 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl w-fit">
                <button onClick={() => setActiveTab('permissions')}
                    className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                        activeTab === 'permissions'
                            ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}>
                    الأدوار والصلاحيات
                </button>
                <button onClick={() => setActiveTab('modules')}
                    className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                        activeTab === 'modules'
                            ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}>
                    <FolderSymlink size={14} />
                    إدارة الأقسام
                    <span className="text-xs bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-md font-bold">{modulesProp.length}</span>
                </button>
            </div>
            {activeTab === 'permissions' ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
                {/* ── Roles List ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                            <h2 className="text-sm font-bold text-dark-900 dark:text-white">الأدوار المتاحة</h2>
                        </div>
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {roles.map(role => (
                                <li key={role.id}
                                    className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors group ${
                                        selectedRole?.id === role.id
                                            ? 'bg-primary-50/40 dark:bg-primary-500/10 border-r-4 border-r-primary-500'
                                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/50'
                                    }`}
                                    onClick={() => selectRole(role)}
                                >
                                    <div>
                                        <p className={`text-sm font-bold flex items-center gap-2 ${selectedRole?.id === role.id ? 'text-primary-700 dark:text-primary-400' : 'text-slate-750 dark:text-slate-300'}`}>
                                            {role.name}
                                            {role.is_system_role && <Shield size={12} className="text-primary-400" title="دور أساسي بالنظام" />}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
                                            <span className="flex items-center gap-1"><Users size={10} /> {role.users_count}</span>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{role.access_type}</span>
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditRoleData(role); setShowEditRole(true); }}
                                            className="text-slate-350 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                            title="تعديل الدور"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        {!role.is_system_role && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowDel(role); }}
                                                className="text-slate-350 dark:text-slate-500 hover:text-accent-500 dark:hover:text-accent-400 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                                title="حذف الدور"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                            {roles.length === 0 && (
                                <li className="px-5 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">لا توجد أدوار بعد</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* ── Permissions Panel ── */}
                <div className="lg:col-span-3">
                    {selectedRole ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-800/20">
                                <div>
                                    <h2 className="text-base font-bold text-dark-900 dark:text-white">
                                        صلاحيات دور: <span className="text-primary-600 dark:text-primary-400">{selectedRole.name}</span>
                                    </h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">{rolePerms.size} صلاحية مفعّلة من أصل {totalPermissionsCount} صلاحية</p>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="بحث عن صلاحية..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white"
                                        />
                                    </div>
                                    <button onClick={savePermissions} disabled={saving}
                                        className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 transition-all disabled:opacity-60 shrink-0">
                                        <Check size={16} />
                                        <span className="hidden sm:inline">{saving ? 'جاري الحفظ...' : 'حفظ'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                {filteredGroupedPermissions.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                                        <Lock size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">{searchQuery ? 'لا توجد صلاحيات مطابقة للبحث' : 'لا توجد صلاحيات معرَّفة في النظام بعد'}</p>
                                    </div>
                                )}
                                {filteredGroupedPermissions.map(({ module, items }) => {
                                    const isExpanded = expandedModules[module] !== false; // default open
                                    const allSelected = allModuleSelected(module);
                                    return (
                                        <div key={module} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-4">
                                            <div
                                                className="flex items-center justify-between px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer select-none"
                                                onClick={() => toggleModule(module)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {module === 'mobile_app' ? (
                                                        <Smartphone size={15} className="text-primary-500" />
                                                    ) : (
                                                        <Shield size={15} className="text-primary-500" />
                                                    )}
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                        {moduleLabel(module)}
                                                    </span>
                                                    <span className="text-xs text-slate-450 dark:text-slate-500 font-bold">({items.length} صلاحية)</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleModule_perms(module); }}
                                                        className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all ${
                                                            allSelected
                                                                ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {allSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                                                    </button>
                                                    {isExpanded ? <ChevronUp size={16} className="text-slate-400 dark:text-slate-500" /> : <ChevronDown size={16} className="text-slate-400 dark:text-slate-500" />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y divide-slate-100/50 dark:divide-slate-800/50">
                                                    {items.length === 0 ? (
                                                        <div className="col-span-full py-6 text-center text-sm text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-800/20">
                                                            لا توجد صلاحيات في هذا القسم بعد
                                                        </div>
                                                    ) : (
                                                        items.map(perm => (
                                                            <div key={perm.name}
                                                                className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors group/perm">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{perm.name}</p>
                                                                    {appPermissions.includes(perm.name) && (
                                                                        <span className="flex items-center gap-1 text-[10px] bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-md font-bold shrink-0" title="متاحة في تطبيق الجوال">
                                                                            <Smartphone size={10} /> تطبيق
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <button type="button"
                                                                        title="نقل الصلاحية لقسم آخر"
                                                                        onClick={() => openEditModule(perm, perm.originalModule ?? module)}
                                                                        className="opacity-0 group-hover/perm:opacity-100 p-1 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-all">
                                                                        <FolderSymlink size={13} />
                                                                    </button>
                                                                    <PermissionToggle
                                                                        enabled={rolePerms.has(perm.name)}
                                                                        onChange={() => togglePerm(perm.name)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center min-h-[300px]">
                            <div className="text-center text-slate-400 dark:text-slate-600">
                                <Shield size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">اختر دوراً من القائمة لعرض صلاحياته</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
                    {modulesProp.map(mod => {
                        const isEmpty = mod.permissions_count === 0;
                        return (
                            <div key={mod.key} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between group">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500">
                                            <FolderSymlink size={20} />
                                        </div>
                                        {mod.is_system && (
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg font-bold" title="قسم أساسي بالنظام">أساسي</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-dark-900 dark:text-white text-base mb-1">{mod.label}</h3>
                                    <p className="text-xs text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md inline-block">{mod.key}</p>
                                </div>
                                <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{mod.permissions_count} صلاحية</span>
                                    {/* Action buttons replaced with flex container */}
                                    <div className="flex gap-2">
                                        {isEmpty && !mod.is_system ? (
                                            <>
                                                <button onClick={() => setShowDelModule(mod)} className="text-xs text-accent-500 hover:text-accent-600 font-bold bg-accent-50 dark:bg-accent-500/10 hover:bg-accent-100 dark:hover:bg-accent-500/20 px-3 py-1.5 rounded-xl transition-colors">حذف</button>
                                            </>
                                        ) : (
                                            <button disabled className="text-xs text-slate-300 dark:text-slate-600 font-bold px-3 py-1.5 rounded-xl" title="لا يمكن حذفه لأنه يحتوي على صلاحيات أو أنه أساسي">
                                                لا يمكن الحذف
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {modulesProp.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400">لا توجد أقسام مسجلة</div>
                    )}
                </div>
            )}

            {/* Add Role Modal */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة دور جديد">
                <form onSubmit={addRole} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم الدور <span className="text-accent-500">*</span></label>
                        <input type="text" required
                            placeholder="مثال: وكيل مدرسة، أمين المختبر..."
                            className="w-full bg-slate-50 dark:bg-slate-900/50 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all"
                            value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">نوع واجهة الوصول (Access Type)</label>
                        <select 
                            className="w-full bg-slate-50 dark:bg-slate-900/50 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all"
                            value={newRoleAccessType} onChange={e => setNewRoleAccessType(e.target.value)}>
                            <option value="dashboard" className="dark:bg-slate-800">لوحة التحكم (Dashboard)</option>
                            <option value="app" className="dark:bg-slate-800">التطبيق (App)</option>
                            <option value="both" className="dark:bg-slate-800">الكل (Both)</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowAdd(false)}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button type="submit" disabled={!newRoleName}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 transition-all disabled:opacity-50">إضافة الدور</button>
                    </div>
                </form>
            </Modal>

            {/* Edit Role Modal */}
            <Modal isOpen={showEditRole} onClose={() => { setShowEditRole(false); setEditRoleData(null); }} title="تعديل بيانات الدور">
                <form onSubmit={updateRole} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم الدور <span className="text-accent-500">*</span></label>
                        <input type="text" required
                            className="w-full bg-slate-50 dark:bg-slate-900/50 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all disabled:opacity-50"
                            value={editRoleData?.name || ''} onChange={e => setEditRoleData({...editRoleData, name: e.target.value})} 
                            disabled={editRoleData?.is_system_role}
                            title={editRoleData?.is_system_role ? "لا يمكن تعديل اسم الدور الأساسي" : ""}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">نوع واجهة الوصول (Access Type)</label>
                        <select 
                            className="w-full bg-slate-50 dark:bg-slate-900/50 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all"
                            value={editRoleData?.access_type || 'dashboard'} onChange={e => setEditRoleData({...editRoleData, access_type: e.target.value})}>
                            <option value="dashboard" className="dark:bg-slate-800">لوحة التحكم (Dashboard)</option>
                            <option value="app" className="dark:bg-slate-800">التطبيق (App)</option>
                            <option value="both" className="dark:bg-slate-800">الكل (Both)</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => { setShowEditRole(false); setEditRoleData(null); }}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button type="submit" disabled={!editRoleData?.name}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 transition-all disabled:opacity-50">حفظ التعديلات</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Role Modal */}
            <Modal isOpen={!!showDel} onClose={() => setShowDel(null)} title="حذف الدور">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-500/10 flex items-center justify-center animate-pulse">
                        <AlertTriangle size={32} className="text-accent-500 dark:text-accent-400" />
                    </div>
                    <div>
                        <p className="font-bold text-dark-900 dark:text-white text-lg mb-1">تأكيد حذف الدور</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">هل أنت متأكد من حذف دور "{showDel?.name}"؟ سيفقد جميع مستخدمي هذا الدور صلاحياتهم المرتبطة به.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setShowDel(null)}
                            className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button onClick={deleteRole}
                            className="flex-1 py-3 text-sm font-bold text-white bg-accent-500 hover:bg-accent-600 rounded-2xl shadow-md shadow-accent-500/10 transition-all">حذف الدور</button>
                    </div>
                </div>
            </Modal>

            {/* ── Edit Module Modal ── */}
            <Modal isOpen={!!editingPerm} onClose={() => setEditingPerm(null)} title="نقل الصلاحية لقسم آخر">
                {editingPerm && (
                    <div className="space-y-5">
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2">
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">الصلاحية</p>
                            <p className="font-bold text-dark-900 dark:text-white text-sm">{editingPerm.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400 dark:text-slate-500">القسم الحالي:</span>
                                <span className="text-xs font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-lg">
                                    {moduleLabel(editingPerm.module)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">
                                <FolderSymlink size={14} className="inline ml-1 text-primary-500" />
                                نقل إلى قسم:
                            </label>
                            <select value={editTargetModule} onChange={e => setEditTargetModule(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all">
                                {allModules.map(m => (
                                    <option key={m} value={m} className="dark:bg-slate-800">
                                        {moduleLabel(m)} ({m})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {editTargetModule !== editingPerm.module && (
                            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl px-3 py-2.5">
                                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                    سيتم نقل هذه الصلاحية بشكل دائم من <strong>{moduleLabel(editingPerm.module)}</strong> إلى <strong>{moduleLabel(editTargetModule)}</strong>.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-1">
                            <button type="button" onClick={() => setEditingPerm(null)}
                                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">
                                إلغاء
                            </button>
                            <button type="button" onClick={saveEditModule}
                                disabled={editSaving || editTargetModule === editingPerm.module}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 transition-all disabled:opacity-50">
                                {editSaving ? 'جاري النقل...' : 'تأكيد النقل'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Add Module Modal ── */}
            <Modal isOpen={showAddModule} onClose={() => setShowAddModule(false)} title="إضافة قسم جديد للصلاحيات">
                <form onSubmit={createModule} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم القسم بالعربية <span className="text-accent-500">*</span></label>
                        <input type="text" required placeholder="مثال: الإدارة المالية"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all"
                            value={newModuleLabel} onChange={e => setNewModuleLabel(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">المعرف البرمجي (Key) <span className="text-accent-500">*</span></label>
                        <input type="text" required placeholder="مثال: finance_management"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-mono focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all"
                            value={newModuleKey} onChange={e => setNewModuleKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
                        <p className="text-[10px] text-slate-400 mt-1">يجب أن يكون بالإنجليزية، بدون مسافات (استخدم _).</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowAddModule(false)}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button type="submit" disabled={!newModuleKey || !newModuleLabel || moduleSaving}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 transition-all disabled:opacity-50">
                            {moduleSaving ? 'جاري الإضافة...' : 'إضافة القسم'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Module Modal ── */}
            <Modal isOpen={!!showDelModule} onClose={() => setShowDelModule(null)} title="حذف قسم الصلاحيات">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-500/10 flex items-center justify-center animate-pulse">
                        <AlertTriangle size={32} className="text-accent-500 dark:text-accent-400" />
                    </div>
                    <div>
                        <p className="font-bold text-dark-900 dark:text-white text-lg mb-1">تأكيد حذف القسم</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">هل أنت متأكد من حذف قسم "{showDelModule?.label}" بشكل نهائي؟</p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button onClick={() => setShowDelModule(null)}
                            className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button onClick={deleteModule}
                            className="flex-1 py-3 text-sm font-bold text-white bg-accent-500 hover:bg-accent-600 rounded-2xl shadow-md shadow-accent-500/10 transition-all">حذف القسم</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
