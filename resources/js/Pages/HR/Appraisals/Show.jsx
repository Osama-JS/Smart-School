import React, { useState, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import SelectInput from '@/Components/SelectInput';
import {
    Star,
    Clock,
    Users,
    CheckCircle,
    AlertTriangle,
    Calendar,
    BarChart,
    Award,
    ShieldCheck,
    Send,
    Check,
    TrendingUp,
    Target,
    Plus,
    Trash,
    CheckSquare,
    PenTool,
    BookOpen,
    Eye,
    Map,
    RotateCcw,
    Sparkles,
    MessageSquare,
    GraduationCap,
    ThumbsUp,
    X,
    Download,
} from 'lucide-react';
import { getGrade } from './Index';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SignatureCanvas from 'react-signature-canvas';

const RATING_LEVELS = [
    { value: 1, label: 'ضعيف', badgeBg: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30', activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/20' },
    { value: 2, label: 'مقبول', badgeBg: 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30', activeClass: 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20' },
    { value: 3, label: 'جيد', badgeBg: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', activeClass: 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20' },
    { value: 4, label: 'جيد جداً', badgeBg: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30', activeClass: 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20' },
    { value: 5, label: 'ممتاز', badgeBg: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' },
];

const RECOMMENDATION_OPTIONS = [
    'مكافأة تميز',
    'ترقية',
    'تجديد عقد',
    'إلحاق بدورة تدريبية',
    'خطة تحسين أداء (PIP)',
    'لفت نظر',
];

const TRAINING_PRESETS = [
    'التخطيط وتنظيم الوقت',
    'إدارة الصف واستراتيجيات التدريس الحديثة',
    'التواصل الفعال والعمل الجماعي',
    'التحول الرقمي والأدوات التعليمية',
    'القيادة التربوية والإدارية',
];

const EVALUATOR_ROLE_LABELS = {
    all: 'الجميع',
    manager: 'المدير المباشر',
    supervisor: 'الموجه',
    hr: 'الموارد البشرية',
    committee: 'عضو لجنة',
};

const EVALUATOR_ROLE_OPTIONS = [
    { value: 'manager', label: 'المدير المباشر' },
    { value: 'supervisor', label: 'الموجه' },
    { value: 'hr', label: 'الموارد البشرية' },
    { value: 'committee', label: 'عضو لجنة' },
];

const kpiAllowsRole = (kpi, roleType, user = null) => {
    const roles = kpi?.evaluator_roles;
    if (!Array.isArray(roles) || roles.length === 0 || roles.includes('all')) {
        return true;
    }
    if (roles.includes(roleType)) {
        return true;
    }
    if (!user) {
        return false;
    }
    const jobGradeName = user?.employee?.job_grade?.name;
    const jobGradeId = user?.employee?.job_grade_id;
    const roleName = user?.role?.name;
    const normalizedRoles = roles.map(String);

    if (jobGradeName && normalizedRoles.includes(String(jobGradeName))) {
        return true;
    }
    if (jobGradeId !== null && jobGradeId !== undefined && normalizedRoles.includes(String(jobGradeId))) {
        return true;
    }
    if (roleName && normalizedRoles.includes(String(roleName))) {
        return true;
    }
    if (!jobGradeId && !jobGradeName) {
        return true;
    }
    return false;
};

const getRatingMeta = (val) => RATING_LEVELS.find((r) => r.value === Math.round(Number(val))) || null;

const SignaturePad = ({ onEnd }) => {
    const sigPad = useRef(null);

    const handleClear = () => {
        sigPad.current.clear();
        onEnd(null);
    };

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 mt-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <PenTool size={14} /> التوقيع الإلكتروني
                </span>
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1 rounded bg-rose-50 dark:bg-rose-500/10"
                >
                    مسح
                </button>
            </div>
            <SignatureCanvas
                ref={sigPad}
                penColor="black"
                canvasProps={{ className: 'w-full h-32 cursor-crosshair bg-white' }}
                onEnd={() => onEnd(sigPad.current.isEmpty() ? null : sigPad.current.getTrimmedCanvas().toDataURL('image/png'))}
            />
        </div>
    );
};

const SignatureDisplay = ({ signature, title, name, role }) => {
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

const RatingScaleButtons = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-1.5">
        {RATING_LEVELS.map((level) => {
            const isSelected = Number(value) === level.value;
            return (
                <button
                    key={level.value}
                    type="button"
                    onClick={() => onChange(level.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        isSelected
                            ? level.activeClass
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400'
                    }`}
                >
                    <span className="font-black">{level.value}</span>
                    <span className="text-[11px] opacity-90">{level.label}</span>
                </button>
            );
        })}
    </div>
);

const ScoreGoals = ({ appraisal, score, isEmployee, isManager, isHR }) => {
    const [title, setTitle] = useState('');
    const [showForm, setShowForm] = useState(false);

    const canManageGoals = (isEmployee || isManager || isHR) && !['completed', 'pending_hr'].includes(appraisal.status);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        router.post(
            route('hr.appraisals.goals.store', { appraisal: appraisal.id, score: score.id }),
            { title, description: '' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setTitle('');
                    setShowForm(false);
                },
            }
        );
    };

    const handleUpdateProgress = (goal, newProgress) => {
        router.put(
            route('hr.appraisals.goals.progress', { appraisal: appraisal.id, goal: goal.id }),
            { progress: newProgress },
            { preserveScroll: true }
        );
    };

    const handleDelete = (goal) => {
        if (confirm('هل أنت متأكد من حذف هذا الهدف؟')) {
            router.delete(route('hr.appraisals.goals.destroy', { appraisal: appraisal.id, goal: goal.id }), {
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/70">
            <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Target size={14} className="text-primary-500" /> الأهداف الذكية (SMART Goals)
                </h4>
                {canManageGoals && !showForm && (
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 dark:bg-primary-500/10 px-2.5 py-1 rounded-lg transition-colors"
                    >
                        <Plus size={12} /> إضافة هدف
                    </button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleAdd} className="flex gap-2 mb-3">
                    <input
                        autoFocus
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="عنوان الهدف (مثال: رفع نسبة إنجاز الخطط إلى 100%...)"
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500/20 outline-none dark:text-white"
                    />
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                        حفظ
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold"
                    >
                        إلغاء
                    </button>
                </form>
            )}

            <div className="space-y-2">
                {score.goals &&
                    score.goals.map((goal) => (
                        <div
                            key={goal.id}
                            className="flex items-center gap-4 bg-white dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 group"
                        >
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{goal.title}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${goal.progress === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                                            style={{ width: `${goal.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500">{goal.progress}%</span>
                                </div>
                            </div>
                            {canManageGoals && (
                                <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="10"
                                        value={goal.progress}
                                        onChange={(e) => handleUpdateProgress(goal, e.target.value)}
                                        className="w-20 accent-primary-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateProgress(goal, 100)}
                                        title="مكتمل"
                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                    >
                                        <CheckSquare size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(goal)}
                                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                {(!score.goals || score.goals.length === 0) && !showForm && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-1">لا توجد أهداف مرتبطة بهذا المعيار</p>
                )}
            </div>
        </div>
    );
};

const DevelopmentPlanFields = ({ formData, setField }) => {
    const appendTraining = (preset) => {
        const current = (formData.recommended_training || '').trim();
        if (!current) {
            setField('recommended_training', preset);
            return;
        }
        const parts = current.split(/[،,\n]+/).map((p) => p.trim()).filter(Boolean);
        if (!parts.includes(preset)) {
            setField('recommended_training', `${current}، ${preset}`);
        }
    };

    return (
        <div className="space-y-4 bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70">
            <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <GraduationCap size={17} className="text-indigo-500" />
                خطة التطوير الفردية والتوصية الإدارية (IDP)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">نقاط القوة البارزة</label>
                    <textarea
                        rows={2}
                        value={formData.strengths}
                        onChange={(e) => setField('strengths', e.target.value)}
                        placeholder="أبرز الجوانب المتميزة في أداء الموظف..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-emerald-400 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1.5">مجالات التحسين والتطوير</label>
                    <textarea
                        rows={2}
                        value={formData.improvement_areas}
                        onChange={(e) => setField('improvement_areas', e.target.value)}
                        placeholder="الجوانب التي تحتاج إلى دعم أو تطوير..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-amber-400 dark:text-white"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400">البرامج التدريبية الموصى بها</label>
                <div className="flex flex-wrap gap-1.5">
                    {TRAINING_PRESETS.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => appendTraining(preset)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/20 hover:bg-indigo-100 transition-colors"
                        >
                            + {preset}
                        </button>
                    ))}
                </div>
                <textarea
                    rows={2}
                    value={formData.recommended_training}
                    onChange={(e) => setField('recommended_training', e.target.value)}
                    placeholder="الدورات أو الورش المقترحة للموظف خلال الفترة القادمة..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-indigo-400 dark:text-white"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">التوصية الإدارية النهائية</label>
                <div className="flex flex-wrap gap-2">
                    {RECOMMENDATION_OPTIONS.map((option) => {
                        const active = formData.final_recommendation === option;
                        return (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setField('final_recommendation', active ? '' : option)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    active
                                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400'
                                }`}
                            >
                                {active ? '✓ ' : ''}
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default function AppraisalsShow({
    appraisal,
    integrationData,
    trendData,
    smartAlert,
    availableEvaluators = [],
    currentEvaluator = null,
}) {
    const { auth, flash, errors } = usePage().props;
    const isEmployee =
        auth.user?.id === appraisal.employee?.user_id ||
        auth.user?.employee_id === appraisal.employee_id ||
        auth.user?.employee?.id === appraisal.employee_id;
    const isManager =
        auth.user?.id === appraisal.manager?.user_id ||
        auth.user?.employee_id === appraisal.manager_id ||
        auth.user?.employee?.id === appraisal.manager_id;
    const isHR =
        auth.user?.permissions?.includes('إدارة التقييمات الإدارية') ||
        auth.user?.role?.name === 'مدير النظام' ||
        auth.user?.role?.name === 'مدير الفرع' ||
        auth.user?.role?.name === 'مدير فرع';

    const evaluatorsList = Array.isArray(appraisal.evaluators) ? appraisal.evaluators : [];
    const isEvaluator = Boolean(currentEvaluator);
    const actingRole = currentEvaluator?.role_type || (isManager ? 'manager' : 'hr');
    const canEvaluate = appraisal.status === 'pending_manager' && (isManager || isEvaluator || isHR);
    const canManageCommittee = (isManager || isHR) && appraisal.status !== 'completed';
    const otherPendingEvaluators = evaluatorsList.filter(
        (ev) => ev.status === 'pending' && Number(ev.evaluator_user_id) !== Number(auth.user?.id)
    );

    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showAddEvaluatorModal, setShowAddEvaluatorModal] = useState(false);
    const [scoreValidationMsg, setScoreValidationMsg] = useState('');

    const { data: selfData, setData: setSelfData, post: postSelf, processing: selfProcessing } = useForm({
        scores: appraisal.scores.map((s) => ({
            id: s.id,
            self_score: s.self_score || '',
            self_note: s.self_note || '',
        })),
        self_comments: appraisal.self_comments || '',
        employee_signature: '',
    });

    const { data: managerData, setData: setManagerData, post: postManager, processing: managerProcessing } = useForm({
        scores: appraisal.scores.map((s) => {
            const myEntry = currentEvaluator
                ? (s.evaluator_scores || []).find((es) => es.evaluator_id === currentEvaluator.id)
                : null;
            return {
                id: s.id,
                manager_score: myEntry ? myEntry.score : '',
                manager_note: myEntry ? myEntry.note || '' : '',
            };
        }),
        manager_comments: currentEvaluator?.comments || (!currentEvaluator ? appraisal.manager_comments || '' : ''),
        manager_signature: '',
        strengths: appraisal.strengths || '',
        improvement_areas: appraisal.improvement_areas || '',
        recommended_training: appraisal.recommended_training || '',
        final_recommendation: appraisal.final_recommendation || '',
        force_advance_to_hr: false,
    });

    const { data: hrData, setData: setHrData, post: postHr, processing: hrProcessing } = useForm({
        hr_comments: appraisal.hr_comments || '',
        hr_signature: '',
        strengths: appraisal.strengths || '',
        improvement_areas: appraisal.improvement_areas || '',
        recommended_training: appraisal.recommended_training || '',
        final_recommendation: appraisal.final_recommendation || '',
    });

    const returnForm = useForm({
        return_reason: '',
    });

    const evaluatorForm = useForm({
        evaluator_user_id: '',
        role_type: 'supervisor',
        weight: 100,
    });

    const calculateLivePct = (scoreItems, field, checkRole = false) => {
        let totalWeighted = 0;
        let totalWeight = 0;
        appraisal.scores.forEach((orig, idx) => {
            if (checkRole && !kpiAllowsRole(orig.kpi, actingRole, auth?.user)) {
                return;
            }
            const val = Number(scoreItems[idx]?.[field]);
            const weight = Number(orig.kpi?.weight || 1);
            if (val >= 1 && val <= 5) {
                totalWeighted += val * weight;
                totalWeight += weight;
            }
        });
        if (totalWeight === 0) return null;
        return Math.round((totalWeighted / (totalWeight * 5)) * 100);
    };

    const liveSelfPct = calculateLivePct(selfData.scores, 'self_score', false);
    const liveManagerPct = calculateLivePct(managerData.scores, 'manager_score', true);

    const handleSelfSubmit = (e) => {
        e.preventDefault();
        const incomplete = selfData.scores.some((s) => !s.self_score || Number(s.self_score) < 1 || Number(s.self_score) > 5);
        if (incomplete) {
            setScoreValidationMsg('يرجى اختيار درجة التقييم (من 1 إلى 5) لجميع معايير الأداء قبل الإرسال.');
            return;
        }
        setScoreValidationMsg('');
        postSelf(route('hr.appraisals.submit-self', appraisal.id));
    };

    const handleManagerSubmit = (e) => {
        e.preventDefault();
        const incomplete = appraisal.scores.some((orig, idx) => {
            if (!kpiAllowsRole(orig.kpi, actingRole, auth?.user)) return false;
            const val = Number(managerData.scores[idx]?.manager_score);
            return !val || val < 1 || val > 5;
        });
        if (incomplete) {
            setScoreValidationMsg('يرجى اختيار درجة التقييم (من 1 إلى 5) لجميع المعايير المخصصة لك قبل الاعتماد.');
            return;
        }
        setScoreValidationMsg('');
        postManager(route('hr.appraisals.submit-manager', appraisal.id), { preserveScroll: true });
    };

    const handleHrSubmit = (e) => {
        e.preventDefault();
        postHr(route('hr.appraisals.approve-hr', appraisal.id));
    };

    const handleReturnSubmit = (e) => {
        e.preventDefault();
        returnForm.post(route('hr.appraisals.return', appraisal.id), {
            onSuccess: () => setShowReturnModal(false),
        });
    };

    const handleAddEvaluator = (e) => {
        e.preventDefault();
        evaluatorForm.post(route('hr.appraisals.evaluators.store', appraisal.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowAddEvaluatorModal(false);
                evaluatorForm.reset();
            },
        });
    };

    const handleRemoveEvaluator = (ev) => {
        if (confirm(`هل تريد إزالة (${ev.user?.name || 'المقيّم'}) من لجنة التقييم وإعادة احتساب الدرجات؟`)) {
            router.delete(route('hr.appraisals.evaluators.destroy', { appraisal: appraisal.id, evaluator: ev.id }), {
                preserveScroll: true,
            });
        }
    };

    const updateScore = (formType, index, field, value) => {
        setScoreValidationMsg('');
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
        pending_self: { label: 'بانتظار التقييم الذاتي', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: Clock, border: 'border-amber-200 dark:border-amber-500/20' },
        pending_manager: { label: 'بانتظار تقييم المدير', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: Users, border: 'border-blue-200 dark:border-blue-500/20' },
        pending_hr: { label: 'بانتظار اعتماد HR', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: ShieldCheck, border: 'border-purple-200 dark:border-purple-500/20' },
        completed: { label: 'مكتمل ومعتمد', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle, border: 'border-emerald-200 dark:border-emerald-500/20' },
    };
    const sc = statusConfig[appraisal.status] || statusConfig.pending_self;
    const StatusIcon = sc.icon;

    const attendanceSummary = integrationData?.attendance_summary || {
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        total_days: 0,
        attendance_rate: 100,
    };
    const academicData = integrationData?.academic || {};
    const suggestedMetrics = integrationData?.suggested_metrics || null;

    const canReturnToSelf = appraisal.status === 'pending_manager' && appraisal.cycle?.requires_self_appraisal && (isManager || isHR);
    const canReturnToManager = appraisal.status === 'pending_hr' && isHR;

    return (
        <AdminLayout activeMenu="تقييمات الأداء">
            <Head title="تفاصيل التقييم الإداري" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur border border-emerald-250 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-sm">
                        <Check size={16} /> {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="flex items-center gap-3 bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur border border-rose-250 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-sm">
                        <AlertTriangle size={16} /> {flash.error}
                    </div>
                )}

                {appraisal.return_reason && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                        <RotateCcw size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-black text-amber-800 dark:text-amber-300">تم إرجاع هذا التقييم للمراجعة</p>
                                {appraisal.returned_at && (
                                    <span className="text-[11px] font-bold text-amber-700/80 dark:text-amber-400/80" dir="ltr">
                                        {new Date(appraisal.returned_at).toLocaleString('ar-EG')}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-200 mt-1 leading-relaxed">{appraisal.return_reason}</p>
                        </div>
                    </div>
                )}

                {(scoreValidationMsg || (errors && Object.keys(errors).length > 0)) && (
                    <div className="bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur border border-rose-250 dark:border-rose-500/20 p-4 rounded-2xl text-sm font-semibold shadow-sm">
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 mb-1">
                            <AlertTriangle size={16} /> <span>تنبيه:</span>
                        </div>
                        {scoreValidationMsg && <p className="text-rose-600 dark:text-rose-300 text-xs">{scoreValidationMsg}</p>}
                        {errors && Object.keys(errors).length > 0 && (
                            <ul className="list-disc list-inside text-rose-600 dark:text-rose-300 text-xs space-y-1 mt-1">
                                {Object.values(errors).map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        )}
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
                            <div className="flex flex-wrap items-center gap-2.5 mt-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                    <Users size={12} /> {appraisal.employee?.user?.name || 'غير متوفر'}
                                </span>
                                {appraisal.employee?.department?.name && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        {appraisal.employee.department.name}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    <Calendar size={12} /> {appraisal.cycle?.title}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>
                                    <StatusIcon size={12} /> {sc.label}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <a
                                href={route('hr.appraisals.single.pdf', appraisal.id)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-black shadow-sm transition-all"
                            >
                                <Download size={15} className="text-primary-600" />
                                طباعة / تحميل استمارة PDF
                            </a>
                            {appraisal.self_score != null && appraisal.cycle?.requires_self_appraisal && (
                                <div className="text-center bg-amber-50/80 dark:bg-amber-500/10 rounded-2xl px-4 py-3 border border-amber-200/60 dark:border-amber-500/20">
                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">التقييم الذاتي</p>
                                    <p className="text-xl font-black text-amber-700 dark:text-amber-300">{Math.round(appraisal.self_score)}%</p>
                                </div>
                            )}

                            {appraisal.final_score != null &&
                                (() => {
                                    const grade = getGrade(appraisal.final_score);
                                    return (
                                        <div className={`text-center bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm min-w-[120px] ${grade.bg}`}>
                                            <p className={`text-xs font-bold mb-1 ${grade.text}`}>{grade.label}</p>
                                            <p className={`text-3xl font-black ${grade.text}`}>{appraisal.final_score.toFixed(0)}%</p>
                                        </div>
                                    );
                                })()}
                        </div>
                    </div>
                </div>

                {/* Workflow Steps */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                        {(() => {
                            const steps = appraisal.cycle?.requires_self_appraisal
                                ? ['pending_self', 'pending_manager', 'pending_hr', 'completed']
                                : ['pending_manager', 'pending_hr', 'completed'];

                            return steps.map((step, index, arr) => {
                                const config = statusConfig[step];
                                const StepIcon = config.icon;
                                const isActive = appraisal.status === step;
                                const isPast = arr.indexOf(appraisal.status) > index;

                                return (
                                    <div key={step} className={`flex items-center gap-3 flex-1 ${isActive ? 'opacity-100' : isPast ? 'opacity-70' : 'opacity-40'}`}>
                                        <div
                                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                                                isActive
                                                    ? config.bg + ' ' + config.border + ' ' + config.text
                                                    : isPast
                                                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                                                    : 'bg-transparent border-slate-200 border-dashed text-slate-400'
                                            }`}
                                        >
                                            <StepIcon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 dark:text-white mb-0.5">{config.label}</p>
                                            <p className="text-[10px] font-bold text-slate-500">{isActive ? 'الخطوة الحالية' : isPast ? 'مكتمل' : 'قيد الانتظار'}</p>
                                        </div>
                                        {index < arr.length - 1 && <div className="hidden md:block flex-1 h-[2px] mx-4 bg-slate-100 dark:bg-slate-800" />}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Committee / Multi-Evaluator Panel */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 md:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                <Users size={17} className="text-indigo-500" />
                                لجنة التقييم والمقيّمون المشاركون ({evaluatorsList.length})
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                                يمكن إسناد التقييم لأكثر من شخص (المدير، الموجه، الموارد البشرية) ويحسب النظام المتوسط الموزون تلقائياً
                            </p>
                        </div>
                        {canManageCommittee && (
                            <button
                                type="button"
                                onClick={() => setShowAddEvaluatorModal(true)}
                                className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-500/30 text-xs font-black flex items-center gap-1.5 transition-all"
                            >
                                <Plus size={14} /> إضافة مقيّم مشارك
                            </button>
                        )}
                    </div>

                    {evaluatorsList.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {evaluatorsList.map((ev) => {
                                const isSubmitted = ev.status === 'submitted';
                                const isMe = Number(ev.evaluator_user_id) === Number(auth.user?.id);
                                return (
                                    <div
                                        key={ev.id}
                                        className={`rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 ${
                                            isMe
                                                ? 'bg-primary-50/40 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/30'
                                                : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-sm font-black text-slate-800 dark:text-white truncate">{ev.user?.name || 'مقيّم'}</p>
                                                    {isMe && (
                                                        <span className="px-2 py-0.5 rounded-md bg-primary-600 text-white text-[9px] font-black">أنت</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    <span className="px-2 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                                                        {EVALUATOR_ROLE_LABELS[ev.role_type] || ev.role_type}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                                                        الوزن: {ev.weight}
                                                    </span>
                                                </div>
                                            </div>
                                            {canManageCommittee && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEvaluator(ev)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                                    title="إزالة المقيّم"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                                            {isSubmitted ? (
                                                <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle size={13} />
                                                    تم التقييم {ev.calculated_score != null ? `(${Math.round(ev.calculated_score)}%)` : ''}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                                    <Clock size={13} /> بانتظار التقييم
                                                </span>
                                            )}
                                        </div>
                                        {ev.comments && (
                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl line-clamp-2">
                                                {ev.comments}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 font-semibold text-center py-2">
                            لا يوجد مقيّمون مسجلون بعد — سيتم إضافة المدير المباشر أو يمكنك إضافة مقيّم مشارك من الزر أعلاه.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Column: Evaluation Criteria & IDP */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <BarChart size={18} className="text-primary-500" />
                                    معايير التقييم — {appraisal.template?.title}
                                </h3>
                                {appraisal.status === 'pending_self' && isEmployee && liveSelfPct !== null && (
                                    <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-black">
                                        النتيجة المباشرة: {liveSelfPct}%
                                    </span>
                                )}
                                {appraisal.status === 'pending_manager' && canEvaluate && liveManagerPct !== null && (
                                    <span className="px-3 py-1 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-black">
                                        نتيجتك المباشرة ({EVALUATOR_ROLE_LABELS[actingRole] || actingRole}): {liveManagerPct}%
                                    </span>
                                )}
                            </div>

                            <div className="p-5 md:p-6 space-y-5">
                                {appraisal.scores.map((score, index) => {
                                    const selfRatingVal = appraisal.status === 'pending_self' && isEmployee ? selfData.scores[index]?.self_score : score.self_score;
                                    const mgrRatingVal = score.manager_score;
                                    const selfMeta = getRatingMeta(selfRatingVal);
                                    const mgrMeta = getRatingMeta(mgrRatingVal);
                                    const allowedForMe = kpiAllowsRole(score.kpi, actingRole, auth?.user);
                                    const kpiRoles = Array.isArray(score.kpi?.evaluator_roles) && score.kpi.evaluator_roles.length > 0
                                        ? score.kpi.evaluator_roles
                                        : ['all'];
                                    const evaluatorEntries = Array.isArray(score.evaluator_scores) ? score.evaluator_scores : [];
                                    const comparisonTargetVal = canEvaluate && allowedForMe && managerData.scores[index]?.manager_score
                                        ? managerData.scores[index].manager_score
                                        : mgrRatingVal;
                                    const hasGap = appraisal.cycle?.requires_self_appraisal && Number(selfRatingVal) > 0 && Number(comparisonTargetVal) > 0;
                                    const gap = hasGap ? Number((Number(comparisonTargetVal) - Number(selfRatingVal)).toFixed(1)) : 0;

                                    return (
                                        <div
                                            key={score.id}
                                            className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 space-y-4 shadow-sm"
                                        >
                                            {/* Criterion Header */}
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="space-y-1 flex-1 min-w-[200px]">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 text-xs font-black flex items-center justify-center">
                                                            {index + 1}
                                                        </span>
                                                        <h4 className="font-black text-slate-800 dark:text-white text-sm md:text-base">{score.kpi?.name}</h4>
                                                        {score.kpi?.category && (
                                                            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                                                                {score.kpi.category}
                                                            </span>
                                                        )}
                                                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                                                            {kpiRoles.includes('all')
                                                                ? 'يقيّمه: جميع اللجنة'
                                                                : `يقيّمه: ${kpiRoles.map((r) => EVALUATOR_ROLE_LABELS[r] || r).join('، ')}`}
                                                        </span>
                                                    </div>
                                                    {score.kpi?.description && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-8">{score.kpi.description}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {hasGap && (
                                                        <span
                                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                                                                gap === 0
                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                                    : gap > 0
                                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                                                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                                                            }`}
                                                        >
                                                            {gap === 0 ? 'تقييم متطابق' : `فرق التقييم: ${gap > 0 ? `+${gap}` : gap}`}
                                                        </span>
                                                    )}
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                        الوزن: {score.kpi?.weight}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Self Evaluation Block */}
                                            {appraisal.cycle?.requires_self_appraisal && (
                                                <div className="bg-amber-50/40 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3.5 space-y-2.5">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-xs font-black text-amber-700 dark:text-amber-300">التقييم الذاتي للموظف</span>
                                                        {!(appraisal.status === 'pending_self' && isEmployee) && (
                                                            selfMeta ? (
                                                                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${selfMeta.badgeBg}`}>
                                                                    {selfMeta.value}/5 — {selfMeta.label}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">—</span>
                                                            )
                                                        )}
                                                    </div>

                                                    {appraisal.status === 'pending_self' && isEmployee ? (
                                                        <>
                                                            <RatingScaleButtons
                                                                value={selfData.scores[index]?.self_score}
                                                                onChange={(val) => updateScore('self', index, 'self_score', val)}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={selfData.scores[index]?.self_note || ''}
                                                                onChange={(e) => updateScore('self', index, 'self_note', e.target.value)}
                                                                placeholder="اكتب الشاهد أو مبرر تقييمك لهذا المعيار (اختياري)..."
                                                                className="w-full bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-amber-400 dark:text-white"
                                                            />
                                                        </>
                                                    ) : (
                                                        score.self_note && (
                                                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium bg-white/70 dark:bg-slate-900/40 px-3 py-2 rounded-lg">
                                                                <strong className="text-amber-700 dark:text-amber-400">شاهد الموظف:</strong> {score.self_note}
                                                            </p>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            {/* Manager & Committee Evaluation Block */}
                                            {(appraisal.status !== 'pending_self' || score.manager_score || evaluatorEntries.length > 0) && (
                                                <div className="bg-blue-50/40 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3.5 space-y-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-xs font-black text-blue-700 dark:text-blue-300">
                                                            تقييم المدير واللجنة (المتوسط الموزون المعتمد)
                                                        </span>
                                                        {mgrMeta && score.manager_score != null ? (
                                                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${mgrMeta.badgeBg}`}>
                                                                {Number(score.manager_score).toFixed(2).replace(/\.00$/, '')}/5 — {mgrMeta.label}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">بانتظار استكمال التقييم</span>
                                                        )}
                                                    </div>

                                                    {/* Breakdown of each evaluator's score & note on this criterion */}
                                                    {evaluatorEntries.length > 0 && (
                                                        <div className="space-y-1.5">
                                                            {evaluatorEntries.map((entry) => {
                                                                const entryMeta = getRatingMeta(entry.score);
                                                                const evUser = entry.evaluator?.user;
                                                                const evRole = entry.evaluator?.role_type;
                                                                return (
                                                                    <div
                                                                        key={entry.id}
                                                                        className="flex flex-wrap items-center justify-between gap-2 bg-white/80 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-blue-100/70 dark:border-slate-800 text-xs"
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <span className="font-bold text-slate-800 dark:text-slate-100">{evUser?.name || 'مقيّم'}</span>
                                                                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                                                                                {EVALUATOR_ROLE_LABELS[evRole] || evRole}
                                                                            </span>
                                                                            {entry.note && (
                                                                                <span className="text-slate-500 dark:text-slate-400 truncate">— {entry.note}</span>
                                                                            )}
                                                                        </div>
                                                                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black border ${entryMeta ? entryMeta.badgeBg : 'bg-slate-100'}`}>
                                                                            {entry.score}/5
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {canEvaluate ? (
                                                        allowedForMe ? (
                                                            <div className="pt-2 border-t border-blue-100 dark:border-blue-500/20 space-y-2.5">
                                                                <p className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                                                                    تقييمك لهذا المعيار ({EVALUATOR_ROLE_LABELS[actingRole] || actingRole}):
                                                                </p>
                                                                <RatingScaleButtons
                                                                    value={managerData.scores[index]?.manager_score}
                                                                    onChange={(val) => updateScore('manager', index, 'manager_score', val)}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={managerData.scores[index]?.manager_note || ''}
                                                                    onChange={(e) => updateScore('manager', index, 'manager_note', e.target.value)}
                                                                    placeholder="ملاحظتك وتوجيهك حول هذا المعيار (اختياري)..."
                                                                    className="w-full bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-blue-400 dark:text-white"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 px-3 py-2 rounded-lg">
                                                                هذا المعيار مخصص للتقييم من قِبل: {kpiRoles.map((r) => EVALUATOR_ROLE_LABELS[r] || r).join('، ')}
                                                            </p>
                                                        )
                                                    ) : (
                                                        evaluatorEntries.length === 0 &&
                                                        score.manager_note && (
                                                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium bg-white/70 dark:bg-slate-900/40 px-3 py-2 rounded-lg">
                                                                <strong className="text-blue-700 dark:text-blue-400">ملاحظة المدير:</strong> {score.manager_note}
                                                            </p>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            {/* SMART Goals */}
                                            <ScoreGoals appraisal={appraisal} score={score} isEmployee={isEmployee} isManager={isManager} isHR={isHR} />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Self Submit */}
                            {appraisal.cycle?.requires_self_appraisal && appraisal.status === 'pending_self' && isEmployee && (
                                <form onSubmit={handleSelfSubmit} className="p-6 border-t border-slate-100 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-500/5 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                            ملاحظات التقييم الذاتي العامة
                                        </label>
                                        <textarea
                                            value={selfData.self_comments}
                                            onChange={(e) => setSelfData('self_comments', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 outline-none transition-all dark:text-white font-semibold"
                                            rows="3"
                                            placeholder="أضف خلاصة إنجازاتك وملاحظاتك العامة هنا..."
                                        />
                                    </div>

                                    <SignaturePad onEnd={(sig) => setSelfData('employee_signature', sig)} />

                                    <button
                                        type="submit"
                                        disabled={selfProcessing}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                    >
                                        <Send size={16} /> تقديم التقييم الذاتي
                                    </button>
                                </form>
                            )}

                            {/* Self Comments Display */}
                            {appraisal.cycle?.requires_self_appraisal && appraisal.status !== 'pending_self' && appraisal.self_comments && (
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl p-4">
                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">ملاحظات التقييم الذاتي العامة</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold whitespace-pre-wrap">{appraisal.self_comments}</p>
                                    </div>
                                </div>
                            )}

                            {/* Manager / Evaluator Submit */}
                            {canEvaluate && (
                                <form onSubmit={handleManagerSubmit} className="p-6 border-t border-slate-100 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-500/5 space-y-5">
                                    {(isManager || isHR) && <DevelopmentPlanFields formData={managerData} setField={setManagerData} />}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                            ملاحظاتك العامة كمقيّم ({EVALUATOR_ROLE_LABELS[actingRole] || actingRole})
                                        </label>
                                        <textarea
                                            value={managerData.manager_comments}
                                            onChange={(e) => setManagerData('manager_comments', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all dark:text-white font-semibold"
                                            rows="3"
                                            placeholder="أضف ملاحظاتك وتوجيهاتك العامة للموظف..."
                                        />
                                    </div>

                                    <SignaturePad onEnd={(sig) => setManagerData('manager_signature', sig)} />

                                    {otherPendingEvaluators.length > 0 && (isManager || isHR) && (
                                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/70 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={managerData.force_advance_to_hr}
                                                onChange={(e) => setManagerData('force_advance_to_hr', e.target.checked)}
                                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span>
                                                تحويل التقييم مباشرة إلى الموارد البشرية دون انتظار بقية المقيّمين ({otherPendingEvaluators.length} مقيّم لم يسلّم بعد)
                                            </span>
                                        </label>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={managerProcessing}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                        >
                                            <Send size={16} /> اعتماد تقييمي
                                        </button>
                                        {canReturnToSelf && (
                                            <button
                                                type="button"
                                                onClick={() => setShowReturnModal(true)}
                                                className="px-5 py-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-2xl font-bold text-sm transition-all flex items-center gap-2"
                                            >
                                                <RotateCcw size={16} /> إرجاع للموظف للمراجعة
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}

                            {/* Manager Comments & IDP Display */}
                            {['pending_hr', 'completed'].includes(appraisal.status) && (
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                    {appraisal.manager_comments && (
                                        <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-2xl p-4">
                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">ملاحظات المدير المباشر</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold whitespace-pre-wrap">{appraisal.manager_comments}</p>
                                            {appraisal.manager_score != null && (
                                                <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-500/10">
                                                    <span className="text-xs font-bold text-blue-500">نتيجة تقييم المدير:</span>
                                                    <span className="mr-2 text-lg font-black text-blue-700 dark:text-blue-300">{appraisal.manager_score.toFixed(0)}%</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {(appraisal.status === 'completed' || !isHR) &&
                                        (appraisal.strengths || appraisal.improvement_areas || appraisal.recommended_training || appraisal.final_recommendation) && (
                                            <div className="bg-indigo-50/40 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-5 space-y-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                                                        <GraduationCap size={15} /> مخرجات التقييم وخطة التطوير الفردية
                                                    </h4>
                                                    {appraisal.final_recommendation && (
                                                        <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black">
                                                            التوصية: {appraisal.final_recommendation}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                    {appraisal.strengths && (
                                                        <div className="bg-white/80 dark:bg-slate-900/50 p-3 rounded-xl">
                                                            <p className="font-black text-emerald-600 dark:text-emerald-400 mb-1">نقاط القوة</p>
                                                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{appraisal.strengths}</p>
                                                        </div>
                                                    )}
                                                    {appraisal.improvement_areas && (
                                                        <div className="bg-white/80 dark:bg-slate-900/50 p-3 rounded-xl">
                                                            <p className="font-black text-amber-600 dark:text-amber-400 mb-1">مجالات التحسين</p>
                                                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{appraisal.improvement_areas}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                {appraisal.recommended_training && (
                                                    <div className="bg-white/80 dark:bg-slate-900/50 p-3 rounded-xl text-xs">
                                                        <p className="font-black text-indigo-600 dark:text-indigo-400 mb-1">البرامج التدريبية الموصى بها</p>
                                                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{appraisal.recommended_training}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                </div>
                            )}

                            {/* HR Approval */}
                            {appraisal.status === 'pending_hr' && isHR && (
                                <form onSubmit={handleHrSubmit} className="p-6 border-t border-slate-100 dark:border-slate-800 bg-purple-50/30 dark:bg-purple-500/5 space-y-5">
                                    <DevelopmentPlanFields formData={hrData} setField={setHrData} />

                                    <div>
                                        <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
                                            ملاحظات الموارد البشرية (الاعتماد النهائي)
                                        </label>
                                        <textarea
                                            value={hrData.hr_comments}
                                            onChange={(e) => setHrData('hr_comments', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/20 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all dark:text-white font-semibold"
                                            rows="2"
                                            placeholder="أضف ملاحظات الموارد البشرية..."
                                        />
                                    </div>

                                    <SignaturePad onEnd={(sig) => setHrData('hr_signature', sig)} />

                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={hrProcessing}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                        >
                                            <ShieldCheck size={16} /> اعتماد التقييم النهائي
                                        </button>
                                        {canReturnToManager && (
                                            <button
                                                type="button"
                                                onClick={() => setShowReturnModal(true)}
                                                className="px-5 py-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-2xl font-bold text-sm transition-all flex items-center gap-2"
                                            >
                                                <RotateCcw size={16} /> إرجاع للمدير للمراجعة
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}

                            {/* HR Comments Display */}
                            {appraisal.status === 'completed' && appraisal.hr_comments && (
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10 rounded-2xl p-4">
                                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">ملاحظات الموارد البشرية</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold whitespace-pre-wrap">{appraisal.hr_comments}</p>
                                    </div>
                                </div>
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

                    {/* Sidebar: Smart 360 Performance Snapshot */}
                    <div className="space-y-6">
                        {/* Suggested Score Card */}
                        {suggestedMetrics && (
                            <div className="bg-gradient-to-br from-indigo-600 via-primary-600 to-primary-700 text-white rounded-3xl p-5 shadow-md space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-bold text-white/80 flex items-center gap-1.5">
                                            <Sparkles size={14} /> المؤشر الاسترشادي الذكي (360°)
                                        </p>
                                        <h3 className="text-3xl font-black mt-1">{suggestedMetrics.score_pct}%</h3>
                                        <p className="text-xs font-bold text-white/80">يعادل تقريباً {suggestedMetrics.score_5} من 5</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                                        <ThumbsUp size={22} />
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-white/15 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/80">الانضباط والدوام</span>
                                        <span className="font-black">{suggestedMetrics.attendance_component}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/80">السلوك والإنجاز</span>
                                        <span className="font-black">{suggestedMetrics.behavior_component}%</span>
                                    </div>
                                    {suggestedMetrics.academic_component !== null && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-white/80">الأداء الأكاديمي والتوجيهي</span>
                                            <span className="font-black">{suggestedMetrics.academic_component}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

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
                                {/* Academic & Supervision Section (if teacher/academic data exists) */}
                                {academicData.has_academic_data && (
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                                <BookOpen size={14} className="text-indigo-500" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">الأداء الأكاديمي والتوجيهي</h4>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div className="bg-slate-50/80 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    <BookOpen size={11} className="text-primary-500" /> دفاتر التحضير
                                                </p>
                                                <p className="text-sm font-black text-slate-800 dark:text-white mt-1">
                                                    {academicData.preparations_published} منشور{' '}
                                                    <span className="text-[10px] font-semibold text-slate-400">/ {academicData.preparations_total}</span>
                                                </p>
                                                {academicData.preparations_avg_rating != null && (
                                                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                                        تقييم الموجه: {academicData.preparations_avg_rating} / 5
                                                    </p>
                                                )}
                                            </div>

                                            <div className="bg-slate-50/80 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    <Eye size={11} className="text-indigo-500" /> الزيارات الصفية
                                                </p>
                                                <p className="text-sm font-black text-slate-800 dark:text-white mt-1">
                                                    {academicData.visits_total} زيارة
                                                </p>
                                                {academicData.visits_avg_score != null && (
                                                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                        متوسط الدرجة: {academicData.visits_avg_score}%
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs bg-slate-50/80 dark:bg-slate-900/50 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                                <Map size={13} className="text-teal-500" /> الخطط الدراسية المعتمدة
                                            </span>
                                            <span className="font-black text-teal-600 dark:text-teal-400">
                                                {academicData.study_plans_approved} / {academicData.study_plans_total}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Attendance */}
                                <div className="p-5">
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                                                <Clock size={14} className="text-primary-500" />
                                            </div>
                                            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">الالتزام بالدوام</h4>
                                        </div>
                                        <span className="text-xs font-black text-primary-600 dark:text-primary-400">{attendanceSummary.attendance_rate}%</span>
                                    </div>
                                    <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl p-4">
                                        {integrationData.attendances.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="text-center p-2.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{attendanceSummary.present_days}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">حضور</p>
                                                </div>
                                                <div className="text-center p-2.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                    <p className="text-xl font-black text-rose-600 dark:text-rose-400">{attendanceSummary.absent_days}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">غياب</p>
                                                </div>
                                                <div className="text-center p-2.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                    <p className="text-xl font-black text-amber-600 dark:text-amber-400">{attendanceSummary.late_days}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">تأخير</p>
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
                                        <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                                            <AlertTriangle size={14} className="text-rose-500" />
                                        </div>
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">المخالفات</h4>
                                        {integrationData.violations.length > 0 && (
                                            <span className="mr-auto inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                                                {integrationData.violations.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl p-4">
                                        {integrationData.violations.length > 0 ? (
                                            <div className="space-y-2">
                                                {integrationData.violations.map((v) => (
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
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                            <Award size={14} className="text-emerald-500" />
                                        </div>
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">الإنجازات</h4>
                                        {integrationData.achievements.length > 0 && (
                                            <span className="mr-auto inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                                {integrationData.achievements.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl p-4">
                                        {integrationData.achievements.length > 0 ? (
                                            <div className="space-y-2">
                                                {integrationData.achievements.map((a) => (
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
                {(appraisal.employee_signature ||
                    appraisal.manager_signature ||
                    appraisal.hr_signature ||
                    evaluatorsList.some((ev) => ev.signature)) && (
                    <div className="mt-8 bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <ShieldCheck size={18} className="text-primary-500" />
                                التواقيع والاعتمادات
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {appraisal.cycle?.requires_self_appraisal && (
                                    <SignatureDisplay
                                        signature={appraisal.employee_signature}
                                        title="إقرار الموظف"
                                        name={appraisal.employee?.user?.name}
                                        role="الموظف المقيَّم"
                                    />
                                )}
                                {evaluatorsList.some((ev) => ev.signature) ? (
                                    evaluatorsList
                                        .filter((ev) => ev.signature)
                                        .map((ev) => (
                                            <SignatureDisplay
                                                key={ev.id}
                                                signature={ev.signature}
                                                title={`توقيع ${EVALUATOR_ROLE_LABELS[ev.role_type] || ev.role_type}`}
                                                name={ev.user?.name}
                                                role={`الوزن: ${ev.weight}`}
                                            />
                                        ))
                                ) : (
                                    <SignatureDisplay
                                        signature={appraisal.manager_signature}
                                        title="اعتماد المدير المباشر"
                                        name={appraisal.manager?.user?.name}
                                        role="المدير المباشر"
                                    />
                                )}
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

            {/* Add Participant Evaluator Modal */}
            {showAddEvaluatorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddEvaluatorModal(false)} />
                    <div className="relative bg-white dark:bg-[#121820] rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <Users size={18} className="text-indigo-500" />
                                إضافة مقيّم مشارك للجنة التقييم
                            </h3>
                            <button
                                onClick={() => setShowAddEvaluatorModal(false)}
                                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleAddEvaluator} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                    المقيّم <span className="text-rose-500">*</span>
                                </label>
                                <SelectInput
                                    options={availableEvaluators.map((u) => ({
                                        value: u.id,
                                        label: `${u.name}${u.role_name ? ` (${u.role_name})` : ''}`,
                                    }))}
                                    value={evaluatorForm.data.evaluator_user_id}
                                    onChange={(v) => evaluatorForm.setData('evaluator_user_id', v || '')}
                                    placeholder="اختر الموجه أو المدير أو عضو اللجنة..."
                                    required
                                />
                                {evaluatorForm.errors.evaluator_user_id && (
                                    <p className="text-xs font-bold text-rose-500 mt-1">{evaluatorForm.errors.evaluator_user_id}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                        الصفة في التقييم <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={evaluatorForm.data.role_type}
                                        onChange={(e) => evaluatorForm.setData('role_type', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:border-indigo-400 dark:text-white"
                                    >
                                        {EVALUATOR_ROLE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    {evaluatorForm.errors.role_type && (
                                        <p className="text-xs font-bold text-rose-500 mt-1">{evaluatorForm.errors.role_type}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                        الوزن النسبي (1 - 100) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        required
                                        value={evaluatorForm.data.weight}
                                        onChange={(e) => evaluatorForm.setData('weight', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:border-indigo-400 dark:text-white"
                                    />
                                    {evaluatorForm.errors.weight && (
                                        <p className="text-xs font-bold text-rose-500 mt-1">{evaluatorForm.errors.weight}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddEvaluatorModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={evaluatorForm.processing}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black disabled:opacity-50"
                                >
                                    حفظ وإضافة
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Return Appraisal Modal */}
            {showReturnModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowReturnModal(false)} />
                    <div className="relative bg-white dark:bg-[#121820] rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <RotateCcw size={18} className="text-amber-500" />
                                إرجاع التقييم للمراجعة
                            </h3>
                            <button onClick={() => setShowReturnModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleReturnSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                    سبب الإرجاع والتعديلات المطلوبة <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={returnForm.data.return_reason}
                                    onChange={(e) => returnForm.setData('return_reason', e.target.value)}
                                    placeholder="اكتب السبب بوضوح ليظهر للموظف أو المدير..."
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-amber-400 dark:text-white"
                                />
                                {returnForm.errors.return_reason && (
                                    <p className="text-xs font-bold text-rose-500 mt-1">{returnForm.errors.return_reason}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReturnModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={returnForm.processing}
                                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black disabled:opacity-50"
                                >
                                    تأكيد الإرجاع
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
