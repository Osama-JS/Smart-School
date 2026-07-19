import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { BookOpen, Settings, Eye, Clock, Download, Filter, Search } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Index({ auth, teachers, timeLimit, filters = {}, options = {} }) {
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        time_limit: timeLimit || '14:00',
    });

    const [filterData, setFilterData] = useState({
        search: filters.search || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const applyFilters = () => {
        router.get(route('admin.followup-books.index'), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        const queryParams = new URLSearchParams(filterData).toString();
        window.location.href = `${route('admin.followup-books.export')}?${queryParams}`;
    };

    const openSettingsModal = () => {
        setIsSettingsModalOpen(true);
    };

    const closeSettingsModal = () => {
        setIsSettingsModalOpen(false);
        reset();
    };

    const submitSettings = (e) => {
        e.preventDefault();
        post(route('admin.followup-books.settings'), {
            onSuccess: () => {
                closeSettingsModal();
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحفظ',
                    text: 'تم حفظ إعدادات دفاتر المتابعة بنجاح',
                    confirmButtonText: 'حسناً',
                    confirmButtonColor: '#10b981',
                });
            },
        });
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="إدارة دفاتر المتابعة" />

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <BookOpen size={28} className="text-primary-600" />
                                إدارة دفاتر المتابعة
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">متابعة إنجاز المعلمين للدروس وإحصائيات الرفع</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 font-bold transition-all shadow-sm active:scale-95"
                            >
                                <Download size={18} />
                                <span>تصدير تقرير (CSV)</span>
                            </button>
                            <button
                                onClick={openSettingsModal}
                                className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-all active:scale-95"
                            >
                                <Settings size={18} />
                                <span>الإعدادات</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-bold">
                        <Filter size={18} className="text-primary-500" />
                        <h3>فلاتر البحث والإحصائيات</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <InputLabel value="بحث باسم المعلم" className="mb-2 text-xs font-bold text-slate-500" />
                            <div className="relative">
                                <input
                                    type="text"
                                    value={filterData.search}
                                    onChange={(e) => setFilterData({ ...filterData, search: e.target.value })}
                                    placeholder="اكتب اسم المعلم هنا..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2.5 pl-10 font-bold focus:border-primary-500 focus:ring-primary-500 transition-all"
                                />
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="من تاريخ" className="mb-2 text-xs font-bold text-slate-500" />
                            <input
                                type="date"
                                value={filterData.start_date}
                                onChange={(e) => setFilterData({ ...filterData, start_date: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2.5 font-bold focus:border-primary-500 focus:ring-primary-500 transition-all"
                            />
                        </div>

                        <div>
                            <InputLabel value="إلى تاريخ" className="mb-2 text-xs font-bold text-slate-500" />
                            <input
                                type="date"
                                value={filterData.end_date}
                                onChange={(e) => setFilterData({ ...filterData, end_date: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2.5 font-bold focus:border-primary-500 focus:ring-primary-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={applyFilters}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition-all shadow-sm active:scale-95"
                        >
                            <Search size={18} />
                            تطبيق الفلتر
                        </button>
                    </div>
                </div>

                {/* Teachers Table */}
                <div className="bg-white dark:bg-[#151c27] rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/20 dark:shadow-black/20 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent dark:from-white/5 pointer-events-none" />
                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-sm text-right">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300">
                                    <th className="px-6 py-5 font-extrabold text-xs tracking-wider uppercase">المعلم</th>
                                    <th className="px-6 py-5 font-extrabold text-xs tracking-wider uppercase text-center">إجمالي الحصص</th>
                                    <th className="px-6 py-5 font-extrabold text-xs tracking-wider uppercase text-center text-blue-600 dark:text-blue-400">التطبيق</th>
                                    <th className="px-6 py-5 font-extrabold text-xs tracking-wider uppercase text-center text-emerald-600 dark:text-emerald-400">النظام</th>
                                    <th className="px-6 py-5 font-extrabold text-xs tracking-wider uppercase text-center text-amber-600 dark:text-amber-400">الرفع المتأخر</th>
                                    <th className="px-6 py-5 font-extrabold text-xs tracking-wider uppercase text-center text-red-600 dark:text-red-400">التقصير</th>
                                    <th className="px-6 py-5 font-extrabold text-xs tracking-wider uppercase text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {teachers.length > 0 ? (
                                    teachers.map((teacher, index) => (
                                        <tr key={teacher.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-300">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-800/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-extrabold text-lg shadow-sm border border-primary-200/50 dark:border-primary-800/50 group-hover:scale-105 transition-transform duration-300">
                                                        {teacher.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white text-base">{teacher.name}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">معلم</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700">
                                                    {teacher.total_weekly_lessons}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-xl font-bold text-sm transition-colors ${teacher.app_uploads > 0 ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-slate-700/50'}`}>
                                                    {teacher.app_uploads}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-xl font-bold text-sm transition-colors ${teacher.dashboard_uploads > 0 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-slate-700/50'}`}>
                                                    {teacher.dashboard_uploads}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-xl font-bold text-sm transition-colors ${teacher.late_uploads > 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-slate-700/50'}`}>
                                                    {teacher.late_uploads}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-xl font-black text-sm transition-all ${teacher.negligence > 0 ? 'bg-red-500 dark:bg-red-600 text-white shadow-lg shadow-red-500/30 border border-red-400 dark:border-red-500 scale-110' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-slate-700/50'}`}>
                                                    {teacher.negligence}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <Link
                                                    href={route('admin.followup-books.show', {
                                                        teacher: teacher.id,
                                                        start_date: filterData.start_date,
                                                        end_date: filterData.end_date
                                                    })}
                                                    className="inline-flex items-center justify-center p-2.5 text-primary-600 bg-primary-50 dark:bg-primary-500/10 dark:text-primary-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500 dark:hover:text-white rounded-xl transition-all duration-300 group-hover:shadow-md active:scale-95 border border-primary-100 dark:border-primary-500/20 hover:border-transparent"
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-24 text-center">
                                            <div className="w-24 h-24 mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-5 border border-slate-100 dark:border-slate-700 shadow-inner">
                                                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2">لا يوجد بيانات للعرض</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-sm mx-auto">لم يتم العثور على معلمين يطابقون خيارات البحث الخاصة بك. حاول تغيير الفلاتر.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Settings Modal */}
            <Modal show={isSettingsModalOpen} onClose={closeSettingsModal} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                            <Settings size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات دفاتر المتابعة</h2>
                    </div>

                    <form onSubmit={submitSettings} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="time_limit" value="وقت الرفع (الحد الأقصى للتأخير)" />
                            <div className="relative mt-1">
                                <input
                                    type="time"
                                    id="time_limit"
                                    value={data.time_limit}
                                    onChange={(e) => setData('time_limit', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
                                    required
                                />
                                <Clock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">أي رفع بعد هذا الوقت سيُسجل كـ (رفع متأخر).</p>
                            <InputError message={errors.time_limit} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={closeSettingsModal}
                                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                            >
                                حفظ الإعدادات
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}
