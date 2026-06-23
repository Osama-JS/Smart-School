import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';

import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SecondaryButton from '@/Components/SecondaryButton';
import { BookOpen, Trash, Eye, Calendar, User, Filter } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Index({ auth, preparations, teachers, grades, subjects, filters }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingPrep, setViewingPrep] = useState(null);

    const { delete: destroy } = useForm();

    const openModal = (preparation) => {
        setViewingPrep(preparation);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setViewingPrep(null);
    };

    const confirmDelete = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من التراجع عن هذا!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف!',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('academic.lesson-preparations.destroy', id));
            }
        });
    };

    const handleFilterChange = (key, value) => {
        router.get(route('academic.lesson-preparations'), {
            ...filters,
            [key]: value
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="دفاتر التحضير ومتابعة الدروس" />

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
                                <BookOpen size={28} className="text-primary-600" />
                                دفاتر التحضير ومتابعة الدروس
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">متابعة سجلات إنجاز الدروس والواجبات الخاصة بالمعلمين</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    
                    {/* Filters Section */}
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden mb-6">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        <div className="flex items-center gap-2 mb-4">
                            <Filter size={18} className="text-primary-500" />
                            <h3 className="font-bold text-slate-800 dark:text-white">تصفية النتائج</h3>
                        </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="group flex flex-col">
                                    <InputLabel value="المعلم" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                    <SelectInput
                                        className="w-full"
                                        options={teachers.map(t => ({ value: t.id, label: t.name }))}
                                        value={filters.teacher_id || ''}
                                        onChange={(v) => handleFilterChange('teacher_id', v?.value || '')}
                                        placeholder="كل المعلمين"
                                        isClearable
                                    />
                                </div>
                                <div className="group flex flex-col">
                                    <InputLabel value="الصف" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                    <SelectInput
                                        className="w-full"
                                        options={grades.map(g => ({ value: g.id, label: g.name }))}
                                        value={filters.grade_id || ''}
                                        onChange={(v) => handleFilterChange('grade_id', v?.value || '')}
                                        placeholder="كل الصفوف"
                                        isClearable
                                    />
                                </div>
                                <div className="group flex flex-col">
                                    <InputLabel value="المادة" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                    <SelectInput
                                        className="w-full"
                                        options={subjects.map(s => ({ value: s.id, label: s.name }))}
                                        value={filters.subject_id || ''}
                                        onChange={(v) => handleFilterChange('subject_id', v?.value || '')}
                                        placeholder="كل المواد"
                                        isClearable
                                    />
                                </div>
                                <div className="group flex flex-col">
                                    <InputLabel value="تاريخ التنفيذ" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                    <div className="mt-1 relative">
                                        <FlatpickrInput
                                            value={filters.date_range || ''}
                                            onChange={(dates, str) => handleFilterChange('date_range', str)}
                                            options={{
                                                mode: 'range',
                                                dateFormat: 'Y-m-d',
                                            }}
                                            placeholder="من - إلى"
                                            className="w-full pl-10 !py-[11px] border-slate-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg shadow-sm"
                                        />
                                        <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/* Table Card */}
                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200/60">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ التنفيذ</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المعلم</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الصف والمادة</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عنوان الدرس</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {preparations.data.length > 0 ? preparations.data.map((prep) => (
                                        <tr key={prep.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {prep.preparation_date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                                        {prep.teacher?.name?.charAt(0)}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {prep.teacher?.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-medium">{prep.subject?.name}</div>
                                                <div className="text-xs text-gray-500">{prep.grade?.name} {prep.division ? `- ${prep.division.name}` : ''}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 line-clamp-1">{prep.lesson_title}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openModal(prep)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-primary-600 hover:bg-primary-50 transition-colors" title="عرض التفاصيل">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {auth.permissions?.includes('إدارة دفاتر التحضير') && (
                                                        <button onClick={() => confirmDelete(prep.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-red-600 hover:bg-red-50 transition-colors" title="حذف">
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                                لا توجد سجلات تحضير مطابقة للبحث
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {preparations.links && (
                            <div className="p-4 border-t">
                                <Pagination links={preparations.links} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
                {viewingPrep && (
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden backdrop-blur-sm">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">تفاصيل إنجاز الحصة</h2>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    تاريخ التنفيذ: <span className="font-medium text-slate-700">{viewingPrep.preparation_date}</span>
                                </p>
                            </div>
                            <div className="p-3 bg-primary-100 rounded-2xl">
                                <BookOpen className="w-7 h-7 text-primary-600" />
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-6">
                            {/* Meta Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">المعلم</div>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary-500" />
                                        <span className="font-bold text-slate-800">{viewingPrep.teacher?.name}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">المادة والصف</div>
                                    <div className="font-bold text-slate-800">{viewingPrep.subject?.name}</div>
                                    <div className="text-sm text-slate-500">{viewingPrep.grade?.name} {viewingPrep.division ? `- ${viewingPrep.division.name}` : ''}</div>
                                </div>
                            </div>

                            {/* Content Info */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-2 border-r-4 border-primary-500 pr-3">عنوان الحصة</h4>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-700 leading-relaxed shadow-sm">
                                    {viewingPrep.lesson_title}
                                </div>
                            </div>

                            {viewingPrep.topics_covered && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-2 border-r-4 border-blue-500 pr-3">ما تم دراسته</h4>
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {viewingPrep.topics_covered}
                                    </div>
                                </div>
                            )}

                            {viewingPrep.homework && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-2 border-r-4 border-emerald-500 pr-3">الواجب المنزلي المطلوب</h4>
                                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {viewingPrep.homework}
                                    </div>
                                </div>
                            )}

                            {viewingPrep.notes && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-2 border-r-4 border-amber-500 pr-3">الملاحظات</h4>
                                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {viewingPrep.notes}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <SecondaryButton onClick={closeModal} className="!rounded-xl px-6">
                                إغلاق
                            </SecondaryButton>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
