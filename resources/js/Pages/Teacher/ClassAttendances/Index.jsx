import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Users, Save, CheckCircle, XCircle, Clock, FileText, AlertTriangle, CalendarDays, Search, BookOpen } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function Index({ timetables, filters }) {
    const [selectedTimetable, setSelectedTimetable] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(filters.date || '');

    useEffect(() => {
        if (selectedTimetable) {
            fetchStudents();
        } else {
            setStudents([]);
        }
    }, [selectedTimetable, date]);

    const handleDateChange = (val) => {
        const newDate = val;
        setDate(newDate);
        setSelectedTimetable(null);
        router.get(route('teacher.class-attendances.index'), { date: newDate }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const fetchStudents = async () => {
        const tt = timetables.find(t => t.id == selectedTimetable);
        if (!tt) return;

        setLoading(true);
        try {
            const response = await axios.post(route('teacher.class-attendances.get-students'), {
                division_id: tt.division_id,
                subject_id: tt.subject_id,
                period_id: tt.period_id,
                date: date
            });
            if (response.data.success) {
                setStudents(response.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ أثناء جلب بيانات الطلاب');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, newStatus) => {
        setStudents(students.map(s => s.student_id === studentId ? { ...s, status: newStatus } : s));
    };

    const handleNotesChange = (studentId, notes) => {
        setStudents(students.map(s => s.student_id === studentId ? { ...s, notes } : s));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (students.length === 0) {
            toast.error('لا يوجد طلاب للحفظ');
            return;
        }

        const tt = timetables.find(t => t.id == selectedTimetable);
        if (!tt) return;

        setSaving(true);
        router.post(route('teacher.class-attendances.store'), {
            division_id: tt.division_id,
            subject_id: tt.subject_id,
            period_id: tt.period_id,
            date: date,
            attendances: students.map(s => ({
                student_id: s.student_id,
                status: s.status,
                notes: s.notes
            }))
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                toast.success('تم حفظ تحضير الحصة بنجاح!');
            },
            onError: () => {
                setSaving(false);
                toast.error('حدث خطأ أثناء الحفظ');
            }
        });
    };

    // Calculate Summary
    const summary = {
        present: students.filter(s => s.status === 'present').length,
        absent: students.filter(s => s.status === 'absent').length,
        late: students.filter(s => s.status === 'late').length,
        excused: students.filter(s => s.status === 'excused').length,
    };

    return (
        <AdminLayout activeMenu="تحضير الحصص">
            <Head title="تحضير الحصص | النظام الأكاديمي" />

            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
                
                {/* Premium Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Abstract geometric background lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                            <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
                                <Users size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">تحضير حصصي</h1>
                                <p className="text-sm font-semibold text-primary-700/80 dark:text-primary-300/80 mt-1">سجل غياب وحضور طلابك في الحصص اليومية</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & Timetables Cards */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative z-20">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Date Picker */}
                        <div className="w-full md:w-[350px] shrink-0 border-b md:border-b-0 md:border-l border-slate-100 dark:border-slate-800 pb-6 md:pb-0 md:pl-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <CalendarDays size={20} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white">تاريخ التحضير</h3>
                            </div>
                            <FlatpickrInput 
                                type="date" 
                                value={date} 
                                onChange={handleDateChange}
                                placeholder="اختر تاريخ التحضير..."
                                className="w-full"
                            />
                        </div>
                        
                        {/* Timetable Cards */}
                        <div className="w-full">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <BookOpen size={20} className="text-primary-500" />
                                حصصك لهذا اليوم
                            </h3>
                            
                            {timetables.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {timetables.map(tt => (
                                        <button
                                            key={tt.id}
                                            type="button"
                                            onClick={() => setSelectedTimetable(tt.id)}
                                            className={`text-right p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                                                selectedTimetable === tt.id 
                                                    ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 ring-2 ring-primary-500/20 shadow-md' 
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md'
                                            }`}
                                        >
                                            {selectedTimetable === tt.id && (
                                                <div className="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                                                    محدد
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">الحصة {tt.period?.name}</span>
                                            </div>
                                            <h4 className="font-black text-slate-800 dark:text-white text-lg mb-1">{tt.subject?.name}</h4>
                                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                                {tt.division?.grade?.section?.name} / {tt.division?.grade?.name} - {tt.division?.name}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center">
                                    <AlertTriangle size={32} strokeWidth={1.5} className="opacity-50" />
                                    <span>لا يوجد لديك حصص مسجلة في هذا اليوم.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {selectedTimetable && students.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/50 flex flex-col items-center justify-center relative overflow-hidden shadow-sm group">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-500"><CheckCircle size={64} className="text-emerald-500"/></div>
                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-sm mb-1">{summary.present}</span>
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-800/50 px-3 py-1 rounded-lg">حاضر</span>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-4 border border-rose-100 dark:border-rose-800/50 flex flex-col items-center justify-center relative overflow-hidden shadow-sm group">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-500"><XCircle size={64} className="text-rose-500"/></div>
                            <span className="text-3xl font-black text-rose-600 dark:text-rose-400 drop-shadow-sm mb-1">{summary.absent}</span>
                            <span className="text-xs font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-800/50 px-3 py-1 rounded-lg">غائب</span>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/50 flex flex-col items-center justify-center relative overflow-hidden shadow-sm group">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-500"><Clock size={64} className="text-amber-500"/></div>
                            <span className="text-3xl font-black text-amber-600 dark:text-amber-400 drop-shadow-sm mb-1">{summary.late}</span>
                            <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/50 px-3 py-1 rounded-lg">متأخر</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden shadow-sm group">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-500"><FileText size={64} className="text-slate-500"/></div>
                            <span className="text-3xl font-black text-slate-700 dark:text-slate-300 drop-shadow-sm mb-1">{summary.excused}</span>
                            <span className="text-xs font-black text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-lg">مستأذن</span>
                        </div>
                    </div>
                )}

                {/* Students List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-500 mb-4"></div>
                        <p className="font-bold text-slate-500 dark:text-slate-400 animate-pulse">جاري جلب قائمة الطلاب...</p>
                    </div>
                ) : selectedTimetable && students.length > 0 ? (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in relative z-10">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                            <div className="overflow-x-auto p-4 custom-scrollbar">
                                <table className="w-full text-right border-separate border-spacing-y-2">
                                    <thead>
                                        <tr>
                                            <th className="bg-slate-50 dark:bg-slate-800 p-4 rounded-r-2xl text-slate-500 dark:text-slate-400 font-black text-sm shadow-sm sticky right-0 z-20 border border-slate-200 dark:border-slate-700 border-l-0">
                                                اسم الطالب
                                            </th>
                                            <th className="bg-slate-50 dark:bg-slate-800 p-4 text-center text-slate-500 dark:text-slate-400 font-black text-sm shadow-sm border-y border-slate-200 dark:border-slate-700 min-w-[360px]">
                                                حالة الحضور
                                            </th>
                                            <th className="bg-slate-50 dark:bg-slate-800 p-4 rounded-l-2xl text-slate-500 dark:text-slate-400 font-black text-sm shadow-sm border border-slate-200 dark:border-slate-700 border-r-0 min-w-[250px]">
                                                الملاحظات
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(student => (
                                            <tr key={student.student_id} className="group">
                                                <td className="bg-white dark:bg-slate-900 p-4 rounded-r-2xl sticky right-0 z-10 border border-slate-100 dark:border-slate-800 border-l-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 transition-colors">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-[15px] text-slate-800 dark:text-white drop-shadow-sm">{student.name}</span>
                                                        {student.daily_status === 'absent' && (
                                                            <div className="flex items-center gap-1 text-[10px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded-lg w-max border border-rose-100 dark:border-rose-500/20">
                                                                <AlertTriangle size={10} /> غائب في التحضير الصباحي
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="bg-white dark:bg-slate-900 p-4 text-center border-y border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 transition-colors">
                                                    <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700">
                                                        <label className={`
                                                            relative cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 overflow-hidden
                                                            ${student.status === 'present' 
                                                                ? 'bg-emerald-500 text-white shadow-md border border-emerald-400' 
                                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 border border-transparent'}
                                                        `}>
                                                            <input 
                                                                type="radio" 
                                                                name={`status_${student.student_id}`} 
                                                                value="present" 
                                                                className="sr-only" 
                                                                checked={student.status === 'present'}
                                                                onChange={() => handleStatusChange(student.student_id, 'present')}
                                                            />
                                                            <CheckCircle size={14} className={student.status === 'present' ? 'animate-[bounce_0.5s_ease-out]' : ''} />
                                                            <span>حاضر</span>
                                                            {student.status === 'present' && <div className="absolute inset-0 bg-white/20 opacity-0 active:opacity-100 transition-opacity"></div>}
                                                        </label>

                                                        <label className={`
                                                            relative cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 overflow-hidden
                                                            ${student.status === 'absent' 
                                                                ? 'bg-rose-500 text-white shadow-md border border-rose-400' 
                                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 border border-transparent'}
                                                        `}>
                                                            <input 
                                                                type="radio" 
                                                                name={`status_${student.student_id}`} 
                                                                value="absent" 
                                                                className="sr-only"
                                                                checked={student.status === 'absent'}
                                                                onChange={() => handleStatusChange(student.student_id, 'absent')}
                                                            />
                                                            <XCircle size={14} className={student.status === 'absent' ? 'animate-[bounce_0.5s_ease-out]' : ''} />
                                                            <span>غائب</span>
                                                            {student.status === 'absent' && <div className="absolute inset-0 bg-white/20 opacity-0 active:opacity-100 transition-opacity"></div>}
                                                        </label>

                                                        <label className={`
                                                            relative cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 overflow-hidden
                                                            ${student.status === 'late' 
                                                                ? 'bg-amber-500 text-white shadow-md border border-amber-400' 
                                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 border border-transparent'}
                                                        `}>
                                                            <input 
                                                                type="radio" 
                                                                name={`status_${student.student_id}`} 
                                                                value="late" 
                                                                className="sr-only"
                                                                checked={student.status === 'late'}
                                                                onChange={() => handleStatusChange(student.student_id, 'late')}
                                                            />
                                                            <Clock size={14} className={student.status === 'late' ? 'animate-[bounce_0.5s_ease-out]' : ''} />
                                                            <span>متأخر</span>
                                                            {student.status === 'late' && <div className="absolute inset-0 bg-white/20 opacity-0 active:opacity-100 transition-opacity"></div>}
                                                        </label>

                                                        <label className={`
                                                            relative cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 overflow-hidden
                                                            ${student.status === 'excused' 
                                                                ? 'bg-slate-600 text-white shadow-md border border-slate-500' 
                                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 border border-transparent'}
                                                        `}>
                                                            <input 
                                                                type="radio" 
                                                                name={`status_${student.student_id}`} 
                                                                value="excused" 
                                                                className="sr-only"
                                                                checked={student.status === 'excused'}
                                                                onChange={() => handleStatusChange(student.student_id, 'excused')}
                                                            />
                                                            <FileText size={14} className={student.status === 'excused' ? 'animate-[bounce_0.5s_ease-out]' : ''} />
                                                            <span>مستأذن</span>
                                                            {student.status === 'excused' && <div className="absolute inset-0 bg-white/20 opacity-0 active:opacity-100 transition-opacity"></div>}
                                                        </label>
                                                    </div>
                                                </td>
                                                <td className="bg-white dark:bg-slate-900 p-4 rounded-l-2xl border border-slate-100 dark:border-slate-800 border-r-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 transition-colors">
                                                    <div className="relative group/input">
                                                        <input 
                                                            type="text" 
                                                            placeholder="أضف ملاحظة..." 
                                                            value={student.notes || ''}
                                                            onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                                                            className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Sticky Save Button */}
                        <div className="sticky bottom-6 z-30 flex justify-center mt-8">
                            <button
                                type="submit"
                                disabled={saving}
                                className="group relative overflow-hidden flex items-center gap-3 bg-gradient-to-l from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/30 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-xl w-full md:w-auto min-w-[300px] justify-center"
                            >
                                <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-right duration-500"></div>
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white relative z-10"></div>
                                        <span className="relative z-10">جاري الحفظ...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={24} className="relative z-10" />
                                        <span className="relative z-10 tracking-wide">حفظ بيانات الحضور</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : selectedTimetable && !loading ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-16 text-center relative overflow-hidden animate-scale-in">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner transform -rotate-6">
                                <Users size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">لا يوجد طلاب مسجلين</h3>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-sm mx-auto">لم يتم العثور على أي طلاب في هذه الشعبة، يرجى التأكد من التسجيل.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-16 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-primary-50 dark:bg-primary-500/10 text-primary-300 dark:text-primary-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner transform rotate-3">
                                <Search size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">في انتظار اختيار الحصة</h3>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-sm mx-auto">قم باختيار الحصة من القائمة أعلاه لعرض قائمة الطلاب وتسجيل حضورهم.</p>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
