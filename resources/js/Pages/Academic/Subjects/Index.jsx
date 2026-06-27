import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import { 
    BookOpen, Plus, Edit2, Trash2, Search, X, Layers, AlertCircle, CheckCircle2,
    Calculator, FlaskConical, Globe, Laptop, Music, Palette, Microscope, Languages, Feather,
    LayoutGrid, Table2, Sparkles, MoreVertical, Check, Filter, RotateCcw
} from 'lucide-react';

const AVAILABLE_ICONS = {
    BookOpen, Calculator, FlaskConical, Globe, Laptop, Music, Palette, Microscope, Languages, Feather
};

const ICONS_LIST = [
    { name: 'BookOpen', label: 'كتاب' },
    { name: 'Calculator', label: 'رياضيات' },
    { name: 'FlaskConical', label: 'علوم' },
    { name: 'Globe', label: 'جغرافيا' },
    { name: 'Laptop', label: 'حاسب' },
    { name: 'Music', label: 'موسيقى' },
    { name: 'Palette', label: 'فنون' },
    { name: 'Microscope', label: 'أحياء' },
    { name: 'Languages', label: 'لغات' },
    { name: 'Feather', label: 'أدب' },
];

function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div 
                className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose} 
            />
            <div className="relative bg-white dark:bg-dark-900 rounded-[2rem] shadow-2xl w-full max-w-2xl z-10 overflow-hidden border border-dark-100 dark:border-dark-800 transform transition-all duration-300 scale-100 opacity-100">
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600" />
                <div className="flex items-center justify-between p-6 md:p-8 border-b border-dark-100/50 dark:border-dark-800/50 bg-dark-50/30 dark:bg-dark-900/30">
                    <h3 className="text-xl font-black text-dark-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        {title}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-2.5 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">{children}</div>
            </div>
        </div>
    );
}

function ActionMenu({ subject, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button 
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 p-2 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all duration-200"
            >
                <MoreVertical size={20} />
            </button>
            
            {open && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-dark-900 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-dark-100 dark:border-dark-800 z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                        onClick={() => { onEdit(subject); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
                    >
                        <div className="p-1.5 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                            <Edit2 size={16} />
                        </div>
                        تعديل المادة
                    </button>
                    <div className="h-px bg-dark-100 dark:bg-dark-800 my-1 mx-4" />
                    <button 
                        onClick={() => { onDelete(subject); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <div className="p-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            <Trash2 size={16} />
                        </div>
                        حذف المادة
                    </button>
                </div>
            )}
        </div>
    );
}

export default function SubjectsIndex({ subjects, sections, branches = [], isAdmin = false, filters }) {
    const { flash, errors } = usePage().props;
    const [viewMode, setViewMode] = useState('cards');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    // --- Modal States ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState({ name: '', icon: 'BookOpen', branch_id: '', grade_ids: [] });
    const [processing, setProcessing] = useState(false);

    // Handle Search debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== filters.search) {
                router.get(route('academic.subjects.index'), { search: searchQuery }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, filters.search]);

    // --- Modal Handlers ---
    const openModal = (subject = null) => {
        setEditingItem(subject);
        if (subject) {
            setForm({ 
                name: subject.name, 
                icon: subject.icon || 'BookOpen',
                branch_id: subject.branch_id || '',
                grade_ids: subject.grades.map(g => g.id) 
            });
        } else {
            setForm({ name: '', icon: 'BookOpen', branch_id: '', grade_ids: [] });
        }
        setIsModalOpen(true);
    };

    const selectAllInSection = (section) => {
        const sectionGradeIds = section.grades.map(g => g.id);
        setForm(prev => {
            const allSelected = sectionGradeIds.every(id => prev.grade_ids.includes(id));
            if (allSelected) {
                return { ...prev, grade_ids: prev.grade_ids.filter(id => !sectionGradeIds.includes(id)) };
            } else {
                const newIds = new Set([...prev.grade_ids, ...sectionGradeIds]);
                return { ...prev, grade_ids: Array.from(newIds) };
            }
        });
    };

    const submitForm = (e) => {
        e.preventDefault();
        setProcessing(true);
        if (editingItem) {
            router.put(route('academic.subjects.update', editingItem.id), form, { 
                onSuccess: () => setIsModalOpen(false),
                onFinish: () => setProcessing(false) 
            });
        } else {
            router.post(route('academic.subjects.store'), form, { 
                onSuccess: () => setIsModalOpen(false),
                onFinish: () => setProcessing(false) 
            });
        }
    };

    const deleteSubject = (subject) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'هل أنت متأكد من حذف هذه المادة الدراسية نهائياً؟ ستختفي من كافة الصفوف المرتبطة بها.',
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
                router.delete(route('academic.subjects.destroy', subject.id));
            }
        });
    };

    // Color pallete for tags
    const getTagColor = (index) => {
        const colors = [
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800',
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800',
            'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-800',
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800',
            'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-800',
        ];
        return colors[index % colors.length];
    };

    const getSubjectIcon = (iconName) => {
        const IconComponent = AVAILABLE_ICONS[iconName] || BookOpen;
        return <IconComponent className="w-5 h-5" />;
    };

    const hasActiveFilters = searchQuery !== '';

    // Metrics calculation
    const totalSubjects = subjects.length;
    const unassignedSubjects = subjects.filter(s => s.grades.length === 0).length;
    const totalGradesLinked = subjects.reduce((acc, s) => acc + s.grades.length, 0);

    return (
        <AdminLayout activeMenu="المواد الدراسية">
            <Head title="المواد الدراسية | النظام الأكاديمي" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">

                {flash?.success && (
                    <div className="mb-8 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-3xl text-sm font-bold shadow-sm shadow-emerald-500/5 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-xl">
                                <Check size={20} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            {flash.success}
                        </div>
                    </div>
                )}
                
                {/* Header & Stats Overview */}
                <div className="relative overflow-hidden bg-white/60 dark:bg-dark-900/40 backdrop-blur-3xl border border-white/40 dark:border-dark-700/50 rounded-[2rem] p-8 mb-8 shadow-sm group">
                    <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
                        <div className="flex gap-5 items-center">
                            <div className="w-16 h-16 rounded-[1.25rem] bg-white dark:bg-dark-800 shadow-md border border-dark-100 dark:border-dark-700 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform duration-500">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-dark-900 dark:text-white tracking-tight mb-1.5">إدارة المواد الدراسية</h1>
                                <p className="text-dark-500 dark:text-dark-400 text-sm font-semibold">إدارة وتخصيص المواد والمقررات لصفوف المدرسة</p>
                            </div>
                        </div>

                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-l from-primary-600 to-primary-500 text-white rounded-2xl hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/30 text-sm font-black transition-all active:scale-95 hover:-translate-y-0.5"
                        >
                            <Plus size={20} /> 
                            <span>إضافة مادة جديدة</span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="bg-white/80 dark:bg-dark-800/80 rounded-2xl p-6 border border-dark-100 dark:border-dark-700 shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                                <BookOpen className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-dark-500 dark:text-dark-400 mb-1">إجمالي المواد</p>
                                <p className="text-2xl font-black text-dark-900 dark:text-white">{totalSubjects}</p>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-dark-800/80 rounded-2xl p-6 border border-dark-100 dark:border-dark-700 shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-dark-500 dark:text-dark-400 mb-1">مواد غير مسندة</p>
                                <p className="text-2xl font-black text-dark-900 dark:text-white">{unassignedSubjects}</p>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-dark-800/80 rounded-2xl p-6 border border-dark-100 dark:border-dark-700 shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Layers className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-dark-500 dark:text-dark-400 mb-1">الصفوف المرتبطة</p>
                                <p className="text-2xl font-black text-dark-900 dark:text-white">{totalGradesLinked}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and View Toggles */}
                <div className="bg-white dark:bg-dark-900 rounded-[2rem] p-5 border border-dark-100 dark:border-dark-800 shadow-sm flex flex-col md:flex-row gap-5 items-center justify-between z-20 relative">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1">
                        <div className="relative w-full md:max-w-md">
                            <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input 
                                type="text"
                                placeholder="ابحث باسم المادة..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-5 pr-12 py-3.5 bg-dark-50 dark:bg-dark-950/50 border-2 border-transparent focus:border-primary-500 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/20 dark:text-white transition-all outline-none placeholder:text-dark-400"
                            />
                        </div>

                        {hasActiveFilters && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="flex items-center gap-2 px-5 py-3.5 text-sm font-bold text-dark-600 dark:text-dark-300 bg-dark-100 dark:bg-dark-800 rounded-2xl hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors w-full sm:w-auto justify-center"
                            >
                                <RotateCcw size={18} /> <span>إعادة ضبط</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 bg-dark-100 dark:bg-dark-950 p-2 rounded-2xl w-full sm:w-auto justify-center sm:justify-start">
                        <button 
                            onClick={() => setViewMode('cards')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                                viewMode === 'cards' 
                                ? 'bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-sm' 
                                : 'text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200'
                            }`}
                        >
                            <LayoutGrid size={18} />
                            <span className="hidden sm:inline">شبكة</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                                viewMode === 'table' 
                                ? 'bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-sm' 
                                : 'text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200'
                            }`}
                        >
                            <Table2 size={18} />
                            <span className="hidden sm:inline">قائمة</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                {subjects.length === 0 ? (
                    <div className="text-center py-24 bg-white/50 dark:bg-dark-900/40 backdrop-blur-xl rounded-[2rem] border border-dark-100/50 dark:border-dark-800/50 shadow-sm">
                        <div className="w-24 h-24 bg-white dark:bg-dark-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-dark-200/20 dark:shadow-dark-950/50 border border-dark-50 dark:border-dark-700">
                            <BookOpen className="w-12 h-12 text-dark-300 dark:text-dark-600" />
                        </div>
                        <h3 className="text-2xl font-black text-dark-800 dark:text-white mb-3">لا توجد مواد دراسية</h3>
                        <p className="text-sm font-semibold text-dark-500 dark:text-dark-400 mb-8 max-w-sm mx-auto">لم تقم بإضافة أي مواد دراسية بعد، قم بإضافة مادة واربطها بالصفوف التي تدرسها لتظهر هنا.</p>
                        <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-8 py-4 bg-dark-900 dark:bg-white text-white dark:text-dark-900 rounded-2xl font-black hover:bg-dark-800 dark:hover:bg-dark-50 transition-all shadow-xl hover:-translate-y-1">
                            <Plus size={20} />
                            إضافة المادة الأولى
                        </button>
                    </div>
                ) : (
                    <>
                        {viewMode === 'cards' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {subjects.map(subject => (
                                    <div key={subject.id} className="bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl rounded-[2rem] border border-dark-100 dark:border-dark-800 p-6 shadow-sm hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
                                        {/* Shimmer Effect */}
                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                                        
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/50 to-transparent dark:from-primary-900/20 dark:to-transparent rounded-bl-[100px] transition-transform duration-500 group-hover:scale-110 pointer-events-none" />
                                        
                                        <div className="relative z-10 flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-[1.25rem] bg-white dark:bg-dark-800 shadow-[0_8px_30px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.5)] border border-dark-50 dark:border-dark-700 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                                    {getSubjectIcon(subject.icon)}
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-black text-dark-800 dark:text-white leading-tight mb-1.5">
                                                        {subject.name}
                                                    </h2>
                                                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-dark-500 dark:text-dark-400 bg-dark-50 dark:bg-dark-800/80 px-2.5 py-1 rounded-lg w-fit border border-dark-100 dark:border-dark-700">
                                                        <Layers className="w-3.5 h-3.5 text-primary-500" />
                                                        {subject.grades.length} صفوف دراسية
                                                        {isAdmin && subject.branch && (
                                                            <>
                                                                <span className="text-dark-300 dark:text-dark-600 mx-1">|</span>
                                                                <span className="text-primary-600 dark:text-primary-400">{subject.branch.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ActionMenu subject={subject} onEdit={openModal} onDelete={deleteSubject} />
                                        </div>

                                        {/* Grades Tags */}
                                        <div className="relative z-10">
                                            <div className="flex flex-wrap gap-2">
                                                {subject.grades.length === 0 ? (
                                                    <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-xl w-full text-center border border-dashed border-red-200 dark:border-red-900/30">غير مرتبطة بأي صف</span>
                                                ) : (
                                                    subject.grades.slice(0, 6).map((grade, index) => (
                                                        <span key={grade.id} className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${getTagColor(index)} shadow-sm`}>
                                                            {grade.section ? `${grade.section.name} - ` : ''}{grade.name}
                                                        </span>
                                                    ))
                                                )}
                                                {subject.grades.length > 6 && (
                                                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-dark-100 text-dark-600 dark:bg-dark-800 dark:text-dark-400 border border-dark-200 dark:border-dark-700 shadow-sm cursor-help group/tooltip relative">
                                                        +{subject.grades.length - 6}
                                                        
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-48 p-3 bg-dark-900 dark:bg-white text-white dark:text-dark-900 text-xs rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 pointer-events-none">
                                                            <div className="font-bold mb-2 pb-2 border-b border-white/10 dark:border-dark-900/10">باقي الصفوف:</div>
                                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                                {subject.grades.slice(6).map(g => (
                                                                    <div key={g.id}>{g.section ? `${g.section.name} - ` : ''}{g.name}</div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute -bottom-1 right-1/2 translate-x-1/2 w-2 h-2 bg-dark-900 dark:bg-white rotate-45"></div>
                                                        </div>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/50 dark:bg-dark-900/40 backdrop-blur-xl rounded-[2rem] border border-dark-100 dark:border-dark-800 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right border-collapse">
                                        <thead>
                                            <tr className="bg-dark-50/50 dark:bg-dark-950/50 border-b border-dark-100 dark:border-dark-800">
                                                <th className="py-5 px-6 text-sm font-black text-dark-500 w-1/3">المادة الدراسية</th>
                                                <th className="py-5 px-6 text-sm font-black text-dark-500">الصفوف المرتبطة</th>
                                                <th className="py-5 px-6 text-sm font-black text-dark-500 text-left w-32">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-50 dark:divide-dark-800/50">
                                            {subjects.map(subject => (
                                                <tr key={subject.id} className="hover:bg-white dark:hover:bg-dark-800/50 hover:shadow-lg hover:shadow-dark-200/20 dark:hover:shadow-none transition-all group relative">
                                                    <td className="py-4 px-6 relative">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-[1rem] bg-dark-50 dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform group-hover:bg-white dark:group-hover:bg-dark-700">
                                                                {getSubjectIcon(subject.icon)}
                                                            </div>
                                                            <div>
                                                                <span className="font-black text-dark-800 dark:text-white block mb-1 text-base">{subject.name}</span>
                                                                <span className="text-xs font-bold text-dark-500">
                                                                    {subject.grades.length} صفوف دراسية
                                                                    {isAdmin && subject.branch && <span className="text-primary-500 ml-1">• {subject.branch.name}</span>}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-wrap gap-2">
                                                            {subject.grades.length === 0 ? (
                                                                <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 px-2.5 py-1.5 rounded-xl border border-dashed border-red-200 dark:border-red-900/30">لا توجد صفوف</span>
                                                            ) : (
                                                                subject.grades.slice(0, 3).map((grade, index) => (
                                                                    <span key={grade.id} className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${getTagColor(index)}`}>
                                                                        {grade.section ? `${grade.section.name} - ` : ''}{grade.name}
                                                                    </span>
                                                                ))
                                                            )}
                                                            {subject.grades.length > 3 && (
                                                                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-dark-50 text-dark-600 dark:bg-dark-800 dark:text-dark-400 border border-dark-200 dark:border-dark-700 cursor-help group/tooltip relative">
                                                                    +{subject.grades.length - 3}
                                                                    {/* Tooltip */}
                                                                    <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-48 p-3 bg-dark-900 dark:bg-white text-white dark:text-dark-900 text-xs rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 pointer-events-none">
                                                                        <div className="font-bold mb-2 pb-2 border-b border-white/10 dark:border-dark-900/10">باقي الصفوف:</div>
                                                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                                                            {subject.grades.slice(3).map(g => (
                                                                                <div key={g.id}>{g.section ? `${g.section.name} - ` : ''}{g.name}</div>
                                                                            ))}
                                                                        </div>
                                                                        <div className="absolute -bottom-1 right-1/2 translate-x-1/2 w-2 h-2 bg-dark-900 dark:bg-white rotate-45"></div>
                                                                    </div>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-left">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => openModal(subject)} className="p-2.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-xl transition-all font-bold flex items-center justify-center">
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button onClick={() => deleteSubject(subject)} className="p-2.5 text-dark-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all font-bold flex items-center justify-center">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Form Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "تعديل المادة الدراسية" : "إضافة مادة دراسية"}>
                <form onSubmit={submitForm} className="space-y-6">
                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-black text-dark-800 dark:text-dark-200 mb-2">الفرع <span className="text-red-500">*</span></label>
                            <SelectInput 
                                value={form.branch_id} 
                                onChange={val => setForm({...form, branch_id: val})}
                                options={[
                                    { value: '', label: 'اختر الفرع...' },
                                    ...branches.map(b => ({ value: b.id, label: b.name }))
                                ]}
                            />
                            {errors.branch_id && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.branch_id}</p>}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-black text-dark-800 dark:text-dark-200 mb-2">اسم المادة <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})} 
                            placeholder="مثال: رياضيات، لغة عربية، علوم..." 
                            className="w-full bg-dark-50 dark:bg-dark-900 border-2 border-transparent focus:border-primary-500 rounded-xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-primary-500/20 transition-all text-dark-800 dark:text-white font-bold placeholder:text-dark-400 shadow-sm" 
                            required 
                        />
                        {errors.name && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-black text-dark-800 dark:text-dark-200 mb-3">أيقونة المادة</label>
                        <div className="grid grid-cols-5 gap-3 p-2 bg-dark-50 dark:bg-dark-800/50 rounded-2xl border border-dark-100 dark:border-dark-800">
                            {ICONS_LIST.map((icon) => (
                                <button
                                    type="button"
                                    key={icon.name}
                                    onClick={() => setForm({...form, icon: icon.name})}
                                    title={icon.label}
                                    className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                                        form.icon === icon.name 
                                        ? 'bg-white border-primary-500 text-primary-600 dark:bg-dark-900 dark:border-primary-500 dark:text-primary-400 shadow-md shadow-primary-500/20 scale-105' 
                                        : 'bg-transparent border-transparent text-dark-400 hover:bg-white hover:text-dark-600 dark:hover:bg-dark-700 dark:hover:text-dark-200'
                                    }`}
                                >
                                    {getSubjectIcon(icon.name)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4 border-b-2 border-dark-100 dark:border-dark-800 pb-3">
                            <label className="text-sm font-black text-dark-800 dark:text-dark-200">الصفوف المرتبطة بهذه المادة <span className="text-red-500">*</span></label>
                            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 px-3 py-1.5 rounded-lg">{form.grade_ids.length} صفوف محددة</span>
                        </div>
                        {errors.grade_ids && <div className="mb-4 text-red-600 text-sm font-bold bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 px-4 py-3 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0"/>{errors.grade_ids}</div>}
                        
                        <div className="space-y-4">
                            {sections.length === 0 ? (
                                <div className="p-6 rounded-2xl bg-dark-50 dark:bg-dark-800/50 border border-dark-200 dark:border-dark-700 text-sm font-bold text-dark-500 text-center">
                                    لا توجد مراحل وصفوف مضافة حالياً. يرجى إضافتها من "الهيكل الأكاديمي" أولاً.
                                </div>
                            ) : (
                                sections.map(section => {
                                    const sectionGradeIds = section.grades.map(g => g.id);
                                    const isAllSelected = sectionGradeIds.length > 0 && sectionGradeIds.every(id => form.grade_ids.includes(id));
                                    
                                    return (
                                        <div key={section.id} className="bg-white dark:bg-dark-800/40 border border-dark-100 dark:border-dark-700 rounded-2xl p-5 shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-black text-dark-800 dark:text-dark-200 flex items-center gap-2.5">
                                                    <div className="w-1.5 h-5 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full"></div>
                                                    {section.name}
                                                </h4>
                                                {section.grades.length > 0 && (
                                                    <button type="button" onClick={() => selectAllInSection(section)} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 ${isAllSelected ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30' : 'bg-dark-50 text-dark-500 hover:bg-dark-100 dark:bg-dark-800 dark:text-dark-400 dark:hover:bg-dark-700'}`}>
                                                        {isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {section.grades.length === 0 ? (
                                                <p className="text-xs font-medium text-dark-400 bg-dark-50 dark:bg-dark-900/50 p-4 rounded-xl border border-dashed border-dark-200 dark:border-dark-800 text-center">لا توجد صفوف مضافة لهذه المرحلة</p>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {section.grades.map(grade => (
                                                        <label key={grade.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${form.grade_ids.includes(grade.id) ? 'bg-primary-50 border-primary-500 shadow-sm dark:bg-primary-500/10 dark:border-primary-500' : 'bg-white border-dark-100 hover:bg-dark-50 hover:border-primary-300 dark:bg-dark-900 dark:border-dark-700 dark:hover:bg-dark-800 dark:hover:border-primary-700'}`}>
                                                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all shrink-0 ${form.grade_ids.includes(grade.id) ? 'bg-primary-500 text-white scale-110' : 'bg-dark-50 border border-dark-200 dark:bg-dark-800 dark:border-dark-600 text-transparent'}`}>
                                                                <Check className="w-3.5 h-3.5" strokeWidth={4} />
                                                            </div>
                                                            <span className={`text-sm font-bold select-none truncate ${form.grade_ids.includes(grade.id) ? 'text-primary-700 dark:text-primary-300' : 'text-dark-600 dark:text-dark-400'}`}>
                                                                {grade.name}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end gap-3 border-t border-dark-100 dark:border-dark-800 mt-8">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3.5 rounded-xl font-bold text-dark-600 bg-dark-100 hover:bg-dark-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-8 py-3.5 rounded-xl font-black text-white bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            {processing ? 'جاري الحفظ...' : (editingItem ? 'حفظ التعديلات' : 'إضافة المادة')}
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
