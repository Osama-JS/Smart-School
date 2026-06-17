import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { Calendar, Plus, Edit2, Trash2, X, Save, FileText, CheckCircle2 } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';

export default function HolidaysIndex({ holidays, branches, academicYears, isAdmin }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        start_date: '',
        end_date: '',
        branch_id: '',
        academic_year_id: '',
        semester_id: '',
        notes: '',
    });

    const openModal = (holiday = null) => {
        if (holiday) {
            setEditingHoliday(holiday);
            setData({
                name: holiday.name,
                start_date: holiday.start_date,
                end_date: holiday.end_date,
                branch_id: holiday.branch_id || '',
                academic_year_id: holiday.academic_year_id || '',
                semester_id: holiday.semester_id || '',
                notes: holiday.notes || '',
            });
        } else {
            setEditingHoliday(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingHoliday(null);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingHoliday) {
            put(route('hr.holidays.update', editingHoliday.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('hr.holidays.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذه الإجازة الرسمية؟')) {
            destroy(route('hr.holidays.destroy', id));
        }
    };

    return (
        <AdminLayout>
            <Head title="الإجازات الرسمية والعطلات" />

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
                            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight">الإجازات الرسمية والعطلات</h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة أيام العطل الرسمية للمؤسسة والفروع</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>إضافة إجازة رسمية</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">اسم الإجازة / المناسبة</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">من تاريخ</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">إلى تاريخ</th>
                                    {isAdmin && <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الفرع</th>}
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الفترة الأكاديمية</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">ملاحظات</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {holidays.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-slate-500">
                                            لا توجد إجازات رسمية مضافة.
                                        </td>
                                    </tr>
                                ) : (
                                    holidays.map((holiday) => (
                                        <tr key={holiday.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="py-4 px-6 font-bold text-dark-900 dark:text-white">
                                                {holiday.name}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                {holiday.start_date}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                {holiday.end_date}
                                            </td>
                                            {isAdmin && (
                                                <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                    {holiday.branch_id ? holiday.branch?.name : 'عام (لجميع الفروع)'}
                                                </td>
                                            )}
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                {holiday.academic_year ? holiday.academic_year.name : '-'}
                                                {holiday.semester ? ` / ${holiday.semester.name}` : ''}
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 text-sm max-w-xs truncate">
                                                {holiday.notes || '-'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openModal(holiday)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(holiday.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors">
                                                        <Trash2 size={16} />
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

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal}></div>
                        <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="text-primary-500" />
                                    {editingHoliday ? 'تعديل إجازة رسمية' : 'إضافة إجازة رسمية'}
                                </h3>
                                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم المناسبة <span className="text-accent-500">*</span></label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        value={data.name} onChange={e => setData('name', e.target.value)}
                                        placeholder="مثال: عيد الفطر، اليوم الوطني..."
                                    />
                                    {errors.name && <p className="text-xs text-accent-500 mt-1">{errors.name}</p>}
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

                                {isAdmin && (
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الفرع المخصص (اختياري)</label>
                                        <SelectInput
                                            options={[
                                                { value: '', label: 'عام - ينطبق على جميع الفروع' },
                                                ...branches.map(b => ({ value: b.id, label: b.name }))
                                            ]}
                                            value={[
                                                { value: '', label: 'عام - ينطبق على جميع الفروع' },
                                                ...branches.map(b => ({ value: b.id, label: b.name }))
                                            ].find(o => o.value == data.branch_id) || null}
                                            onChange={(selected) => setData('branch_id', selected || '')}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">اتركه فارغاً لتطبيق الإجازة على جميع فروع المؤسسة.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">السنة الدراسية (اختياري)</label>
                                        <SelectInput
                                            options={[
                                                { value: '', label: 'غير محدد' },
                                                ...(academicYears?.map(ay => ({ value: ay.id, label: ay.name })) || [])
                                            ]}
                                            value={[
                                                { value: '', label: 'غير محدد' },
                                                ...(academicYears?.map(ay => ({ value: ay.id, label: ay.name })) || [])
                                            ].find(o => o.value == data.academic_year_id) || null}
                                            onChange={(selected) => {
                                                setData({
                                                    ...data,
                                                    academic_year_id: selected || '',
                                                    semester_id: '' // reset semester when year changes
                                                });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الفصل الدراسي (اختياري)</label>
                                        <SelectInput
                                            options={[
                                                { value: '', label: 'غير محدد' },
                                                ...((academicYears?.find(ay => ay.id == data.academic_year_id)?.semesters || []).map(s => ({ value: s.id, label: s.name })))
                                            ]}
                                            value={[
                                                { value: '', label: 'غير محدد' },
                                                ...((academicYears?.find(ay => ay.id == data.academic_year_id)?.semesters || []).map(s => ({ value: s.id, label: s.name })))
                                            ].find(o => o.value == data.semester_id) || null}
                                            onChange={(selected) => setData('semester_id', selected || '')}
                                            isDisabled={!data.academic_year_id}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">ملاحظات (اختياري)</label>
                                    <textarea
                                        rows="3"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                        value={data.notes} onChange={e => setData('notes', e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <Save size={20} />
                                        {editingHoliday ? 'حفظ التعديلات' : 'إضافة الإجازة'}
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
            </div>
        </AdminLayout>
    );
}

