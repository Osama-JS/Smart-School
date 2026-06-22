import React, { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FileText, ArrowRight, Save, Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function MyReportsCreate({ auth, template }) {
    
    const parseMatrixOptions = (options) => {
        if (!options) return [];
        if (typeof options === 'string') return options.split('.').map(s => s.trim()).filter(Boolean);
        if (Array.isArray(options)) {
             return options.join('.').split('.').map(s => s.trim()).filter(Boolean);
        }
        return [];
    };
    
    // Initialize data structure for fields
    const initialData = {};
    template.fields.forEach(field => {
        if (field.type === 'matrix_text') {
            initialData[field.name] = {};
            const opts = parseMatrixOptions(field.options);
            opts.forEach(opt => {
                initialData[field.name][opt] = '';
            });
        } else if (field.type === 'tasks_matrix') {
            initialData[field.name] = {};
            const opts = parseMatrixOptions(field.options);
            opts.forEach(opt => {
                initialData[field.name][opt] = { status: '', reason: '' };
            });
        } else if (field.type === 'activities_matrix') {
            initialData[field.name] = [{ time: '', date: '', type: '', notes: '' }];
        } else if (field.type === 'checkbox') {
            initialData[field.name] = false;
        } else {
            initialData[field.name] = '';
        }
    });

    const form = useForm({
        period_start_date: '',
        period_end_date: '',
        period_label: '',
        data: initialData
    });

    // Handle period selection based on template type
    const renderPeriodSelector = () => {
        if (template.period_type === 'daily') {
            return (
                <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ التقرير اليومي <span className="text-red-500">*</span></label>
                    <FlatpickrInput 
                        value={form.data.period_start_date}
                        onChange={(dateStr) => {
                            form.setData({
                                ...form.data,
                                period_start_date: dateStr,
                                period_end_date: dateStr,
                                period_label: `تاريخ: ${dateStr}`
                            });
                        }}
                        placeholder="اختر اليوم..."
                    />
                </div>
            );
        }
        
        if (template.period_type === 'monthly') {
            return (
                <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">شهر التقرير <span className="text-red-500">*</span></label>
                    <input 
                        type="month"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 outline-none dark:text-white font-semibold"
                        onChange={(e) => {
                            const val = e.target.value; // YYYY-MM
                            if(val) {
                                form.setData({
                                    ...form.data,
                                    period_start_date: `${val}-01`,
                                    period_end_date: `${val}-28`, // approximation for logic, ideally calculate last day
                                    period_label: `شهر: ${val}`
                                });
                            }
                        }}
                    />
                </div>
            );
        }

        // For weekly, we use a datepicker with mode: 'range'
        if (template.period_type === 'weekly') {
            return (
                <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تحديد الأسبوع (من - إلى) <span className="text-red-500">*</span></label>
                    <FlatpickrInput 
                        value={form.data.period_start_date ? `${form.data.period_start_date} to ${form.data.period_end_date}` : ''}
                        onChange={(dateStr) => {
                            if (!dateStr) return;
                            const dates = dateStr.split(' to ');
                            if (dates.length === 2) {
                                form.setData({
                                    ...form.data,
                                    period_start_date: dates[0],
                                    period_end_date: dates[1],
                                    period_label: `الأسبوع من ${dates[0]} إلى ${dates[1]}`
                                });
                            }
                        }}
                        options={{ mode: 'range' }}
                        placeholder="اختر تاريخ بداية ونهاية الأسبوع..."
                        required
                    />
                </div>
            );
        }

        if (template.period_type === 'custom' || template.period_type === 'quarterly' || template.period_type === 'yearly') {
            return (
                <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الفترة الزمنية للتقرير <span className="text-red-500">*</span></label>
                    <FlatpickrInput 
                        value={form.data.period_start_date ? `${form.data.period_start_date} to ${form.data.period_end_date}` : ''}
                        onChange={(dateStr) => {
                            if (!dateStr) return;
                            const dates = dateStr.split(' to ');
                            if (dates.length === 2) {
                                form.setData({
                                    ...form.data,
                                    period_start_date: dates[0],
                                    period_end_date: dates[1],
                                    period_label: `الفترة من ${dates[0]} إلى ${dates[1]}`
                                });
                            }
                        }}
                        options={{ mode: 'range' }}
                        placeholder="اختر تاريخ البداية والنهاية..."
                        required
                    />
                </div>
            );
        }

        return null;
    };

    const handleFieldChange = (fieldName, value) => {
        form.setData('data', {
            ...form.data.data,
            [fieldName]: value
        });
    };

    const renderField = (field) => {
        const val = form.data.data[field.name];

        switch (field.type) {
            case 'text':
            case 'number':
            case 'date':
            case 'time':
                return (
                    <input 
                        type={field.type === 'text' ? 'text' : field.type}
                        value={val || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        required={field.is_required}
                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 outline-none dark:text-white font-semibold placeholder:text-slate-400"
                    />
                );
            case 'textarea':
                return (
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-toolbar]:border-slate-700 [&_.ql-toolbar]:bg-slate-50 dark:[&_.ql-toolbar]:bg-slate-800/50 [&_.ql-container]:border-none [&_.ql-container]:text-sm [&_.ql-editor]:min-h-[150px] dark:[&_.ql-editor]:text-white dark:[&_.ql-picker]:text-slate-300 dark:[&_.ql-stroke]:stroke-slate-300 dark:[&_.ql-fill]:fill-slate-300 dark:[&_.ql-picker-options]:bg-slate-800 dark:[&_.ql-picker-options]:border-slate-700">
                        <ReactQuill 
                            theme="snow"
                            value={val || ''}
                            onChange={(content) => handleFieldChange(field.name, content)}
                            placeholder="اكتب التفاصيل هنا..."
                        />
                    </div>
                );
            case 'select':
                return (
                    <SelectInput 
                        value={val || ''}
                        onChange={(selected) => handleFieldChange(field.name, selected)}
                        options={(field.options || []).map(o => ({ value: o, label: o }))}
                        isClearable={!field.is_required}
                        className="w-full"
                    />
                );
            case 'checkbox':
                return (
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={val || false}
                            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">نعم / موافق</span>
                    </label>
                );
            case 'rating':
                return (
                    <div className="flex gap-2">
                        {[1,2,3,4,5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => handleFieldChange(field.name, star)}
                                className={`text-2xl transition-all ${val >= star ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-700 hover:text-yellow-200'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                );
            case 'matrix_text':
                const parsedOptions = parseMatrixOptions(field.options);
                return (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 w-1/3">البند / المجال</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300">الملاحظات / الإفادة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
                                {parsedOptions.map((rowLabel, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                                            {rowLabel}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="text"
                                                value={(val && val[rowLabel]) || ''}
                                                onChange={(e) => {
                                                    const newMatrixData = { ...val };
                                                    newMatrixData[rowLabel] = e.target.value;
                                                    handleFieldChange(field.name, newMatrixData);
                                                }}
                                                className="w-full bg-transparent border-0 border-b border-slate-200 dark:border-slate-700 focus:ring-0 focus:border-primary-500 px-0 py-2 text-sm dark:text-white"
                                                placeholder="اكتب ملاحظاتك هنا..."
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {parsedOptions.length === 0 && (
                                    <tr>
                                        <td colSpan="2" className="px-4 py-4 text-center text-slate-400">لم يتم تحديد بنود من قبل الإدارة</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            case 'tasks_matrix':
                const parsedTasks = parseMatrixOptions(field.options);
                return (
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
                                {parsedTasks.map((taskLabel, idx) => {
                                    const taskData = (val && val[taskLabel]) || { status: '', reason: '' };
                                    return (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                                                {taskLabel}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input 
                                                    type="radio"
                                                    name={`field_${field.id}_${idx}_status`}
                                                    checked={taskData.status === 'executed'}
                                                    onChange={() => {
                                                        const newMatrixData = { ...val };
                                                        newMatrixData[taskLabel] = { ...taskData, status: 'executed', reason: '' };
                                                        handleFieldChange(field.name, newMatrixData);
                                                    }}
                                                    className="w-5 h-5 border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input 
                                                    type="radio"
                                                    name={`field_${field.id}_${idx}_status`}
                                                    checked={taskData.status === 'not_executed'}
                                                    onChange={() => {
                                                        const newMatrixData = { ...val };
                                                        newMatrixData[taskLabel] = { ...taskData, status: 'not_executed' };
                                                        handleFieldChange(field.name, newMatrixData);
                                                    }}
                                                    className="w-5 h-5 border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="text"
                                                    value={taskData.reason || ''}
                                                    onChange={(e) => {
                                                        const newMatrixData = { ...val };
                                                        newMatrixData[taskLabel] = { ...taskData, reason: e.target.value };
                                                        handleFieldChange(field.name, newMatrixData);
                                                    }}
                                                    className={`w-full bg-transparent border-0 border-b ${taskData.status === 'executed' ? 'border-transparent opacity-50' : 'border-slate-200 dark:border-slate-700 focus:border-primary-500'} focus:ring-0 px-0 py-2 text-sm dark:text-white transition-all`}
                                                    placeholder={taskData.status === 'executed' ? "تم التنفيذ" : "اكتب السبب هنا..."}
                                                    disabled={taskData.status === 'executed'}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                                {parsedTasks.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-4 text-center text-slate-400">لم يتم تحديد أعمال من قبل الإدارة</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            case 'activities_matrix':
                const activities = Array.isArray(val) ? val : [];
                return (
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
                                                        handleFieldChange(field.name, newActivities);
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
                                                        handleFieldChange(field.name, newActivities);
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
                                                        handleFieldChange(field.name, newActivities);
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
                                                        handleFieldChange(field.name, newActivities);
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
                                                        handleFieldChange(field.name, newActivities);
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
                                    handleFieldChange(field.name, [...activities, { time: '', date: '', type: '', notes: '' }]);
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:text-primary-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold shadow-sm transition-all"
                            >
                                <Plus size={16} /> إضافة نشاط آخر
                            </button>
                        </div>
                    </div>
                );
            case 'file':
                return (
                    <input 
                        type="file"
                        onChange={(e) => {
                            // File upload logic here - For now we just store the name or object
                            // Actual file uploading requires FormData
                            if(e.target.files[0]) {
                                handleFieldChange(field.name, e.target.files[0].name);
                            }
                        }}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400"
                    />
                );
            case 'image':
                return (
                    <input 
                        type="file" accept="image/*"
                        onChange={(e) => {
                            if(e.target.files[0]) {
                                handleFieldChange(field.name, e.target.files[0].name);
                            }
                        }}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400"
                    />
                );
            default:
                return <span className="text-slate-400 text-sm">نوع الحقل غير مدعوم</span>;
        }
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(route('hr.reports.my-reports.store', template.id));
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title={`تعبئة تقرير - ${template.name}`} />

            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('hr.reports.my-reports.index')} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary-600 transition-colors">
                            <ArrowRight size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                                {template.name}
                            </h1>
                            {template.description && (
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{template.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                        {renderPeriodSelector()}

                        <div className="space-y-6">
                            {template.fields.sort((a,b) => a.order - b.order).map(field => (
                                <div key={field.id} className="border-b border-slate-100 dark:border-slate-800/60 pb-6 last:border-0 last:pb-0">
                                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1">
                                        <span>{field.name}</span>
                                        {field.is_required && <span className="text-red-500">*</span>}
                                    </label>
                                    
                                    {renderField(field)}
                                    
                                    {form.errors[`data.${field.name}`] && (
                                        <p className="text-red-500 text-xs mt-2 font-bold">{form.errors[`data.${field.name}`]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-slate-50/50 dark:bg-slate-800/30 p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                        <Link 
                            href={route('hr.reports.my-reports.index')}
                            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                        >
                            إلغاء
                        </Link>
                        <button 
                            type="submit" 
                            disabled={form.processing}
                            className="px-6 py-3 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            إرسال التقرير
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
