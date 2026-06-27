import React, { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FileText, ArrowRight, Save, Calendar as CalendarIcon, Plus, Trash2, CalendarRange, Clock, Tag, CheckSquare, Edit3, Image as ImageIcon } from 'lucide-react';
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
                <div className="mb-8 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-sm p-6 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-700/50 shadow-inner">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 mb-3">
                        <CalendarIcon size={18} className="text-primary-500" />
                        تاريخ التقرير اليومي <span className="text-rose-500">*</span>
                    </label>
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
                        className="!w-full !bg-white dark:!bg-[#0f141a] !border-slate-200 dark:!border-slate-800 !rounded-xl !px-5 !py-4 !text-sm focus:!border-primary-500 focus:!ring-2 focus:!ring-primary-500/20 !shadow-inner !font-semibold !transition-all"
                    />
                </div>
            );
        }
        
        if (template.period_type === 'monthly') {
            return (
                <div className="mb-8 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-sm p-6 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-700/50 shadow-inner">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 mb-3">
                        <CalendarRange size={18} className="text-primary-500" />
                        شهر التقرير <span className="text-rose-500">*</span>
                    </label>
                    <input 
                        type="month"
                        className="w-full bg-white dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-inner outline-none dark:text-white font-semibold transition-all"
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
                <div className="mb-8 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-sm p-6 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-700/50 shadow-inner">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 mb-3">
                        <CalendarRange size={18} className="text-primary-500" />
                        تحديد الأسبوع (من - إلى) <span className="text-rose-500">*</span>
                    </label>
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
                        className="!w-full !bg-white dark:!bg-[#0f141a] !border-slate-200 dark:!border-slate-800 !rounded-xl !px-5 !py-4 !text-sm focus:!border-primary-500 focus:!ring-2 focus:!ring-primary-500/20 !shadow-inner !font-semibold !transition-all"
                    />
                </div>
            );
        }

        if (template.period_type === 'custom' || template.period_type === 'quarterly' || template.period_type === 'yearly') {
            return (
                <div className="mb-8 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-sm p-6 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-700/50 shadow-inner">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 mb-3">
                        <CalendarRange size={18} className="text-primary-500" />
                        الفترة الزمنية للتقرير <span className="text-rose-500">*</span>
                    </label>
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
                        className="!w-full !bg-white dark:!bg-[#0f141a] !border-slate-200 dark:!border-slate-800 !rounded-xl !px-5 !py-4 !text-sm focus:!border-primary-500 focus:!ring-2 focus:!ring-primary-500/20 !shadow-inner !font-semibold !transition-all"
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
                        className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none dark:text-white font-semibold placeholder:text-slate-400 shadow-inner transition-all"
                    />
                );
            case 'textarea':
                return (
                    <div className="bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200/50 dark:[&_.ql-toolbar]:border-slate-800 [&_.ql-toolbar]:bg-white/50 dark:[&_.ql-toolbar]:bg-[#121820]/50 [&_.ql-container]:border-none [&_.ql-container]:text-sm [&_.ql-editor]:min-h-[150px] dark:[&_.ql-editor]:text-white dark:[&_.ql-picker]:text-slate-300 dark:[&_.ql-stroke]:stroke-slate-300 dark:[&_.ql-fill]:fill-slate-300 dark:[&_.ql-picker-options]:bg-[#121820] dark:[&_.ql-picker-options]:border-slate-800">
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
                    <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0f141a]/50 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-200 dark:hover:border-primary-800/50 transition-all group">
                        <div className="relative flex items-center justify-center">
                            <input 
                                type="checkbox"
                                checked={val || false}
                                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                                className="w-6 h-6 rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500/30 dark:bg-slate-900 transition-all cursor-pointer peer"
                            />
                        </div>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">أقر بصحة المعلومات والموافقة</span>
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
                    <div className="relative group cursor-pointer">
                        <input 
                            type="file"
                            onChange={(e) => {
                                if(e.target.files[0]) {
                                    handleFieldChange(field.name, e.target.files[0].name);
                                }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 bg-slate-50/50 dark:bg-[#0f141a]/50 group-hover:border-primary-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 transition-all text-center">
                            <FileText className="text-slate-400 group-hover:text-primary-500" size={32} />
                            <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">انقر هنا أو اسحب الملف لإرفاقه</p>
                                <p className="text-xs text-slate-500 mt-1">{val || 'الحد الأقصى للملف: 10 ميجابايت'}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'image':
                return (
                    <div className="relative group cursor-pointer">
                        <input 
                            type="file" accept="image/*"
                            onChange={(e) => {
                                if(e.target.files[0]) {
                                    handleFieldChange(field.name, e.target.files[0].name);
                                }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 bg-slate-50/50 dark:bg-[#0f141a]/50 group-hover:border-primary-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 transition-all text-center">
                            <ImageIcon className="text-slate-400 group-hover:text-primary-500" size={32} />
                            <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">انقر هنا أو اسحب الصورة لإرفاقها</p>
                                <p className="text-xs text-slate-500 mt-1">{val || 'JPG, PNG, GIF (الحد الأقصى 5 ميجابايت)'}</p>
                            </div>
                        </div>
                    </div>
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

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="relative overflow-hidden bg-white dark:bg-dark-900 border border-dark-200/60 dark:border-dark-800 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-dark-200/20 dark:shadow-none mb-6">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10">
                        <Link href={route('hr.reports.my-reports.index')} className="inline-flex items-center gap-2 text-sm font-bold text-dark-500 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors mb-6 bg-dark-50 dark:bg-dark-800/50 hover:bg-dark-100 dark:hover:bg-dark-700 px-4 py-2 rounded-xl border border-dark-200/50 dark:border-dark-700 w-fit backdrop-blur-sm">
                            <ArrowRight size={16} /> العودة للقائمة
                        </Link>
                        
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800 shadow-primary-500/10">
                                        <FileText size={14} /> نموذج تقرير جديد
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-dark-900 dark:text-white tracking-tight mb-2 leading-tight">
                                    {template.name}
                                </h1>
                                {template.description ? (
                                    <p className="text-dark-500 dark:text-dark-400 font-bold text-sm">
                                        {template.description}
                                    </p>
                                ) : (
                                    <p className="text-dark-500 dark:text-dark-400 font-bold text-sm">
                                        تعبئة البيانات ورفع المرفقات للتقرير
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="relative bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-400" />
                    <div className="absolute top-0 left-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 p-6 md:p-10">
                        {renderPeriodSelector()}

                        <div className="space-y-8">
                            {template.fields.sort((a,b) => a.order - b.order).map((field, idx) => (
                                <div key={field.id} className="relative group/field border-b border-slate-100 dark:border-slate-800/50 pb-8 last:border-0 last:pb-0">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 group-hover/field:bg-primary-50 dark:group-hover/field:bg-primary-900/20 group-hover/field:text-primary-600 dark:group-hover/field:text-primary-400 transition-colors">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <label className="block text-base font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                <span>{field.name}</span>
                                                {field.is_required && <span className="text-rose-500 mt-1">*</span>}
                                            </label>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5 block">يرجى تعبئة الحقل بالبيانات المطلوبة</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mr-11">
                                        {renderField(field)}
                                        
                                        {form.errors[`data.${field.name}`] && (
                                            <p className="text-rose-500 text-xs mt-2.5 font-bold flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                {form.errors[`data.${field.name}`]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="relative z-10 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md p-6 md:px-10 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                        <Link 
                            href={route('hr.reports.my-reports.index')}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-[1.25rem] font-bold text-slate-600 bg-white dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 hover:text-primary-600 transition-all text-center active:scale-95 shadow-sm"
                        >
                            إلغاء
                        </Link>
                        <button 
                            type="submit" 
                            disabled={form.processing}
                            className="w-full sm:w-auto px-10 py-3.5 rounded-[1.25rem] font-black bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 hover:-translate-y-0.5 active:scale-95"
                        >
                            <Save size={20} strokeWidth={2.5} />
                            إرسال التقرير
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
