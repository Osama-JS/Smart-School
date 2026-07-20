import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Calendar, Plus, Trash2, X, ChevronLeft, CalendarClock, Settings, Layers, CalendarDays, Search } from 'lucide-react';
import ToastNotification from '@/Components/ToastNotification';
import RichTextEditor from '@/Components/RichTextEditor';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';

dayjs.locale('ar');

export default function Index({ schedules, periods }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        title: '',
        period_id: '',
        details: ''
    });

    const filteredSchedules = schedules.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.period?.month_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [toast, setToast] = useState(null);

    const openCreateModal = () => {
        setEditingSchedule(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (schedule) => {
        setEditingSchedule(schedule);
        setData({
            title: schedule.title,
            period_id: schedule.period_id,
            details: schedule.details || ''
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const submitModal = (e) => {
        e.preventDefault();
        
        if (editingSchedule) {
            put(route('academic.exam-schedules.update', editingSchedule.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setToast({ message: 'تم التعديل بنجاح', type: 'success' });
                    reset();
                },
                onError: (err) => console.error(err)
            });
        } else {
            post(route('academic.exam-schedules.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
                onError: (err) => console.error(err)
            });
        }
    };

    const confirmDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذا الجدول؟ سيتم حذف جميع التفاصيل المتعلقة به.')) {
            router.delete(route('academic.exam-schedules.destroy', id), {
                onSuccess: () => setToast({ message: 'تم الحذف بنجاح', type: 'success' })
            });
        }
    };

    return (
        <AdminLayout activeMenu="جداول الاختبارات">
            <Head title="جداول الاختبارات" />
            {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
                {/* Modern Hero Section */}
                <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-600/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white p-4 rounded-2xl shadow-lg shadow-primary-500/30">
                                <CalendarDays size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                                    جداول الاختبارات
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold flex items-center gap-2">
                                    <Settings size={16} /> إدارة الجداول الزمنية واللجان لجميع الفترات
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <Search size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="search"
                                    className="block w-full p-3 pr-11 text-sm font-bold text-slate-800 border-2 border-slate-200 rounded-xl bg-slate-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-900/50 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white transition-all shadow-inner"
                                    placeholder="ابحث عن جدول أو فترة..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={openCreateModal}
                                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-primary-600 rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary-600/30 w-full md:w-auto z-10"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <Plus size={20} className="relative z-10" />
                                <span className="relative z-10">جدول جديد</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Schedules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSchedules.length > 0 ? filteredSchedules.map((schedule) => (
                        <div key={schedule.id} className="group bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(var(--color-primary-500),0.15)] hover:border-primary-500/30 dark:hover:border-primary-500/30 transition-all duration-300 flex flex-col overflow-hidden relative translate-y-0 hover:-translate-y-1.5">
                            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary-400 to-primary-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                            
                            <div className="p-6 flex-1 relative z-10">
                                <div className="absolute top-6 right-6 w-20 h-20 bg-primary-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-primary-500/10 transition-colors"></div>
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 p-4 rounded-2xl ring-1 ring-primary-100 dark:ring-primary-800/50 group-hover:bg-primary-500 group-hover:text-white group-hover:ring-primary-500 group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-all duration-300">
                                        <CalendarClock size={28} />
                                    </div>
                                    <div className="flex gap-2 z-20">
                                        <button 
                                            onClick={() => openEditModal(schedule)}
                                            className="text-slate-400 hover:text-primary-500 p-2.5 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                            title="تعديل بيانات الجدول"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>
                                        <button 
                                            onClick={() => confirmDelete(schedule.id)}
                                            className="text-slate-400 hover:text-red-500 p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                            title="حذف الجدول"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tracking-tight">
                                    {schedule.title}
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 group-hover:border-primary-100 dark:group-hover:border-primary-900/30 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-500">
                                            <Layers size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold mb-0.5">الفترة المرتبطة</p>
                                            <p className="font-bold text-slate-700 dark:text-slate-200 truncate text-sm">
                                                {schedule.period?.month_name} - {schedule.period?.semester?.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20">
                                <Link 
                                    href={route('academic.exam-schedules.show', schedule.id)}
                                    className="relative flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-black rounded-xl ring-2 ring-primary-100 dark:ring-primary-900/50 hover:ring-primary-500 hover:text-white hover:bg-primary-600 dark:hover:bg-primary-500 dark:hover:text-white transition-all shadow-sm group/btn overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                                    <span className="relative z-10">إدارة وتصميم الجدول</span>
                                    <ChevronLeft size={18} className="rtl:rotate-180 relative z-10 transition-transform group-hover/btn:-translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-20 px-6 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-50"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-28 h-28 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-full flex items-center justify-center mb-6 shadow-inner border-4 border-white dark:border-slate-800">
                                    <Calendar size={56} className="text-primary-500 dark:text-primary-400 opacity-80" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
                                    {searchQuery ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد جداول بعد'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed font-bold">
                                    {searchQuery ? 'جرب البحث باسم جدول آخر أو فترة مختلفة.' : 'يبدو أنك لم تقم بإنشاء أي جداول للاختبارات. ابدأ بإنشاء أول جدول لك لإدارة لجان ومواعيد الاختبارات باحترافية.'}
                                </p>
                                {!searchQuery && (
                                    <button 
                                        onClick={openCreateModal}
                                        className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 font-bold text-white bg-primary-600 rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary-600/30"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <Plus size={20} className="relative z-10" />
                                        <span className="relative z-10">إنشاء الجدول الأول</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in overflow-hidden ring-1 ring-slate-100 dark:ring-slate-700">
                            {/* Modal Header */}
                            <div className="bg-slate-50 dark:bg-slate-800/80 p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 relative z-10">
                                    <div className="bg-primary-100 dark:bg-primary-900/50 text-primary-600 p-2 rounded-lg">
                                        {editingSchedule ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        ) : (
                                            <Plus size={20} />
                                        )}
                                    </div>
                                    {editingSchedule ? 'تعديل جدول الاختبارات' : 'بناء جدول جديد'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="relative z-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-700 rounded-full p-1.5 shadow-sm hover:shadow-md transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={submitModal} className="p-6 space-y-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">عنوان الجدول</label>
                                    <input 
                                        type="text" 
                                        className="erp-input w-full bg-slate-50 focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-800 transition-colors" 
                                        placeholder="مثال: اختبارات نهاية الفصل الأول"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        required 
                                    />
                                    {errors.title && <p className="text-red-500 text-xs mt-1 font-medium">{errors.title}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">الفترة الزمنية للنتائج</label>
                                    <div className="relative">
                                        <select 
                                            className="erp-input w-full bg-slate-50 focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-800 transition-colors appearance-none pr-4 pl-10" 
                                            value={data.period_id}
                                            onChange={e => setData('period_id', e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>اختر الفترة المستهدفة...</option>
                                            {periods.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.month_name} - {p.semester?.name}
                                                </option>
                                            ))}
                                        </select>
                                        <CalendarClock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">ملاحظة: درجات هذا الاختبار سترصد تحت الفترة المحددة.</p>
                                    {errors.period_id && <p className="text-red-500 text-xs mt-1 font-medium">{errors.period_id}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">تفاصيل وتعليمات الاختبار (اختياري)</label>
                                    <RichTextEditor 
                                        value={data.details} 
                                        onChange={(content) => setData('details', content)} 
                                        placeholder="اكتب هنا تعليمات الاختبارات، مثل: يمنع استخدام الجوال، إحضار الأدوات المدرسية..."
                                    />
                                    {errors.details && <p className="text-red-500 text-xs mt-1 font-medium">{errors.details}</p>}
                                </div>
                                
                                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-700/50">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="erp-btn-primary px-8 py-2.5 text-sm rounded-xl flex items-center justify-center"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                جاري المعالجة...
                                            </span>
                                        ) : editingSchedule ? 'حفظ التعديلات' : 'إنشاء وانتقال للبناء'}
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
