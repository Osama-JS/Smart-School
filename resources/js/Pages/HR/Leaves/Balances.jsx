import React, { useState, useMemo, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Activity, Plus, Edit2, Zap, Save, X, Users, CheckCircle, Clock, Search, ShieldAlert, FolderOpen, AlertCircle, Trash2, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import Swal from 'sweetalert2';

export default function LeaveBalancesIndex({ balances, academicYears, currentAcademicYearId, leaveTypes, employees, isSystemAdmin, branches = [], filters = {}, currentBranchId }) {
    const { flash } = usePage().props;
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingBalance, setEditingBalance] = useState(null);
    const [isGenerateDrawerOpen, setIsGenerateDrawerOpen] = useState(false);
    const [deletingBalanceId, setDeletingBalanceId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Smart Table States
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [columnFilters, setColumnFilters] = useState({ employee: '', leaveType: '', status: '' });

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

    const { delete: destroy, processing: deleting } = useForm();

    const stats = {
        totalEmployees: new Set(balances?.map(b => b.employee_id)).size || 0,
        totalBalances: balances?.length || 0,
        totalUsedDays: balances?.reduce((sum, b) => sum + b.used_days, 0) || 0,
        totalRemainingDays: balances?.reduce((sum, b) => sum + b.remaining_days, 0) || 0
    };

    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        const swalConfig = {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
        };

        if (flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'عذراً!',
                text: flash.error,
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#ef4444',
                ...swalConfig
            });
        }
    }, [flash]);

    const handleYearChange = (val) => {
        router.get(route('hr.leave-balances'), { academic_year_id: val, branch_id: filters?.branch_id }, { preserveState: true });
    };

    const handleBranchChange = (val) => {
        router.get(route('hr.leave-balances'), { branch_id: val, academic_year_id: currentAcademicYearId }, { preserveState: true });
    };

    const handleGenerate = () => {
        if (!currentAcademicYearId) {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه',
                text: 'يرجى اختيار السنة الدراسية أولاً لتتمكن من توليد الأرصدة.',
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }
        setGenData({
            academic_year_id: currentAcademicYearId,
            employee_ids: [],
            leave_type_ids: [],
        });
        genClearErrors();
        setIsGenerateDrawerOpen(true);
    };

    const submitGenerate = (e) => {
        e.preventDefault();
        genPost(route('hr.leave-balances.generate'), {
            onSuccess: () => {
                setIsGenerateDrawerOpen(false);
                genReset();
                genClearErrors();
            }
        });
    };

    const openDrawer = (balance = null) => {
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
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setEditingBalance(null);
        reset();
        clearErrors();
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('hr.leave-balances.store'), {
            onSuccess: () => closeDrawer(),
        });
    };

    const confirmDelete = () => {
        if (deletingBalanceId) {
            destroy(route('hr.leave-balances.destroy', deletingBalanceId), {
                onSuccess: () => setDeletingBalanceId(null)
            });
        }
    };

    // Sorting Helper
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredBalances = useMemo(() => {
        if (!balances) return [];
        
        // 1. Apply global search
        let filtered = balances.filter(b => 
            !searchQuery || 
            b.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.employee_number.toString().includes(searchQuery)
        );

        // 2. Apply column inline filters
        if (columnFilters.employee) {
            filtered = filtered.filter(b => 
                b.employee_name.toLowerCase().includes(columnFilters.employee.toLowerCase()) ||
                b.employee_number.toString().includes(columnFilters.employee)
            );
        }
        
        if (columnFilters.leaveType) {
            filtered = filtered.filter(b => b.leave_type_id == columnFilters.leaveType);
        }
        
        if (columnFilters.status) {
            filtered = filtered.filter(b => {
                const percentage = b.total_days > 0 ? (b.used_days / b.total_days) * 100 : 0;
                if (columnFilters.status === 'full') return percentage < 40;
                if (columnFilters.status === 'low') return percentage >= 40 && percentage < 100;
                if (columnFilters.status === 'empty') return percentage >= 100;
                return true;
            });
        }

        // 3. Apply sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                
                // Special calculated field for sorting
                if (sortConfig.key === 'percentage') {
                    aValue = a.total_days > 0 ? (a.used_days / a.total_days) * 100 : 0;
                    bValue = b.total_days > 0 ? (b.used_days / b.total_days) * 100 : 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [balances, searchQuery, columnFilters, sortConfig]);

    // Helpers
    const getInitials = (name) => {
        if (!name) return 'م';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name) => {
        const charCode = name?.charCodeAt(0) || 0;
        const colors = [
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
            'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
            'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
            'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
            'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-400',
            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
        ];
        return colors[charCode % colors.length];
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <div className="w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-50 transition-opacity"><ChevronUp size={14} /></div>;
        return sortConfig.direction === 'asc' 
            ? <div className="w-4 h-4 flex items-center justify-center text-primary-500"><ChevronUp size={14} /></div>
            : <div className="w-4 h-4 flex items-center justify-center text-primary-500"><ChevronDown size={14} /></div>;
    };

    return (
        <AdminLayout activeMenu="أرصدة الإجازات">
            <Head title="أرصدة الإجازات" />

            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
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
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تتبع مستحقات الإجازات والرصيد المتبقي بدقة</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                            <button
                                onClick={handleGenerate}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
                            >
                                <Zap size={18} />
                                <span>توليد الأرصدة</span>
                            </button>
                            <button
                                onClick={() => openDrawer()}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-md shadow-primary-500/20 active:scale-95 shrink-0"
                            >
                                <Plus size={18} />
                                <span>تعيين رصيد مخصص</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-indigo-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <Users className="text-indigo-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الموظفين</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.totalEmployees}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-primary-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <Activity className="text-primary-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الأرصدة</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.totalBalances}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-amber-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <Clock className="text-amber-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الأيام المستخدمة</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.totalUsedDays}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-emerald-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <CheckCircle className="text-emerald-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الأيام المتبقية</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.totalRemainingDays}</h4>
                        </div>
                    </div>
                </div>

                {/* Smart Toolbar */}
                <div className="bg-white dark:bg-[#121820]/60 p-3 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
                        {isSystemAdmin && (
                            <div className="w-full sm:w-48">
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
                        <div className="w-full sm:w-56">
                            <SelectInput
                                value={currentAcademicYearId}
                                onChange={handleYearChange}
                                options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                                placeholder="السنة الدراسية"
                            />
                        </div>
                    </div>

                    <div className="w-full lg:w-auto relative max-w-sm shrink-0 flex-1 lg:flex-none">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="بحث شامل بالموظف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/40 border-none rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                        />
                    </div>
                </div>

                {/* Smart Table Area */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    {filteredBalances.length === 0 && !columnFilters.employee && !columnFilters.leaveType && !columnFilters.status && !searchQuery ? (
                        <div className="py-24 px-6 text-center flex flex-col items-center">
                            <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6 text-primary-500 relative">
                                <FolderOpen size={40} className="relative z-10" />
                                <div className="absolute inset-0 bg-primary-500 opacity-20 rounded-full blur-xl animate-pulse" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
                                {currentAcademicYearId ? 'لا توجد أرصدة إجازات حالياً' : 'يرجى اختيار السنة الدراسية'}
                            </h3>
                            <p className="text-slate-500 text-sm font-semibold max-w-sm mb-6 leading-relaxed">
                                {currentAcademicYearId ? 'يمكنك توليد الأرصدة تلقائياً أو إضافتها بشكل مخصص لكل موظف.' : 'يجب تحديد السنة الدراسية لعرض أرصدة الإجازات الخاصة بها.'}
                            </p>
                            {currentAcademicYearId && (
                                <button
                                    onClick={handleGenerate}
                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    <Zap size={18} />
                                    <span>توليد الأرصدة الآن</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar">
                            <table className="w-full text-right min-w-[950px]">
                                <thead className="sticky top-0 z-20 backdrop-blur-xl bg-white/95 dark:bg-[#121820]/95 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th 
                                            className="py-4 px-6 text-sm font-black text-slate-600 dark:text-slate-300 cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                            onClick={() => requestSort('employee_name')}
                                        >
                                            <div className="flex items-center gap-2">الموظف <SortIcon columnKey="employee_name" /></div>
                                        </th>
                                        <th 
                                            className="py-4 px-6 text-sm font-black text-slate-600 dark:text-slate-300 cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                            onClick={() => requestSort('leave_type_name')}
                                        >
                                            <div className="flex items-center gap-2">نوع الإجازة <SortIcon columnKey="leave_type_name" /></div>
                                        </th>
                                        <th 
                                            className="py-4 px-6 text-sm font-black text-slate-600 dark:text-slate-300 text-center cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors w-28"
                                            onClick={() => requestSort('total_days')}
                                        >
                                            <div className="flex items-center justify-center gap-2">الرصيد <SortIcon columnKey="total_days" /></div>
                                        </th>
                                        <th 
                                            className="py-4 px-6 text-sm font-black text-slate-600 dark:text-slate-300 cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors w-56"
                                            onClick={() => requestSort('percentage')}
                                        >
                                            <div className="flex items-center gap-2">الاستهلاك والنسبة <SortIcon columnKey="percentage" /></div>
                                        </th>
                                        <th className="py-4 px-6 text-sm font-black text-slate-600 dark:text-slate-300 w-28 text-left">إجراءات</th>
                                    </tr>
                                    <tr className="bg-slate-50/60 dark:bg-slate-800/30 border-b border-slate-100/80 dark:border-slate-800/80">
                                        <th className="py-2.5 px-4">
                                            <div className="relative">
                                                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="فلترة بالموظف..." 
                                                    value={columnFilters.employee}
                                                    onChange={(e) => setColumnFilters(prev => ({...prev, employee: e.target.value}))}
                                                    className="w-full text-xs py-2 pr-8 pl-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 dark:text-slate-300 shadow-sm"
                                                />
                                            </div>
                                        </th>
                                        <th className="py-2.5 px-4">
                                            <select
                                                value={columnFilters.leaveType}
                                                onChange={(e) => setColumnFilters(prev => ({...prev, leaveType: e.target.value}))}
                                                className="w-full text-xs py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer"
                                            >
                                                <option value="">جميع الأنواع</option>
                                                {leaveTypes.map(lt => (
                                                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                                                ))}
                                            </select>
                                        </th>
                                        <th className="py-2.5 px-4"></th>
                                        <th className="py-2.5 px-4">
                                            <select
                                                value={columnFilters.status}
                                                onChange={(e) => setColumnFilters(prev => ({...prev, status: e.target.value}))}
                                                className="w-full text-xs py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-semibold text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer"
                                            >
                                                <option value="">جميع الحالات</option>
                                                <option value="full">متاح / آمن (أقل من 40%)</option>
                                                <option value="low">منخفض (أكثر من 40%)</option>
                                                <option value="empty">مستنفذ (100%)</option>
                                            </select>
                                        </th>
                                        <th className="py-2.5 px-4 text-left">
                                            <button 
                                                onClick={() => {
                                                    setColumnFilters({ employee: '', leaveType: '', status: '' });
                                                    setSortConfig({ key: null, direction: 'asc' });
                                                    setSearchQuery('');
                                                }}
                                                className="text-xs px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 font-bold transition-colors w-full shadow-sm"
                                                title="إعادة ضبط الفلاتر"
                                            >
                                                <Filter size={12} /> مسح
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filteredBalances.length > 0 ? (
                                        filteredBalances.map((balance) => {
                                            const percentage = balance.total_days > 0 ? Math.min(100, Math.max(0, (balance.used_days / balance.total_days) * 100)) : 0;
                                            let barColor = 'bg-emerald-500';
                                            if (percentage > 80) barColor = 'bg-rose-500';
                                            else if (percentage >= 40) barColor = 'bg-amber-500';

                                            return (
                                                <tr key={balance.id} className="even:bg-slate-50/50 dark:even:bg-[#161d27] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                                    <td className="py-3 px-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${getAvatarColor(balance.employee_name)}`}>
                                                                {getInitials(balance.employee_name)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{balance.employee_name}</div>
                                                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">#{balance.employee_number}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-6">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#1a222e] border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm">
                                                            {balance.leave_type_name}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-6 text-center">
                                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                                            <span className="font-black text-slate-800 dark:text-white">{balance.total_days}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-6">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center justify-between text-xs font-bold">
                                                                <span className="text-slate-500">مستخدم: <span className="text-slate-800 dark:text-white">{balance.used_days}</span></span>
                                                                <span className={balance.remaining_days > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                                                    متبقي: {balance.remaining_days}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2.5 overflow-hidden flex shadow-inner">
                                                                <div 
                                                                    className={`h-full rounded-full transition-all duration-700 ease-out ${barColor} relative overflow-hidden`}
                                                                    style={{ width: `${percentage}%` }}
                                                                >
                                                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openDrawer(balance)}
                                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a222e] border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-primary-600 hover:border-primary-200 dark:hover:border-primary-900 transition-all opacity-0 group-hover:opacity-100 shadow-sm hover:shadow"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingBalanceId(balance.id)}
                                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a222e] border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900 transition-all opacity-0 group-hover:opacity-100 shadow-sm hover:shadow"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-16 text-center text-slate-500">
                                                <div className="flex flex-col items-center">
                                                    <Search size={32} className="text-slate-300 dark:text-slate-600 mb-3" />
                                                    <p className="font-bold">لم يتم العثور على نتائج تطابق خيارات الفلترة.</p>
                                                    <button onClick={() => {
                                                        setColumnFilters({ employee: '', leaveType: '', status: '' });
                                                        setSearchQuery('');
                                                    }} className="text-primary-500 hover:text-primary-600 mt-2 text-sm font-semibold">مسح الفلاتر</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeDrawer}></div>
                    
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh]">
                    
                    <div className="relative p-6 sm:p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-primary-600"></div>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-dark-900 dark:text-white tracking-tight">
                                        {editingBalance ? 'تعديل رصيد الإجازة' : 'تعيين رصيد جديد'}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">
                                        {editingBalance ? 'قم بتحديث أيام الإجازة المخصصة' : 'أدخل البيانات المطلوبة لتعيين الرصيد'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={closeDrawer} 
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                        <form onSubmit={submit} className="space-y-6" id="balanceForm">
                            {!editingBalance && (
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                    <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">
                                        الموظف <span className="text-rose-500">*</span>
                                    </label>
                                    <SelectInput
                                        options={employees.map(e => ({ value: e.id, label: e.name }))}
                                        value={data.employee_id}
                                        onChange={(val) => setData('employee_id', val || '')}
                                        placeholder="اختر الموظف"
                                    />
                                    {errors.employee_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.employee_id}</p>}
                                </div>
                            )}

                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">
                                    نوع الإجازة <span className="text-rose-500">*</span>
                                </label>
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
                                {errors.leave_type_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.leave_type_id}</p>}
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">
                                    الرصيد الكلي (أيام) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={data.total_days}
                                    onChange={e => setData('total_days', e.target.value)}
                                    className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                    required
                                    min="0"
                                />
                                {errors.total_days && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.total_days}</p>}
                            </div>
                        </form>
                    </div>
                    
                    <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col gap-3">
                        <button
                            type="submit"
                            form="balanceForm"
                            disabled={processing}
                            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98]"
                        >
                            <Save size={20} />
                            {editingBalance ? 'حفظ التعديلات' : 'تعيين الرصيد'}
                        </button>
                        <button
                            type="button"
                            onClick={closeDrawer}
                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
                </div>
            )}

            {/* Generate Balances Modal */}
            {isGenerateDrawerOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => { setIsGenerateDrawerOpen(false); genClearErrors(); }}></div>
                    
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh]">
                    
                    <div className="relative p-6 sm:p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                        <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-600"></div>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-dark-900 dark:text-white tracking-tight">
                                        توليد الأرصدة التلقائي
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">
                                        توليد أرصدة الإجازات دفعة واحدة للموظفين
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setIsGenerateDrawerOpen(false); genClearErrors(); }} 
                                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors shrink-0 shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                        <form onSubmit={submitGenerate} className="space-y-6" id="generateForm">
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3">
                                <ShieldAlert className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed">
                                    سيتم توليد أرصدة إجازات افتراضية للموظفين وأنواع الإجازات المحددة للعام الدراسي المحدد. يمكنك ترك الخيارات فارغة لتوليدها لجميع الموظفين وكافة الأنواع.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-dark-900 dark:text-white">
                                    تحديد الموظفين <span className="text-slate-400 font-normal">(اختياري)</span>
                                </label>
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

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-dark-900 dark:text-white">
                                    تحديد أنواع الإجازات <span className="text-slate-400 font-normal">(اختياري)</span>
                                </label>
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

                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">العدد المتوقع توليده:</span>
                                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                        {(genData.employee_ids.length || employees.length) * (genData.leave_type_ids.length || leaveTypes.length)}
                                    </span>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col gap-3">
                        <button
                            type="submit"
                            form="generateForm"
                            disabled={genProcessing}
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]"
                        >
                            <Zap size={20} />
                            {genProcessing ? 'جاري التوليد...' : 'بدء توليد الأرصدة الآن'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setIsGenerateDrawerOpen(false); genClearErrors(); }}
                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingBalanceId && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setDeletingBalanceId(null)}></div>
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col">
                        <div className="p-8 text-center flex-1">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-dark-900 dark:text-white mb-3">تأكيد الحذف</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                                هل أنت متأكد من حذف رصيد الإجازة هذا؟
                                <br />لن يتم الحذف إذا تم استخدام جزء منه بالفعل لضمان سلامة البيانات.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {deleting ? 'جاري الحذف...' : 'نعم، احذف الرصيد'}
                            </button>
                            <button
                                onClick={() => setDeletingBalanceId(null)}
                                className="sm:w-1/3 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
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
