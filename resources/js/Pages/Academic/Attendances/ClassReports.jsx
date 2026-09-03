import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Search, Calendar, UserX, User, Clock, X, Filter, BookOpen, AlertCircle, Save, UserCheck, CheckCheck } from 'lucide-react';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import Modal from '@/Components/Modal';
import Select from 'react-select';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        borderRadius: '1rem',
        borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
        backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1'
        }
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
        color: state.isSelected ? 'white' : '#1e293b',
        fontWeight: state.isSelected ? 'bold' : 'normal',
    })
};

export default function ClassReports({ students, periods, grades, divisions, filters, workingDays, timetable }) {
    const [date, setDate] = useState(filters.date || new Date().toISOString().split('T')[0]);
    const [gradeId, setGradeId] = useState(filters.grade_id || '');
    const [divisionId, setDivisionId] = useState(filters.division_id || '');

    // Frontend Filters State
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [smartFilter, setSmartFilter] = useState(''); // 'absent_in_class', 'last_periods_absent'
    const [hidePerfect, setHidePerfect] = useState(false);

    const [editingCell, setEditingCell] = useState(null);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        student_id: '',
        division_id: '',
        period_id: '',
        date: '',
        status: 'present',
        notes: '',
    });

    const applyFilters = () => {
        router.get(route('academic.attendances.classes'), { date, grade_id: gradeId, division_id: divisionId }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setDate('');
        setGradeId('');
        setDivisionId('');
        router.get(route('academic.attendances.classes'));
    };

    const openEditModal = (student, period, cellData) => {
        setEditingCell({
            studentName: student.name,
            periodName: period.period_name,
            recorderName: cellData?.recorder_name || null,
        });
        
        setData({
            student_id: student.id,
            division_id: divisionId,
            period_id: period.id,
            date: date,
            status: cellData ? cellData.status : 'present',
            notes: cellData && cellData.notes ? cellData.notes : '',
        });
    };

    const closeEditModal = () => {
        setEditingCell(null);
        reset();
        clearErrors();
    };

    const submitAttendance = (e) => {
        e.preventDefault();
        post(route('academic.attendances.classes.store'), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => closeEditModal(),
        });
    };

    const submitBulkAttendance = (periodId) => {
        if (!confirm('هل أنت متأكد من حفظ الحضور لجميع الطلاب كحاضرين لهذه الحصة؟ (لن يتم تجاوز من تم تحضيرهم مسبقاً)')) {
            return;
        }
        
        router.post(route('academic.attendances.classes.storeBulk'), {
            division_id: divisionId,
            period_id: periodId,
            date: date,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'present':
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded text-xs font-black">حاضر</span>;
            case 'late':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded text-xs font-black">متأخر</span>;
            case 'absent':
                return <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded text-xs font-black">غائب</span>;
            default:
                return <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded text-xs font-black">غير محدد</span>;
        }
    };

    // Compute Filtered Students (Frontend Filtering)
    const filteredStudents = (students || []).filter(student => {
        // 1. Hide perfect attendance
        if (hidePerfect) {
            const hasAnyAbsence = Object.values(student.periods).some(p => p.status !== 'present') || student.daily_status !== 'present';
            if (!hasAnyAbsence) return false;
        }

        // 2. Selected Student
        if (selectedStudent && student.id !== selectedStudent) return false;

        // 3. Smart Filters
        if (smartFilter === 'absent_in_class') {
            const isDailyPresent = student.daily_status === 'present';
            const hasClassAbsence = Object.values(student.periods).some(p => p.status === 'absent');
            if (!(isDailyPresent && hasClassAbsence)) return false;
        }

        if (smartFilter === 'last_periods_absent') {
            if (periods.length < 2) return true;
            const lastTwoPeriods = periods.slice(-2);
            const absentInLast = lastTwoPeriods.some(p => student.periods[p.id]?.status === 'absent');
            if (!absentInLast) return false;
        }

        // 4. Period filter
        if (selectedPeriod) {
            const pData = student.periods[selectedPeriod];
            if (!pData || (pData.status !== 'absent' && pData.status !== 'late')) {
                return false;
            }
        }

        return true;
    });

    return (
        <AdminLayout activeMenu="غياب الحصص">
            <Head title="تقارير غياب الحصص | النظام الإداري" />

            <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8">
                {/* Header Section with Brand Colors and Geometric Accent */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
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
                            <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <Clock size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    الغياب في الحصص
                                </h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-1 text-sm font-bold">
                                    تتبع حضور وغياب الطلاب في كل حصة دراسية ومادة على حدة
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 md:p-6 flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <Filter size={18} />
                        </div>
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">أدوات الفلترة</h2>
                    </div>

                    <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
                        <div className="w-full sm:w-auto min-w-[160px] relative group">
                            <FlatpickrInput
                                value={date}
                                onChange={(val) => setDate(val)}
                                placeholder="اختر التاريخ..."
                                options={{
                                    altInput: true,
                                    altFormat: "l, Y-m-d", // Shows day name + date
                                    disable: [
                                        function(d) {
                                            const dayMap = {
                                                'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 
                                                'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
                                            };
                                            const wDays = (workingDays && workingDays.length > 0) 
                                                ? workingDays 
                                                : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
                                            const enabledIndexes = wDays.map(name => dayMap[name]);
                                            return !enabledIndexes.includes(d.getDay());
                                        }
                                    ]
                                }}
                                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-4 pr-11 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                            />
                            <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                        </div>
                        
                        <div className="w-full sm:w-48">
                            <SelectInput
                                value={gradeId}
                                onChange={(val) => {
                                    setGradeId(val);
                                    setDivisionId(''); // Reset division when grade changes
                                }}
                                className="w-full text-sm font-bold"
                                placeholder="اختر الصف"
                                options={grades?.map(grade => ({
                                    value: grade.id,
                                    label: grade.name
                                })) || []}
                            />
                        </div>

                        <div className="w-full sm:w-48">
                            <SelectInput
                                value={divisionId}
                                onChange={(val) => setDivisionId(val)}
                                className="w-full text-sm font-bold"
                                placeholder="اختر الشعبة (إلزامي)"
                                options={divisions
                                    ?.filter(div => !gradeId || String(div.grade_id) === String(gradeId))
                                    .map(div => ({
                                        value: div.id,
                                        label: `${div.grade?.name} - ${div.name}`
                                    })) || []
                                }
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <button 
                                onClick={applyFilters}
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-500/20 active:scale-95"
                            >
                                <Search size={16} /> <span className="hidden md:inline">بحث</span>
                            </button>
                            {(filters.date || filters.grade_id || filters.division_id) && (
                                <button 
                                    onClick={clearFilters}
                                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/10 dark:text-slate-400 dark:hover:text-rose-400 rounded-2xl transition-all shrink-0"
                                    title="مسح الفلاتر"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secondary Frontend Filters */}
                {divisionId && students?.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 md:p-5 flex flex-col xl:flex-row items-start xl:items-center gap-4 justify-between">
                        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                            <span className="text-sm font-bold text-slate-500 ml-1">فلاتر ذكية:</span>
                            
                            <button 
                                onClick={() => setHidePerfect(!hidePerfect)}
                                className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${hidePerfect ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                            >
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                إخفاء المنتظمين
                            </button>
                            
                            <button 
                                onClick={() => setSmartFilter(smartFilter === 'absent_in_class' ? '' : 'absent_in_class')}
                                className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${smartFilter === 'absent_in_class' ? 'bg-rose-600 text-white' : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50'}`}
                                title="حاضر في البصمة الصباحية وغائب في إحدى الحصص"
                            >
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                كشف الهروب
                            </button>

                            <button 
                                onClick={() => setSmartFilter(smartFilter === 'last_periods_absent' ? '' : 'last_periods_absent')}
                                className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${smartFilter === 'last_periods_absent' ? 'bg-amber-500 text-white' : 'bg-white border border-amber-200 text-amber-600 hover:bg-amber-50'}`}
                            >
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                غياب الحصص الأخيرة
                            </button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                            <div className="w-full sm:w-64">
                                <Select
                                    options={[
                                        { value: '', label: 'الكل (بحث باسم الطالب)' },
                                        ...(students?.map(s => ({ value: s.id, label: s.name })) || [])
                                    ]}
                                    value={selectedStudent ? { value: selectedStudent, label: students?.find(s => s.id === selectedStudent)?.name } : { value: '', label: 'الكل (بحث باسم الطالب)' }}
                                    onChange={(opt) => setSelectedStudent(opt ? opt.value : '')}
                                    placeholder="بحث باسم الطالب..."
                                    isClearable
                                    styles={customSelectStyles}
                                />
                            </div>
                            <div className="w-full sm:w-48">
                                <Select
                                    options={[
                                        { value: '', label: 'تصفية بالحصة' },
                                        ...(periods?.map(p => ({ value: p.id, label: p.period_name })) || [])
                                    ]}
                                    value={selectedPeriod ? { value: selectedPeriod, label: periods?.find(p => p.id === selectedPeriod)?.period_name } : { value: '', label: 'تصفية بالحصة' }}
                                    onChange={(opt) => setSelectedPeriod(opt ? opt.value : '')}
                                    placeholder="تصفية بالحصة..."
                                    isClearable
                                    styles={customSelectStyles}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    {!divisionId ? (
                        <div className="px-6 py-16 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                    <Filter size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">يرجى تحديد الشعبة</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    قم باختيار الشعبة الدراسية من أدوات الفلترة في الأعلى لعرض سجل الحضور التفصيلي.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 font-black text-slate-700 dark:text-slate-300 whitespace-nowrap bg-slate-50/80 dark:bg-slate-800/50 sticky right-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-none">
                                            الطالب
                                        </th>
                                        <th className="px-6 py-4 font-black text-slate-700 dark:text-slate-300 whitespace-nowrap text-center border-l border-slate-200 dark:border-slate-700">
                                            الغياب اليومي (الباب)
                                        </th>
                                        {periods.map(period => {
                                            const slot = timetable ? timetable[period.id] : null;
                                            return (
                                                <th key={period.id} className="px-6 py-4 font-black text-slate-700 dark:text-slate-300 whitespace-nowrap text-center min-w-[140px] group/header relative">
                                                    {period.period_name}
                                                    <div className="text-[10px] font-normal text-slate-500 mt-1">
                                                        {period.start_time ? period.start_time.substring(0,5) : ''} - {period.end_time ? period.end_time.substring(0,5) : ''}
                                                    </div>
                                                    
                                                    {/* Bulk Save Button */}
                                                    <div className="absolute top-2 left-2 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => submitBulkAttendance(period.id)}
                                                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-200"
                                                            title="حفظ الكل كحاضرين"
                                                        >
                                                            <CheckCheck size={14} />
                                                        </button>
                                                    </div>

                                                    {slot && (
                                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50 flex flex-col items-center gap-1">
                                                            <div className="text-xs font-bold text-primary-600 dark:text-primary-400 whitespace-normal leading-tight text-center">
                                                                {slot.subject?.name}
                                                            </div>
                                                            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                                                                <User size={10} className="shrink-0" />
                                                                <span className="truncate max-w-[100px]" title={slot.teacher?.name}>{slot.teacher?.name}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/30 sticky right-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
                                                    <div className="flex items-center gap-3 min-w-[150px]">
                                                        <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0 font-bold">
                                                            {student.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                            {student.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center border-l border-slate-100 dark:border-slate-800/50">
                                                    {renderStatusBadge(student.daily_status)}
                                                </td>
                                                {periods.map(period => {
                                                    const cellData = student.periods[period.id];
                                                    return (
                                                        <td key={period.id} 
                                                            className="px-2 py-3 text-center cursor-pointer transition-all border-l border-slate-50 dark:border-slate-800/50 group/cell"
                                                            onClick={() => openEditModal(student, period, cellData)}
                                                        >
                                                            <div className="relative h-full flex flex-col items-center justify-center w-full min-h-[60px] rounded-xl group-hover/cell:bg-primary-50 dark:group-hover/cell:bg-primary-500/10 group-active/cell:scale-95 group-active/cell:bg-primary-100 dark:group-active/cell:bg-primary-500/20 transition-all border-2 border-transparent group-hover/cell:border-primary-100 dark:group-hover/cell:border-primary-500/20 p-2">
                                                                {cellData ? (
                                                                    <div className="flex flex-col items-center justify-center gap-1.5 w-full">
                                                                        {renderStatusBadge(cellData.status)}
                                                                        
                                                                        {cellData.subject_name && (
                                                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-700">
                                                                                <BookOpen size={10} />
                                                                                <span className="truncate max-w-[80px]">{cellData.subject_name}</span>
                                                                            </span>
                                                                        )}

                                                                        {cellData.notes && (
                                                                            <div className="group/note relative flex justify-center w-full mt-0.5">
                                                                                <AlertCircle size={14} className="text-amber-500 cursor-help" />
                                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/note:opacity-100 group-hover/note:visible transition-all z-20">
                                                                                    {cellData.notes}
                                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 group-hover/cell:border-primary-300 dark:group-hover/cell:border-primary-500/50 flex items-center justify-center transition-colors">
                                                                        <span className="text-slate-300 dark:text-slate-600 text-lg font-bold">+</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={periods.length + 2} className="px-6 py-16 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                                        <UserX size={32} className="text-slate-400" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">لا يوجد طلاب</h3>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                                                        هذه الشعبة لا تحتوي على طلاب مسجلين.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Attendance Modal */}
            <Modal show={!!editingCell} onClose={closeEditModal} maxWidth="md">
                <form onSubmit={submitAttendance} className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <UserCheck size={24} className="text-primary-500" />
                            تعديل حالة الحضور
                        </h2>
                        <button type="button" onClick={closeEditModal} className="text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-slate-500 dark:text-slate-400 mb-1 text-xs">الطالب</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{editingCell?.studentName}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500 dark:text-slate-400 mb-1 text-xs">الحصة</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{editingCell?.periodName}</span>
                            </div>
                            {editingCell?.recorderName && (
                                <div className="col-span-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span className="block text-slate-500 dark:text-slate-400 mb-1 text-xs">تم التحضير بواسطة</span>
                                    <span className="font-bold text-primary-600 dark:text-primary-400">{editingCell?.recorderName}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">حالة الحضور</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'present', label: 'حاضر', color: 'emerald' },
                                    { id: 'absent', label: 'غائب', color: 'rose' },
                                    { id: 'late', label: 'متأخر', color: 'amber' },
                                    { id: 'excused', label: 'عذر / استئذان', color: 'slate' },
                                ].map((option) => (
                                    <label 
                                        key={option.id}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer border-2 transition-all
                                            ${data.status === option.id 
                                                ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-500/10 text-${option.color}-700 dark:text-${option.color}-400 font-bold` 
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                                            }
                                        `}
                                    >
                                        <input 
                                            type="radio" 
                                            name="status" 
                                            value={option.id}
                                            checked={data.status === option.id}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="hidden"
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ملاحظات (اختياري)</label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none resize-none"
                                rows="3"
                                placeholder="اكتب أي ملاحظات حول حضور الطالب هنا..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-500/20 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            <Save size={18} />
                            حفظ حالة الحضور
                        </button>
                        <button
                            type="button"
                            onClick={closeEditModal}
                            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
