import React, { useState } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowRight, UserPlus, Save } from 'lucide-react';

export default function UsersCreate({ roles, branches }) {
    const { errors } = usePage().props;
    const [form, setForm] = useState({
        name: '',
        username: '',
        password: '',
        role_id: roles?.[0]?.id || '',
        branch_id: branches?.[0]?.id || '',
        is_active: true,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);
        router.post(route('users.store'), form, {
            onFinish: () => setSaving(false),
        });
    };

    return (
        <AdminLayout activeMenu="المستخدمون">
            <Head title="إضافة مستخدم جديد | النظام الإداري" />

            {/* Header */}
            <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href={route('users.index')} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                <ArrowRight size={20} />
                            </Link>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">إضافة مستخدم جديد</h1>
                        </div>
                        <p className="text-slate-500 text-sm font-medium pr-8">إدخال بيانات حساب المستخدم وتعيين الصلاحية</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-4xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم الكامل <span className="text-rose-500">*</span></label>
                                <input type="text" required
                                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${errors.name ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-400'}`}
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المستخدم <span className="text-rose-500">*</span></label>
                                <input type="text" required dir="ltr"
                                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${errors.username ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-400'}`}
                                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                                {errors.username && <p className="text-xs text-rose-500 mt-1">{errors.username}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور <span className="text-rose-500">*</span></label>
                                <input type="password" required minLength="8" dir="ltr"
                                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${errors.password ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-400'}`}
                                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                                {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">الدور والصلاحية <span className="text-rose-500">*</span></label>
                                <select required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                    value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })}>
                                    <option value="" disabled>اختر الدور</option>
                                    {roles?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                                {errors.role_id && <p className="text-xs text-rose-500 mt-1">{errors.role_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">الفرع <span className="text-rose-500">*</span></label>
                                <select required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                    value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })}>
                                    <option value="" disabled>اختر الفرع</option>
                                    {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                {errors.branch_id && <p className="text-xs text-rose-500 mt-1">{errors.branch_id}</p>}
                            </div>
                            <div className="flex items-center pt-8">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox"
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                        checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                                    <span className="text-sm font-bold text-slate-700">تفعيل الحساب فوراً</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <Link href={route('users.index')} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                            إلغاء
                        </Link>
                        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
                            <Save size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ المستخدم'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
