import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import { FileText, Calendar, CheckCircle2, Clock, UserX, UserCheck, AlertTriangle, Printer, Loader2, Download } from 'lucide-react';
import axios from 'axios';

export default function AttendanceReport({ employees, academicYears = [], isAdmin }) {
    const defaultYear = academicYears.find(y => y.is_active) || academicYears[0];
    const defaultSemester = defaultYear?.semesters?.find(s => s.is_active) || defaultYear?.semesters?.[0];

    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedAcademicYear, setSelectedAcademicYear] = useState(defaultYear?.id || '');
    const [selectedSemester, setSelectedSemester] = useState(defaultSemester?.id || '');
    
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    const months = [
        { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' },
        { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' },
        { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' },
        { value: 10, label: 'أكتوبر' }, { value: 11, label: 'نوفمبر' }, { value: 12, label: 'ديسمبر' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 5}, (_, i) => ({ value: currentYear - i, label: (currentYear - i).toString() }));

    const fetchReport = async () => {
        if (!selectedEmployee) return;
        setLoading(true);
        try {
            let params = { month: selectedMonth, year: selectedYear };
            if (selectedSemester) params.semester_id = selectedSemester;
            
            let url = route('hr.attendance.employee-report', { employeeId: selectedEmployee, ...params });

            const res = await axios.get(url);
            if (res.data.success) {
                setReportData(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedEmployee) {
            fetchReport();
        }
    }, [selectedEmployee, selectedMonth, selectedYear, selectedSemester]);

    const getArabicDayName = (dayOfWeek) => {
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return days[dayOfWeek];
    };

    const StatusBadge = ({ status }) => {
        const map = {
            present: { label: 'حاضر', bg: 'bg-emerald-100 text-emerald-700', icon: UserCheck },
            late: { label: 'متأخر', bg: 'bg-warning-100 text-warning-700', icon: Clock },
            absent: { label: 'غائب', bg: 'bg-rose-100 text-rose-700', icon: UserX },
            excused: { label: 'بعذر', bg: 'bg-slate-100 text-slate-700', icon: AlertTriangle },
            holiday: { label: 'إجازة رسمية', bg: 'bg-indigo-100 text-indigo-700', icon: Calendar },
            leave: { label: 'إجازة خاصة', bg: 'bg-purple-100 text-purple-700', icon: FileText },
            weekend: { label: 'إجازة أسبوعية', bg: 'bg-slate-100 text-slate-500', icon: Calendar },
            out_of_term: { label: 'خارج الفترة الأكاديمية', bg: 'bg-slate-200 text-slate-600', icon: Calendar },
            future: { label: 'لم يحن', bg: 'bg-slate-50 text-slate-400', icon: Clock },
        };
        const s = map[status] || map.absent;
        const Icon = s.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.bg} w-max`}>
                <Icon size={14} />
                {s.label}
            </span>
        );
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AdminLayout activeMenu="كشف الحضور الشهري">
            <Head title="كشف الحضور الشهري" />

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    aside, nav, header, .no-print, button, a, [type="checkbox"], select, input, .print\\:hidden, .custom-scrollbar {
                        display: none !important;
                    }
                    main, .print\\:w-full {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body {
                        background-color: white !important;
                        color: black !important;
                    }
                    .print\\:block { display: block !important; }
                    /* Make table text black for better printing */
                    table { color: black !important; border-collapse: collapse !important; width: 100% !important; }
                    th, td { border: 1px solid #ddd !important; padding: 12px !important; text-align: right !important; color: black !important; }
                    th { background-color: #f8fafc !important; font-weight: bold !important; }
                    
                    /* Summary cards for print */
                    .print-break { page-break-inside: avoid; }
                    .print-border-solid { border: 1px solid #ddd !important; }
                }
            `}} />

            {/* Print Only Header Banner */}
            <div className="hidden print:block mb-8 text-right font-sans" dir="rtl">
                <div className="flex items-center justify-between border-b-2 border-primary-600 pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-black text-dark-900">مدارس القيم الأهلية</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-1">كشف الحضور الشهري</p>
                        {selectedEmployee && (
                            <p className="text-sm text-dark-900 font-bold mt-2">
                                الموظف: {employees.find(e => e.id == selectedEmployee)?.first_name} {employees.find(e => e.id == selectedEmployee)?.last_name}
                            </p>
                        )}
                    </div>
                    <div className="text-left font-semibold">
                        <p className="text-xs text-slate-500 mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                        <p className="text-xs text-slate-500 mt-1">عن شهر: {selectedMonth} / {selectedYear}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px] no-print">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Visual geometric lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight flex items-center gap-3">
                                <FileText className="text-primary-500" size={32} />
                                كشف الحضور الشهري
                            </h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">عرض كشف مفصل يشمل أيام الدوام والإجازات</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            {reportData && (
                                <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none text-sm font-bold transition-all active:scale-95">
                                    <Printer size={18} />
                                    <span>طباعة التقرير</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm no-print">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اختر الموظف <span className="text-accent-500">*</span></label>
                            <SelectInput
                                options={employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name} (${e.employee_number || ''})` }))}
                                value={employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` })).find(o => o.value == selectedEmployee) || null}
                                onChange={(selected) => setSelectedEmployee(selected || '')}
                                placeholder="ابحث عن الموظف..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">السنة الدراسية</label>
                            <SelectInput
                                options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                                value={academicYears.map(y => ({ value: y.id, label: y.name })).find(o => o.value == selectedAcademicYear) || null}
                                onChange={(val) => {
                                    setSelectedAcademicYear(val || '');
                                    setSelectedSemester('');
                                }}
                                placeholder="اختر السنة الدراسية"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الفصل الدراسي</label>
                            <SelectInput
                                options={(academicYears.find(y => y.id == selectedAcademicYear)?.semesters || []).map(s => ({ value: s.id, label: s.name }))}
                                value={(academicYears.find(y => y.id == selectedAcademicYear)?.semesters || []).map(s => ({ value: s.id, label: s.name })).find(o => o.value == selectedSemester) || null}
                                onChange={(val) => setSelectedSemester(val || '')}
                                placeholder="اختر الفصل الدراسي"
                                disabled={!selectedAcademicYear}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الشهر</label>
                            <SelectInput
                                options={months}
                                value={months.find(o => o.value == selectedMonth) || null}
                                onChange={(selected) => setSelectedMonth(selected || selectedMonth)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">السنة المیلادية</label>
                            <SelectInput
                                options={years}
                                value={years.find(o => o.value == selectedYear) || null}
                                onChange={(selected) => setSelectedYear(selected || selectedYear)}
                            />
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <Loader2 className="animate-spin text-primary-500 mb-4" size={40} />
                        <p className="text-slate-500 font-bold">جاري جلب بيانات التقرير...</p>
                    </div>
                )}

                {/* Report Content */}
                {!loading && reportData && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print-break mb-6">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 print-border-solid">
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 print:text-black mb-1">أيام الحضور</p>
                                <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 print:text-black">{reportData.summary.present}</h3>
                            </div>
                            <div className="bg-warning-50 dark:bg-warning-900/20 p-5 rounded-2xl border border-warning-100 dark:border-warning-800/30 print-border-solid">
                                <p className="text-xs font-bold text-warning-600 dark:text-warning-400 print:text-black mb-1">حضور بتأخير</p>
                                <h3 className="text-2xl font-black text-warning-700 dark:text-warning-300 print:text-black">{reportData.summary.late}</h3>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-900/20 p-5 rounded-2xl border border-rose-100 dark:border-rose-800/30 print-border-solid">
                                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 print:text-black mb-1">أيام الغياب</p>
                                <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300 print:text-black">{reportData.summary.absent}</h3>
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 print-border-solid">
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 print:text-black mb-1">الإجازات المستهلكة (رسمية وخاصة)</p>
                                <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-300 print:text-black">{reportData.summary.holiday + reportData.summary.leave}</h3>
                            </div>
                        </div>

                        {/* Detailed Table */}
                        <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden print-break print:border-none print:shadow-none print:rounded-none">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                            <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">التاريخ</th>
                                            <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">اليوم</th>
                                            <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الحالة</th>
                                            <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الدخول / الخروج</th>
                                            <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">التأخير (دقائق)</th>
                                            <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">ملاحظات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {reportData.records.map((record, index) => (
                                            <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="py-4 px-6 font-mono text-sm text-dark-900 dark:text-white">
                                                    {record.date}
                                                </td>
                                                <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-bold text-sm">
                                                    {getArabicDayName(record.day_of_week)}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <StatusBadge status={record.status} />
                                                </td>
                                                <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-mono text-sm">
                                                    {record.attendance ? (
                                                        <>{record.attendance.check_in || '-'} / {record.attendance.check_out || '-'}</>
                                                    ) : '-'}
                                                </td>
                                                <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-mono text-sm">
                                                    {record.attendance?.late_minutes > 0 ? (
                                                        <span className="text-warning-600">{record.attendance.late_minutes}</span>
                                                    ) : '-'}
                                                </td>
                                                <td className="py-4 px-6 text-slate-500 text-sm max-w-[200px] truncate">
                                                    {record.notes || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Empty State */}
                {!loading && !reportData && !selectedEmployee && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 text-center no-print">
                        <UserCheck className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-2">اختر موظفاً لعرض الكشف</h3>
                        <p className="text-slate-500 max-w-md">يرجى تحديد الموظف من القائمة العلوية لعرض الكشف الشهري المفصل للحضور والانصراف.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

