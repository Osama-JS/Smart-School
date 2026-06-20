import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Search, Filter, ShieldAlert, FileText, Send, CheckCircle, Trash2, Edit2, X, Save, RotateCcw, AlertTriangle, CalendarDays, Clock } from 'lucide-react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SelectInput from '@/Components/SelectInput';
import Textarea from '@/Components/Textarea';
import SignaturePad from '@/Components/SignaturePad';
import Pagination from '@/Components/Pagination';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function Index({ auth, violations, types, employees, filters, stats }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedViolation, setSelectedViolation] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        violation_type_id: '',
        violation_date: new Date().toISOString().split('T')[0],
        details: '',
        action_taken: '',
        attachment: null,
        admin_signature: null,
    });

    const notifyForm = useForm({
        channels: ['database'],
    });

    const [filterData, setFilterData] = useState({
        user_id: filters.user_id || '',
        violation_type_id: filters.violation_type_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const applyFilters = () => {
        router.get(route('hr.employee-violations.index'), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setFilterData({
            user_id: '',
            violation_type_id: '',
            start_date: '',
            end_date: ''
        });
        router.get(route('hr.employee-violations.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openModal = () => {
        reset();
        setIsModalOpen(true);
    };

    const handleTypeChange = (e) => {
        const typeId = e.target.value;
        setData('violation_type_id', typeId);
        
        const selectedType = types.find(t => t.id == typeId);
        if (selectedType && !data.action_taken) {
            setData('action_taken', selectedType.default_action);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('hr.employee-violations.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
            preserveScroll: true
        });
    };

    const openNotifyModal = (violation) => {
        setSelectedViolation(violation);
        notifyForm.reset();
        setIsNotifyModalOpen(true);
    };

    const sendNotify = (e) => {
        e.preventDefault();
        notifyForm.post(route('hr.employee-violations.notify', selectedViolation.id), {
            onSuccess: () => setIsNotifyModalOpen(false)
        });
    };

    const confirmDelete = (violation) => {
        setSelectedViolation(violation);
        setIsDeleteModalOpen(true);
    };

    const deleteViolation = () => {
        router.delete(route('hr.employee-violations.destroy', selectedViolation.id), {
            onSuccess: () => setIsDeleteModalOpen(false)
        });
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="مخالفات الموظفين" />

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
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
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <ShieldAlert size={28} className="text-primary-600" />
                                سجل المخالفات
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة مخالفات الموظفين وتسجيل الإجراءات</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={openModal}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>تسجيل مخالفة جديدة</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                                <FileText className="text-primary-500" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي المخالفات</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.total}</h4>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                                <CalendarDays className="text-rose-500" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">مخالفات هذا الشهر</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.this_month}</h4>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Clock className="text-amber-500" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">بانتظار توقيع الموظف</p>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.unsigned}</h4>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters Section */}
                <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                    
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={18} className="text-primary-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white">تصفية النتائج</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Employee Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="الموظف" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.user_id} 
                                onChange={val => setFilterData({...filterData, user_id: val})}
                                options={[
                                    { value: '', label: 'جميع الموظفين' },
                                    ...employees.map(emp => ({ value: emp.id, label: emp.name }))
                                ]}
                            />
                        </div>
                        
                        {/* Violation Type Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="نوع المخالفة" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.violation_type_id} 
                                onChange={val => setFilterData({...filterData, violation_type_id: val})}
                                options={[
                                    { value: '', label: 'جميع الأنواع' },
                                    ...types.map(t => ({ value: t.id, label: t.name }))
                                ]}
                            />
                        </div>

                        {/* Date From Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="من تاريخ" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <FlatpickrInput 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 !pl-10"
                                value={filterData.start_date}
                                onChange={val => setFilterData({...filterData, start_date: val})}
                                placeholder="اختر البداية..."
                            />
                        </div>

                        {/* Date To Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="إلى تاريخ" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <FlatpickrInput 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 !pl-10"
                                value={filterData.end_date}
                                onChange={val => setFilterData({...filterData, end_date: val})}
                                placeholder="اختر النهاية..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
                        <button 
                            onClick={applyFilters} 
                            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:shadow-primary-500/20 text-sm"
                        >
                            <Filter size={16} />
                            تطبيق الفرز
                        </button>
                        {(filterData.user_id || filterData.violation_type_id || filterData.start_date || filterData.end_date) && (
                            <button 
                                onClick={clearFilters} 
                                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"
                            >
                                <RotateCcw size={16} />
                                إعادة ضبط
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-full">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الموظف</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">التاريخ والنوع</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الإجراء المتخذ</th>
                                    <th className="py-4 px-6 text-center text-sm font-bold text-slate-500 dark:text-slate-400">توقيع الموظف</th>
                                    <th className="py-4 px-6 text-center text-sm font-bold text-slate-500 dark:text-slate-400">مرفقات</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {violations.data.length > 0 ? violations.data.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                            {v.user?.name}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                            <div>{v.violation_date}</div>
                                            <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">{v.violation_type?.name}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm text-slate-600 dark:text-slate-400">{v.action_taken}</div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {v.employee_signature ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                                    <CheckCircle size={14} />
                                                    موقّع
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => openNotifyModal(v)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 transition-colors"
                                                    title="إرسال طلب توقيع"
                                                >
                                                    <Send size={14} />
                                                    طلب توقيع
                                                </button>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {v.attachment_path ? (
                                                <a href={`/storage/${v.attachment_path}`} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
                                                    <FileText size={18} />
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => confirmDelete(v)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-slate-500">
                                            لا توجد مخالفات مسجلة.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {violations.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                            <Pagination links={violations.links} />
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ShieldAlert className="text-primary-500" />
                                تسجيل مخالفة جديدة
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">الموظف <span className="text-accent-500">*</span></label>
                                    <SelectInput
                                        className="w-full"
                                        value={data.user_id}
                                        onChange={(val) => setData('user_id', val)}
                                        options={employees.map(emp => ({ value: emp.id, label: emp.name }))}
                                        placeholder="-- اختر الموظف --"
                                        required
                                    />
                                    {errors.user_id && <p className="text-xs text-accent-500 mt-1">{errors.user_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">تاريخ المخالفة <span className="text-accent-500">*</span></label>
                                    <FlatpickrInput
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl py-3 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 !pl-10"
                                        value={data.violation_date}
                                        onChange={(val) => setData('violation_date', val)}
                                        required
                                    />
                                    {errors.violation_date && <p className="text-xs text-accent-500 mt-1">{errors.violation_date}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">نوع المخالفة <span className="text-accent-500">*</span></label>
                                    <SelectInput
                                        className="w-full"
                                        value={data.violation_type_id}
                                        onChange={(val) => {
                                            setData('violation_type_id', val);
                                            const selectedType = types.find(t => t.id === parseInt(val));
                                            if (selectedType && !data.action_taken) {
                                                setData(prev => ({
                                                    ...prev,
                                                    violation_type_id: val,
                                                    action_taken: selectedType.default_action || ''
                                                }));
                                            }
                                        }}
                                        options={types.map(t => ({ value: t.id, label: t.name }))}
                                        placeholder="-- اختر النوع --"
                                        required
                                    />
                                    {errors.violation_type_id && <p className="text-xs text-accent-500 mt-1">{errors.violation_type_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">الإجراء المتخذ <span className="text-accent-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        value={data.action_taken}
                                        onChange={(e) => setData('action_taken', e.target.value)}
                                        required
                                    />
                                    {errors.action_taken && <p className="text-xs text-accent-500 mt-1">{errors.action_taken}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">التفاصيل <span className="text-accent-500">*</span></label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                    value={data.details}
                                    onChange={(e) => setData('details', e.target.value)}
                                    rows="3"
                                    required
                                />
                                {errors.details && <p className="text-xs text-accent-500 mt-1">{errors.details}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">مرفقات (تعهد، تقرير...)</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <div className="space-y-1 text-center">
                                        <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                                            <label htmlFor="attachment" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                                <span>اختر ملفاً</span>
                                                <input id="attachment" name="attachment" type="file" className="sr-only" onChange={e => setData('attachment', e.target.files[0])} />
                                            </label>
                                            <p className="pr-1">أو اسحب وأفلت الملف هنا</p>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, PDF حتى 5MB</p>
                                    </div>
                                </div>
                                {errors.attachment && <p className="text-xs text-accent-500 mt-1">{errors.attachment}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">توقيع المسؤول الإداري</label>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
                                    <SignaturePad 
                                        onChange={(val) => setData('admin_signature', val)} 
                                        error={errors.admin_signature}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Save size={20} />
                                    حفظ واعتماد المخالفة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notify Modal */}
            {isNotifyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsNotifyModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-6">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mb-4">
                            <Send size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">إرسال طلب توقيع</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                            سيتم إرسال إشعار للموظف <span className="font-bold text-slate-900 dark:text-white">{selectedViolation?.user?.name}</span> يطلب منه الدخول إلى حسابه والتوقيع على المخالفة.
                        </p>

                        <form onSubmit={sendNotify} className="space-y-4">
                            <div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">قنوات الإرسال:</span>
                                <div className="mt-3 space-y-3">
                                    <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-slate-300 text-primary-600 shadow-sm focus:ring-primary-500"
                                            checked={notifyForm.data.channels.includes('database')}
                                            onChange={(e) => {
                                                const channels = [...notifyForm.data.channels];
                                                if (e.target.checked) channels.push('database');
                                                else channels.splice(channels.indexOf('database'), 1);
                                                notifyForm.setData('channels', channels);
                                            }}
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">إشعار داخل النظام (In-App)</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-slate-300 text-primary-600 shadow-sm focus:ring-primary-500"
                                            checked={notifyForm.data.channels.includes('mail')}
                                            onChange={(e) => {
                                                const channels = [...notifyForm.data.channels];
                                                if (e.target.checked) channels.push('mail');
                                                else channels.splice(channels.indexOf('mail'), 1);
                                                notifyForm.setData('channels', channels);
                                            }}
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">بريد إلكتروني (Email)</span>
                                    </label>
                                </div>
                                {notifyForm.errors.channels && <p className="text-xs text-accent-500 mt-2">{notifyForm.errors.channels}</p>}
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="submit"
                                    disabled={notifyForm.processing}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                    إرسال الطلب
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsNotifyModalOpen(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            هل أنت متأكد من رغبتك في حذف هذه المخالفة؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={deleteViolation}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all"
                            >
                                حذف نهائياً
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                            >
                                تراجع
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}
