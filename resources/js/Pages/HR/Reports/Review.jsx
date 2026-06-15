import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { CheckCircle, CornerUpLeft, ArrowRight, User, Calendar, Briefcase, FileText } from 'lucide-react';

export default function ReviewReport({ auth, report }) {
    const { data, setData, post, processing, errors } = useForm({
        status: report.status === 'pending' ? 'reviewed' : report.status,
        manager_notes: report.manager_notes || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('reports.review', report.id));
    };

    const renderFieldValue = (field, value) => {
        if (value === null || value === undefined || value === '') {
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
                    <a href={`/storage/${value}`} target="_blank" rel="noreferrer" className="block w-48 h-48 rounded-xl overflow-hidden border border-slate-200 hover:border-primary-500 transition-colors">
                        <img src={`/storage/${value}`} alt="مرفق" className="w-full h-full object-cover" />
                    </a>
                );
            case 'matrix_text':
                if (typeof value === 'object' && value !== null) {
                    return (
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl mt-2">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 w-1/3">البند / المجال</th>
                                        <th className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300">الملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
                                    {Object.entries(value).map(([key, val], i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">{key}</td>
                                            <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{val || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                return <span>{String(value)}</span>;
            case 'textarea':
                return <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: value }} />;
            case 'rating':
                return (
                    <div className="flex gap-1 text-yellow-400 text-lg">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < value ? '' : 'text-slate-200 dark:text-slate-700'}>★</span>
                        ))}
                    </div>
                );
            default:
                return <span className="text-slate-800 dark:text-slate-200">{value}</span>;
        }
    };

    return (
        <AdminLayout activeMenu="التقارير">
            <Head title="مراجعة التقرير" />

            <div className="py-12" style={{ direction: 'rtl' }}>
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="flex items-center gap-4">
                        <Link href={route('reports.index')} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowRight size={24} />
                        </Link>
                        <h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 leading-tight">
                            مراجعة التقرير
                        </h2>
                    </div>
                    
                    {/* Report Meta Data */}
                    <div className="bg-white dark:bg-[#121820] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">مقدم التقرير</p>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">{report.submitter?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">الدرجة الوظيفية</p>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">{report.submitter?.employee?.job_grade?.name || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">تاريخ التقديم</p>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">{new Date(report.created_at).toLocaleDateString('ar-EG')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">اسم القالب</p>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">{report.template?.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Report Data */}
                    <div className="bg-white dark:bg-[#121820] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">تفاصيل التقرير المدخلة</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            {report.template?.fields?.map(field => (
                                <div key={field.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">{field.name}</h4>
                                    <div className="mt-1">
                                        {renderFieldValue(field, report.data ? report.data[field.name] : null)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Manager Review Action */}
                    {report.reviewer_id === null || report.status === 'pending' ? (
                        <div className="bg-white dark:bg-[#121820] rounded-2xl border border-primary-100 dark:border-primary-900 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary-500 to-indigo-500"></div>
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">إجراءات المراجعة (للمدير)</h3>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">قرار المراجعة</label>
                                        <div className="flex items-center gap-4">
                                            <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${data.status === 'reviewed' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="status" 
                                                    value="reviewed" 
                                                    checked={data.status === 'reviewed'} 
                                                    onChange={e => setData('status', e.target.value)}
                                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                                />
                                                <span className="font-bold flex items-center gap-1"><CheckCircle size={16}/> اعتماد التقرير</span>
                                            </label>
                                            
                                            <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${data.status === 'returned' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="status" 
                                                    value="returned" 
                                                    checked={data.status === 'returned'} 
                                                    onChange={e => setData('status', e.target.value)}
                                                    className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300"
                                                />
                                                <span className="font-bold flex items-center gap-1"><CornerUpLeft size={16}/> إعادة التقرير للموظف</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ملاحظات المدير (اختياري)</label>
                                        <textarea 
                                            value={data.manager_notes}
                                            onChange={e => setData('manager_notes', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            rows="3"
                                            placeholder="اكتب ملاحظاتك على التقرير هنا..."
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button 
                                            type="submit" 
                                            disabled={processing}
                                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                                        >
                                            حفظ التقييم
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">نتائج المراجعة</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">الحالة:</span>
                                    {report.status === 'reviewed' ? (
                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">تم الاعتماد</span>
                                    ) : (
                                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">مُعاد</span>
                                    )}
                                </div>
                                
                                {report.manager_notes && (
                                    <div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400 block mb-1">ملاحظات المدير:</span>
                                        <p className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200">
                                            {report.manager_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AdminLayout>
    );
}
