import React, { useState, useEffect } from 'react';
import { X, CheckCircle, FileText, Image as ImageIcon, File, Calendar as CalendarIcon, Clock, Database, CalendarRange, Star } from 'lucide-react';
import RichTextEditor from '@/Components/RichTextEditor';

export default function PreviewReportModal({ template, onClose }) {
    
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
        const mockData = {};
        template.fields.forEach(field => {
            if (field.type === 'matrix_text') {
                mockData[field.name] = [];
                const opts = parseMatrixOptions(field.options);
                const days = Array.isArray(template.working_days) && template.working_days.length > 0 
                    ? template.working_days 
                    : ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'];
                
                days.forEach(day => {
                    const row = { day: day };
                    opts.forEach(opt => {
                        row[opt] = 'تمت مراجعة البند والتأكد منه.';
                    });
                    mockData[field.name].push(row);
                });
            } else if (field.type === 'tasks_matrix') {
                mockData[field.name] = {};
                const opts = parseMatrixOptions(field.options);
                opts.forEach((opt, idx) => {
                    mockData[field.name][opt] = { 
                        status: idx % 2 === 0 ? 'executed' : 'not_executed', 
                        reason: idx % 2 === 0 ? '' : 'نقص في الموارد المتاحة' 
                    };
                });
            } else if (field.type === 'activities_matrix') {
                mockData[field.name] = [
                    { time: '08:30 AM', date: '2026-07-20', type: 'اجتماع صباحي', notes: 'تمت مناقشة خطة العمل الأسبوعية' },
                    { time: '12:00 PM', date: '2026-07-21', type: 'ورشة عمل', notes: 'تدريب الفريق على النظام الجديد' }
                ];
            } else if (field.type === 'checkbox') {
                mockData[field.name] = true;
            } else if (field.type === 'data_source') {
                mockData[field.name] = [
                    { id: 1, day: 'الإثنين', date: '2026-07-20', teacher_name: 'أحمد علي', visit_type: 'توجيهية', evaluation: 'ممتاز', discussed_points: 'تطوير الوسائل التعليمية', notes: 'يتمتع المعلم بأسلوب رائع' },
                    { id: 2, day: 'الثلاثاء', date: '2026-07-21', teacher_name: 'عمر خالد', visit_type: 'تقييم', evaluation: 'جيد', discussed_points: 'إدارة وقت الحصة', notes: 'يحتاج إلى تحسين في تقسيم الوقت' }
                ];
            } else if (field.type === 'text') {
                mockData[field.name] = 'قيمة نصية تجريبية كمثال';
            } else if (field.type === 'textarea') {
                mockData[field.name] = '<p>هذا <strong>نص تجريبي</strong> يعرض شكل التقرير النهائي. يمكن للمستخدم إدخال تفاصيل وشروحات طويلة هنا.</p>';
            } else if (field.type === 'number') {
                mockData[field.name] = '42';
            } else if (field.type === 'date') {
                mockData[field.name] = '2026-07-20';
            } else if (field.type === 'time') {
                mockData[field.name] = '10:00 AM';
            } else if (field.type === 'rating') {
                mockData[field.name] = 4;
            } else if (field.type === 'select') {
                const opts = parseMatrixOptions(field.options);
                mockData[field.name] = opts.length > 0 ? opts[0] : 'خيار محدد تجريبي';
            } else if (field.type === 'file' || field.type === 'image') {
                mockData[field.name] = 'example_file_path';
            } else {
                mockData[field.name] = 'بيانات افتراضية';
            }
        });
        setData(mockData);
    }, [template]);

    const renderFieldValue = (field, value) => {
        if (field.type !== 'data_source' && (value === null || value === undefined || value === '')) {
            return <span className="text-slate-400 italic">لم يتم إدخال قيمة</span>;
        }

        switch (field.type) {
            case 'checkbox':
                return value ? (
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1">
                        <CheckCircle size={12} /> نعم
                    </span>
                ) : (
                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold">لا</span>
                );
            case 'image':
                return (
                    <div className="mt-2 flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 w-fit">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center">
                            <ImageIcon size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">صورة مرفقة.png</p>
                            <p className="text-xs text-slate-500 mt-1">هذه معاينة فقط</p>
                        </div>
                    </div>
                );
            case 'file':
                return (
                    <div className="mt-2 flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 w-fit">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center">
                            <File size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">ملف_مرفق.pdf</p>
                            <p className="text-xs text-slate-500 mt-1">هذه معاينة فقط</p>
                        </div>
                    </div>
                );
            case 'textarea':
                return (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 border-l-2 border-primary-500 pl-4 py-1" dangerouslySetInnerHTML={{ __html: value }} />
                );
            case 'rating':
                return (
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} size={20} className={value >= star ? "text-yellow-400 fill-yellow-400" : "text-slate-200 dark:text-slate-700"} />
                        ))}
                    </div>
                );
            case 'matrix_text':
                if (Array.isArray(value) && value.length > 0) {
                    let columns = [];
                    try {
                        if (typeof field.options === 'string') columns = field.options.split('.').map(s => s.trim()).filter(Boolean);
                        else if (Array.isArray(field.options)) columns = field.options.join('.').split('.').map(s => s.trim()).filter(Boolean);
                    } catch (e) {}

                    return (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 shadow-inner overflow-x-auto">
                            <table className="w-full text-right text-sm min-w-[600px]">
                                <thead className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/50">
                                    <tr>
                                        <th className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300 whitespace-nowrap">اليوم</th>
                                        {columns.map((col, idx) => (
                                            <th key={idx} className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {value.map((row, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-white/80 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800/60 whitespace-nowrap">
                                                <span className="bg-slate-200/50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg">{row.day}</span>
                                            </td>
                                            {columns.map((col, colIdx) => (
                                                <td key={colIdx} className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-400">
                                                    {row[col] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                return <span className="text-slate-400 italic">لا توجد بيانات</span>;
                
            case 'tasks_matrix':
                if (typeof value === 'object' && value !== null) {
                    return (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 shadow-inner">
                            <div className="grid grid-cols-[1fr_2fr] bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/50">
                                <div className="px-5 py-3 font-black text-slate-700 dark:text-slate-300">المهام / الأعمال</div>
                                <div className="px-5 py-3 font-black text-slate-700 dark:text-slate-300">التفاصيل والسبب</div>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {Object.entries(value).map(([task, details], idx) => (
                                    <div key={idx} className="grid grid-cols-[1fr_2fr] hover:bg-white/80 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800/60 flex items-center">
                                            {task}
                                        </div>
                                        <div className="px-5 py-4">
                                            {details.status === 'executed' ? (
                                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg">
                                                    <CheckCircle size={16} /> تم التنفيذ
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 w-fit px-3 py-1.5 rounded-lg mb-2">
                                                        <X size={16} /> لم ينفذ
                                                    </div>
                                                    {details.reason && (
                                                        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                                                            <span className="text-slate-400 dark:text-slate-500 mb-1 block text-xs uppercase tracking-wider">السبب:</span>
                                                            {details.reason}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                return <span className="text-slate-400 italic">لا توجد بيانات</span>;
                
            case 'activities_matrix':
                if (Array.isArray(value) && value.length > 0) {
                    return (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 shadow-inner overflow-x-auto">
                            <table className="w-full text-right text-sm min-w-[600px]">
                                <thead className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/50">
                                    <tr>
                                        <th className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300 w-32">التاريخ</th>
                                        <th className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300 w-32">الوقت</th>
                                        <th className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300 w-1/3">نوع النشاط</th>
                                        <th className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300">الملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {value.map((activity, idx) => (
                                        <tr key={idx} className="hover:bg-white/80 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                <div className="flex items-center gap-2"><CalendarIcon size={14} className="text-slate-400" />{activity.date || '-'}</div>
                                            </td>
                                            <td className="px-5 py-4 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                <div className="flex items-center gap-2"><Clock size={14} className="text-slate-400" />{activity.time || '-'}</div>
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">{activity.type || '-'}</td>
                                            <td className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">{activity.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                return <span className="text-slate-400 italic">لا توجد بيانات</span>;
                
            case 'data_source': {
                const source = field.options?.source;
                const columns = Array.isArray(field.options?.columns) ? field.options.columns : [];
                
                const labelsDict = {
                    day: 'اليوم', date: 'التاريخ', teacher_name: 'اسم المعلم', visit_type: 'نوع الزيارة', notes: 'الملاحظات', evaluation: 'التقييم',
                    employee_name: 'اسم الموظف', violation_type: 'نوع المخالفة', violation_date: 'التاريخ', repetition_level: 'مستوى التكرار', action_taken: 'الإجراء', status: 'الحالة', details: 'التفاصيل'
                };

                let sourceRows = [];
                if (Array.isArray(value) && value.length > 0) {
                    sourceRows = value;
                } else {
                    sourceRows = source === 'employee_violations' ? [
                        { employee_name: 'أحمد محمد', violation_type: 'تأخر صباحي', violation_date: '2023-10-15', repetition_level: 'أولى', action_taken: 'إنذار', status: 'مفتوحة', details: 'تأخر 30 دقيقة' },
                        { employee_name: 'سالم عبدالله', violation_type: 'غياب بدون عذر', violation_date: '2023-10-16', repetition_level: 'ثانية', action_taken: 'خصم يوم', status: 'مغلقة', details: 'لم يحضر' }
                    ] : [
                        { day: 'الأحد', date: '2023-10-15', teacher_name: 'أحمد محمد', visit_type: 'توجيهية', evaluation: '95', notes: 'ممتاز', discussed_points: 'تنويع الاستراتيجيات' }
                    ];
                }

                const displayColumns = columns.length > 0 ? columns : Object.keys(sourceRows[0] || {}).filter(k => labelsDict[k]);

                return (
                    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 shadow-inner overflow-x-auto mt-2">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/50">
                                <tr>
                                    {displayColumns.map(col => (
                                        <th key={col} className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300">{labelsDict[col] || col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {sourceRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-white/80 dark:hover:bg-slate-800/30 transition-colors">
                                        {displayColumns.map(col => (
                                            <td key={col} className="px-5 py-4 text-slate-700 dark:text-slate-300">
                                                {col === 'visit_type' || col === 'status' ? (
                                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">{row[col]}</span>
                                                ) : col === 'evaluation' ? (
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">{row[col]}</span>
                                                ) : col === 'teacher_name' || col === 'employee_name' ? (
                                                    <span className="font-bold text-slate-800 dark:text-white">{row[col]}</span>
                                                ) : (
                                                    <span className="font-medium text-slate-600 dark:text-slate-400">{row[col]}</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }

            default:
                return <span className="font-semibold text-slate-800 dark:text-slate-200 text-base">{value}</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <div className="relative bg-slate-50 dark:bg-slate-900 w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10 sticky top-0 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-500/20 shadow-inner">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">معاينة التقرير: {template?.name}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold">هكذا سيبدو التقرير النهائي للإدارة بعد تقديمه</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 md:p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-8">
                        
                        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-[1.5rem] border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">تفاصيل مقدم التقرير</h3>
                                <p className="text-sm text-slate-500 font-semibold">بيانات تجريبية لمعاينة شكل التقرير</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">الاسم: الموظف التجريبي</p>
                                <p className="text-xs text-slate-500 mt-1">تاريخ التقديم: 2026-07-20</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {(template?.fields || []).map((field, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800/50 p-6 rounded-[1.5rem] border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                    <h3 className="text-base font-black text-slate-800 dark:text-slate-200 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
                                        {field.name}
                                    </h3>
                                    <div className="px-2">
                                        {renderFieldValue(field, data[field.name])}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-primary-500/30">
                        إغلاق المعاينة
                    </button>
                </div>
            </div>
        </div>
    );
}
