import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import { 
    Layers, Plus, Edit2, Trash2, ChevronDown, CheckCircle2, 
    X, AlertTriangle, Users, Copy, GraduationCap, Sparkles
} from 'lucide-react';
import Swal from 'sweetalert2';

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

export default function AcademicStructureIndex({ academicYears, selectedYearId, sections, divisions, teachers, isAdmin, branches = [] }) {
    const { errors, flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('sections'); // 'sections' or 'divisions'
    const [expandedSections, setExpandedSections] = useState({});
    const [activeBranchId, setActiveBranchId] = useState(null);
    
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
        setGradeForm(grade ? { name: grade.name, section_id: grade.section_id } : { name: '', section_id: sectionId });
        setIsGradeModalOpen(true);
    };

    const submitGrade = (e) => {
        e.preventDefault();
        if (editingItem) {
            router.put(route('academic.grades.update', editingItem.id), gradeForm, { onSuccess: () => setIsGradeModalOpen(false) });
        } else {
            const payload = { ...gradeForm, names: gradeForm.name.split(',').map(n => n.trim()).filter(n => n) };
            router.post(route('academic.grades.store'), payload, { onSuccess: () => setIsGradeModalOpen(false) });
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

    return (
        <AdminLayout activeMenu="الهيكل الأكاديمي">
            <Head title="الهيكل الأكاديمي" />

            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none no-print bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary-600 dark:text-primary-400 transition-transform">
                                <Layers className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">الصفوف والشعب</h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 text-sm font-semibold flex items-center gap-2">إدارة المراحل والصفوف والشعب الدراسية</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                            <button onClick={() => setActiveTab('sections')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'sections' ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                المراحل والصفوف
                            </button>
                            <button onClick={() => setActiveTab('divisions')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'divisions' ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                الشعب الدراسية
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Content: Sections & Grades --- */}
                {activeTab === 'sections' && (
                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 rounded-3xl shadow-sm dark:shadow-none p-6 animate-fade-in space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary-500" /> المراحل الدراسية
                            </h2>
                            <button onClick={() => openSectionModal()} className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 text-sm font-bold shadow-lg shadow-primary-500/10 transition-all shrink-0 active:scale-95">
                                <Plus size={18} /> <span>إضافة مرحلة</span>
                            </button>
                        </div>

                        {sections.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <p className="text-slate-500">لا توجد مراحل مضافة. قم بإضافة مرحلة أولاً (مثل: المرحلة الابتدائية).</p>
                            </div>
                        ) : (
                            sections.map(section => (
                                <div key={section.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="p-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => toggleSection(section.id)} className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                                                <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${expandedSections[section.id] ? 'rotate-180' : ''}`} />
                                            </button>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-slate-800 dark:text-white cursor-pointer" onClick={() => toggleSection(section.id)}>{section.name}</h3>
                                                {isAdmin && section.branch_id && (
                                                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                        {branches.find(b => b.id === section.branch_id)?.name || 'الفرع'}
                                                    </span>
                                                )}
                                                {isAdmin && !section.branch_id && (
                                                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                                                        عام للكل
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openSectionModal(section)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteSection(section.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {expandedSections[section.id] && (
                                        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-slate-600 dark:text-slate-400">الصفوف التابعة للمرحلة</h4>
                                                <button onClick={() => openGradeModal(section.id)} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                                                    <Plus size={16} /> إضافة صف
                                                </button>
                                            </div>

                                            {section.grades.length === 0 ? (
                                                <p className="text-sm text-slate-500 text-center py-4">لم يتم إضافة أي صفوف لهذه المرحلة.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {section.grades.map(grade => (
                                                        <div key={grade.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">{grade.name}</span>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => openGradeModal(section.id, grade)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button onClick={() => deleteGrade(grade.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- Content: Divisions --- */}
                {activeTab === 'divisions' && (
                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 rounded-3xl shadow-sm dark:shadow-none p-6 animate-fade-in space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">عرض الشعب للسنة الدراسية:</label>
                                <div className="w-64">
                                    <SelectInput 
                                        value={selectedYearId || ''} 
                                        onChange={val => handleYearChange({target: {value: val}})}
                                        options={[
                                            { value: '', label: '-- اختر السنة الدراسية --' },
                                            ...academicYears.map(y => ({ value: y.id, label: `${y.name} ${y.is_active ? '(النشطة)' : ''}` }))
                                        ]}
                                    />
                                </div>
                            </div>
                            
                            <button onClick={() => setIsCopyModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all">
                                <Copy size={18} /> استيراد شعب من سنة سابقة
                            </button>
                        </div>

                        {!selectedYearId ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <p className="text-slate-500 font-medium">الرجاء اختيار سنة دراسية لعرض الشعب الخاصة بها.</p>
                            </div>
                        ) : (
                            sections.map(section => (
                                <div key={section.id} className="mb-8">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 border-b-2 border-primary-500/20 pb-2 inline-block">
                                        {section.name}
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        {section.grades.map(grade => (
                                            <div key={grade.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-lg flex items-center gap-2">
                                                        <div className="w-2 h-6 bg-primary-500 rounded-full"></div>
                                                        {grade.name}
                                                    </h4>
                                                    <button onClick={() => openDivisionModal(grade.id, section.branch_id)} className="text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                                        <Plus size={14} /> إضافة شعبة
                                                    </button>
                                                </div>

                                                {(!divisions[grade.id] || divisions[grade.id].length === 0) ? (
                                                    <p className="text-sm text-slate-400 py-2">لا توجد شعب لهذا الصف في هذه السنة الدراسية.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                        {divisions[grade.id].map(division => (
                                                            <div key={division.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 relative group">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h5 className="font-black text-primary-600 dark:text-primary-400 text-lg">{division.name}</h5>
                                                                    <div className="flex gap-1">
                                                                        <button onClick={() => openDivisionModal(grade.id, section.branch_id, division)} className="p-1 text-slate-400 hover:text-primary-600">
                                                                            <Edit2 className="w-4 h-4" />
                                                                        </button>
                                                                        <button onClick={() => deleteDivision(division.id)} className="p-1 text-slate-400 hover:text-red-600">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5 mt-3">
                                                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                                                        <span>السعة القصوى: <strong className="text-slate-700 dark:text-slate-300">{division.max_students}</strong></span>
                                                                    </div>
                                                                    {division.homeroom_teacher && (
                                                                        <div className="flex items-center gap-2 text-xs text-primary-600/80 bg-primary-50/50 dark:bg-primary-500/5 px-2 py-1.5 rounded-lg border border-primary-100 dark:border-primary-900/30">
                                                                            <GraduationCap className="w-3.5 h-3.5" />
                                                                            <span className="truncate" title={division.homeroom_teacher.name}>{division.homeroom_teacher.name}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={isSectionModalOpen} onClose={() => setIsSectionModalOpen(false)} title={editingItem ? "تعديل مرحلة" : "إضافة مرحلة جديدة"}>
                <form onSubmit={submitSection} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم المرحلة *</label>
                        <input type="text" value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} placeholder="مثال: المرحلة الابتدائية" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white" required />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-black text-slate-800 dark:text-slate-300 mb-1.5">الفرع التابعة له المرحلة (اختياري)</label>
                            <SelectInput 
                                value={sectionForm.branch_id} 
                                onChange={val => setSectionForm({...sectionForm, branch_id: val})} 
                                options={[
                                    { value: '', label: 'عام لكل الفروع' },
                                    ...branches.map(b => ({ value: b.id, label: b.name }))
                                ]}
                            />
                            <p className="text-xs text-slate-500 mt-1.5">الصفوف والشعب التي ستضاف لاحقاً لهذه المرحلة سترث هذا الفرع تلقائياً.</p>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => setIsSectionModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">إلغاء</button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700">حفظ</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isGradeModalOpen} onClose={() => setIsGradeModalOpen(false)} title={editingItem ? "تعديل صف" : "إضافة صف جديد"}>
                <form onSubmit={submitGrade} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم الصف *</label>
                        <input type="text" value={gradeForm.name} onChange={e => setGradeForm({...gradeForm, name: e.target.value})} placeholder="مثال: الأول, الثاني (يمكن إضافة أكثر من صف بفاصلة)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white" required />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        {errors.names && <p className="text-red-500 text-xs mt-1">{errors.names}</p>}
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => setIsGradeModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">إلغاء</button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700">حفظ</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDivisionModalOpen} onClose={() => setIsDivisionModalOpen(false)} title={editingItem ? "تعديل شعبة" : "إضافة شعبة جديدة"}>
                <form onSubmit={submitDivision} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم الشعبة *</label>
                            <input type="text" value={divisionForm.name} onChange={e => setDivisionForm({...divisionForm, name: e.target.value})} placeholder="مثال: 1/أ" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">السعة القصوى (طالب) *</label>
                            <input type="number" min="1" max="100" value={divisionForm.max_students} onChange={e => setDivisionForm({...divisionForm, max_students: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">رائد الصف / المرشد (اختياري)</label>
                        <SelectInput 
                            value={divisionForm.homeroom_teacher_id} 
                            onChange={val => setDivisionForm({...divisionForm, homeroom_teacher_id: val})} 
                            options={[
                                { value: '', label: '-- بدون رائد صف حالياً --' },
                                ...teachers.filter(t => t.branch_id === activeBranchId).map(t => ({ value: t.id, label: t.name }))
                            ]}
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => setIsDivisionModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">إلغاء</button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700">حفظ</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} title="استيراد ونسخ الشعب من سنة دراسية سابقة">
                <form onSubmit={submitCopy} className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 bg-primary-50 dark:bg-primary-500/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/30">
                        هذه العملية ستقوم بنسخ نفس أسماء الشعب وسعتها ونفس الرواد من السنة السابقة إلى السنة المستهدفة. لن تتأثر الشعب الموجودة مسبقاً.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">نسخ الشعب من سنة:</label>
                            <SelectInput 
                                value={copyForm.from_academic_year_id} 
                                onChange={val => setCopyForm({...copyForm, from_academic_year_id: val})} 
                                options={[
                                    { value: '', label: '-- اختر السنة المصدر --' },
                                    ...academicYears.map(y => ({ value: y.id, label: y.name }))
                                ]}
                            />
                        </div>
                        <div className="flex justify-center text-slate-300 dark:text-slate-600 py-1">
                            <ChevronDown className="w-6 h-6" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">إلى السنة المستهدفة:</label>
                            <select required value={copyForm.to_academic_year_id} onChange={e => setCopyForm({...copyForm, to_academic_year_id: e.target.value})} className="w-full bg-primary-50/50 border border-primary-200 rounded-xl px-4 py-3 outline-none font-bold text-primary-800 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300 pointer-events-none">
                                {academicYears.map(y => (
                                    <option key={y.id} value={y.id}>{y.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
                        <button type="button" onClick={() => setIsCopyModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">إلغاء</button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/30 flex items-center gap-2">
                            <Copy size={18} /> تنفيذ النسخ
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
