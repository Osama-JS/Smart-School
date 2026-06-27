import React, { useState } from 'react';
import { Head, router, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import Swal from 'sweetalert2';
import { ArrowRight, Save, User, Lock, Store, Eye, EyeOff, UserCheck, Phone, Mail, MapPin, Briefcase, Award, CreditCard, Image as ImageIcon, Paperclip, FileText, Trash2, Clock, CalendarDays, Shield, CheckCircle2 } from 'lucide-react';

export default function EmployeesEdit({ employee, departments, jobGrades, roles, branches = [], isAdmin = false, managerCandidates = [], shifts = [] }) {
    const { asset_url } = usePage().props;
    const initialEmployeeShifts = employee.shifts && employee.shifts.length > 0
        ? employee.shifts.map(s => {
            let parsedDays = [0, 1, 2, 3, 4];
            if (s.pivot && s.pivot.working_days) {
                try {
                    parsedDays = typeof s.pivot.working_days === 'string' ? JSON.parse(s.pivot.working_days) : s.pivot.working_days;
                } catch(e) {}
            }
            return {
                shift_id: s.id,
                working_days: Array.isArray(parsedDays) ? parsedDays.map(Number) : [0, 1, 2, 3, 4]
            };
        })
        : [{ shift_id: '', working_days: [0, 1, 2, 3, 4] }];

    const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'account'
    const [showPassword, setShowPassword] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        
        // Account Data
        name: employee.user?.name || '',
        username: employee.user?.username || '',
        password: '',
        role_id: employee.user?.role_id || '',
        branch_id: employee.user?.branch_id || '',
        email: employee.user?.email || '',
        phone: employee.user?.phone || '',
        avatar: null,
        is_active: employee.user?.is_active ?? true,

        // Employee Data
        department_id: employee.department_id || '',
        job_grade_id: employee.job_grade_id || '',
        manager_id: employee.manager_id || '',
        hire_date: employee.hire_date || '',
        national_id: employee.national_id || '',
        specialization: employee.specialization || '',
        job_title: employee.job_title || '',
        address: employee.address || '',
        kept_attachments: (employee.attachments || []).map((att, i) => {
            return typeof att === 'string' ? { path: att, name: `مرفق ${i+1}` } : att;
        }),
        attachments: [],
        attachment_names: [],

        // Shift Data
        employee_shifts: initialEmployeeShifts,
    });

    // Find the level of the currently selected job grade
    const selectedGradeLevel = jobGrades?.find(g => String(g.id) === String(data.job_grade_id))?.level;
    
    // Filter managers: their level must be less than the selected grade's level (smaller level number = higher rank)
    const filteredManagers = managerCandidates.filter(m => selectedGradeLevel && m.level < selectedGradeLevel);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('hr.employees.update', employee.id), {
            forceFormData: true,
        });
    };

    // Helper for input classes
    const inputClass = (error) => `w-full bg-dark-50/50 dark:bg-dark-900 border rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all ${error ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500' : 'border-dark-200 dark:border-dark-700 focus:ring-primary-500/20 focus:border-primary-500 shadow-inner text-dark-900 dark:text-white'}`;

    return (
        <AdminLayout activeMenu="دليل الموظفين">
            <Head title={`تعديل بيانات الموظف | ${employee.user?.name}`} />

            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Premium Header */}
                <div className="relative overflow-hidden bg-white dark:bg-dark-900 border border-dark-200/60 dark:border-dark-800 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-dark-200/20 dark:shadow-none mb-6">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <Link href={route('hr.employees')} className="inline-flex items-center gap-2 text-sm font-bold text-dark-500 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors mb-6 bg-dark-50 dark:bg-dark-800/50 hover:bg-dark-100 dark:hover:bg-dark-700 px-4 py-2 rounded-xl border border-dark-200/50 dark:border-dark-700 w-fit backdrop-blur-sm">
                                <ArrowRight size={16} /> العودة لدليل الموظفين
                            </Link>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800 shadow-primary-500/10">
                                    <User size={14} /> تعديل بيانات الموظف
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-dark-900 dark:text-white tracking-tight mb-2 leading-tight">
                                {employee.user?.name}
                            </h1>
                            <p className="text-dark-500 dark:text-dark-400 font-bold text-sm">
                                يمكنك تحديث بيانات الموظف من خلال التبويبات المتاحة
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Tabs */}
                    <div className="flex flex-wrap p-1.5 gap-1.5 bg-white dark:bg-dark-900 border border-dark-200/60 dark:border-dark-800 rounded-2xl shadow-xl shadow-dark-200/10 dark:shadow-none mb-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('personal')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm border border-primary-200/50 dark:border-primary-800/50' : 'text-dark-500 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800/50 border border-transparent'}`}
                        >
                            <User size={18} /> البيانات الشخصية
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('job')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'job' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm border border-primary-200/50 dark:border-primary-800/50' : 'text-dark-500 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800/50 border border-transparent'}`}
                        >
                            <Briefcase size={18} /> البيانات الوظيفية
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('attendance')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'attendance' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm border border-primary-200/50 dark:border-primary-800/50' : 'text-dark-500 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800/50 border border-transparent'}`}
                        >
                            <Clock size={18} /> الدوام والشفتات
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('attachments')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'attachments' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm border border-primary-200/50 dark:border-primary-800/50' : 'text-dark-500 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800/50 border border-transparent'}`}
                        >
                            <Paperclip size={18} /> المرفقات
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('account')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'account' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm border border-primary-200/50 dark:border-primary-800/50' : 'text-dark-500 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800/50 border border-transparent'}`}
                        >
                            <Shield size={18} /> بيانات الحساب
                        </button>
                    </div>

                    <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] border border-dark-200/50 dark:border-dark-800 shadow-xl overflow-hidden">
                        {/* Tab Content: Personal */}
                        {activeTab === 'personal' && (
                            <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الاسم الرباعي <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                            <input type="text" required
                                                className={inputClass(errors.name)}
                                                value={data.name} onChange={e => setData('name', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* National ID */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم البطاقة الشخصية (الهوية)</label>
                                        <div className="relative">
                                            <CreditCard size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                            <input type="text" dir="ltr"
                                                className={inputClass(errors.national_id)}
                                                value={data.national_id} onChange={e => setData('national_id', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم الهاتف</label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                            <input type="text" dir="ltr"
                                                className={inputClass(errors.phone)}
                                                value={data.phone} onChange={e => setData('phone', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">عنوان السكن</label>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute right-4 top-4 text-dark-400 pointer-events-none" />
                                            <textarea rows="2" placeholder="العنوان بالتفصيل"
                                                className={`${inputClass(false)} resize-none pl-4 pr-11 py-3`}
                                                value={data.address} onChange={e => setData('address', e.target.value)}></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Job Data */}
                        {activeTab === 'job' && (
                            <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Job Title */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">المسمى الوظيفي (الوظيفة)</label>
                                        <div className="relative">
                                            <Award size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                            <input type="text"
                                                className={inputClass(errors.job_title)}
                                                value={data.job_title} onChange={e => setData('job_title', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Specialization */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">التخصص</label>
                                        <div className="relative">
                                            <input type="text"
                                                className={`${inputClass(errors.specialization)} pl-4 pr-4`}
                                                value={data.specialization} onChange={e => setData('specialization', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">القسم</label>
                                        <SelectInput
                                            options={departments.map(d => ({ value: d.id, label: d.name }))}
                                            value={departments.map(d => ({ value: d.id, label: d.name })).find(o => o.value === data.department_id) || null}
                                            onChange={(selected) => setData('department_id', selected || '')}
                                            placeholder="القسم الإداري أو الأكاديمي..."
                                        />
                                    </div>

                                    {/* Job Grade */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الدرجة الوظيفية</label>
                                        <SelectInput
                                            options={jobGrades.map(g => ({ value: g.id, label: g.name }))}
                                            value={jobGrades.map(g => ({ value: g.id, label: g.name })).find(o => o.value === data.job_grade_id) || null}
                                            onChange={(selected) => {
                                                setData(data => ({ ...data, job_grade_id: selected || '', manager_id: '' }));
                                            }}
                                            placeholder="حدد الدرجة..."
                                        />
                                    </div>

                                    {/* Direct Manager */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">المدير المباشر (اختياري)</label>
                                        <SelectInput
                                            options={filteredManagers.map(m => ({ value: m.id, label: m.name }))}
                                            value={filteredManagers.map(m => ({ value: m.id, label: m.name })).find(o => o.value === data.manager_id) || null}
                                            onChange={(selected) => setData('manager_id', selected || '')}
                                            placeholder={!data.job_grade_id ? "اختر الدرجة الوظيفية أولاً..." : (filteredManagers.length === 0 ? "لا يوجد مديرين متاحين لهذه الدرجة" : "اختر المدير المباشر...")}
                                            disabled={!data.job_grade_id || filteredManagers.length === 0}
                                        />
                                    </div>

                                    {/* Hire Date */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">تاريخ التعيين</label>
                                        <FlatpickrInput
                                            id="hire_date"
                                            placeholder="اختر تاريخ التعيين"
                                            value={data.hire_date}
                                            onChange={(dateStr) => setData('hire_date', dateStr)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Attendance */}
                        {activeTab === 'attendance' && (
                            <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <div className="space-y-6 pt-4">
                                        {data.employee_shifts.map((shiftEntry, index) => (
                                            <div key={index} className="p-6 md:p-8 bg-dark-50 dark:bg-dark-800/30 border border-dark-200 dark:border-dark-700/50 rounded-3xl relative group transition-all hover:shadow-md hover:border-primary-300 dark:hover:border-primary-800">
                                                {data.employee_shifts.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newShifts = [...data.employee_shifts];
                                                            newShifts.splice(index, 1);
                                                            setData('employee_shifts', newShifts);
                                                        }}
                                                        className="absolute top-6 left-6 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2.5 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                )}
                                                
                                                <div className="grid grid-cols-1 gap-6">
                                                    <div className="pr-12 md:pr-0">
                                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الشفت (فترة العمل) <span className="text-primary-500">#{index + 1}</span></label>
                                                        <SelectInput
                                                            options={shifts.filter(s => !data.employee_shifts.some((es, idx) => idx !== index && es.shift_id === s.id)).map(s => ({ value: s.id, label: `${s.name} (${s.start_time} - ${s.end_time})` }))}
                                                            value={shifts.map(s => ({ value: s.id, label: `${s.name} (${s.start_time} - ${s.end_time})` })).find(o => o.value === shiftEntry.shift_id) || null}
                                                            onChange={(selected) => {
                                                                const newShifts = [...data.employee_shifts];
                                                                newShifts[index].shift_id = selected || '';
                                                                setData('employee_shifts', newShifts);
                                                            }}
                                                            placeholder="اختر الشفت المخصص للموظف..."
                                                        />
                                                        {errors[`employee_shifts.${index}.shift_id`] && <p className="text-xs text-rose-500 mt-2">{errors[`employee_shifts.${index}.shift_id`]}</p>}
                                                    </div>

                                                    {shiftEntry.shift_id && (
                                                        <div className="animate-in slide-in-from-top-4 fade-in duration-300 pt-4 border-t border-dark-100 dark:border-dark-800">
                                                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-4">أيام الدوام الرسمي <span className="text-rose-500">*</span></label>
                                                            <div className="flex flex-wrap gap-3">
                                                                {[
                                                                    { id: 0, name: 'الأحد' }, { id: 1, name: 'الإثنين' }, { id: 2, name: 'الثلاثاء' },
                                                                    { id: 3, name: 'الأربعاء' }, { id: 4, name: 'الخميس' }, { id: 5, name: 'الجمعة' }, { id: 6, name: 'السبت' }
                                                                ].map(day => {
                                                                    const isSelected = shiftEntry.working_days.includes(day.id);
                                                                    return (
                                                                        <button
                                                                            key={day.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newShifts = [...data.employee_shifts];
                                                                                const newDays = isSelected 
                                                                                    ? shiftEntry.working_days.filter(d => Number(d) !== day.id)
                                                                                    : [...shiftEntry.working_days, day.id].map(Number).sort();
                                                                                newShifts[index].working_days = newDays;
                                                                                setData('employee_shifts', newShifts);
                                                                            }}
                                                                            className={`px-5 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${isSelected ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/25 scale-105' : 'bg-white dark:bg-dark-900 text-dark-600 dark:text-dark-300 border-dark-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700 hover:scale-105'}`}
                                                                        >
                                                                            {day.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            {errors[`employee_shifts.${index}.working_days`] && <p className="text-xs text-rose-500 mt-2">{errors[`employee_shifts.${index}.working_days`]}</p>}
                                                            <p className="text-xs font-semibold text-dark-500 mt-4">الأيام غير المحددة ستُعتبر أيام راحة (إجازة أسبوعية) ولن يُحسب فيها غياب.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setData('employee_shifts', [...data.employee_shifts, { shift_id: '', working_days: [0, 1, 2, 3, 4] }]);
                                            }}
                                            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 px-6 py-3.5 rounded-2xl transition-all border border-primary-200/50 dark:border-primary-800/50 hover:shadow-sm w-max"
                                        >
                                            + إضافة شفت آخر للموظف
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Attachments */}
                        {activeTab === 'attachments' && (
                            <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Upload New Attachments */}
                                        <div className="animate-in slide-in-from-right-4 fade-in duration-500">
                                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-3">إضافة مستندات جديدة</label>
                                            <div className="border-2 border-dashed border-dark-200 dark:border-dark-700 rounded-3xl p-8 text-center hover:bg-dark-50 dark:hover:bg-dark-800/50 hover:border-primary-400 dark:hover:border-primary-600 transition-all group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-primary-500/5 dark:bg-primary-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out pointer-events-none" />
                                                <div className="relative z-10 w-20 h-20 bg-dark-50 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                    <Paperclip size={32} className="text-dark-400 group-hover:text-primary-500 transition-colors" />
                                                </div>
                                                <p className="relative z-10 text-sm font-bold text-dark-600 dark:text-dark-300 mb-2">اسحب وأفلت الملفات هنا</p>
                                                <p className="relative z-10 text-xs font-semibold text-dark-400 mb-5">أو انقر لاختيار الملفات (PDF, DOC, JPG...)</p>
                                                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => {
                                                    if (e.target.files.length > 0) {
                                                        const files = Array.from(e.target.files);
                                                        
                                                        // Filter out files that are too large (5MB = 5 * 1024 * 1024 bytes)
                                                        const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
                                                        const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
                                                        
                                                        if (oversizedFiles.length > 0) {
                                                            Swal.fire({
                                                                icon: 'error',
                                                                title: 'حجم الملف كبير جداً',
                                                                text: 'تم استبعاد بعض الملفات لأن حجمها يتجاوز 5 ميجابايت (الحد الأقصى).',
                                                                confirmButtonColor: '#ef4444',
                                                                confirmButtonText: 'حسناً',
                                                                background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#fff',
                                                                color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a',
                                                                customClass: { popup: 'rounded-3xl border border-dark-200 dark:border-dark-700', confirmButton: 'rounded-xl px-6 py-2.5 font-bold' }
                                                            });
                                                        }
                                                        
                                                        if (validFiles.length > 0) {
                                                            setData(prev => ({
                                                                ...prev,
                                                                attachments: [...prev.attachments, ...validFiles],
                                                                attachment_names: [...prev.attachment_names, ...validFiles.map(f => f.name.replace(/\.[^/.]+$/, ""))]
                                                            }));
                                                        }
                                                        e.target.value = null;
                                                    }
                                                }}
                                                    className="relative z-10 text-sm text-dark-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 dark:file:bg-primary-900/20 file:text-primary-700 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/40 transition-colors cursor-pointer" />
                                            </div>
                                            
                                            {/* New Files Preview List */}
                                            {data.attachments && data.attachments.length > 0 && (
                                                <div className="mt-6 animate-in fade-in slide-in-from-top-2">
                                                    <h4 className="text-sm font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> الملفات الجديدة المحددة للرفع:</h4>
                                                    <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {data.attachments.map((file, i) => (
                                                            <div key={i} className="flex flex-col gap-3 bg-dark-50 dark:bg-dark-800/60 border border-dark-100 dark:border-dark-700 rounded-2xl p-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                                                                            <Paperclip size={16} />
                                                                        </div>
                                                                        <span className="text-sm font-bold text-dark-800 dark:text-dark-200 truncate" dir="ltr">{file.name}</span>
                                                                        <span className="text-xs font-bold text-dark-400 flex-shrink-0 font-mono">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                                    </div>
                                                                    <button type="button" onClick={() => {
                                                                        const newFiles = [...data.attachments];
                                                                        const newNames = [...data.attachment_names];
                                                                        newFiles.splice(i, 1);
                                                                        newNames.splice(i, 1);
                                                                        setData(prev => ({ ...prev, attachments: newFiles, attachment_names: newNames }));
                                                                    }} className="text-dark-400 hover:text-rose-500 hover:bg-white dark:hover:bg-dark-700 p-2 rounded-xl transition-colors flex-shrink-0" title="حذف الملف">
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                                <input type="text" value={data.attachment_names[i] || ''} onChange={e => {
                                                                    const newNames = [...data.attachment_names];
                                                                    newNames[i] = e.target.value;
                                                                    setData('attachment_names', newNames);
                                                                }} placeholder="اكتب وصفاً أو اسماً للملف (مثال: السيرة الذاتية)" 
                                                                className="w-full bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 text-dark-900 dark:text-white" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Existing Attachments */}
                                        <div className="animate-in slide-in-from-left-4 fade-in duration-500 delay-150 fill-mode-both">
                                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-3">المرفقات الحالية المحفوظة ({data.kept_attachments?.length || 0})</label>
                                            <div className="bg-dark-50 dark:bg-dark-800/30 border border-dark-200 dark:border-dark-700/50 rounded-3xl p-6 h-full min-h-[160px] relative">
                                                {data.kept_attachments && data.kept_attachments.length > 0 ? (
                                                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {data.kept_attachments.map((att, i) => {
                                                            const isImage = att.path.match(/\.(jpeg|jpg|gif|png)$/) != null;
                                                            return (
                                                                <div key={i} className="flex flex-col gap-3 bg-white dark:bg-dark-800/60 border border-dark-100 dark:border-dark-700 rounded-2xl p-4 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${isImage ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'}`}>
                                                                                {isImage ? <ImageIcon size={20} className="group-hover:animate-pulse" /> : <FileText size={20} className="group-hover:animate-pulse" />}
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <button type="button" onClick={() => setSelectedAttachment(att.path)} className="text-sm font-bold text-dark-700 dark:text-dark-300 hover:text-primary-600 dark:hover:text-primary-400 truncate block transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-primary-500 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-right text-right">
                                                                                    {att.name || `مرفق ${i+1}`}
                                                                                </button>
                                                                                <span className="text-xs font-semibold text-dark-400 inline-block transform group-hover:translate-x-1 transition-transform" dir="ltr">{att.path.split('/').pop()}</span>
                                                                            </div>
                                                                        </div>
                                                                        <button type="button" onClick={() => {
                                                                            Swal.fire({
                                                                                title: 'هل أنت متأكد؟',
                                                                                text: 'هل أنت متأكد من رغبتك في حذف هذا المرفق نهائياً؟ سيتم الحذف بعد حفظ التعديلات.',
                                                                                icon: 'warning',
                                                                                showCancelButton: true,
                                                                                confirmButtonColor: '#ef4444',
                                                                                cancelButtonColor: '#3b82f6',
                                                                                confirmButtonText: 'نعم، احذفه',
                                                                                cancelButtonText: 'إلغاء',
                                                                                background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#fff',
                                                                                color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a',
                                                                                customClass: {
                                                                                    popup: 'rounded-3xl border border-dark-200 dark:border-dark-700',
                                                                                    confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
                                                                                    cancelButton: 'rounded-xl px-6 py-2.5 font-bold'
                                                                                }
                                                                            }).then((result) => {
                                                                                if (result.isConfirmed) {
                                                                                    const newKept = [...data.kept_attachments];
                                                                                    newKept.splice(i, 1);
                                                                                    setData('kept_attachments', newKept);
                                                                                }
                                                                            });
                                                                        }} className="p-2 text-dark-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors flex-shrink-0" title="حذف المرفق">
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                    <input type="text" value={att.name || ''} onChange={e => {
                                                                        const newKept = [...data.kept_attachments];
                                                                        newKept[i].name = e.target.value;
                                                                        setData('kept_attachments', newKept);
                                                                    }} placeholder="تعديل اسم المرفق (مثال: شهادة البكالوريوس)" className="w-full bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 text-dark-900 dark:text-white" />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                                        <div className="w-16 h-16 bg-dark-100 dark:bg-dark-800 rounded-full flex items-center justify-center mb-4">
                                                            <FileText size={32} className="text-dark-300 dark:text-dark-600" />
                                                        </div>
                                                        <p className="text-sm font-bold text-dark-500">لا توجد مرفقات محفوظة لهذا الموظف</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Account */}
                        {activeTab === 'account' && (
                            <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="w-full md:w-1/3 flex flex-col items-center justify-start border-b md:border-b-0 md:border-l border-dark-100 dark:border-dark-800 pb-8 md:pb-0 md:pl-8">
                                        <div className="relative mb-4">
                                            {employee.user?.avatar ? (
                                                <img src={`${asset_url}/storage/${employee.user.avatar}`} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-dark-800 shadow-xl" />
                                            ) : (
                                                <div className="w-32 h-32 rounded-full bg-dark-50 dark:bg-dark-800 border-4 border-white dark:border-dark-900 shadow-xl flex items-center justify-center">
                                                    <User size={40} className="text-dark-400" />
                                                </div>
                                            )}
                                        </div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">تحديث الصورة الشخصية</label>
                                        <input type="file" accept="image/*" onChange={e => {
                                            const file = e.target.files[0];
                                            if (file && file.size > 2 * 1024 * 1024) {
                                                Swal.fire({
                                                    icon: 'error',
                                                    title: 'حجم الملف كبير جداً',
                                                    text: 'يجب ألا يتجاوز حجم الصورة 2 ميجابايت',
                                                    confirmButtonColor: '#ef4444',
                                                    confirmButtonText: 'حسناً',
                                                    background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#fff',
                                                    color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a',
                                                    customClass: { popup: 'rounded-3xl border border-dark-200 dark:border-dark-700', confirmButton: 'rounded-xl px-6 py-2.5 font-bold' }
                                                });
                                                e.target.value = null;
                                                return;
                                            }
                                            setData('avatar', file);
                                        }}
                                            className="text-xs w-full text-dark-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-50 dark:file:bg-primary-900/20 file:text-primary-700 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/40 cursor-pointer transition-colors" />
                                        {errors.avatar && <p className="text-xs text-rose-500 mt-2">{errors.avatar}</p>}
                                    </div>

                                    <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Username */}
                                        <div>
                                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم المستخدم <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <UserCheck size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                                <input type="text" required dir="ltr"
                                                    className={inputClass(errors.username)}
                                                    value={data.username} onChange={e => setData('username', e.target.value)} />
                                            </div>
                                            {errors.username && <p className="text-xs text-rose-500 mt-1">{errors.username}</p>}
                                        </div>

                                        {/* Password */}
                                        <div>
                                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">تغيير كلمة المرور</label>
                                            <div className="relative">
                                                <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                                <input type={showPassword ? "text" : "password"} minLength="8" dir="ltr" placeholder="أدخل للتغيير أو اترك فارغاً"
                                                    className={`${inputClass(errors.password)} pl-12`}
                                                    value={data.password} onChange={e => setData('password', e.target.value)} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 dark:hover:text-dark-200 p-1">
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">البريد الإلكتروني</label>
                                            <div className="relative">
                                                <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                                <input type="email" dir="ltr"
                                                    className={inputClass(errors.email)}
                                                    value={data.email} onChange={e => setData('email', e.target.value)} />
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <div>
                                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الصلاحية <span className="text-rose-500">*</span></label>
                                            <SelectInput
                                                options={roles.map(r => ({ value: r.id, label: r.name }))}
                                                value={roles.map(r => ({ value: r.id, label: r.name })).find(o => o.value === data.role_id) || null}
                                                onChange={(selected) => setData('role_id', selected || '')}
                                                placeholder="اختر الصلاحية..."
                                                className={errors.role_id ? 'border-rose-300' : ''}
                                            />
                                        </div>

                                        {/* Branch (Admin Only) */}
                                        {isAdmin && (
                                            <div>
                                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الفرع <span className="text-rose-500">*</span></label>
                                                <SelectInput
                                                    options={branches.map(b => ({ value: b.id, label: b.name }))}
                                                    value={branches.map(b => ({ value: b.id, label: b.name })).find(o => o.value === data.branch_id) || null}
                                                    onChange={(selected) => setData('branch_id', selected || '')}
                                                    placeholder="اختر الفرع..."
                                                />
                                            </div>
                                        )}

                                        {/* Status */}
                                        <div className="flex items-center gap-4 lg:col-span-2 bg-dark-50 dark:bg-dark-800/50 p-6 rounded-2xl border border-dark-100 dark:border-dark-800/60 mt-2">
                                            <div className="relative flex items-center justify-center p-0.5 rounded-full overflow-hidden w-14 h-7 bg-dark-200 dark:bg-dark-700 cursor-pointer" onClick={() => setData('is_active', !data.is_active)}>
                                                <div className={`absolute top-0 bottom-0 left-0 right-0 transition-colors duration-300 ${data.is_active ? 'bg-emerald-500' : 'bg-dark-300 dark:bg-dark-600'}`} />
                                                <div className={`absolute w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${data.is_active ? '-translate-x-3.5' : 'translate-x-3.5'}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black text-dark-900 dark:text-white">{data.is_active ? 'الحساب نشط (سيتمكن الموظف من الدخول)' : 'الحساب معطل (موقوف مؤقتاً)'}</h4>
                                                <p className="text-sm text-dark-500 dark:text-dark-400 font-semibold mt-1">تفعيل أو إيقاف تسجيل دخول الموظف للنظام</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Link href={route('hr.employees')} className="px-6 py-3.5 text-sm font-bold text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-2xl transition-colors">
                            إلغاء الأمر
                        </Link>
                        <button type="submit" disabled={processing} className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70 hover:-translate-y-1">
                            <Save size={18} /> حفظ التعديلات
                        </button>
                    </div>

                </form>

                {/* Attachment Preview Modal */}
                {selectedAttachment && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-dark-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                            
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-dark-100 dark:border-dark-800 bg-dark-50/50 dark:bg-dark-900/50">
                                <h3 className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-2" dir="ltr">
                                    {selectedAttachment.split('/').pop()}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <a href={`${asset_url}/storage/${selectedAttachment}`} download target="_blank" rel="noreferrer" className="flex items-center justify-center p-2 text-dark-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-colors" title="تحميل الملف">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    </a>
                                    <button onClick={() => setSelectedAttachment(null)} className="flex items-center justify-center p-2 text-dark-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-dark-50/50 dark:bg-dark-950 flex items-center justify-center min-h-[50vh]">
                                {selectedAttachment.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                    <img src={`${asset_url}/storage/${selectedAttachment}`} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-sm" />
                                ) : selectedAttachment.match(/\.(pdf)$/i) ? (
                                    <iframe src={`${asset_url}/storage/${selectedAttachment}`} className="w-full h-[70vh] rounded-xl shadow-sm border-0" title="PDF Preview"></iframe>
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText size={40} />
                                        </div>
                                        <h4 className="text-lg font-bold text-dark-900 dark:text-white mb-2">لا يمكن معاينة هذا النوع من الملفات</h4>
                                        <p className="text-dark-500 dark:text-dark-400 mb-6">يرجى تحميل الملف لفتحه باستخدام البرامج المناسبة في جهازك.</p>
                                        <a href={`${asset_url}/storage/${selectedAttachment}`} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors shadow-sm shadow-primary-500/20">
                                            تحميل الملف الآن
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
