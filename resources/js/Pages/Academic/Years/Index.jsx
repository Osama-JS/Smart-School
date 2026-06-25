import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import { 
    Calendar, Plus, Edit2, Trash2, CheckCircle2, 
    X, AlertTriangle, AlertCircle, ChevronDown, Check, LayoutList, Layers, Sparkles
} from 'lucide-react';
import Swal from 'sweetalert2';

const DAYS_OF_WEEK = [
    { id: 'Saturday', name: 'السبت' },
    { id: 'Sunday', name: 'الأحد' },
    { id: 'Monday', name: 'الإثنين' },
    { id: 'Tuesday', name: 'الثلاثاء' },
    { id: 'Wednesday', name: 'الأربعاء' },
    { id: 'Thursday', name: 'الخميس' },
    { id: 'Friday', name: 'الجمعة' },
];

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all duration-300 scale-100 opacity-100">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-500" />
                <div className="flex items-center justify-between p-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 md:p-8">{children}</div>
            </div>
        </div>
    );
}

export default function AcademicYearsIndex({ academicYears, branches, isAdmin, stats }) {
    const { errors } = usePage().props;
    
    // UI States
    const [expandedYears, setExpandedYears] = useState({});
    
    // Modal States
    const [isYearModalOpen, setIsYearModalOpen] = useState(false);
    const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
    const [editingYear, setEditingYear] = useState(null);
    const [editingSemester, setEditingSemester] = useState(null);
    const [selectedYearId, setSelectedYearId] = useState(null); // For adding semester
    const [deletingYearId, setDeletingYearId] = useState(null);
    const [deletingSemesterId, setDeletingSemesterId] = useState(null);

    // Form States - Year
    const [yearForm, setYearForm] = useState({
        name: '', start_date: '', end_date: '', branch_id: '', notes: '', working_days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    });

    // Form States - Semester
    const [semesterForm, setSemesterForm] = useState({
        name: '', term_number: '', start_date: '', end_date: ''
    });

    const toggleYear = (id) => {
        setExpandedYears(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Year Actions ---
    const openNewYear = () => {
        setEditingYear(null);
        setYearForm({ name: '', start_date: '', end_date: '', branch_id: '', notes: '', working_days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] });
        setIsYearModalOpen(true);
    };

    const openEditYear = (year) => {
        setEditingYear(year);
        setYearForm({
            name: year.name, start_date: year.start_date, end_date: year.end_date, 
            branch_id: year.branch_id || '', notes: year.notes || '', working_days: year.working_days || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
        });
        setIsYearModalOpen(true);
    };

    const submitYear = (e) => {
        e.preventDefault();
        if (editingYear) {
            router.put(route('academic.years.update', editingYear.id), yearForm, {
                onSuccess: () => setIsYearModalOpen(false),
            });
        } else {
            router.post(route('academic.years.store'), yearForm, {
                onSuccess: () => setIsYearModalOpen(false),
            });
        }
    };

    const deleteYear = (id) => {
        setDeletingYearId(id);
    };

    const confirmDeleteYear = () => {
        if (deletingYearId) {
            router.delete(route('academic.years.destroy', deletingYearId), {
                onSuccess: () => setDeletingYearId(null)
            });
        }
    };

    const toggleYearActive = (id) => {
        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({
            title: 'تفعيل السنة الدراسية',
            text: 'تفعيل هذه السنة سيؤدي لتعطيل بقية السنوات تلقائياً. هل أنت متأكد؟',
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#10b981', // emerald-500
            cancelButtonColor: isDark ? '#334155' : '#e2e8f0',
            confirmButtonText: 'نعم، قم بالتفعيل',
            cancelButtonText: 'إلغاء',
            reverseButtons: true,
            background: isDark ? '#0f172a' : '#ffffff',
            color: isDark ? '#f8fafc' : '#1e293b',
            customClass: {
                confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-white',
                cancelButton: `rounded-xl px-5 py-2.5 font-bold ${isDark ? 'text-white' : 'text-slate-700'}`,
                popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl',
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('academic.years.toggle', id));
            }
        });
    };

    // --- Semester Actions ---
    const openNewSemester = (yearId) => {
        setEditingSemester(null);
        setSelectedYearId(yearId);
        setSemesterForm({ name: '', term_number: '', start_date: '', end_date: '' });
        setIsSemesterModalOpen(true);
    };

    const openEditSemester = (semester, yearId) => {
        setEditingSemester(semester);
        setSelectedYearId(yearId);
        setSemesterForm({
            name: semester.name, term_number: semester.term_number, 
            start_date: semester.start_date, end_date: semester.end_date
        });
        setIsSemesterModalOpen(true);
    };

    const submitSemester = (e) => {
        e.preventDefault();
        if (editingSemester) {
            router.put(route('academic.semesters.update', editingSemester.id), semesterForm, {
                onSuccess: () => setIsSemesterModalOpen(false),
            });
        } else {
            router.post(route('academic.semesters.store', selectedYearId), semesterForm, {
                onSuccess: () => setIsSemesterModalOpen(false),
            });
        }
    };

    const deleteSemester = (id) => {
        setDeletingSemesterId(id);
    };

    const confirmDeleteSemester = () => {
        if (deletingSemesterId) {
            router.delete(route('academic.semesters.destroy', deletingSemesterId), {
                onSuccess: () => setDeletingSemesterId(null)
            });
        }
    };

    const toggleSemesterActive = (id) => {
        router.post(route('academic.semesters.toggle', id));
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    };

    return (
        <AdminLayout activeMenu="السنوات الدراسية">
            <Head title="إدارة السنوات الدراسية" />

            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Section with Brand Colors and Geometric Accent */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none">
                    {/* Brand Line Accent */}
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Fine abstract geometric background lines */}
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
                        <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary-600 dark:text-primary-400 transition-transform">
                                <Calendar className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">السنوات الدراسية والفصول</h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 text-sm font-semibold flex items-center gap-2">إدارة هيكلة السنة الأكاديمية والتحكم في الفترات الفعالة</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                    <p className="text-xs font-bold text-emerald-600/80 dark:text-emerald-400/80">السنوات النشطة</p>
                                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 leading-none mt-0.5">{stats.active_years}</p>
                                </div>
                            </div>
                            <button onClick={openNewYear} className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 text-sm font-bold shadow-lg shadow-primary-500/10 transition-all shrink-0 active:scale-95">
                                <Plus size={18} />
                                <span>سنة دراسية جديدة</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Years List */}
                <div className="space-y-4">
                    {academicYears.data.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">لا توجد سنوات دراسية</h3>
                            <p className="text-slate-500 mt-2">قم بإضافة سنة دراسية جديدة للبدء</p>
                        </div>
                    ) : (
                        academicYears.data.map(year => (
                            <div key={year.id} className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 ${year.is_active ? 'border-primary-500 shadow-md shadow-primary-500/10' : 'border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                                
                                {/* Year Header */}
                                <div className="p-6 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div onClick={() => toggleYear(year.id)} className="cursor-pointer w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                            <ChevronDown className={`w-6 h-6 text-slate-600 transition-transform duration-300 ${expandedYears[year.id] ? 'rotate-180' : ''}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-xl font-black text-slate-900 dark:text-white cursor-pointer" onClick={() => toggleYear(year.id)}>{year.name}</h2>
                                                {year.is_active && (
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                                                        سنة نشطة
                                                    </span>
                                                )}
                                                {isAdmin && year.branch && (
                                                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        {year.branch.name}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                {formatDate(year.start_date)} <span className="mx-2 font-black text-slate-300 dark:text-slate-600">إلى</span> {formatDate(year.end_date)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => toggleYearActive(year.id)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${year.is_active ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400' : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'}`}>
                                            {year.is_active ? 'إبطال التنشيط' : 'تعيين كنشطة'}
                                        </button>
                                        <button onClick={() => openEditYear(year)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => deleteYear(year.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Semesters Container (Expanded) */}
                                {expandedYears[year.id] && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-b-3xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <LayoutList className="w-4 h-4" />
                                                الفصول الدراسية ({year.semesters_count})
                                            </h4>
                                            <button onClick={() => openNewSemester(year.id)} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700">
                                                <Plus size={16} /> إضافة فصل
                                            </button>
                                        </div>

                                        {year.semesters && year.semesters.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {year.semesters.map(semester => (
                                                    <div key={semester.id} className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border ${semester.is_active ? 'border-emerald-300 dark:border-emerald-700 shadow-sm' : 'border-slate-200 dark:border-slate-800'}`}>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h5 className="font-bold text-slate-900 dark:text-white">{semester.name}</h5>
                                                                <p className="text-xs text-slate-500 mt-1">الترتيب: {semester.term_number}</p>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => toggleSemesterActive(semester.id)} className={`p-1.5 rounded-lg transition-colors ${semester.is_active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={semester.is_active ? 'تعطيل' : 'تفعيل'}>
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => openEditSemester(semester, year.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => deleteSemester(semester.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>{formatDate(semester.start_date)}</span>
                                                            </div>
                                                            <span className="text-slate-300 dark:text-slate-600 font-black">|</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>{formatDate(semester.end_date)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-sm text-slate-500">لم يتم إضافة أي فصول دراسية لهذه السنة بعد.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Year Modal */}
            <Modal isOpen={isYearModalOpen} onClose={() => setIsYearModalOpen(false)} title={editingYear ? "تعديل سنة دراسية" : "إضافة سنة دراسية جديدة"}>
                <form onSubmit={submitYear} className="space-y-4">
                    <div>
                        <label className="block text-sm font-black text-slate-800 dark:text-slate-300 mb-1.5">اسم السنة الدراسية *</label>
                        <input type="text" value={yearForm.name} onChange={e => setYearForm({...yearForm, name: e.target.value})} placeholder="مثال: 2025/2026" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 dark:text-white font-bold placeholder:text-slate-400" required />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ البداية <span className="text-rose-500">*</span></label>
                            <FlatpickrInput type="date" value={yearForm.start_date} onChange={date => setYearForm({...yearForm, start_date: date})} required />
                            {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ النهاية <span className="text-rose-500">*</span></label>
                            <FlatpickrInput type="date" value={yearForm.end_date} onChange={date => setYearForm({...yearForm, end_date: date})} required />
                            {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-black text-slate-800 dark:text-slate-300 mb-2">أيام الدوام المدرسي <span className="text-rose-500">*</span></label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map(day => {
                                const isSelected = yearForm.working_days.includes(day.id);
                                return (
                                    <button
                                        type="button"
                                        key={day.id}
                                        onClick={() => {
                                            const newDays = isSelected 
                                                ? yearForm.working_days.filter(d => d !== day.id)
                                                : [...yearForm.working_days, day.id];
                                            
                                            // Sort based on DAYS_OF_WEEK order
                                            const orderedDays = DAYS_OF_WEEK.map(d => d.id).filter(id => newDays.includes(id));
                                            
                                            setYearForm({ ...yearForm, working_days: orderedDays });
                                        }}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                            isSelected 
                                                ? 'bg-primary-50 text-primary-700 border-2 border-primary-500 dark:bg-primary-500/20 dark:text-primary-300 dark:border-primary-500 shadow-sm scale-105'
                                                : 'bg-slate-50 text-slate-500 border-2 border-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {day.name}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.working_days && <p className="text-red-500 text-xs mt-1">{errors.working_days}</p>}
                    </div>

                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-black text-slate-800 dark:text-slate-300 mb-1.5">الفرع (اختياري)</label>
                            <SelectInput 
                                value={yearForm.branch_id} 
                                onChange={val => setYearForm({...yearForm, branch_id: val})} 
                                options={[
                                    { value: '', label: 'عام للكل' },
                                    ...branches.map(b => ({ value: b.id, label: b.name }))
                                ]}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-black text-slate-800 dark:text-slate-300 mb-1.5">ملاحظات</label>
                        <textarea value={yearForm.notes} onChange={e => setYearForm({...yearForm, notes: e.target.value})} rows="2" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 dark:text-white font-bold resize-none"></textarea>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => setIsYearModalOpen(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button type="submit" className="px-8 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30 transition-all">
                            {editingYear ? 'حفظ التعديلات' : 'إضافة السنة الدراسية'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Semester Modal */}
            <Modal isOpen={isSemesterModalOpen} onClose={() => setIsSemesterModalOpen(false)} title={editingSemester ? "تعديل فصل دراسي" : "إضافة فصل دراسي"}>
                <form onSubmit={submitSemester} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-black text-slate-800 dark:text-slate-300 mb-1.5">اسم الفصل *</label>
                            <input type="text" value={semesterForm.name} onChange={e => setSemesterForm({...semesterForm, name: e.target.value})} placeholder="مثال: الفصل الأول" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 dark:text-white font-bold placeholder:text-slate-400" required />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-black text-slate-800 dark:text-slate-300 mb-1.5">ترتيب الفصل (رقم) *</label>
                            <input type="number" min="1" value={semesterForm.term_number} onChange={e => setSemesterForm({...semesterForm, term_number: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 dark:text-white font-bold" required />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ البداية <span className="text-rose-500">*</span></label>
                            <FlatpickrInput type="date" value={semesterForm.start_date} onChange={date => setSemesterForm({...semesterForm, start_date: date})} required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ النهاية <span className="text-rose-500">*</span></label>
                            <FlatpickrInput type="date" value={semesterForm.end_date} onChange={date => setSemesterForm({...semesterForm, end_date: date})} required />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => setIsSemesterModalOpen(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button type="submit" className="px-8 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30 transition-all">
                            {editingSemester ? 'حفظ التعديلات' : 'إضافة الفصل'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Year Confirmation Modal */}
            {deletingYearId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeletingYearId(null)}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            هل أنت متأكد من حذف هذه السنة الدراسية بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء ولا يمكن الحذف إذا كانت السنة مرتبطة ببيانات أخرى مثل الفصول والجداول.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmDeleteYear}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all"
                            >
                                حذف نهائياً
                            </button>
                            <button
                                onClick={() => setDeletingYearId(null)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                            >
                                تراجع
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Semester Confirmation Modal */}
            {deletingSemesterId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeletingSemesterId(null)}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            هل أنت متأكد من حذف هذا الفصل الدراسي؟ لا يمكن الحذف إذا كان مرتبطاً بحصص أو جداول.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmDeleteSemester}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all"
                            >
                                حذف نهائياً
                            </button>
                            <button
                                onClick={() => setDeletingSemesterId(null)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                            >
                                تراجع
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
