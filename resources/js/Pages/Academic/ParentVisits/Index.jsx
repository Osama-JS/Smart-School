import React, { useState, useMemo } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit2, Trash2, Users, CheckCircle, AlertTriangle, CalendarDays, Search, X, User, Activity, Clock, FileText, CheckSquare, MessageSquare, Tag, Calendar, AlignLeft, UserPlus, BarChart3, Star, AlertCircle, LayoutGrid, List, Eye, MoreVertical } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import RichTextEditor from '@/Components/RichTextEditor';

export default function ParentVisits({ auth, visits, students, employees, filters, achievementTypes = [], violationTypes = [], activeAcademicYear }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
    const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
    const [editingVisit, setEditingVisit] = useState(null);
    
    // Fallback if filters is undefined
    const initialSearch = filters?.search || '';
    const initialStatus = filters?.status || '';

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [viewMode, setViewMode] = useState('table');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [viewingVisit, setViewingVisit] = useState(null);

    const { data, setData, post, put, delete: destroy, errors, reset, processing } = useForm({
        student_id: '',
        visitor_name: '',
        visitor_relation: '',
        employee_id: '',
        visit_date: '',
        visit_time: '',
        purpose_category: 'أكاديمي',
        purpose: '',
        status: 'مجدولة',
        notes: '',
    });

    const { data: achievementData, setData: setAchievementData, post: postAchievement, processing: achievementProcessing, errors: achievementErrors, reset: resetAchievement } = useForm({
        academic_year_id: activeAcademicYear?.id || '',
        student_achievement_type_id: '',
        points: 5,
        description: '',
    });

    const { data: violationData, setData: setViolationData, post: postViolation, processing: violationProcessing, errors: violationErrors, reset: resetViolation } = useForm({
        academic_year_id: activeAcademicYear?.id || '',
        violation_type_id: '',
        action_taken: '',
        details: '',
    });

    const openModal = (visit = null) => {
        setEditingVisit(visit);
        if (visit) {
            setData({
                student_id: visit.student_id,
                visitor_name: visit.visitor_name || '',
                visitor_relation: visit.visitor_relation || '',
                employee_id: visit.employee_id || '',
                visit_date: visit.visit_date ? visit.visit_date.split('T')[0] : '',
                visit_time: visit.visit_time ? visit.visit_time.substring(11, 16) : '',
                purpose_category: visit.purpose_category || 'أكاديمي',
                purpose: visit.purpose || '',
                status: visit.status || 'مجدولة',
                notes: visit.notes || '',
            });
        } else {
            reset();
            setData('status', 'مجدولة');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const openAchievementModal = (visit) => {
        setEditingVisit(visit);
        resetAchievement();
        setAchievementData('description', visit.notes || '');
        setIsAchievementModalOpen(true);
    };

    const openViolationModal = (visit) => {
        setEditingVisit(visit);
        resetViolation();
        setViolationData('details', visit.notes || '');
        setIsViolationModalOpen(true);
    };

    const submitAchievement = (e) => {
        e.preventDefault();
        postAchievement(route('academic.parent-visits.achievement', editingVisit.id), {
            onSuccess: () => setIsAchievementModalOpen(false)
        });
    };

    const submitViolation = (e) => {
        e.preventDefault();
        postViolation(route('academic.parent-visits.violation', editingVisit.id), {
            onSuccess: () => setIsViolationModalOpen(false)
        });
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingVisit) {
            put(route('academic.parent-visits.update', editingVisit.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('academic.parent-visits.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDelete = (visit) => {
        setEditingVisit(visit);
        setIsDeleteModalOpen(true);
    };

    const openViewModal = (visit) => {
        setViewingVisit(visit);
    };

    const closeViewModal = () => {
        setViewingVisit(null);
    };

    const deleteVisit = () => {
        destroy(route('academic.parent-visits.destroy', editingVisit.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const toggleStatus = (visit) => {
        const statuses = ['مجدولة', 'جارية', 'مكتملة', 'ملغاة'];
        const currentIndex = statuses.indexOf(visit.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        
        router.put(route('academic.parent-visits.update', visit.id), {
            ...visit,
            status: nextStatus
        }, {
            preserveScroll: true
        });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'مجدولة': return 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
            case 'جارية': return 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
            case 'مكتملة': return 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
            case 'ملغاة': return 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
            default: return 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'مجدولة': return <Clock size={12} />;
            case 'جارية': return <Activity size={12} />;
            case 'مكتملة': return <CheckCircle size={12} />;
            case 'ملغاة': return <AlertTriangle size={12} />;
            default: return <Activity size={12} />;
        }
    };

    // Client-side filtering (on the currently paginated data or we could just submit via router)
    const filteredVisits = useMemo(() => {
        if (!visits || !visits.data) return [];
        return visits.data.filter(v => {
            const matchesSearch = !searchQuery || 
                v.visitor_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                v.student?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === '' || v.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [visits, searchQuery, statusFilter]);

    // Update query params on search
    const handleSearch = () => {
        router.get(route('academic.parent-visits.index'), { search: searchQuery, status: statusFilter }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout user={auth.user} activeMenu="زيارات أولياء الأمور">
            <Head title="زيارات أولياء الأمور" />

            <div className="max-w-[1600px] mx-auto space-y-6">
                
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
                                <UserPlus size={28} className="text-primary-600" />
                                زيارات أولياء الأمور
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة وحجز زيارات أولياء الأمور للمدرسة ومتابعة حالتها</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                href={route('academic.parent-visits.analytics')}
                                className="flex items-center gap-2 px-5 py-3 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl hover:shadow-md transition-all active:scale-95 font-bold text-sm border border-slate-200 dark:border-slate-700 backdrop-blur-sm"
                            >
                                <BarChart3 size={18} className="text-primary-500" />
                                <span>التحليلات والإحصائيات</span>
                            </Link>
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>تسجيل زيارة جديدة</span>
                            </button>
                        </div>
                    </div>
                </div>
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6 mb-8">
                    <div className="bg-white dark:bg-[#121820]/80 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">إجمالي الزيارات</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{visits?.total || 0}</h3>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
                            <Users size={28} />
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-[#121820]/80 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">زيارات مكتملة</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                                {visits?.data?.filter(v => v.status === 'مكتملة').length || 0}
                            </h3>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                            <CheckCircle size={28} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/80 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">زيارات مجدولة</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                                {visits?.data?.filter(v => v.status === 'مجدولة').length || 0}
                            </h3>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                            <CalendarDays size={28} />
                        </div>
                    </div>
                </div>

                {/* Smart Toolbar */}
                <div className="bg-white dark:bg-[#0f1419] p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-3 w-full xl:w-auto">
                        {/* Status Tabs */}
                        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-full xl:w-auto overflow-x-auto custom-scrollbar shrink-0">
                            {[
                                { value: '', label: 'الكل' }, 
                                { value: 'مجدولة', label: '📅 مجدولة' }, 
                                { value: 'جارية', label: '🔄 جارية' },
                                { value: 'مكتملة', label: '✅ مكتملة' },
                                { value: 'ملغاة', label: '❌ ملغاة' }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setStatusFilter(opt.value); setTimeout(handleSearch, 100); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${statusFilter === opt.value ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* View Toggle */}
                        <div className="hidden md:flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl shrink-0">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="عرض جدول"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="عرض بطاقات"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-3 w-full xl:w-auto shrink-0 flex-1 xl:flex-none justify-end">
                        <div className="relative w-full max-w-sm flex">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث باسم الزائر أو الطالب..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full bg-slate-50 dark:bg-slate-800/40 border-none rounded-r-xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                            />
                            <button onClick={handleSearch} className="bg-primary-500 text-white px-4 rounded-l-xl text-sm font-bold hover:bg-primary-600 transition-colors">بحث</button>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {filteredVisits.length === 0 && (
                    <div className="bg-white dark:bg-[#0f1419] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-16 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5">
                            <UserPlus size={36} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-2">لا توجد زيارات مسجلة</h3>
                        <p className="text-sm text-slate-400 mb-6">ابدأ بتسجيل أول زيارة لولي أمر بالضغط على الزر أعلاه</p>
                        <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-primary-500/20">
                            <Plus size={18} />
                            تسجيل زيارة جديدة
                        </button>
                    </div>
                )}

                {/* ═══════════════ TABLE VIEW ═══════════════ */}
                {filteredVisits.length > 0 && viewMode === 'table' && (
                    <div className="bg-white dark:bg-[#0f1419] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-gradient-to-l from-slate-50 via-slate-50/80 to-white dark:from-slate-800/30 dark:via-slate-800/20 dark:to-transparent border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">الزائر</th>
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">الطالب</th>
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">موعد الزيارة</th>
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">المضيف</th>
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">الحالة</th>
                                        <th className="py-4 px-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                                    {filteredVisits.map((v) => (
                                        <tr key={v.id} className="hover:bg-primary-50/30 dark:hover:bg-primary-500/5 transition-colors duration-200 group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-500/15 dark:to-primary-500/5 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-xs shrink-0">
                                                        {v.visitor_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{v.visitor_name}</div>
                                                        <div className="text-xs text-slate-400 mt-0.5 font-medium">{v.visitor_relation}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-slate-400 shrink-0" />
                                                    <span className="font-bold text-slate-800 dark:text-white text-sm">{v.student?.user?.name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    <CalendarDays size={14} className="text-primary-500 shrink-0" />
                                                    {v.visit_date}
                                                </div>
                                                {v.visit_time && (
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1 mr-[22px]">
                                                        <Clock size={11} />
                                                        {v.visit_time.substring(11, 16)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                    {v.employee?.name || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <button 
                                                    onClick={() => toggleStatus(v)}
                                                    title="انقر لتغيير الحالة"
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black transition-all hover:scale-105 cursor-pointer ${getStatusStyle(v.status)}`}
                                                >
                                                    {getStatusIcon(v.status)}
                                                    {v.status}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {v.status === 'مكتملة' && (
                                                        <>
                                                            <button onClick={() => openAchievementModal(v)} title="تسجيل كإنجاز" className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all">
                                                                <Star size={14} />
                                                            </button>
                                                            <button onClick={() => openViolationModal(v)} title="تسجيل كمخالفة" className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all">
                                                                <AlertCircle size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => openViewModal(v)} title="عرض التفاصيل" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
                                                        <Eye size={14} />
                                                    </button>
                                                    <button onClick={() => openModal(v)} title="تعديل" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => confirmDelete(v)} title="حذف" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Table Footer */}
                        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">عرض {filteredVisits.length} من أصل {visits?.total || 0} زيارة</span>
                        </div>
                    </div>
                )}

                {/* ═══════════════ CARDS VIEW ═══════════════ */}
                {filteredVisits.length > 0 && viewMode === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredVisits.map((v) => {
                            const statusColorMap = {
                                'مجدولة': { border: 'border-amber-200 dark:border-amber-500/20', accent: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
                                'جارية': { border: 'border-blue-200 dark:border-blue-500/20', accent: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
                                'مكتملة': { border: 'border-emerald-200 dark:border-emerald-500/20', accent: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
                                'ملغاة': { border: 'border-rose-200 dark:border-rose-500/20', accent: 'from-rose-500 to-red-500', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400' },
                            };
                            const colors = statusColorMap[v.status] || statusColorMap['مجدولة'];

                            return (
                                <div key={v.id} className={`group bg-white dark:bg-[#0f1419] rounded-2xl border ${colors.border} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}>
                                    {/* Card Top Accent */}
                                    <div className={`h-1 bg-gradient-to-r ${colors.accent}`} />
                                    
                                    <div className="p-5">
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors.accent} flex items-center justify-center text-white font-black text-base shadow-md`}>
                                                    {v.visitor_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 dark:text-white text-sm">{v.visitor_name}</h4>
                                                    <span className="text-xs font-medium text-slate-400">{v.visitor_relation}</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => toggleStatus(v)}
                                                title="انقر لتغيير الحالة"
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 ${colors.bg} ${colors.text}`}
                                            >
                                                {getStatusIcon(v.status)}
                                                {v.status}
                                            </button>
                                        </div>

                                        {/* Card Body Details */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-2.5 text-sm">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                    <User size={13} className="text-slate-400" />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-slate-400 font-medium">الطالب</span>
                                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm -mt-0.5">{v.student?.user?.name || '—'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2.5 text-sm">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                    <CalendarDays size={13} className="text-primary-500" />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-slate-400 font-medium">موعد الزيارة</span>
                                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm -mt-0.5">
                                                        {v.visit_date}
                                                        {v.visit_time && <span className="text-slate-400 font-medium mr-2">• {v.visit_time.substring(11, 16)}</span>}
                                                    </p>
                                                </div>
                                            </div>

                                            {v.employee?.name && (
                                                <div className="flex items-center gap-2.5 text-sm">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <Users size={13} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-slate-400 font-medium">المضيف</span>
                                                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm -mt-0.5">{v.employee.name}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {v.purpose && (
                                                <div className="flex items-start gap-2.5 text-sm">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                                                        <FileText size={13} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-slate-400 font-medium">الغرض</span>
                                                        <p className="font-medium text-slate-600 dark:text-slate-300 text-xs leading-relaxed -mt-0.5 line-clamp-2">{v.purpose}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-1.5">
                                                {v.status === 'مكتملة' && (
                                                    <>
                                                        <button onClick={() => openAchievementModal(v)} title="تسجيل كإنجاز" className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all">
                                                            <Star size={14} />
                                                        </button>
                                                        <button onClick={() => openViolationModal(v)} title="تسجيل كمخالفة" className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all">
                                                            <AlertCircle size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => openViewModal(v)} title="عرض التفاصيل" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
                                                    <Eye size={14} />
                                                </button>
                                                <button onClick={() => openModal(v)} title="تعديل" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => confirmDelete(v)} title="حذف" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Footer */}
                {visits?.total > 0 && (
                    <div className="flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-400 bg-white dark:bg-[#0f1419] px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            عرض {filteredVisits.length} من {visits.total} زيارة
                        </span>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                 📝 Create/Edit Visit Modal - Premium Design
                ═══════════════════════════════════════════════════════════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white dark:bg-[#0f1419] rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/40 my-auto transform transition-all animate-in fade-in zoom-in-95 duration-300">
                        
                        {/* Gradient Header */}
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700" />
                            <div className="absolute inset-0 opacity-20">
                                <svg className="w-full h-full" viewBox="0 0 600 120" fill="none">
                                    <circle cx="500" cy="20" r="80" fill="white" fillOpacity="0.1" />
                                    <circle cx="50" cy="100" r="60" fill="white" fillOpacity="0.08" />
                                    <path d="M0 80 Q150 20 300 60 T600 40" stroke="white" strokeOpacity="0.15" strokeWidth="2" fill="none" />
                                </svg>
                            </div>
                            <div className="relative px-8 py-6 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary-700/20 border border-white/20">
                                        <UserPlus size={22} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight">
                                            {editingVisit ? 'تعديل زيارة ولي الأمر' : 'تسجيل زيارة جديدة'}
                                        </h3>
                                        <p className="text-primary-100/80 text-xs font-semibold mt-0.5">أدخل تفاصيل الزائر والموعد المرغوب</p>
                                    </div>
                                </div>
                                <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="p-8">
                            <form onSubmit={submit} className="space-y-6">
                                {/* Section: بيانات الزائر */}
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-black">1</div>
                                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">بيانات الزائر</span>
                                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800 mr-2"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                            <User size={14} className="text-primary-500" /> الطالب <span className="text-rose-500">*</span>
                                        </label>
                                        <SelectInput
                                            options={[{ value: '', label: '-- اختر الطالب --' }, ...students.map(s => ({ value: s.id, label: s.name }))]}
                                            value={data.student_id}
                                            onChange={val => setData('student_id', val)}
                                            className="w-full"
                                        />
                                        {errors.student_id && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.student_id}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                            <UserPlus size={14} className="text-primary-500" /> اسم الزائر <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white placeholder-slate-400"
                                            value={data.visitor_name}
                                            onChange={e => setData('visitor_name', e.target.value)}
                                            required
                                            placeholder="اسم ولي الأمر أو الزائر..."
                                        />
                                        {errors.visitor_name && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.visitor_name}</p>}
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                            <Users size={14} className="text-primary-500" /> صلة القرابة <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white placeholder-slate-400"
                                            value={data.visitor_relation}
                                            onChange={e => setData('visitor_relation', e.target.value)}
                                            required
                                            placeholder="أب، أم، أخ، إلخ..."
                                        />
                                        {errors.visitor_relation && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.visitor_relation}</p>}
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                            <User size={14} className="text-primary-500" /> الموظف المضيف <span className="text-slate-400 font-normal">(اختياري)</span>
                                        </label>
                                        <SelectInput
                                            options={[{ value: '', label: '-- بدون تحديد أو الإدارة العامة --' }, ...employees.map(e => ({ value: e.id, label: e.name }))]}
                                            value={data.employee_id}
                                            onChange={val => setData('employee_id', val)}
                                            className="w-full"
                                        />
                                        {errors.employee_id && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.employee_id}</p>}
                                    </div>
                                </div>

                                {/* Section: تفاصيل الزيارة */}
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-black">2</div>
                                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">تفاصيل الزيارة</span>
                                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800 mr-2"></div>
                                </div>
                                <div className="space-y-5 bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                                <CalendarDays size={14} className="text-primary-500" /> تاريخ الزيارة <span className="text-rose-500">*</span>
                                            </label>
                                            <FlatpickrInput
                                                type="date"
                                                value={data.visit_date}
                                                onChange={(val) => setData('visit_date', val)}
                                                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                                required
                                            />
                                            {errors.visit_date && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.visit_date}</p>}
                                        </div>
                                        
                                        <div>
                                            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                                <Clock size={14} className="text-primary-500" /> وقت الزيارة <span className="text-slate-400 font-normal">(اختياري)</span>
                                            </label>
                                            <input
                                                type="time"
                                                value={data.visit_time}
                                                onChange={(e) => setData('visit_time', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                                <Activity size={14} className="text-primary-500" /> الحالة
                                            </label>
                                            <SelectInput
                                                options={[
                                                    { value: 'مجدولة', label: '📅 مجدولة' },
                                                    { value: 'جارية', label: '🔄 جارية' },
                                                    { value: 'مكتملة', label: '✅ مكتملة' },
                                                    { value: 'ملغاة', label: '❌ ملغاة' }
                                                ]}
                                                value={data.status}
                                                onChange={val => setData('status', val)}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-1">
                                            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                                <Tag size={14} className="text-primary-500" /> التصنيف
                                            </label>
                                            <SelectInput
                                                options={[
                                                    { value: 'أكاديمي', label: 'أكاديمي' },
                                                    { value: 'سلوكي', label: 'سلوكي' },
                                                    { value: 'مالي', label: 'مالي' },
                                                    { value: 'إداري/أخرى', label: 'إداري/أخرى' }
                                                ]}
                                                value={data.purpose_category}
                                                onChange={val => setData('purpose_category', val)}
                                                className="w-full"
                                            />
                                            {errors.purpose_category && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.purpose_category}</p>}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                                <FileText size={14} className="text-primary-500" /> الغرض التفصيلي
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white placeholder-slate-400"
                                                value={data.purpose}
                                                onChange={e => setData('purpose', e.target.value)}
                                                placeholder="سبب الزيارة (مثال: متابعة مستوى الطالب...)"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                            <MessageSquare size={14} className="text-primary-500" /> ملاحظات إضافية
                                        </label>
                                        <RichTextEditor
                                            value={data.notes}
                                            onChange={val => setData('notes', val)}
                                            placeholder="أي ملاحظات عامة حول الزيارة أو نتائجها..."
                                        />
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-5 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-6 py-3 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-all active:scale-95">
                                        إلغاء
                                    </button>
                                    <button disabled={processing} type="submit" className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">
                                        {processing ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <CheckSquare size={18} />
                                        )}
                                        <span>{processing ? 'جارِ الحفظ...' : 'حفظ الزيارة'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                 🗑️ Delete Confirmation Modal - Premium Design
                ═══════════════════════════════════════════════════════════════ */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#0f1419] rounded-[2rem] w-full max-w-sm shadow-2xl border border-slate-200/60 dark:border-slate-700/40 transform transition-all animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                        {/* Red accent bar */}
                        <div className="h-1.5 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600" />
                        
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-500/15 dark:to-rose-500/5 text-rose-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 relative shadow-lg shadow-rose-500/10">
                                <Trash2 size={32} className="relative z-10" />
                                <div className="absolute inset-0 bg-rose-500/10 rounded-[1.5rem] blur-xl animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">تأكيد الحذف</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-sm leading-relaxed">
                                هل أنت متأكد من حذف سجل هذه الزيارة؟<br />
                                <span className="text-rose-500 font-bold">لا يمكن التراجع عن هذا الإجراء.</span>
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-all active:scale-95">
                                    إلغاء
                                </button>
                                <button onClick={deleteVisit} disabled={processing} className="flex-1 py-3.5 text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl font-bold transition-all shadow-lg shadow-rose-500/25 active:scale-95 disabled:opacity-60">
                                    {processing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            جارِ الحذف...
                                        </span>
                                    ) : 'تأكيد الحذف'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                 🌟 Achievement Modal - Premium Design
                ═══════════════════════════════════════════════════════════════ */}
            {isAchievementModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md">
                    <div className="fixed inset-0" onClick={() => setIsAchievementModalOpen(false)} />
                    <div className="bg-white dark:bg-[#0f1419] rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/40 relative z-10 transform transition-all animate-in fade-in zoom-in-95 duration-300">
                        
                        {/* Amber gradient header */}
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500" />
                            <div className="absolute inset-0 opacity-20">
                                <svg className="w-full h-full" viewBox="0 0 500 100" fill="none">
                                    <circle cx="420" cy="10" r="70" fill="white" fillOpacity="0.12" />
                                    <circle cx="30" cy="80" r="50" fill="white" fillOpacity="0.08" />
                                </svg>
                            </div>
                            <div className="relative px-7 py-5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-amber-700/20 border border-white/20">
                                        <Star size={20} className="text-white" fill="white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white tracking-tight">تسجيل كإنجاز</h3>
                                        <p className="text-amber-100/70 text-xs font-semibold mt-0.5">إضافة إنجاز لملف الطالب بناءً على الزيارة</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setIsAchievementModalOpen(false)} className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={submitAchievement}>
                            <div className="p-7 space-y-5">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                        <Tag size={14} className="text-amber-500" /> نوع الإنجاز
                                    </label>
                                    <SelectInput
                                        options={achievementTypes.map(t => ({ value: t.id, label: t.name }))}
                                        value={achievementData.student_achievement_type_id}
                                        onChange={val => setAchievementData('student_achievement_type_id', val)}
                                        className="w-full"
                                        required
                                    />
                                    {achievementErrors.student_achievement_type_id && <p className="text-xs text-rose-500 font-semibold mt-1.5">{achievementErrors.student_achievement_type_id}</p>}
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                        <Star size={14} className="text-amber-500" /> النقاط
                                    </label>
                                    <input
                                        type="number"
                                        value={achievementData.points}
                                        onChange={e => setAchievementData('points', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white"
                                        required
                                        min="1"
                                    />
                                    {achievementErrors.points && <p className="text-xs text-rose-500 font-semibold mt-1.5">{achievementErrors.points}</p>}
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                        <FileText size={14} className="text-amber-500" /> الوصف / التفاصيل
                                    </label>
                                    <textarea
                                        value={achievementData.description}
                                        onChange={e => setAchievementData('description', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white placeholder-slate-400 resize-none"
                                        rows="3"
                                        required
                                        placeholder="وصف الإنجاز أو النتائج الإيجابية للزيارة..."
                                    ></textarea>
                                    {achievementErrors.description && <p className="text-xs text-rose-500 font-semibold mt-1.5">{achievementErrors.description}</p>}
                                </div>
                            </div>
                            <div className="px-7 pb-7 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAchievementModalOpen(false)} className="px-6 py-3 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-all active:scale-95">إلغاء</button>
                                <button type="submit" disabled={achievementProcessing} className="flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl font-bold shadow-lg shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-60">
                                    {achievementProcessing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Star size={16} fill="white" />
                                    )}
                                    <span>{achievementProcessing ? 'جارِ التسجيل...' : 'تسجيل الإنجاز'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                 ⚠️ Violation Modal - Premium Design
                ═══════════════════════════════════════════════════════════════ */}
            {isViolationModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md">
                    <div className="fixed inset-0" onClick={() => setIsViolationModalOpen(false)} />
                    <div className="bg-white dark:bg-[#0f1419] rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/40 relative z-10 transform transition-all animate-in fade-in zoom-in-95 duration-300">
                        
                        {/* Rose gradient header */}
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-400 via-rose-500 to-red-600" />
                            <div className="absolute inset-0 opacity-20">
                                <svg className="w-full h-full" viewBox="0 0 500 100" fill="none">
                                    <circle cx="420" cy="10" r="70" fill="white" fillOpacity="0.12" />
                                    <circle cx="30" cy="80" r="50" fill="white" fillOpacity="0.08" />
                                </svg>
                            </div>
                            <div className="relative px-7 py-5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-rose-700/20 border border-white/20">
                                        <AlertCircle size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white tracking-tight">تسجيل كمخالفة</h3>
                                        <p className="text-rose-100/70 text-xs font-semibold mt-0.5">توثيق مخالفة في سجل الطالب بناءً على الزيارة</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setIsViolationModalOpen(false)} className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={submitViolation}>
                            <div className="p-7 space-y-5">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                        <Tag size={14} className="text-rose-500" /> نوع المخالفة
                                    </label>
                                    <SelectInput
                                        options={violationTypes.map(t => ({ value: t.id, label: t.name }))}
                                        value={violationData.violation_type_id}
                                        onChange={val => setViolationData('violation_type_id', val)}
                                        className="w-full"
                                        required
                                    />
                                    {violationErrors.violation_type_id && <p className="text-xs text-rose-500 font-semibold mt-1.5">{violationErrors.violation_type_id}</p>}
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                        <CheckSquare size={14} className="text-rose-500" /> الإجراء المتخذ
                                    </label>
                                    <input
                                        type="text"
                                        value={violationData.action_taken}
                                        onChange={e => setViolationData('action_taken', e.target.value)}
                                        placeholder="مثال: لفت نظر، أخذ تعهد، حسم درجة"
                                        className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all dark:text-white placeholder-slate-400"
                                        required
                                    />
                                    {violationErrors.action_taken && <p className="text-xs text-rose-500 font-semibold mt-1.5">{violationErrors.action_taken}</p>}
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                        <FileText size={14} className="text-rose-500" /> التفاصيل / الملاحظات
                                    </label>
                                    <textarea
                                        value={violationData.details}
                                        onChange={e => setViolationData('details', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all dark:text-white placeholder-slate-400 resize-none"
                                        rows="3"
                                        required
                                        placeholder="تفاصيل المخالفة أو ما تم نقاشه مع ولي الأمر..."
                                    ></textarea>
                                    {violationErrors.details && <p className="text-xs text-rose-500 font-semibold mt-1.5">{violationErrors.details}</p>}
                                </div>
                            </div>
                            <div className="px-7 pb-7 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsViolationModalOpen(false)} className="px-6 py-3 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-all active:scale-95">إلغاء</button>
                                <button type="submit" disabled={violationProcessing} className="flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 rounded-xl font-bold shadow-lg shadow-rose-500/25 transition-all active:scale-95 disabled:opacity-60">
                                    {violationProcessing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <AlertCircle size={16} />
                                    )}
                                    <span>{violationProcessing ? 'جارِ التسجيل...' : 'تسجيل المخالفة'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                 👁️ View Visit Details Modal
                ═══════════════════════════════════════════════════════════════ */}
            {viewingVisit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white dark:bg-[#0f1419] rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/40 my-auto transform transition-all animate-in fade-in zoom-in-95 duration-300">
                        
                        {/* Gradient Header */}
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700" />
                            <div className="absolute inset-0 opacity-20">
                                <svg className="w-full h-full" viewBox="0 0 600 120" fill="none">
                                    <circle cx="500" cy="20" r="80" fill="white" fillOpacity="0.1" />
                                    <circle cx="50" cy="100" r="60" fill="white" fillOpacity="0.08" />
                                </svg>
                            </div>
                            <div className="relative px-8 py-6 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary-700/20 border border-white/20">
                                        <FileText size={22} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight">
                                            تفاصيل الزيارة
                                        </h3>
                                        <p className="text-primary-100/80 text-xs font-semibold mt-0.5">عرض شامل لمعلومات زيارة ولي الأمر</p>
                                    </div>
                                </div>
                                <button onClick={closeViewModal} className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* الزائر */}
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                            <User size={16} />
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">بيانات الزائر</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-xs text-slate-400 block mb-0.5">الاسم</span>
                                            <p className="font-black text-slate-800 dark:text-white">{viewingVisit.visitor_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400 block mb-0.5">صلة القرابة</span>
                                            <p className="font-bold text-slate-600 dark:text-slate-300">{viewingVisit.visitor_relation}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* الطالب */}
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <Users size={16} />
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">بيانات الطالب</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-xs text-slate-400 block mb-0.5">الاسم</span>
                                            <p className="font-black text-slate-800 dark:text-white">{viewingVisit.student?.user?.name || '—'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* الموعد */}
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                            <CalendarDays size={16} />
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">موعد الزيارة</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-xs text-slate-400 block mb-0.5">التاريخ</span>
                                            <p className="font-black text-slate-800 dark:text-white">{viewingVisit.visit_date}</p>
                                        </div>
                                        {viewingVisit.visit_time && (
                                            <div>
                                                <span className="text-xs text-slate-400 block mb-0.5">الوقت</span>
                                                <p className="font-bold text-slate-600 dark:text-slate-300">{viewingVisit.visit_time.substring(11, 16)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* المضيف */}
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                            <UserPlus size={16} />
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">المضيف</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-xs text-slate-400 block mb-0.5">اسم الموظف/المعلم</span>
                                            <p className="font-black text-slate-800 dark:text-white">{viewingVisit.employee?.name || 'لم يحدد'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* الحالة */}
                                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                                <Activity size={16} />
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">الحالة الحالية</span>
                                        </div>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black uppercase ${getStatusStyle(viewingVisit.status)}`}>
                                            {getStatusIcon(viewingVisit.status)}
                                            {viewingVisit.status}
                                        </div>
                                    </div>
                                </div>

                                {/* الغرض والملاحظات */}
                                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                            <FileText size={16} />
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">الغرض والملاحظات</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs text-slate-400 block mb-1">التصنيف</span>
                                            <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mb-3">
                                                {viewingVisit.purpose_category || 'أكاديمي'}
                                            </p>
                                            <span className="text-xs text-slate-400 block mb-1">الغرض التفصيلي</span>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                                {viewingVisit.purpose || 'لا يوجد'}
                                            </p>
                                        </div>
                                        {viewingVisit.notes && (
                                            <div>
                                                <span className="text-xs text-slate-400 block mb-1">الملاحظات أو التوصيات (إن وجدت)</span>
                                                <div 
                                                    className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 prose dark:prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: viewingVisit.notes }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="px-8 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button 
                                type="button" 
                                onClick={closeViewModal}
                                className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
