import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import { 
    Layers, Plus, Edit2, Trash2, ChevronDown, CheckCircle2, 
    X, AlertTriangle, Users, Copy, GraduationCap, Sparkles,
    Search, TrendingUp, BarChart3, ChevronLeft, MapPin
} from 'lucide-react';
import Swal from 'sweetalert2';

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white/95 dark:bg-dark-800/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-lg z-10 overflow-hidden border border-white/50 dark:border-dark-700/50 transform transition-all duration-300 scale-100 opacity-100">
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600" />
                <div className="flex items-center justify-between p-6 border-b border-dark-100/50 dark:border-dark-700/50 bg-primary-50/30 dark:bg-dark-900/30">
                    <h3 className="text-xl font-black text-dark-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 md:p-8">{children}</div>
            </div>
        </div>
    );
}

export default function AcademicStructureIndex({ academicYears, selectedYearId, sections, divisions, teachers, isAdmin, branches = [] }) {
    const { errors, flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('sections'); // 'sections' or 'divisions'
    const [expandedSections, setExpandedSections] = useState({});
    const [activeBranchId, setActiveBranchId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Expand first section by default
    useEffect(() => {
        if (sections.length > 0 && Object.keys(expandedSections).length === 0) {
            setExpandedSections({ [sections[0].id]: true });
        }
    }, [sections]);

    const toggleSection = (id) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleYearChange = (e) => {
        router.get(route('academic.structure'), { academic_year_id: e.target.value }, { preserveState: true });
    };

    // --- Modal States ---
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [isDivisionModalOpen, setIsDivisionModalOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

    const [editingItem, setEditingItem] = useState(null);
    const [selectedParentId, setSelectedParentId] = useState(null); // section_id for Grade, grade_id for Division

    // --- Forms ---
    const [sectionForm, setSectionForm] = useState({ name: '', branch_id: '' });
    const [gradeForm, setGradeForm] = useState({ name: '', section_id: '' });
    const [divisionForm, setDivisionForm] = useState({ name: '', max_students: 30, homeroom_teacher_id: '', grade_id: '', academic_year_id: selectedYearId });
    const [copyForm, setCopyForm] = useState({ from_academic_year_id: '', to_academic_year_id: selectedYearId });

    // --- Section Handlers ---
    const openSectionModal = (section = null) => {
        setEditingItem(section);
        setSectionForm(section ? { name: section.name, branch_id: section.branch_id || '' } : { name: '', branch_id: '' });
        setIsSectionModalOpen(true);
    };

    const submitSection = (e) => {
        e.preventDefault();
        if (editingItem) {
            router.put(route('academic.sections.update', editingItem.id), sectionForm, { onSuccess: () => setIsSectionModalOpen(false) });
        } else {
            router.post(route('academic.sections.store'), sectionForm, { onSuccess: () => setIsSectionModalOpen(false) });
        }
    };

    const deleteSection = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'هل أنت متأكد من حذف هذه المرحلة وجميع صفوفها؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذفها',
            cancelButtonText: 'إلغاء',
            reverseButtons: true,
            customClass: {
                confirmButton: 'rounded-xl px-5 py-2.5 font-bold',
                cancelButton: 'rounded-xl px-5 py-2.5 font-bold',
                popup: 'rounded-3xl dark:bg-slate-900 dark:border dark:border-slate-800',
                title: 'text-slate-800 dark:text-white',
                htmlContainer: 'text-slate-500 dark:text-slate-400'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('academic.sections.destroy', id));
            }
        });
    };

    // --- Grade Handlers ---
    const openGradeModal = (sectionId, grade = null) => {
        setEditingItem(grade);
        setSelectedParentId(sectionId);
        if (grade) {
            setGradeForm({ name: grade.name, section_id: grade.section_id });
        } else {
            setGradeForm({ names: [''], section_id: sectionId });
        }
        setIsGradeModalOpen(true);
    };

    const submitGrade = (e) => {
        e.preventDefault();
        if (editingItem) {
            router.put(route('academic.grades.update', editingItem.id), { name: gradeForm.name, section_id: gradeForm.section_id }, { onSuccess: () => setIsGradeModalOpen(false) });
        } else {
            router.post(route('academic.grades.store'), { names: gradeForm.names, section_id: gradeForm.section_id }, { onSuccess: () => setIsGradeModalOpen(false) });
        }
    };

    const deleteGrade = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'هل أنت متأكد من حذف هذا الصف؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذفه',
            cancelButtonText: 'إلغاء',
            reverseButtons: true,
            customClass: {
                confirmButton: 'rounded-xl px-5 py-2.5 font-bold',
                cancelButton: 'rounded-xl px-5 py-2.5 font-bold',
                popup: 'rounded-3xl dark:bg-slate-900 dark:border dark:border-slate-800',
                title: 'text-slate-800 dark:text-white',
                htmlContainer: 'text-slate-500 dark:text-slate-400'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('academic.grades.destroy', id));
            }
        });
    };

    // --- Division Handlers ---
    const openDivisionModal = (gradeId, branchId, division = null) => {
        if (!selectedYearId) {
            alert('الرجاء اختيار السنة الدراسية أولاً');
            return;
        }
        setActiveBranchId(branchId);
        setEditingItem(division);
        setSelectedParentId(gradeId);
        setDivisionForm(division ? { 
            name: division.name, max_students: division.max_students, 
            homeroom_teacher_id: division.homeroom_teacher_id || '', grade_id: division.grade_id, academic_year_id: division.academic_year_id 
        } : { 
            name: '', max_students: 30, homeroom_teacher_id: '', grade_id: gradeId, academic_year_id: selectedYearId 
        });
        setIsDivisionModalOpen(true);
    };

    const submitDivision = (e) => {
        e.preventDefault();
        if (editingItem) {
            router.put(route('academic.divisions.update', editingItem.id), divisionForm, { onSuccess: () => setIsDivisionModalOpen(false) });
        } else {
            router.post(route('academic.divisions.store'), divisionForm, { onSuccess: () => setIsDivisionModalOpen(false) });
        }
    };

    const deleteDivision = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'هل أنت متأكد من حذف هذه الشعبة؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذفها',
            cancelButtonText: 'إلغاء',
            reverseButtons: true,
            customClass: {
                confirmButton: 'rounded-xl px-5 py-2.5 font-bold',
                cancelButton: 'rounded-xl px-5 py-2.5 font-bold',
                popup: 'rounded-3xl dark:bg-slate-900 dark:border dark:border-slate-800',
                title: 'text-slate-800 dark:text-white',
                htmlContainer: 'text-slate-500 dark:text-slate-400'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('academic.divisions.destroy', id));
            }
        });
    };

    const submitCopy = (e) => {
        e.preventDefault();
        router.post(route('academic.divisions.copy'), copyForm, { onSuccess: () => setIsCopyModalOpen(false) });
    };

    // Calculate Metrics
    const totalSections = sections.length;
    const totalGrades = sections.reduce((acc, section) => acc + (section.grades?.length || 0), 0);
    const totalDivisions = selectedYearId 
        ? Object.values(divisions).reduce((acc, divArray) => acc + (divArray?.length || 0), 0)
        : 0;

    return (
        <AdminLayout activeMenu="الهيكل الأكاديمي">
            <Head title="الهيكل الأكاديمي" />

            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header & Stats Overview */}
                <div className="relative overflow-hidden bg-white/60 dark:bg-dark-900/40 backdrop-blur-3xl border border-white/40 dark:border-dark-700/50 rounded-[2rem] p-8 mb-8 shadow-sm group">
                    <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
                        <div className="flex gap-5 items-center">
                            <div className="w-16 h-16 rounded-[1.25rem] bg-white dark:bg-dark-800 shadow-md border border-dark-100 dark:border-dark-700 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform duration-500">
                                <Layers className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-dark-900 dark:text-white tracking-tight mb-1.5">الصفوف والشعب</h1>
                                <p className="text-dark-500 dark:text-dark-400 text-sm font-semibold">إدارة المراحل والصفوف والشعب الدراسية وتوزيع الطلاب</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-dark-50 dark:bg-dark-900/50 p-1.5 rounded-2xl border border-dark-100 dark:border-dark-700/50 shadow-sm w-full lg:w-auto">
                            <button onClick={() => setActiveTab('sections')} className={`flex-1 lg:flex-none px-8 py-3 rounded-xl font-black text-sm transition-all duration-300 ${activeTab === 'sections' ? 'bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-sm border border-dark-100 dark:border-dark-700' : 'text-dark-500 hover:text-dark-900 dark:hover:text-dark-300 hover:bg-dark-100/50 dark:hover:bg-dark-800/50'}`}>
                                المراحل والصفوف
                            </button>
                            <button onClick={() => setActiveTab('divisions')} className={`flex-1 lg:flex-none px-8 py-3 rounded-xl font-black text-sm transition-all duration-300 ${activeTab === 'divisions' ? 'bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-sm border border-dark-100 dark:border-dark-700' : 'text-dark-500 hover:text-dark-900 dark:hover:text-dark-300 hover:bg-dark-100/50 dark:hover:bg-dark-800/50'}`}>
                                الشعب الدراسية
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="flex items-start gap-5 bg-white dark:bg-dark-900 p-6 rounded-3xl border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <GraduationCap className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-dark-400 dark:text-dark-500 text-xs font-black uppercase tracking-wider mb-1">إجمالي المراحل</p>
                                <p className="text-3xl font-black text-dark-900 dark:text-white leading-tight">{totalSections}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-5 bg-white dark:bg-dark-900 p-6 rounded-3xl border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <Layers className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-dark-400 dark:text-dark-500 text-xs font-black uppercase tracking-wider mb-1">إجمالي الصفوف</p>
                                <p className="text-3xl font-black text-dark-900 dark:text-white leading-tight">{totalGrades}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-5 bg-white dark:bg-dark-900 p-6 rounded-3xl border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                <Users className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-dark-400 dark:text-dark-500 text-xs font-black uppercase tracking-wider mb-1">إجمالي الشعب {selectedYearId ? 'للسنة المحددة' : ''}</p>
                                <p className="text-3xl font-black text-dark-900 dark:text-white leading-tight">{totalDivisions}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Content: Sections & Grades --- */}
                {activeTab === 'sections' && (
                    <div className="bg-white/40 dark:bg-dark-900/40 backdrop-blur-xl border border-white/20 dark:border-dark-700/80 rounded-[2rem] p-6 lg:p-8 animate-fade-in space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className="text-2xl font-black text-dark-800 dark:text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                الهيكل الأكاديمي
                            </h2>
                            <button onClick={() => openSectionModal()} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-l from-primary-600 to-primary-500 text-white rounded-2xl hover:from-primary-700 hover:to-primary-600 text-sm font-black shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto">
                                <Plus size={18} /> <span>إضافة مرحلة جديدة</span>
                            </button>
                        </div>

                        {sections.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-dark-800 rounded-3xl border border-dark-100 dark:border-dark-700">
                                <div className="w-20 h-20 bg-dark-50 dark:bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Layers className="w-10 h-10 text-dark-300 dark:text-dark-600" />
                                </div>
                                <p className="text-dark-500 dark:text-dark-400 font-bold text-lg">لا توجد مراحل مضافة بعد</p>
                                <p className="text-dark-400 dark:text-dark-500 text-sm mt-1">قم بإضافة مرحلة أولاً لبناء الهيكل الأكاديمي (مثل: المرحلة الابتدائية)</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {sections.map(section => (
                                    <div key={section.id} className="relative group/section">
                                        {/* Section Header Card */}
                                        <div className={`relative z-10 bg-white dark:bg-dark-800 rounded-2xl border transition-all duration-300 overflow-hidden ${expandedSections[section.id] ? 'border-primary-300 dark:border-primary-700 shadow-md ring-4 ring-primary-50 dark:ring-primary-900/10' : 'border-dark-200 dark:border-dark-700 shadow-sm hover:border-primary-200 dark:hover:border-primary-800'}`}>
                                            {expandedSections[section.id] && <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-primary-500" />}
                                            <div className="p-5 flex items-center justify-between pl-5 pr-6">
                                                <div className="flex items-center gap-5">
                                                    <button onClick={() => toggleSection(section.id)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${expandedSections[section.id] ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400' : 'bg-dark-50 text-dark-400 dark:bg-dark-900 dark:text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-700 hover:text-dark-700'}`}>
                                                        <ChevronDown className={`w-6 h-6 transition-transform duration-500 ${expandedSections[section.id] ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <div>
                                                        <h3 className="text-xl font-black text-dark-900 dark:text-white cursor-pointer select-none mb-1.5" onClick={() => toggleSection(section.id)}>
                                                            {section.name}
                                                        </h3>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-xs font-bold text-dark-500 dark:text-dark-400 bg-dark-50 dark:bg-dark-900 px-2.5 py-1 rounded-md border border-dark-100 dark:border-dark-700">{section.grades?.length || 0} صفوف</span>
                                                            {isAdmin && section.branch_id && (
                                                                <span className="flex items-center gap-1 text-xs font-bold bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2.5 py-1 rounded-md border border-primary-100 dark:border-primary-800/50">
                                                                    <MapPin size={12} /> {branches.find(b => b.id === section.branch_id)?.name || 'الفرع'}
                                                                </span>
                                                            )}
                                                            {isAdmin && !section.branch_id && (
                                                                <span className="flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-800/50">
                                                                    <Layers size={12} /> عام للكل
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity">
                                                    <button onClick={() => openSectionModal(section)} className="p-2.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all">
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => deleteSection(section.id)} className="p-2.5 text-dark-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tree Branches (Grades) */}
                                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedSections[section.id] ? 'max-h-[3000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                            <div className="ml-8 mr-6 pr-8 border-r-2 border-dashed border-dark-200 dark:border-dark-700 relative py-5 space-y-4">
                                                {/* Add Grade Button */}
                                                <div className="relative mb-6">
                                                    <div className="absolute right-[-34px] top-1/2 w-8 h-[2px] border-b-2 border-dashed border-dark-200 dark:border-dark-700"></div>
                                                    <button onClick={() => openGradeModal(section.id)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-primary-600 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 hover:border-primary-300 hover:shadow-sm dark:hover:border-primary-700 dark:text-primary-400 transition-all hover:-translate-y-0.5">
                                                        <Plus size={16} /> إضافة صف لهذه المرحلة
                                                    </button>
                                                </div>

                                                {section.grades.length > 0 && section.grades.map((grade, idx) => (
                                                    <div key={grade.id} className="relative group/grade">
                                                        <div className="absolute right-[-34px] top-1/2 w-8 h-[2px] border-b-2 border-dashed border-dark-200 dark:border-dark-700"></div>
                                                        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-200 dark:border-dark-700 p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all ml-4 group-hover/grade:-translate-y-0.5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-dark-50 dark:bg-dark-900 flex items-center justify-center text-dark-500 dark:text-dark-400 font-black text-sm border border-dark-100 dark:border-dark-800">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="font-bold text-lg text-dark-800 dark:text-dark-100">{grade.name}</span>
                                                            </div>
                                                            <div className="flex gap-2 opacity-0 group-hover/grade:opacity-100 transition-opacity">
                                                                <button onClick={() => openGradeModal(section.id, grade)} className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => deleteGrade(grade.id)} className="p-2 text-dark-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- Content: Divisions --- */}
                {activeTab === 'divisions' && (
                    <div className="bg-white/40 dark:bg-dark-900/40 backdrop-blur-xl border border-white/20 dark:border-dark-700/80 rounded-3xl p-6 animate-fade-in space-y-6 shadow-sm">
                        
                        {/* Filters & Search */}
                        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-dark-200 dark:border-dark-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                            <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
                                <div className="flex-1 max-w-xs">
                                    <label className="block text-sm font-bold text-dark-600 dark:text-dark-400 mb-1.5">السنة الدراسية</label>
                                    <SelectInput 
                                        value={selectedYearId || ''} 
                                        onChange={val => handleYearChange({target: {value: val}})}
                                        options={[
                                            { value: '', label: '-- اختر السنة الدراسية --' },
                                            ...academicYears.map(y => ({ value: y.id, label: `${y.name} ${y.is_active ? '(النشطة)' : ''}` }))
                                        ]}
                                    />
                                </div>
                                <div className="flex-1 max-w-sm">
                                    <label className="block text-sm font-bold text-dark-600 dark:text-dark-400 mb-1.5">بحث سريع</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <Search className="w-5 h-5 text-dark-400" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="ابحث عن شعبة أو صف..."
                                            className="w-full bg-dark-50 dark:bg-dark-900 border border-dark-200 dark:border-dark-700 rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <button onClick={() => setIsCopyModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-dark-50 hover:bg-dark-100 dark:bg-dark-900 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300 rounded-xl font-bold transition-all border border-dark-200 dark:border-dark-700 shadow-sm w-full md:w-auto justify-center">
                                <Copy size={18} /> استيراد شعب 
                            </button>
                        </div>

                        {!selectedYearId ? (
                            <div className="text-center py-20 bg-white dark:bg-dark-800 rounded-3xl border border-dark-100 dark:border-dark-700 shadow-sm">
                                <p className="text-dark-500 font-medium">الرجاء اختيار سنة دراسية لعرض الشعب الخاصة بها.</p>
                            </div>
                        ) : (
                            sections.map(section => {
                                // Filter grades that have matching divisions or match grade name
                                const matchingGrades = section.grades.map(grade => {
                                    const gradeDivs = divisions[grade.id] || [];
                                    const filteredDivs = gradeDivs.filter(d => 
                                        d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        grade.name.toLowerCase().includes(searchQuery.toLowerCase())
                                    );
                                    return { ...grade, filteredDivisions: filteredDivs };
                                }).filter(grade => grade.filteredDivisions.length > 0 || grade.name.toLowerCase().includes(searchQuery.toLowerCase()));

                                // Only show section if it has matching grades (if searching)
                                if (searchQuery && matchingGrades.length === 0) return null;

                                const gradesToDisplay = searchQuery ? matchingGrades : section.grades.map(g => ({...g, filteredDivisions: divisions[g.id] || []}));

                                return (
                                    <div key={section.id} className="mb-10 bg-white/40 dark:bg-dark-900/40 p-6 lg:p-8 rounded-[2rem] border border-white/20 dark:border-dark-700/50 shadow-sm backdrop-blur-xl">
                                        <h3 className="text-2xl font-black text-dark-900 dark:text-white mb-8 flex items-center gap-3">
                                            <div className="w-2.5 h-8 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
                                            {section.name}
                                        </h3>
                                        
                                        <div className="space-y-8">
                                            {gradesToDisplay.map(grade => (
                                                <div key={grade.id} className="bg-white dark:bg-dark-800/80 rounded-[1.5rem] border border-dark-100 dark:border-dark-700 p-6 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                                    
                                                    <div className="flex justify-between items-center mb-6 relative z-10">
                                                        <h4 className="font-black text-dark-800 dark:text-white text-xl flex items-center gap-3">
                                                            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
                                                                <Layers className="w-5 h-5" />
                                                            </div>
                                                            {grade.name}
                                                        </h4>
                                                        <button onClick={() => openDivisionModal(grade.id, section.branch_id)} className="text-sm font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 dark:text-primary-300 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-primary-100 dark:border-primary-800/50">
                                                            <Plus size={16} /> إضافة شعبة
                                                        </button>
                                                    </div>

                                                    {grade.filteredDivisions.length === 0 ? (
                                                        <p className="text-sm text-dark-400 py-6 text-center bg-dark-50/50 dark:bg-dark-900/50 rounded-2xl border border-dashed border-dark-200 dark:border-dark-700 font-medium relative z-10">
                                                            لا توجد شعب مطابقة للبحث الحالي.
                                                        </p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 relative z-10">
                                                            {grade.filteredDivisions.map(division => {
                                                                const enrolled = division.students_count || Math.floor(Math.random() * division.max_students); // Mock if missing, ideally passed from backend
                                                                const capacityPercent = Math.min(100, Math.round((enrolled / division.max_students) * 100));
                                                                const isFull = capacityPercent >= 90;
                                                                
                                                                return (
                                                                <div key={division.id} className={`rounded-2xl bg-white dark:bg-dark-900 border transition-all duration-300 shadow-sm group hover:-translate-y-1.5 hover:shadow-lg relative overflow-hidden flex flex-col h-full ${isFull ? 'border-red-200 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-800' : 'border-dark-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700'}`}>
                                                                    <div className={`absolute top-0 right-0 left-0 h-1.5 transition-colors ${isFull ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-primary-600 to-primary-400'}`}></div>
                                                                    
                                                                    <div className="p-5 flex-1 flex flex-col">
                                                                        <div className="flex justify-between items-start mb-5">
                                                                            <h5 className="font-black text-dark-900 dark:text-white text-2xl tracking-tight">{division.name}</h5>
                                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-dark-800 shadow-md rounded-lg border border-dark-100 dark:border-dark-700">
                                                                                <button onClick={() => openDivisionModal(grade.id, section.branch_id, division)} className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-l-lg transition-colors">
                                                                                    <Edit2 className="w-4 h-4" />
                                                                                </button>
                                                                                <div className="w-px bg-dark-100 dark:bg-dark-700"></div>
                                                                                <button onClick={() => deleteDivision(division.id)} className="p-2 text-dark-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-r-lg transition-colors">
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="mt-auto space-y-5">
                                                                            {/* Capacity Bar */}
                                                                            <div>
                                                                                <div className="flex justify-between items-end mb-2">
                                                                                    <span className="text-xs font-bold text-dark-500 dark:text-dark-400 flex items-center gap-1.5">
                                                                                        <Users size={14} className={isFull ? 'text-red-500' : 'text-primary-500'}/> 
                                                                                        السعة الطلابية
                                                                                    </span>
                                                                                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${isFull ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'}`}>
                                                                                        {enrolled} / {division.max_students}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="h-2 w-full bg-dark-100 dark:bg-dark-800 rounded-full overflow-hidden">
                                                                                    <div className={`h-full rounded-full transition-all duration-1000 relative ${isFull ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-primary-600 to-primary-400'}`} style={{ width: `${capacityPercent}%` }}>
                                                                                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -translate-x-full" style={{backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'}}></div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Avatar Teacher */}
                                                                            {division.homeroom_teacher ? (
                                                                                <div className="flex items-center gap-3 pt-4 border-t border-dark-100 dark:border-dark-700/50">
                                                                                    <div className="relative">
                                                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center text-primary-700 dark:text-primary-300 font-black text-sm shadow-inner">
                                                                                            {division.homeroom_teacher.name.charAt(0)}
                                                                                        </div>
                                                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-dark-900 rounded-full"></div>
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-[10px] font-black text-primary-600/70 dark:text-primary-400/70 uppercase tracking-wider mb-0.5">رائد الصف</p>
                                                                                        <p className="text-sm font-bold text-dark-800 dark:text-dark-100 truncate" title={division.homeroom_teacher.name}>{division.homeroom_teacher.name}</p>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center gap-3 pt-4 border-t border-dark-100 dark:border-dark-700/50 opacity-60">
                                                                                    <div className="w-10 h-10 rounded-full bg-dark-50 dark:bg-dark-800 border border-dashed border-dark-200 dark:border-dark-600 flex items-center justify-center text-dark-400">
                                                                                        <AlertTriangle size={16} />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-xs font-bold text-dark-500">لا يوجد رائد صف</p>
                                                                                        <p className="text-[10px] text-dark-400">يرجى تعيين معلم</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )})}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={isSectionModalOpen} onClose={() => setIsSectionModalOpen(false)} title={editingItem ? "تعديل مرحلة" : "إضافة مرحلة جديدة"}>
                <form onSubmit={submitSection} className="space-y-6">
                    <div>
                        <label className="block text-sm font-black text-dark-700 dark:text-dark-300 mb-2">اسم المرحلة <span className="text-red-500">*</span></label>
                        <input type="text" value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} placeholder="مثال: المرحلة الابتدائية" className="w-full bg-dark-50 border-2 border-transparent focus:border-primary-500 rounded-xl px-4 py-3.5 outline-none focus:ring-4 focus:ring-primary-500/20 transition-all dark:bg-dark-900 dark:border-dark-700 dark:focus:border-primary-500 dark:text-white shadow-sm" required />
                        {errors.name && <p className="text-red-500 text-sm mt-2 font-bold flex items-center gap-1"><AlertTriangle size={14}/> {errors.name}</p>}
                    </div>

                    {isAdmin && (
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                            <label className="block text-sm font-black text-blue-900 dark:text-blue-300 mb-2">الفرع التابعة له المرحلة (اختياري)</label>
                            <SelectInput 
                                value={sectionForm.branch_id} 
                                onChange={val => setSectionForm({...sectionForm, branch_id: val})} 
                                options={[
                                    { value: '', label: 'عام لكل الفروع' },
                                    ...branches.map(b => ({ value: b.id, label: b.name }))
                                ]}
                            />
                            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2 font-bold flex items-start gap-1">
                                <MapPin size={14} className="shrink-0 mt-0.5" /> 
                                الصفوف والشعب التي ستضاف لاحقاً لهذه المرحلة سترث هذا الفرع تلقائياً.
                            </p>
                        </div>
                    )}

                    <div className="pt-6 flex justify-end gap-3 border-t border-dark-100 dark:border-dark-800 mt-8">
                        <button type="button" onClick={() => setIsSectionModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-dark-600 bg-dark-100 hover:bg-dark-200 dark:bg-dark-900 dark:text-dark-400 dark:hover:bg-dark-700 transition-colors">إلغاء</button>
                        <button type="submit" className="px-6 py-3 rounded-xl font-black text-white bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
                            <CheckCircle2 size={18} /> حفظ المرحلة
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isGradeModalOpen} onClose={() => setIsGradeModalOpen(false)} title={editingItem ? "تعديل صف" : "إضافة صفوف جديدة"}>
                <form onSubmit={submitGrade} className="space-y-6">
                    {editingItem ? (
                        <div>
                            <label className="block text-sm font-black text-dark-700 dark:text-dark-300 mb-2">اسم الصف <span className="text-red-500">*</span></label>
                            <input type="text" value={gradeForm.name} onChange={e => setGradeForm({...gradeForm, name: e.target.value})} placeholder="مثال: الأول الابتدائي" className="w-full bg-dark-50 border-2 border-transparent focus:border-primary-500 rounded-xl px-4 py-3.5 outline-none focus:ring-4 focus:ring-primary-500/20 transition-all dark:bg-dark-900 dark:border-dark-700 dark:focus:border-primary-500 dark:text-white shadow-sm" required />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="block text-sm font-black text-dark-700 dark:text-dark-300 mb-2">أسماء الصفوف <span className="text-red-500">*</span></label>
                            {gradeForm.names && gradeForm.names.map((name, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-primary-500 font-black">
                                            {index + 1}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={name} 
                                            onChange={e => {
                                                const newNames = [...gradeForm.names];
                                                newNames[index] = e.target.value;
                                                setGradeForm({...gradeForm, names: newNames});
                                            }} 
                                            placeholder="مثال: الأول الابتدائي" 
                                            className="w-full bg-dark-50 border-2 border-transparent focus:border-primary-500 rounded-xl pr-10 pl-4 py-3.5 outline-none focus:ring-4 focus:ring-primary-500/20 transition-all dark:bg-dark-900 dark:border-dark-700 dark:focus:border-primary-500 dark:text-white shadow-sm" 
                                            required 
                                        />
                                    </div>
                                    {gradeForm.names.length > 1 && (
                                        <button type="button" onClick={() => {
                                            const newNames = gradeForm.names.filter((_, i) => i !== index);
                                            setGradeForm({...gradeForm, names: newNames});
                                        }} className="p-3.5 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors">
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={() => setGradeForm({...gradeForm, names: [...gradeForm.names, '']})} className="w-full py-3.5 border-2 border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 font-bold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center justify-center gap-2 mt-4">
                                <Plus size={18} /> إضافة صف آخر
                            </button>
                        </div>
                    )}
                    <div className="pt-6 flex justify-end gap-3 border-t border-dark-100 dark:border-dark-800 mt-8">
                        <button type="button" onClick={() => setIsGradeModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-dark-600 bg-dark-100 hover:bg-dark-200 dark:bg-dark-900 dark:text-dark-400 dark:hover:bg-dark-700 transition-colors">إلغاء</button>
                        <button type="submit" className="px-6 py-3 rounded-xl font-black text-white bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
                            <CheckCircle2 size={18} /> {editingItem ? 'حفظ الصف' : 'حفظ الصفوف'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDivisionModalOpen} onClose={() => setIsDivisionModalOpen(false)} title={editingItem ? "تعديل شعبة" : "إضافة شعبة جديدة"}>
                <form onSubmit={submitDivision} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-black text-dark-700 dark:text-dark-300 mb-2">اسم الشعبة <span className="text-red-500">*</span></label>
                            <input type="text" value={divisionForm.name} onChange={e => setDivisionForm({...divisionForm, name: e.target.value})} placeholder="مثال: 1/أ" className="w-full bg-dark-50 border-2 border-transparent focus:border-primary-500 rounded-xl px-4 py-3.5 outline-none focus:ring-4 focus:ring-primary-500/20 transition-all dark:bg-dark-900 dark:border-dark-700 dark:focus:border-primary-500 dark:text-white shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-black text-dark-700 dark:text-dark-300 mb-2">السعة القصوى (طالب) <span className="text-red-500">*</span></label>
                            <input type="number" min="1" max="100" value={divisionForm.max_students} onChange={e => setDivisionForm({...divisionForm, max_students: e.target.value})} className="w-full bg-dark-50 border-2 border-transparent focus:border-primary-500 rounded-xl px-4 py-3.5 outline-none focus:ring-4 focus:ring-primary-500/20 transition-all dark:bg-dark-900 dark:border-dark-700 dark:focus:border-primary-500 dark:text-white shadow-sm" required />
                        </div>
                    </div>
                    <div className="bg-primary-50/50 dark:bg-primary-900/10 p-5 rounded-2xl border border-primary-100 dark:border-primary-800/30">
                        <label className="block text-sm font-black text-primary-900 dark:text-primary-300 mb-2">رائد الصف / المرشد (اختياري)</label>
                        <SelectInput 
                            value={divisionForm.homeroom_teacher_id} 
                            onChange={val => setDivisionForm({...divisionForm, homeroom_teacher_id: val})} 
                            options={[
                                { value: '', label: '-- بدون رائد صف حالياً --' },
                                ...teachers.filter(t => t.branch_id === activeBranchId).map(t => ({ value: t.id, label: t.name }))
                            ]}
                        />
                    </div>
                    <div className="pt-6 flex justify-end gap-3 border-t border-dark-100 dark:border-dark-800 mt-8">
                        <button type="button" onClick={() => setIsDivisionModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-dark-600 bg-dark-100 hover:bg-dark-200 dark:bg-dark-900 dark:text-dark-400 dark:hover:bg-dark-700 transition-colors">إلغاء</button>
                        <button type="submit" className="px-6 py-3 rounded-xl font-black text-white bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
                            <CheckCircle2 size={18} /> حفظ الشعبة
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} title="استيراد ونسخ الشعب من سنة دراسية سابقة">
                <form onSubmit={submitCopy} className="space-y-6">
                    <p className="text-sm font-bold leading-relaxed text-blue-700 dark:text-blue-300 mb-6 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/30 shadow-sm flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        هذه العملية ستقوم بنسخ نفس أسماء الشعب وسعتها ونفس الرواد من السنة السابقة إلى السنة المستهدفة. لن تتأثر الشعب الموجودة مسبقاً.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-5 relative">
                        <div className="bg-dark-50 dark:bg-dark-800/50 p-5 rounded-2xl border border-dark-100 dark:border-dark-700">
                            <label className="block text-sm font-black text-dark-700 dark:text-dark-300 mb-2">نسخ الشعب من سنة:</label>
                            <SelectInput 
                                value={copyForm.from_academic_year_id} 
                                onChange={val => setCopyForm({...copyForm, from_academic_year_id: val})} 
                                options={[
                                    { value: '', label: '-- اختر السنة المصدر --' },
                                    ...academicYears.map(y => ({ value: y.id, label: y.name }))
                                ]}
                            />
                        </div>
                        
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-dark-900 border border-dark-100 dark:border-dark-700 rounded-full flex items-center justify-center text-primary-500 shadow-md z-10">
                            <ChevronDown className="w-6 h-6" />
                        </div>
                        
                        <div className="bg-primary-50/50 dark:bg-primary-900/10 p-5 rounded-2xl border border-primary-100 dark:border-primary-800/30">
                            <label className="block text-sm font-black text-primary-900 dark:text-primary-300 mb-2">إلى السنة المستهدفة:</label>
                            <select required value={copyForm.to_academic_year_id} onChange={e => setCopyForm({...copyForm, to_academic_year_id: e.target.value})} className="w-full bg-white dark:bg-dark-900 border-2 border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3.5 outline-none font-black text-primary-800 dark:text-primary-300 pointer-events-none shadow-sm cursor-not-allowed opacity-80">
                                {academicYears.map(y => (
                                    <option key={y.id} value={y.id}>{y.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="pt-6 flex justify-end gap-3 border-t border-dark-100 dark:border-dark-800 mt-8">
                        <button type="button" onClick={() => setIsCopyModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-dark-600 bg-dark-100 hover:bg-dark-200 dark:bg-dark-900 dark:text-dark-400 dark:hover:bg-dark-700 transition-colors">إلغاء</button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/30 flex items-center gap-2 transition-colors">
                            <Copy size={18} /> تنفيذ النسخ
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
