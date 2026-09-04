import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Printer, Filter, CalendarDays, CheckCircle2, XCircle, Clock, Search, Calendar, X, Sparkles } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';
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

export default function WeeklyReport({ students, weekDays = {}, divisionInfo, grades = [], divisions = [], filters = {} }) {
    const [filterData, setFilterData] = useState({
        grade_id: filters.grade_id || '',
        division_id: filters.division_id || '',
        date: filters.date || ''
    });

    const [printSettings, setPrintSettings] = useState(() => {
        const defaultSettings = {
            title: 'كشف حضور وغياب الطلاب الأسبوعي',
            showKPIs: true,
            showDetails: true,
            orientation: 'portrait',
            ecoMode: false,
            watermark: 'none',
            paperSize: 'A4',
            margins: 'normal',
            scale: 1,
            pagesPerSheet: 1,
            brandColor: '#2563eb', // blue-600
        };
        try {
            const saved = localStorage.getItem('WeeklyReportPrintSettings');
            if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {}
        return defaultSettings;
    });

    React.useEffect(() => {
        localStorage.setItem('WeeklyReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const params = new URLSearchParams({
                date: filterData.date || '',
                grade_id: filterData.grade_id || '',
                division_id: filterData.division_id || '',
                printSettings: JSON.stringify(printSettings)
            });

            const url = route('academic.attendances.weekly-report.pdf') + '?' + params.toString();
            window.location.href = url;
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء طلب الملف.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const [showFilters, setShowFilters] = useState(false);
    
    // Frontend Smart Filters
    const [hidePerfect, setHidePerfect] = useState(false);
    const [minAbsences, setMinAbsences] = useState(0);
    const [selectedDayKey, setSelectedDayKey] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [sortByAbsences, setSortByAbsences] = useState(false);

    // Compute Filtered Students
    const filteredStudents = (students || []).filter(student => {
        // Search filter
        if (selectedStudent && student.id != selectedStudent) return false;
        
        // Hide perfect
        if (hidePerfect) {
            let hasIssue = false;
            if (student.stats?.absences > 0) hasIssue = true;
            Object.values(student.days || {}).forEach(d => {
                if (d?.status === 'late' || d?.status === 'absent') hasIssue = true;
            });
            if (!hasIssue) return false;
        }

        // Min absences
        if (minAbsences > 0) {
            if ((student.stats?.absences || 0) < minAbsences) return false;
        }

        // Selected day
        if (selectedDayKey) {
            const status = student.days?.[selectedDayKey]?.status;
            if (status !== 'absent' && status !== 'late') return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortByAbsences) {
            return (b.stats?.absences || 0) - (a.stats?.absences || 0);
        }
        return 0; // original sorting
    });

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(route('academic.attendances.weekly-report'), filterData, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleGradeChange = (val) => {
        const grade_id = val;
        setFilterData({ ...filterData, grade_id, division_id: '' });
    };

    const clearFilters = () => {
        setFilterData({ grade_id: '', division_id: '', date: '' });
        router.get(route('academic.attendances.weekly-report'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const removeFilter = (filterId) => {
        let params = { ...filterData };
        if (filterId === 'grade') { params.grade_id = ''; params.division_id = ''; }
        if (filterId === 'division') { params.division_id = ''; }
        if (filterId === 'date') { params.date = ''; }
        setFilterData(params);
        router.get(route('academic.attendances.weekly-report'), params, { preserveState: true, preserveScroll: true });
    };

    const setPresetDate = (preset) => {
        const today = new Date();
        const fmt = (d) => {
            let m = '' + (d.getMonth() + 1);
            let dy = '' + d.getDate();
            if (m.length < 2) m = '0' + m;
            if (dy.length < 2) dy = '0' + dy;
            return [d.getFullYear(), m, dy].join('-');
        };
        
        let start = new Date(today);
        if (preset === 'today') {
             setFilterData({...filterData, date: fmt(today)});
             return;
        }
        if (preset === 'week') {
             // Set to start of week (Sunday)
             start.setDate(today.getDate() - today.getDay());
             setFilterData({...filterData, date: fmt(start)});
             return;
        }
    };

    const getGradeName = (id) => grades?.find(g => g.id == id)?.name || id;
    const getDivisionName = (id) => { const d = divisions?.find(d => d.id == id); return d ? `${d.grade?.name} - ${d.name}` : id; };

    const activeFilters = [];
    if (filterData.grade_id) activeFilters.push({ id: 'grade', label: `المرحلة: ${getGradeName(filterData.grade_id)}` });
    if (filterData.division_id) activeFilters.push({ id: 'division', label: `الشعبة: ${getDivisionName(filterData.division_id)}` });
    if (filterData.date) activeFilters.push({ id: 'date', label: `أسبوع: ${filterData.date}` });

    const handlePrint = () => {
        window.print();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />;
            case 'absent':
                return <XCircle size={18} className="text-rose-500 mx-auto" />;
            case 'late':
                return <Clock size={18} className="text-amber-500 mx-auto" />;
            case 'excused':
                return <span className="text-blue-500 font-bold text-xs">بعذر</span>;
            default:
                return <span className="text-slate-300">-</span>;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'present': return 'حاضر';
            case 'absent': return 'غائب';
            case 'late': return 'متأخر';
            case 'excused': return 'بعذر';
            default: return '-';
        }
    };

    return (
        <AdminLayout activeMenu="كشف الغياب الأسبوعي">
            <Head title="كشف حضور وغياب الطلاب الأسبوعي" />

            <div className="space-y-6">
                
                {/* Header */}
                <div className="print:hidden relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400 z-20"></div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary-50 to-transparent pointer-events-none"></div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3.5 bg-white border border-primary-100 shadow-sm rounded-xl text-primary-600 flex-shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <CalendarDays size={28} strokeWidth={2} className="relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-black text-slate-800 tracking-tight mb-1">كشف الحضور والغياب الأسبوعي</h1>
                            <p className="text-[13.5px] font-bold text-slate-500">متابعة تفصيلية لحضور الطلاب لصف محدد خلال أسبوع كامل</p>
                        </div>
                    </div>
                    

                </div>
                
                {/* Filter Panel */}
                <div className="print:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>

                    <div className="p-5">
                        {/* Toggle button + Presets */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-3 font-bold px-6 py-3 rounded-xl transition-all duration-300 w-full xl:w-auto ${
                                    showFilters
                                        ? 'bg-primary-50 text-primary-700 shadow-inner'
                                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                            >
                                <div className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-primary-100 text-primary-600' : 'bg-white shadow-sm text-slate-500'}`}>
                                    <Filter size={18} strokeWidth={2.5} />
                                </div>
                                <span className="text-[15px]">خيارات التصفية المتقدمة</span>
                                {activeFilters.length > 0 && (
                                    <span className="flex items-center justify-center bg-primary-500 text-white text-xs font-black w-6 h-6 rounded-full shadow-sm">
                                        {activeFilters.length}
                                    </span>
                                )}
                                <svg className={`w-5 h-5 mr-auto transition-transform duration-300 ${showFilters ? 'rotate-180 text-primary-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Presets + Date Display */}
                            <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 overflow-x-auto hide-scrollbar w-full xl:w-auto shadow-inner gap-1">
                                <button
                                    onClick={() => setPresetDate('today')}
                                    className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all"
                                >
                                    اليوم
                                </button>
                                <button
                                    onClick={() => setPresetDate('week')}
                                    className="whitespace-nowrap px-5 py-2 text-sm font-bold rounded-lg text-slate-600 hover:text-primary-700 hover:bg-white hover:shadow-sm transition-all"
                                >
                                    الأسبوع الحالي
                                </button>
                                {filterData.date && (
                                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-700 bg-white rounded-lg shadow-sm border border-primary-100">
                                        <Calendar size={14} className="text-primary-500" />
                                        <span>{filterData.date}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Active filter chips */}
                        {activeFilters.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-slate-100">
                                <span className="text-sm font-bold text-slate-500 ml-2">الفلاتر النشطة:</span>
                                {activeFilters.map(filter => (
                                    <span key={filter.id} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary-200 text-primary-700 text-sm font-bold shadow-sm group">
                                        {filter.label}
                                        <button type="button" onClick={() => removeFilter(filter.id)} className="p-0.5 rounded-full hover:bg-red-50 text-slate-400 group-hover:text-red-500 transition-colors">
                                            <X size={14} strokeWidth={2.5} />
                                        </button>
                                    </span>
                                ))}
                                <button onClick={clearFilters} className="text-sm text-slate-400 hover:text-red-600 font-bold px-3 transition-colors mr-auto flex items-center gap-1">
                                    <X size={14} strokeWidth={2.5} /> مسح جميع الفلاتر
                                </button>
                            </div>
                        )}

                        {/* Collapsible form */}
                        <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                    
                                    {/* Grade */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">المرحلة الدراسية</label>
                                        <SelectInput
                                            value={filterData.grade_id}
                                            onChange={handleGradeChange}
                                            placeholder="اختر المرحلة..."
                                            options={grades?.map(grade => ({
                                                value: grade.id,
                                                label: grade.name
                                            })) || []}
                                        />
                                    </div>

                                    {/* Division */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            الشعبة <span className="text-rose-500 text-xs font-bold">(إلزامي)</span>
                                        </label>
                                        <SelectInput
                                            value={filterData.division_id}
                                            onChange={(val) => setFilterData({ ...filterData, division_id: val })}
                                            placeholder="اختر الشعبة..."
                                            options={divisions
                                                ?.filter(div => !filterData.grade_id || String(div.grade_id) === String(filterData.grade_id))
                                                .map(div => ({
                                                    value: div.id,
                                                    label: `${div.grade?.name} - ${div.name}`
                                                })) || []
                                            }
                                        />
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            تاريخ من الأسبوع <span className="text-rose-500 text-xs font-bold">(إلزامي)</span>
                                        </label>
                                        <input 
                                            type="date"
                                            value={filterData.date} 
                                            onChange={e => setFilterData({...filterData, date: e.target.value})}
                                            className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm h-[42px] px-3"
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3 items-end">
                                        <button
                                            type="submit"
                                            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all font-bold shadow-sm"
                                        >
                                            <Search size={16} strokeWidth={2.5} />
                                            <span>عرض الكشف</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all"
                                        >
                                            <X size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </form>

                                {/* Secondary Frontend Filters were moved outside */}
                            </div>
                        </div>
                    </div>
                </div>

                    {/* Secondary Frontend Filters - Always Visible */}
                    {divisionInfo && students?.length > 0 && (
                        <div className="p-5 bg-white border-t border-slate-100 flex flex-col xl:flex-row items-start xl:items-center gap-4 justify-between">
                            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                                <span className="text-sm font-bold text-slate-500 ml-1">فلاتر ذكية (فورية):</span>
                                
                                <button 
                                    onClick={() => setHidePerfect(!hidePerfect)}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${hidePerfect ? 'bg-emerald-600 text-white' : 'bg-slate-50 border border-slate-200 text-emerald-600 hover:bg-emerald-50'}`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-current"></span>
                                    إخفاء المنتظمين
                                </button>

                                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
                                    <span className="px-3 py-2 text-sm font-bold text-slate-500 bg-slate-100 border-l border-slate-200">الغياب:</span>
                                    <button 
                                        onClick={() => setMinAbsences(minAbsences === 1 ? 0 : 1)}
                                        className={`px-3 py-2 text-sm font-bold transition-all border-l border-slate-200 ${minAbsences === 1 ? 'bg-amber-500 text-white' : 'hover:bg-amber-50 text-amber-600'}`}
                                    >
                                        يوم+
                                    </button>
                                    <button 
                                        onClick={() => setMinAbsences(minAbsences === 2 ? 0 : 2)}
                                        className={`px-3 py-2 text-sm font-bold transition-all border-l border-slate-200 ${minAbsences === 2 ? 'bg-rose-500 text-white' : 'hover:bg-rose-50 text-rose-600'}`}
                                    >
                                        يومين+
                                    </button>
                                    <button 
                                        onClick={() => setMinAbsences(minAbsences === 3 ? 0 : 3)}
                                        className={`px-3 py-2 text-sm font-bold transition-all ${minAbsences === 3 ? 'bg-red-700 text-white' : 'hover:bg-red-50 text-red-700'}`}
                                    >
                                        3 أيام+
                                    </button>
                                </div>

                                <button 
                                    onClick={() => setSortByAbsences(!sortByAbsences)}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${sortByAbsences ? 'bg-indigo-600 text-white' : 'bg-slate-50 border border-slate-200 text-indigo-600 hover:bg-indigo-50'}`}
                                >
                                    <Filter size={14} className={sortByAbsences ? 'text-white' : 'text-indigo-500'} />
                                    الأكثر غياباً
                                </button>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                                <div className="w-full sm:w-64">
                                    <Select
                                        options={[
                                            { value: '', label: 'الكل (بحث باسم الطالب)' },
                                            ...(students?.map(s => ({ value: s.id, label: s.name })) || [])
                                        ]}
                                        value={selectedStudent ? { value: selectedStudent, label: students?.find(s => s.id == selectedStudent)?.name } : { value: '', label: 'الكل (بحث باسم الطالب)' }}
                                        onChange={(opt) => setSelectedStudent(opt ? opt.value : '')}
                                        placeholder="بحث باسم الطالب..."
                                        isClearable
                                        styles={customSelectStyles}
                                    />
                                </div>
                                <div className="w-full sm:w-48">
                                    <Select
                                        options={[
                                            { value: '', label: 'تصفية بيوم محدد' },
                                            ...(Object.keys(weekDays || {}).map(key => ({ value: key, label: weekDays[key].name })))
                                        ]}
                                        value={selectedDayKey ? { value: selectedDayKey, label: weekDays[selectedDayKey]?.name } : { value: '', label: 'تصفية بيوم محدد' }}
                                        onChange={(opt) => setSelectedDayKey(opt ? opt.value : '')}
                                        placeholder="تصفية بيوم..."
                                        isClearable
                                        styles={customSelectStyles}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                {/* Data Table */}
                {divisionInfo && students.length > 0 ? (
                    <ReportPrintLayout 
                        title={printSettings.title} 
                        printSettings={printSettings} 
                        setPrintSettings={setPrintSettings} 
                        onPrint={handlePrint} 
                        onDownloadPdf={handleDownloadPDF} 
                        isGeneratingPdf={isGeneratingPdf} 
                        startDate={weekDays?.sunday?.date} 
                        endDate={weekDays?.thursday?.date}
                    >
                        <div className="mb-6 flex flex-col gap-1 items-start text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-transparent print:border-none print:p-0 print:mb-4">
                            <span>المرحلة: {divisionInfo.grade.name}</span>
                            <span>الصف/الشعبة: {divisionInfo.name}</span>
                        </div>

                        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none">
                            <table className="w-full text-center print:text-sm border-collapse">
                                <thead className="text-white border-b print:border-black" style={{ backgroundColor: printSettings?.brandColor || '#1e293b', borderColor: printSettings?.brandColor || '#1e293b' }}>
                                    <tr>
                                        <th className="px-4 py-4 text-right text-sm font-bold border-l w-12" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>م</th>
                                        <th className="px-4 py-4 text-right text-sm font-bold border-l min-w-[200px]" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>اسم الطالب</th>
                                        
                                        {/* Days Columns */}
                                        {Object.values(weekDays).map((day, index) => (
                                            <th key={index} className="px-2 py-3 text-sm font-bold border-l w-24" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                                <div className="block">{day.name}</div>
                                                <div className="text-xs font-normal text-white/70 mt-1">{day.date}</div>
                                            </th>
                                        ))}
                                        
                                        <th className="px-4 py-4 text-sm font-black w-24" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>إجمالي الغياب</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 print:divide-black">
                                    {filteredStudents.length > 0 ? filteredStudents.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors print:hover:bg-transparent">
                                            <td className="px-4 py-3 text-sm text-slate-500 font-medium text-right print:border-b print:border-slate-300">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-3 text-right print:border-b print:border-slate-300">
                                                <div className="font-bold text-slate-800 dark:text-white">
                                                    {student.name}
                                                </div>
                                            </td>
                                            
                                            {/* Status logic */}
                                            {Object.keys(weekDays).map(dayKey => {
                                                const status = student.days[dayKey]?.status;
                                                return (
                                                    <td key={dayKey} className="px-2 py-3 print:border-b print:border-slate-300 align-middle">
                                                        <div className="print:hidden">
                                                            {getStatusIcon(status)}
                                                        </div>
                                                        <div className="hidden print:block text-xs font-bold">
                                                            {getStatusText(status)}
                                                        </div>
                                                    </td>
                                                );
                                            })}

                                            <td className="px-4 py-3 font-black text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-500/5 print:border-b print:border-slate-300">
                                                {student.stats.absences > 0 ? student.stats.absences : '-'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={Object.keys(weekDays).length + 3} className="px-4 py-8 text-center text-slate-500 font-bold">
                                                لا توجد نتائج مطابقة لخيارات الفلترة
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700 print:bg-transparent print:border-none print:mt-10">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 print:hidden">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><CheckCircle2 size={14} className="text-emerald-500" /> حاضر</div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><XCircle size={14} className="text-rose-500" /> غائب</div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Clock size={14} className="text-amber-500" /> متأخر</div>
                                </div>
                            </div>

                            <div className="hidden print:flex justify-between items-end mt-12 text-center text-sm font-bold text-slate-800">
                                <div className="w-40 border-t border-slate-400 pt-2">المرشد الطلابي</div>
                                <div className="w-40 border-t border-slate-400 pt-2">وكيل الشؤون الطلابية</div>
                                <div className="w-40 border-t border-slate-400 pt-2">مدير المدرسة</div>
                            </div>
                        </div>
                    </ReportPrintLayout>
                ) : (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm print:hidden">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarDays size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                            {divisionInfo ? 'لا يوجد طلاب مسجلين في هذه الشعبة' : 'الرجاء اختيار المرحلة والشعبة لعرض الكشف'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                            استخدم أدوات الفلترة في الأعلى لتحديد الصف وتاريخ الأسبوع المطلوب وسيقوم النظام بتوليد كشف الغياب الأسبوعي.
                        </p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
