import React from 'react';
import { Head } from '@inertiajs/react';
import { CheckCircle, AlertOctagon, Calendar, User, BookOpen, Layers } from 'lucide-react';

export default function Verify({ studyPlan, isVerified, verifiedAt }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 font-cairo" dir="rtl">
            <Head title="تحقق من مستند | Smart School" />

            <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                {/* Header Banner */}
                <div className={`p-8 text-center text-white relative overflow-hidden ${isVerified ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    <div className="relative z-10 flex flex-col items-center">
                        {isVerified ? (
                            <>
                                <CheckCircle size={64} className="mb-4 text-emerald-100" />
                                <h1 className="text-3xl font-black mb-2">مستند معتمد ورسمي</h1>
                                <p className="text-emerald-100 font-semibold opacity-90">هذه الخطة الدراسية معتمدة وموثقة من قبل المدرسة</p>
                            </>
                        ) : (
                            <>
                                <AlertOctagon size={64} className="mb-4 text-rose-100" />
                                <h1 className="text-3xl font-black mb-2">مستند غير معتمد</h1>
                                <p className="text-rose-100 font-semibold opacity-90">هذه الخطة الدراسية إما مسودة أو تم رفضها أو تم تعديلها.</p>
                            </>
                        )}
                    </div>
                    {/* Background Pattern */}
                    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon fill="currentColor" points="0,100 100,0 100,100"/>
                    </svg>
                </div>

                {/* Plan Details */}
                <div className="p-8">
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">عنوان الخطة</h2>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{studyPlan.title}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><User size={14}/> إعداد المعلم</h2>
                                <p className="font-bold text-slate-700 dark:text-slate-300">{studyPlan.teacher?.name}</p>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar size={14}/> تاريخ الاعتماد</h2>
                                <p className="font-bold text-slate-700 dark:text-slate-300" dir="ltr">
                                    {isVerified ? new Date(verifiedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '---'}
                                </p>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen size={14}/> المادة</h2>
                                <p className="font-bold text-slate-700 dark:text-slate-300">{studyPlan.subject?.name}</p>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Layers size={14}/> الصف</h2>
                                <p className="font-bold text-slate-700 dark:text-slate-300">{studyPlan.grade?.name}</p>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-bold text-slate-400">
                                    الرقم المرجعي: #{studyPlan.id}
                                </div>
                                <div className="text-xs font-bold text-slate-400">
                                    نظام المدارس الذكية
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <p className="mt-8 text-sm text-slate-400 font-bold">
                تم مسح هذا الرمز عبر تقنية التحقق السريع (QR Code)
            </p>
        </div>
    );
}
