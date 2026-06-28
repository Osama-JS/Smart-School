import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { Send, ArrowRight, Plus, Trash2, Database } from 'lucide-react';

export default function SubmitReport({ auth, template }) {
    // Dynamically generate initial state for the form
    const initialData = {};
    template.fields.forEach(field => {
        if (field.type === 'activities_matrix') {
            initialData[`field_${field.id}`] = [{ time: '', date: '', type: '', notes: '' }];
        } else if (field.type === 'data_source') {
            initialData[`field_${field.id}`] = field.prefilled_data || [];
        } else {
            initialData[`field_${field.id}`] = field.type === 'checkbox' ? false : '';
        }
    });

    const { data, setData, post, processing, errors } = useForm(initialData);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('reports.store', template.id));
    };

    const handleFileChange = (e, fieldId) => {
        setData(`field_${fieldId}`, e.target.files[0]);
    };

    const renderField = (field) => {
        const key = `field_${field.id}`;
        const error = errors[key];

        let inputElement = null;

        switch (field.type) {
            case 'text':
                inputElement = (
                    <textarea 
                        value={data[key]}
                        onChange={e => setData(key, e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        rows="3"
                        required={field.is_required}
                    ></textarea>
                );
                break;
            case 'number':
                inputElement = (
                    <input 
                        type="number"
                        value={data[key]}
                        onChange={e => setData(key, e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        required={field.is_required}
                    />
                );
                break;
            case 'select':
                inputElement = (
                    <SelectInput 
                        value={data[key]}
                        onChange={val => setData(key, val)}
                        options={field.options ? field.options.map(opt => ({ value: opt, label: opt })) : []}
                        required={field.is_required}
                    />
                );
                break;
            case 'checkbox':
                inputElement = (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                        <input 
                            type="checkbox"
                            id={key}
                            checked={data[key]}
                            onChange={e => setData(key, e.target.checked)}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-5 h-5 cursor-pointer"
                        />
                        <label htmlFor={key} className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            نعم / أوافق
                        </label>
                    </div>
                );
                break;
            case 'image':
                inputElement = (
                    <input 
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileChange(e, field.id)}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400"
                        required={field.is_required}
                    />
                );
                break;
            case 'tasks_matrix':
                inputElement = (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 w-1/3">الأعمال</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 text-center w-24">نفذ</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 text-center w-24">لم ينفذ</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300">سبب عدم التنفيذ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
                                {(field.options || []).map((taskLabel, idx) => {
                                    const taskData = (data[key] && data[key][taskLabel]) || { status: '', reason: '' };
                                    return (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                                                {taskLabel}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input 
                                                    type="radio"
                                                    name={`${key}_${idx}_status`}
                                                    checked={taskData.status === 'executed'}
                                                    onChange={() => {
                                                        const newMatrixData = { ...(data[key] || {}) };
                                                        newMatrixData[taskLabel] = { ...taskData, status: 'executed', reason: '' };
                                                        setData(key, newMatrixData);
                                                    }}
                                                    className="w-5 h-5 border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input 
                                                    type="radio"
                                                    name={`${key}_${idx}_status`}
                                                    checked={taskData.status === 'not_executed'}
                                                    onChange={() => {
                                                        const newMatrixData = { ...(data[key] || {}) };
                                                        newMatrixData[taskLabel] = { ...taskData, status: 'not_executed' };
                                                        setData(key, newMatrixData);
                                                    }}
                                                    className="w-5 h-5 border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="text"
                                                    value={taskData.reason || ''}
                                                    onChange={(e) => {
                                                        const newMatrixData = { ...(data[key] || {}) };
                                                        newMatrixData[taskLabel] = { ...taskData, reason: e.target.value };
                                                        setData(key, newMatrixData);
                                                    }}
                                                    className={`w-full bg-transparent border-0 border-b ${taskData.status === 'executed' ? 'border-transparent opacity-50' : 'border-slate-200 dark:border-slate-700 focus:border-primary-500'} focus:ring-0 px-0 py-2 text-sm dark:text-white transition-all`}
                                                    placeholder={taskData.status === 'executed' ? "تم التنفيذ" : "اكتب السبب هنا..."}
                                                    disabled={taskData.status === 'executed'}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!field.options || field.options.length === 0) && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-4 text-center text-slate-400">لم يتم تحديد أعمال</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
                break;
            case 'activities_matrix':
                const activities = Array.isArray(data[key]) ? data[key] : [];
                inputElement = (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 w-40">اليوم (الوقت)</th>
                                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 w-48">التأريخ</th>
                                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 w-1/3">نوع النشاط</th>
                                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300">الملاحظات</th>
                                        <th className="px-4 py-3 w-16 text-center">إجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
                                    {activities.map((activity, idx) => (
                                        <tr key={idx} className="group/row">
                                            <td className="p-3 align-top">
                                                <FlatpickrInput 
                                                    type="time"
                                                    value={activity.time || ''}
                                                    onChange={(timeStr) => {
                                                        const newActivities = [...activities];
                                                        newActivities[idx].time = timeStr;
                                                        setData(key, newActivities);
                                                    }}
                                                    className="w-full !py-2.5 !px-3 !pl-8 text-sm bg-transparent border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-lg dark:text-white"
                                                    placeholder="الوقت..."
                                                    required={field.is_required}
                                                />
                                            </td>
                                            <td className="p-3 align-top">
                                                <FlatpickrInput 
                                                    type="date"
                                                    value={activity.date || ''}
                                                    onChange={(dateStr) => {
                                                        const newActivities = [...activities];
                                                        newActivities[idx].date = dateStr;
                                                        setData(key, newActivities);
                                                    }}
                                                    className="w-full !py-2.5 !px-3 !pl-8 text-sm bg-transparent border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-lg dark:text-white"
                                                    placeholder="التأريخ..."
                                                    required={field.is_required}
                                                />
                                            </td>
                                            <td className="p-3 align-top">
                                                <textarea 
                                                    value={activity.type || ''}
                                                    onChange={(e) => {
                                                        const newActivities = [...activities];
                                                        newActivities[idx].type = e.target.value;
                                                        setData(key, newActivities);
                                                    }}
                                                    rows="2"
                                                    className="w-full bg-transparent border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-lg px-3 py-2.5 text-sm dark:text-white resize-none"
                                                    placeholder="اكتب نوع النشاط..."
                                                    required={field.is_required}
                                                ></textarea>
                                            </td>
                                            <td className="p-3 align-top">
                                                <textarea 
                                                    value={activity.notes || ''}
                                                    onChange={(e) => {
                                                        const newActivities = [...activities];
                                                        newActivities[idx].notes = e.target.value;
                                                        setData(key, newActivities);
                                                    }}
                                                    rows="2"
                                                    className="w-full bg-transparent border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-lg px-3 py-2.5 text-sm dark:text-white resize-none"
                                                    placeholder="اكتب ملاحظاتك..."
                                                    required={field.is_required}
                                                ></textarea>
                                            </td>
                                            <td className="p-3 align-middle text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newActivities = activities.filter((_, i) => i !== idx);
                                                        setData(key, newActivities);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-100 md:opacity-0 md:group-hover/row:opacity-100"
                                                    title="حذف هذا النشاط"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activities.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-6 text-center text-slate-400 text-sm font-semibold">
                                                لا توجد أنشطة مضافة
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setData(key, [...activities, { time: '', date: '', type: '', notes: '' }]);
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:text-primary-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold shadow-sm transition-all"
                            >
                                <Plus size={16} /> إضافة نشاط آخر
                            </button>
                        </div>
                    </div>
                );
                break;
            case 'data_source':
                const sourceData = data[key] || [];
                const options = typeof field.options === 'string' ? JSON.parse(field.options) : (field.options || {});
                const columns = options.columns || [];
                
                const columnHeaders = {
                    day: 'اليوم',
                    date: 'التاريخ',
                    teacher_name: 'اسم المعلم',
                    visit_type: 'نوع الزيارة',
                    notes: 'الملاحظات والتوصيات',
                    evaluation: 'التقييم',
                    discussed_points: 'نقاط النقاش'
                };
                
                inputElement = (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <div className="bg-primary-50 dark:bg-primary-900/10 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                <Database size={16} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">بيانات مسحوبة آلياً</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">هذه البيانات تم جلبها تلقائياً من النظام بناءً على نشاطك خلال فترة التقرير.</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        {columns.map(col => (
                                            <th key={col} className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300">{columnHeaders[col] || col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
                                    {sourceData.length > 0 ? sourceData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            {columns.map(col => (
                                                <td key={col} className="p-3 align-top font-semibold text-slate-700 dark:text-slate-300">
                                                    {row[col] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={columns.length || 1} className="p-6 text-center text-slate-400 text-sm font-semibold">
                                                لا توجد بيانات متاحة في هذه الفترة.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
                break;
            default:
                inputElement = <input type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3" />;
        }

        return (
            <div key={field.id} className="mb-6">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {field.name}
                    {field.is_required && <span className="text-red-500 mr-1">*</span>}
                </label>
                {inputElement}
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
        );
    };

    return (
        <AdminLayout activeMenu="التقارير">
            <Head title={`تقديم تقرير: ${template.name}`} />

            <div className="py-12" style={{ direction: 'rtl' }}>
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="mb-6 flex items-center gap-4">
                        <Link href={route('reports.index')} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowRight size={24} />
                        </Link>
                        <h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 leading-tight">
                            تقديم تقرير: {template.name}
                        </h2>
                    </div>
                    
                    <div className="bg-white dark:bg-[#121820] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8">
                            {template.description && (
                                <div className="mb-8 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/50 text-primary-700 dark:text-primary-300 text-sm leading-relaxed">
                                    {template.description}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {template.fields.map(field => renderField(field))}

                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Send size={20} />
                                        إرسال التقرير
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
