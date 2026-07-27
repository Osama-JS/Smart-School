import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { FileText, Printer, ArrowRight, User } from 'lucide-react';

export default function StudentGradeReport({ student, enrollment, reportData }) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <AdminLayout activeMenu="الطلاب المسجلين">
            <Head title={`كشف درجات | ${student.user?.name}`} />

            <div className="max-w-5xl mx-auto space-y-6 sm:px-6 lg:px-8 pb-10">
                {/* Header (No Print) */}
                <div className="print:hidden bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('academic.students')} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center transition-colors">
                            <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </Link>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">كشف درجات الطالب</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">سجل متكامل للعام الدراسي</p>
                        </div>
                    </div>
                    <button onClick={handlePrint} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-500/30">
                        <Printer className="w-5 h-5" />
                        طباعة الكشف
                    </button>
                </div>

                {/* Printable Area */}
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/60 print:shadow-none print:border-none print:p-0">
                    
                    {/* Report Header */}
                    <div className="border-b-4 border-primary-600 pb-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-right">
                            <h1 className="text-3xl font-black text-slate-800 mb-2">كشف درجات تفصيلي</h1>
                            <p className="text-lg text-slate-600 font-bold">{enrollment.academicYear?.name}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[250px]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-bold">اسم الطالب</p>
                                    <p className="text-lg font-black text-slate-800">{student.user?.name}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                                <div>
                                    <p className="text-xs text-slate-500 font-bold">الصف</p>
                                    <p className="font-bold text-slate-800">{enrollment.division?.grade?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold">الشعبة</p>
                                    <p className="font-bold text-slate-800">{enrollment.division?.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subjects Loop */}
                    <div className="space-y-12">
                        {reportData.map((subject) => (
                            <div key={subject.id} className="break-inside-avoid">
                                <div className="bg-slate-800 text-white px-6 py-3 rounded-t-2xl font-black text-xl flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-primary-400" />
                                    {subject.name}
                                </div>

                                <div className="border-x border-b border-slate-200 rounded-b-2xl p-6 space-y-8">
                                    
                                    {Object.values(subject.semesters).map((semester) => (
                                        <div key={semester.name} className="space-y-4">
                                            <h3 className="font-black text-lg text-primary-700 border-b border-primary-100 pb-2 flex justify-between items-end">
                                                <span>{semester.name}</span>
                                                {semester.result && (
                                                    <span className="text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded-lg">
                                                        إجمالي الفصل: <span className="text-lg font-black ml-1">{semester.result.semester_total} / 50</span>
                                                    </span>
                                                )}
                                            </h3>

                                            {/* Months */}
                                            {semester.months.length === 0 ? (
                                                <p className="text-slate-400 font-bold text-sm">لا توجد درجات شهرية مسجلة.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {semester.months.map((month) => (
                                                        <div key={month.month_name} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <h4 className="font-bold text-slate-700">{month.month_name}</h4>
                                                                <span className="text-xs font-bold px-2 py-1 bg-slate-200 text-slate-600 rounded">
                                                                    إجمالي الشهر: {month.scores?.grand_total ?? '-'}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-4 gap-2 text-center text-sm">
                                                                <div className="bg-white py-2 rounded border border-slate-100">
                                                                    <div className="text-slate-500 text-xs">الشفهي</div>
                                                                    <div className="font-bold text-slate-800">{month.scores?.oral_total ?? '-'} / {subject.settings?.weekly_oral_max * subject.settings?.weeks_per_month}</div>
                                                                </div>
                                                                <div className="bg-white py-2 rounded border border-slate-100">
                                                                    <div className="text-slate-500 text-xs">الواجبات</div>
                                                                    <div className="font-bold text-slate-800">{month.scores?.homework_total ?? '-'} / {subject.settings?.weekly_homework_max * subject.settings?.weeks_per_month}</div>
                                                                </div>
                                                                <div className="bg-white py-2 rounded border border-slate-100">
                                                                    <div className="text-slate-500 text-xs">السلوك</div>
                                                                    <div className="font-bold text-slate-800">{month.scores?.behavior ?? '-'} / {subject.settings?.monthly_behavior_max}</div>
                                                                </div>
                                                                <div className="bg-white py-2 rounded border border-slate-100">
                                                                    <div className="text-slate-500 text-xs">الاختبار</div>
                                                                    <div className="font-bold text-slate-800">{month.scores?.monthly_exam ?? '-'} / {subject.settings?.monthly_exam_max}</div>
                                                                </div>
                                                            </div>
                                                            
                                                            {month.scores?.note && (
                                                                <div className="mt-3 bg-amber-50 border border-amber-100 rounded p-2 text-sm text-amber-800">
                                                                    <span className="font-bold">ملاحظة:</span> {month.scores.note}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Semester Result Summary */}
                                            {semester.result && (
                                                <div className="bg-primary-50 rounded-xl p-4 border border-primary-100 flex justify-around items-center">
                                                    <div className="text-center">
                                                        <p className="text-xs text-primary-600 font-bold">المحصلة الفصلية</p>
                                                        <p className="font-black text-primary-900 text-lg">{semester.result.monthly_aggregate} / {subject.settings?.semester_aggregate_max}</p>
                                                    </div>
                                                    <div className="w-px h-10 bg-primary-200"></div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-primary-600 font-bold">اختبار نهاية الفصل</p>
                                                        <p className="font-black text-primary-900 text-lg">{semester.result.final_exam_score} / {subject.settings?.final_exam_max}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Yearly Total */}
                                    <div className="bg-slate-800 text-white p-4 rounded-xl flex justify-between items-center mt-4">
                                        <span className="font-bold">الدرجة النهائية السنوية (المجموع العام)</span>
                                        <span className="text-2xl font-black bg-slate-700 px-4 py-1 rounded-lg">
                                            {subject.yearly_total} <span className="text-base font-normal text-slate-400">/ 100</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {reportData.length === 0 && (
                            <div className="text-center py-12 text-slate-500 font-bold">
                                لم يتم العثور على مواد أو درجات مسجلة للطالب في هذه السنة الدراسية.
                            </div>
                        )}
                    </div>
                    
                </div>

                <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                        body { background-color: white !important; }
                        .print\\:hidden { display: none !important; }
                        .print\\:shadow-none { box-shadow: none !important; }
                        .print\\:border-none { border: none !important; }
                        .print\\:p-0 { padding: 0 !important; }
                    }
                `}} />
            </div>
        </AdminLayout>
    );
}
