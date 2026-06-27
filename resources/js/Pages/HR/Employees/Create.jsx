import React, { useState } from 'react';
import { Head, router, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import Swal from 'sweetalert2';
import { ArrowRight, Save, User, Lock, Store, Eye, EyeOff, UserCheck, Phone, Mail, MapPin, Briefcase, Award, CreditCard, Image as ImageIcon, Paperclip, Clock, CalendarDays, Trash2, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

export default function EmployeesCreate({ departments, jobGrades, roles, branches = [], isAdmin = false, managerCandidates = [], shifts = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        // Account Data
        name: '',
        username: '',
        password: '',
        role_id: roles?.[0]?.id || '',
        branch_id: branches?.[0]?.id || '',
        email: '',
        phone: '',
        avatar: null,
        is_active: true,

        // Employee Data
        department_id: '',
        job_grade_id: '',
        manager_id: '',
        hire_date: '',
        national_id: '',
        specialization: '',
        job_title: '',
        address: '',
        attachments: [],
        attachment_names: [],
        
        // Shift Data
        employee_shifts: [{ shift_id: '', working_days: [0, 1, 2, 3, 4] }],
    });

    const [showPassword, setShowPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const selectedGradeLevel = jobGrades?.find(g => String(g.id) === String(data.job_grade_id))?.level;
    const filteredManagers = managerCandidates.filter(m => selectedGradeLevel && m.level < selectedGradeLevel);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Since there is no validation per step in this simplified approach, we just submit at the end.
        post(route('hr.employees.store'), {
            forceFormData: true,
        });
    };

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const getProgress = () => {
        return ((currentStep - 1) / (totalSteps - 1)) * 100;
    };

    // Helper for input classes
    const inputClass = (error) => `w-full bg-dark-50/50 dark:bg-dark-900 border rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all ${error ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500' : 'border-dark-200 dark:border-dark-700 focus:ring-primary-500/20 focus:border-primary-500 shadow-inner text-dark-900 dark:text-white'}`;

    return (
        <AdminLayout activeMenu="دليل الموظفين">
            <Head title="إضافة موظف جديد | النظام الإداري" />

            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Premium Header */}
                <div className="relative overflow-hidden bg-white dark:bg-dark-900 border border-dark-200/60 dark:border-dark-800 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-dark-200/20 dark:shadow-none mb-6">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10">
                        <Link href={route('hr.employees')} className="inline-flex items-center gap-2 text-sm font-bold text-dark-500 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors mb-6 bg-dark-50 dark:bg-dark-800/50 hover:bg-dark-100 dark:hover:bg-dark-700 px-4 py-2 rounded-xl border border-dark-200/50 dark:border-dark-700 w-fit backdrop-blur-sm">
                            <ArrowRight size={16} /> العودة لدليل الموظفين
                        </Link>
                        
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800 shadow-primary-500/10">
                                        <User size={14} /> موظف جديد
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-dark-900 dark:text-white tracking-tight mb-2 leading-tight">
                                    معالج إضافة موظف
                                </h1>
                                <p className="text-dark-500 dark:text-dark-400 font-bold text-sm">
                                    يرجى إكمال جميع الخطوات لإضافة بيانات الموظف بشكل صحيح
                                </p>
                            </div>
                            
                            {/* Stepper Progress */}
                            <div className="w-full md:w-64">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-dark-900 dark:text-white">الخطوة {currentStep} من {totalSteps}</span>
                                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{Math.round(getProgress())}%</span>
                                </div>
                                <div className="h-2 w-full bg-dark-100 dark:bg-dark-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500 ease-out" 
                                        style={{ width: `${getProgress()}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Step 1: Account Info */}
                    <div className={currentStep === 1 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                        <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] border border-dark-200/50 dark:border-dark-800 shadow-xl overflow-hidden">
                            <div className="border-b border-dark-100 dark:border-dark-800/50 bg-dark-50/50 dark:bg-dark-800/30 px-6 py-5 md:px-10 md:py-6">
                                <h2 className="text-xl font-black text-dark-900 dark:text-white flex items-center gap-3">
                                    <UserCheck className="text-primary-500" size={24} /> بيانات الحساب والدخول
                                </h2>
                            </div>
                            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الاسم الرباعي <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                        <input type="text" required placeholder="الاسم الكامل باللغة العربية"
                                            className={inputClass(errors.name)}
                                            value={data.name} onChange={e => setData('name', e.target.value)} />
                                    </div>
                                    {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم المستخدم <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <UserCheck size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                        <input type="text" required dir="ltr" placeholder="username"
                                            className={inputClass(errors.username)}
                                            value={data.username} onChange={e => setData('username', e.target.value)} />
                                    </div>
                                    {errors.username && <p className="text-xs text-rose-500 mt-1">{errors.username}</p>}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">كلمة المرور <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                        <input type={showPassword ? "text" : "password"} required minLength="8" dir="ltr" placeholder="••••••••"
                                            className={`${inputClass(errors.password)} pl-12`}
                                            value={data.password} onChange={e => setData('password', e.target.value)} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 dark:hover:text-dark-200 p-1">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">البريد الإلكتروني</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                        <input type="email" dir="ltr" placeholder="email@example.com"
                                            className={inputClass(errors.email)}
                                            value={data.email} onChange={e => setData('email', e.target.value)} />
                                    </div>
                                    {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم الهاتف</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                        <input type="text" dir="ltr" placeholder="05XXXXXXXX"
                                            className={inputClass(errors.phone)}
                                            value={data.phone} onChange={e => setData('phone', e.target.value)} />
                                    </div>
                                    {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
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
                                    {errors.role_id && <p className="text-xs text-rose-500 mt-1">{errors.role_id}</p>}
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
                                            className={errors.branch_id ? 'border-rose-300' : ''}
                                        />
                                        {errors.branch_id && <p className="text-xs text-rose-500 mt-1">{errors.branch_id}</p>}
                                    </div>
                                )}

                                {/* Status */}
                                <div className="flex items-center gap-4 lg:col-span-3 bg-dark-50 dark:bg-dark-800/50 p-6 rounded-2xl border border-dark-100 dark:border-dark-800/60 mt-2">
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

                    {/* Step 2: Employee Info */}
                    <div className={currentStep === 2 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                        <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] border border-dark-200/50 dark:border-dark-800 shadow-xl overflow-hidden">
                            <div className="border-b border-dark-100 dark:border-dark-800/50 bg-dark-50/50 dark:bg-dark-800/30 px-6 py-5 md:px-10 md:py-6">
                                <h2 className="text-xl font-black text-dark-900 dark:text-white flex items-center gap-3">
                                    <Briefcase className="text-primary-500" size={24} /> البيانات الوظيفية والشخصية
                                </h2>
                            </div>
                            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* National ID */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم البطاقة الشخصية (الهوية)</label>
                                    <div className="relative">
                                        <CreditCard size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                        <input type="text" dir="ltr" placeholder="10XXXXXXXX"
                                            className={inputClass(errors.national_id)}
                                            value={data.national_id} onChange={e => setData('national_id', e.target.value)} />
                                    </div>
                                </div>

                                {/* Job Title */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">المسمى الوظيفي (الوظيفة)</label>
                                    <div className="relative">
                                        <Award size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                                        <input type="text" placeholder="مثال: معلم لغة عربية، محاسب"
                                            className={inputClass(errors.job_title)}
                                            value={data.job_title} onChange={e => setData('job_title', e.target.value)} />
                                    </div>
                                </div>

                                {/* Specialization */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">التخصص</label>
                                    <input type="text" placeholder="مثال: بكالوريوس لغة عربية"
                                        className={inputClass(false)}
                                        value={data.specialization} onChange={e => setData('specialization', e.target.value)} />
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">القسم الإداري</label>
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

                                {/* Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">عنوان السكن</label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute right-4 top-4 text-dark-400 pointer-events-none" />
                                        <textarea rows="2" placeholder="العنوان بالتفصيل"
                                            className={`${inputClass(false)} resize-none`}
                                            value={data.address} onChange={e => setData('address', e.target.value)}></textarea>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Step 3: Shift & Attendance */}
                    <div className={currentStep === 3 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                        <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] border border-dark-200/50 dark:border-dark-800 shadow-xl overflow-hidden">
                            <div className="border-b border-dark-100 dark:border-dark-800/50 bg-dark-50/50 dark:bg-dark-800/30 px-6 py-5 md:px-10 md:py-6">
                                <h2 className="text-xl font-black text-dark-900 dark:text-white flex items-center gap-3">
                                    <Clock className="text-primary-500" size={24} /> إعدادات الدوام والشفتات
                                </h2>
                            </div>
                            <div className="p-6 md:p-10 space-y-6">
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
                                                title="حذف هذا الشفت"
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
                                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-4">أيام الدوام الرسمي في هذا الشفت <span className="text-rose-500">*</span></label>
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
                                                                            ? shiftEntry.working_days.filter(d => d !== day.id)
                                                                            : [...shiftEntry.working_days, day.id].sort();
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
                                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 px-6 py-3.5 rounded-2xl transition-all border border-primary-200/50 dark:border-primary-800/50 hover:shadow-sm"
                                >
                                    + إضافة شفت آخر للموظف
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Attachments */}
                    <div className={currentStep === 4 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                        <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] border border-dark-200/50 dark:border-dark-800 shadow-xl overflow-hidden">
                            <div className="border-b border-dark-100 dark:border-dark-800/50 bg-dark-50/50 dark:bg-dark-800/30 px-6 py-5 md:px-10 md:py-6">
                                <h2 className="text-xl font-black text-dark-900 dark:text-white flex items-center gap-3">
                                    <Paperclip className="text-primary-500" size={24} /> المرفقات والصور الشخصية
                                </h2>
                            </div>
                            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                {/* Avatar */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-3">الصورة الشخصية <span className="text-dark-400 font-normal">(اختياري)</span></label>
                                    <div className="border-2 border-dashed border-dark-200 dark:border-dark-700 rounded-3xl p-8 text-center hover:bg-dark-50 dark:hover:bg-dark-800/50 hover:border-primary-400 dark:hover:border-primary-600 transition-all group">
                                        <div className="w-20 h-20 mx-auto bg-dark-50 dark:bg-dark-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <ImageIcon size={32} className="text-dark-400 group-hover:text-primary-500 transition-colors" />
                                        </div>
                                        <p className="text-sm font-bold text-dark-600 dark:text-dark-300 mb-2">اسحب الصورة أو انقر للاختيار</p>
                                        <p className="text-xs font-semibold text-dark-400 mb-5">JPG, PNG (الحد الأقصى 2MB)</p>
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
                                            className="text-sm text-dark-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 dark:file:bg-primary-900/20 file:text-primary-700 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/40 transition-colors cursor-pointer" />
                                    </div>
                                    {errors.avatar && <p className="text-xs text-rose-500 mt-2">{errors.avatar}</p>}
                                </div>

                                {/* Documents */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-3">مستندات (هويات، عقود، مؤهلات)</label>
                                    <div className="border-2 border-dashed border-dark-200 dark:border-dark-700 rounded-3xl p-8 text-center hover:bg-dark-50 dark:hover:bg-dark-800/50 hover:border-primary-400 dark:hover:border-primary-600 transition-all group">
                                        <div className="w-20 h-20 mx-auto bg-dark-50 dark:bg-dark-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Paperclip size={32} className="text-dark-400 group-hover:text-primary-500 transition-colors" />
                                        </div>
                                        <p className="text-sm font-bold text-dark-600 dark:text-dark-300 mb-2">أرفق مستندات الموظف (يمكن اختيار ملفات متعددة)</p>
                                        <p className="text-xs font-semibold text-dark-400 mb-5">PDF, DOC, JPG</p>
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
                                            className="text-sm text-dark-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 dark:file:bg-primary-900/20 file:text-primary-700 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/40 transition-colors cursor-pointer" />
                                    </div>

                                    {/* New Files Preview List */}
                                    {data.attachments && data.attachments.length > 0 && (
                                        <div className="mt-6 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="text-sm font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> الملفات المحددة للرفع:</h4>
                                            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                                {data.attachments.map((file, i) => (
                                                    <div key={i} className="flex flex-col gap-3 bg-dark-50 dark:bg-dark-800/60 border border-dark-100 dark:border-dark-700 rounded-2xl p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                                                                    <Paperclip size={16} />
                                                                </div>
                                                                <span className="text-sm font-bold text-dark-800 dark:text-dark-200 truncate" dir="ltr">{file.name}</span>
                                                                <span className="text-xs font-bold text-dark-400 flex-shrink-0 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
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
                            </div>
                        </div>
                    </div>

                    {/* Submit & Navigation Actions */}
                    <div className="flex items-center justify-between pt-4">
                        <button 
                            type="button"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-2xl transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-dark-600 dark:text-dark-300 bg-white dark:bg-dark-800 hover:bg-dark-50 dark:hover:bg-dark-700 border border-dark-200 dark:border-dark-700 shadow-sm hover:scale-105'}`}
                        >
                            <ChevronRight size={18} /> الخطوة السابقة
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <Link href={route('hr.employees')} className="px-6 py-3.5 text-sm font-bold text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-2xl transition-colors hidden sm:block">
                                إلغاء الأمر
                            </Link>
                            
                            {currentStep < totalSteps ? (
                                <button 
                                    type="button"
                                    onClick={nextStep}
                                    className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-dark-900 dark:bg-dark-700 hover:bg-dark-800 dark:hover:bg-dark-600 rounded-2xl shadow-lg transition-all active:scale-[0.98] hover:-translate-y-1"
                                >
                                    الخطوة التالية <ChevronLeft size={18} />
                                </button>
                            ) : (
                                <button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70 animate-in zoom-in-95 hover:-translate-y-1"
                                >
                                    <Save size={18} /> حفظ بيانات الموظف
                                </button>
                            )}
                        </div>
                    </div>

                </form>
            </div>
        </AdminLayout>
    );
}
