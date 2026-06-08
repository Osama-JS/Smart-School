import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Select from 'react-select';
import { Plus, Edit, Trash2, X, PlusCircle, AlignLeft, List, Hash, CheckSquare, Image as ImageIcon, Search, FileText, Settings, ShieldCheck } from 'lucide-react';

export default function TemplatesIndex({ auth, templates, jobGrades, stats, filters }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const form = useForm({
        name: '',
        description: '',
        job_grade_id: ''
    });

    const editForm = useForm({
        id: '',
        name: '',
        description: '',
        job_grade_id: ''
    });

    const fieldsForm = useForm({
        id: '',
        name: '', // We need to send name and job_grade_id to satisfy backend validation
        job_grade_id: '',
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
        control: (state) => `bg-white dark:bg-slate-900 border-0 shadow-none !min-h-[46px] text-sm ${state.isFocused ? 'ring-0' : ''}`,
        menu: () => 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg mt-2 overflow-hidden z-50',
        option: (state) => `px-4 py-2.5 text-sm cursor-pointer transition-colors ${state.isFocused ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`,
        singleValue: () => 'text-slate-800 dark:text-slate-200 text-sm font-medium',
        input: () => 'text-slate-800 dark:text-slate-200 text-sm',
        placeholder: () => 'text-slate-400 dark:text-slate-500 text-sm',
        menuList: () => 'p-1'
    };

    const getFieldIcon = (type) => {
        switch (type) {
            case 'text': return <AlignLeft size={16} />;
            case 'number': return <Hash size={16} />;
            case 'select': return <List size={16} />;
            case 'checkbox': return <CheckSquare size={16} />;
            case 'image': return <ImageIcon size={16} />;
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
            job_grade_id: template.job_grade_id || ''
        });
        setIsEditModalOpen(true);
    };

    const openFieldsModal = (template) => {
        setEditingTemplate(template);
        fieldsForm.setData({
            id: template.id,
            name: template.name,
            job_grade_id: template.job_grade_id,
            fields: template.fields || []
        });
        setIsFieldsModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        // Since we are not editing fields here, we shouldn't send 'fields' key
        // But backend allows nullable fields now, so it's fine
        editForm.put(route('reports.templates.update', editingTemplate.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                editForm.reset();
            }
        });
    };

    const handleFieldsSubmit = (e) => {
        e.preventDefault();
        fieldsForm.put(route('reports.templates.update', editingTemplate.id), {
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
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">حقول التقرير (الأسئلة)</h3>
                <button 
                    type="button" 
                    onClick={addField}
                    className="flex items-center gap-1 text-sm bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
                >
                    <PlusCircle size={16} /> إضافة حقل
                </button>
            </div>
            
            {fieldsForm.data.fields.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">لم يتم إضافة أي حقول بعد.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {fieldsForm.data.fields.map((field, index) => (
                        <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">اسم الحقل / السؤال</label>
                                        <input 
                                            type="text" 
                                            value={field.name}
                                            onChange={(e) => updateField(index, 'name', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            placeholder="مثال: إجمالي المبيعات"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">نوع الحقل</label>
                                        <div className="relative">
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                {getFieldIcon(field.type)}
                                            </div>
                                            <select 
                                                value={field.type}
                                                onChange={(e) => updateField(index, 'type', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pr-10 pl-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none"
                                            >
                                                <option value="text">نص (Text)</option>
                                                <option value="number">رقم (Number)</option>
                                                <option value="select">خيارات (Select)</option>
                                                <option value="checkbox">خانة اختيار (Checkbox)</option>
                                                <option value="image">صورة (Image)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => removeField(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors mt-5"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            
                            {/* Options for Select Type */}
                            {field.type === 'select' && (
                                <div className="mt-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <label className="block text-xs text-slate-500 mb-1">الخيارات (افصل بينها بفاصلة ,)</label>
                                    <input 
                                        type="text" 
                                        value={field.options ? field.options.join(', ') : ''}
                                        onChange={(e) => updateField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                                        className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 px-2 py-1 text-sm focus:border-primary-500 outline-none"
                                        placeholder="مثال: ممتاز, جيد جدا, جيد"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-1">
                                <input 
                                    type="checkbox" 
                                    id={`req_fields_${index}`}
                                    checked={field.is_required}
                                    onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                                />
                                <label htmlFor={`req_fields_${index}`} className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                                    حقل إجباري (مطلوب)
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {fieldsForm.errors.fields && (
                <p className="text-red-500 text-xs mt-1">{fieldsForm.errors.fields}</p>
            )}
        </div>
    );

    return (
        <AdminLayout activeMenu="إدارة القوالب">
            <Head title="إدارة قوالب التقارير" />

            <div className="py-12" style={{ direction: 'rtl' }}>
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header Action */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">إدارة قوالب التقارير</h3>
                            <p className="text-slate-500 text-sm mt-1">قم بإنشاء وتصميم النماذج التي سيقوم الموظفون بتعبئتها بناءً على درجاتهم الوظيفية.</p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2"
                        >
                            <Plus size={20} />
                            إنشاء قالب جديد
                        </button>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-white dark:bg-[#121820] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">إجمالي القوالب</p>
                                    <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total_templates}</h4>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#121820] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                                    <Settings size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">الحقول المخصصة</p>
                                    <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total_fields}</h4>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#121820] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                                    <CheckSquare size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">التقارير المرفوعة</p>
                                    <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total_reports}</h4>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white dark:bg-[#121820] rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <Search size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filterForm.data.search}
                                    onChange={(e) => filterForm.setData('search', e.target.value)}
                                    placeholder="ابحث عن قالب..."
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                            <div className="md:w-64">
                                <Select
                                    options={jobGrades.map(grade => ({ value: grade.id, label: grade.name }))}
                                    value={filterForm.data.job_grade_id ? { value: filterForm.data.job_grade_id, label: jobGrades.find(g => g.id == filterForm.data.job_grade_id)?.name } : null}
                                    onChange={(selected) => filterForm.setData('job_grade_id', selected ? selected.value : '')}
                                    placeholder="تصفية بالدرجة الوظيفية..."
                                    isClearable
                                    unstyled
                                    classNames={{
                                        control: (state) => `bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-2 shadow-sm !min-h-[42px] text-sm ${state.isFocused ? 'ring-2 ring-primary-500' : ''}`,
                                        menu: () => 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg mt-1 overflow-hidden z-50',
                                        option: (state) => `px-4 py-2 text-sm cursor-pointer transition-colors ${state.isFocused ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`,
                                        singleValue: () => 'text-slate-800 dark:text-slate-200 text-sm',
                                        placeholder: () => 'text-slate-400 dark:text-slate-500 text-sm',
                                        menuList: () => 'p-1'
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="submit" className="bg-slate-800 dark:bg-white text-white dark:text-slate-800 hover:bg-slate-700 dark:hover:bg-slate-100 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors">
                                    بحث
                                </button>
                                {(filterForm.data.search || filterForm.data.job_grade_id) && (
                                    <Link 
                                        href={route('reports.templates')}
                                        className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        إلغاء
                                    </Link>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Templates List */}
                    <div className="bg-white dark:bg-[#121820] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">اسم القالب</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">الدرجة الوظيفية المستهدفة</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">الوصف</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">تاريخ الإنشاء</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500">لا توجد قوالب حتى الآن.</td>
                                        </tr>
                                    ) : (
                                        templates.data.map((template) => (
                                            <tr key={template.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">
                                                    {template.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                    <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">
                                                        {template.job_grade?.name || 'غير محدد'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                                    {template.description || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {new Date(template.created_at).toLocaleDateString('ar-EG')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => openFieldsModal(template)}
                                                            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                                            title="إدارة الحقول"
                                                        >
                                                            <List size={14} />
                                                            الحقول ({template.fields_count || 0})
                                                        </button>
                                                        <button 
                                                            onClick={() => openEditModal(template)}
                                                            className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 p-2 rounded-lg transition-colors"
                                                            title="تعديل القالب"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(template.id)}
                                                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors"
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
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-[#121820] w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">إنشاء قالب تقرير جديد</h2>
                                    <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                    <form id="createForm" onSubmit={handleCreateSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم القالب</label>
                                                <input 
                                                    type="text" 
                                                    value={form.data.name}
                                                    onChange={e => form.setData('name', e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                    required
                                                />
                                                {form.errors.name && <p className="text-red-500 text-xs mt-1">{form.errors.name}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الدرجة الوظيفية المخصصة</label>
                                                <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                                                    <Select
                                                        options={jobGrades.map(grade => ({ value: grade.id, label: grade.name }))}
                                                        value={form.data.job_grade_id ? { value: form.data.job_grade_id, label: jobGrades.find(g => g.id == form.data.job_grade_id)?.name } : null}
                                                        onChange={(selected) => form.setData('job_grade_id', selected ? selected.value : '')}
                                                        placeholder="ابحث عن الدرجة الوظيفية..."
                                                        isClearable
                                                        unstyled
                                                        classNames={selectClassNames}
                                                    />
                                                </div>
                                                {form.errors.job_grade_id && <p className="text-red-500 text-xs mt-1">{form.errors.job_grade_id}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الوصف (اختياري)</label>
                                            <textarea 
                                                value={form.data.description}
                                                onChange={e => form.setData('description', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                rows="2"
                                            ></textarea>
                                        </div>
                                    </form>
                                </div>
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button 
                                        form="createForm" 
                                        type="submit" 
                                        disabled={form.processing}
                                        className="px-6 py-2.5 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 transition-colors"
                                    >
                                        حفظ القالب
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Edit */}
                    {isEditModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-[#121820] w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">تعديل قالب: {editingTemplate?.name}</h2>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                    <form id="editForm" onSubmit={handleEditSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم القالب</label>
                                                <input 
                                                    type="text" 
                                                    value={editForm.data.name}
                                                    onChange={e => editForm.setData('name', e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الدرجة الوظيفية المخصصة</label>
                                                <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                                                    <Select
                                                        options={jobGrades.map(grade => ({ value: grade.id, label: grade.name }))}
                                                        value={editForm.data.job_grade_id ? { value: editForm.data.job_grade_id, label: jobGrades.find(g => g.id == editForm.data.job_grade_id)?.name } : null}
                                                        onChange={(selected) => editForm.setData('job_grade_id', selected ? selected.value : '')}
                                                        placeholder="ابحث عن الدرجة الوظيفية..."
                                                        isClearable
                                                        unstyled
                                                        classNames={selectClassNames}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الوصف (اختياري)</label>
                                            <textarea 
                                                value={editForm.data.description}
                                                onChange={e => editForm.setData('description', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                rows="2"
                                            ></textarea>
                                        </div>
                                    </form>
                                </div>
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button 
                                        form="editForm" 
                                        type="submit" 
                                        disabled={editForm.processing}
                                        className="px-6 py-2.5 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 transition-colors"
                                    >
                                        حفظ التعديلات
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Fields */}
                    {isFieldsModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-[#121820] w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                                            <List size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة الحقول</h2>
                                            <p className="text-sm text-slate-500">قالب: {editingTemplate?.name}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsFieldsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                    <form id="fieldsForm" onSubmit={handleFieldsSubmit}>
                                        {renderFieldBuilder()}
                                    </form>
                                </div>
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsFieldsModalOpen(false)}
                                        className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button 
                                        form="fieldsForm" 
                                        type="submit" 
                                        disabled={fieldsForm.processing}
                                        className="px-6 py-2.5 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        <CheckSquare size={18} />
                                        حفظ الحقول
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AdminLayout>
    );
}
