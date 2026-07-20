import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, CalendarRange, Plus, Trash2, FileText, Image as ImageIcon, Database } from 'lucide-react';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import RichTextEditor from '@/Components/RichTextEditor';

export default function PreviewFormModal({ template, onClose }) {
    const parseMatrixOptions = (options) => {
        if (!options) return [];
        if (typeof options === 'string') return options.split('.').map(s => s.trim()).filter(Boolean);
        if (Array.isArray(options)) {
             return options.join('.').split('.').map(s => s.trim()).filter(Boolean);
        }
        return [];
    };

    const [data, setData] = useState({});

    useEffect(() => {
        if (!template || !template.fields) return;
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
                initialData[field.name] = [
                    { id: 1, day: 'الإثنين', date: '2026-07-20', teacher_name: 'أحمد علي', visit_type: 'توجيهية', evaluation: 'ممتاز', discussed_points: 'نقاط النقاش', notes: 'ملاحظة' },
                    { id: 2, day: 'الثلاثاء', date: '2026-07-21', teacher_name: 'عمر خالد', visit_type: 'تقييم', evaluation: 'جيد', discussed_points: 'نقاط', notes: '' }
                ];
            } else {
                initialData[field.name] = '';
            }
        });
        setData(initialData);
    }, [template]);

    const handleFieldChange = (fieldName, value) => {
        setData(prev => ({ ...prev, [fieldName]: value }));
    };

    const renderPeriodSelector = () => {
        if (template.period_type === 'daily') {
            return (
                <div className="mb-8 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-700/50">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 mb-3">
                        <CalendarIcon size={18} className="text-primary-500" />
                        تاريخ التقرير اليومي <span className="text-rose-500">*</span>
                    </label>
                    <FlatpickrInput 
                        value="" onChange={() => {}} placeholder="اختر اليوم..."
                        className="!w-full !bg-white dark:!bg-[#0f141a] !border-slate-200 dark:!border-slate-800 !rounded-xl !px-5 !py-4 !text-sm focus:!border-primary-500 focus:!ring-2 focus:!ring-primary-500/20"
                    />
                </div>
            );
        }
        
        if (template.period_type === 'monthly') {
            return (
                <div className="mb-8 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-700/50">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 mb-3">
                        <CalendarRange size={18} className="text-primary-500" />
                        شهر التقرير <span className="text-rose-500">*</span>
                    </label>
                    <input type="month" className="w-full bg-white dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                </div>
            );
        }

        if (template.period_type === 'weekly' || template.period_type === 'custom' || template.period_type === 'quarterly' || template.period_type === 'yearly') {
            return (
                <div className="mb-8 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-700/50">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 mb-3">
                        <CalendarRange size={18} className="text-primary-500" />
                        {template.period_type === 'weekly' ? 'تحديد الأسبوع (من - إلى)' : 'الفترة الزمنية للتقرير'} <span className="text-rose-500">*</span>
                    </label>
                    <FlatpickrInput 
                        value="" onChange={() => {}} options={{ mode: 'range' }} placeholder="اختر تاريخ البداية والنهاية..."
                        className="!w-full !bg-white dark:!bg-[#0f141a] !border-slate-200 dark:!border-slate-800 !rounded-xl !px-5 !py-4 !text-sm focus:!border-primary-500 focus:!ring-2 focus:!ring-primary-500/20"
                    />
                </div>
            );
        }

        return null;
    };

    const renderField = (field) => {
        const val = data[field.name];

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
                        className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
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
                        className="w-full"
                    />
                );
            case 'checkbox':
                return (
                    <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0f141a]/50">
                        <input 
                            type="checkbox"
                            checked={val || false}
                            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                            className="w-6 h-6 rounded border-slate-300 text-primary-600 focus:ring-primary-500/30"
                        />
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">أقر بصحة المعلومات والموافقة</span>
                    </label>
                );
            case 'rating':
                return (
                    <div className="flex gap-2">
                        {[1,2,3,4,5].map(star => (
                            <button
                                key={star} type="button" onClick={() => handleFieldChange(field.name, star)}
                                className={`text-2xl transition-all ${val >= star ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-700 hover:text-yellow-200'}`}
                            >★</button>
                        ))}
                    </div>
                );
            case 'matrix_text': {
                const columnsText = parseMatrixOptions(field.options);
                let rowsText = Array.isArray(val) ? val : [];
                return (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">اليوم</th>
                                    {columnsText.map((col, idx) => <th key={idx} className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300">{col}</th>)}
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
                                                    type="text" value={row[col] || ''}
                                                    onChange={(e) => {
                                                        const newMatrixData = [...rowsText];
                                                        newMatrixData[rowIdx] = { ...newMatrixData[rowIdx], [col]: e.target.value };
                                                        handleFieldChange(field.name, newMatrixData);
                                                    }}
                                                    className="w-full bg-transparent border-0 border-b border-slate-200 dark:border-slate-700 focus:ring-0 focus:border-primary-500 px-0 py-2 text-sm dark:text-white"
                                                    placeholder="ملاحظات..."
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {columnsText.length === 0 && <tr><td colSpan="2" className="px-4 py-4 text-center text-slate-400">لم يتم تحديد بنود</td></tr>}
                            </tbody>
                        </table>
                    </div>
                );
            }
            case 'tasks_matrix': {
                const parsedTasks = parseMatrixOptions(field.options);
                return (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 w-1/3">الأعمال</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 text-center w-24">نفذ</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 text-center w-24">لم ينفذ</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300">السبب</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
                                {parsedTasks.map((taskLabel, idx) => {
                                    const taskData = (val && val[taskLabel]) || { status: '', reason: '' };
                                    return (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{taskLabel}</td>
                                            <td className="px-4 py-3 text-center">
                                                <input type="radio" checked={taskData.status === 'executed'} onChange={() => {
                                                    const newMatrixData = { ...val };
                                                    newMatrixData[taskLabel] = { ...taskData, status: 'executed', reason: '' };
                                                    handleFieldChange(field.name, newMatrixData);
                                                }} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input type="radio" checked={taskData.status === 'not_executed'} onChange={() => {
                                                    const newMatrixData = { ...val };
                                                    newMatrixData[taskLabel] = { ...taskData, status: 'not_executed' };
                                                    handleFieldChange(field.name, newMatrixData);
                                                }} className="w-5 h-5 text-rose-600 focus:ring-rose-500 cursor-pointer" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input type="text" value={taskData.reason || ''} onChange={(e) => {
                                                    const newMatrixData = { ...val };
                                                    newMatrixData[taskLabel] = { ...taskData, reason: e.target.value };
                                                    handleFieldChange(field.name, newMatrixData);
                                                }} disabled={taskData.status === 'executed'} className={`w-full bg-transparent border-0 border-b ${taskData.status === 'executed' ? 'border-transparent opacity-50' : 'border-slate-200 dark:border-slate-700 focus:border-primary-500'} px-0 py-2 text-sm dark:text-white transition-all`} placeholder={taskData.status === 'executed' ? "تم التنفيذ" : "اكتب السبب هنا..."} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            }
            case 'activities_matrix': {
                const activities = Array.isArray(val) ? val : [];
                return (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 w-40">الوقت</th>
                                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 w-48">التأريخ</th>
                                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 w-1/3">النشاط</th>
                                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300">ملاحظات</th>
                                        <th className="px-4 py-3 w-16 text-center">إجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
                                    {activities.map((activity, idx) => (
                                        <tr key={idx} className="group/row">
                                            <td className="p-3"><FlatpickrInput type="time" value={activity.time||''} onChange={(t) => { const n=[...activities]; n[idx].time=t; handleFieldChange(field.name, n); }} className="w-full !p-2 text-sm dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded" /></td>
                                            <td className="p-3"><FlatpickrInput type="date" value={activity.date||''} onChange={(d) => { const n=[...activities]; n[idx].date=d; handleFieldChange(field.name, n); }} className="w-full !p-2 text-sm dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded" /></td>
                                            <td className="p-3"><textarea value={activity.type||''} onChange={(e) => { const n=[...activities]; n[idx].type=e.target.value; handleFieldChange(field.name, n); }} rows="1" className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded"></textarea></td>
                                            <td className="p-3"><textarea value={activity.notes||''} onChange={(e) => { const n=[...activities]; n[idx].notes=e.target.value; handleFieldChange(field.name, n); }} rows="1" className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded"></textarea></td>
                                            <td className="p-3 text-center"><button type="button" onClick={() => handleFieldChange(field.name, activities.filter((_,i)=>i!==idx))} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-center">
                            <button type="button" onClick={() => handleFieldChange(field.name, [...activities, { time: '', date: '', type: '', notes: '' }])} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:text-primary-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold shadow-sm transition-all"><Plus size={16} /> إضافة نشاط</button>
                        </div>
                    </div>
                );
            }
            case 'file':
            case 'image':
                return (
                    <div className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 bg-slate-50/50 dark:bg-slate-900/50 hover:border-primary-400 cursor-pointer transition-all text-center">
                        {field.type === 'file' ? <FileText className="text-slate-400" size={32} /> : <ImageIcon className="text-slate-400" size={32} />}
                        <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">انقر هنا أو اسحب {field.type==='file'?'الملف':'الصورة'} لإرفاقها</p>
                            <p className="text-xs text-slate-500 mt-1">{field.type==='file'?'الحد الأقصى للملف: 10 ميجابايت':'JPG, PNG, GIF (الحد الأقصى 5 ميجابايت)'}</p>
                        </div>
                    </div>
                );
            case 'data_source': {
                const source = field.options?.source;
                const columns = Array.isArray(field.options?.columns) ? field.options.columns : [];
                
                const labelsDict = {
                    day: 'اليوم', date: 'التاريخ', teacher_name: 'اسم المعلم', visit_type: 'نوع الزيارة', notes: 'الملاحظات', evaluation: 'التقييم',
                    employee_name: 'اسم الموظف', violation_type: 'نوع المخالفة', violation_date: 'التاريخ', repetition_level: 'مستوى التكرار', action_taken: 'الإجراء', status: 'الحالة', details: 'التفاصيل'
                };

                const sourceRows = Array.isArray(val) && val.length > 0 ? val : (
                    source === 'employee_violations' ? [
                        { employee_name: 'أحمد محمد', violation_type: 'تأخر صباحي', violation_date: '2023-10-15', repetition_level: 'أولى', action_taken: 'إنذار', status: 'مفتوحة', details: 'تأخر 30 دقيقة' }
                    ] : [
                        { day: 'الأحد', date: '2023-10-15', teacher_name: 'أحمد محمد', visit_type: 'توجيهية', evaluation: '95', notes: 'ممتاز' }
                    ]
                );

                const displayColumns = columns.length > 0 ? columns : Object.keys(sourceRows[0] || {}).filter(k => labelsDict[k]);

                return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                            <Database size={16} className="text-indigo-500" />
                            <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-400">بيانات مجلوبة تلقائياً (عينة)</h4>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        {displayColumns.map(col => (
                                            <th key={col} className="px-5 py-3 font-bold text-slate-600 dark:text-slate-300">{labelsDict[col] || col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
                                    {sourceRows.map((row, idx) => (
                                        <tr key={idx}>
                                            {displayColumns.map(col => (
                                                <td key={col} className="px-5 py-3 text-slate-700 dark:text-slate-300">
                                                    {col === 'visit_type' || col === 'status' ? (
                                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold border border-slate-200 dark:border-slate-700">{row[col]}</span>
                                                    ) : col === 'evaluation' ? (
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{row[col]}</span>
                                                    ) : col === 'teacher_name' || col === 'employee_name' ? (
                                                        <span className="font-bold text-slate-800 dark:text-white">{row[col]}</span>
                                                    ) : (
                                                        row[col]
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }
            default:
                return <input type="text" className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-sm" disabled placeholder="غير مدعوم حالياً" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <div className="relative bg-slate-50 dark:bg-slate-900 w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10 sticky top-0 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">معاينة التعبئة: {template?.name}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold">هكذا سيبدو نموذج إدخال التقرير للموظفين</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 md:p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        {renderPeriodSelector()}
                        
                        <div className="space-y-6">
                            {(template?.fields || []).map((field, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800/50 p-6 rounded-[1.5rem] border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                    <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
                                        {field.name}
                                        {field.is_required && <span className="text-rose-500 text-xs mr-1 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">*</span>}
                                    </label>
                                    {renderField(field)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors shadow-sm">
                        إغلاق المعاينة
                    </button>
                </div>
            </div>
        </div>
    );
}
