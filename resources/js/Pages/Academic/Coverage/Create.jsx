import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import {
    ShieldCheck, ChevronLeft, BookOpen, AlertCircle,
    CheckCircle2, Search, Info, Loader2, MapPin, Clock, User, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

const COVERAGE_TYPES = [
    { value: 'substitution', label: 'نيابة عن (تدريس بديل)' },
    { value: 'free',         label: 'حصة حرة' },
    { value: 'merged',       label: 'دمج فصلين معاً' },
];

export default function CoverageCreate({ teachers, subjects, activeSemester, allSemesters }) {
    const [coverageDate, setCoverageDate]       = useState('');
    const [absentTeacherId, setAbsentTeacherId] = useState('');
    const [semesterId, setSemesterId]           = useState(activeSemester?.id || '');
    const [slots, setSlots]                     = useState([]);
    const [fetchError, setFetchError]           = useState('');
    const [loading, setLoading]                 = useState(false);
    const [fetched, setFetched]                 = useState(false);
    const [coverages, setCoverages]             = useState({});
    const [busyTeachers, setBusyTeachers]       = useState({});
    const [submitting, setSubmitting]           = useState(false);

    const fetchPeriods = async () => {
        if (!coverageDate || !absentTeacherId || !semesterId) return;
        setLoading(true);
        setFetchError('');
        setSlots([]);
        setFetched(false);
        setCoverages({});
        setBusyTeachers({});
        try {
            const res = await axios.get(route('academic.coverage.teacher-periods'), {
                params: { teacher_id: absentTeacherId, date: coverageDate, semester_id: semesterId }
            });
            setSlots(res.data.slots || []);
            setBusyTeachers(res.data.busyTeachers || {});
            setFetched(true);
            if (!(res.data.slots || []).length) {
                const dayName = new Date(coverageDate).toLocaleDateString('ar-EG', { weekday: 'long' });
                setFetchError(`لا توجد حصص مجدولة لهذا المعلم يوم ${dayName}.`);
            }
        } catch {
            setFetchError('حدث خطأ أثناء جلب الحصص. تأكد من صحة البيانات.');
        } finally {
            setLoading(false);
        }
    };

    const updateCoverage = (periodId, field, value) => {
        setCoverages(prev => ({
            ...prev,
            [periodId]: { ...(prev[periodId] || {}), [field]: value }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const coveragesArray = slots.map(slot => ({
            period_id:             slot.period_id,
            division_id:           slot.division_id,
            substitute_teacher_id: coverages[slot.period_id]?.substitute_teacher_id || null,
            subject_id:            coverages[slot.period_id]?.subject_id || null,
            coverage_type:         coverages[slot.period_id]?.coverage_type || 'substitution',
            notes:                 coverages[slot.period_id]?.notes || null,
        }));

        const assignedCount = coveragesArray.filter(c => c.substitute_teacher_id).length;
        if (assignedCount === 0) {
            const isDark = document.documentElement.classList.contains('dark');
            Swal.fire({
                title: 'لم يتم تحديد أي معلم بديل',
                text: 'يجب تحديد معلم بديل لحصة واحدة على الأقل.',
                icon: 'warning',
                confirmButtonColor: 'var(--color-primary-600, #0284c7)',
                background: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#f8fafc' : '#1e293b',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl px-6 py-2.5 font-bold' }
            });
            return;
        }

        setSubmitting(true);
        router.post(route('academic.coverage.store'), {
            coverage_date:     coverageDate,
            absent_teacher_id: absentTeacherId,
            semester_id:       semesterId,
            coverages:         coveragesArray,
        }, { onFinish: () => setSubmitting(false) });
    };

    const absentTeacher = teachers.find(t => t.id == absentTeacherId);
    const assignedCount  = slots.filter(s => coverages[s.period_id]?.substitute_teacher_id).length;
    // Button requires date + teacher + semester (semester auto-filled if active one exists)
    const canFetch       = !!(coverageDate && absentTeacherId && semesterId);

    // Build readable list of missing fields for user feedback
    const missingFields = [];
    if (!coverageDate)      missingFields.push('تاريخ الغياب');
    if (!absentTeacherId)   missingFields.push('المعلم الغائب');
    if (!semesterId)        missingFields.push('الفصل الدراسي');

    return (
        <AdminLayout activeMenu="التغطية والاحتياط">
            <Head title="تسجيل تغطية جديدة" />

            <div className="max-w-7xl mx-auto space-y-6 pb-12">

                {/* ── Header ── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="600" cy="150" r="5" className="fill-primary-400" />
                        </svg>
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                        <Link
                            href={route('academic.coverage.index')}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
                            <ShieldCheck size={26} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">تسجيل تغطية جديدة</h1>
                            <p className="text-sm font-semibold text-primary-700/80 dark:text-primary-300/80">حدد المعلم الغائب والتاريخ ثم عيّن البدلاء لكل حصة</p>
                        </div>
                    </div>
                </div>

                {/* ── Step 1: Absence Info ── */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 font-black text-sm shrink-0">1</span>
                        <h2 className="text-base font-black text-slate-800 dark:text-white">تحديد بيانات الغياب</h2>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Inputs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                            <div>
                                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                    تاريخ الغياب <span className="text-rose-500">*</span>
                                </label>
                                <FlatpickrInput
                                    type="date"
                                    value={coverageDate}
                                    onChange={val => { setCoverageDate(val); setFetched(false); setSlots([]); setFetchError(''); }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                    المعلم الغائب <span className="text-rose-500">*</span>
                                </label>
                                <SelectInput
                                    options={[{ value: '', label: 'اختر المعلم الغائب...' }, ...teachers.map(t => ({ value: t.id, label: t.name }))]}
                                    value={absentTeacherId}
                                    onChange={val => { setAbsentTeacherId(val); setFetched(false); setSlots([]); setFetchError(''); }}
                                    isSearchable={true}
                                />
                            </div>
                            <div>
                                {activeSemester ? (
                                    <>
                                        <label className="hidden md:block text-xs font-black text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide opacity-0">
                                            الفصل الدراسي
                                        </label>
                                        <div className="flex items-center gap-2.5 px-4 h-[42px] rounded-2xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20">
                                            <Info size={16} className="text-primary-600 dark:text-primary-400 shrink-0" />
                                            <p className="text-sm font-bold text-primary-700 dark:text-primary-300 truncate">
                                                الفصل النشط: {activeSemester.name}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                            الفصل الدراسي <span className="text-rose-500">*</span>
                                        </label>
                                        <SelectInput
                                            options={[
                                                { value: '', label: 'اختر الفصل الدراسي...' },
                                                ...(allSemesters || []).map(s => ({ value: s.id, label: s.label }))
                                            ]}
                                            value={semesterId}
                                            onChange={val => { setSemesterId(val); setFetched(false); setSlots([]); setFetchError(''); }}
                                        />
                                        <p className="mt-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                            لا يوجد فصل دراسي نشط — يرجى الاختيار يدوياً.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions & Hints Row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                            <div className="flex-1 pt-2 md:pt-0">
                                {missingFields.length > 0 && !loading ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">لاكتمال الجلب يلزم تحديد:</span>
                                        {missingFields.map(f => (
                                            <span key={f} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                                                <AlertCircle size={12} /> {f}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <span className="text-xs font-bold">البيانات مكتملة، يمكنك جلب الحصص الآن</span>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={fetchPeriods}
                                disabled={!canFetch || loading}
                                className="w-full md:w-auto min-w-[260px] flex items-center justify-center gap-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 h-[46px] rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary-500/20 active:scale-[0.98]"
                            >
                                {loading
                                    ? <><Loader2 size={18} className="animate-spin" /> جاري جلب الحصص...</>
                                    : <><Search size={18} /> جلب الحصص المجدولة</>
                                }
                            </button>
                        </div>

                        {/* Error Notification */}
                        {fetchError && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 mt-4">
                                <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{fetchError}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Step 2: Assign Substitutes ── */}
                {fetched && slots.length > 0 && (
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            {/* Card header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 font-black text-sm shrink-0">2</span>
                                    <h2 className="text-base font-black text-slate-800 dark:text-white">تعيين المعلمين البدلاء</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    {assignedCount > 0 && (
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
                                            <CheckCircle2 size={13} /> {assignedCount} من {slots.length} حصص مغطاة
                                        </span>
                                    )}
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        غياب: <strong className="text-primary-600 dark:text-primary-400">{absentTeacher?.name}</strong>
                                    </span>
                                </div>
                            </div>

                            {/* Slots */}
                            <div className="p-6 space-y-4">
                                {slots.map((slot, idx) => {
                                    const cov     = coverages[slot.period_id] || {};
                                    const covered = !!cov.substitute_teacher_id;
                                    return (
                                        <div
                                            key={slot.id}
                                            className={`rounded-2xl border overflow-hidden transition-all ${
                                                covered
                                                    ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/5'
                                                    : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            {/* Slot info bar */}
                                            <div className={`flex flex-wrap items-center gap-3 px-5 py-3.5 ${
                                                covered
                                                    ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20'
                                                    : 'bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700/50'
                                            }`}>
                                                {/* Index badge */}
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                                    covered
                                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                                        : 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                                                }`}>
                                                    {idx + 1}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 flex-1">
                                                    <span className="font-bold text-slate-800 dark:text-white">{slot.period?.period_name}</span>
                                                    <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono" dir="ltr">
                                                        <Clock size={11} />
                                                        {slot.period?.start_time?.substring(0,5)} — {slot.period?.end_time?.substring(0,5)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                        <MapPin size={11} />
                                                        {slot.division?.grade?.section?.name} / {slot.division?.grade?.name} / {slot.division?.name}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-500/10 px-2.5 py-1 rounded-lg border border-primary-100 dark:border-primary-500/20">
                                                        <BookOpen size={11} />
                                                        {slot.subject?.name}
                                                    </span>
                                                </div>

                                                {covered && (
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1.5 rounded-xl shrink-0">
                                                        <CheckCircle2 size={13} /> مغطاة
                                                    </span>
                                                )}
                                            </div>

                                            {/* Substitute inputs */}
                                            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                                        المعلم البديل
                                                    </label>
                                                    <SelectInput
                                                        options={[
                                                            { value: '', label: '— بدون تغطية —' },
                                                            ...teachers.filter(t => t.id != absentTeacherId).map(t => {
                                                                const isBusy = (busyTeachers[slot.period_id] || []).includes(t.id);
                                                                const allowBusy = cov.coverage_type === 'merged';
                                                                return {
                                                                    value: t.id,
                                                                    label: isBusy ? `${t.name} (مشغول)` : t.name,
                                                                    isDisabled: isBusy && !allowBusy
                                                                };
                                                            })
                                                        ]}
                                                        value={cov.substitute_teacher_id || ''}
                                                        onChange={val => updateCoverage(slot.period_id, 'substitute_teacher_id', val)}
                                                        isSearchable={true}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                                        المادة البديلة
                                                    </label>
                                                    <SelectInput
                                                        options={[{ value: '', label: 'نفس المادة' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]}
                                                        value={cov.subject_id || ''}
                                                        onChange={val => updateCoverage(slot.period_id, 'subject_id', val)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                                        نوع التغطية
                                                    </label>
                                                    <SelectInput
                                                        options={COVERAGE_TYPES}
                                                        value={cov.coverage_type || 'substitution'}
                                                        onChange={val => updateCoverage(slot.period_id, 'coverage_type', val)}
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                                        ملاحظات (اختياري)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={cov.notes || ''}
                                                        onChange={e => updateCoverage(slot.period_id, 'notes', e.target.value)}
                                                        placeholder="أي تفاصيل أو توجيهات إضافية..."
                                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Notification notice */}
                            <div className="mx-6 mb-5 flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                                <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300">ملاحظة — الإشعارات</p>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5 leading-relaxed">
                                        سيتم تفعيل إشعار المعلم البديل تلقائياً عبر Firebase/البريد الإلكتروني عند اكتمال بناء خدمة الإشعارات.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between gap-3 px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                                <Link
                                    href={route('academic.coverage.index')}
                                    className="px-6 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-sm"
                                >
                                    إلغاء
                                </Link>
                                <button
                                    type="submit"
                                    disabled={submitting || assignedCount === 0}
                                    className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-[0.98]"
                                >
                                    {submitting
                                        ? <><Loader2 size={18} className="animate-spin" /> جاري الحفظ...</>
                                        : <><ShieldCheck size={18} /> تسجيل {assignedCount > 0 ? `(${assignedCount}) ` : ''}تغطية وحفظها</>
                                    }
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </AdminLayout>
    );
}
