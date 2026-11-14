import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Select from 'react-select';
import SelectInput from '@/Components/SelectInput';
import { 
    Plus, Edit, Trash2, X, PlusCircle, AlignLeft, List, Hash, 
    CheckSquare, Image as ImageIcon, Search, FileText, Settings, 
    ShieldCheck, Calendar, Sparkles, ChevronDown, FileSpreadsheet, 
    AlertCircle, Type, Clock, Paperclip, Star, Table2, ListTodo, CalendarRange, Database, Eye 
} from 'lucide-react';
import Dropdown from '@/Components/Dropdown';
import PreviewFormModal from './PreviewFormModal';
import PreviewReportModal from './PreviewReportModal';

export default function TemplatesIndex({ auth, templates, jobGrades, stats, filters }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewFormTemplate, setPreviewFormTemplate] = useState(null);
    const [previewReportTemplate, setPreviewReportTemplate] = useState(null);

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
        control: (state) => `bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 shadow-none !min-h-[46px] text-sm transition-all duration-200 ${state.isFocused ? 'ring-4 ring-primary-500/15 border-primary-500' : ''}`,
        menu: () => 'bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl mt-2 overflow-hidden z-[100] animate-scale-in',
        option: (state) => `px-4 py-2.5 text-sm cursor-pointer transition-all duration-200 ${
            state.isSelected 
                ? 'bg-primary-500 text-white font-bold' 
                : state.isFocused 
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-semibold' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium'
        }`,
        singleValue: () => 'text-slate-800 dark:text-slate-200 text-sm font-semibold',
        input: () => 'text-slate-800 dark:text-slate-200 text-sm font-semibold',
        placeholder: () => 'text-slate-400 dark:text-slate-500 text-sm font-semibold',
        menuList: () => 'p-1.5 space-y-0.5',
        dropdownIndicator: () => 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 cursor-pointer transition-colors',
        clearIndicator: () => 'text-slate-400 hover:text-red-500 p-2 cursor-pointer transition-colors',
        indicatorSeparator: () => 'bg-slate-200 dark:bg-slate-800 w-[1px] my-2 mx-1',
        menuPortal: () => 'z-[9999]'
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
            case 'teacher_status_matrix': return <Table2 size={16} />;
            case 'teacher_discipline_matrix': return <AlertCircle size={16} />;
            case 'data_source': return <Database size={16} />;
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
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
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
                        <div key={index} className="relative p-5 bg-white dark:bg-[#121820]/60 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 group/card">
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
                                            className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-400"
                                            placeholder="مثال: إجمالي المبيعات، ملاحظات العمل..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">نوع الحقل</label>
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
                                                    { value: 'activities_matrix', label: 'جدول الأنشطة (Activities Matrix)' },
                                                    { value: 'teacher_status_matrix', label: 'جدول حالة المعلمين: غياب/استئذان/خروج (Teacher Status)' },
                                                    { value: 'teacher_discipline_matrix', label: 'جدول خلاصة انضباط المعلمين (Teacher Discipline)' },
                                                    { value: 'data_source', label: 'جدول بيانات آلي من النظام (Data Source)' }
                                                ]}
                                                isClearable={false}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    type="button" 
                                    onClick={() => removeField(index)}
                                    className="p-2.5 text-red-500 hover:text-white hover:bg-red-500 dark:hover:bg-red-600 rounded-2xl transition-all border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-600 active:scale-95 mt-5 flex items-center justify-center w-10 h-10 shrink-0 shadow-sm"
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

                            {(field.type === 'teacher_status_matrix' || field.type === 'teacher_discipline_matrix') && (
                                <div className="mt-1 bg-primary-50/40 dark:bg-primary-900/10 p-3.5 rounded-2xl border border-primary-100 dark:border-primary-800/40 animate-slide-down">
                                    <span className="text-xs text-primary-700 dark:text-primary-400 block font-bold">
                                        {field.type === 'teacher_status_matrix'
                                            ? 'جدول جاهز مطابق للنموذج الرسمي بأعمدة: (اليوم والتاريخ، اسم المعلم، غياب، استئذان، خروج أثناء الدوام المدرسي، السبب) مع حساب صف الإجمالي تلقائياً وإمكانية إضافة صفوف غير محدودة.'
                                            : 'جدول جاهز مطابق للنموذج الرسمي بأعمدة: (اليوم، التاريخ، اسم المعلم، نوع المشكلة) مع إمكانية إضافة صفوف غير محدودة.'}
                                    </span>
                                </div>
                            )}

                            {/* Data Source Configuration */}
                            {field.type === 'data_source' && (
                                <div className="mt-1 bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 animate-slide-down">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">مصدر البيانات الآلي</label>
                                    <SelectInput 
                                        value={field.options?.source || ''}
                                        onChange={(val) => {
                                            const defaultColsBySource = {
                                                classroom_visits: ['day', 'date', 'teacher_name', 'visit_type', 'notes', 'evaluation'],
                                                employee_violations: ['employee_name', 'violation_type', 'violation_date', 'action_taken', 'details'],
                                                teacher_absences: ['day', 'date', 'teacher_name', 'attendance_type', 'late_minutes'],
                                                study_plans: ['date', 'teacher_name', 'subject_name', 'grade_name', 'plan_title', 'plan_status', 'notes'],
                                                followup_books: ['day', 'date', 'teacher_name', 'subject_name', 'division_name', 'lesson_title', 'notes'],
                                                employee_leaves: ['employee_name', 'leave_type', 'start_date', 'end_date', 'days_count', 'reason', 'status'],
                                                parent_visits: ['day', 'date', 'visitor_name', 'visitor_relation', 'student_name', 'purpose', 'notes'],
                                                student_absences: ['day', 'date', 'student_name', 'grade_name', 'division_name', 'attendance_type'],
                                                student_violations: ['date', 'student_name', 'grade_name', 'division_name', 'violation_type', 'action_taken', 'status'],
                                                parent_summons: ['date', 'student_name', 'grade_name', 'division_name', 'reason', 'status', 'notes'],
                                                student_pledges: ['date', 'student_name', 'grade_name', 'division_name', 'pledge_text', 'student_signed', 'parent_signed'],
                                                clinic_visits: ['date', 'student_name', 'grade_name', 'division_name', 'symptoms', 'action_taken', 'status'],
                                                class_coverages: ['day', 'date', 'period_name', 'division_name', 'subject_name', 'absent_teacher', 'substitute_teacher'],
                                                meetings: ['date', 'meeting_time', 'meeting_title', 'meeting_type', 'participants_count', 'recommendations'],
                                                employee_achievements: ['date', 'employee_name', 'achievement_type', 'points', 'details'],
                                                teacher_app_activation: ['teacher_name', 'subject_name', 'sat_status', 'sun_status', 'mon_status', 'tue_status', 'wed_status', 'weekly_eval', 'interactive_lessons_count', 'notes'],
                                            };
                                            updateField(index, 'options', { source: val, columns: defaultColsBySource[val] || [] });
                                        }}
                                        options={[
                                            { value: 'classroom_visits', label: 'جدول الزيارات الصفية (للمشرف/الوكيل)' },
                                            { value: 'employee_violations', label: 'جدول مخالفات الموظفين' },
                                            { value: 'teacher_absences', label: 'جدول غياب وتأخر واستئذان المعلمين' },
                                            { value: 'study_plans', label: 'جدول الخطط الدراسية ومسح المقررات' },
                                            { value: 'followup_books', label: 'جدول دفاتر المتابعة والتحضير' },
                                            { value: 'employee_leaves', label: 'جدول إجازات الموظفين' },
                                            { value: 'parent_visits', label: 'جدول سجل زيارات أولياء الأمور والزوار' },
                                            { value: 'student_absences', label: 'جدول سجل غياب وتأخر الطلاب' },
                                            { value: 'student_violations', label: 'جدول المخالفات السلوكية للطلاب' },
                                            { value: 'parent_summons', label: 'جدول استدعاءات أولياء الأمور' },
                                            { value: 'student_pledges', label: 'جدول التعهدات الخطية للطلاب' },
                                            { value: 'clinic_visits', label: 'جدول زيارات العيادة المدرسية والحالات الصحية' },
                                            { value: 'class_coverages', label: 'جدول حصص الانتظار والاحتياط وتغطية الحصص' },
                                            { value: 'meetings', label: 'جدول الاجتماعات واللقاءات التربوية' },
                                            { value: 'employee_achievements', label: 'جدول إنجازات الموظفين والمعلمين' },
                                            { value: 'teacher_app_activation', label: 'جدول ملخص تفعيل التطبيق للمعلمين (أسبوعي آلي)' }
                                        ]}
                                        placeholder="اختر مصدر البيانات..."
                                        className="mb-4"
                                    />
                                    
                                    {(() => {
                                        const sourceConfigMap = {
                                            classroom_visits: {
                                                note: 'ملاحظة: سيتم عرض جدول تلقائي يحتوي على زيارات الموظف للفترة المحددة في هذا القالب.',
                                                cols: [
                                                    { id: 'day', label: 'اليوم' },
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'teacher_name', label: 'اسم المعلم' },
                                                    { id: 'visit_type', label: 'نوع الزيارة' },
                                                    { id: 'notes', label: 'الملاحظات والتوصيات' },
                                                    { id: 'evaluation', label: 'التقييم' },
                                                    { id: 'discussed_points', label: 'نقاط النقاش' }
                                                ]
                                            },
                                            employee_violations: {
                                                note: 'ملاحظة: سيتم عرض جدول تلقائي يوضح جميع المخالفات خلال الفترة المحددة في هذا القالب.',
                                                cols: [
                                                    { id: 'employee_name', label: 'اسم الموظف' },
                                                    { id: 'violation_type', label: 'نوع المخالفة' },
                                                    { id: 'violation_date', label: 'التاريخ' },
                                                    { id: 'repetition_level', label: 'مستوى التكرار' },
                                                    { id: 'action_taken', label: 'الإجراء المتخذ' },
                                                    { id: 'status', label: 'الحالة' },
                                                    { id: 'details', label: 'التفاصيل' }
                                                ]
                                            },
                                            teacher_absences: {
                                                note: 'ملاحظة: يسحب تلقائياً حالات (الغياب، التأخر، الاستئذان، الإجازة) للمعلمين خلال فترة التقرير.',
                                                cols: [
                                                    { id: 'day', label: 'اليوم' },
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'teacher_name', label: 'اسم المعلم' },
                                                    { id: 'attendance_type', label: 'نوع الحالة (غياب/تأخر/استئذان)' },
                                                    { id: 'late_minutes', label: 'مدة التأخير' },
                                                    { id: 'check_in', label: 'وقت الحضور' },
                                                    { id: 'check_out', label: 'وقت الانصراف' }
                                                ]
                                            },
                                            study_plans: {
                                                note: 'ملاحظة: يسحب تلقائياً بيانات الخطط الدراسية ومسح المقررات وحالة مطابقتها للخطة خلال الفترة.',
                                                cols: [
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'teacher_name', label: 'اسم المعلم' },
                                                    { id: 'subject_name', label: 'المادة' },
                                                    { id: 'grade_name', label: 'الصف' },
                                                    { id: 'plan_title', label: 'عنوان الخطة / آخر درس' },
                                                    { id: 'plan_status', label: 'مدى المطابقة للخطة' },
                                                    { id: 'notes', label: 'الملاحظات' }
                                                ]
                                            },
                                            followup_books: {
                                                note: 'ملاحظة: يسحب تلقائياً سجلات دفاتر المتابعة والدروس المحضرة خلال فترة التقرير.',
                                                cols: [
                                                    { id: 'day', label: 'اليوم' },
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'teacher_name', label: 'اسم المعلم' },
                                                    { id: 'subject_name', label: 'المادة' },
                                                    { id: 'division_name', label: 'الشعبة' },
                                                    { id: 'lesson_title', label: 'عنوان الدرس' },
                                                    { id: 'homework', label: 'الواجب' },
                                                    { id: 'notes', label: 'الملاحظات' }
                                                ]
                                            },
                                            employee_leaves: {
                                                note: 'ملاحظة: يسحب تلقائياً إجازات الموظفين المسجلة خلال فترة التقرير.',
                                                cols: [
                                                    { id: 'employee_name', label: 'اسم الموظف' },
                                                    { id: 'leave_type', label: 'نوع الإجازة' },
                                                    { id: 'start_date', label: 'من تاريخ' },
                                                    { id: 'end_date', label: 'إلى تاريخ' },
                                                    { id: 'days_count', label: 'المدة' },
                                                    { id: 'reason', label: 'السبب' },
                                                    { id: 'status', label: 'الحالة' }
                                                ]
                                            },
                                            parent_visits: {
                                                note: 'ملاحظة: يسحب تلقائياً سجل زيارات أولياء الأمور والزوار المسجلة خلال فترة التقرير.',
                                                cols: [
                                                    { id: 'day', label: 'اليوم' },
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'visitor_name', label: 'اسم الزائر' },
                                                    { id: 'visitor_relation', label: 'الجهة / الصفة' },
                                                    { id: 'student_name', label: 'اسم الطالب' },
                                                    { id: 'purpose', label: 'سبب الزيارة' },
                                                    { id: 'notes', label: 'التقرير / الملاحظات' }
                                                ]
                                            },
                                            student_absences: {
                                                note: 'ملاحظة: يسحب تلقائياً سجل الطلاب الغائبين والمتأخرين خلال فترة التقرير.',
                                                cols: [
                                                    { id: 'day', label: 'اليوم' },
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'student_name', label: 'اسم الطالب' },
                                                    { id: 'grade_name', label: 'الصف' },
                                                    { id: 'division_name', label: 'الشعبة' },
                                                    { id: 'attendance_type', label: 'حالة الحضور (غائب/متأخر)' }
                                                ]
                                            },
                                            student_violations: {
                                                note: 'ملاحظة: يسحب تلقائياً المخالفات السلوكية المسجلة على الطلاب والإجراءات المتخذة خلال فترة التقرير.',
                                                cols: [
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'student_name', label: 'اسم الطالب' },
                                                    { id: 'grade_name', label: 'الصف' },
                                                    { id: 'division_name', label: 'الشعبة' },
                                                    { id: 'violation_type', label: 'نوع المخالفة' },
                                                    { id: 'action_taken', label: 'الإجراء المتخذ' },
                                                    { id: 'status', label: 'الحالة' },
                                                    { id: 'details', label: 'التفاصيل' }
                                                ]
                                            },
                                            parent_summons: {
                                                note: 'ملاحظة: يسحب تلقائياً سجل استدعاءات أولياء الأمور وحالة حضورهم خلال فترة التقرير.',
                                                cols: [
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'student_name', label: 'اسم الطالب' },
                                                    { id: 'grade_name', label: 'الصف' },
                                                    { id: 'division_name', label: 'الشعبة' },
                                                    { id: 'reason', label: 'سبب الاستدعاء' },
                                                    { id: 'status', label: 'حالة الحضور' },
                                                    { id: 'notes', label: 'الملاحظات' }
                                                ]
                                            },
                                            student_pledges: {
                                                note: 'ملاحظة: يسحب تلقائياً سجل التعهدات الطلابية الخطية وحالة توقيع الطالب وولي الأمر خلال الفترة.',
                                                cols: [
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'student_name', label: 'اسم الطالب' },
                                                    { id: 'grade_name', label: 'الصف' },
                                                    { id: 'division_name', label: 'الشعبة' },
                                                    { id: 'pledge_text', label: 'نص التعهد' },
                                                    { id: 'student_signed', label: 'توقيع الطالب' },
                                                    { id: 'parent_signed', label: 'توقيع ولي الأمر' }
                                                ]
                                            },
                                            clinic_visits: {
                                                note: 'ملاحظة: يسحب تلقائياً سجل زيارات الطلاب للعيادة المدرسية والحالات الصحية المسجلة خلال الفترة.',
                                                cols: [
                                                    { id: 'date', label: 'التاريخ والوقت' },
                                                    { id: 'student_name', label: 'اسم الطالب' },
                                                    { id: 'grade_name', label: 'الصف' },
                                                    { id: 'division_name', label: 'الشعبة' },
                                                    { id: 'symptoms', label: 'الأعراض / الحالة الصحية' },
                                                    { id: 'action_taken', label: 'الإجراء الطبي المتخذ' },
                                                    { id: 'status', label: 'الحالة' }
                                                ]
                                            },
                                            class_coverages: {
                                                note: 'ملاحظة: يسحب تلقائياً جدول حصص الانتظار والاحتياط وتغطية الحصص للمعلمين الغائبين خلال الفترة.',
                                                cols: [
                                                    { id: 'day', label: 'اليوم' },
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'period_name', label: 'الحصة' },
                                                    { id: 'division_name', label: 'الصف والشعبة' },
                                                    { id: 'subject_name', label: 'المادة' },
                                                    { id: 'absent_teacher', label: 'المعلم الغائب' },
                                                    { id: 'substitute_teacher', label: 'المعلم البديل (الاحتياط)' },
                                                    { id: 'notes', label: 'الملاحظات' }
                                                ]
                                            },
                                            meetings: {
                                                note: 'ملاحظة: يسحب تلقائياً محاضر الاجتماعات واللقاءات التربوية والتوصيات المسجلة خلال الفترة.',
                                                cols: [
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'meeting_time', label: 'الوقت' },
                                                    { id: 'meeting_title', label: 'عنوان اللقاء / الاجتماع' },
                                                    { id: 'meeting_type', label: 'نوع الاجتماع' },
                                                    { id: 'participants_count', label: 'عدد الحاضرين' },
                                                    { id: 'outcomes', label: 'أبرز المخرجات' },
                                                    { id: 'recommendations', label: 'التوصيات' },
                                                    { id: 'status', label: 'الحالة' }
                                                ]
                                            },
                                            employee_achievements: {
                                                note: 'ملاحظة: يسحب تلقائياً سجل الإنجازات والمبادرات الموثقة للموظفين والمعلمين خلال الفترة.',
                                                cols: [
                                                    { id: 'date', label: 'التاريخ' },
                                                    { id: 'employee_name', label: 'اسم الموظف / المعلم' },
                                                    { id: 'achievement_type', label: 'نوع الإنجاز' },
                                                    { id: 'points', label: 'النقاط' },
                                                    { id: 'details', label: 'تفاصيل الإنجاز' }
                                                ]
                                            },
                                            teacher_app_activation: {
                                                note: 'ملاحظة: يفحص تلقائياً التزام كل معلم برفع التحضير (ت) والمتابعة (م) خلال أيام الأسبوع (السبت - الأربعاء) ويحسب التقييم الأسبوعي وعدد الدروس التفاعلية.',
                                                cols: [
                                                    { id: 'teacher_name', label: 'اسم المعلم' },
                                                    { id: 'subject_name', label: 'المادة' },
                                                    { id: 'sat_status', label: 'السبت (ت/م)' },
                                                    { id: 'sun_status', label: 'الأحد (ت/م)' },
                                                    { id: 'mon_status', label: 'الإثنين (ت/م)' },
                                                    { id: 'tue_status', label: 'الثلاثاء (ت/م)' },
                                                    { id: 'wed_status', label: 'الأربعاء (ت/م)' },
                                                    { id: 'weekly_eval', label: 'التقييم الأسبوعي' },
                                                    { id: 'interactive_lessons_count', label: 'عدد الدروس التفاعلية' },
                                                    { id: 'notes', label: 'ملاحظات' }
                                                ]
                                            }
                                        };

                                        const activeSource = sourceConfigMap[field.options?.source];
                                        if (!activeSource) return null;

                                        return (
                                            <div className="mt-4 animate-fade-in">
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الأعمدة المطلوب عرضها في الجدول</label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {activeSource.cols.map(col => {
                                                        const columns = Array.isArray(field.options?.columns) ? field.options.columns : [];
                                                        const isChecked = columns.includes(col.id);
                                                        return (
                                                            <label key={col.id} className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-400 transition-all">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        const currentOptions = Array.isArray(field.options) ? {} : (field.options || {});
                                                                        let newColumns = [...(currentOptions.columns || [])];
                                                                        if (e.target.checked) {
                                                                            newColumns.push(col.id);
                                                                        } else {
                                                                            newColumns = newColumns.filter(c => c !== col.id);
                                                                        }
                                                                        updateField(index, 'options', { ...currentOptions, columns: newColumns });
                                                                    }}
                                                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                                />
                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{col.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block font-semibold">
                                                    {activeSource.note}
                                                </span>
                                            </div>
                                        );
                                    })()}
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
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover/toggle:text-slate-800 dark:group-hover/toggle:text-slate-200 transition-colors">
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

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
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
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">إدارة قوالب التقارير</h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">قم بإنشاء وتصميم النماذج التي سيقوم الموظفون بتعبئتها بناءً على درجاتهم الوظيفية</p>
                        </div>
                        
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl shadow-md shadow-primary-500/20 text-sm font-bold transition-all shrink-0 active:scale-95"
                        >
                            <Plus size={18} /> 
                            <span>إنشاء قالب جديد</span>
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { label: 'إجمالي القوالب', value: stats.total_templates, icon: FileText, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10' },
                            { label: 'الحقول المخصصة', value: stats.total_fields, icon: Settings, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                            { label: 'التقارير المرفوعة', value: stats.total_reports, icon: CheckSquare, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                                    <stat.icon size={22} className={stat.color} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>
                                    <h3 className={`text-2xl font-black ${stat.color}`}>{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters Panel */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 p-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
                        <div className="flex-1 w-full relative group">
                            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                value={filterForm.data.search}
                                onChange={(e) => filterForm.setData('search', e.target.value)}
                                placeholder="ابحث عن قالب..."
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl pr-11 pl-4 py-2.5 sm:py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                            />
                            {filterForm.data.search && (
                                <button 
                                    type="button"
                                    onClick={() => filterForm.setData('search', '')}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <div className="w-full md:w-72">
                            <Select classNamePrefix="custom-select"
                                options={jobGrades.map(grade => ({ value: grade.id, label: grade.name }))}
                                value={filterForm.data.job_grade_id ? { value: filterForm.data.job_grade_id, label: jobGrades.find(g => g.id == filterForm.data.job_grade_id)?.name } : null}
                                onChange={(selected) => filterForm.setData('job_grade_id', selected ? selected.value : '')}
                                placeholder="تصفية بالدرجة الوظيفية..."
                                isClearable
                                unstyled
                                classNames={selectClassNames}
                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                menuPosition="fixed"
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button type="submit" className="flex-1 md:flex-initial bg-primary-500 text-white hover:bg-primary-600 px-6 py-2.5 sm:py-3 rounded-2xl text-sm font-bold transition-all shrink-0 active:scale-95 shadow-sm shadow-primary-500/20">
                                بحث
                            </button>
                            {(filterForm.data.search || filterForm.data.job_grade_id) && (
                                <Link 
                                    href={route('reports.templates')}
                                    className="flex-1 md:flex-initial text-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-5 py-2.5 sm:py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
                                >
                                    إلغاء
                                </Link>
                            )}
                        </div>
                    </form>
                </div>

                {/* Templates List */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <FileText size={15} className="text-primary-500" />
                                            <span>اسم القالب</span>
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <ShieldCheck size={15} className="text-indigo-500" />
                                            <span>الدرجة الوظيفية</span>
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الوصف</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">تاريخ الإنشاء</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {templates.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-16 text-center">
                                            <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">لا توجد قوالب حتى الآن</h3>
                                        </td>
                                    </tr>
                                ) : (
                                    templates.data.map((template) => (
                                        <tr key={template.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-500/30">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{template.name}</div>
                                                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                                                <Calendar size={11} />
                                                                {({ daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري', quarterly: 'فصلي', yearly: 'سنوي', custom: 'مخصص' })[template.period_type] || 'غير محدد'}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-500/30">
                                                                <List size={11} />
                                                                {template.fields_count || 0} حقل
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                                                    <ShieldCheck size={12} className="shrink-0" />
                                                    <span>{template.job_grade?.name || 'عام'}</span>
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                                {template.description || '-'}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                                                {new Date(template.created_at).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Dropdown>
                                                        <Dropdown.Trigger>
                                                            <button 
                                                                type="button"
                                                                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
                                                                title="خيارات المعاينة"
                                                            >
                                                                <Eye size={13} />
                                                                <span>معاينة</span>
                                                                <ChevronDown size={13} />
                                                            </button>
                                                        </Dropdown.Trigger>

                                                        <Dropdown.Content align="left" width="48">
                                                            <div className="py-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPreviewFormTemplate(template)}
                                                                    className="w-full text-right px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <FileText size={16} className="text-primary-500" />
                                                                    معاينة التعبئة
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPreviewReportTemplate(template)}
                                                                    className="w-full text-right px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <FileSpreadsheet size={16} className="text-emerald-500" />
                                                                    معاينة التقرير
                                                                </button>
                                                            </div>
                                                        </Dropdown.Content>
                                                    </Dropdown>
                                                    <button 
                                                        onClick={() => openFieldsModal(template)}
                                                        className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-emerald-200 dark:border-emerald-500/30"
                                                        title="إدارة الحقول"
                                                    >
                                                        <List size={13} />
                                                        <span>الحقول ({template.fields_count || 0})</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => openEditModal(template)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                        title="تعديل القالب"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(template.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                        title="حذف القالب"
                                                    >
                                                        <Trash2 size={14} />
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
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
                        <div className="relative bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up sm:animate-scale-in">
                            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 z-50" />
                            
                            <div className="relative p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-500/30">
                                        <PlusCircle size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">إنشاء قالب تقرير جديد</h2>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-bold">إعداد نموذج بيانات مخصص لتقارير الموظفين</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsCreateModalOpen(false)} 
                                    className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all duration-300 hover:rotate-90 active:scale-90"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <form id="createForm" onSubmit={handleCreateSubmit} className="space-y-4 sm:space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>اسم القالب</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <FileText size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-all duration-300 pointer-events-none" />
                                                <input 
                                                    type="text" 
                                                    value={form.data.name}
                                                    onChange={e => form.setData('name', e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl pr-11 pl-4 py-3 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                                    placeholder="مثال: التقرير اليومي للمبيعات"
                                                    required
                                                />
                                            </div>
                                            {form.errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{form.errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>الدرجة الوظيفية المستهدفة</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <ShieldCheck size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-all duration-300 pointer-events-none z-10" />
                                                <Select classNamePrefix="custom-select"
                                                    options={jobGrades.map(grade => ({ value: grade.id, label: grade.name }))}
                                                    value={form.data.job_grade_id ? { value: form.data.job_grade_id, label: jobGrades.find(g => g.id == form.data.job_grade_id)?.name } : null}
                                                    onChange={(selected) => form.setData('job_grade_id', selected ? selected.value : '')}
                                                    placeholder="ابحث عن الدرجة الوظيفية..."
                                                    isClearable
                                                    unstyled
                                                    classNames={{
                                                        ...selectClassNames,
                                                        control: (state) => `bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl pr-10 pl-3 shadow-none !min-h-[46px] text-sm transition-all duration-200 ${state.isFocused ? 'ring-4 ring-primary-500/15 border-primary-500' : ''}`,
                                                    }}
                                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                    menuPosition="fixed"
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                            </div>
                                            {form.errors.job_grade_id && <p className="text-red-500 text-xs mt-1 font-bold">{form.errors.job_grade_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>دورية التقرير</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-all duration-300 pointer-events-none z-10" />
                                                <Select classNamePrefix="custom-select"
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
                                                        control: (state) => `bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl pr-10 pl-3 shadow-none !min-h-[46px] text-sm transition-all duration-200 ${state.isFocused ? 'ring-4 ring-primary-500/15 border-primary-500' : ''}`,
                                                    }}
                                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                    menuPosition="fixed"
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                            </div>
                                            {form.errors.period_type && <p className="text-red-500 text-xs mt-1 font-bold">{form.errors.period_type}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الوصف (اختياري)</label>
                                        <div className="relative group">
                                            <AlignLeft size={16} className="absolute right-4 top-4 text-slate-400 group-focus-within:text-primary-500 transition-all duration-300 pointer-events-none" />
                                            <textarea 
                                                value={form.data.description}
                                                onChange={e => form.setData('description', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl pr-11 pl-4 py-3 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                                placeholder="اكتب وصفاً مختصراً للقالب وأهداف استخدامه..."
                                                rows="3"
                                            ></textarea>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-2.5 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 bg-slate-100 dark:bg-slate-800 transition-all active:scale-95"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    form="createForm" 
                                    type="submit" 
                                    disabled={form.processing}
                                    className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 transition-all shadow-md shadow-primary-500/20 active:scale-95 flex items-center gap-1.5"
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
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
                        <div className="relative bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up sm:animate-scale-in">
                            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 z-50" />
                            
                            <div className="relative p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-500/30">
                                        <Edit size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">تعديل قالب التقرير</h2>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-bold">القالب الحالي: {editingTemplate?.name}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsEditModalOpen(false)} 
                                    className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all duration-300 hover:rotate-90 active:scale-90"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <form id="editForm" onSubmit={handleEditSubmit} className="space-y-4 sm:space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>اسم القالب</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <FileText size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-all duration-300 pointer-events-none" />
                                                <input 
                                                    type="text" 
                                                    value={editForm.data.name}
                                                    onChange={e => editForm.setData('name', e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl pr-11 pl-4 py-3 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-400"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>الدرجة الوظيفية المستهدفة</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <ShieldCheck size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-all duration-300 pointer-events-none z-10" />
                                                <Select classNamePrefix="custom-select"
                                                    options={jobGrades.map(grade => ({ value: grade.id, label: grade.name }))}
                                                    value={editForm.data.job_grade_id ? { value: editForm.data.job_grade_id, label: jobGrades.find(g => g.id == editForm.data.job_grade_id)?.name } : null}
                                                    onChange={(selected) => editForm.setData('job_grade_id', selected ? selected.value : '')}
                                                    placeholder="ابحث عن الدرجة الوظيفية..."
                                                    isClearable
                                                    unstyled
                                                    classNames={{
                                                        ...selectClassNames,
                                                        control: (state) => `bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl pr-10 pl-3 shadow-none !min-h-[46px] text-sm transition-all duration-200 ${state.isFocused ? 'ring-4 ring-primary-500/15 border-primary-500' : ''}`,
                                                    }}
                                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                    menuPosition="fixed"
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                <span>دورية التقرير</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-all duration-300 pointer-events-none z-10" />
                                                <Select classNamePrefix="custom-select"
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
                                                        control: (state) => `bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl pr-10 pl-3 shadow-none !min-h-[46px] text-sm transition-all duration-200 ${state.isFocused ? 'ring-4 ring-primary-500/15 border-primary-500' : ''}`,
                                                    }}
                                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                    menuPosition="fixed"
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الوصف (اختياري)</label>
                                        <div className="relative group">
                                            <AlignLeft size={16} className="absolute right-4 top-4 text-slate-400 group-focus-within:text-primary-500 transition-all duration-300 pointer-events-none" />
                                            <textarea 
                                                value={editForm.data.description}
                                                onChange={e => editForm.setData('description', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl pr-11 pl-4 py-3 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-400"
                                                rows="3"
                                            ></textarea>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-2.5 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 bg-slate-100 dark:bg-slate-800 transition-all active:scale-95"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    form="editForm" 
                                    type="submit" 
                                    disabled={editForm.processing}
                                    className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 transition-all shadow-md shadow-primary-500/20 active:scale-95 flex items-center gap-1.5"
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
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
                        <div className="relative bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up sm:animate-scale-in">
                            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 z-50" />
                            
                            <div className="relative p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-500/30">
                                        <List size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">إدارة حقول التقرير</h2>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">القالب المستهدف:</span>
                                            <span className="px-2.5 py-0.5 text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-lg font-bold">
                                                {editingTemplate?.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsFieldsModalOpen(false)} 
                                    className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors duration-300 hover:rotate-90 active:scale-90"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <form id="fieldsForm" onSubmit={handleFieldsSubmit}>
                                    {renderFieldBuilder()}
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsFieldsModalOpen(false)}
                                    className="px-6 py-2.5 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 bg-slate-100 dark:bg-slate-800 transition-all active:scale-95"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    form="fieldsForm" 
                                    type="submit" 
                                    disabled={fieldsForm.processing}
                                    className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5"
                                >
                                    <CheckSquare size={16} />
                                    <span>حفظ حقول التقرير</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Modals */}
                {previewFormTemplate && (
                    <PreviewFormModal 
                        template={previewFormTemplate} 
                        onClose={() => setPreviewFormTemplate(null)} 
                    />
                )}
                {previewReportTemplate && (
                    <PreviewReportModal 
                        template={previewReportTemplate} 
                        onClose={() => setPreviewReportTemplate(null)} 
                    />
                )}

            </div>
        </AdminLayout>
    );
}
