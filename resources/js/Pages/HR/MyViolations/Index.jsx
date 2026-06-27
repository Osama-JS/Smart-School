import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { AlertCircle, CheckCircle, PenTool, FileText, ShieldAlert, Filter, RefreshCw, Eye, X, Calendar, ShieldCheck, LayoutGrid, List } from 'lucide-react';
import Modal from '@/Components/Modal';
import SignaturePad from '@/Components/SignaturePad';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import Pagination from '@/Components/Pagination';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function MyViolations({ auth, violations, types, filters }) {
    const [viewMode, setViewMode] = useState('grid');
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedViolation, setSelectedViolation] = useState(null);

    const [filterData, setFilterData] = useState({
        violation_type_id: filters?.violation_type_id || '',
        start_date: filters?.start_date || '',
        end_date: filters?.end_date || '',
        status: filters?.status || ''
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        employee_signature: null,
    });

    // Quick Stats calculation
    const stats = useMemo(() => {
        const currentData = violations.data || [];
        const pending = currentData.filter(v => !v.employee_signature).length;
        const signed = currentData.filter(v => !!v.employee_signature).length;
        return {
            total: violations.total || currentData.length,
            pending: pending,
            signed: signed
        };
    }, [violations]);

    const applyFilters = () => {
        router.get(route('hr.my-violations'), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFilterData({
            violation_type_id: '',
            start_date: '',
            end_date: '',
            status: ''
        });
        router.get(route('hr.my-violations'));
    };

    const openSignModal = (violation) => {
        setSelectedViolation(violation);
        reset();
        setIsSignModalOpen(true);
    };

    const openPreviewModal = (violation) => {
        setSelectedViolation(violation);
        setIsPreviewModalOpen(true);
    };

    const submitSignature = (e) => {
        e.preventDefault();
        post(route('hr.my-violations.sign', selectedViolation.id), {
            onSuccess: () => setIsSignModalOpen(false)
        });
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="مخالفاتي" />

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-red-50/70 via-white to-white dark:from-red-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-red-100 dark:border-red-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700" />
                    
                    {/* Visual geometric lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-red-600" />
                            <circle cx="250" cy="90" r="4" className="fill-red-500" />
                            <circle cx="500" cy="160" r="6" className="fill-red-400" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <ShieldAlert size={28} className="text-red-600" />
                                سجل مخالفاتي
                            </h1>
                            <p className="text-red-700/80 dark:text-red-300/80 mt-2 text-sm font-semibold">استعراض وتوقيع المخالفات والتنبيهات المسجلة بحقك</p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#121820]/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي المخالفات</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</h3>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-[#121820]/80 backdrop-blur-xl border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">بانتظار التوقيع</p>
                            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/80 backdrop-blur-xl border border-green-100 dark:border-green-900/30 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">تم توقيعها</p>
                            <h3 className="text-2xl font-black text-green-600 dark:text-green-400">{stats.signed}</h3>
                        </div>
                    </div>
                </div>

                {/* Smart Filter Toolbar */}
                <div className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm p-2 flex flex-col md:flex-row items-center gap-2 sticky top-4 z-20">
                    <div className="flex-1 w-full grid grid-cols-2 md:flex md:flex-row gap-2">
                        <SelectInput 
                            className="w-full md:w-48 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 !py-2 text-sm" 
                            value={filterData.violation_type_id} 
                            onChange={val => setFilterData({...filterData, violation_type_id: val})}
                            options={[
                                { value: '', label: 'جميع الأنواع' },
                                ...(types || []).map(t => ({ value: t.id, label: t.name }))
                            ]}
                        />
                        <SelectInput 
                            className="w-full md:w-48 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 !py-2 text-sm" 
                            value={filterData.status} 
                            onChange={val => setFilterData({...filterData, status: val})}
                            options={[
                                { value: '', label: 'حالة التوقيع (الكل)' },
                                { value: 'unsigned', label: 'بانتظار التوقيع' },
                                { value: 'signed', label: 'موقّعة' }
                            ]}
                        />
                        <FlatpickrInput 
                            type="date"
                            className="w-full md:w-36 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 !py-2 text-sm !pl-10"
                            value={filterData.start_date}
                            onChange={val => setFilterData({...filterData, start_date: val})}
                            placeholder="من تاريخ"
                        />
                        <FlatpickrInput 
                            type="date"
                            className="w-full md:w-36 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 !py-2 text-sm !pl-10"
                            value={filterData.end_date}
                            onChange={val => setFilterData({...filterData, end_date: val})}
                            placeholder="إلى تاريخ"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 border-r border-slate-200 dark:border-slate-700 pr-2">
                        <button 
                            onClick={applyFilters} 
                            className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <Filter size={16} />
                            تطبيق
                        </button>
                        <button 
                            onClick={resetFilters} 
                            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center transition-all shrink-0"
                            title="إعادة ضبط"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            title="عرض بطاقات"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            title="عرض جدول"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Cards/Table View / Empty State */}
                {violations.data.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {violations.data.map((v) => (
                                <div 
                                    key={v.id} 
                                    className={`group flex flex-col bg-white dark:bg-[#121820]/60 rounded-3xl border shadow-sm transition-all duration-300 hover:shadow-lg overflow-hidden relative ${
                                        !v.employee_signature 
                                        ? 'border-red-300 dark:border-red-500/50 shadow-red-500/10' 
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    {!v.employee_signature && (
                                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-600 animate-pulse"></div>
                                    )}
                                    
                                    {/* Card Header */}
                                    <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                                                <Calendar size={14} />
                                                {v.violation_date}
                                            </div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                                                {v.violation_type?.name}
                                            </h3>
                                        </div>
                                        <div className="shrink-0">
                                            {v.employee_signature ? (
                                                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                                                    <CheckCircle size={20} />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center animate-pulse">
                                                    <AlertCircle size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 grow flex flex-col gap-4">
                                        <div>
                                            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">تفاصيل المخالفة</span>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                                                {v.details}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80 mt-auto">
                                            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">الإجراء المتخذ</span>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                {v.action_taken}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card Footer / Actions */}
                                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800/80 flex gap-2">
                                        <button
                                            onClick={() => openPreviewModal(v)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors"
                                        >
                                            <Eye size={16} />
                                            معاينة
                                        </button>
                                        {!v.employee_signature && (
                                            <button
                                                onClick={() => openSignModal(v)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md hover:shadow-red-600/20"
                                            >
                                                <PenTool size={16} />
                                                توقيع الآن
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right min-w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                            <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">التاريخ والنوع</th>
                                            <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">التفاصيل</th>
                                            <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الإجراء المتخذ</th>
                                            <th className="py-4 px-6 text-center text-sm font-bold text-slate-500 dark:text-slate-400">حالة التوقيع</th>
                                            <th className="py-4 px-6 text-center text-sm font-bold text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {violations.data.map((v) => (
                                            <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{v.violation_date}</div>
                                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">{v.violation_type?.name}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={v.details}>
                                                        {v.details}
                                                    </div>
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
                                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 animate-pulse">
                                                            <AlertCircle size={14} />
                                                            بانتظار التوقيع
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <button
                                                            onClick={() => openPreviewModal(v)}
                                                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors"
                                                            title="معاينة التفاصيل"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        {!v.employee_signature && (
                                                            <button
                                                                onClick={() => openSignModal(v)}
                                                                className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 flex items-center justify-center transition-colors"
                                                                title="التوقيع الآن"
                                                            >
                                                                <PenTool size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    // Motivating Empty State
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-green-500/20 dark:bg-green-500/10 rounded-full blur-3xl scale-150"></div>
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 border-4 border-white dark:border-[#121820] shadow-xl flex items-center justify-center text-green-500 dark:text-green-400">
                                <ShieldCheck size={48} />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg border-2 border-white dark:border-[#121820] animate-bounce">
                                <span className="text-yellow-900 text-xs font-black">⭐</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">سجلك نظيف وممتاز!</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                            لا توجد أي مخالفات مسجلة بحقك. استمر في هذا الأداء الرائع والانضباط المتميز، نحن فخورون بك!
                        </p>
                    </div>
                )}
                
                {violations.data.length > 0 && (
                    <div className="mt-8 flex justify-center">
                        <Pagination links={violations.links} />
                    </div>
                )}
            </div>

            {/* Sign Modal (Untouched functionality, slight style refresh on background) */}
            <Modal show={isSignModalOpen} onClose={() => setIsSignModalOpen(false)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">إقرار وتوقيع</h2>
                    
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl mb-6 border border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            أقر أنا الموظف الموقع أدناه باطلاعي على المخالفة 
                            <strong className="mx-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">{selectedViolation?.violation_type?.name}</strong>
                            بتاريخ
                            <strong className="mx-1 text-slate-900 dark:text-white">{selectedViolation?.violation_date}</strong>.
                        </p>
                    </div>

                    <form onSubmit={submitSignature}>
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">توقيعك الإلكتروني:</label>
                            <SignaturePad 
                                onChange={(val) => setData('employee_signature', val)} 
                                error={errors.employee_signature}
                            />
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-5">
                            <SecondaryButton onClick={() => setIsSignModalOpen(false)} className="rounded-xl font-bold">إلغاء</SecondaryButton>
                            <PrimaryButton disabled={processing || !data.employee_signature} className="bg-green-600 hover:bg-green-700 rounded-xl font-bold">اعتماد التوقيع</PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
            
            {/* Preview Modal (Untouched functionality, preserved UI) */}
            <Modal show={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} maxWidth="2xl">
                {selectedViolation && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText size={20} className="text-primary-500" />
                                تفاصيل المخالفة
                            </h2>
                            <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">تاريخ المخالفة</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedViolation.violation_date}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">نوع المخالفة</span>
                                    <span className="text-red-600 dark:text-red-400 font-bold">{selectedViolation.violation_type?.name}</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">التفاصيل الكاملة</span>
                                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed min-h-[100px]">
                                    {selectedViolation.details}
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">الإجراء المتخذ</span>
                                <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 text-orange-800 dark:text-orange-300 font-medium">
                                    {selectedViolation.action_taken}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">توقيع الإدارة</span>
                                    {selectedViolation.admin_signature_url ? (
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 flex justify-center h-32 items-center">
                                            <img src={selectedViolation.admin_signature_url} alt="توقيع الإدارة" className="max-h-full max-w-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 dark:border-slate-700 border-dashed rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-center h-32 items-center text-slate-400 dark:text-slate-500 text-sm">
                                            لا يوجد توقيع
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">توقيع الموظف</span>
                                    {selectedViolation.employee_signature_url ? (
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 flex justify-center h-32 items-center relative">
                                            <div className="absolute top-2 right-2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle size={10} /> معتمد
                                            </div>
                                            <img src={selectedViolation.employee_signature_url} alt="توقيع الموظف" className="max-h-full max-w-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="border border-red-200 dark:border-red-900/50 border-dashed rounded-xl p-4 bg-red-50/50 dark:bg-red-900/10 flex flex-col justify-center h-32 items-center text-red-400 dark:text-red-500 text-sm gap-2">
                                            <AlertCircle size={20} />
                                            <span>بانتظار التوقيع</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedViolation.attachment_url && (
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                                    <a 
                                        href={selectedViolation.attachment_url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2 w-full md:w-auto md:px-8 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-xl transition-colors font-bold text-sm border border-blue-100 dark:border-blue-900/50"
                                    >
                                        <FileText size={18} />
                                        عرض المرفقات
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
