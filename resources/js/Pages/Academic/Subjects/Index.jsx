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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose} 
            />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all duration-300 scale-100 opacity-100">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-500" />
                <div className="flex items-center justify-between p-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        {title}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto">{children}</div>
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
                <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                        onClick={() => { onEdit(subject); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <Edit2 size={16} />
                        </div>
                        تعديل المادة
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-4" />
                    <button 
                        onClick={() => { onDelete(subject); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                        <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
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
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">إدارة المواد الدراسية</h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                إدارة وتخصيص المواد والمقررات لصفوف المدرسة
                            </p>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95 self-end sm:self-auto"
                        >
                            <Plus size={18} /> 
                            <span>إضافة مادة جديدة</span>
                        </button>
                    </div>
                </div>

                {/* Filters and View Toggles - Matching Shifts Layout */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between z-20 relative">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
                        <div className="relative w-full md:max-w-md">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="ابحث باسم المادة..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all outline-none placeholder:text-slate-400"
                            />
                        </div>

                        {hasActiveFilters && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto justify-center"
                            >
                                <RotateCcw size={16} /> <span>إعادة ضبط</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-full sm:w-auto justify-center sm:justify-start">
                        <button 
                            onClick={() => setViewMode('cards')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                viewMode === 'cards' 
                                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            <LayoutGrid size={18} />
                            <span className="hidden sm:inline">شبكة</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                viewMode === 'table' 
                                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            <Table2 size={18} />
                            <span className="hidden sm:inline">قائمة</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                {subjects.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100 dark:border-slate-700">
                            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">لا توجد مواد دراسية</h3>
                        <p className="text-sm font-medium text-slate-500 mb-6 max-w-sm mx-auto">لم تقم بإضافة أي مواد دراسية بعد، قم بإضافة مادة واربطها بالصفوف التي تدرسها لتظهر هنا.</p>
                        <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-slate-900/10 dark:shadow-white/10">
                            <Plus size={18} />
                            إضافة المادة الأولى
                        </button>
                    </div>
                ) : (
                    <>
                        {viewMode === 'cards' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {subjects.map(subject => (
                                    <div key={subject.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1 transition-all duration-300 relative group">
                                        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-50 to-transparent dark:from-primary-500/5 dark:to-transparent rounded-bl-[100px] transition-transform group-hover:scale-110" />
                                        </div>
                                        
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                                                    {getSubjectIcon(subject.icon)}
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight mb-1">
                                                        {subject.name}
                                                    </h2>
                                                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg w-fit">
                                                        <Layers className="w-3.5 h-3.5 text-primary-500" />
                                                        {subject.grades.length} صفوف دراسية
                                                        {isAdmin && subject.branch && (
                                                            <>
                                                                <span className="text-slate-300 mx-1">|</span>
                                                                <span className="text-primary-600 dark:text-primary-400">{subject.branch.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ActionMenu subject={subject} onEdit={openModal} onDelete={deleteSubject} />
                                        </div>

                                        {/* Grades Tags */}
                                        <div>
                                            <div className="flex flex-wrap gap-2">
                                                {subject.grades.length === 0 ? (
                                                    <span className="text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg w-full text-center border border-dashed border-slate-200 dark:border-slate-700">غير مرتبطة بأي صف</span>
                                                ) : (
                                                    subject.grades.slice(0, 6).map((grade, index) => (
                                                        <span key={grade.id} className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border ${getTagColor(index)} shadow-sm`}>
                                                            {grade.section ? `${grade.section.name} - ` : ''}{grade.name}
                                                        </span>
                                                    ))
                                                )}
                                                {subject.grades.length > 6 && (
                                                    <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        +{subject.grades.length - 6}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                                <th className="py-5 px-6 text-sm font-black text-slate-500 w-1/3">المادة الدراسية</th>
                                                <th className="py-5 px-6 text-sm font-black text-slate-500">الصفوف المرتبطة</th>
                                                <th className="py-5 px-6 text-sm font-black text-slate-500 text-left w-32">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {subjects.map(subject => (
                                                <tr key={subject.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform">
                                                                {getSubjectIcon(subject.icon)}
                                                            </div>
                                                            <div>
                                                                <span className="font-black text-slate-800 dark:text-white block mb-0.5">{subject.name}</span>
                                                                <span className="text-xs font-bold text-slate-500">
                                                                    {subject.grades.length} صفوف دراسية
                                                                    {isAdmin && subject.branch && ` • ${subject.branch.name}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-wrap gap-2">
                                                            {subject.grades.length === 0 ? (
                                                                <span className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">لا توجد صفوف</span>
                                                            ) : (
                                                                subject.grades.slice(0, 3).map((grade, index) => (
                                                                    <span key={grade.id} className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border ${getTagColor(index)}`}>
                                                                        {grade.section ? `${grade.section.name} - ` : ''}{grade.name}
                                                                    </span>
                                                                ))
                                                            )}
                                                            {subject.grades.length > 3 && (
                                                                <span className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                                    +{subject.grades.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-left">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => openModal(subject)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-xl transition-all font-bold text-sm flex items-center gap-1.5">
                                                                <Edit2 size={16} /> تعديل
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
                            <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">الفرع <span className="text-rose-500">*</span></label>
                            <SelectInput 
                                value={form.branch_id} 
                                onChange={val => setForm({...form, branch_id: val})}
                                options={[
                                    { value: '', label: 'اختر الفرع...' },
                                    ...branches.map(b => ({ value: b.id, label: b.name }))
                                ]}
                            />
                            {errors.branch_id && <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.branch_id}</p>}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-2">اسم المادة <span className="text-rose-500">*</span></label>
                        <input 
                            type="text" 
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})} 
                            placeholder="مثال: رياضيات، لغة عربية، علوم..." 
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 dark:text-white font-bold placeholder:text-slate-400" 
                            required 
                        />
                        {errors.name && <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-3">أيقونة المادة</label>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                            {ICONS_LIST.map((icon) => (
                                <button
                                    type="button"
                                    key={icon.name}
                                    onClick={() => setForm({...form, icon: icon.name})}
                                    title={icon.label}
                                    className={`aspect-square rounded-2xl border flex items-center justify-center transition-all duration-200 ${
                                        form.icon === icon.name 
                                        ? 'bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-500/20 dark:border-primary-400 dark:text-primary-300 shadow-md shadow-primary-500/10 scale-105' 
                                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {getSubjectIcon(icon.name)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                            <label className="text-sm font-black text-slate-800 dark:text-slate-200">الصفوف المرتبطة بهذه المادة <span className="text-rose-500">*</span></label>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{form.grade_ids.length} صفوف محددة</span>
                        </div>
                        {errors.grade_ids && <div className="mb-4 text-rose-600 text-sm font-bold bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-900/30 px-4 py-3 rounded-2xl flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0"/>{errors.grade_ids}</div>}
                        
                        <div className="space-y-4">
                            {sections.length === 0 ? (
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 text-center">
                                    لا توجد مراحل وصفوف مضافة حالياً. يرجى إضافتها من "الهيكل الأكاديمي" أولاً.
                                </div>
                            ) : (
                                sections.map(section => {
                                    const sectionGradeIds = section.grades.map(g => g.id);
                                    const isAllSelected = sectionGradeIds.length > 0 && sectionGradeIds.every(id => form.grade_ids.includes(id));
                                    
                                    return (
                                        <div key={section.id} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    <div className="w-1.5 h-5 bg-primary-500 rounded-full"></div>
                                                    {section.name}
                                                </h4>
                                                {section.grades.length > 0 && (
                                                    <button type="button" onClick={() => selectAllInSection(section)} className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${isAllSelected ? 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-500/10 dark:border-primary-500/30 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                                        {isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {section.grades.length === 0 ? (
                                                <p className="text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">لا توجد صفوف مضافة لهذه المرحلة</p>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {section.grades.map(grade => (
                                                        <label key={grade.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all ${form.grade_ids.includes(grade.id) ? 'bg-primary-50 border-primary-200 shadow-sm dark:bg-primary-500/10 dark:border-primary-700/50' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800'}`}>
                                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border shrink-0 ${form.grade_ids.includes(grade.id) ? 'bg-primary-500 border-primary-500' : 'bg-slate-50 border-slate-300 dark:bg-slate-800 dark:border-slate-600'}`}>
                                                                {form.grade_ids.includes(grade.id) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
                                                            </div>
                                                            <span className={`text-sm font-bold select-none truncate ${form.grade_ids.includes(grade.id) ? 'text-primary-800 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400'}`}>
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

                    <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                        <button type="submit" disabled={processing} className="px-8 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {processing ? 'جاري الحفظ...' : (editingItem ? 'حفظ التعديلات' : 'إضافة المادة')}
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
