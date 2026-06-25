import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { Calendar, Plus, Edit2, Trash2, X, Save, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';

export default function LeavesIndex({ leaves, employees, academicYears = [], leaveTypes = [], isAdmin, filters = {} }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);
    const [viewingLeave, setViewingLeave] = useState(null);

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

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            destroy(route('hr.leaves.destroy', id));
        }
    };

    const handleFilterChange = (key, value) => {
        router.get(route('hr.leaves.index'), { ...filters, [key]: value }, { preserveState: true, preserveScroll: true });
    };

    const stats = {
        total: leaves.length,
        approved: leaves.filter(l => l.status === 'approved').length,
        pending: leaves.filter(l => l.status === 'pending').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };


    const leaveStatuses = [
        { value: 'pending', label: 'قيد الانتظار' },
        { value: 'approved', label: 'موافق عليها' },
        { value: 'rejected', label: 'مرفوضة' },
    ];

    const StatusBadge = ({ status }) => {
        switch (status) {
            case 'approved': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle size={14}/> موافق عليها</span>;
            case 'rejected': return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><XCircle size={14}/> مرفوضة</span>;
            default: return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={14}/> قيد الانتظار</span>;
        }
    }

    return (
        <AdminLayout>
            <Head title="إجازات الموظفين" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">إجازات الموظفين</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">إدارة الأرصدة والطلبات والإجازات الممنوحة للموظفين</p>
                        </div>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-primary-500/20"
                    >
                        <Plus size={20} /> إضافة إجازة للموظف
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي الطلبات</p>
                            <h3 className="text-2xl font-black text-dark-900 dark:text-white mt-1">{stats.total}</h3>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">الموافق عليها</p>
                            <h3 className="text-2xl font-black text-emerald-500 mt-1">{stats.approved}</h3>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">قيد الانتظار</p>
                            <h3 className="text-2xl font-black text-amber-500 mt-1">{stats.pending}</h3>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">المرفوضة</p>
                            <h3 className="text-2xl font-black text-rose-500 mt-1">{stats.rejected}</h3>
                        </div>
                        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                            <XCircle size={24} />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <SelectInput
                            options={[
                                { value: '', label: 'جميع الموظفين' },
                                ...employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))
                            ]}
                            value={filters.employee_id || ''}
                            onChange={(val) => handleFilterChange('employee_id', val)}
                            placeholder="فلترة بالموظف..."
                        />
                    </div>
                    <div className="flex-1">
                        <SelectInput
                            options={[
                                { value: '', label: 'جميع الحالات' },
                                { value: 'pending', label: 'قيد الانتظار' },
                                { value: 'approved', label: 'موافق عليها' },
                                { value: 'rejected', label: 'مرفوضة' }
                            ]}
                            value={filters.status || ''}
                            onChange={(val) => handleFilterChange('status', val)}
                            placeholder="فلترة بالحالة..."
                        />
                    </div>
                </div>

                {/* List */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الموظف</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">نوع الإجازة</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">التاريخ (من - إلى)</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">السبب/البيان</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الحالة</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {leaves.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-slate-500">
                                            لا توجد إجازات مسجلة للموظفين حالياً.
                                        </td>
                                    </tr>
                                ) : (
                                    leaves.map((leave) => (
                                        <tr key={leave.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="py-4 px-6 font-bold text-dark-900 dark:text-white">
                                                {leave.employee?.user?.name || '-'}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                {leave.leave_type?.name || '-'}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-mono text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span>{new Date(leave.start_date).toLocaleDateString('ar-SA')}</span>
                                                    <span className="text-slate-400">-</span>
                                                    <span>{new Date(leave.end_date).toLocaleDateString('ar-SA')}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 text-sm max-w-xs truncate">
                                                {leave.reason || '-'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <StatusBadge status={leave.status} />
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setViewingLeave(leave)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">
                                                        <Eye size={16} />
                                                    </button>
                                                    {leave.status !== 'approved' ? (
                                                        <>
                                                            <button onClick={() => openModal(leave)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(leave.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1"><CheckCircle size={14} /> مقفلة</div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal}></div>
                        <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                                    <Clock className="text-primary-500" />
                                    {editingLeave ? 'تعديل إجازة الموظف' : 'تسجيل إجازة للموظف'}
                                </h3>
                                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الموظف <span className="text-accent-500">*</span></label>
                                    <SelectInput
                                        options={employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))}
                                        value={employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` })).find(o => o.value == data.employee_id) || null}
                                        onChange={(selected) => setData('employee_id', selected || '')}
                                        placeholder="ابحث عن الموظف..."
                                    />
                                    {errors.employee_id && <p className="text-xs text-accent-500 mt-1">{errors.employee_id}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">السنة الدراسية</label>
                                        <SelectInput
                                            options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                                            value={academicYears.map(y => ({ value: y.id, label: y.name })).find(o => o.value == data.academic_year_id) || null}
                                            onChange={(val) => {
                                                setData(prev => ({ ...prev, academic_year_id: val || '', semester_id: '' }));
                                            }}
                                            placeholder="اختر السنة الدراسية"
                                        />
                                        {errors.academic_year_id && <p className="text-xs text-accent-500 mt-1">{errors.academic_year_id}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الفصل الدراسي</label>
                                        <SelectInput
                                            options={(academicYears.find(y => y.id == data.academic_year_id)?.semesters || []).map(s => ({ value: s.id, label: s.name }))}
                                            value={(academicYears.find(y => y.id == data.academic_year_id)?.semesters || []).map(s => ({ value: s.id, label: s.name })).find(o => o.value == data.semester_id) || null}
                                            onChange={(val) => setData('semester_id', val || '')}
                                            placeholder="اختر الفصل الدراسي"
                                            disabled={!data.academic_year_id}
                                        />
                                        {errors.semester_id && <p className="text-xs text-accent-500 mt-1">{errors.semester_id}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">نوع الإجازة <span className="text-accent-500">*</span></label>
                                        <SelectInput
                                            options={leaveTypes.map(t => ({ value: t.id, label: t.name }))}
                                            value={leaveTypes.map(t => ({ value: t.id, label: t.name })).find(o => o.value == data.leave_type_id) || null}
                                            onChange={(val) => setData('leave_type_id', val || '')}
                                            placeholder="اختر النوع"
                                        />
                                        {errors.leave_type_id && <p className="text-xs text-accent-500 mt-1">{errors.leave_type_id}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">حالة الطلب <span className="text-accent-500">*</span></label>
                                        <SelectInput
                                            options={[
                                                {value: 'pending', label: 'قيد الانتظار'},
                                                {value: 'approved', label: 'مقبول'},
                                                {value: 'rejected', label: 'مرفوض'}
                                            ]}
                                            value={[
                                                {value: 'pending', label: 'قيد الانتظار'},
                                                {value: 'approved', label: 'مقبول'},
                                                {value: 'rejected', label: 'مرفوض'}
                                            ].find(o => o.value == data.status) || null}
                                            onChange={(selected) => setData('status', selected || '')}
                                            placeholder="اختر الحالة"
                                        />
                                        {errors.status && <p className="text-xs text-accent-500 mt-1">{errors.status}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">تاريخ البدء <span className="text-accent-500">*</span></label>
                                        <FlatpickrInput
                                            value={data.start_date}
                                            onChange={(dateStr) => setData('start_date', dateStr)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        />
                                        {errors.start_date && <p className="text-xs text-accent-500 mt-1">{errors.start_date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">تاريخ الانتهاء <span className="text-accent-500">*</span></label>
                                        <FlatpickrInput
                                            value={data.end_date}
                                            onChange={(dateStr) => setData('end_date', dateStr)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        />
                                        {errors.end_date && <p className="text-xs text-accent-500 mt-1">{errors.end_date}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">ملاحظات / السبب (اختياري)</label>
                                    <textarea
                                        rows="3"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        value={data.reason} onChange={e => setData('reason', e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <Save size={20} />
                                        {editingLeave ? 'حفظ التعديلات' : 'إضافة الإجازة'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Details Modal */}
                {viewingLeave && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setViewingLeave(null)}></div>
                        <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                                    <Eye className="text-primary-500" />
                                    تفاصيل الإجازة
                                </h3>
                                <button onClick={() => setViewingLeave(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">الموظف</p>
                                        <p className="font-bold text-slate-800 dark:text-white">{viewingLeave.employee?.user?.name || '-'}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">المسمى / الدرجة الوظيفية</p>
                                        <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            {viewingLeave.employee?.job_title || '-'}
                                            {viewingLeave.employee?.job_grade && (
                                                <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">{viewingLeave.employee.job_grade.name}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">نوع الإجازة</p>
                                        <p className="font-bold text-slate-800 dark:text-white">{viewingLeave.leave_type?.name || '-'}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">تاريخ البداية</p>
                                        <p className="font-bold text-slate-800 dark:text-white">{new Date(viewingLeave.start_date).toLocaleDateString('ar-SA')}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">تاريخ النهاية</p>
                                        <p className="font-bold text-slate-800 dark:text-white">{new Date(viewingLeave.end_date).toLocaleDateString('ar-SA')}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">الحالة</p>
                                        <p className="font-bold text-slate-800 dark:text-white"><StatusBadge status={viewingLeave.status} /></p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">عدد الأيام المطلوبة</p>
                                        <p className="font-bold text-slate-800 dark:text-white">
                                            {Math.ceil((new Date(viewingLeave.end_date) - new Date(viewingLeave.start_date)) / (1000 * 60 * 60 * 24)) + 1} أيام
                                        </p>
                                    </div>
                                </div>
                                {viewingLeave.reason && (
                                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">السبب / الملاحظات</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{viewingLeave.reason}</p>
                                    </div>
                                )}
                                
                                {viewingLeave.related_request ? (
                                    <div className="mt-4 p-4 border border-primary-200 dark:border-primary-500/20 bg-primary-50 dark:bg-primary-500/10 rounded-2xl space-y-4">
                                        <h4 className="font-bold text-primary-700 dark:text-primary-300 text-sm mb-2 border-b border-primary-200 dark:border-primary-500/20 pb-2">تمت إضافتها من خلال طلب موظف</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">تم الاعتماد بواسطة (المدير)</p>
                                                <p className="font-bold text-slate-800 dark:text-white">{viewingLeave.related_request.manager?.name || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">تاريخ الاعتماد</p>
                                                <p className="font-bold text-slate-800 dark:text-white">
                                                    {viewingLeave.related_request.reviewed_at ? new Date(viewingLeave.related_request.reviewed_at).toLocaleDateString('ar-SA') : '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            {viewingLeave.related_request.employee_signature_url && (
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">توقيع الموظف</p>
                                                    <img src={viewingLeave.related_request.employee_signature_url} className="h-16 bg-white border border-slate-200 dark:border-slate-700 rounded-xl p-1" alt="توقيع الموظف" />
                                                </div>
                                            )}
                                            {viewingLeave.related_request.manager_signature_url && (
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">توقيع المدير</p>
                                                    <img src={viewingLeave.related_request.manager_signature_url} className="h-16 bg-white border border-slate-200 dark:border-slate-700 rounded-xl p-1" alt="توقيع المدير" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl text-center">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">هذه الإجازة تمت إضافتها بشكل مباشر من قبل الإدارة (لا يوجد طلب مرتبط).</p>
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

