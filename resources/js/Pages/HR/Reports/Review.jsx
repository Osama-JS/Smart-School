import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { CheckCircle, CornerUpLeft, ArrowRight, User, Calendar, Briefcase, FileText, Download, Image as ImageIcon, Eye, File, Clock, AlertCircle } from 'lucide-react';

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
                    <div className="mt-2">
                        <a href={`/storage/${value}`} target="_blank" rel="noreferrer" className="group relative block w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 transition-all shadow-sm hover:shadow-lg">
                            <img src={`/storage/${value}`} alt="مرفق" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                <Eye size={24} className="mb-2" />
                                <span className="font-bold text-sm">عرض الصورة</span>
                            </div>
                        </a>
                    </div>
                );
            case 'file':
                return (
                    <a href={`/storage/${value}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group w-fit sm:pr-8">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <File size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">تحميل الملف المرفق</p>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Download size={12}/> انقر للتنزيل والمشاهدة</p>
                        </div>
                    </a>
                );
            case 'matrix_text':
                if (typeof value === 'object' && value !== null) {
                    return (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 shadow-inner">
                            <div className="grid grid-cols-[1fr_2fr] bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/50">
                                <div className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300">البند / المجال</div>
                                <div className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300">الملاحظات</div>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {Object.entries(value).map(([key, val], i) => (
                                    <div key={i} className="grid grid-cols-[1fr_2fr] hover:bg-white/80 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800/60">{key}</div>
                                        <div className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-400">{val || '-'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                return <span>-</span>;
            case 'tasks_matrix':
                if (typeof value === 'object' && value !== null) {
                    return (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 shadow-inner">
                            <div className="grid grid-cols-[2fr_1fr_2fr] bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/50">
                                <div className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300">الأعمال</div>
                                <div className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300 text-center border-x border-slate-200/40 dark:border-slate-700/40">الحالة</div>
                                <div className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300">السبب (إن لم ينفذ)</div>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {Object.entries(value).map(([key, val], i) => {
                                    const isExecuted = val.status === 'executed';
                                    const isNotExecuted = val.status === 'not_executed';
                                    return (
                                        <div key={i} className="grid grid-cols-[2fr_1fr_2fr] hover:bg-white/80 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">{key}</div>
                                            <div className="px-5 py-4 flex justify-center items-center border-x border-slate-100 dark:border-slate-800/60">
                                                {isExecuted ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-black border border-emerald-200 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                                                        <CheckCircle size={14} /> نفذ
                                                    </span>
                                                ) : isNotExecuted ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-black border border-rose-200 dark:border-rose-500/20 shadow-sm shadow-rose-500/10">
                                                        <AlertCircle size={14} /> لم ينفذ
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-bold">-</span>
                                                )}
                                            </div>
                                            <div className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-400">
                                                {isNotExecuted && val.reason ? val.reason : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }
                return <span>-</span>;
            case 'activities_matrix':
                if (Array.isArray(value) && value.length > 0) {
                    return (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 shadow-inner overflow-x-auto">
                            <div className="min-w-[600px] grid grid-cols-[1fr_1fr_2fr_3fr] bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/50">
                                <div className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300 border-l border-slate-200/40 dark:border-slate-700/40">اليوم (الوقت)</div>
                                <div className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300 border-l border-slate-200/40 dark:border-slate-700/40">التأريخ</div>
                                <div className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300 border-l border-slate-200/40 dark:border-slate-700/40">نوع النشاط</div>
                                <div className="px-5 py-3.5 font-black text-slate-700 dark:text-slate-300">الملاحظات</div>
                            </div>
                            <div className="min-w-[600px] divide-y divide-slate-100 dark:divide-slate-800/60">
                                {value.map((activity, idx) => (
                                    <div key={idx} className="grid grid-cols-[1fr_1fr_2fr_3fr] hover:bg-white/80 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400 border-l border-slate-100 dark:border-slate-800/60">{activity.time || '-'}</div>
                                        <div className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400 border-l border-slate-100 dark:border-slate-800/60">{activity.date || '-'}</div>
                                        <div className="px-5 py-4 font-black text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800/60">{activity.type || '-'}</div>
                                        <div className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{activity.notes || '-'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                return <span className="text-slate-400 font-bold">لا توجد أنشطة مدخلة</span>;
            case 'textarea':
                return (
                    <div className="prose dark:prose-invert max-w-none text-base bg-white dark:bg-[#0f141a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm font-medium leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: value }} />
                    </div>
                );
            case 'rating':
                return (
                    <div className="flex gap-2 text-2xl">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`drop-shadow-sm transition-colors ${i < value ? 'text-amber-400 dark:text-amber-500' : 'text-slate-200 dark:text-slate-800'}`}>
                                ★
                            </span>
                        ))}
                    </div>
                );
            default:
                return <span className="text-slate-800 dark:text-slate-200 font-bold text-base">{value}</span>;
        }
    };

    return (
        <AdminLayout activeMenu="التقارير" user={auth.user}>
            <Head title="تفاصيل التقرير" />

            <div className="py-12" style={{ direction: 'rtl' }}>
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="relative overflow-hidden bg-white dark:bg-dark-900 border border-dark-200/60 dark:border-dark-800 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-dark-200/20 dark:shadow-none">
                        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div className="relative z-10">
                            <Link href={route('reports.index')} className="inline-flex items-center gap-2 text-sm font-bold text-dark-500 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors mb-6 bg-dark-50 dark:bg-dark-800/50 hover:bg-dark-100 dark:hover:bg-dark-700 px-4 py-2 rounded-xl border border-dark-200/50 dark:border-dark-700 w-fit backdrop-blur-sm">
                                <ArrowRight size={16} /> العودة للقائمة
                            </Link>
                            
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800 shadow-primary-500/10">
                                            <FileText size={14} /> استعراض وتقييم
                                        </span>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black text-dark-900 dark:text-white tracking-tight mb-2 leading-tight">
                                        تفاصيل ومراجعة التقرير
                                    </h1>
                                    <p className="text-dark-500 dark:text-dark-400 font-bold text-sm">
                                        يمكنك مراجعة كافة البيانات المدخلة وتقييم التقرير
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Report Meta Data (Smart Widgets) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-[2rem] border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform"><User size={24} /></div>
                                <div>
                                    <p className="text-xs font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-1.5">مقدم التقرير</p>
                                    <p className="font-black text-dark-900 dark:text-white text-sm line-clamp-1">{report.submitter?.name}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-[2rem] border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform"><Briefcase size={24} /></div>
                                <div>
                                    <p className="text-xs font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-1.5">الدرجة الوظيفية</p>
                                    <p className="font-black text-dark-900 dark:text-white text-sm line-clamp-1">{report.submitter?.employee?.job_grade?.name || '-'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-[2rem] border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform"><Calendar size={24} /></div>
                                <div>
                                    <p className="text-xs font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-1.5">تاريخ التقديم</p>
                                    <p className="font-black text-dark-900 dark:text-white text-sm">{new Date(report.created_at).toLocaleDateString('ar-EG')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-[2rem] border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                                <div>
                                    <p className="text-xs font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-1.5">اسم القالب</p>
                                    <p className="font-black text-dark-900 dark:text-white text-sm line-clamp-1">{report.template?.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Data */}
                    <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] border border-dark-100 dark:border-dark-800 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary-500 to-indigo-500" />
                        
                        <div className="p-6 md:p-10 border-b border-dark-100 dark:border-dark-800/50 bg-dark-50/50 dark:bg-dark-800/30 flex items-center gap-3">
                            <FileText className="text-primary-500" size={24} />
                            <h3 className="text-xl font-black text-dark-900 dark:text-white">تفاصيل التقرير المدخلة</h3>
                        </div>
                        <div className="p-6 md:p-10 space-y-8">
                            {report.template?.fields?.sort((a,b) => a.order - b.order).map((field, idx) => (
                                <div key={field.id} className="relative group/field border-b border-dark-100 dark:border-dark-800/50 pb-8 last:border-0 last:pb-0">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-dark-50 dark:bg-dark-800 text-dark-400 dark:text-dark-500 flex items-center justify-center shrink-0 font-bold text-sm mt-0.5 border border-dark-200/60 dark:border-dark-700">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 w-full overflow-hidden">
                                            <h4 className="text-base font-black text-dark-900 dark:text-dark-200 mb-4">{field.name}</h4>
                                            <div className="bg-dark-50/50 dark:bg-dark-800/30 p-5 rounded-2xl border border-dark-100 dark:border-dark-800/60 shadow-inner overflow-x-auto w-full">
                                                {renderFieldValue(field, report.data ? report.data[field.name] : null)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Manager Review Action */}
                    {(report.reviewer_id === null || report.status === 'pending') && auth.user.id !== report.submitter_id ? (
                        <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] border border-primary-200 dark:border-primary-900/50 shadow-2xl shadow-primary-500/10 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500"></div>
                            <div className="p-6 md:p-10 border-b border-dark-100 dark:border-dark-800/50 flex items-center gap-3">
                                <AlertCircle className="text-primary-500" size={24} />
                                <h3 className="text-xl font-black text-dark-900 dark:text-white">إجراءات المراجعة (للمدير)</h3>
                            </div>
                            <div className="p-6 md:p-10">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div>
                                        <label className="block text-base font-black text-dark-900 dark:text-dark-200 mb-4">قرار المراجعة <span className="text-rose-500">*</span></label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <label className={`relative flex items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all ${data.status === 'reviewed' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-800 dark:text-emerald-400 shadow-md shadow-emerald-500/10' : 'bg-dark-50 dark:bg-dark-900 border-dark-200 dark:border-dark-700 text-dark-600 dark:text-dark-400 hover:border-emerald-300 dark:hover:border-emerald-700'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="status" 
                                                    value="reviewed" 
                                                    checked={data.status === 'reviewed'} 
                                                    onChange={e => setData('status', e.target.value)}
                                                    className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-dark-300 dark:border-dark-600"
                                                />
                                                <span className="font-bold flex items-center gap-2 text-base"><CheckCircle size={20} className={data.status === 'reviewed' ? 'text-emerald-500' : 'text-dark-400'}/> اعتماد التقرير</span>
                                            </label>
                                            
                                            <label className={`relative flex items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all ${data.status === 'returned' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-800 dark:text-rose-400 shadow-md shadow-rose-500/10' : 'bg-dark-50 dark:bg-dark-900 border-dark-200 dark:border-dark-700 text-dark-600 dark:text-dark-400 hover:border-rose-300 dark:hover:border-rose-700'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="status" 
                                                    value="returned" 
                                                    checked={data.status === 'returned'} 
                                                    onChange={e => setData('status', e.target.value)}
                                                    className="w-5 h-5 text-rose-600 focus:ring-rose-500 border-dark-300 dark:border-dark-600"
                                                />
                                                <span className="font-bold flex items-center gap-2 text-base"><CornerUpLeft size={20} className={data.status === 'returned' ? 'text-rose-500' : 'text-dark-400'}/> إعادة التقرير للموظف</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-base font-black text-dark-900 dark:text-dark-200 mb-3">ملاحظات المدير <span className="text-dark-400 font-normal text-sm">(اختياري)</span></label>
                                        <textarea 
                                            value={data.manager_notes}
                                            onChange={e => setData('manager_notes', e.target.value)}
                                            className="w-full bg-dark-50 dark:bg-dark-800/50 border border-dark-200 dark:border-dark-800 rounded-2xl px-5 py-4 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all shadow-inner font-semibold dark:text-white"
                                            rows="4"
                                            placeholder="اكتب ملاحظاتك وأسباب إعادة التقرير (إن وجدت) هنا..."
                                        ></textarea>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                                        <button 
                                            type="submit" 
                                            disabled={processing}
                                            className="w-full sm:w-auto px-10 py-4 rounded-2xl font-black bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 hover:-translate-y-0.5 active:scale-95 text-lg"
                                        >
                                            حفظ التقييم وإرسال
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] border border-dark-200/50 dark:border-dark-800 shadow-xl overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-dark-100 dark:border-dark-800/50 flex items-center gap-3 bg-dark-50/50 dark:bg-dark-800/30">
                                <CheckCircle className="text-emerald-500" size={24} />
                                <h3 className="text-xl font-black text-dark-900 dark:text-white">حالة ونتيجة المراجعة</h3>
                            </div>
                            
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="flex items-center gap-4 bg-dark-50 dark:bg-dark-800/50 p-5 rounded-2xl border border-dark-100 dark:border-dark-800/60 shadow-sm">
                                    <span className="text-base font-bold text-dark-600 dark:text-dark-400">حالة التقرير:</span>
                                    {report.status === 'reviewed' ? (
                                        <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-sm font-black border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5"><CheckCircle size={16}/> تم الاعتماد</span>
                                    ) : report.status === 'returned' ? (
                                        <span className="bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-4 py-1.5 rounded-full text-sm font-black border border-rose-200 dark:border-rose-500/20 flex items-center gap-1.5"><CornerUpLeft size={16}/> مُعاد للتعديل</span>
                                    ) : (
                                        <span className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-4 py-1.5 rounded-full text-sm font-black border border-yellow-200 dark:border-yellow-500/20 flex items-center gap-1.5"><Clock size={16}/> قيد المراجعة</span>
                                    )}
                                </div>
                                
                                {report.manager_notes && (
                                    <div className="bg-dark-50 dark:bg-dark-800/50 p-6 rounded-2xl border border-dark-100 dark:border-dark-800/60 shadow-sm">
                                        <span className="text-base font-bold text-dark-800 dark:text-white mb-3 flex items-center gap-2"><User size={18} className="text-dark-400"/> ملاحظات المشرف / المدير:</span>
                                        <div className="bg-white dark:bg-dark-900/50 p-5 rounded-xl border border-dark-200 dark:border-dark-700 text-base text-dark-700 dark:text-dark-300 leading-relaxed shadow-inner font-medium">
                                            {report.manager_notes}
                                        </div>
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
