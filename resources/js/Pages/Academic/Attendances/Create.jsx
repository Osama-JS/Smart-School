import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Users, Save, CheckCircle, XCircle, Clock, FileText, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function Create({ divisions, students: initialStudents, filters }) {
    const [selectedDivision, setSelectedDivision] = useState(filters.division_id || '');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [date, setDate] = useState(filters.date || new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState(initialStudents || []);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setStudents(initialStudents || []);
    }, [initialStudents]);

    // Derived Data for Cascading Dropdowns
    const sections = Array.from(new Set(divisions.map(d => d.grade?.section?.id))).map(id => {
        return divisions.find(d => d.grade?.section?.id === id)?.grade?.section;
    }).filter(Boolean);

    const availableGrades = selectedSection
        ? Array.from(new Set(divisions.filter(d => d.grade?.section?.id === selectedSection).map(d => d.grade?.id))).map(id => {
            return divisions.find(d => d.grade?.id === id)?.grade;
        }).filter(Boolean)
        : Array.from(new Set(divisions.map(d => d.grade?.id))).map(id => {
            return divisions.find(d => d.grade?.id === id)?.grade;
        }).filter(Boolean);

    const availableDivisions = selectedGrade
        ? divisions.filter(d => d.grade_id === selectedGrade)
        : selectedSection
        ? divisions.filter(d => d.grade?.section?.id === selectedSection)
        : divisions;

    const applyFilters = () => {
        if (!selectedDivision) {
            toast.error('الرجاء اختيار الشعبة لعرض الطلاب');
            return;
        }
        
        router.get(route('academic.attendances.create'), { date: date, division_id: selectedDivision }, {
            preserveState: true,
            preserveScroll: true,
            only: ['students', 'filters']
        });
    };

    const handleStatusChange = (studentId, newStatus) => {
        setStudents(students.map(s => s.student_id === studentId ? { ...s, status: newStatus } : s));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (students.length === 0) {
            toast.error('لا يوجد طلاب للحفظ');
            return;
        }

        setSaving(true);
        router.post(route('academic.attendances.store'), {
            division_id: filters.division_id,
            date: filters.date,
            attendances: students.map(s => ({
                student_id: s.student_id,
                status: s.status,
            }))
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                toast.success('تم حفظ سجلات الغياب اليومي بنجاح!');
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

    const getDayName = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(d);
    };

    return (
        <AdminLayout>
            <Head title="التحضير اليومي اليدوي" />

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 justify-between border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                                <Users size={24} className="text-primary-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 dark:text-white">التحضير اليومي اليدوي للطلاب</h1>
                                <p className="text-sm text-slate-500 mt-1">قم بتحديد فلاتر البحث لاختيار الشعبة والتاريخ لتسجيل الحضور</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <Filter size={16} />
                            </div>
                            <span className="font-bold text-sm">خيارات الفلترة والتحديد</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">التاريخ {date && <span className="text-primary-500">({getDayName(date)})</span>}</label>
                                <FlatpickrInput
                                    value={date}
                                    onChange={(val) => setDate(val)}
                                    placeholder="اختر التاريخ..."
                                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">المرحلة الدراسية</label>
                                <SelectInput
                                    value={selectedSection}
                                    onChange={(val) => {
                                        setSelectedSection(val);
                                        setSelectedGrade('');
                                        setSelectedDivision('');
                                    }}
                                    placeholder="اختر المرحلة..."
                                    options={sections.map(s => ({ value: s.id, label: s.name }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">الصف الدراسي</label>
                                <SelectInput
                                    value={selectedGrade}
                                    onChange={(val) => {
                                        setSelectedGrade(val);
                                        setSelectedDivision('');
                                    }}
                                    placeholder="اختر الصف..."
                                    options={availableGrades.map(g => ({ value: g.id, label: g.name }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">الشعبة</label>
                                <SelectInput
                                    value={selectedDivision}
                                    onChange={(val) => setSelectedDivision(val)}
                                    placeholder="اختر الشعبة..."
                                    options={availableDivisions.map(d => ({
                                        value: d.id, 
                                        label: `${d.grade?.section?.name} / ${d.grade?.name} / ${d.name}`
                                    }))}
                                />
                            </div>
                            
                            <div>
                                <button 
                                    onClick={applyFilters}
                                    className="w-full py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-500/20 active:scale-95"
                                >
                                    عرض الطلاب
                                </button>
                            </div>
                        </div>

                        {filters.division_id && students.length > 0 && (
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 justify-end">
                                <div className="text-center px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                    <span className="block text-emerald-600 dark:text-emerald-400 font-bold text-lg">{summary.present}</span>
                                    <span className="text-[10px] text-emerald-500 font-semibold">حضور</span>
                                </div>
                                <div className="text-center px-4 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20">
                                    <span className="block text-rose-600 dark:text-rose-400 font-bold text-lg">{summary.absent}</span>
                                    <span className="text-[10px] text-rose-500 font-semibold">غياب</span>
                                </div>
                                <div className="text-center px-4 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                                    <span className="block text-amber-600 dark:text-amber-400 font-bold text-lg">{summary.late}</span>
                                    <span className="text-[10px] text-amber-500 font-semibold">تأخير</span>
                                </div>
                                <div className="text-center px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <span className="block text-slate-600 dark:text-slate-400 font-bold text-lg">{summary.excused}</span>
                                    <span className="text-[10px] text-slate-500 font-semibold">استئذان</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Students List */}
                {filters.division_id && students.length > 0 ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4 font-bold w-1/3">اسم الطالب</th>
                                            <th className="px-6 py-4 font-bold text-center">حالة الحضور اليومي</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                                        {students.map(student => (
                                            <tr key={student.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{student.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="inline-flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                        <label className={`cursor-pointer px-4 py-2 rounded-lg text-xs font-bold transition-all ${student.status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                                            <input 
                                                                type="radio" 
                                                                name={`status_${student.student_id}`} 
                                                                value="present" 
                                                                className="sr-only" 
                                                                checked={student.status === 'present'}
                                                                onChange={() => handleStatusChange(student.student_id, 'present')}
                                                            />
                                                            <CheckCircle size={14} className="inline mr-1 -mt-0.5"/> حاضر
                                                        </label>
                                                        <label className={`cursor-pointer px-4 py-2 rounded-lg text-xs font-bold transition-all ${student.status === 'absent' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                                            <input 
                                                                type="radio" 
                                                                name={`status_${student.student_id}`} 
                                                                value="absent" 
                                                                className="sr-only"
                                                                checked={student.status === 'absent'}
                                                                onChange={() => handleStatusChange(student.student_id, 'absent')}
                                                            />
                                                            <XCircle size={14} className="inline mr-1 -mt-0.5"/> غائب
                                                        </label>
                                                        <label className={`cursor-pointer px-4 py-2 rounded-lg text-xs font-bold transition-all ${student.status === 'late' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                                            <input 
                                                                type="radio" 
                                                                name={`status_${student.student_id}`} 
                                                                value="late" 
                                                                className="sr-only"
                                                                checked={student.status === 'late'}
                                                                onChange={() => handleStatusChange(student.student_id, 'late')}
                                                            />
                                                            <Clock size={14} className="inline mr-1 -mt-0.5"/> متأخر
                                                        </label>
                                                        <label className={`cursor-pointer px-4 py-2 rounded-lg text-xs font-bold transition-all ${student.status === 'excused' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                                            <input 
                                                                type="radio" 
                                                                name={`status_${student.student_id}`} 
                                                                value="excused" 
                                                                className="sr-only"
                                                                checked={student.status === 'excused'}
                                                                onChange={() => handleStatusChange(student.student_id, 'excused')}
                                                            />
                                                            <FileText size={14} className="inline mr-1 -mt-0.5"/> مستأذن
                                                        </label>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {saving ? 'جاري الحفظ...' : 'حفظ بيانات الحضور'}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : filters.division_id ? (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center">
                        <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">لا يوجد طلاب مسجلين في هذه الشعبة</h3>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center">
                        <Filter size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">قم باختيار الشعبة لعرض الطلاب</h3>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
