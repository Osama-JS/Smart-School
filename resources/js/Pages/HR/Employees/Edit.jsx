import React, { useState } from 'react';
import { Head, router, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { ArrowRight, Save, User, Lock, Store, Eye, EyeOff, UserCheck, Phone, Mail, MapPin, Briefcase, Award, CreditCard, Image as ImageIcon, Paperclip, FileText, Trash2, Clock, CalendarDays, Shield } from 'lucide-react';

export default function EmployeesEdit({ employee, departments, jobGrades, roles, branches = [], isAdmin = false, managerCandidates = [], shifts = [] }) {
    const initialEmployeeShifts = employee.shifts && employee.shifts.length > 0
        ? employee.shifts.map(s => ({
            shift_id: s.id,
            working_days: s.pivot && s.pivot.working_days ? JSON.parse(s.pivot.working_days) : [0, 1, 2, 3, 4]
        }))
        : [{ shift_id: '', working_days: [0, 1, 2, 3, 4] }];

    const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'account'
    const [showPassword, setShowPassword] = useState(false);

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
        attachments: [],

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

    return (
        <AdminLayout activeMenu="دليل الموظفين">
            <Head title={`تعديل بيانات الموظف | ${employee.user?.name}`} />

            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href={route('hr.employees')} className="text-slate-400 hover:text-primary-600 transition-colors p-1.5 rounded-xl hover:bg-slate-100">
                                <ArrowRight size={20} />
                            </Link>
                            <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">تعديل ملف الموظف</h1>
                        </div>
                        <p className="text-primary-700/80 dark:text-primary-300/80 text-sm font-semibold pr-10">{employee.user?.name}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Tabs */}
                <div className="flex flex-wrap p-1 gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab('personal')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <User size={18} /> البيانات الشخصية
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('job')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'job' ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Briefcase size={18} /> البيانات الوظيفية
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('attendance')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'attendance' ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Clock size={18} /> الدوام والشفتات
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('attachments')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'attachments' ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Paperclip size={18} /> المرفقات
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('account')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'account' ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Shield size={18} /> بيانات الحساب
                    </button>
                </div>

                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-md shadow-slate-100/50 dark:shadow-none overflow-hidden">
                    {/* Tab Content: Personal */}
                    {activeTab === 'personal' && (
                        <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الاسم الرباعي <span className="text-accent-500">*</span></label>
                                    <input type="text" required
                                        className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-2xl px-4 py-3 text-sm outline-none transition-all ${errors.name ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                        value={data.name} onChange={e => setData('name', e.target.value)} />
                                </div>

                                {/* National ID */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم البطاقة الشخصية (الهوية)</label>
                                    <input type="text" dir="ltr"
                                        className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-2xl px-4 py-3 text-sm outline-none transition-all ${errors.national_id ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                        value={data.national_id} onChange={e => setData('national_id', e.target.value)} />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم الهاتف</label>
                                    <input type="text" dir="ltr"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        value={data.phone} onChange={e => setData('phone', e.target.value)} />
                                </div>

                                {/* Address */}
                                <div>
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
                    )}

                    {/* Tab Content: Job Data */}
                    {activeTab === 'job' && (
                        <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Job Title */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">المسمى الوظيفي (الوظيفة)</label>
                                    <input type="text"
                                        className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-2xl px-4 py-3 text-sm outline-none transition-all ${errors.job_title ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                        value={data.job_title} onChange={e => setData('job_title', e.target.value)} />
                                </div>

                                {/* Specialization */}
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">التخصص</label>
                                    <input type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        value={data.specialization} onChange={e => setData('specialization', e.target.value)} />
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
                        <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <div className="space-y-6 pt-4">
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
                                                            newShifts[index].shift_id = selected || '';
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
                                                        <p className="text-xs text-slate-500 mt-3">الأيام غير المحددة ستُعتبر أيام راحة (إجازة أسبوعية) ولن يُحسب فيها غياب.</p>
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
                        </div>
                    )}

                    {/* Tab Content: Attachments */}
                    {activeTab === 'attachments' && (
                        <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Upload New Attachments */}
                                    <div className="animate-in slide-in-from-right-4 fade-in duration-500">
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">إضافة مرفقات جديدة</label>
                                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 group hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-primary-500/5 dark:bg-primary-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out pointer-events-none" />
                                            <div className="relative z-10 w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:animate-pulse transition-all duration-300 group-hover:border-primary-200 dark:group-hover:border-primary-800">
                                                <Paperclip size={28} className="text-primary-500 transform group-hover:-rotate-12 transition-transform duration-300" />
                                            </div>
                                            <p className="relative z-10 text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">اسحب وأفلت الملفات هنا</p>
                                            <p className="relative z-10 text-xs text-slate-500 mb-5">أو انقر لاختيار الملفات (PDF, DOC, JPG...)</p>
                                            <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => setData('attachments', Array.from(e.target.files))}
                                                className="relative z-10 text-sm text-slate-500 file:cursor-pointer file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors file:transition-colors" />
                                        </div>
                                    </div>

                                    {/* Existing Attachments */}
                                    <div className="animate-in slide-in-from-left-4 fade-in duration-500 delay-150 fill-mode-both">
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">المرفقات الحالية ({employee.attachments?.length || 0})</label>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 h-full min-h-[160px] relative">
                                            {employee.attachments && employee.attachments.length > 0 ? (
                                                <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {employee.attachments.map((att, i) => {
                                                        const isImage = att.match(/\.(jpeg|jpg|gif|png)$/) != null;
                                                        return (
                                                            <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${isImage ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'}`}>
                                                                        {isImage ? <ImageIcon size={20} className="group-hover:animate-pulse" /> : <FileText size={20} className="group-hover:animate-pulse" />}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <a href={`/storage/${att}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 truncate block transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-primary-500 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-right">
                                                                            مرفق {i+1}
                                                                        </a>
                                                                        <span className="text-xs text-slate-400 font-mono inline-block transform group-hover:translate-x-1 transition-transform">{att.split('/').pop()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 animate-pulse">
                                                    <FileText size={36} className="text-slate-300 dark:text-slate-600 mb-3" />
                                                    <p className="text-sm font-bold text-slate-500">لا توجد مرفقات محفوظة لهذا الموظف</p>
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
                        <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="w-full md:w-1/3 flex flex-col items-center justify-start border-b md:border-b-0 md:border-l border-slate-100 dark:border-slate-800 pb-8 md:pb-0 md:pl-8">
                                    <div className="relative mb-4">
                                        {employee.user?.avatar ? (
                                            <img src={`/storage/${employee.user.avatar}`} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md" />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center">
                                                <User size={40} className="text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">تحديث الصورة الشخصية</label>
                                    <input type="file" accept="image/*" onChange={e => setData('avatar', e.target.files[0])}
                                        className="text-xs w-full text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                                </div>

                                <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Username */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم المستخدم <span className="text-accent-500">*</span></label>
                                        <input type="text" required dir="ltr"
                                            className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-2xl px-4 py-3 text-sm outline-none transition-all ${errors.username ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                            value={data.username} onChange={e => setData('username', e.target.value)} />
                                        {errors.username && <p className="text-xs text-accent-500 mt-1">{errors.username}</p>}
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">تغيير كلمة المرور</label>
                                        <div className="relative">
                                            <input type={showPassword ? "text" : "password"} minLength="8" dir="ltr" placeholder="أدخل للغيير أو اترك فارغاً"
                                                className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-2xl pr-4 pl-12 py-3 text-sm outline-none transition-all ${errors.password ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                                value={data.password} onChange={e => setData('password', e.target.value)} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">البريد الإلكتروني</label>
                                        <input type="email" dir="ltr"
                                            className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-2xl px-4 py-3 text-sm outline-none transition-all ${errors.email ? 'border-accent-300' : 'border-slate-200 dark:border-slate-700 focus:border-primary-400'}`}
                                            value={data.email} onChange={e => setData('email', e.target.value)} />
                                    </div>

                                    {/* Role */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الصلاحية <span className="text-accent-500">*</span></label>
                                        <SelectInput
                                            options={roles.map(r => ({ value: r.id, label: r.name }))}
                                            value={roles.map(r => ({ value: r.id, label: r.name })).find(o => o.value === data.role_id) || null}
                                            onChange={(selected) => setData('role_id', selected || '')}
                                            placeholder="اختر الصلاحية..."
                                            className={errors.role_id ? 'border-accent-300' : ''}
                                        />
                                    </div>

                                    {/* Branch (Admin Only) */}
                                    {isAdmin && (
                                        <div>
                                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الفرع <span className="text-accent-500">*</span></label>
                                            <SelectInput
                                                options={branches.map(b => ({ value: b.id, label: b.name }))}
                                                value={branches.map(b => ({ value: b.id, label: b.name })).find(o => o.value === data.branch_id) || null}
                                                onChange={(selected) => setData('branch_id', selected || '')}
                                                placeholder="اختر الفرع..."
                                            />
                                        </div>
                                    )}

                                    {/* Status */}
                                    <div className="flex items-center gap-3 pt-6 md:col-span-2">
                                        <div className="relative flex items-center justify-center p-0.5 rounded-full overflow-hidden w-12 h-6 bg-slate-200 dark:bg-slate-700 cursor-pointer" onClick={() => setData('is_active', !data.is_active)}>
                                            <div className={`absolute top-0 bottom-0 left-0 right-0 transition-colors duration-300 ${data.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                            <div className={`absolute w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${data.is_active ? '-translate-x-3' : 'translate-x-3'}`} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-dark-900 dark:text-white">{data.is_active ? 'الحساب نشط' : 'الحساب معطل'}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <Link href={route('hr.employees')} className="px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors">
                        إلغاء الأمر
                    </Link>
                    <button type="submit" disabled={processing} className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70">
                        <Save size={18} /> حفظ التعديلات
                    </button>
                </div>

            </form>
        </AdminLayout>
    );
}

