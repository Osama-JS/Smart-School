import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Shield, Plus, Trash2, Check, X, AlertTriangle, Users,
    ChevronDown, ChevronUp, Lock, Unlock, MoreVertical, Edit2, Smartphone
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
export default function PermissionsIndex({ roles = [], permissions = [] }) {
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
    const [expandedModules, setExpandedModules] = useState({});

    // قائمة الصلاحيات المرتبطة بتطبيق الجوال
    const appPermissions = [
        'إضافة حضور وانصراف', 'تسجيل حضور', 'عرض الحضور والانصراف',
        'عرض الجداول الدراسية', 'إدارة تحضيري للدروس', 'إدارة دفاتر التحضير',
        'عرض دفاتر التحضير', 'إدارة الطلبات الإدارية', 'عرض الطلبات الإدارية',
        'إضافة طلب إداري', 'مراجعة الحضور والانصراف', 'عرض الزيارات الصفية',
        'إدارة الزيارات الصفية', 'إضافة زيارة صفية', 'عرض زياراتي الصفية',
        'عرض مخالفاتي', 'عرض إنجازاتي'
    ];

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

    const deleteRole = () => {
        router.delete(route('admin.roles.destroy', showDel.id), {
            onFinish: () => setShowDel(null)
        });
    };

    const toggleModule = (module) => {
        setExpandedModules(p => ({ ...p, [module]: !p[module] }));
    };

    const moduleLabels = {
        hr:       'الموارد البشرية',
        academic: 'الشؤون الأكاديمية',
        admin:    'الإدارة والنظام',
        reports:  'التقارير',
    };

    const allPermsInModule = (module) =>
        permissions.find(p => p.module === module)?.items.map(i => i.name) ?? [];

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
                    <button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95">
                        <Plus size={18} /> 
                        <span>إضافة دور جديد</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                                    {!role.is_system_role && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowDel(role); }}
                                            className="opacity-0 group-hover:opacity-100 text-slate-350 dark:text-slate-500 hover:text-accent-500 dark:hover:text-accent-400 transition-all p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
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
                            <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-800/20">
                                <div>
                                    <h2 className="text-base font-bold text-dark-900 dark:text-white">
                                        صلاحيات دور: <span className="text-primary-600 dark:text-primary-400">{selectedRole.name}</span>
                                    </h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">{rolePerms.size} صلاحية مفعّلة</p>
                                </div>
                                <button onClick={savePermissions} disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-md shadow-primary-500/10 transition-all disabled:opacity-60">
                                    <Check size={16} />
                                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                {permissions.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                                        <Lock size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">لا توجد صلاحيات معرَّفة في النظام بعد</p>
                                    </div>
                                )}
                                {permissions.map(({ module, items }) => {
                                    const isExpanded = expandedModules[module] !== false; // default open
                                    const allSelected = allModuleSelected(module);
                                    return (
                                        <div key={module} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                            <div
                                                className="flex items-center justify-between px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer select-none"
                                                onClick={() => toggleModule(module)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Shield size={15} className="text-primary-500" />
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                        {moduleLabels[module] ?? module}
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
                                                    {items.map(perm => (
                                                        <div key={perm.name}
                                                            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                 <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{perm.name}</p>
                                                                 {appPermissions.includes(perm.name) && (
                                                                     <span className="flex items-center gap-1 text-[10px] bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-md font-bold" title="متاحة في تطبيق الجوال">
                                                                         <Smartphone size={10} /> تطبيق
                                                                     </span>
                                                                 )}
                                                            </div>
                                                            <PermissionToggle
                                                                enabled={rolePerms.has(perm.name)}
                                                                onChange={() => togglePerm(perm.name)}
                                                            />
                                                        </div>
                                                    ))}
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
        </AdminLayout>
    );
}
