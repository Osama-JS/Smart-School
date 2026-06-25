import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Activity, Plus, Edit2, Zap, Save, X, Users, CheckCircle, Clock } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';

export default function LeaveBalancesIndex({ balances, academicYears, currentAcademicYearId, leaveTypes, employees, isSystemAdmin, branches = [], filters = {}, currentBranchId }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBalance, setEditingBalance] = useState(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [deletingBalanceId, setDeletingBalanceId] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        id: '',
        employee_id: '',
        academic_year_id: currentAcademicYearId || '',
        leave_type_id: '',
        total_days: 0,
    });

    const { data: genData, setData: setGenData, post: genPost, processing: genProcessing, reset: genReset, clearErrors: genClearErrors } = useForm({
        academic_year_id: currentAcademicYearId || '',
        employee_ids: [],
        leave_type_ids: [],
    });

    const { delete: destroy } = useForm();

    const stats = {
        totalEmployees: new Set(balances?.map(b => b.employee_id)).size || 0,
        totalBalances: balances?.length || 0,
        totalUsedDays: balances?.reduce((sum, b) => sum + b.used_days, 0) || 0,
        totalRemainingDays: balances?.reduce((sum, b) => sum + b.remaining_days, 0) || 0
    };

    const handleYearChange = (val) => {
        router.get(route('hr.leave-balances'), { academic_year_id: val, branch_id: filters?.branch_id }, { preserveState: true });
    };

    const handleBranchChange = (val) => {
        router.get(route('hr.leave-balances'), { branch_id: val, academic_year_id: currentAcademicYearId }, { preserveState: true });
    };

    const handleGenerate = () => {
        if (!currentAcademicYearId) {
            alert('يرجى اختيار السنة الدراسية أولاً');
            return;
        }
        setGenData({
            academic_year_id: currentAcademicYearId,
            employee_ids: [],
            leave_type_ids: [],
        });
        genClearErrors();
        setIsGenerateModalOpen(true);
    };

    const submitGenerate = (e) => {
        e.preventDefault();
        genPost(route('hr.leave-balances.generate'), {
            onSuccess: () => {
                setIsGenerateModalOpen(false);
                genReset();
                genClearErrors();
            }
        });
    };

    const openModal = (balance = null) => {
        if (balance) {
            setEditingBalance(balance);
            setData({
                id: balance.id,
                employee_id: balance.employee_id,
                academic_year_id: currentAcademicYearId,
                leave_type_id: balance.leave_type_id,
                total_days: balance.total_days,
            });
        } else {
            setEditingBalance(null);
            reset();
            setData('academic_year_id', currentAcademicYearId || '');
        }
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBalance(null);
        reset();
        clearErrors();
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('hr.leave-balances.store'), {
            onSuccess: () => closeModal(),
        });
    };

    const confirmDelete = () => {
        if (deletingBalanceId) {
            destroy(route('hr.leave-balances.destroy', deletingBalanceId), {
                onSuccess: () => setDeletingBalanceId(null)
            });
        }
    };

    return (
        <AdminLayout activeMenu="أرصدة الإجازات">
            <Head title="أرصدة الإجازات" />

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
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight">أرصدة الإجازات للموظفين</h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تتبع مستحقات الإجازات والرصيد المتبقي</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                            {isSystemAdmin && (
                                <div className="w-full sm:w-48 shrink-0">
                                    <SelectInput
                                        value={filters.branch_id || ''}
                                        onChange={handleBranchChange}
                                        options={[
                                            { value: '', label: 'جميع الفروع' },
                                            ...branches.map(b => ({ value: b.id, label: b.name }))
                                        ]}
                                    />
                                </div>
                            )}
                            <div className="w-full sm:w-64 shrink-0">
                                <SelectInput
                                    value={currentAcademicYearId}
                                    onChange={handleYearChange}
                                    options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                                    placeholder="اختر السنة الدراسية"
                                />
                            </div>
                            <button
                                onClick={handleGenerate}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-sm shrink-0"
                            >
                                <Zap size={18} />
                                <span>توليد الأرصدة</span>
                            </button>
                            <button
                                onClick={() => openModal()}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-sm shrink-0"
                            >
                                <Plus size={18} />
                                <span>تعيين رصيد</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي الموظفين</p>
                            <h3 className="text-2xl font-black text-dark-900 dark:text-white mt-1">{stats.totalEmployees}</h3>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي الأرصدة</p>
                            <h3 className="text-2xl font-black text-dark-900 dark:text-white mt-1">{stats.totalBalances}</h3>
                        </div>
                        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">الأيام المستخدمة</p>
                            <h3 className="text-2xl font-black text-amber-500 mt-1">{stats.totalUsedDays}</h3>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">الأيام المتبقية</p>
                            <h3 className="text-2xl font-black text-emerald-500 mt-1">{stats.totalRemainingDays}</h3>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 text-right">الموظف</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 text-right">نوع الإجازة</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 text-center">الرصيد الكلي</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 text-center">المستخدم</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 text-center">المتبقي</th>
                                    <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 text-left w-32">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {balances && balances.length > 0 ? (
                                    balances.map((balance) => (
                                        <tr key={balance.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-dark-900 dark:text-white">{balance.employee_name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{balance.employee_number}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
                                                    {balance.leave_type_name}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold text-slate-700 dark:text-slate-300">
                                                {balance.total_days}
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold text-amber-500">
                                                {balance.used_days}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-2 w-full max-w-[120px] mx-auto">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className={balance.remaining_days > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                                            {balance.remaining_days} يوم
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${balance.remaining_days > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${balance.total_days > 0 ? Math.min(100, Math.max(0, (balance.remaining_days / balance.total_days) * 100)) : 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-left">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(balance)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingBalanceId(balance.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-slate-500">
                                            {currentAcademicYearId ? 'لا توجد أرصدة إجازات في هذه السنة الدراسية. يمكنك توليدها تلقائياً.' : 'يرجى اختيار السنة الدراسية لعرض الأرصدة.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                                <Activity className="text-primary-500" />
                                {editingBalance ? 'تعديل الرصيد' : 'تعيين رصيد جديد'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {!editingBalance && (
                                <div>
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الموظف</label>
                                    <SelectInput
                                        options={employees.map(e => ({ value: e.id, label: e.name }))}
                                        value={data.employee_id}
                                        onChange={(val) => setData('employee_id', val || '')}
                                        placeholder="اختر الموظف"
                                    />
                                    {errors.employee_id && <p className="text-xs text-accent-500 mt-1">{errors.employee_id}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">نوع الإجازة</label>
                                <SelectInput
                                    options={leaveTypes.map(t => ({ value: t.id, label: t.name }))}
                                    value={data.leave_type_id}
                                    onChange={(val) => {
                                        setData('leave_type_id', val || '');
                                        if (!editingBalance && val) {
                                            const selectedType = leaveTypes.find(t => t.id == val);
                                            if (selectedType && selectedType.default_days !== null && selectedType.default_days !== undefined) {
                                                setData(prev => ({ ...prev, leave_type_id: val, total_days: selectedType.default_days }));
                                            }
                                        }
                                    }}
                                    placeholder="اختر النوع"
                                    disabled={!!editingBalance}
                                />
                                {errors.leave_type_id && <p className="text-xs text-accent-500 mt-1">{errors.leave_type_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الرصيد الكلي (أيام)</label>
                                <input
                                    type="number"
                                    value={data.total_days}
                                    onChange={e => setData('total_days', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-400"
                                    required
                                    min="0"
                                />
                                {errors.total_days && <p className="text-xs text-accent-500 mt-1">{errors.total_days}</p>}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Save size={20} />
                                    {processing ? 'جاري الحفظ...' : 'حفظ'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Modal */}
            {isGenerateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setIsGenerateModalOpen(false); genClearErrors(); }}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                                <Zap className="text-emerald-500" />
                                توليد أرصدة الإجازات
                            </h3>
                            <button onClick={() => { setIsGenerateModalOpen(false); genClearErrors(); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={submitGenerate} className="p-6 space-y-6">
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-sm font-semibold">
                                سيتم توليد أرصدة إجازات افتراضية للموظفين وأنواع الإجازات المحددة للعام الدراسي المحدد. يمكنك ترك التحديد فارغاً لتوليد الأرصدة للجميع.
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">تحديد الموظفين (اختياري)</label>
                                <SelectInput
                                    isMulti={true}
                                    value={genData.employee_ids}
                                    onChange={(val) => setGenData('employee_ids', val)}
                                    options={employees.map(emp => ({
                                        value: emp.id,
                                        label: emp.name
                                    }))}
                                    placeholder="اختر الموظفين (يترك فارغاً للكل)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">تحديد أنواع الإجازات (اختياري)</label>
                                <SelectInput
                                    isMulti={true}
                                    value={genData.leave_type_ids}
                                    onChange={(val) => setGenData('leave_type_ids', val)}
                                    options={leaveTypes.map(type => ({
                                        value: type.id,
                                        label: `${type.name} (الافتراضي: ${type.default_days} أيام)`
                                    }))}
                                    placeholder="اختر الأنواع (يترك فارغاً للكل)"
                                />
                            </div>

                            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">العدد المتوقع:</span>
                                <span className="text-lg font-black text-primary-600 dark:text-primary-400">
                                    {(genData.employee_ids.length || employees.length) * (genData.leave_type_ids.length || leaveTypes.length)}
                                </span>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={genProcessing}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Zap size={20} />
                                    {genProcessing ? 'جاري التوليد...' : 'توليد الأرصدة'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsGenerateModalOpen(false); genClearErrors(); }}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingBalanceId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeletingBalanceId(null)}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            هل أنت متأكد من حذف رصيد الإجازة هذا؟ لا يمكن الحذف إذا تم استخدام جزء منه بالفعل.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all"
                            >
                                نعم، احذف الرصيد
                            </button>
                            <button
                                onClick={() => setDeletingBalanceId(null)}
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
