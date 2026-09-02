import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, Calculator, ArrowRight } from 'lucide-react';
import ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';

export default function MonthlyGradesReportView({ division, subject, period, gradeSetting, enrollments, existingGrades }) {
    // 1. Settings
    const isMonthly = period.period_type === 'monthly' || !period.period_type;
    const weeksCount = gradeSetting.weeks_per_month || 4;
    const oralMax = gradeSetting.weekly_oral_max || 5;
    const hwMax = gradeSetting.weekly_homework_max || 5;
    const behaviorMax = gradeSetting.monthly_behavior_max || 10;
    const examMax = gradeSetting.monthly_exam_max || 50;

    const weeksData = isMonthly ? (period.weeks_dates || Array.from({ length: weeksCount }, (_, i) => ({
        name: `الأسبوع ${i + 1}`,
        start_date: null,
        end_date: null
    }))) : [];
    
    const weeks = weeksData.map((_, i) => `week_${i + 1}`);

    const [localGrades] = useState(() => {
        const init = {};
        enrollments.forEach(enrollment => {
            const existing = existingGrades[enrollment.id] || {};
            const weekly = existing.weekly_scores || {};
            const scores = existing.scores || {};
            
            init[enrollment.id] = {
                enrollment_id: enrollment.id,
                weekly: {},
                summary: {
                    behavior: scores.behavior ?? '',
                    monthly_exam: scores.monthly_exam ?? '',
                    note: scores.note ?? ''
                },
                is_submitted: existing.is_submitted || false
            };

            weeks.forEach(w => {
                init[enrollment.id].weekly[w] = {
                    oral: weekly[w]?.oral ?? '',
                    homework: weekly[w]?.homework ?? '',
                    note: weekly[w]?.note ?? ''
                };
            });
        });
        return init;
    });

    const calculateStudentTotals = (studentData) => {
        let oralTotal = 0;
        let hwTotal = 0;
        
        weeks.forEach(w => {
            oralTotal += parseFloat(studentData.weekly[w]?.oral) || 0;
            hwTotal += parseFloat(studentData.weekly[w]?.homework) || 0;
        });

        const behavior = parseFloat(studentData.summary.behavior) || 0;
        const exam = parseFloat(studentData.summary.monthly_exam) || 0;
        const grandTotal = oralTotal + hwTotal + behavior + exam;

        return { oralTotal, hwTotal, behavior, exam, grandTotal };
    };

    const [printSettings, setPrintSettings] = useState(() => {
        const defaultSettings = {
            title: `تقرير درجات ${subject.name} - ${division.grade?.name} (${division.name}) - ${period.month_name}`,
            showKPIs: true,
            showDetails: true,
            orientation: 'landscape',
            ecoMode: false,
            watermark: 'none',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            brandColor: '#2563eb',
        };
        try {
            const saved = localStorage.getItem('MonthlyGradeReportPrintSettings');
            if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {}
        return defaultSettings;
    });

    React.useEffect(() => {
        localStorage.setItem('MonthlyGradeReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                printSettings: JSON.stringify(printSettings)
            });

            const url = route('academic.monthly-grades.report.pdf', {
                division: division.id,
                subject_id: subject.id,
                period: period.id
            }) + '?' + params.toString();
            
            window.location.href = url;
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء طلب الملف.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AdminLayout activeMenu="الدرجات الشهرية">
            <Head title={`تقرير درجات - ${subject.name}`} />

            <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8">
                {/* Header Card */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 dark:bg-primary-500/5 rounded-bl-full -z-10"></div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
                            <Link href={route('academic.monthly-grades.report.index')} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1">
                                تقارير الدرجات <ArrowRight className="w-4 h-4" />
                            </Link>
                            <span className="text-slate-400 dark:text-slate-500">تقرير المادة</span>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800/50 shadow-inner">
                                <Calculator className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
                                {subject.name} - {division.grade?.name} ({division.name})
                            </h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                {period.month_name}
                            </span>
                            الفترة من {String(period.fill_start_date).split('T')[0]} إلى {String(period.fill_end_date).split('T')[0]}
                        </p>
                    </div>
                </div>

                {/* Print Layout Wrap */}
                <ReportPrintLayout 
                    title={printSettings.title} 
                    printSettings={printSettings} 
                    setPrintSettings={setPrintSettings} 
                    onPrint={handlePrint} 
                    onDownloadPdf={handleDownloadPDF} 
                    isGeneratingPdf={isGeneratingPdf} 
                    startDate={String(period.fill_start_date).split('T')[0]} 
                    endDate={String(period.fill_end_date).split('T')[0]}
                >
                    <div className="mb-6 flex flex-col gap-1 items-start text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-transparent print:border-none print:p-0 print:mb-4">
                        <span>المادة: {subject.name}</span>
                        <span>الصف والشعبة: {division.grade?.name} - {division.name}</span>
                        <span>الفترة: {period.month_name} ({String(period.fill_start_date).split('T')[0]} - {String(period.fill_end_date).split('T')[0]})</span>
                    </div>

                    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none">
                        <table className="w-full text-sm text-center">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 print:bg-slate-100 print:border-black">
                                <tr>
                                    <th className="py-4 px-2 font-black text-slate-700 dark:text-slate-300 border-l border-slate-200 print:border-black/20" rowSpan="2">م</th>
                                    <th className="py-4 px-4 font-black text-slate-700 dark:text-slate-300 text-right border-l border-slate-200 print:border-black/20" rowSpan="2">اسم الطالب</th>
                                    
                                    {/* Weeks Headers */}
                                    {weeksData.map((week, idx) => (
                                        <th key={`h-${idx}`} className="py-2 px-2 font-black text-slate-700 dark:text-slate-300 border-l border-slate-200 print:border-black/20" colSpan="3">
                                            {week.name}
                                        </th>
                                    ))}
                                    
                                    {/* Summary Headers */}
                                    <th className="py-2 px-2 font-black text-slate-700 dark:text-slate-300 border-l border-slate-200 print:border-black/20" colSpan="3">ملخص الشهر</th>
                                    <th className="py-4 px-4 font-black text-slate-700 dark:text-slate-300 border-l border-slate-200 print:border-black/20 bg-slate-100/50 print:bg-slate-200/50" rowSpan="2">الإجمالي<br/>النهائي</th>
                                    <th className="py-4 px-4 font-black text-slate-700 dark:text-slate-300 border-l border-slate-200 print:border-black/20" rowSpan="2">ملاحظات</th>
                                </tr>
                                <tr>
                                    {/* Sub-headers for weeks */}
                                    {weeksData.map((_, idx) => (
                                        <React.Fragment key={`subh-${idx}`}>
                                            <th className="py-2 px-2 text-xs font-bold text-slate-500 border-t border-l border-slate-200 print:border-black/20">شفهي</th>
                                            <th className="py-2 px-2 text-xs font-bold text-slate-500 border-t border-l border-slate-200 print:border-black/20">واجب</th>
                                            <th className="py-2 px-2 text-xs font-bold text-slate-700 bg-slate-50 border-t border-l border-slate-200 print:border-black/20">المجموع</th>
                                        </React.Fragment>
                                    ))}
                                    {/* Sub-headers for summary */}
                                    <th className="py-2 px-2 text-xs font-bold text-slate-500 border-t border-l border-slate-200 print:border-black/20">مجموع<br/>الأسابيع</th>
                                    <th className="py-2 px-2 text-xs font-bold text-slate-500 border-t border-l border-slate-200 print:border-black/20">سلوك<br/>ومواظبة</th>
                                    <th className="py-2 px-2 text-xs font-bold text-slate-500 border-t border-l border-slate-200 print:border-black/20">اختبار<br/>شهري</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 print:divide-black/20">
                                {enrollments.length === 0 ? (
                                    <tr>
                                        <td colSpan={weeksData.length * 3 + 7} className="py-12 px-6 text-center text-slate-500 font-bold">
                                            لا يوجد طلاب مسجلين في هذا الفصل.
                                        </td>
                                    </tr>
                                ) : (
                                    enrollments.map((enrollment, index) => {
                                        const data = localGrades[enrollment.id];
                                        const totals = calculateStudentTotals(data);
                                        const weeklyTotal = totals.oralTotal + totals.hwTotal;

                                        return (
                                            <tr key={enrollment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-2 px-2 font-bold text-slate-500 text-xs border-l border-slate-200 print:border-black/20">{index + 1}</td>
                                                <td className="py-2 px-4 text-right border-l border-slate-200 print:border-black/20">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm whitespace-nowrap">
                                                        {enrollment.student?.user?.name}
                                                    </span>
                                                </td>
                                                
                                                {/* Week cells */}
                                                {weeks.map(w => {
                                                    const wTotal = (parseFloat(data.weekly[w]?.oral) || 0) + (parseFloat(data.weekly[w]?.homework) || 0);
                                                    return (
                                                        <React.Fragment key={`${enrollment.id}-${w}`}>
                                                            <td className="py-2 px-2 text-sm border-l border-slate-200 print:border-black/20">{data.weekly[w]?.oral}</td>
                                                            <td className="py-2 px-2 text-sm border-l border-slate-200 print:border-black/20">{data.weekly[w]?.homework}</td>
                                                            <td className="py-2 px-2 text-sm font-bold bg-slate-50/50 border-l border-slate-200 print:border-black/20">{wTotal || ''}</td>
                                                        </React.Fragment>
                                                    );
                                                })}
                                                
                                                {/* Summary cells */}
                                                <td className="py-2 px-2 text-sm font-bold text-slate-700 border-l border-slate-200 print:border-black/20">{weeklyTotal || ''}</td>
                                                <td className="py-2 px-2 text-sm border-l border-slate-200 print:border-black/20">{data.summary.behavior}</td>
                                                <td className="py-2 px-2 text-sm border-l border-slate-200 print:border-black/20">{data.summary.monthly_exam}</td>
                                                <td className="py-2 px-4 text-sm font-black bg-slate-100/50 print:bg-slate-200/50 border-l border-slate-200 print:border-black/20">{totals.grandTotal || ''}</td>
                                                <td className="py-2 px-4 text-xs text-slate-500 text-right truncate max-w-[150px] border-l border-slate-200 print:border-black/20" title={data.summary.note}>
                                                    {data.summary.note}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </ReportPrintLayout>
            </div>
        </AdminLayout>
    );
}
