import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Select from 'react-select';
import SelectInput from '@/Components/SelectInput';
import { 
    Plus, Edit, Trash2, X, PlusCircle, AlignLeft, List, Hash, 
    CheckSquare, Image as ImageIcon, Search, FileText, Settings, 
    ShieldCheck, Calendar, Sparkles, ChevronDown, FileSpreadsheet, 
    AlertCircle, Type, Clock, Paperclip, Star, Table2, ListTodo, CalendarRange 
} from 'lucide-react';

export default function TemplatesIndex({ auth, templates, jobGrades, stats, filters }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const form = useForm({
        name: '',
        description: '',
        job_grade_id: '',
        period_type: 'weekly'
    });

    const editForm = useForm({
        id: '',
        name: '',
        description: '',
        job_grade_id: '',
        period_type: 'weekly'
    });

    const fieldsForm = useForm({
        id: '',
        fields: []
    });

    const filterForm = useForm({
        search: filters?.search || '',
        job_grade_id: filters?.job_grade_id || ''
    });

    const handleSearch = (e) => {
        e.preventDefault();
        filterForm.get(route('reports.templates'), { preserveState: true });
    };

    // Helper for react-select tailwind classes
    const selectClassNames = {
        control: (state) => `bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 shadow-none !min-h-[46px] text-sm transition-all duration-200 ${state.isFocused ? 'ring-4 ring-primary-500/15 border-primary-500' : ''}`,
        menu: () => 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl mt-2 overflow-hidden z-[100] animate-scale-in',
        option: (state) => `px-4 py-2.5 text-sm cursor-pointer transition-all duration-200 ${
            state.isSelected 
                ? 'bg-primary-600 text-white font-bold shadow-sm shadow-primary-500/10' 
                : state.isFocused 
                    ? 'bg-primary-50 dark:bg-primary-600/15 text-primary-700 dark:text-primary-400 font-semibold' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 font-medium'
        }`,
        singleValue: () => 'text-slate-800 dark:text-slate-200 text-sm font-semibold',
        input: () => 'text-slate-800 dark:text-slate-200 text-sm font-semibold',
        placeholder: () => 'text-slate-400 dark:text-slate-500 text-sm font-semibold',
        menuList: () => 'p-1.5 space-y-0.5',
        dropdownIndicator: () => 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 cursor-pointer transition-colors',
        clearIndicator: () => 'text-slate-400 hover:text-red-500 p-2 cursor-pointer transition-colors',
        indicatorSeparator: () => 'bg-slate-200 dark:bg-slate-800 w-[1px] my-2 mx-1'
    };

    const getFieldIcon = (type) => {
        switch (type) {
            case 'text': return <AlignLeft size={16} />;
            case 'textarea': return <Type size={16} />;
            case 'number': return <Hash size={16} />;
            case 'select': return <List size={16} />;
            case 'checkbox': return <CheckSquare size={16} />;
            case 'image': return <ImageIcon size={16} />;
            case 'date': return <Calendar size={16} />;
            case 'time': return <Clock size={16} />;
            case 'file': return <Paperclip size={16} />;
            case 'rating': return <Star size={16} />;
            case 'matrix_text': return <Table2 size={16} />;
            case 'tasks_matrix': return <ListTodo size={16} />;
            case 'activities_matrix': return <CalendarRange size={16} />;
            default: return <AlignLeft size={16} />;
        }
    };

    const addField = () => {
        fieldsForm.setData('fields', [
            ...fieldsForm.data.fields,
            { name: '', type: 'text', options: [], is_required: false }
        ]);
    };

    const removeField = (index) => {
        const newFields = [...fieldsForm.data.fields];
        newFields.splice(index, 1);
        fieldsForm.setData('fields', newFields);
    };

    const updateField = (index, key, value) => {
        const newFields = [...fieldsForm.data.fields];
        newFields[index][key] = value;
        fieldsForm.setData('fields', newFields);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        form.post(route('reports.templates.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                form.reset();
            }
        });
    };

    const openEditModal = (template) => {
        setEditingTemplate(template);
        editForm.setData({
            id: template.id,
            name: template.name,
            description: template.description || '',
            job_grade_id: template.job_grade_id || '',
            period_type: template.period_type || 'weekly'
        });
        setIsEditModalOpen(true);
    };

    const openFieldsModal = (template) => {
        setEditingTemplate(template);
        fieldsForm.setData({
            id: template.id,
            fields: template.fields || []
        });
        setIsFieldsModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.put(route('reports.templates.update', editingTemplate.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                editForm.reset();
            }
        });
    };

    const handleFieldsSubmit = (e) => {
        e.preventDefault();
        fieldsForm.put(route('reports.templates.fields.update', editingTemplate.id), {
            onSuccess: () => {
                setIsFieldsModalOpen(false);
                fieldsForm.reset();
            }
        });
    };

    const handleDelete = (templateId) => {
        if (confirm('هل أنت متأكد من حذف هذا القالب؟ سيتم حذف جميع التقارير المرتبطة به.')) {
            router.delete(route('reports.templates.destroy', templateId));
        }
    };

    const renderFieldBuilder = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-101 dark:border-slate-800">
                <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white">حقول التقرير (الأسئلة)</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">أضف الحقول المخصصة التي سيقوم الموظفون بتعبئتها</p>
                </div>
                <button 
                    type="button" 
                    onClick={addField}
                    className="flex items-center gap-1.5 text-xs bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-2xl font-bold shadow-md shadow-primary-500/10 hover:shadow-primary-500/20 hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-95"
                >
                    <PlusCircle size={14} /> 
                    <span>إضافة حقل جديد</span>
                </button>
            </div>
            
            {fieldsForm.data.fields.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-900/10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center shadow-inner">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm font-bold">لم يتم إضافة أي حقول بعد</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-semibold">ابدأ بإضافة الحقول لتصميم نموذج التقرير الخاص بك</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {fieldsForm.data.fields.map((field, index) => (
                        <div key={index} className="relative p-5 bg-white dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 group/card">
                            {/* Card number badge */}
                            <div className="absolute -right-3 -top-3 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black shadow-sm group-hover/card:bg-primary-500 group-hover/card:text-white group-hover/card:border-primary-400 transition-all duration-300">
                                {index + 1}
                            </div>
                            
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                                            <span>اسم الحقل / السؤال</span>
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            value={field.name}
                                            onChange={(e) => updateField(index, 'name', e.target.value)}
                                            className="w-full bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-400"
                                            placeholder="مثال: إجمالي المبيعات، ملاحظات العمل..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-505 dark:text-slate-400 mb-1.5">نوع الحقل</label>
                                        <div className="relative">
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                                                {getFieldIcon(field.type)}
                                            </div>
                                            <SelectInput 
                                                value={field.type}
                                                onChange={(val) => updateField(index, 'type', val)}
                                                className="w-full [&>div]:pr-10 [&>div]:pl-10"
                                                options={[
                                                    { value: 'text', label: 'نص قصير (Text)' },
                                                    { value: 'textarea', label: 'نص طويل (Textarea)' },
                                                    { value: 'number', label: 'رقم (Number)' },
                                                    { value: 'select', label: 'قائمة خيارات (Select)' },
                                                    { value: 'checkbox', label: 'خانة اختيار (Checkbox)' },
                                                    { value: 'image', label: 'صورة (Image)' },
                                                    { value: 'date', label: 'تاريخ (Date)' },
                                                    { value: 'time', label: 'وقت (Time)' },
                                                    { value: 'file', label: 'ملف مرفق (File)' },
                                                    { value: 'rating', label: 'تقييم (Rating)' },
                                                    { value: 'matrix_text', label: 'جدول ملاحظات (Matrix Text)' },
                                                    { value: 'tasks_matrix', label: 'جدول الأعمال (Tasks Matrix)' },
                                                    { value: 'activities_matrix', label: 'جدول الأنشطة (Activities Matrix)' }
                                                ]}
                                                isClearable={false}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    type="button" 
                                    onClick={() => removeField(index)}
                                    className="p-2.5 text-red-500 hover:text-white hover:bg-red-500 dark:hover:bg-red-650 rounded-2xl transition-all border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-600 active:scale-95 mt-5 flex items-center justify-center w-10 h-10 shrink-0 shadow-sm"
                                    title="حذف هذا الحقل"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            {/* Options for Select or Matrix Type */}
                            {(field.type === 'select' || field.type === 'matrix_text' || field.type === 'tasks_matrix') && (
                                <div className="mt-1 bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 animate-slide-down">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                                        {field.type === 'matrix_text' ? 'البنود / الأسئلة (افصل بينها بفاصلة ,)' : field.type === 'tasks_matrix' ? 'الأعمال المطلوبة (افصل بينها بفاصلة ,)' : 'الخيارات (افصل بينها بفاصلة ,)'}
                                    </label>
                                    <input 
                                        type="text" 
                                        value={field.options ? field.options.join(', ') : ''}
                                        onChange={(e) => updateField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                                        className="w-full bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none dark:text-white font-semibold"
                                        placeholder={field.type === 'matrix_text' ? "مثال: الطابور والإذاعة المدرسية, المدير التنفيذي, الإعلام" : field.type === 'tasks_matrix' ? "مثال: تجهيز المختبر, مراقبة الساحة, تصحيح الأوراق" : "مثال: ممتاز, جيد جدا, جيد"}
                                    />
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block font-semibold">
                                        {field.type === 'matrix_text' 
                                            ? 'ملاحظة: سيتم رسم جدول يحتوي على هذه البنود ويقوم الموظف بكتابة ملاحظته أمام كل بند.' 
                                            : field.type === 'tasks_matrix' 
                                            ? 'ملاحظة: سيتم رسم جدول للأعمال المطلوبة، ويقوم الموظف بتحديد حالة كل عمل (نفذ / لم ينفذ) مع ذكر السبب.'
                                            : 'ملاحظة: سيتم عرض هذه الكلمات كخيارات قائمة منسدلة للموظف عند تعبئة التقرير.'}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-2.5 mt-1 border-t border-slate-100 dark:border-slate-800/40 pt-3">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none group/toggle">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            id={`req_fields_${index}`}
                                            checked={field.is_required}
                                            onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-9 h-5.5 rounded-full transition-colors duration-300 ${field.is_required ? 'bg-primary-500 dark:bg-primary-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                                        <div className={`absolute top-0.5 right-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform duration-300 shadow-md ${field.is_required ? '-translate-x-3.5' : ''}`} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-450 group-hover/toggle:text-slate-850 dark:group-hover/toggle:text-slate-200 transition-colors">
                                        حقل إجباري (مطلوب عند الإدخال)
                                    </span>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {fieldsForm.errors.fields && (
                <p className="text-red-500 text-xs mt-1 font-bold">{fieldsForm.errors.fields}</p>
            )}
        </div>
    );

    return (
        <AdminLayout activeMenu="إدارة القوالب">
            <Head title="إدارة قوالب التقارير" />

            <div className="p-6 space-y-6" style={{ direction: 'rtl' }}>
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Visual geometric lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-855 dark:text-white tracking-tight">إدارة قوالب التقارير</h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">قم بإنشاء وتصميم النماذج التي سيقوم الموظفون بتعبئتها بناءً على درجاتهم الوظيفية</p>
                        </div>
                        
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95"
                        >
                            <Plus size={18} /> 
                            <span>إنشاء قالب جديد</span>
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[
                            { label: 'إجمالي القوالب', value: stats.total_templates, icon: FileText, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10', glow: 'bg-primary-500/5 dark:bg-primary-500/10', grad: 'from-primary-400 to-primary-600' },
                            { label: 'الحقول المخصصة', value: stats.total_fields, icon: Settings, color: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-500/10', glow: 'bg-accent-500/5 dark:bg-accent-500/10', grad: 'from-accent-400 to-accent-600' },
                            { label: 'التقارير المرفوعة', value: stats.total_reports, icon: CheckSquare, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/40', glow: 'bg-slate-500/5 dark:bg-slate-800/10', grad: 'from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-800' }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group cursor-default bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#5b8a2d_1.2px,transparent_1.2px)] [background-size:16px_16px]">
                                <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${stat.grad} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glow} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                                
                                <div className="relative z-10 min-w-0">
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">{stat.label}</p>
                                    <h3 className="text-2xl font-black text-slate-855 dark:text-white leading-none font-mono tracking-tight">{stat.value}</h3>
                                </div>
                                <div className={`relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}>
                                    <stat.icon size={20} strokeWidth={2.5} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters Panel */}
                <div className="relative z-20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:16px_16px] mb-8">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-405 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                value={filterForm.data.search}
                                onChange={(e) => filterForm.setData('search', e.target.value)}
                                placeholder="ابحث عن قالب..."
                                className="w-full bg-slate-50/50 dark:bg-slate-955/50 border border-slate-205 dark:border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                            />
                            {filterForm.data.search && (
                                <button 
                                    type="button"
                                    onClick={() => filterForm.setData('search', '')}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-805 rounded-lg text-slate-450 hover:text-slate-655 transition-all">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <div className="md:w-64">
                            <Select
                                options={jobGrades.map(grade => ({ value: grade.id, label: grade.name }))}
                                value={filterForm.data.job_grade_id ? { value: filterForm.data.job_grade_id, label: jobGrades.find(g => g.id == filterForm.data.job_grade_id)?.name } : null}
                                onChange={(selected) => filterForm.setData('job_grade_id', selected ? selected.value : '')}
                                placeholder="تصفية بالدرجة الوظيفية..."
                                isClearable
                                unstyled
                                classNames={selectClassNames}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="submit" className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-2xl text-sm font-bold transition-all shrink-0 active:scale-95 shadow-sm hover:shadow-lg hover:shadow-primary-500/10">
                                بحث
                            </button>
                            {(filterForm.data.search || filterForm.data.job_grade_id) && (
                                <Link 
                                    href={route('reports.templates')}
                                    className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-5 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
                                >
                                    إلغاء
                                </Link>
                            )}
                        </div>
                    </form>
                </div>

                {/* Templates List */}
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden animate-fade-in mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-101 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <FileText size={14} className="text-primary-500" />
                                            <span>اسم القالب</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <ShieldCheck size={14} className="text-indigo-500" />
                                            <span>الدرجة الوظيفية المستهدفة</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <AlignLeft size={14} className="text-slate-400" />
                                            <span>الوصف</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span>تاريخ الإنشاء</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider w-40 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Settings size={14} className="text-slate-400" />
                                            <span>الإجراءات</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                                {templates.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-450 dark:text-slate-500 font-bold">لا توجد قوالب حتى الآن.</td>
                                    </tr>
                                ) : (
                                    templates.data.map((template) => (
                                        <tr key={template.id} className="group border-r-4 border-r-transparent hover:border-r-primary-500 hover:bg-slate-50/40 dark:hover:bg-primary-500/5 transition-all duration-200">
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-500/20 shadow-sm transition-transform group-hover:scale-110">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-primary-655 dark:group-hover:text-primary-400 transition-colors">{template.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                                                    <ShieldCheck size={12} className="shrink-0" />
                                                    <span>{template.job_grade?.name || 'غير حدد'}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4.5 text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                                {template.description || '-'}
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={13} className="text-slate-400" />
                                                    <span>{new Date(template.created_at).toLocaleDateString('ar-EG')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4.5 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => openFieldsModal(template)}
                                                        className="flex items-center gap-1.5 bg-emerald-50 text-emerald-655 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-450 dark:hover:bg-emerald-500 dark:hover:text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all border border-emerald-100 dark:border-emerald-500/20 active:scale-95 shadow-sm"
                                                        title="إدارة الحقول"
                                                    >
                                                        <List size={14} />
                                                        <span>الحقول ({template.fields_count || 0})</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => openEditModal(template)}
                                                        className="text-blue-500 hover:text-white hover:bg-blue-500 dark:hover:bg-blue-500/10 p-2.5 rounded-xl transition-all border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500/20 active:scale-95 shadow-sm"
                                                        title="تعديل القالب"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(template.id)}
                                                        className="text-red-500 hover:text-white hover:bg-red-500 dark:hover:bg-red-500/10 p-2.5 rounded-xl transition-all border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500/20 active:scale-95 shadow-sm"
                                                        title="حذف القالب"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Create */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
                        <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 z-50" />
                            
                            <div className="relative p-6 md:p-7 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-900/20 pt-8">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-500 to-primary-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20 border border-primary-400/20">
                                        <PlusCircle size={20} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-850 dark:text-white leading-none">إنشاء قالب تقرير جديد</h2>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-bold">إعداد نموذج بيانات مخصص لتقارير الموظفين</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsCreateModalOpen(false)} 
                                    className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 transition-all duration-300 hover:rotate-90 active:scale-90"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <form id="createForm" onSubmit={handleCreateSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-505 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>اسم القالب</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <FileText size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 pointer-events-none" />
                                                <input 
                                                    type="text" 
                                                    value={form.data.name}
                                                    onChange={e => form.setData('name', e.target.value)}
                                                    className="w-full bg-slate-50/50 dark:bg-slate-955/40 border border-slate-202 dark:border-slate-800/80 rounded-2xl pr-11 pl-4 py-3 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner-sm"
                                                    placeholder="مثال: التقرير اليومي للمبيعات"
                                                    required
                                                />
                                            </div>
                                            {form.errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{form.errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-505 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>الدرجة الوظيفية المستهدفة</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <ShieldCheck size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 pointer-events-none z-10" />
                                                <Select
                                                    options={jobGrades.map(grade => ({ value: grade.id, label: grade.name }))}
                                                    value={form.data.job_grade_id ? { value: form.data.job_grade_id, label: jobGrades.find(g => g.id == form.data.job_grade_id)?.name } : null}
                                                    onChange={(selected) => form.setData('job_grade_id', selected ? selected.value : '')}
                                                    placeholder="ابحث عن الدرجة الوظيفية..."
                                                    isClearable
                                                    unstyled
                                                    classNames={{
                                                        ...selectClassNames,
                                                        control: (state) => `bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl pr-10 pl-3 shadow-none !min-h-[46px] text-sm transition-all duration-200 ${state.isFocused ? 'ring-4 ring-primary-500/15 border-primary-500' : ''}`,
                                                    }}
                                                />
                                            </div>
                                            {form.errors.job_grade_id && <p className="text-red-500 text-xs mt-1 font-bold">{form.errors.job_grade_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-505 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>دورية التقرير</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 pointer-events-none z-10" />
                                                <Select
                                                    options={[
                                                        { value: 'daily', label: 'يومي (Daily)' },
                                                        { value: 'weekly', label: 'أسبوعي (Weekly)' },
                                                        { value: 'monthly', label: 'شهري (Monthly)' },
                                                        { value: 'quarterly', label: 'فصلي (Quarterly)' },
                                                        { value: 'yearly', label: 'سنوي (Yearly)' },
                                                        { value: 'custom', label: 'مخصص / بدون فترة (Custom)' },
                                                    ]}
                                                    value={form.data.period_type ? { value: form.data.period_type, label: ['يومي (Daily)', 'أسبوعي (Weekly)', 'شهري (Monthly)', 'فصلي (Quarterly)', 'سنوي (Yearly)', 'مخصص / بدون فترة (Custom)'][['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'].indexOf(form.data.period_type)] } : null}
                                                    onChange={(selected) => form.setData('period_type', selected ? selected.value : 'weekly')}
                                                    placeholder="اختر دورية التقرير..."
                                                    isClearable={false}
                                                    unstyled
                                                    classNames={{
                                                        ...selectClassNames,
                                                        control: (state) => `bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl pr-10 pl-3 shadow-none !min-h-[46px] text-sm transition-all duration-200 ${state.isFocused ? 'ring-4 ring-primary-500/15 border-primary-500' : ''}`,
                                                    }}
                                                />
                                            </div>
                                            {form.errors.period_type && <p className="text-red-500 text-xs mt-1 font-bold">{form.errors.period_type}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الوصف (اختياري)</label>
                                        <div className="relative group">
                                            <AlignLeft size={16} className="absolute right-4 top-4 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 pointer-events-none" />
                                            <textarea 
                                                value={form.data.description}
                                                onChange={e => form.setData('description', e.target.value)}
                                                className="w-full bg-slate-50/50 dark:bg-slate-955/40 border border-slate-202 dark:border-slate-800/80 rounded-2xl pr-11 pl-4 py-3 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner-sm"
                                                placeholder="اكتب وصفاً مختصراً للقالب وأهداف استخدامه..."
                                                rows="3"
                                            ></textarea>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/20 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-95"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    form="createForm" 
                                    type="submit" 
                                    disabled={form.processing}
                                    className="px-6 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white disabled:opacity-50 transition-all shadow-md shadow-primary-500/15 hover:shadow-lg hover:shadow-primary-500/25 active:scale-95 flex items-center gap-1.5"
                                >
                                    <Plus size={16} />
                                    <span>حفظ القالب</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Edit */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-md animate-fade-in">
                        <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 z-50" />
                            
                            <div className="relative p-6 md:p-7 border-b border-slate-101 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-900/20 pt-8">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 border border-blue-400/20">
                                        <Edit size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-855 dark:text-white leading-none">تعديل قالب التقرير</h2>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-bold">القالب الحالي: {editingTemplate?.name}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsEditModalOpen(false)} 
                                    className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-405 hover:text-slate-600 dark:hover:text-slate-205 transition-all duration-300 hover:rotate-90 active:scale-90"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <form id="editForm" onSubmit={handleEditSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>اسم القالب</span>
                                                <span className="text-red-505">*</span>
                                            </label>
                                            <div className="relative group">
                                                <FileText size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 pointer-events-none" />
                                                <input 
                                                    type="text" 
                                                    value={editForm.data.name}
                                                    onChange={e => editForm.setData('name', e.target.value)}
                                                    className="w-full bg-slate-50/50 dark:bg-slate-955/40 border border-slate-202 dark:border-slate-800/80 rounded-2xl pr-11 pl-4 py-3 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-400 shadow-inner-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>الدرجة الوظيفية المستهدفة</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <ShieldCheck size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 pointer-events-none z-10" />
                                                <Select
                                                    options={jobGrades.map(grade => ({ value: grade.id, label: grade.name }))}
                                                    value={editForm.data.job_grade_id ? { value: editForm.data.job_grade_id, label: jobGrades.find(g => g.id == editForm.data.job_grade_id)?.name } : null}
                                                    onChange={(selected) => editForm.setData('job_grade_id', selected ? selected.value : '')}
                                                    placeholder="ابحث عن الدرجة الوظيفية..."
                                                    isClearable
                                                    unstyled
                                                    classNames={{
                                                        ...selectClassNames,
                                                        control: (state) => `bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl pr-10 pl-3 shadow-none !min-h-[46px] text-sm transition-all duration-200 ${state.isFocused ? 'ring-4 ring-primary-500/15 border-primary-500' : ''}`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-505 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>دورية التقرير</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 pointer-events-none z-10" />
                                                <Select
                                                    options={[
                                                        { value: 'daily', label: 'يومي (Daily)' },
                                                        { value: 'weekly', label: 'أسبوعي (Weekly)' },
                                                        { value: 'monthly', label: 'شهري (Monthly)' },
                                                        { value: 'quarterly', label: 'فصلي (Quarterly)' },
                                                        { value: 'yearly', label: 'سنوي (Yearly)' },
                                                        { value: 'custom', label: 'مخصص / بدون فترة (Custom)' },
                                                    ]}
                                                    value={editForm.data.period_type ? { value: editForm.data.period_type, label: ['يومي (Daily)', 'أسبوعي (Weekly)', 'شهري (Monthly)', 'فصلي (Quarterly)', 'سنوي (Yearly)', 'مخصص / بدون فترة (Custom)'][['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'].indexOf(editForm.data.period_type)] } : null}
                                                    onChange={(selected) => editForm.setData('period_type', selected ? selected.value : 'weekly')}
                                                    placeholder="اختر دورية التقرير..."
                                                    isClearable={false}
                                                    unstyled
                                                    classNames={{
                                                        ...selectClassNames,
                                                        control: (state) => `bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl pr-10 pl-3 shadow-none !min-h-[46px] text-sm transition-all duration-200 ${state.isFocused ? 'ring-4 ring-primary-500/15 border-primary-500' : ''}`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">الوصف (اختياري)</label>
                                        <div className="relative group">
                                            <AlignLeft size={16} className="absolute right-4 top-4 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 pointer-events-none" />
                                            <textarea 
                                                value={editForm.data.description}
                                                onChange={e => editForm.setData('description', e.target.value)}
                                                className="w-full bg-slate-50/50 dark:bg-slate-955/40 border border-slate-202 dark:border-slate-800/80 rounded-2xl pr-11 pl-4 py-3 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-400 shadow-inner-sm"
                                                rows="3"
                                            ></textarea>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/20 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-205 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-95"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    form="editForm" 
                                    type="submit" 
                                    disabled={editForm.processing}
                                    className="px-6 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 transition-all shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 flex items-center gap-1.5"
                                >
                                    <Edit size={16} />
                                    <span>حفظ التعديلات</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Fields */}
                {isFieldsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-md animate-fade-in">
                        <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 z-50" />
                            
                            <div className="relative p-6 md:p-7 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-900/20 pt-8">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
                                        <List size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-855 dark:text-white leading-none">إدارة حقول التقرير</h2>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] text-slate-405 dark:text-slate-500 font-bold">القالب المستهدف:</span>
                                            <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-md font-bold">
                                                {editingTemplate?.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsFieldsModalOpen(false)} 
                                    className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-405 hover:text-slate-600 dark:hover:text-slate-205 transition-colors duration-300 hover:rotate-90 active:scale-90"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <form id="fieldsForm" onSubmit={handleFieldsSubmit}>
                                    {renderFieldBuilder()}
                                </form>
                            </div>
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsFieldsModalOpen(false)}
                                    className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-205 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-95"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    form="fieldsForm" 
                                    type="submit" 
                                    disabled={fieldsForm.processing}
                                    className="px-6 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-750 text-white disabled:opacity-50 transition-all shadow-md shadow-emerald-500/15 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 flex items-center gap-1.5"
                                >
                                    <CheckSquare size={16} />
                                    <span>حفظ حقول التقرير</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
