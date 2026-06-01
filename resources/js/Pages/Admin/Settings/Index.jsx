import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Check, Save, Settings as SettingsIcon, Building, Clock, ShieldCheck } from 'lucide-react';

export default function SettingsIndex({ settings }) {
    const { flash } = usePage().props;
    const [form, setForm] = useState({
        school_name: settings.school_name || '',
        academic_year: settings.academic_year || '',
        session_timeout: settings.session_timeout || 120,
        max_login_attempts: settings.max_login_attempts || 5,
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);
        router.post(route('admin.settings.update'), form, {
            onFinish: () => setSaving(false),
        });
    };

    return (
        <AdminLayout activeMenu="إعدادات النظام">
            <Head title="إعدادات النظام | النظام الإداري" />

            {flash?.success && (
                <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
                    <Check size={16} /> {flash.success}
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-bl from-slate-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">إعدادات النظام</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">التحكم في الإعدادات العامة والمتغيرات الأساسية للمدرسة</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-4xl">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 md:p-8 space-y-8">
                        {/* ── General Info ── */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Building size={18} className="text-slate-500" /> المعلومات الأساسية
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المدرسة <span className="text-rose-500">*</span></label>
                                    <input type="text" name="school_name" required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-500/20 outline-none"
                                        value={form.school_name} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">العام الدراسي الحالي <span className="text-rose-500">*</span></label>
                                    <input type="text" name="academic_year" required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-500/20 outline-none"
                                        value={form.academic_year} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* ── Security ── */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <ShieldCheck size={18} className="text-slate-500" /> الأمان والوصول
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">مهلة انتهاء الجلسة (بالدقائق) <span className="text-rose-500">*</span></label>
                                    <input type="number" name="session_timeout" required min="10" max="1440"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-500/20 outline-none"
                                        value={form.session_timeout} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">أقصى محاولات تسجيل دخول <span className="text-rose-500">*</span></label>
                                    <input type="number" name="max_login_attempts" required min="3" max="20"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-500/20 outline-none"
                                        value={form.max_login_attempts} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-slate-800 rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-60">
                            <Save size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
