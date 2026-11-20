import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Building, ShieldCheck, X, Check, Loader2 } from 'lucide-react';

export default function BulkAssignModal({
    isOpen,
    selectedIds = [],
    departments = [],
    jobGrades = [],
    onClose,
    onSuccess,
}) {
    const [departmentId, setDepartmentId] = useState('');
    const [jobGradeId, setJobGradeId] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDepartmentId('');
            setJobGradeId('');
            setProcessing(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !processing) onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, processing, onClose]);

    if (!isOpen || selectedIds.length === 0) return null;

    const canSubmit = !processing && (departmentId !== '' || jobGradeId !== '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        router.post(
            route('hr.employees.bulk-assign'),
            {
                employee_ids: selectedIds,
                department_id: departmentId || null,
                job_grade_id: jobGradeId || null,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onSuccess: () => {
                    onSuccess?.();
                    onClose();
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-fade-in"
                onClick={() => !processing && onClose()}
            />

            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-scale-in">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                            <Building size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white">
                                نقل القسم / الدرجة الوظيفية
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                سيتم التحديث على {selectedIds.length} موظف محدد
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={processing}
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-200 mb-2">
                            <Building size={14} className="text-primary-500" />
                            القسم الإداري (اختياري)
                        </label>
                        <select
                            value={departmentId}
                            onChange={(e) => setDepartmentId(e.target.value)}
                            className="w-full rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-bold px-3.5 py-2.5"
                        >
                            <option value="">— عدم تغيير القسم —</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-200 mb-2">
                            <ShieldCheck size={14} className="text-primary-500" />
                            الدرجة الوظيفية (اختياري)
                        </label>
                        <select
                            value={jobGradeId}
                            onChange={(e) => setJobGradeId(e.target.value)}
                            className="w-full rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-bold px-3.5 py-2.5"
                        >
                            <option value="">— عدم تغيير الدرجة —</option>
                            {jobGrades.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-primary-600 hover:bg-primary-700 text-white shadow-md disabled:opacity-50"
                        >
                            {processing ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                            {processing ? 'جاري التحديث...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
