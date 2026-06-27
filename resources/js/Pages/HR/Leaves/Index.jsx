import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { Calendar, Plus, Edit2, Trash2, X, Save, Clock, CheckCircle, XCircle, Eye, AlertCircle, FileText, User, Tag, ShieldAlert, FolderOpen, Filter, CheckCircle2, AlignLeft, LayoutGrid, Table2, MoreVertical, RotateCcw } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import InputLabel from '@/Components/InputLabel';

export default function LeavesIndex({ leaves, employees, academicYears = [], leaveTypes = [], isAdmin, filters = {} }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);
    const [viewingLeave, setViewingLeave] = useState(null);
    const [leaveToDelete, setLeaveToDelete] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        employee_id: '',
        academic_year_id: '',
        semester_id: '',
        leave_type_id: '',
        start_date: '',
        end_date: '',
        status: 'pending',
        reason: '',
    });

    const openModal = (leave = null) => {
        if (leave) {
            setEditingLeave(leave);
            setData({
                employee_id: leave.employee_id,
                academic_year_id: leave.academic_year_id || '',
                semester_id: leave.semester_id || '',
                leave_type_id: leave.leave_type_id,
                start_date: leave.start_date,
                end_date: leave.end_date,
                status: leave.status,
                reason: leave.reason || '',
            });
        } else {
            setEditingLeave(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLeave(null);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingLeave) {
            put(route('hr.leaves.update', editingLeave.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('hr.leaves.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDelete = (leave) => {
        setLeaveToDelete(leave);
        setIsDeleteModalOpen(true);
    };

    const deleteLeave = () => {
        destroy(route('hr.leaves.destroy', leaveToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setLeaveToDelete(null);
            }
        });
    };

    const [filterData, setFilterData] = useState({
        employee_id: filters.employee_id || '',
        leave_type_id: filters.leave_type_id || '',
        status: filters.status || '',
        academic_year_id: filters.academic_year_id || '',
        semester_id: filters.semester_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const applyFilters = () => {
        router.get(route('hr.leaves'), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setFilterData({
            employee_id: '',
            leave_type_id: '',
            status: '',
            academic_year_id: '',
            semester_id: '',
            start_date: '',
            end_date: ''
        });
        router.get(route('hr.leaves'), {
            employee_id: '',
            leave_type_id: '',
            status: '',
            academic_year_id: '',
            semester_id: '',
            start_date: '',
            end_date: ''
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const stats = {
        total: leaves.length,
        approved: leaves.filter(l => l.status === 'approved').length,
        pending: leaves.filter(l => l.status === 'pending').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };

    const StatusBadge = ({ status }) => {
        switch (status) {
            case 'approved': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1 w-max dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"><CheckCircle size={14}/> موافق عليها</span>;
            case 'rejected': return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold flex items-center gap-1 w-max dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"><XCircle size={14}/> مرفوضة</span>;
            default: return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-max dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"><Clock size={14}/> قيد الانتظار</span>;
        }
    }

    return (
        <AdminLayout>
            <Head title="إجازات الموظفين" />

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
                                <Clock size={28} className="text-primary-600" />
                                إجازات الموظفين
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة الأرصدة والطلبات والإجازات الممنوحة للموظفين بشكل احترافي</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>إضافة إجازة لموظف</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <div className="bg-white dark:bg-[#121820]/60 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <FileText className="text-indigo-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الطلبات</p>
                            <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.total}</h4>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-[#121820]/60 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="text-emerald-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الموافق عليها</p>
                            <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.approved}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Clock className="text-amber-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">قيد الانتظار</p>
                            <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.pending}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                            <XCircle className="text-rose-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">المرفوضة</p>
                            <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.rejected}</h4>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden mb-6">
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
                                value={filterData.employee_id} 
                                onChange={val => setFilterData({...filterData, employee_id: val})}
                                options={[
                                    { value: '', label: 'جميع الموظفين' },
                                    ...employees.map(emp => ({ value: emp.id, label: `${emp.first_name} ${emp.last_name}` }))
                                ]}
                            />
                        </div>
                        
                        {/* Leave Type Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="نوع الإجازة" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.leave_type_id} 
                                onChange={val => setFilterData({...filterData, leave_type_id: val})}
                                options={[
                                    { value: '', label: 'جميع أنواع الإجازات' },
                                    ...leaveTypes.map(t => ({ value: t.id, label: t.name }))
                                ]}
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="حالة الطلب" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.status} 
                                onChange={val => setFilterData({...filterData, status: val})}
                                options={[
                                    { value: '', label: 'جميع الحالات' },
                                    { value: 'pending', label: 'قيد الانتظار' },
                                    { value: 'approved', label: 'موافق عليها' },
                                    { value: 'rejected', label: 'مرفوضة' }
                                ]}
                            />
                        </div>

                        {/* Academic Year Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="السنة الدراسية" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.academic_year_id} 
                                onChange={val => setFilterData({...filterData, academic_year_id: val, semester_id: ''})}
                                options={[
                                    { value: '', label: 'جميع السنوات الدراسية' },
                                    ...academicYears.map(y => ({ value: y.id, label: y.name }))
                                ]}
                            />
                        </div>

                        {/* Semester Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="الفصل الدراسي" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.semester_id} 
                                onChange={val => setFilterData({...filterData, semester_id: val})}
                                options={[
                                    { value: '', label: 'جميع الفصول الدراسية' },
                                    ...(academicYears.find(y => y.id == filterData.academic_year_id)?.semesters || []).map(s => ({ value: s.id, label: s.name }))
                                ]}
                                disabled={!filterData.academic_year_id}
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
                        {(filterData.employee_id || filterData.leave_type_id || filterData.status || filterData.academic_year_id || filterData.semester_id || filterData.start_date || filterData.end_date) && (
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

                {/* Content */}
                {leaves.length === 0 ? (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-primary-50 dark:bg-primary-500/10 text-primary-400 dark:text-primary-500 rounded-full flex items-center justify-center mb-4">
                                <FolderOpen size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">لا توجد إجازات حالياً</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">لم يتم تسجيل أي إجازات للموظفين بناءً على الفلاتر المحددة. يمكنك إضافة إجازة جديدة من الزر بالأعلى.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الموظف</th>
                                        <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">نوع الإجازة</th>
                                        <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">المدة والتاريخ</th>
                                        <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">السبب/البيان</th>
                                        <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الحالة</th>
                                        <th className="py-4 px-6 text-center text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {leaves.map((leave) => (
                                        <tr key={leave.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-[#121820] flex items-center justify-center font-bold text-sm shadow-sm">
                                                        {leave.employee?.user?.name ? leave.employee.user.name.charAt(0) : '?'}
                                                    </div>
                                                    <div>
                                                        <span className="block font-black text-slate-800 dark:text-white text-sm">{leave.employee?.user?.name || '-'}</span>
                                                        <span className="block text-xs font-semibold text-slate-500">{leave.employee?.job_title || 'موظف'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-100/50 dark:border-transparent">
                                                    <Tag size={13} />
                                                    {leave.leave_type?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300 text-sm">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={13} className="text-primary-500 shrink-0" />
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            {new Date(leave.start_date).toLocaleDateString('ar-SA')}
                                                            <span className="mx-1 text-slate-400 font-normal">إلى</span>
                                                            {new Date(leave.end_date).toLocaleDateString('ar-SA')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                                        <Clock size={12} /> 
                                                        المدة: {Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1} أيام
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 text-sm max-w-[150px] truncate font-medium">
                                                {leave.reason || '-'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <StatusBadge status={leave.status} />
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => setViewingLeave(leave)} className="p-2 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-all shadow-sm" title="عرض التفاصيل">
                                                        <Eye size={15} />
                                                    </button>
                                                    {leave.status !== 'approved' ? (
                                                        <>
                                                            <button onClick={() => openModal(leave)} className="p-2 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all shadow-sm" title="تعديل">
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button onClick={() => confirmDelete(leave)} className="p-2 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all shadow-sm" title="حذف">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="p-2 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 shadow-sm" title="مقفلة">
                                                            <CheckCircle size={15} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Add/Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
                        <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                            
                            <div className="relative p-6 sm:p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white tracking-tight">
                                                {editingLeave ? 'تعديل إجازة الموظف' : 'تسجيل إجازة جديدة لموظف'}
                                            </h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">
                                                {editingLeave ? 'تحديث بيانات الإجازة المحددة' : 'أدخل تفاصيل ونوع وتواريخ الإجازة لاعتمادها في النظام'}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={closeModal} 
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                                <form onSubmit={submit} className="space-y-6" id="leaveForm">
                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                        <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                            <User size={16} className="text-primary-500" />
                                            الموظف <span className="text-rose-500">*</span>
                                        </label>
                                        <SelectInput
                                            className="w-full"
                                            options={employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))}
                                            value={data.employee_id}
                                            onChange={(selected) => setData('employee_id', selected || '')}
                                            placeholder="ابحث عن الموظف..."
                                        />
                                        {errors.employee_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.employee_id}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <Calendar size={16} className="text-primary-500" />
                                                السنة الدراسية
                                            </label>
                                            <SelectInput
                                                className="w-full"
                                                options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                                                value={data.academic_year_id}
                                                onChange={(val) => {
                                                    setData(prev => ({ ...prev, academic_year_id: val || '', semester_id: '' }));
                                                }}
                                                placeholder="اختر السنة الدراسية"
                                            />
                                            {errors.academic_year_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.academic_year_id}</p>}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <FileText size={16} className="text-primary-500" />
                                                الفصل الدراسي
                                            </label>
                                            <SelectInput
                                                className="w-full"
                                                options={(academicYears.find(y => y.id == data.academic_year_id)?.semesters || []).map(s => ({ value: s.id, label: s.name }))}
                                                value={data.semester_id}
                                                onChange={(val) => setData('semester_id', val || '')}
                                                placeholder="اختر الفصل الدراسي"
                                                disabled={!data.academic_year_id}
                                            />
                                            {errors.semester_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.semester_id}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <Tag size={16} className="text-primary-500" />
                                                نوع الإجازة <span className="text-rose-500">*</span>
                                            </label>
                                            <SelectInput
                                                className="w-full"
                                                options={leaveTypes.map(t => ({ value: t.id, label: t.name }))}
                                                value={data.leave_type_id}
                                                onChange={(val) => setData('leave_type_id', val || '')}
                                                placeholder="اختر النوع"
                                            />
                                            {errors.leave_type_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.leave_type_id}</p>}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <AlertCircle size={16} className="text-primary-500" />
                                                حالة الطلب <span className="text-rose-500">*</span>
                                            </label>
                                            <SelectInput
                                                className="w-full"
                                                options={[
                                                    {value: 'pending', label: 'قيد الانتظار'},
                                                    {value: 'approved', label: 'مقبول'},
                                                    {value: 'rejected', label: 'مرفوض'}
                                                ]}
                                                value={data.status}
                                                onChange={(selected) => setData('status', selected || '')}
                                                placeholder="اختر الحالة"
                                            />
                                            {errors.status && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.status}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <Calendar size={16} className="text-primary-500" />
                                                تاريخ البدء <span className="text-rose-500">*</span>
                                            </label>
                                            <FlatpickrInput
                                                value={data.start_date}
                                                onChange={(dateStr) => setData('start_date', dateStr)}
                                                className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                            />
                                            {errors.start_date && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.start_date}</p>}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <Calendar size={16} className="text-primary-500" />
                                                تاريخ الانتهاء <span className="text-rose-500">*</span>
                                            </label>
                                            <FlatpickrInput
                                                value={data.end_date}
                                                onChange={(dateStr) => setData('end_date', dateStr)}
                                                className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                            />
                                            {errors.end_date && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.end_date}</p>}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                        <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                            <AlignLeft size={16} className="text-primary-500" />
                                            ملاحظات / السبب (اختياري)
                                        </label>
                                        <textarea
                                            rows="3"
                                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                            value={data.reason} 
                                            onChange={e => setData('reason', e.target.value)}
                                            placeholder="اكتب سبب طلب الإجازة هنا..."
                                        ></textarea>
                                    </div>
                                </form>
                            </div>
                            
                            {/* Modal Footer */}
                            <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-3">
                                <button
                                    type="submit"
                                    form="leaveForm"
                                    disabled={processing}
                                    className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98]"
                                >
                                    <Save size={20} />
                                    {editingLeave ? 'حفظ التعديلات' : 'إضافة الإجازة'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="sm:w-1/3 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Details Clean UI/UX Modal */}
                {viewingLeave && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setViewingLeave(null)}></div>
                        
                        <div className="relative bg-white dark:bg-[#121820] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                            
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">تفاصيل الإجازة</h3>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono mt-0.5">REF: L-{viewingLeave.id.toString().padStart(5, '0')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="طباعة">
                                        <FileText size={20} />
                                    </button>
                                    <button onClick={() => setViewingLeave(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="إغلاق">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="space-y-8">
                                    
                                    {/* Employee Profile & Status */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300 ring-4 ring-slate-50 dark:ring-slate-800/50">
                                                {viewingLeave.employee?.user?.name ? viewingLeave.employee.user.name.charAt(0) : '?'}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{viewingLeave.employee?.user?.name || '-'}</h4>
                                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                    <span>{viewingLeave.employee?.job_title || 'موظف'}</span>
                                                    {viewingLeave.employee?.job_grade && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                            <span className="font-semibold">{viewingLeave.employee.job_grade.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0">
                                            <StatusBadge status={viewingLeave.status} />
                                        </div>
                                    </div>

                                    {/* Leave Info Grid */}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <AlertCircle size={16} className="text-primary-500" />
                                            بيانات الطلب
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">نوع الإجازة</span>
                                                <span className="block text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                    <Tag size={14} className="text-primary-500" />
                                                    {viewingLeave.leave_type?.name || '-'}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">المدة</span>
                                                <span className="block text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                    <Clock size={14} className="text-primary-500" />
                                                    {Math.ceil((new Date(viewingLeave.end_date) - new Date(viewingLeave.start_date)) / (1000 * 60 * 60 * 24)) + 1} أيام
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">تاريخ البدء</span>
                                                <span className="block text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-primary-500" />
                                                    {new Date(viewingLeave.start_date).toLocaleDateString('ar-SA')}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">تاريخ الانتهاء</span>
                                                <span className="block text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-primary-500" />
                                                    {new Date(viewingLeave.end_date).toLocaleDateString('ar-SA')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    {viewingLeave.reason && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                                <AlignLeft size={16} className="text-primary-500" />
                                                الملاحظات والسبب
                                            </h4>
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border-r-4 border-r-primary-500 border border-slate-100 dark:border-slate-700/50 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                                {viewingLeave.reason}
                                            </div>
                                        </div>
                                    )}

                                    {/* Workflow & Signatures */}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <ShieldAlert size={16} className="text-primary-500" />
                                            الاعتماد والتوثيق
                                        </h4>
                                        
                                        {viewingLeave.related_request ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Employee */}
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-between">
                                                    <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400">
                                                        <User size={16} />
                                                        <span className="text-xs font-bold uppercase tracking-wider">توقيع مقدم الطلب</span>
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-center min-h-[60px]">
                                                        {viewingLeave.related_request.employee_signature_url ? (
                                                            <img src={viewingLeave.related_request.employee_signature_url} className="max-h-12 object-contain opacity-70 mix-blend-multiply dark:mix-blend-normal" alt="توقيع الموظف" />
                                                        ) : (
                                                            <span className="text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">غير متوفر</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Manager */}
                                                <div className="border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle2 size={16} />
                                                            <span className="text-xs font-bold uppercase tracking-wider">اعتماد الإدارة</span>
                                                        </div>
                                                        {viewingLeave.related_request.reviewed_at && (
                                                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                                                                {new Date(viewingLeave.related_request.reviewed_at).toLocaleDateString('ar-SA')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-center min-h-[60px]">
                                                        {viewingLeave.related_request.manager_signature_url ? (
                                                            <div className="text-center">
                                                                <img src={viewingLeave.related_request.manager_signature_url} className="max-h-12 mx-auto object-contain opacity-70 mix-blend-multiply dark:mix-blend-normal mb-1" alt="توقيع المدير" />
                                                                <span className="text-[10px] text-emerald-600/80 font-medium">{viewingLeave.related_request.manager?.name}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-bold text-sm bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                                                                <CheckCircle size={16} />
                                                                معتمد إلكترونياً
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0 shadow-sm border border-slate-100 dark:border-slate-600">
                                                    <AlertCircle size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-700 dark:text-slate-300 text-sm">مسجلة بواسطة الإدارة</h5>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تم إضافة هذه الإجازة مباشرة للموظف، ولا يوجد طلب أو توقيع مرتبط بها.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end">
                                <button
                                    onClick={() => setViewingLeave(null)}
                                    className="px-6 py-2.5 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all active:scale-[0.98] text-sm shadow-sm"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col">
                            <div className="p-8 text-center flex-1">
                                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Trash2 size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-dark-900 dark:text-white mb-3">تأكيد الحذف</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                                    هل أنت متأكد من رغبتك في حذف إجازة الموظف المحددة؟ 
                                    <br/>سيتم إرجاع الأرصدة المستقطعة للموظف ولا يمكن التراجع عن هذا الإجراء.
                                </p>
                            </div>
                            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={deleteLeave}
                                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-xl font-bold transition-all shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    نعم، احذف الإجازة
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="sm:w-1/3 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
