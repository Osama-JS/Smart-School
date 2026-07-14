import React, { useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Toaster, toast } from 'react-hot-toast';
import AdminLayout from '@/Layouts/AdminLayout';
import { FileText, ArrowRight, Save, Calendar as CalendarIcon, Plus, Trash2, CalendarRange, Clock, Tag, CheckSquare, Edit3, Image as ImageIcon } from 'lucide-react';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import RichTextEditor from '@/Components/RichTextEditor';

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
            initialData[field.name] = [];
            const opts = parseMatrixOptions(field.options);
            const days = Array.isArray(template.working_days) && template.working_days.length > 0 
                ? template.working_days 
                : ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'];
            
            days.forEach(day => {
                const row = { day: day };
                opts.forEach(opt => {
                    row[opt] = '';
                });
                initialData[field.name].push(row);
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
        } else if (field.type === 'data_source') {
            // Pre-fill with data fetched from the server (e.g. classroom visits)
            initialData[field.name] = Array.isArray(field.prefilled_data) ? field.prefilled_data : [];
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

    // When the template updates (e.g. after router.reload fetches new data_source data), sync it to the form
    useEffect(() => {
        if (!template || !template.fields) return;
        let hasChanges = false;
        const newData = { ...form.data.data };
        
        template.fields.forEach(field => {
            if (field.type === 'data_source') {
                const fetchedData = Array.isArray(field.prefilled_data) ? field.prefilled_data : [];
                // naive check to prevent infinite loop (if length differs or first id differs)
                const currentData = newData[field.name] || [];
                if (fetchedData.length !== currentData.length || (fetchedData[0] && currentData[0] && fetchedData[0].id !== currentData[0].id)) {
                    newData[field.name] = fetchedData;
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            form.setData('data', newData);
        }
    }, [template]);

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
                            if (!dateStr) return;
                            form.setData('period_start_date', dateStr);
                            form.setData('period_end_date', dateStr);
                            form.setData('period_label', `تاريخ: ${dateStr}`);
                            
                            router.reload({
                                data: { start_date: dateStr, end_date: dateStr },
                                only: ['template'],
                                preserveState: true,
                                preserveScroll: true,
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
                                const [year, month] = val.split('-');
                                const lastDay = new Date(year, month, 0).getDate();
                                const sd = `${val}-01`;
                                const ed = `${val}-${lastDay}`;
                                
                                form.setData('period_start_date', sd);
                                form.setData('period_end_date', ed);
                                form.setData('period_label', `شهر: ${val}`);

                                router.reload({
                                    data: { start_date: sd, end_date: ed },
                                    only: ['template'],
                                    preserveState: true,
                                    preserveScroll: true,
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
                                const d1 = new Date(dates[0]);
                                const d2 = new Date(dates[1]);
                                const diffTime = Math.abs(d2 - d1);
                                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays !== 6) {
                                    toast.error('تنبيه: يجب أن تكون الفترة المحددة 7 أيام بالضبط للتقرير الأسبوعي.');
                                    return;
                                }

                                form.setData('period_start_date', dates[0]);
                                form.setData('period_end_date', dates[1]);
                                form.setData('period_label', `الأسبوع من ${dates[0]} إلى ${dates[1]}`);

                                router.reload({
                                    data: { start_date: dates[0], end_date: dates[1] },
                                    only: ['template'],
                                    preserveState: true,
                                    preserveScroll: true,
                                });
                            }
                        }}
                        options={{ mode: 'range' }}
                        placeholder="اختر تاريخ بداية ونهاية الأسبوع (7 أيام)..."
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
                                form.setData('period_start_date', dates[0]);
                                form.setData('period_end_date', dates[1]);
                                form.setData('period_label', `الفترة من ${dates[0]} إلى ${dates[1]}`);

                                router.reload({
                                    data: { start_date: dates[0], end_date: dates[1] },
                                    only: ['template'],
                                    preserveState: true,
                                    preserveScroll: true,
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
                    <RichTextEditor 
                        value={val || ''}
                        onChange={(content) => handleFieldChange(field.name, content)}
                        placeholder="اكتب التفاصيل هنا..."
                    />
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
                const columnsText = parseMatrixOptions(field.options);
                let rowsText = Array.isArray(val) ? val : [];
                
                if (rowsText.length === 0) {
                    const days = Array.isArray(template.working_days) && template.working_days.length > 0 
                        ? template.working_days 
                        : ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'];
                    
                    rowsText = days.map(day => {
                        const row = { day: day };
                        columnsText.forEach(col => {
                            row[col] = '';
                        });
                        return row;
                    });
                }

                return (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">اليوم</th>
                                    {columnsText.map((col, idx) => (
                                        <th key={idx} className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
                                {rowsText.map((row, rowIdx) => (
                                    <tr key={rowIdx}>
                                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                            <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md text-sm">{row.day}</span>
                                        </td>
                                        {columnsText.map((col, colIdx) => (
                                            <td key={colIdx} className="px-4 py-3">
                                                <input 
                                                    type="text"
                                                    value={row[col] || ''}
                                                    onChange={(e) => {
                                                        const newMatrixData = [...rowsText];
                                                        newMatrixData[rowIdx] = { ...newMatrixData[rowIdx], [col]: e.target.value };
                                                        handleFieldChange(field.name, newMatrixData);
                                                    }}
                                                    className="w-full bg-transparent border-0 border-b border-slate-200 dark:border-slate-700 focus:ring-0 focus:border-primary-500 px-0 py-2 text-sm dark:text-white"
                                                    placeholder="اكتب ملاحظاتك..."
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {columnsText.length === 0 && (
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
            case 'data_source': {
                const sourceRows = Array.isArray(val) ? val : [];
                const columnHeaders = {
                    day: 'اليوم',
                    date: 'التاريخ',
                    teacher_name: 'اسم المعلم',
                    visit_type: 'نوع الزيارة',
                    evaluation: 'التقييم',
                    discussed_points: 'نقاط النقاش',
                    notes: 'الملاحظات',
                };
                const columns = sourceRows.length > 0
                    ? Object.keys(sourceRows[0]).filter(k => k !== 'id')
                    : Object.keys(columnHeaders);
                return (
                    <div className="border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-primary-50 dark:bg-primary-900/10 p-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">بيانات مسحوبة آلياً من النظام</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">هذه البيانات تم جلبها تلقائياً بناءً على نشاطك في الفترة المحددة.</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50">
                                    <tr>
                                        {columns.map(col => (
                                            <th key={col} className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{columnHeaders[col] || col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
                                    {sourceRows.length > 0 ? sourceRows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            {columns.map(col => (
                                                <td key={col} className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                                                    {row[col] != null && row[col] !== '' ? String(row[col]).replace(/<[^>]*>/g, '') : '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={columns.length || 1} className="p-6 text-center text-slate-400 text-sm font-semibold">
                                                لا توجد بيانات متاحة في الفترة الزمنية المحددة.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }
            default:
                return <span className="text-slate-400 text-sm">نوع الحقل غير مدعوم</span>;
        }
    };

    const submit = (e) => {
        e.preventDefault();

        if (template.period_type && template.period_type !== 'none') {
            if (!form.data.period_start_date || !form.data.period_end_date) {
                toast.error('عذراً، يجب تحديد الفترة الزمنية للتقرير أولاً.');
                return;
            }
        }

        form.post(route('hr.reports.my-reports.store', template.id));
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title={`تعبئة تقرير - ${template.name}`} />
            <Toaster position="top-center" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10">
                        <Link href={route('hr.reports.my-reports.index')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors mb-6 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700 w-fit backdrop-blur-sm">
                            <ArrowRight size={16} /> العودة للقائمة
                        </Link>
                        
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800 shadow-primary-500/10">
                                        <FileText size={14} /> نموذج تقرير جديد
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 leading-tight">
                                    {template.name}
                                </h1>
                                {template.description ? (
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                                        {template.description}
                                    </p>
                                ) : (
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
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
