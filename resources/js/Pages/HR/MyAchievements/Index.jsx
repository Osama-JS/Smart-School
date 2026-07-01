import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ShieldCheck, CheckCircle, PenTool, FileText, AlertCircle, Eye, X, Star, Printer, Award } from 'lucide-react';
import Modal from '@/Components/Modal';
import SignaturePad from '@/Components/SignaturePad';
import Pagination from '@/Components/Pagination';

export default function MyAchievements({ auth, achievements, types, filters, totalPoints, badges }) {
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        employee_signature: null,
    });

    const openSignModal = (achievement) => {
        setSelectedAchievement(achievement);
        reset();
        setIsSignModalOpen(true);
    };

    const submitSignature = (e) => {
        e.preventDefault();
        post(route('hr.my-achievements.sign', selectedAchievement.id), {
            onSuccess: () => setIsSignModalOpen(false)
        });
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="إنجازاتي" />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 via-white to-white dark:from-emerald-500/10 dark:via-[#121820]/95 border border-emerald-100 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500" />
                    <div className="relative z-10">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <ShieldCheck size={28} className="text-emerald-600" />
                            لوحة شرف إنجازاتي
                        </h1>
                        <p className="text-emerald-700/80 mt-2 text-sm font-semibold">استعراض إنجازاتك والمكافآت التي حصلت عليها</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <Star size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي النقاط المكتسبة</p>
                            <h4 className="text-4xl font-black text-slate-800 dark:text-white">{totalPoints || 0}</h4>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            <Award size={18} /> الشارات الرقمية
                        </p>
                        {badges && badges.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {badges.map((badge, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-1">
                                        <div className={`w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 ${badge.badge_color || 'text-amber-500'}`}>
                                            <Star size={24} fill="currentColor" className="opacity-80" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">لم تكتسب أي شارات بعد.</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {achievements.data.map((a) => (
                        <div key={a.id} className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                            <div className="p-5 pb-4 border-b border-slate-100 flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-bold text-slate-500 mb-2">{a.achievement_date}</div>
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                        {a.achievement_type?.name}
                                    </h3>
                                </div>
                                <div className="shrink-0 flex flex-col items-center gap-2">
                                    {a.employee_signature ? (
                                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center" title="تم التوقيع">
                                            <CheckCircle size={20} />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center animate-pulse" title="بانتظار التوقيع">
                                            <AlertCircle size={20} />
                                        </div>
                                    )}
                                    {a.points > 0 && (
                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg">
                                            +{a.points} نقطة
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-5 grow flex flex-col gap-4">
                                <p className="text-sm text-slate-600 line-clamp-3">{a.details}</p>
                                {a.achievement_type?.reward && (
                                    <div className="bg-emerald-50 rounded-xl p-3 text-emerald-700 font-bold text-sm text-center">
                                        مكافأة: {a.achievement_type.reward}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 flex gap-2">
                                {!a.employee_signature ? (
                                    <button onClick={() => openSignModal(a)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors">
                                        <PenTool size={16} /> تأكيد الاستلام
                                    </button>
                                ) : a.admin_signature ? (
                                    <a href={route('hr.employee-achievements.certificate', a.id)} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 text-slate-700 text-sm font-bold shadow-sm transition-colors">
                                        <Printer size={16} /> عرض وطباعة الشهادة
                                    </a>
                                ) : (
                                    <div className="flex-1 text-center py-2 text-sm text-slate-500 font-bold">بانتظار اعتماد الإدارة</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {achievements.data.length === 0 && (
                        <div className="col-span-full bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-500">
                            لا توجد إنجازات مسجلة لك بعد.
                        </div>
                    )}
                </div>
            </div>

            <Modal show={isSignModalOpen} onClose={() => setIsSignModalOpen(false)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">تأكيد الاستلام</h2>
                    <form onSubmit={submitSignature}>
                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2">توقيعك الإلكتروني:</label>
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <SignaturePad onChange={(val) => setData('employee_signature', val)} error={errors.employee_signature} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsSignModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">إلغاء</button>
                            <button type="submit" disabled={processing} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold">اعتماد</button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}
