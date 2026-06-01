import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Shield, Plus, Trash2, Check, X, AlertTriangle, Users,
    ChevronDown, ChevronUp, Lock, Unlock, MoreVertical, Edit2
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
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
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
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                enabled ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
        >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-4.5' : 'translate-x-0.5'
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
    const [expandedModules, setExpandedModules] = useState({});

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
        router.post(route('admin.roles.store'), { name: newRoleName }, {
            onFinish: () => { setShowAdd(false); setNewRoleName(''); }
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
        <AdminLayout activeMenu="إدارة الصلاحيات">
            <Head title="إدارة الصلاحيات | النظام الإداري" />

            {flash?.success && (
                <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
                    <Check size={16} /> {flash.success}
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">إدارة الأدوار والصلاحيات</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">تحديد ما يستطيع كل دور رؤيته وفعله داخل النظام</p>
                    </div>
                    <button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl hover:shadow-lg hover:shadow-violet-600/30 transition-all text-sm font-bold active:scale-95">
                        <Plus size={18} /> إضافة دور جديد
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* ── Roles List ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-700">الأدوار المتاحة</h2>
                        </div>
                        <ul className="divide-y divide-slate-50">
                            {roles.map(role => (
                                <li key={role.id}
                                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group ${
                                        selectedRole?.id === role.id
                                            ? 'bg-violet-50 border-r-4 border-r-violet-600'
                                            : 'hover:bg-slate-50'
                                    }`}
                                    onClick={() => selectRole(role)}
                                >
                                    <div>
                                        <p className={`text-sm font-bold ${selectedRole?.id === role.id ? 'text-violet-700' : 'text-slate-700'}`}>
                                            {role.name}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            <Users size={10} className="inline ml-1" />
                                            {role.users_count} مستخدم
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowDel(role); }}
                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1 rounded"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </li>
                            ))}
                            {roles.length === 0 && (
                                <li className="px-4 py-8 text-center text-slate-400 text-sm">لا توجد أدوار بعد</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* ── Permissions Panel ── */}
                <div className="lg:col-span-3">
                    {selectedRole ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-slate-800">
                                        صلاحيات دور: <span className="text-violet-600">{selectedRole.name}</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">{rolePerms.size} صلاحية مفعّلة</p>
                                </div>
                                <button onClick={savePermissions} disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60">
                                    <Check size={16} />
                                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </button>
                            </div>

                            <div className="p-4 space-y-3">
                                {permissions.length === 0 && (
                                    <div className="text-center py-12 text-slate-400">
                                        <Lock size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">لا توجد صلاحيات معرَّفة في النظام بعد</p>
                                    </div>
                                )}
                                {permissions.map(({ module, items }) => {
                                    const isExpanded = expandedModules[module] !== false; // default open
                                    const allSelected = allModuleSelected(module);
                                    return (
                                        <div key={module} className="border border-slate-100 rounded-xl overflow-hidden">
                                            <div
                                                className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer select-none"
                                                onClick={() => toggleModule(module)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Shield size={15} className="text-violet-500" />
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {moduleLabels[module] ?? module}
                                                    </span>
                                                    <span className="text-xs text-slate-400">({items.length} صلاحية)</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleModule_perms(module); }}
                                                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                            allSelected
                                                                ? 'bg-violet-100 text-violet-700'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}
                                                    >
                                                        {allSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                                                    </button>
                                                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y divide-slate-50">
                                                    {items.map(perm => (
                                                        <div key={perm.name}
                                                            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-700">{perm.name}</p>
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
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center min-h-[300px]">
                            <div className="text-center text-slate-400">
                                <Shield size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">اختر دوراً من القائمة لعرض صلاحياته</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Role Modal */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة دور جديد">
                <form onSubmit={addRole} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم الدور <span className="text-rose-500">*</span></label>
                        <input type="text" required
                            placeholder="مثال: وكيل مدرسة، أمين المختبر..."
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/20 outline-none"
                            value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowAdd(false)}
                            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
                        <button type="submit"
                            className="px-5 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700">إضافة</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Role Modal */}
            <Modal isOpen={!!showDel} onClose={() => setShowDel(null)} title="حذف الدور">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
                        <AlertTriangle size={28} className="text-rose-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 mb-1">هل أنت متأكد من حذف دور "{showDel?.name}"؟</p>
                        <p className="text-sm text-slate-500">سيفقد جميع مستخدمي هذا الدور صلاحياتهم المرتبطة به.</p>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setShowDel(null)}
                            className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
                        <button onClick={deleteRole}
                            className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700">حذف الدور</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
