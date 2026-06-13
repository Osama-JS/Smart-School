import React, { useState } from 'react';
import { Head, router, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { ArrowRight, Save, User, Lock, Store, Eye, EyeOff, UserCheck, Phone, Mail, MapPin, Briefcase, Award, CreditCard, Image as ImageIcon, Paperclip, Clock, CalendarDays } from 'lucide-react';

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
        
        // Shift Data
        employee_shifts: [{ shift_id: '', working_days: [0, 1, 2, 3, 4] }],
    });

    const [showPassword, setShowPassword] = useState(false);

    // Find the level of the currently selected job grade
    const selectedGradeLevel = jobGrades?.find(g => String(g.id) === String(data.job_grade_id))?.level;
    
    // Filter managers: their level must be less than the selected grade's level (smaller level number = higher rank)
    const filteredManagers = managerCandidates.filter(m => selectedGradeLevel && m.level < selectedGradeLevel);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('hr.employees.store'), {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout activeMenu="دليل الموظفين">
            <Head title="إضافة موظف جديد | النظام الإداري" />

            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href={route('hr.employees')} className="text-slate-400 hover:text-primary-600 transition-colors p-1.5 rounded-xl hover:bg-slate-100">
                                <ArrowRight size={20} />
                            </Link>
                            <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">إضافة موظف جديد</h1>
                        </div>
                        <p className="text-primary-700/80 dark:text-primary-300/80 text-sm font-semibold pr-10">إدخال بيانات الحساب والبيانات الوظيفية للموظف الجديد</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Account Info Section */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-md shadow-slate-100/50 dark:shadow-none overflow-hidden">
                    <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
                        <h2 className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-2">
                            <UserCheck className="text-primary-500" size={20} /> بيانات الحساب والدخول
                        </h2>
                    </div>
                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الاسم الرباعي <span className="text-accent-500">*</span></label>
                            <div className="relative">
                                <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input type="text" required placeholder="الاسم الكامل باللغة العربية"
                                    className={`w-full bg-white dark:bg-slate-900 border rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all ${errors.name ? 'border-accent-300 focus:ring-accent-500/10 focus:border-accent-400' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/10 focus:border-primary-400'}`}
                                    value={data.name} onChange={e => setData('name', e.target.value)} />
                            </div>
                            {errors.name && <p className="text-xs text-accent-500 mt-1">{errors.name}</p>}
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم المستخدم <span className="text-accent-500">*</span></label>
                            <div className="relative">
                                <UserCheck size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input type="text" required dir="ltr" placeholder="username"
                                    className={`w-full bg-white dark:bg-slate-900 border rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all ${errors.username ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                    value={data.username} onChange={e => setData('username', e.target.value)} />
                            </div>
                            {errors.username && <p className="text-xs text-accent-500 mt-1">{errors.username}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">كلمة المرور <span className="text-accent-500">*</span></label>
                            <div className="relative">
                                <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input type={showPassword ? "text" : "password"} required minLength="8" dir="ltr" placeholder="••••••••"
                                    className={`w-full bg-white dark:bg-slate-900 border rounded-2xl pr-11 pl-12 py-3 text-sm outline-none transition-all ${errors.password ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                    value={data.password} onChange={e => setData('password', e.target.value)} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-accent-500 mt-1">{errors.password}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input type="email" dir="ltr" placeholder="email@example.com"
                                    className={`w-full bg-white dark:bg-slate-900 border rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all ${errors.email ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                    value={data.email} onChange={e => setData('email', e.target.value)} />
                            </div>
                            {errors.email && <p className="text-xs text-accent-500 mt-1">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم الهاتف</label>
                            <div className="relative">
                                <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input type="text" dir="ltr" placeholder="05XXXXXXXX"
                                    className={`w-full bg-white dark:bg-slate-900 border rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all ${errors.phone ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                    value={data.phone} onChange={e => setData('phone', e.target.value)} />
                            </div>
                            {errors.phone && <p className="text-xs text-accent-500 mt-1">{errors.phone}</p>}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الصلاحية <span className="text-accent-500">*</span></label>
                            <SelectInput
                                options={roles.map(r => ({ value: r.id, label: r.name }))}
                                value={roles.map(r => ({ value: r.id, label: r.name })).find(o => o.value === data.role_id) || null}
                                onChange={(selected) => setData('role_id', selected?.value || '')}
                                placeholder="اختر الصلاحية..."
                                className={errors.role_id ? 'border-accent-300' : ''}
                            />
                            {errors.role_id && <p className="text-xs text-accent-500 mt-1">{errors.role_id}</p>}
                        </div>

                        {/* Branch (Admin Only) */}
                        {isAdmin && (
                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الفرع <span className="text-accent-500">*</span></label>
                                <SelectInput
                                    options={branches.map(b => ({ value: b.id, label: b.name }))}
                                    value={branches.map(b => ({ value: b.id, label: b.name })).find(o => o.value === data.branch_id) || null}
                                    onChange={(selected) => setData('branch_id', selected?.value || '')}
                                    placeholder="اختر الفرع..."
                                    className={errors.branch_id ? 'border-accent-300' : ''}
                                />
                                {errors.branch_id && <p className="text-xs text-accent-500 mt-1">{errors.branch_id}</p>}
                            </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center gap-3 pt-8">
                            <div className="relative flex items-center justify-center p-0.5 rounded-full overflow-hidden w-12 h-6 bg-slate-200 dark:bg-slate-700 cursor-pointer" onClick={() => setData('is_active', !data.is_active)}>
                                <div className={`absolute top-0 bottom-0 left-0 right-0 transition-colors duration-300 ${data.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                <div className={`absolute w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${data.is_active ? '-translate-x-3' : 'translate-x-3'}`} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-dark-900 dark:text-white">{data.is_active ? 'الحساب نشط' : 'الحساب معطل'}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">تفعيل أو إيقاف تسجيل دخول الموظف</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Employee Info Section */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-md shadow-slate-100/50 dark:shadow-none overflow-hidden">
                    <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
                        <h2 className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-2">
                            <Briefcase className="text-primary-500" size={20} /> البيانات الوظيفية والشخصية
                        </h2>
                    </div>
                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* National ID */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم البطاقة الشخصية (الهوية)</label>
                            <div className="relative">
                                <CreditCard size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input type="text" dir="ltr" placeholder="10XXXXXXXX"
                                    className={`w-full bg-white dark:bg-slate-900 border rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all ${errors.national_id ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                    value={data.national_id} onChange={e => setData('national_id', e.target.value)} />
                            </div>
                        </div>

                        {/* Job Title */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">المسمى الوظيفي (الوظيفة)</label>
                            <div className="relative">
                                <Award size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input type="text" placeholder="مثال: معلم لغة عربية، عامل نظافة"
                                    className={`w-full bg-white dark:bg-slate-900 border rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all ${errors.job_title ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                    value={data.job_title} onChange={e => setData('job_title', e.target.value)} />
                            </div>
                        </div>

                        {/* Specialization */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">التخصص</label>
                            <input type="text" placeholder="مثال: بكالوريوس لغة عربية"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                value={data.specialization} onChange={e => setData('specialization', e.target.value)} />
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">القسم</label>
                            <SelectInput
                                options={departments.map(d => ({ value: d.id, label: d.name }))}
                                value={departments.map(d => ({ value: d.id, label: d.name })).find(o => o.value === data.department_id) || null}
                                onChange={(selected) => setData('department_id', selected?.value || '')}
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
                                    setData(data => ({ ...data, job_grade_id: selected?.value || '', manager_id: '' }));
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
                                onChange={(selected) => setData('manager_id', selected?.value || '')}
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
                                onChange={(selectedDates, dateStr) => setData('hire_date', dateStr)}
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم الهاتف</label>
                            <input type="text" dir="ltr"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                value={data.phone} onChange={e => setData('phone', e.target.value)} />
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">عنوان السكن</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                                <textarea rows="2" placeholder="العنوان بالتفصيل"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                    value={data.address} onChange={e => setData('address', e.target.value)}></textarea>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 3. Shift & Attendance Section */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-md shadow-slate-100/50 dark:shadow-none overflow-hidden">
                    <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
                        <h2 className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-2">
                            <Clock className="text-primary-500" size={20} /> إعدادات الدوام والشفتات
                        </h2>
                    </div>
                    <div className="p-6 md:p-8 space-y-6">
                        {data.employee_shifts.map((shiftEntry, index) => (
                            <div key={index} className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl relative">
                                {data.employee_shifts.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newShifts = [...data.employee_shifts];
                                            newShifts.splice(index, 1);
                                            setData('employee_shifts', newShifts);
                                        }}
                                        className="absolute top-4 left-4 text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 p-2 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الشفت (فترة العمل) {index + 1}</label>
                                        <SelectInput
                                            options={shifts.map(s => ({ value: s.id, label: `${s.name} (${s.start_time} - ${s.end_time})` }))}
                                            value={shifts.map(s => ({ value: s.id, label: `${s.name} (${s.start_time} - ${s.end_time})` })).find(o => o.value === shiftEntry.shift_id) || null}
                                            onChange={(selected) => {
                                                const newShifts = [...data.employee_shifts];
                                                newShifts[index].shift_id = selected?.value || '';
                                                setData('employee_shifts', newShifts);
                                            }}
                                            placeholder="اختر الشفت المخصص للموظف..."
                                        />
                                        {errors[`employee_shifts.${index}.shift_id`] && <p className="text-xs text-accent-500 mt-2">{errors[`employee_shifts.${index}.shift_id`]}</p>}
                                    </div>

                                    {shiftEntry.shift_id && (
                                        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-3">أيام الدوام الرسمي <span className="text-accent-500">*</span></label>
                                            <div className="flex flex-wrap gap-2">
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
                                                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${isSelected ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'}`}
                                                        >
                                                            {day.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {errors[`employee_shifts.${index}.working_days`] && <p className="text-xs text-accent-500 mt-2">{errors[`employee_shifts.${index}.working_days`]}</p>}
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
                            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 px-4 py-2.5 rounded-xl transition-colors w-max"
                        >
                            + إضافة شفت آخر
                        </button>
                    </div>
                </div>

                {/* 4. Attachments Section */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-md shadow-slate-100/50 dark:shadow-none overflow-hidden">
                    <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
                        <h2 className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-2">
                            <Paperclip className="text-primary-500" size={20} /> المرفقات والصور
                        </h2>
                    </div>
                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Avatar */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الصورة الشخصية</label>
                            <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <ImageIcon size={32} className="mx-auto text-slate-400 mb-3" />
                                <p className="text-sm text-slate-500 mb-4">اسحب وأفلت الصورة هنا أو انقر للاختيار</p>
                                <input type="file" accept="image/*" onChange={e => setData('avatar', e.target.files[0])}
                                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                            </div>
                        </div>

                        {/* Documents */}
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">مرفقات (مؤهلات، هويات، عقود)</label>
                            <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <Paperclip size={32} className="mx-auto text-slate-400 mb-3" />
                                <p className="text-sm text-slate-500 mb-4">أرفق أي مستندات تخص الموظف (يمكن اختيار ملفات متعددة)</p>
                                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => setData('attachments', Array.from(e.target.files))}
                                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <Link href={route('hr.employees')} className="px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors">
                        إلغاء الأمر
                    </Link>
                    <button type="submit" disabled={processing} className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70">
                        <Save size={18} /> حفظ بيانات الموظف
                    </button>
                </div>

            </form>
        </AdminLayout>
    );
}
