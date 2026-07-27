import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Clock, Plus, Edit, Trash2, Save, X, Coffee, BookOpen, Table2, List, Filter, Users, FolderKanban } from 'lucide-react';
import Swal from 'sweetalert2';
import Modal from '@/Components/Modal';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';

export default function PeriodsIndex({ periods, groups, sections }) {
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    
    const [editingPeriod, setEditingPeriod] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);
    
    const [viewMode, setViewMode] = useState('timeline');
    const [activeGroupId, setActiveGroupId] = useState(null); // null means "All / General"

    // Form for Period
    const periodForm = useForm({
        period_name: '',
        start_time: '',
        end_time: '',
        timetable_group_id: '',
        is_break: false,
    });

    // Form for Group
    const groupForm = useForm({
        name: '',
        grade_ids: [],
    });

    // ---- Group Modal Handlers ----
    const openGroupModal = (group = null) => {
        groupForm.clearErrors();
        if (group) {
            setEditingGroup(group);
            groupForm.setData({
                name: group.name,
                grade_ids: group.grades ? group.grades.map(g => g.id) : [],
            });
        } else {
            setEditingGroup(null);
            groupForm.setData({
                name: '',
                grade_ids: [],
            });
        }
        setIsGroupModalOpen(true);
    };

    const closeGroupModal = () => {
        setIsGroupModalOpen(false);
        setTimeout(() => groupForm.reset(), 300);
    };

    const handleGroupSubmit = (e) => {
        e.preventDefault();
        if (editingGroup) {
            groupForm.put(route('academic.timetable-groups.update', editingGroup.id), {
                onSuccess: () => closeGroupModal(),
            });
        } else {
            groupForm.post(route('academic.timetable-groups.store'), {
                onSuccess: () => closeGroupModal(),
            });
        }
    };

    const handleDeleteGroup = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "سيتم حذف المجموعة مع جميع الحصص المرتبطة بها!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('academic.timetable-groups.destroy', id), {
                    preserveScroll: true
                });
            }
        });
    };

    // ---- Period Modal Handlers ----
    const openPeriodModal = (period = null) => {
        periodForm.clearErrors();
        if (period) {
            setEditingPeriod(period);
            periodForm.setData({
                period_name: period.period_name,
                start_time: period.start_time.substring(0, 5),
                end_time: period.end_time.substring(0, 5),
                timetable_group_id: period.timetable_group_id || '',
                is_break: period.is_break,
            });
        } else {
            setEditingPeriod(null);
            periodForm.setData({
                period_name: '',
                start_time: '',
                end_time: '',
                timetable_group_id: activeGroupId || '',
                is_break: false,
            });
        }
        setIsPeriodModalOpen(true);
    };

    const closePeriodModal = () => {
        setIsPeriodModalOpen(false);
        setTimeout(() => periodForm.reset(), 300);
    };

    const handlePeriodSubmit = (e) => {
        e.preventDefault();
        if (editingPeriod) {
            periodForm.put(route('academic.periods.update', editingPeriod.id), {
                onSuccess: () => closePeriodModal(),
            });
        } else {
            periodForm.post(route('academic.periods.store'), {
                onSuccess: () => closePeriodModal(),
            });
        }
    };

    const handleDeletePeriod = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من التراجع عن الحذف! سيتأثر الجدول الدراسي المرتبط بهذه الحصة.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('academic.periods.destroy', id), {
                    preserveScroll: true
                });
            }
        });
    };

    // Helpers
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const ampm = h >= 12 ? 'م' : 'ص';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${minutes} ${ampm}`;
    };

    const getDuration = (start, end) => {
        if (!start || !end) return 0;
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
    };

    const allGrades = useMemo(() => {
        return sections.flatMap(section => 
            section.grades.map(grade => ({
                value: grade.id,
                label: `${section.name} - ${grade.name}`
            }))
        );
    }, [sections]);

    const isBreak = (period) => {
        return period.is_break || period.period_name.includes('راحة') || period.period_name.includes('فسحة') || period.period_name.includes('إفطار');
    };

    // Filter periods by active group
    const filteredPeriods = useMemo(() => {
        if (activeGroupId === null) {
            // General / All
            return periods; 
        }
        return periods.filter(p => p.timetable_group_id === activeGroupId);
    }, [periods, activeGroupId]);

    return (
        <AdminLayout activeMenu="الحصص اليومية">
            <Head title="توزيع الحصص والمجموعات | النظام الإداري" />

            <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <FolderKanban size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    المجموعات والحصص اليومية
                                </h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-1 text-sm font-bold">
                                    نظّم الجداول بإنشاء مجموعات للترتيب، ثم أضف الحصص وفترات الراحة داخل كل مجموعة.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => openGroupModal()}
                                className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                            >
                                <Plus size={18} /> مجموعة جديدة
                            </button>
                            <button 
                                onClick={() => openPeriodModal()}
                                className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-500/20 active:scale-95"
                            >
                                <Plus size={18} /> إضافة حصة
                            </button>
                        </div>
                    </div>
                </div>

                {/* Groups Selection Row */}
                <div className="flex overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 snap-x hide-scrollbar">
                    {/* General / All Group Card */}
                    <div 
                        onClick={() => setActiveGroupId(null)}
                        className={`snap-start shrink-0 w-64 p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                            activeGroupId === null 
                                ? 'bg-primary-50 border-primary-500 dark:bg-primary-900/20 dark:border-primary-500 shadow-sm' 
                                : 'bg-white border-slate-100 hover:border-primary-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeGroupId === null ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                <List size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-slate-800 dark:text-white">الكل (عام)</h3>
                                <p className="text-xs font-bold text-slate-500">الحصص المشتركة وغير المرتبطة</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                            <span>عرض جميع الحصص</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{periods.length}</span>
                        </div>
                    </div>

                    {/* Dynamic Group Cards */}
                    {groups.map(group => (
                        <div 
                            key={group.id}
                            onClick={() => setActiveGroupId(group.id)}
                            className={`relative group snap-start shrink-0 w-64 p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                                activeGroupId === group.id 
                                    ? 'bg-primary-50 border-primary-500 dark:bg-primary-900/20 dark:border-primary-500 shadow-sm' 
                                    : 'bg-white border-slate-100 hover:border-primary-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700'
                            }`}
                        >
                            {/* Group Actions */}
                            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); openGroupModal(group); }} className="w-7 h-7 bg-white dark:bg-slate-800 text-sky-500 rounded-full flex items-center justify-center shadow-sm hover:bg-sky-50">
                                    <Edit size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }} className="w-7 h-7 bg-white dark:bg-slate-800 text-rose-500 rounded-full flex items-center justify-center shadow-sm hover:bg-rose-50">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeGroupId === group.id ? 'bg-primary-500 text-white' : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10'}`}>
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-800 dark:text-white truncate max-w-[120px]">{group.name}</h3>
                                    <p className="text-xs font-bold text-slate-500 truncate max-w-[120px]">
                                        {group.grades?.map(g => g.name).join(', ') || 'لا توجد فصول'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                <span>{group.grades?.length} فصل مرتبط</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex justify-between">
                    <div className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Clock size={18} />
                        {activeGroupId === null ? 'جميع الحصص' : `حصص مجموعة: ${groups.find(g => g.id === activeGroupId)?.name}`}
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                        <button onClick={() => setViewMode('timeline')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <List size={16} className="inline-block mr-1" /> مسار
                        </button>
                        <button onClick={() => setViewMode('table')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Table2 size={16} className="inline-block mr-1" /> جدول
                        </button>
                    </div>
                </div>

                {/* Periods List */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    {filteredPeriods.length > 0 ? (
                        viewMode === 'table' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4 font-black">اسم الحصة</th>
                                            <th className="px-6 py-4 font-black">من</th>
                                            <th className="px-6 py-4 font-black">إلى</th>
                                            <th className="px-6 py-4 font-black text-center">المدة</th>
                                            <th className="px-6 py-4 font-black text-center">المجموعة</th>
                                            <th className="px-6 py-4 font-black text-center">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {filteredPeriods.map((period) => (
                                            <tr key={period.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 group ${period.is_break ? 'bg-amber-50/20' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold flex items-center gap-2">
                                                        {period.period_name}
                                                        {period.is_break && <Coffee size={14} className="text-amber-500" />}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-emerald-600">{formatTime(period.start_time)}</td>
                                                <td className="px-6 py-4 font-bold text-rose-600">{formatTime(period.end_time)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold">
                                                        {getDuration(period.start_time, period.end_time)} د
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {period.group ? (
                                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg text-xs font-black">
                                                            {period.group.name}
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-black">
                                                            بدون مجموعة
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => openPeriodModal(period)} className="mx-1 text-sky-500 hover:text-sky-700"><Edit size={16} /></button>
                                                    <button onClick={() => handleDeletePeriod(period.id)} className="mx-1 text-rose-500 hover:text-rose-700"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-6 md:p-10 relative">
                                <div className="absolute top-10 bottom-10 right-10 md:right-16 w-0.5 bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>
                                <div className="space-y-6 relative z-10">
                                    {filteredPeriods.map((period) => (
                                        <div key={period.id} className="flex sm:flex-row flex-col sm:items-center gap-4 sm:gap-8 group">
                                            <div className="w-full sm:w-32 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end shrink-0 order-2 sm:order-1 font-bold">
                                                <span className="text-slate-700 dark:text-slate-300">{formatTime(period.start_time)}</span>
                                                <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700 mx-auto hidden sm:block"></div>
                                                <span className="text-slate-500 text-sm">{formatTime(period.end_time)}</span>
                                            </div>
                                            <div className="hidden sm:flex w-10 items-center justify-center order-2">
                                                <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm ${isBreak(period) ? 'bg-amber-100 text-amber-500' : 'bg-primary-100 text-primary-500'}`}>
                                                    {isBreak(period) ? <Coffee size={16} /> : <BookOpen size={16} />}
                                                </div>
                                            </div>
                                            <div className="flex-1 order-1 sm:order-3">
                                                <div className={`p-5 rounded-2xl border flex justify-between items-center ${isBreak(period) ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100 dark:bg-slate-800/50'}`}>
                                                    <div>
                                                        <h3 className="text-lg font-black">{period.period_name}</h3>
                                                        <p className="text-sm font-bold text-slate-500">المدة: {getDuration(period.start_time, period.end_time)} دقيقة - {period.group ? period.group.name : 'بدون مجموعة'}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => openPeriodModal(period)} className="w-10 h-10 rounded-xl bg-slate-50 border flex items-center justify-center hover:bg-sky-50 text-slate-500"><Edit size={16} /></button>
                                                        <button onClick={() => handleDeletePeriod(period.id)} className="w-10 h-10 rounded-xl bg-slate-50 border flex items-center justify-center hover:bg-rose-50 text-slate-500"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="py-20 text-center">
                            <Clock size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد حصص هنا</h3>
                            <button onClick={() => openPeriodModal()} className="mt-4 px-6 py-2 bg-primary-100 text-primary-700 font-bold rounded-xl inline-flex items-center gap-2">
                                <Plus size={18} /> أضف حصة
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Group */}
            <Modal show={isGroupModalOpen} onClose={closeGroupModal} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-xl font-black text-slate-800 mb-6">{editingGroup ? 'تعديل المجموعة' : 'إضافة مجموعة جدول جديدة'}</h2>
                    <form onSubmit={handleGroupSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المجموعة <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                value={groupForm.data.name}
                                onChange={(e) => groupForm.setData('name', e.target.value)}
                                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl px-4 py-2 font-bold focus:ring-primary-500"
                                placeholder="مثال: مسار الابتدائية"
                                required
                            />
                            {groupForm.errors.name && <p className="text-rose-500 text-xs mt-1">{groupForm.errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">الفصول المرتبطة <span className="text-rose-500">*</span></label>
                            <SelectInput
                                isMulti={true}
                                value={groupForm.data.grade_ids}
                                onChange={(val) => groupForm.setData('grade_ids', val)}
                                className="w-full font-bold"
                                options={allGrades}
                                placeholder="اختر الفصول..."
                            />
                            {groupForm.errors.grade_ids && <p className="text-rose-500 text-xs mt-1">{groupForm.errors.grade_ids}</p>}
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={closeGroupModal} className="px-5 py-2.5 font-bold bg-slate-100 rounded-xl">إلغاء</button>
                            <button type="submit" disabled={groupForm.processing} className="px-6 py-2.5 font-bold text-white bg-primary-600 rounded-xl flex items-center gap-2">
                                <Save size={18} /> {groupForm.processing ? 'جاري الحفظ...' : 'حفظ'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal for Period */}
            <Modal show={isPeriodModalOpen} onClose={closePeriodModal} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-xl font-black text-slate-800 mb-6">{editingPeriod ? 'تعديل الحصة' : 'إضافة حصة'}</h2>
                    <form onSubmit={handlePeriodSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم الحصة <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                value={periodForm.data.period_name}
                                onChange={(e) => periodForm.setData('period_name', e.target.value)}
                                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl px-4 py-2 font-bold focus:ring-primary-500"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">من <span className="text-rose-500">*</span></label>
                                <FlatpickrInput
                                    type="time"
                                    value={periodForm.data.start_time}
                                    onChange={(val) => periodForm.setData('start_time', val)}
                                    className="w-full text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">إلى <span className="text-rose-500">*</span></label>
                                <FlatpickrInput
                                    type="time"
                                    value={periodForm.data.end_time}
                                    onChange={(val) => periodForm.setData('end_time', val)}
                                    className="w-full text-center"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">المجموعة (اختياري)</label>
                            <SelectInput
                                value={periodForm.data.timetable_group_id}
                                onChange={(val) => periodForm.setData('timetable_group_id', val)}
                                options={[{ value: '', label: 'بدون مجموعة (تطبق على الكل)' }, ...groups.map(g => ({ value: g.id, label: g.name }))]}
                                className="w-full font-bold"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_break"
                                checked={periodForm.data.is_break}
                                onChange={(e) => periodForm.setData('is_break', e.target.checked)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-5 h-5 cursor-pointer"
                            />
                            <label htmlFor="is_break" className="text-sm font-bold text-slate-700 cursor-pointer">هذه فترة راحة (فسحة/إفطار)</label>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={closePeriodModal} className="px-5 py-2.5 font-bold bg-slate-100 rounded-xl">إلغاء</button>
                            <button type="submit" disabled={periodForm.processing} className="px-6 py-2.5 font-bold text-white bg-primary-600 rounded-xl flex items-center gap-2">
                                <Save size={18} /> {periodForm.processing ? 'جاري الحفظ...' : 'حفظ'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}
