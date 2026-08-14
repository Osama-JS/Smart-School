import React, { useState, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Star, Clock, Users, CheckCircle, AlertTriangle, Calendar, BarChart, Award, ShieldCheck, Send, Check, TrendingUp, Target, Plus, Trash, CheckSquare, PenTool } from 'lucide-react';
import { getGrade } from './Index';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ onEnd }) => {
    const sigPad = useRef(null);

    const handleClear = () => {
        sigPad.current.clear();
        onEnd(null);
    };

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 mt-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1"><PenTool size={14} /> التوقيع الإلكتروني</span>
                <button type="button" onClick={handleClear} className="text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1 rounded bg-rose-50 dark:bg-rose-500/10">مسح</button>
            </div>
            <SignatureCanvas 
                ref={sigPad} 
                penColor="black" 
                canvasProps={{ className: "w-full h-32 cursor-crosshair bg-white" }}
                onEnd={() => onEnd(sigPad.current.isEmpty() ? null : sigPad.current.getTrimmedCanvas().toDataURL('image/png'))}
            />
        </div>
    );
};

const SignatureDisplay = ({ signature, title, name, role, date }) => {
    if (!signature) return null;
    return (
        <div className="flex-1 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{title}</h4>
            <div className="h-24 flex items-center justify-center border-b border-dashed border-slate-200 dark:border-slate-700 mb-3 pb-2">
                <img src={signature} alt="توقيع" className="max-h-full max-w-full mix-blend-multiply dark:mix-blend-screen" />
            </div>
            <p className="font-bold text-slate-800 dark:text-white text-sm">{name || '—'}</p>
            <p className="text-[10px] text-slate-400 font-semibold">{role}</p>
        </div>
    );
};

const ScoreGoals = ({ appraisal, score, isEmployee, isManager }) => {
    const [title, setTitle] = useState('');
    const [showForm, setShowForm] = useState(false);
    
    const canManageGoals = (isEmployee || isManager) && !['completed', 'pending_hr'].includes(appraisal.status);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        router.post(route('hr.appraisals.goals.store', { appraisal: appraisal.id, score: score.id }), { title, description: '' }, {
            preserveScroll: true,
            onSuccess: () => { setTitle(''); setShowForm(false); }
        });
    };

    const handleUpdateProgress = (goal, newProgress) => {
        router.put(route('hr.appraisals.goals.progress', { appraisal: appraisal.id, goal: goal.id }), { progress: newProgress }, { preserveScroll: true });
    };

    const handleDelete = (goal) => {
        if (confirm('هل أنت متأكد من حذف هذا الهدف؟')) {
            router.delete(route('hr.appraisals.goals.destroy', { appraisal: appraisal.id, goal: goal.id }), { preserveScroll: true });
        }
    };

    return (
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Target size={14} className="text-primary-500" /> الأهداف الذكية (SMART Goals)</h4>
                {canManageGoals && !showForm && (
                    <button onClick={() => setShowForm(true)} className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 dark:bg-primary-500/10 px-2 py-1 rounded-lg transition-colors"><Plus size={12} /> إضافة هدف</button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleAdd} className="flex gap-2 mb-3">
                    <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الهدف (مثال: إنجاز كذا بنسبة كذا...)" className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500/20 outline-none" />
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold">حفظ</button>
                    <button type="button" onClick={() => setShowForm(false)} className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold">إلغاء</button>
                </form>
            )}

            <div className="space-y-2">
                {score.goals && score.goals.map(goal => (
                    <div key={goal.id} className="flex items-center gap-4 bg-white dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 group">
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{goal.title}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${goal.progress === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`} style={{ width: `${goal.progress}%` }} />
                                </div>
                                <span className="text-[10px] font-black text-slate-500">{goal.progress}%</span>
                            </div>
                        </div>
                        {canManageGoals && (
                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <input type="range" min="0" max="100" step="10" value={goal.progress} onChange={(e) => handleUpdateProgress(goal, e.target.value)} className="w-20 accent-primary-600" />
                                <button onClick={() => handleUpdateProgress(goal, 100)} title="مكتمل" className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"><CheckSquare size={14} /></button>
                                <button onClick={() => handleDelete(goal)} className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><Trash size={14} /></button>
                            </div>
                        )}
                    </div>
                ))}
                {(!score.goals || score.goals.length === 0) && !showForm && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">لا توجد أهداف مرتبطة بهذا المعيار</p>
                )}
            </div>
        </div>
    );
};

export default function AppraisalsShow({ appraisal, integrationData, trendData, smartAlert }) {
    const { auth, flash, errors } = usePage().props;
    const isEmployee = auth.user?.id === appraisal.employee?.user_id || auth.user?.employee_id === appraisal.employee_id || auth.user?.employee?.id === appraisal.employee_id;
    const isManager = auth.user?.id === appraisal.manager?.user_id || auth.user?.employee_id === appraisal.manager_id || auth.user?.employee?.id === appraisal.manager_id;
    const isHR = auth.user?.permissions?.includes('إدارة التقييمات الإدارية') || auth.user?.role?.name === 'مدير النظام' || auth.user?.role?.name === 'مدير الفرع';

    const { data: selfData, setData: setSelfData, post: postSelf, processing: selfProcessing } = useForm({
        scores: appraisal.scores.map(s => ({ id: s.id, self_score: s.self_score || '' })),
        self_comments: appraisal.self_comments || '',
        employee_signature: ''
    });

    const { data: managerData, setData: setManagerData, post: postManager, processing: managerProcessing } = useForm({
        scores: appraisal.scores.map(s => ({ id: s.id, manager_score: s.manager_score || '' })),
        manager_comments: appraisal.manager_comments || '',
        manager_signature: ''
    });

    const { data: hrData, setData: setHrData, post: postHr, processing: hrProcessing } = useForm({
        hr_comments: appraisal.hr_comments || '',
        hr_signature: ''
    });

    const handleSelfSubmit = (e) => { e.preventDefault(); postSelf(route('hr.appraisals.submit-self', appraisal.id)); };
    const handleManagerSubmit = (e) => { e.preventDefault(); postManager(route('hr.appraisals.submit-manager', appraisal.id)); };
    const handleHrSubmit = (e) => { e.preventDefault(); postHr(route('hr.appraisals.approve-hr', appraisal.id)); };

    const updateScore = (formType, index, field, value) => {
        if (formType === 'self') {
            const newScores = [...selfData.scores]; 
            newScores[index] = { ...newScores[index], [field]: value };
            setSelfData('scores', newScores);
        } else {
            const newScores = [...managerData.scores]; 
            newScores[index] = { ...newScores[index], [field]: value };
            setManagerData('scores', newScores);
        }
    };

    const statusConfig = {
        'pending_self': { label: 'بانتظار التقييم الذاتي', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: Clock, border: 'border-amber-200 dark:border-amber-500/20' },
        'pending_manager': { label: 'بانتظار تقييم المدير', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: Users, border: 'border-blue-200 dark:border-blue-500/20' },
        'pending_hr': { label: 'بانتظار اعتماد HR', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: ShieldCheck, border: 'border-purple-200 dark:border-purple-500/20' },
        'completed': { label: 'مكتمل ومعتمد', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle, border: 'border-emerald-200 dark:border-emerald-500/20' }
    };
    const sc = statusConfig[appraisal.status] || statusConfig.pending_self;
    const StatusIcon = sc.icon;

    return (
        <AdminLayout activeMenu="تقييمات الأداء">
            <Head title="تفاصيل التقييم الإداري" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur border border-emerald-250 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <Check size={16} /> {flash.success}
                    </div>
                )}
                
                {flash?.error && (
                    <div className="flex items-center gap-3 bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur border border-rose-250 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <AlertTriangle size={16} /> {flash.error}
                    </div>
                )}

                {errors && Object.keys(errors).length > 0 && (
                    <div className="bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur border border-rose-250 dark:border-rose-500/20 p-4 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 mb-2">
                            <AlertTriangle size={16} /> <span>يوجد أخطاء في الإدخال:</span>
                        </div>
                        <ul className="list-disc list-inside text-rose-600 dark:text-rose-300 text-xs space-y-1">
                            {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}

                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <Star size={28} className="text-primary-600" />
                                تفاصيل تقييم الأداء
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    <Users size={12} /> {appraisal.employee?.user?.name || 'غير متوفر'}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    <Calendar size={12} /> {appraisal.cycle?.title}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>
                                    <StatusIcon size={12} /> {sc.label}
                                </span>
                            </div>
                        </div>
                        {appraisal.final_score != null && (
                            (() => {
                                const grade = getGrade(appraisal.final_score);
                                return (
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className={`text-center bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm min-w-[120px] ${grade.bg}`}>
                                            <p className={`text-xs font-bold mb-1 ${grade.text}`}>{grade.icon} {grade.label}</p>
                                            <p className={`text-3xl font-black ${grade.text}`}>
                                                {appraisal.final_score.toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                    </div>
                </div>

                {/* Workflow Steps */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                        {(() => {
                            const steps = appraisal.cycle?.requires_self_appraisal ? 
                                ['pending_self', 'pending_manager', 'pending_hr', 'completed'] : 
                                ['pending_manager', 'pending_hr', 'completed'];

                            return steps.map((step, index, arr) => {
                                const config = statusConfig[step];
                            const StepIcon = config.icon;
                            const isActive = appraisal.status === step;
                            const isPast = arr.indexOf(appraisal.status) > index;
                            
                            return (
                                <div key={step} className={`flex items-center gap-3 flex-1 ${isActive ? 'opacity-100' : isPast ? 'opacity-70' : 'opacity-40'}`}>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 ${isActive ? config.bg + ' ' + config.border + ' ' + config.text : isPast ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-transparent border-slate-200 border-dashed text-slate-400'}`}>
                                        <StepIcon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800 dark:text-white mb-0.5">{config.label}</p>
                                        <p className="text-[10px] font-bold text-slate-500">{isActive ? 'الخطوة الحالية' : isPast ? 'مكتمل' : 'قيد الانتظار'}</p>
                                    </div>
                                    {index < arr.length - 1 && (
                                        <div className="hidden md:block flex-1 h-[2px] mx-4 bg-slate-100 dark:bg-slate-800" />
                                    )}
                                </div>
                            );
                            });
                        })()}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Column: Evaluation Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <BarChart size={18} className="text-primary-500" />
                                    معايير التقييم — {appraisal.template?.title}
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">المعيار</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-20">الوزن</th>
                                            {appraisal.cycle?.requires_self_appraisal && (
                                                <th className="px-4 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-32">التقييم الذاتي</th>
                                            )}
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-32">تقييم المدير</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
                                        {appraisal.scores.map((score, index) => (
                                            <React.Fragment key={score.id}>
                                                <tr className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{score.kpi?.name}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{score.kpi?.weight}</span>
                                                    </td>
                                                    {appraisal.cycle?.requires_self_appraisal && (
                                                        <td className="px-4 py-4 text-center">
                                                            {appraisal.status === 'pending_self' && isEmployee ? (
                                                                <input type="number" min="1" max="5" value={selfData.scores[index]?.self_score || ''} onChange={e => updateScore('self', index, 'self_score', e.target.value)} className="w-16 mx-auto bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-center py-2 text-sm font-bold text-amber-700 dark:text-amber-400 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 outline-none transition-all" placeholder="1-5" />
                                                            ) : (
                                                                <span className={`font-black text-sm ${score.self_score ? 'text-amber-600 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>{score.self_score || '—'}</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-4 text-center">
                                                        {appraisal.status === 'pending_manager' && (isManager || isHR) ? (
                                                            <input type="number" min="1" max="5" value={managerData.scores[index]?.manager_score || ''} onChange={e => updateScore('manager', index, 'manager_score', e.target.value)} className="w-16 mx-auto bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-center py-2 text-sm font-bold text-blue-700 dark:text-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all" placeholder="1-5" required />
                                                        ) : (
                                                            <span className={`font-black text-sm ${score.manager_score ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`}>{score.manager_score || '—'}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={appraisal.cycle?.requires_self_appraisal ? "4" : "3"} className="p-0 border-b border-slate-200 dark:border-slate-800/80">
                                                        <ScoreGoals appraisal={appraisal} score={score} isEmployee={isEmployee} isManager={isManager} />
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Self Submit */}
                            {appraisal.cycle?.requires_self_appraisal && appraisal.status === 'pending_self' && isEmployee && (
                                <form onSubmit={handleSelfSubmit} className="p-6 border-t border-slate-100 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-500/5">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ملاحظات التقييم الذاتي</label>
                                    <textarea value={selfData.self_comments} onChange={e => setSelfData('self_comments', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 outline-none transition-all dark:text-white font-semibold" rows="3" placeholder="أضف ملاحظاتك هنا..." />
                                    
                                    <div className="mt-4">
                                        <SignaturePad onEnd={(data) => setSelfData('employee_signature', data)} />
                                    </div>

                                    <button type="submit" disabled={selfProcessing} className="mt-4 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
                                        <Send size={16} /> تقديم التقييم الذاتي
                                    </button>
                                </form>
                            )}

                            {/* Self Comments Display */}
                            {appraisal.cycle?.requires_self_appraisal && appraisal.status !== 'pending_self' && appraisal.self_comments && (
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl p-4">
                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">ملاحظات التقييم الذاتي</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{appraisal.self_comments}</p>
                                    </div>
                                </div>
                            )}

                            {/* Manager Submit */}
                            {appraisal.status === 'pending_manager' && (isManager || isHR) && (
                                <form onSubmit={handleManagerSubmit} className="p-6 border-t border-slate-100 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-500/5">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ملاحظات المدير</label>
                                    <textarea value={managerData.manager_comments} onChange={e => setManagerData('manager_comments', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all dark:text-white font-semibold" rows="3" placeholder="أضف ملاحظاتك هنا..." />
                                    
                                    <div className="mt-4">
                                        <SignaturePad onEnd={(data) => setManagerData('manager_signature', data)} />
                                    </div>

                                    <button type="submit" disabled={managerProcessing} className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
                                        <Send size={16} /> اعتماد تقييم المدير
                                    </button>
                                </form>
                            )}

                            {/* Manager Comments Display */}
                            {['pending_hr', 'completed'].includes(appraisal.status) && appraisal.manager_comments && (
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-2xl p-4">
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">ملاحظات المدير المباشر</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{appraisal.manager_comments}</p>
                                        {appraisal.manager_score && (
                                            <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-500/10">
                                                <span className="text-xs font-bold text-blue-500">نتيجة تقييم المدير:</span>
                                                <span className="mr-2 text-lg font-black text-blue-700 dark:text-blue-300">{appraisal.manager_score.toFixed(0)}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* HR Approval */}
                            {appraisal.status === 'pending_hr' && isHR && (
                                <form onSubmit={handleHrSubmit} className="p-6 border-t border-slate-100 dark:border-slate-800 bg-purple-50/30 dark:bg-purple-500/5">
                                    <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">ملاحظات الموارد البشرية (الاعتماد النهائي)</label>
                                    <textarea value={hrData.hr_comments} onChange={e => setHrData('hr_comments', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/20 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all dark:text-white font-semibold" rows="2" placeholder="أضف ملاحظات الموارد البشرية..." />
                                    
                                    <div className="mt-4">
                                        <SignaturePad onEnd={(data) => setHrData('hr_signature', data)} />
                                    </div>

                                    <button type="submit" disabled={hrProcessing} className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
                                        <ShieldCheck size={16} /> اعتماد التقييم النهائي
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Historical Trend */}
                        {trendData && trendData.length > 0 && (
                            <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative p-6">
                                <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                                <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 text-sm">
                                    <TrendingUp size={16} className="text-primary-500" /> تطور الأداء عبر الدورات (Trend Analysis)
                                </h3>
                                {smartAlert && (
                                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3">
                                        <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">تنبيه ذكي</p>
                                            <p className="text-rose-600 dark:text-rose-300 text-xs font-semibold mt-1">{smartAlert}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="h-64" dir="ltr">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                            <XAxis dataKey="cycle" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                                            <Line type="monotone" dataKey="employee_score" name="أداء الموظف" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="department_avg" name="متوسط القسم" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Integration Dashboard */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                                    <Calendar size={16} className="text-primary-500" />
                                    سجل الموظف خلال الدورة
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">
                                    من: {appraisal.cycle?.start_date} — إلى: {appraisal.cycle?.end_date}
                                </p>
                            </div>

                            <div className="divide-y divide-slate-50 dark:divide-slate-800/80">
                                {/* Attendance */}
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center"><Clock size={14} className="text-primary-500" /></div>
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">الغياب والتأخير</h4>
                                    </div>
                                    <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl p-4">
                                        {integrationData.attendances.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="text-center p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{integrationData.attendances.filter(a => a.status === 'absent').length}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1">أيام غياب</p>
                                                </div>
                                                <div className="text-center p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{integrationData.attendances.filter(a => a.status === 'late').length}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1">أيام تأخير</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-emerald-500 font-semibold text-center py-2">✓ لا يوجد سجلات غياب / تأخير</p>
                                        )}
                                    </div>
                                </div>

                                {/* Violations */}
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center"><AlertTriangle size={14} className="text-rose-500" /></div>
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">المخالفات</h4>
                                        {integrationData.violations.length > 0 && (
                                            <span className="mr-auto inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">{integrationData.violations.length}</span>
                                        )}
                                    </div>
                                    <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl p-4">
                                        {integrationData.violations.length > 0 ? (
                                            <div className="space-y-2">
                                                {integrationData.violations.map(v => (
                                                    <div key={v.id} className="flex items-center gap-2 text-xs p-2.5 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-xl">
                                                        <AlertTriangle size={12} className="text-rose-400 shrink-0" />
                                                        <span className="text-rose-700 dark:text-rose-300 font-semibold flex-1">{v.violation_type?.name || 'مخالفة'}</span>
                                                        <span className="text-rose-400 font-mono text-[10px]">{v.violation_date}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-emerald-500 font-semibold text-center py-2">✓ لا توجد مخالفات مسجلة</p>
                                        )}
                                    </div>
                                </div>

                                {/* Achievements */}
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center"><Award size={14} className="text-emerald-500" /></div>
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">الإنجازات</h4>
                                        {integrationData.achievements.length > 0 && (
                                            <span className="mr-auto inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">{integrationData.achievements.length}</span>
                                        )}
                                    </div>
                                    <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl p-4">
                                        {integrationData.achievements.length > 0 ? (
                                            <div className="space-y-2">
                                                {integrationData.achievements.map(a => (
                                                    <div key={a.id} className="flex items-center gap-2 text-xs p-2.5 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-xl">
                                                        <Award size={12} className="text-emerald-400 shrink-0" />
                                                        <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex-1">{a.achievement_type?.name || 'إنجاز'}</span>
                                                        <span className="text-emerald-400 font-mono text-[10px]">{a.achievement_date}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 font-semibold text-center py-2">لا يوجد إنجازات مسجلة</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Display Signatures Section */}
                {(appraisal.employee_signature || appraisal.manager_signature || appraisal.hr_signature) && (
                    <div className="mt-8 bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <ShieldCheck size={18} className="text-primary-500" />
                                التواقيع والاعتمادات
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {appraisal.cycle?.requires_self_appraisal && (
                                    <SignatureDisplay 
                                        signature={appraisal.employee_signature} 
                                        title="إقرار الموظف" 
                                        name={appraisal.employee?.user?.name} 
                                        role="الموظف المقيَّم" 
                                    />
                                )}
                                <SignatureDisplay  
                                    signature={appraisal.manager_signature} 
                                    title="اعتماد المدير المباشر" 
                                    name={appraisal.manager?.user?.name} 
                                    role="المدير المباشر" 
                                />
                                <SignatureDisplay 
                                    signature={appraisal.hr_signature} 
                                    title="الاعتماد النهائي (الموارد البشرية)" 
                                    name={appraisal.hr?.name} 
                                    role="مسؤول الموارد البشرية" 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
