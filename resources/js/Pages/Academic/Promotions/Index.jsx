import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Swal from 'sweetalert2';
import { 
    ArrowUpCircle, Calendar, Layers, GraduationCap, Users, Check, 
    ChevronDown, AlertCircle, Rocket, Loader2, UserCheck, UserX,
    ArrowRight, Sparkles, School, CheckCircle2, XCircle, Info
} from 'lucide-react';

function SelectField({ label, value, onChange, options, placeholder, required, icon: Icon, disabled }) {
    return (
        <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                {Icon && <Icon className="w-3.5 h-3.5 inline-block ml-1.5 text-primary-500" />}
                {label}
                {required && <span className="text-rose-500 mr-1">*</span>}
            </label>
            <div className="relative">
                <select 
                    value={value} 
                    onChange={onChange} 
                    required={required}
                    disabled={disabled}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 pr-4 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 dark:text-white font-bold appearance-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="">{placeholder}</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}

export default function PromotionsIndex({ academicYears, sections }) {
    const { flash } = usePage().props;

    // Source selection
    const [sourceYear, setSourceYear] = useState('');
    const [sourceSection, setSourceSection] = useState('');
    const [sourceGrade, setSourceGrade] = useState('');
    const [sourceDivision, setSourceDivision] = useState('');

    // Target selection
    const [targetYear, setTargetYear] = useState('');
    const [targetSection, setTargetSection] = useState('');
    const [targetGrade, setTargetGrade] = useState('');
    const [targetDivision, setTargetDivision] = useState('');

    // Students list
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);

    // Helpers
    const getGrades = (sectionId) => {
        if (!sectionId) return [];
        const section = sections.find(s => s.id == sectionId);
        return section ? section.grades : [];
    };

    const getDivisions = (sectionId, gradeId) => {
        if (!gradeId) return [];
        const grades = getGrades(sectionId);
        const grade = grades.find(g => g.id == gradeId);
        return grade ? grade.divisions : [];
    };

    // Fetch students when source changes
    useEffect(() => {
        if (sourceYear && sourceDivision) {
            setIsLoadingStudents(true);
            axios.post(route('academic.promotions.students'), {
                academic_year_id: sourceYear,
                division_id: sourceDivision
            }).then(response => {
                setStudents(response.data);
                setSelectedStudents(response.data.map(s => s.id));
                setIsLoadingStudents(false);
            }).catch(err => {
                console.error("Error fetching students", err);
                setIsLoadingStudents(false);
            });
        } else {
            setStudents([]);
            setSelectedStudents([]);
        }
    }, [sourceYear, sourceDivision]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudents(students.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(sid => sid !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    const submitPromotion = (e) => {
        e.preventDefault();

        if (selectedStudents.length === 0) {
            Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'الرجاء تحديد طالب واحد على الأقل للترفيع.', confirmButtonText: 'حسناً', customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl px-6 py-2.5 font-bold' } });
            return;
        }

        if (!targetYear || !targetDivision) {
            Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'الرجاء إكمال تحديد الوجهة (السنة والشعبة المستهدفة).', confirmButtonText: 'حسناً', customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl px-6 py-2.5 font-bold' } });
            return;
        }

        if (sourceYear === targetYear) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'لا يمكن أن تكون سنة المصدر هي نفس سنة الوجهة.', confirmButtonText: 'حسناً', customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl px-6 py-2.5 font-bold' } });
            return;
        }

        Swal.fire({
            title: 'تأكيد الترفيع الجماعي',
            html: `<div class="text-right space-y-2">
                <p class="text-slate-600">سيتم ترفيع <strong class="text-primary-600">${selectedStudents.length}</strong> طالباً إلى السنة والشعبة المحددة.</p>
                <p class="text-sm text-slate-400">سيتم إغلاق سجلاتهم في السنة الحالية وإنشاء سجلات جديدة.</p>
            </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، نفّذ الترفيع',
            cancelButtonText: 'إلغاء',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-3xl dark:bg-slate-900 dark:border dark:border-slate-800',
                confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
                cancelButton: 'rounded-xl px-6 py-2.5 font-bold',
                title: 'text-slate-800 dark:text-white',
                htmlContainer: 'text-slate-500 dark:text-slate-400'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                setIsPromoting(true);
                router.post(route('academic.promotions.promote'), {
                    source_year_id: sourceYear,
                    target_year_id: targetYear,
                    target_division_id: targetDivision,
                    enrollment_ids: selectedStudents
                }, {
                    onFinish: () => setIsPromoting(false),
                    preserveScroll: true,
                    onSuccess: () => {
                        setSourceDivision('');
                        setTimeout(() => setSourceDivision(sourceDivision), 100);
                    }
                });
            }
        });
    };

    const isReadyToPromote = selectedStudents.length > 0 && targetDivision && targetYear && !isPromoting;

    // Stats
    const sourceYearName = academicYears.find(y => y.id == sourceYear)?.name || '';
    const targetYearName = academicYears.find(y => y.id == targetYear)?.name || '';

    return (
        <AdminLayout activeMenu="الترفيع الجماعي">
            <Head title="الترفيع الجماعي للطلاب | النظام الأكاديمي" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-3xl text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 px-6 py-4 rounded-3xl text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-2 bg-rose-500/20 rounded-xl">
                            <XCircle size={20} className="text-rose-600 dark:text-rose-400" />
                        </div>
                        {flash.error}
                    </div>
                )}

                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-indigo-100 dark:border-indigo-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
                    
                    {/* Geometric background */}
                    <div className="absolute inset-0 opacity-[0.07] pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-indigo-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-indigo-500" fill="none" />
                            <circle cx="200" cy="80" r="5" className="fill-indigo-500" />
                            <circle cx="600" cy="140" r="7" className="fill-purple-400" />
                            <circle cx="400" cy="50" r="3" className="fill-indigo-300" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">الترفيع الجماعي للطلاب</h1>
                            <p className="text-indigo-700/80 dark:text-indigo-300/80 mt-2 text-sm font-semibold flex items-center gap-2">
                                <ArrowUpCircle className="w-4 h-4" />
                                نقل الطلاب الناجحين إلى العام الدراسي الجديد بضغطة واحدة
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center gap-3">
                            {students.length > 0 && (
                                <div className="flex items-center gap-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm px-5 py-3 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                                            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400">إجمالي</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{students.length}</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                                            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400">محدد</p>
                                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{selectedStudents.length}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Form */}
                <form onSubmit={submitPromotion}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* ── Source Panel ── */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            {/* Panel Header */}
                            <div className="relative px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-500/5 dark:to-orange-500/5">
                                <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-100 dark:bg-amber-500/15 rounded-2xl">
                                        <School className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-white">من — السنة الحالية</h3>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">حدد الشعبة التي تريد ترفيع طلابها</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-5">
                                <SelectField
                                    label="السنة الدراسية الحالية"
                                    value={sourceYear}
                                    onChange={e => setSourceYear(e.target.value)}
                                    options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                                    placeholder="اختر السنة الدراسية..."
                                    icon={Calendar}
                                    required
                                />

                                <div className="grid grid-cols-3 gap-3">
                                    <SelectField
                                        label="المرحلة"
                                        value={sourceSection}
                                        onChange={e => { setSourceSection(e.target.value); setSourceGrade(''); setSourceDivision(''); }}
                                        options={sections.map(s => ({ value: s.id, label: s.name }))}
                                        placeholder="اختر..."
                                        required
                                    />
                                    <SelectField
                                        label="الصف"
                                        value={sourceGrade}
                                        onChange={e => { setSourceGrade(e.target.value); setSourceDivision(''); }}
                                        options={getGrades(sourceSection).map(g => ({ value: g.id, label: g.name }))}
                                        placeholder="اختر..."
                                        disabled={!sourceSection}
                                        required
                                    />
                                    <SelectField
                                        label="الشعبة"
                                        value={sourceDivision}
                                        onChange={e => setSourceDivision(e.target.value)}
                                        options={getDivisions(sourceSection, sourceGrade).map(d => ({ value: d.id, label: d.name }))}
                                        placeholder="اختر..."
                                        disabled={!sourceGrade}
                                        required
                                    />
                                </div>

                                {/* Students List */}
                                {sourceDivision && (
                                    <div className="mt-2 animate-in fade-in slide-in-from-top-3 duration-300">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-amber-500" />
                                                قائمة الطلاب
                                            </h4>
                                            {isLoadingStudents && (
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 animate-pulse">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    جاري التحميل...
                                                </span>
                                            )}
                                            {!isLoadingStudents && students.length > 0 && (
                                                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                                    {selectedStudents.length} / {students.length} محدد
                                                </span>
                                            )}
                                        </div>

                                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-[360px] overflow-y-auto">
                                            {/* Select All Header */}
                                            {students.length > 0 && (
                                                <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                            students.length > 0 && selectedStudents.length === students.length 
                                                            ? 'bg-indigo-500 border-indigo-500' 
                                                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'
                                                        }`}>
                                                            {students.length > 0 && selectedStudents.length === students.length && (
                                                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                                            )}
                                                        </div>
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only"
                                                            checked={students.length > 0 && selectedStudents.length === students.length}
                                                            onChange={handleSelectAll}
                                                        />
                                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">تحديد الكل</span>
                                                    </label>
                                                </div>
                                            )}
                                            
                                            {/* Empty State */}
                                            {students.length === 0 && !isLoadingStudents && (
                                                <div className="text-center py-12 px-6">
                                                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100 dark:border-slate-700">
                                                        <UserX className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا يوجد طلاب في هذه الشعبة</p>
                                                    <p className="text-xs text-slate-400 mt-1">تأكد من اختيار السنة والشعبة الصحيحة</p>
                                                </div>
                                            )}

                                            {/* Loading State */}
                                            {isLoadingStudents && (
                                                <div className="text-center py-12">
                                                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                                                    <p className="text-sm font-bold text-slate-400">جاري تحميل قائمة الطلاب...</p>
                                                </div>
                                            )}

                                            {/* Student Rows */}
                                            {!isLoadingStudents && students.map((student, index) => (
                                                <label 
                                                    key={student.id} 
                                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${
                                                        selectedStudents.includes(student.id) 
                                                        ? 'bg-indigo-50/50 dark:bg-indigo-500/5' 
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    }`}
                                                >
                                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                                                        selectedStudents.includes(student.id) 
                                                        ? 'bg-indigo-500 border-indigo-500' 
                                                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'
                                                    }`}>
                                                        {selectedStudents.includes(student.id) && (
                                                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                                        )}
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only"
                                                        checked={selectedStudents.includes(student.id)}
                                                        onChange={() => handleSelectStudent(student.id)}
                                                    />
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <span className={`text-sm font-bold select-none truncate ${
                                                        selectedStudents.includes(student.id) 
                                                        ? 'text-indigo-800 dark:text-indigo-300' 
                                                        : 'text-slate-700 dark:text-slate-300'
                                                    }`}>
                                                        {student.student_name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Placeholder when no division selected */}
                                {!sourceDivision && (
                                    <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Layers className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">اختر السنة والشعبة أولاً</p>
                                        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">لعرض قائمة الطلاب المتاحين للترفيع</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Target Panel ── */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                            {/* Panel Header */}
                            <div className="relative px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-500/5 dark:to-teal-500/5">
                                <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/15 rounded-2xl">
                                        <ArrowUpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-white">إلى — السنة الجديدة</h3>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">حدد وجهة الترفيع للطلاب المحددين</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-5 flex-1 flex flex-col">
                                <SelectField
                                    label="السنة الدراسية الجديدة"
                                    value={targetYear}
                                    onChange={e => setTargetYear(e.target.value)}
                                    options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                                    placeholder="اختر السنة الدراسية..."
                                    icon={Calendar}
                                    required
                                />

                                <div className="grid grid-cols-3 gap-3">
                                    <SelectField
                                        label="المرحلة"
                                        value={targetSection}
                                        onChange={e => { setTargetSection(e.target.value); setTargetGrade(''); setTargetDivision(''); }}
                                        options={sections.map(s => ({ value: s.id, label: s.name }))}
                                        placeholder="اختر..."
                                        required
                                    />
                                    <SelectField
                                        label="الصف"
                                        value={targetGrade}
                                        onChange={e => { setTargetGrade(e.target.value); setTargetDivision(''); }}
                                        options={getGrades(targetSection).map(g => ({ value: g.id, label: g.name }))}
                                        placeholder="اختر..."
                                        disabled={!targetSection}
                                        required
                                    />
                                    <SelectField
                                        label="الشعبة"
                                        value={targetDivision}
                                        onChange={e => setTargetDivision(e.target.value)}
                                        options={getDivisions(targetSection, targetGrade).map(d => ({ value: d.id, label: d.name }))}
                                        placeholder="اختر..."
                                        disabled={!targetGrade}
                                        required
                                    />
                                </div>

                                {/* Transfer Summary */}
                                <div className="flex-1 flex flex-col justify-end pt-4">
                                    {/* Transfer Flow Visualization */}
                                    {(sourceYear && targetYear && selectedStudents.length > 0) && (
                                        <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-500/5 dark:via-slate-900 dark:to-purple-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl p-5 mb-5 animate-in fade-in duration-300">
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/15 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                                        <School className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    <p className="text-xs font-black text-slate-600 dark:text-slate-300 max-w-[100px] truncate">{sourceYearName}</p>
                                                </div>
                                                
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1 text-indigo-500">
                                                        <div className="w-8 h-0.5 bg-gradient-to-l from-indigo-400 to-transparent rounded" />
                                                        <ArrowRight className="w-5 h-5 animate-pulse" />
                                                    </div>
                                                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg">
                                                        {selectedStudents.length} طالب
                                                    </span>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                                        <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <p className="text-xs font-black text-slate-600 dark:text-slate-300 max-w-[100px] truncate">{targetYearName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Info Note */}
                                    <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-5">
                                        <div className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0 mt-0.5">
                                            <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                                            سيتم إغلاق سجل الطلاب في السنة القديمة (خريج) وإنشاء سجل جديد لهم في السنة والشعبة المحددة أعلاه بصفحة بيضاء للدرجات والغياب.
                                        </p>
                                    </div>

                                    {/* Submit Button */}
                                    <button 
                                        type="submit" 
                                        disabled={!isReadyToPromote}
                                        className={`w-full py-4 px-6 rounded-2xl flex justify-center items-center gap-3 font-black text-base transition-all duration-300 active:scale-[0.98] ${
                                            isReadyToPromote 
                                            ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700' 
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {isPromoting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                جاري تنفيذ الترفيع...
                                            </>
                                        ) : (
                                            <>
                                                <Rocket className="w-5 h-5" />
                                                تنفيذ الترفيع الجماعي
                                                {selectedStudents.length > 0 && (
                                                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg ${isReadyToPromote ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                        {selectedStudents.length} طالب
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
