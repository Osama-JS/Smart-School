import React, { useState, useRef, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { 
    Search, Filter, MoreVertical, CheckCircle, XCircle, Clock, Info,
    X, RotateCcw, Download, Printer, LayoutGrid, List, FileText, ChevronDown,
    Building, ShieldCheck, Mail, Calendar, Eye, AlertTriangle, ArrowUpDown, 
    RefreshCw, Sparkles, Compass, Lock, Flag
} from 'lucide-react';

export default function ApprovalsIndex() {
    const { flash } = usePage().props;

    // Interactive approvals state
    const [approvals, setApprovals] = useState([
        {
            id: 'REQ-012',
            employee: 'أحمد محمود',
            type: 'إجازة اعتيادية',
            date: '2026-06-01',
            status: 'بانتظار اعتمادك',
            priority: 'عالية',
            notes: 'يرجى التكرم بالموافقة على طلب الإجازة السنوية نظراً لظروف عائلية طارئة، شاكراً ومقدراً تعاونكم.',
            leave_balance: { remaining: 12, total: 30 },
            attachment: { name: 'تقرير_طبي.png', size: '1.2 MB', url: '/images/medical_report_1780688440889.png' },
            timeline: [
                { role: 'مدير القسم (أنت)', status: 'pending', name: 'أحمد الإداري', date: '' },
                { role: 'شؤون الموظفين', status: 'waiting', name: 'سارة شؤون الموظفين', date: '' },
                { role: 'المدير العام', status: 'waiting', name: 'د. خالد المدير العام', date: '' },
            ]
        },
        {
            id: 'REQ-015',
            employee: 'نورة محمد',
            type: 'سلفة مالية',
            date: '2026-06-03',
            status: 'بانتظار اعتمادك',
            priority: 'عادية',
            notes: 'طلب سلفة مالية طارئة لتغطية مصاريف دراسية جامعية للأولاد، مع خالص الشكر والامتنان.',
            leave_balance: null,
            attachment: { name: 'إيصال_الرسوم.png', size: '840 KB', url: '/images/invoice_receipt_1780688414076.png' },
            timeline: [
                { role: 'مدير القسم (أنت)', status: 'pending', name: 'أحمد الإداري', date: '' },
                { role: 'شؤون الموظفين', status: 'waiting', name: 'سارة شؤون الموظفين', date: '' },
                { role: 'المدير العام', status: 'waiting', name: 'د. خالد المدير العام', date: '' },
            ]
        },
        {
            id: 'REQ-002',
            employee: 'عمر عبدالله',
            type: 'إجازة اضطرارية',
            date: '2026-05-28',
            status: 'معتمد',
            priority: 'عالية',
            notes: 'إجازة اضطرارية بسبب السفر المفاجئ لتجديد بعض الأوراق الرسمية.',
            leave_balance: { remaining: 8, total: 30 },
            attachment: { name: 'تذكرة_السفر.png', size: '1.8 MB', url: '/images/flight_ticket_1780688388726.png' },
            timeline: [
                { role: 'مدير القسم (أنت)', status: 'approved', name: 'أحمد الإداري', date: '2026-05-28 09:30' },
                { role: 'شؤون الموظفين', status: 'approved', name: 'سارة شؤون الموظفين', date: '2026-05-28 11:15' },
                { role: 'المدير العام', status: 'approved', name: 'د. خالد المدير العام', date: '2026-05-28 14:00' },
            ]
        },
        {
            id: 'REQ-008',
            employee: 'فاطمة خالد',
            type: 'طلب مغادرة',
            date: '2026-05-29',
            status: 'مرفوض',
            priority: 'عادية',
            notes: 'مغادرة مبكرة عند الساعة الواحدة ظهراً لحضور موعد مراجعة في المستشفى.',
            leave_balance: null,
            attachment: null,
            timeline: [
                { role: 'مدير القسم (أنت)', status: 'rejected', name: 'أحمد الإداري', date: '2026-05-29 10:00' },
                { role: 'شؤون الموظفين', status: 'cancelled', name: 'سارة شؤون الموظفين', date: '' },
                { role: 'المدير العام', status: 'cancelled', name: 'د. خالد المدير العام', date: '' },
            ]
        }
    ]);

    // Filtering and UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
    const [typeFilter, setTypeFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [expandedRows, setExpandedRows] = useState([]);
    const [activeAttachment, setActiveAttachment] = useState(null);
    const [printActiveRequest, setPrintActiveRequest] = useState(null);

    const [sortBy, setSortBy] = useState('date');
    const [sortDir, setSortDir] = useState('desc');

    const searchInputRef = useRef(null);

    // Keyboard shortcut (/) to focus search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement !== searchInputRef.current) {
                const target = e.target;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    return;
                }
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Toggle body class for printing layout
    useEffect(() => {
        if (printActiveRequest) {
            document.body.classList.add('print-official-active');
        } else {
            document.body.classList.remove('print-official-active');
        }
        return () => document.body.classList.remove('print-official-active');
    }, [printActiveRequest]);

    // Handle Quick Actions (Approve / Reject)
    const handleApprove = (id) => {
        setApprovals(prev => prev.map(req => {
            if (req.id === id) {
                const nowStr = new Date().toLocaleString('ar-EG', { hour12: false }).substring(0, 16);
                const updatedTimeline = req.timeline.map((step, idx) => {
                    if (idx === 0) return { ...step, status: 'approved', date: nowStr };
                    if (idx === 1) return { ...step, status: 'pending' };
                    return step;
                });
                return {
                    ...req,
                    status: 'معتمد',
                    timeline: updatedTimeline
                };
            }
            return req;
        }));
    };

    const handleReject = (id) => {
        setApprovals(prev => prev.map(req => {
            if (req.id === id) {
                const nowStr = new Date().toLocaleString('ar-EG', { hour12: false }).substring(0, 16);
                const updatedTimeline = req.timeline.map((step, idx) => {
                    if (idx === 0) return { ...step, status: 'rejected', date: nowStr };
                    return { ...step, status: 'cancelled' };
                });
                return {
                    ...req,
                    status: 'مرفوض',
                    timeline: updatedTimeline
                };
            }
            return req;
        }));
    };

    // Toggle expanded row details
    const toggleRow = (id) => {
        setExpandedRows(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Handle Printable View
    const triggerPrint = (req) => {
        setPrintActiveRequest(req);
        setTimeout(() => {
            window.print();
            setPrintActiveRequest(null);
        }, 300);
    };

    // Export to CSV
    const handleExportCSV = () => {
        const headers = ['رقم الطلب', 'الموظف', 'نوع الطلب', 'التاريخ', 'الأولوية', 'الحالة'];
        const rows = filteredApprovals.map(req => [
            req.id,
            req.employee,
            req.type,
            req.date,
            req.priority,
            req.status
        ]);
        const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `صندوق_الموافقات_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filtering logic
    const filteredApprovals = approvals.filter(req => {
        const matchesSearch = 
            req.employee.includes(searchQuery) ||
            req.id.includes(searchQuery) ||
            req.type.includes(searchQuery);

        const matchesStatus = 
            statusFilter === 'all' ||
            (statusFilter === 'pending' && req.status === 'بانتظار اعتمادك') ||
            (statusFilter === 'approved' && req.status === 'معتمد') ||
            (statusFilter === 'rejected' && req.status === 'مرفوض');

        const matchesType = 
            typeFilter === 'all' ||
            (typeFilter === 'leave' && req.type.includes('إجازة')) ||
            (typeFilter === 'financial' && req.type.includes('سلفة')) ||
            (typeFilter === 'maghadara' && req.type.includes('مغادرة'));

        const matchesPriority = 
            priorityFilter === 'all' ||
            (priorityFilter === 'high' && req.priority === 'عالية') ||
            (priorityFilter === 'normal' && req.priority === 'عادية');

        const matchesDate = 
            (!startDate || req.date >= startDate) &&
            (!endDate || req.date <= endDate);

        return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesDate;
    });

    // Sorting logic
    const sortedApprovals = [...filteredApprovals].sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'date') {
            valA = new Date(a.date);
            valB = new Date(b.date);
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (field) => {
        const isAsc = sortBy === field && sortDir === 'asc';
        const newDir = isAsc ? 'desc' : 'asc';
        setSortBy(field);
        setSortDir(newDir);
    };

    // Stats calculations
    const statsTotal = approvals.length;
    const statsPending = approvals.filter(r => r.status === 'بانتظار اعتمادك').length;
    const statsApproved = approvals.filter(r => r.status === 'معتمد').length;
    const statsRejected = approvals.filter(r => r.status === 'مرفوض').length;

    const activeFiltersCount = 
        (typeFilter !== 'all' ? 1 : 0) +
        (priorityFilter !== 'all' ? 1 : 0) +
        (startDate ? 1 : 0) +
        (endDate ? 1 : 0) +
        (searchQuery ? 1 : 0) +
        (statusFilter !== 'all' ? 1 : 0);

    const statusKeys = ['all', 'pending', 'approved', 'rejected'];
    const activeIndex = statusKeys.indexOf(statusFilter);

    const hasActiveFilters = activeFiltersCount > 0 || searchQuery !== '' || statusFilter !== 'all';

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setTypeFilter('all');
        setPriorityFilter('all');
        setStartDate('');
        setEndDate('');
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'بانتظار اعتمادك': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                        <Clock size={12} className="animate-pulse" /> {status}
                    </span>
                );
            case 'معتمد': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                        <CheckCircle size={12}/> معتمد
                    </span>
                );
            case 'مرفوض': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-455 border border-rose-100 dark:border-rose-500/20">
                        <XCircle size={12}/> مرفوض
                    </span>
                );
            default: 
                return <span className="text-slate-605 dark:text-slate-350 font-bold">{status}</span>;
        }
    };

    const getPriorityBadge = (p) => {
        if (p === 'عالية') {
            return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">عالية</span>;
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-850">عادية</span>;
    };

    return (
        <AdminLayout activeMenu="صندوق الموافقات">
            <Head title="صندوق الموافقات | النظام الإداري" />

            <div className="screen-only-content space-y-8 animate-fade-in">
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes pulse-glow-dark {
                        0%, 100% {
                            box-shadow: 0 0 12px rgba(100, 116, 139, 0.25);
                            border-color: rgba(100, 116, 139, 0.35);
                        }
                        50% {
                            box-shadow: 0 0 22px rgba(100, 116, 139, 0.5);
                            border-color: rgba(100, 116, 139, 0.8);
                        }
                    }
                    .pending-pulse-card {
                        animation: pulse-glow-dark 2.5s infinite ease-in-out;
                    }
                    @keyframes pulse-glow-row {
                        0%, 100% {
                            border-right-color: rgba(100, 116, 139, 0.3);
                            background-color: rgba(100, 116, 139, 0.01);
                        }
                        50% {
                            border-right-color: rgba(100, 116, 139, 0.85);
                            background-color: rgba(100, 116, 139, 0.04);
                        }
                    }
                    .pending-pulse-row {
                        animation: pulse-glow-row 2.5s infinite ease-in-out;
                        border-right-width: 4px;
                    }
                `}} />

                {/* Header Section */}
                <div className="relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Visual geometric lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-850 dark:text-white tracking-tight">صندوق الموافقات الإدارية</h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">البت في الطلبات المرفوعة من قبل الموظفين التابعين لإدارتك</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`relative flex items-center justify-center p-3 rounded-2xl transition-all shadow-sm border ${
                                    showAdvancedFilters || activeFiltersCount > 0
                                        ? 'bg-primary-500 text-white border-primary-500'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-655 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-primary-600'
                                }`}
                                title="تصفية الطلبات">
                                <Filter size={18} />
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1.5 -left-1.5 bg-accent-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                            <button onClick={handleExportCSV}
                                className="flex items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-655 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-primary-600 transition-colors shadow-sm"
                                title="تصدير كملف CSV">
                                <Download size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'بانتظار الاعتماد', value: statsPending, icon: Clock, color: 'text-dark-700 dark:text-dark-300', bg: 'bg-dark-100 dark:bg-dark-900/40', glow: 'bg-dark-500/5 dark:bg-dark-500/10' },
                        { label: 'تمت الموافقة', value: statsApproved, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', glow: 'bg-emerald-500/5 dark:bg-emerald-500/10' },
                        { label: 'مرفوضة', value: statsRejected, icon: XCircle, color: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-500/10', glow: 'bg-accent-500/5 dark:bg-accent-500/10' },
                        { label: 'إجمالي الطلبات', value: statsTotal, icon: FileText, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10', glow: 'bg-primary-500/5 dark:bg-primary-500/10' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group cursor-default bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#5b8a2d_1.2px,transparent_1.2px)] [background-size:16px_16px]">
                            <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${
                                idx === 0 ? 'from-dark-400 to-dark-600' :
                                idx === 1 ? 'from-emerald-400 to-emerald-600' :
                                idx === 2 ? 'from-accent-400 to-accent-600' :
                                'from-primary-400 to-primary-600'
                            } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glow} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                            
                            <div className="relative z-10 min-w-0">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">{stat.label}</p>
                                <h3 className="text-2xl font-black text-slate-855 dark:text-white leading-none font-mono tracking-tight">{stat.value}</h3>
                            </div>
                            <div className={`relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}>
                                <stat.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter and search panel */}
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-4 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:16px_16px]">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Segmented Status Presets */}
                        <div className="relative grid grid-cols-4 bg-slate-105/60 dark:bg-slate-950/60 p-1 border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full md:w-[550px] select-none">
                            {/* Sliding active background */}
                            <div 
                                className="absolute top-1 bottom-1 w-[calc(25%-6px)] rounded-xl transition-all duration-300 ease-out shadow-sm"
                                style={{
                                    transform: `translateX(${activeIndex * -100}%)`,
                                    right: '4px', // base offset in RTL
                                    backgroundColor: 
                                        statusFilter === 'all' ? '#5b8a2d' : // primary green
                                        statusFilter === 'pending' ? '#d97706' : // amber-600
                                        statusFilter === 'approved' ? '#059669' : // emerald-600
                                        '#e11d48' // rose-600
                                }}
                            />
                            
                            {[
                                { key: 'all', label: 'الكل', count: approvals.length },
                                { key: 'pending', label: 'بانتظار الاعتماد', count: approvals.filter(r => r.status === 'بانتظار اعتمادك').length },
                                { key: 'approved', label: 'المعتمدة', count: approvals.filter(r => r.status === 'معتمد').length },
                                { key: 'rejected', label: 'المرفوضة', count: approvals.filter(r => r.status === 'مرفوض').length }
                            ].map(preset => (
                                <button
                                    key={preset.key}
                                    onClick={() => setStatusFilter(preset.key)}
                                    className={`relative z-10 py-2.5 text-center text-xs font-black transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer rounded-xl ${
                                        statusFilter === preset.key
                                            ? 'text-white'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-205'
                                    }`}>
                                    <span>{preset.label}</span>
                                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-colors duration-205 ${
                                        statusFilter === preset.key
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200 dark:bg-slate-800/80 text-slate-650 dark:text-slate-400'
                                    }`}>{preset.count}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Grid / Table Toggle */}
                            <div className="flex bg-slate-100/60 dark:bg-slate-955/60 p-1 border border-slate-205 dark:border-slate-850 rounded-2xl">
                                <button onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-xl transition-all ${
                                        viewMode === 'table'
                                            ? 'bg-white dark:bg-slate-900 text-primary-500 dark:text-primary-400 shadow-sm'
                                            : 'text-slate-450 hover:text-slate-650 dark:hover:text-slate-300'
                                    }`}
                                    title="عرض الجدول">
                                    <List size={18} />
                                </button>
                                <button onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-xl transition-all ${
                                        viewMode === 'grid'
                                            ? 'bg-white dark:bg-slate-900 text-primary-500 dark:text-primary-400 shadow-sm'
                                            : 'text-slate-455 hover:text-slate-655 dark:hover:text-slate-300'
                                    }`}
                                    title="عرض البطاقات">
                                    <LayoutGrid size={18} />
                                </button>
                            </div>

                            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${
                                    showAdvancedFilters || activeFiltersCount > 0
                                        ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-955 border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                                }`}>
                                <Filter size={16} />
                                <span>تصفية متقدمة</span>
                                {activeFiltersCount > 0 && (
                                    <span className="bg-white text-primary-600 dark:text-primary-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                        {activeFiltersCount}
                                    </span>
                                )}
                                <ChevronDown size={14} className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                            </button>

                            {hasActiveFilters && (
                                <button onClick={resetFilters}
                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10 hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-all border border-accent-100 dark:border-accent-550/10">
                                    <RotateCcw size={16} />
                                    <span>إعادة ضبط</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                        <div className="relative flex-1 max-w-md group">
                            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-405 group-focus-within:text-primary-500 transition-colors" />
                            <input 
                                ref={searchInputRef}
                                type="text" 
                                placeholder="ابحث باسم الموظف أو رقم الطلب... (اضغط / للتركيز)"
                                className="w-full bg-slate-50/50 dark:bg-slate-955/50 border border-slate-205 dark:border-slate-800 rounded-2xl pr-11 pl-12 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-805 rounded-lg text-slate-450 hover:text-slate-655 transition-all">
                                    <X size={14} />
                                </button>
                            )}
                            {!searchQuery && (
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-205 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 rounded border border-slate-300 dark:border-slate-700 font-bold font-mono group-focus-within:opacity-0 transition-opacity">/</div>
                            )}
                        </div>
                    </div>

                    {/* Expandable Advanced Filters Drawer with Inline Icons & Focus Glows */}
                    {showAdvancedFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-105 dark:border-slate-800 animate-slide-down">
                            {/* Type Filter */}
                            <div>
                                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">نوع الطلب</label>
                                <div className="relative group">
                                    <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 pointer-events-none" />
                                    <select 
                                        value={typeFilter} 
                                        onChange={e => setTypeFilter(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl pr-10 pl-10 py-2.5 text-xs outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 focus:shadow-[0_0_15px_rgba(91,138,45,0.15)] dark:focus:shadow-[0_0_20px_rgba(91,138,45,0.25)] dark:text-white font-semibold appearance-none transition-all duration-300">
                                        <option value="all">كل الأنواع</option>
                                        <option value="leave">طلبات الإجازات</option>
                                        <option value="financial">طلبات السلف المالية</option>
                                        <option value="maghadara">طلبات المغادرة</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Priority Filter */}
                            <div>
                                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">الأهمية</label>
                                <div className="relative group">
                                    <Flag size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 pointer-events-none" />
                                    <select 
                                        value={priorityFilter} 
                                        onChange={e => setPriorityFilter(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-2xl pr-10 pl-10 py-2.5 text-xs outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 focus:shadow-[0_0_15px_rgba(91,138,45,0.15)] dark:focus:shadow-[0_0_20px_rgba(91,138,45,0.25)] dark:text-white font-semibold appearance-none transition-all duration-300">
                                        <option value="all">الكل</option>
                                        <option value="high">عالية</option>
                                        <option value="normal">عادية</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Date Hired Start */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-450 mb-1">تاريخ البدء</label>
                                <FlatpickrInput type="date" value={startDate} onChange={date => setStartDate(date)} />
                            </div>

                            {/* Date Hired End */}
                            <div>
                                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2">إلى تاريخ</label>
                                <div className="relative group">
                                    <Calendar size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-450 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 pointer-events-none" />
                                    <input 
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 focus:shadow-[0_0_15px_rgba(91,138,45,0.15)] dark:focus:shadow-[0_0_20px_rgba(91,138,45,0.25)] dark:text-white font-semibold font-sans transition-all duration-300"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                {sortedApprovals.length === 0 ? (
                    <div className="text-center py-16 text-slate-450 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
                        <Clock size={40} className="mx-auto mb-3 opacity-30 text-primary-650 dark:text-primary-450 animate-pulse" />
                        <p className="font-bold">لا يوجد طلبات مطابقة للبحث أو التصفية الحالية</p>
                    </div>
                ) : viewMode === 'table' ? (
                    /* ── Table View ── */
                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-101 dark:border-slate-800">
                                        <th onClick={() => handleSort('id')} className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-850/50">
                                            <div className="flex items-center gap-1.5">
                                                <span>الطلب</span>
                                                <ArrowUpDown size={12} className="opacity-60" />
                                            </div>
                                        </th>
                                        <th onClick={() => handleSort('employee')} className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-850/50">
                                            <div className="flex items-center gap-1.5">
                                                <span>الموظف</span>
                                                <ArrowUpDown size={12} className="opacity-60" />
                                            </div>
                                        </th>
                                        <th onClick={() => handleSort('date')} className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-850/50">
                                            <div className="flex items-center gap-1.5">
                                                <span>تاريخ التقديم</span>
                                                <ArrowUpDown size={12} className="opacity-60" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">الأولوية</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">الحالة</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider w-16 text-center">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                                    {sortedApprovals.map((req) => {
                                        const isExpanded = expandedRows.includes(req.id);
                                        const isPending = req.status === 'بانتظار اعتمادك';
                                        return (
                                            <React.Fragment key={req.id}>
                                                <tr 
                                                    onClick={() => toggleRow(req.id)}
                                                    className={`group border-r-4 border-r-transparent transition-all duration-200 cursor-pointer ${
                                                        isPending 
                                                            ? 'pending-pulse-row border-r-amber-500 dark:hover:bg-amber-500/5 hover:bg-amber-50/10' 
                                                            : 'hover:border-r-primary-500 hover:bg-slate-50/40 dark:hover:bg-primary-500/5'
                                                    } ${
                                                        isExpanded 
                                                            ? isPending 
                                                                ? 'bg-amber-50/5 dark:bg-amber-950/10 border-r-amber-500' 
                                                                : 'bg-primary-50/10 dark:bg-primary-500/5 border-r-primary-500'
                                                            : ''
                                                    }`}>
                                                    <td className="px-6 py-4.5 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{req.type}</div>
                                                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">#{req.id}</div>
                                                    </td>
                                                    <td className="px-6 py-4.5 whitespace-nowrap">
                                                        <div className="font-bold text-slate-855 dark:text-slate-205 text-sm">{req.employee}</div>
                                                    </td>
                                                    <td className="px-6 py-4.5 whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                                                        {req.date}
                                                    </td>
                                                    <td className="px-6 py-4.5 whitespace-nowrap">
                                                        {getPriorityBadge(req.priority)}
                                                    </td>
                                                    <td className="px-6 py-4.5 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {isPending && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                                                            {getStatusBadge(req.status)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4.5 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center gap-2">
                                                            {isPending ? (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleApprove(req.id)}
                                                                        className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-white border border-emerald-100 dark:border-emerald-500/20 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95">
                                                                        <CheckCircle size={14}/> 
                                                                        <span>قبول</span>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleReject(req.id)}
                                                                        className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-455 hover:bg-rose-500 hover:text-white dark:hover:text-white border border-rose-100 dark:border-rose-500/20 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95">
                                                                        <XCircle size={14}/> 
                                                                        <span>رفض</span>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => triggerPrint(req)}
                                                                    className="text-slate-405 hover:text-primary-600 dark:hover:text-primary-400 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                                                    title="طباعة تفويض الطلب">
                                                                    <Printer size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                
                                                {/* Expanded Details Row */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/30 dark:bg-slate-955/20">
                                                        <td colSpan="6" className="p-6">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right" dir="rtl">
                                                                {/* Right Column: Approval Timeline */}
                                                                <div className="bg-white/50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100/80 dark:border-slate-800/80">
                                                                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                                        <RefreshCw size={14} className="text-primary-500 animate-spin-slow" />
                                                                        <span>مراحل مراجعة واعتماد الطلب</span>
                                                                    </h4>
                                                                    
                                                                    <div className="relative border-r-2 border-slate-100 dark:border-slate-800 mr-3 pr-6 space-y-6">
                                                                        {req.timeline.map((step, sIdx) => {
                                                                            let circleColor = 'bg-slate-200 dark:bg-slate-800 text-slate-405';
                                                                            
                                                                            if (step.status === 'approved') {
                                                                                circleColor = 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]';
                                                                            } else if (step.status === 'pending') {
                                                                                circleColor = 'bg-amber-500 text-white shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse';
                                                                            } else if (step.status === 'rejected') {
                                                                                circleColor = 'bg-rose-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]';
                                                                            } else if (step.status === 'cancelled') {
                                                                                circleColor = 'bg-slate-300 dark:bg-slate-700 text-slate-505';
                                                                            }

                                                                            return (
                                                                                <div key={sIdx} className="relative flex flex-col gap-1">
                                                                                    {/* Timeline dot */}
                                                                                    <div className={`absolute -right-[33px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${circleColor}`} />
                                                                                    
                                                                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                                                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{step.role}</span>
                                                                                        <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono font-bold">{step.date}</span>
                                                                                    </div>
                                                                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                                                                        المسؤول: <span className="font-black">{step.name}</span>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                {/* Left Column: Notes, Attachments, and Leave Balance Ring */}
                                                                <div className="space-y-6">
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                                        {/* Notes */}
                                                                        <div className="bg-white/50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100/80 dark:border-slate-800/80 flex flex-col justify-between">
                                                                            <div>
                                                                                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 mb-2.5">ملاحظات ومبررات الموظف</h4>
                                                                                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">{req.notes}</p>
                                                                            </div>
                                                                            <span className="text-[10px] text-slate-400 font-bold font-mono mt-4 block">الأولوية: {req.priority}</span>
                                                                        </div>

                                                                        {/* Leave Balance SVG Ring */}
                                                                        {req.leave_balance ? (
                                                                            <div className="bg-white/50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between gap-4">
                                                                                <div className="min-w-0">
                                                                                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 mb-2">رصيد الإجازات المتبقي</h4>
                                                                                    <p className="text-2xl font-black text-slate-800 dark:text-white leading-none font-mono">
                                                                                        {req.leave_balance.remaining}
                                                                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold mr-1">/ {req.leave_balance.total} يوم</span>
                                                                                    </p>
                                                                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold mt-2">متاح للاستخدام فورياً</p>
                                                                                </div>
                                                                                
                                                                                {/* SVG Ring Progress */}
                                                                                <div className="relative flex items-center justify-center shrink-0">
                                                                                    <svg className="w-16 h-16 transform -rotate-90">
                                                                                        <circle cx="32" cy="32" r="26" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="4" fill="transparent" />
                                                                                        <circle cx="32" cy="32" r="26" className="stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-500 ease-out" strokeWidth="4" fill="transparent" 
                                                                                            strokeDasharray={2 * Math.PI * 26}
                                                                                            strokeDashoffset={2 * Math.PI * 26 - ((req.leave_balance.remaining / req.leave_balance.total) * 100 / 100) * 2 * Math.PI * 26}
                                                                                            strokeLinecap="round"
                                                                                        />
                                                                                    </svg>
                                                                                    <span className="absolute text-[10px] font-black text-slate-700 dark:text-slate-300 font-mono">
                                                                                        {Math.round((req.leave_balance.remaining / req.leave_balance.total) * 100)}%
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="bg-white/50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100/80 dark:border-slate-800/80 flex flex-col justify-center items-center text-center">
                                                                                <Info size={24} className="text-slate-350 dark:text-slate-655 mb-2" />
                                                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">لا يوجد رصيد إجازات</p>
                                                                                <p className="text-[10px] text-slate-400 mt-1">الطلب لا يتعلق بالإجازات السنوية</p>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Attachment Card */}
                                                                    {req.attachment ? (
                                                                        <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between gap-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-450 border border-primary-100/20 shrink-0">
                                                                                    <FileText size={20} />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{activeAttachment ? 'يتم العرض...' : req.attachment.name}</p>
                                                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{req.attachment.size}</p>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="flex items-center gap-2">
                                                                                <button 
                                                                                    onClick={() => setActiveAttachment(req.attachment)}
                                                                                    className="p-2 bg-slate-100 hover:bg-primary-50 hover:text-primary-600 dark:bg-slate-800 dark:hover:bg-primary-500/20 dark:hover:text-primary-400 text-slate-500 dark:text-slate-400 rounded-xl transition-colors"
                                                                                    title="معاينة المستند">
                                                                                    <Eye size={14} />
                                                                                </button>
                                                                                <a 
                                                                                    href={req.attachment.url} 
                                                                                    download 
                                                                                    className="p-2 bg-slate-100 hover:bg-primary-50 hover:text-primary-600 dark:bg-slate-800 dark:hover:bg-primary-500/20 dark:hover:text-primary-400 text-slate-500 dark:text-slate-400 rounded-xl transition-colors"
                                                                                    title="تحميل المستند">
                                                                                    <Download size={14} />
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-205 dark:border-slate-800 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                                                                            لا توجد مرفقات مصاحبة لهذا الطلب
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* ── Grid View ── */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                        {sortedApprovals.map((req) => {
                            const isPending = req.status === 'بانتظار اعتمادك';
                            const isExpanded = expandedRows.includes(req.id);
                            return (
                                <div 
                                    key={req.id} 
                                    onClick={() => toggleRow(req.id)}
                                    className={`relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden cursor-pointer ${
                                        isExpanded 
                                            ? 'border-primary-450 dark:border-primary-500 shadow-md shadow-primary-500/5' 
                                            : isPending
                                                ? 'pending-pulse-card shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                                                : 'border-slate-100 dark:border-slate-800'
                                    } bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#5b8a2d_1.2px,transparent_1.2px)] [background-size:16px_16px]`}>
                                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500/20 via-primary-500 to-primary-700/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-350" />
                                    <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-primary-500/5 to-transparent rounded-br-[100px]" />
                                    
                                    {isPending && (
                                        <div className="absolute top-3 left-3 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                        </div>
                                    )}

                                    <div className="relative z-10 flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] text-slate-405 dark:text-slate-500 font-mono font-bold">#{req.id}</span>
                                            <h3 className="font-black text-slate-805 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mt-0.5">{req.type}</h3>
                                        </div>
                                        <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                                            {isPending ? (
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleApprove(req.id)} className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors active:scale-90" title="قبول"><CheckCircle size={16}/></button>
                                                    <button onClick={() => handleReject(req.id)} className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors active:scale-90" title="رفض"><XCircle size={16}/></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => triggerPrint(req)} className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-primary-50 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-400 text-slate-400 flex items-center justify-center transition-colors"><Printer size={15} /></button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative z-10 space-y-2 mb-5">
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            <span>الموظف:</span>
                                            <span className="font-bold text-slate-808 dark:text-slate-205">{req.employee}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">
                                            <span>تاريخ التقديم:</span>
                                            <span className="font-bold font-mono">{req.date}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            <span>الأهمية:</span>
                                            <span>{getPriorityBadge(req.priority)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            <span>الحالة:</span>
                                            <span>{getStatusBadge(req.status)}</span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-405 font-bold">
                                        <span className="flex items-center gap-1"><Info size={12} /> اضغط لاستعراض التفاصيل والمرفقات</span>
                                        {req.attachment && <span className="text-primary-605 dark:text-primary-450">يحتوي مرفق</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lightbox Attachment Preview Modal */}
            {activeAttachment && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 screen-only-content animate-fade-in bg-black/90 backdrop-blur-md">
                    {/* Header bar */}
                    <div className="absolute top-0 right-0 left-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
                        <div className="text-right">
                            <h3 className="text-sm font-black text-white">{activeAttachment.name}</h3>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{activeAttachment.size}</p>
                        </div>
                        <button 
                            onClick={() => setActiveAttachment(null)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                            title="إغلاق المعاينة">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Image preview */}
                    <div className="relative max-w-3xl max-h-[70vh] w-full flex items-center justify-center p-4">
                        <img 
                            src={activeAttachment.url} 
                            alt={activeAttachment.name} 
                            className="max-w-full max-h-full rounded-2xl border border-white/10 shadow-2xl object-contain animate-scale-in"
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="absolute bottom-6 flex items-center gap-3">
                        <a 
                            href={activeAttachment.url}
                            download
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-650 hover:bg-primary-700 text-white rounded-xl font-bold text-xs transition-colors shadow-lg">
                            <Download size={14} />
                            <span>تحميل المستند</span>
                        </a>
                        <button 
                            onClick={() => setActiveAttachment(null)}
                            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-colors">
                            إغلاق
                        </button>
                    </div>
                </div>
            )}

            {/* Print Official Template (hidden on screen, visible on window.print()) */}
            {printActiveRequest && (
                <div className="hidden print:block text-right p-8 font-sans" dir="rtl">
                    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">مدارس القيم الأهلية</h1>
                            <p className="text-xs text-slate-505 font-bold mt-1">قرار تفويض واعتماد طلب إداري</p>
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 font-bold">رقم التصريح: {printActiveRequest.id}</p>
                            <p className="text-xs text-slate-500 font-bold font-sans">تاريخ الاعتماد: {new Date().toLocaleDateString('ar-EG')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8 text-xs border border-slate-300 p-4 rounded-xl">
                        <div>
                            <p className="font-bold text-slate-500">تفاصيل الموظف:</p>
                            <p className="text-sm font-black text-slate-900 mt-1">{printActiveRequest.employee}</p>
                            <p className="text-slate-400 mt-1 font-mono">@{printActiveRequest.employee} (إداري)</p>
                        </div>
                        <div>
                            <p className="font-bold text-slate-500">تفاصيل الإجراء الإداري:</p>
                            <p className="text-sm font-black text-slate-900 mt-1">{printActiveRequest.type}</p>
                            <p className="text-slate-450 mt-1">تاريخ تقديم الطلب: {printActiveRequest.date}</p>
                        </div>
                    </div>

                    <div className="border border-slate-300 p-5 rounded-xl mb-8">
                        <p className="font-bold text-xs text-slate-505 mb-2">ملاحظات ومبررات المرفقة بالقرار:</p>
                        <p className="text-xs text-slate-808 leading-relaxed font-semibold">{printActiveRequest.notes}</p>
                    </div>

                    {/* QR Code and signatures */}
                    <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-200">
                        {/* Interactive Signatures */}
                        <div className="space-y-4 text-xs">
                            <p className="font-bold text-slate-900">سجل التواقيع والمصادقات الإلكترونية:</p>
                            <div className="space-y-1">
                                {printActiveRequest.timeline.map((step, idx) => (
                                    <p key={idx} className="text-slate-605 font-medium">
                                        • {step.role}: <span className="font-bold">{step.name}</span> {step.status === 'approved' ? `(معتمد في ${step.date})` : step.status === 'rejected' ? '(مرفوض)' : '(معلق)'}
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Visual Mock QR Code block */}
                        <div className="flex flex-col items-center gap-1.5 border border-slate-300 p-2.5 rounded-xl shrink-0 bg-slate-50">
                            <div className="w-18 h-18 bg-white border border-slate-200 flex flex-col items-center justify-center p-1">
                                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
                                    <rect x="0" y="0" width="16" height="16" fill="currentColor" />
                                    <rect x="3" y="3" width="10" height="10" fill="white" />
                                    <rect x="6" y="6" width="4" height="4" fill="currentColor" />
                                    
                                    <rect x="44" y="0" width="16" height="16" fill="currentColor" />
                                    <rect x="47" y="3" width="10" height="10" fill="white" />
                                    <rect x="50" y="6" width="4" height="4" fill="currentColor" />
                                    
                                    <rect x="0" y="44" width="16" height="16" fill="currentColor" />
                                    <rect x="3" y="47" width="10" height="10" fill="white" />
                                    <rect x="6" y="50" width="4" height="4" fill="currentColor" />
                                    
                                    <rect x="22" y="22" width="16" height="16" fill="currentColor" />
                                    <rect x="25" y="25" width="10" height="10" fill="white" />
                                    
                                    <rect x="20" y="44" width="4" height="12" fill="currentColor" />
                                    <rect x="28" y="52" width="12" height="4" fill="currentColor" />
                                    <rect x="36" y="44" width="4" height="8" fill="currentColor" />
                                    <rect x="52" y="52" width="8" height="8" fill="currentColor" />
                                </svg>
                            </div>
                            <span className="text-[8px] font-black text-slate-500 font-mono tracking-wider">QR VERIFIED</span>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}