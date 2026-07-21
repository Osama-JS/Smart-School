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

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <SettingsIcon className="w-6 h-6 text-primary" />
                            توزيع الدرجات للمواد
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            ضبط الأعمدة ومعايير التقييم والدرجة القصوى لكل مادة
                        </p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {processing ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {subjects.map(subject => {
                        const setting = localSettings[subject.id];
                        const totalScore = setting.criteria_weights.reduce((sum, c) => sum + (parseFloat(c.max_score) || 0), 0);

                        return (
                            <div key={subject.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    {subject.name}
                                </h3>
                                
                                <div className="space-y-3">
                                    {setting.criteria_weights.map((criterion, index) => (
                                        <div key={index} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                            <input
                                                type="text"
                                                placeholder="اسم المعيار (مثال: المشاركة)"
                                                value={criterion.name}
                                                onChange={(e) => handleCriterionChange(subject.id, index, 'name', e.target.value)}
                                                className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                                            />
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    placeholder="الدرجة"
                                                    value={criterion.max_score}
                                                    onChange={(e) => handleCriterionChange(subject.id, index, 'max_score', e.target.value)}
                                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm text-center"
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveCriterion(subject.id, index)}
                                                className="text-red-500 hover:text-red-600 p-2"
                                                title="حذف المعيار"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => handleAddCriterion(subject.id)}
                                        className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> إضافة معيار جديد
                                    </button>
                                    <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        الإجمالي: <span className="text-primary">{totalScore}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AdminLayout>
    );
}
