import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { Settings as SettingsIcon, Plus, Trash2, Save } from 'lucide-react';

export default function GradeSettings({ subjects, settings: initialSettings, isAdmin }) {
    const [localSettings, setLocalSettings] = useState(() => {
        const init = {};
        subjects.forEach(subject => {
            const subjectSetting = initialSettings[subject.id];
            init[subject.id] = {
                subject_id: subject.id,
                criteria_weights: subjectSetting?.criteria_weights || [
                    { name: 'المشاركة', max_score: 10 },
                    { name: 'الواجبات', max_score: 10 },
                    { name: 'الاختبار التحريري', max_score: 20 },
                    { name: 'السلوك والحضور', max_score: 10 }
                ] // Default template if empty
            };
        });
        return init;
    });

    const { data, setData, post, processing, errors } = useForm({
        settings: Object.values(localSettings)
    });

    // Sync form data whenever localSettings changes
    React.useEffect(() => {
        setData('settings', Object.values(localSettings));
    }, [localSettings]);

    const handleAddCriterion = (subjectId) => {
        setLocalSettings(prev => {
            const subjectData = prev[subjectId];
            return {
                ...prev,
                [subjectId]: {
                    ...subjectData,
                    criteria_weights: [...subjectData.criteria_weights, { name: '', max_score: 0 }]
                }
            };
        });
    };

    const handleRemoveCriterion = (subjectId, index) => {
        setLocalSettings(prev => {
            const subjectData = prev[subjectId];
            const newCriteria = [...subjectData.criteria_weights];
            newCriteria.splice(index, 1);
            return {
                ...prev,
                [subjectId]: {
                    ...subjectData,
                    criteria_weights: newCriteria
                }
            };
        });
    };

    const handleCriterionChange = (subjectId, index, field, value) => {
        setLocalSettings(prev => {
            const subjectData = prev[subjectId];
            const newCriteria = [...subjectData.criteria_weights];
            newCriteria[index] = {
                ...newCriteria[index],
                [field]: field === 'max_score' ? parseFloat(value) || 0 : value
            };
            return {
                ...prev,
                [subjectId]: {
                    ...subjectData,
                    criteria_weights: newCriteria
                }
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('academic.subject-grade-settings.store'));
    };

    return (
        <AdminLayout activeMenu="توزيع الدرجات">
            <Head title="توزيع درجات المواد" />

            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Premium Header */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 dark:bg-primary-400/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center shadow-inner">
                                <SettingsIcon size={24} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            توزيع الدرجات للمواد
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold text-sm md:text-base">
                            ضبط الأعمدة ومعايير التقييم والدرجة القصوى لكل مادة لتُستخدم في سجل الدرجات.
                        </p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="relative z-10 bg-gradient-to-l from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary-500/30 font-black text-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        <Save size={20} />
                        {processing ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {subjects.map(subject => {
                        const setting = localSettings[subject.id];
                        const totalScore = setting.criteria_weights.reduce((sum, c) => sum + (parseFloat(c.max_score) || 0), 0);

                        return (
                            <div key={subject.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 transition-all hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800/50 flex flex-col group">
                                <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        {subject.name}
                                    </h3>
                                    <div className="bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm">
                                        المجموع: <span className="text-primary-600 dark:text-primary-400">{totalScore}</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 flex-1">
                                    {setting.criteria_weights.map((criterion, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-primary-200 dark:hover:border-primary-800/30 transition-all focus-within:ring-2 focus-within:ring-primary-500/20">
                                            <input
                                                type="text"
                                                placeholder="مثال: المشاركة"
                                                value={criterion.name}
                                                onChange={(e) => handleCriterionChange(subject.id, index, 'name', e.target.value)}
                                                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 font-bold placeholder-slate-400 text-sm p-2"
                                            />
                                            <div className="w-20 shrink-0">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    placeholder="الدرجة"
                                                    value={criterion.max_score}
                                                    onChange={(e) => handleCriterionChange(subject.id, index, 'max_score', e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-0 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-black text-center p-2 shadow-sm"
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveCriterion(subject.id, index)}
                                                className="text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/30 dark:hover:border-red-800/50 w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-sm"
                                                title="حذف المعيار"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                
                                <button 
                                    type="button"
                                    onClick={() => handleAddCriterion(subject.id)}
                                    className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:border-primary-600 dark:hover:bg-primary-900/20 font-bold transition-all text-sm"
                                >
                                    <Plus size={18} />
                                    إضافة عمود تقييم
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AdminLayout>
    );
}
