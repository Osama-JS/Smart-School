import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    ShieldAlert, FileSignature, AlertTriangle, CheckCircle2, 
    CalendarDays, User, ArrowLeft, PenTool, Check, Clock 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ChildSelector from '@/Components/ChildSelector';

export default function StudentDiscipline({ auth, violations, pledges, stats, children, activeChildId }) {
    const [activeTab, setActiveTab] = useState('violations'); // violations, pledges

    const handleSignPledge = (pledgeId) => {
        if (confirm('بالنقر على موافق، أنت تقر وتتعهد بالالتزام بما ورد في هذا التعهد.')) {
            router.put(route('student.discipline.sign-pledge', pledgeId), {}, {
                preserveScroll: true,
                onSuccess: () => toast.success('تم توقيع التعهد بنجاح ✅')
            });
        }
    };

    return (
        <AdminLayout user={auth.user} activeMenu="المخالفات والتعهدات">
            <Head title="المخالفات والتعهدات" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-20">
                <ChildSelector children={children} activeChildId={activeChildId} />

                {/* Header Section */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820]/95 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-dark-800" />
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/30 shadow-inner">
                                <ShieldAlert size={32} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">سجل الانضباط والتعهدات</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
                                    <AlertTriangle size={16} />
                                    تابع سجل المخالفات وقم بتوقيع التعهدات المطلوبة
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                        <AlertTriangle className="text-emerald-500 mb-2" size={28} />
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalViolations}</p>
                        <p className="text-sm text-slate-500 font-bold mt-1">إجمالي المخالفات</p>
                    </div>
                    
                    <div className={`bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border ${stats.pendingPledges > 0 ? 'border-amber-200 dark:border-amber-900/50' : 'border-slate-100 dark:border-slate-800'} shadow-sm flex flex-col items-center justify-center relative overflow-hidden`}>
                        <FileSignature className={stats.pendingPledges > 0 ? 'text-amber-500 mb-2' : 'text-slate-400 mb-2'} size={28} />
                        <p className={`text-3xl font-black ${stats.pendingPledges > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>{stats.pendingPledges}</p>
                        <p className="text-sm text-slate-500 font-bold mt-1">تعهدات بانتظار التوقيع</p>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                        <CheckCircle2 className="text-emerald-500 mb-2" size={28} />
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.resolvedViolations}</p>
                        <p className="text-sm text-slate-500 font-bold mt-1">مخالفات تمت تسويتها</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
                    <button
                        onClick={() => setActiveTab('violations')}
                        className={`pb-4 px-6 font-bold text-lg border-b-2 transition-all ${
                            activeTab === 'violations' 
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={20} />
                            المخالفات
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('pledges')}
                        className={`pb-4 px-6 font-bold text-lg border-b-2 transition-all ${
                            activeTab === 'pledges' 
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <FileSignature size={20} />
                            التعهدات
                            {stats.pendingPledges > 0 && (
                                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                                    {stats.pendingPledges}
                                </span>
                            )}
                        </div>
                    </button>
                </div>

                {/* Content Area */}
                <div>
                    {activeTab === 'violations' && (
                        <div className="space-y-4">
                            {violations.length > 0 ? (
                                violations.map(violation => (
                                    <div key={violation.id} className="bg-white dark:bg-[#1e293b] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{violation.type}</h3>
                                                    {violation.status === 'resolved' ? (
                                                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                                                            <CheckCircle2 size={12} />
                                                            تمت التسوية
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold flex items-center gap-1">
                                                            <Clock size={12} />
                                                            قيد المعالجة
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    {violation.details}
                                                </p>
                                                
                                                {violation.action_taken && (
                                                    <div className="mb-4">
                                                        <span className="text-xs font-bold text-slate-500 block mb-1">الإجراء المتخذ:</span>
                                                        <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                                                            {violation.action_taken}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                                                        <CalendarDays size={14} className="text-slate-400" />
                                                        {violation.date}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                                                        <User size={14} className="text-slate-400" />
                                                        المشرف: {violation.supervisor || 'غير محدد'}
                                                    </span>
                                                    {violation.degree && (
                                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-amber-500">
                                                            <AlertTriangle size={14} />
                                                            الدرجة: {violation.degree}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="w-20 h-20 mx-auto bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-5">
                                        <CheckCircle2 size={36} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">سجل المخالفات نظيف!</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto">
                                        أنت طالب منضبط، استمر في الالتزام بقواعد وأنظمة المدرسة.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'pledges' && (
                        <div className="space-y-4">
                            {pledges.length > 0 ? (
                                pledges.map(pledge => (
                                    <div key={pledge.id} className={`bg-white dark:bg-[#1e293b] rounded-[2rem] p-6 shadow-sm border transition-all hover:shadow-md ${!pledge.is_signed_by_student ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/10' : 'border-slate-100 dark:border-slate-800'}`}>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                        <FileSignature size={18} className={!pledge.is_signed_by_student ? 'text-amber-500' : 'text-slate-400'} />
                                                        تعهد التزام
                                                    </h3>
                                                    {pledge.violation_type && (
                                                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 text-xs font-bold">
                                                            بسبب: {pledge.violation_type}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4">
                                                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                                                        "{pledge.pledge_text}"
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-6">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-slate-500">توقيع الطالب:</span>
                                                        {pledge.is_signed_by_student ? (
                                                            <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                                                <Check size={14} /> تم التوقيع
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded-lg">بانتظار التوقيع</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-slate-500">توقيع ولي الأمر:</span>
                                                        {pledge.is_signed_by_parent ? (
                                                            <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                                                <Check size={14} /> تم التوقيع
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">غير موقع</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {!pledge.is_signed_by_student && (
                                                <div className="shrink-0 flex items-center justify-center border-t md:border-t-0 md:border-r border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pr-6">
                                                    <button 
                                                        onClick={() => handleSignPledge(pledge.id)}
                                                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 hover:-translate-y-1 w-full md:w-auto justify-center"
                                                    >
                                                        <PenTool size={18} />
                                                        توقيع التعهد
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="w-20 h-20 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5">
                                        <FileSignature size={36} className="text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">لا توجد تعهدات حالياً</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto">
                                        ليس لديك أي تعهدات مسجلة في النظام.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
