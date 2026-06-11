import React, { useState, useRef, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { 
    Search, Plus, Filter, MoreVertical, FileText, CheckCircle, Clock, XCircle, Send,
    Calendar, RotateCcw, X, ChevronDown, SlidersHorizontal, Printer
} from 'lucide-react';

export default function RequestsIndex() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [expandedRows, setExpandedRows] = useState([]);
    const [activeAttachment, setActiveAttachment] = useState(null);
    const [printActiveRequest, setPrintActiveRequest] = useState(null);
    const datePickerRef = useRef(null);

    // Click outside handler for date range presets picker
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (datePickerRef.current && !datePickerRef.current.contains(e.target) && !e.target.closest('.date-picker-btn')) {
                setShowDatePicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Print cleanup handler to reset state after print dialog closes
    useEffect(() => {
        const handleAfterPrint = () => {
            setPrintActiveRequest(null);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, []);

    // Toggle body class for print overrides when printActiveRequest is toggled
    useEffect(() => {
        if (printActiveRequest) {
            document.body.classList.add('print-official-active');
        } else {
            document.body.classList.remove('print-official-active');
        }
        return () => document.body.classList.remove('print-official-active');
    }, [printActiveRequest]);

    // Handler to print official request template
    const handlePrintRequest = (req) => {
        setPrintActiveRequest(req);
        setTimeout(() => {
            window.print();
        }, 150);
    };

    // Helper to generate dynamic dates for realistic simulation relative to today
    const getRelativeDate = (daysAgo) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // Dummy data for visual representation
    const dummyRequests = [
        { 
            id: 'REQ-001', 
            type: 'إجازة اعتيادية', 
            date: getRelativeDate(0), 
            status: 'موافق عليه', 
            priority: 'عادية',
            notes: 'يرجى التكرم بالموافقة على طلب إجازتي السنوية لمدة أسبوعين، لقضاء الإجازة وسفر عائلي خارج البلاد. تم التنسيق مع الزملاء لتغطية كافة المهام العاجلة خلال فترة غيابي.',
            attachment: { name: 'flight_ticket.png', size: '420 KB', type: 'image', url: '/images/flight_ticket.png' },
            approvals: [
                { role: 'مدير القسم', name: 'أ. أحمد علي', status: 'approved', date: getRelativeDate(2), time: '09:30 ص' },
                { role: 'شؤون الموظفين', name: 'أ. سارة حسن', status: 'approved', date: getRelativeDate(1), time: '11:15 ص' },
                { role: 'المدير العام', name: 'د. خالد سليمان', status: 'approved', date: getRelativeDate(0), time: '08:45 ص' }
            ]
        },
        { 
            id: 'REQ-002', 
            type: 'طلب مغادرة مبكرة', 
            date: getRelativeDate(1), 
            status: 'قيد المراجعة', 
            priority: 'عالية',
            notes: 'أرجو التكرم بالموافقة على مغادرة العمل اليوم عند الساعة 12:00 ظهراً، وذلك لوجود موعد طارئ في الدوائر الحكومية لإنهاء بعض الإجراءات الرسمية الشخصية العاجلة التي لا يمكن تأجيلها.',
            attachment: null,
            approvals: [
                { role: 'مدير القسم', name: 'أ. أحمد علي', status: 'approved', date: getRelativeDate(1), time: '10:00 ص' },
                { role: 'شؤون الموظفين', name: 'أ. سارة حسن', status: 'pending', date: null, time: null },
                { role: 'المدير العام', name: 'د. خالد سليمان', status: 'waiting', date: null, time: null }
            ]
        },
        { 
            id: 'REQ-003', 
            type: 'سلفة مالية', 
            date: getRelativeDate(3), 
            status: 'مرفوض', 
            priority: 'عادية',
            notes: 'أتقدم بطلب سلفة مالية مستردة بقيمة 5,000 ريال سعودي، وذلك لتسديد الرسوم الدراسية الجامعية لأحد الأبناء لشهر يونيو. تجدون المرفق المالي للتوضيح والتثبت.',
            attachment: { name: 'invoice_receipt.png', size: '610 KB', type: 'image', url: '/images/receipt.png' },
            approvals: [
                { role: 'مدير القسم', name: 'أ. أحمد علي', status: 'approved', date: getRelativeDate(3), time: '12:30 م' },
                { role: 'شؤون الموظفين', name: 'أ. سارة حسن', status: 'rejected', date: getRelativeDate(2), time: '02:00 م' },
                { role: 'المدير العام', name: 'د. خالد سليمان', status: 'cancelled', date: null, time: null }
            ]
        },
        { 
            id: 'REQ-004', 
            type: 'إجازة مرضية', 
            date: getRelativeDate(5), 
            status: 'قيد المراجعة', 
            priority: 'عالية',
            notes: 'يرجى قبول عذر الغياب وطلب الإجازة المرضية بعد إجراء الفحوصات الطبية اللازمة بسبب وعكة صحية مفاجئة ألمّت بي مؤخراً، والتوصية الطبية بالراحة التامة لمدة ثلاثة أيام متتالية.',
            attachment: { name: 'medical_report.png', size: '840 KB', type: 'image', url: '/images/medical_report.png' },
            approvals: [
                { role: 'مدير القسم', name: 'أ. أحمد علي', status: 'pending', date: null, time: null },
                { role: 'شؤون الموظفين', name: 'أ. سارة حسن', status: 'waiting', date: null, time: null },
                { role: 'المدير العام', name: 'د. خالد سليمان', status: 'waiting', date: null, time: null }
            ]
        },
    ];

    // Presets calculator
    const getPresetDates = () => {
        const todayObj = new Date();
        const formatDate = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const todayStr = formatDate(todayObj);

        const yesterdayObj = new Date(todayObj);
        yesterdayObj.setDate(todayObj.getDate() - 1);
        const yesterdayStr = formatDate(yesterdayObj);

        const last7DaysObj = new Date(todayObj);
        last7DaysObj.setDate(todayObj.getDate() - 6);
        const last7DaysStr = formatDate(last7DaysObj);

        const firstOfThisMonth = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);
        const thisMonthStr = formatDate(firstOfThisMonth);

        const firstOfLastMonth = new Date(todayObj.getFullYear(), todayObj.getMonth() - 1, 1);
        const lastOfLastMonth = new Date(todayObj.getFullYear(), todayObj.getMonth(), 0);
        const lastMonthStart = formatDate(firstOfLastMonth);
        const lastMonthEnd = formatDate(lastOfLastMonth);

        return {
            today: { start: todayStr, end: todayStr },
            yesterday: { start: yesterdayStr, end: yesterdayStr },
            last7: { start: last7DaysStr, end: todayStr },
            thisMonth: { start: thisMonthStr, end: todayStr },
            lastMonth: { start: lastMonthStart, end: lastMonthEnd }
        };
    };

    const applyDatePreset = (startVal, endVal) => {
        setStartDate(startVal);
        setEndDate(endVal);
        setShowDatePicker(false);
    };

    // Timezone safe date formatting for displaying range
    const getFormattedDateRange = () => {
        const formatSingle = (dateStr) => {
            if (!dateStr) return '';
            const parts = dateStr.split('-');
            if (parts.length !== 3) return dateStr;
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        };
        if (!startDate && !endDate) return 'اختر الفترة الزمنية';
        if (startDate === endDate) return formatSingle(startDate);
        return `من ${formatSingle(startDate)} إلى ${formatSingle(endDate)}`;
    };

    // Filter requests
    const filteredRequests = dummyRequests.filter(req => {
        if (searchQuery && !req.id.toLowerCase().includes(searchQuery.toLowerCase()) && !req.type.includes(searchQuery)) {
            return false;
        }
        if (statusFilter !== 'all' && req.status !== statusFilter) {
            return false;
        }
        if (priorityFilter !== 'all' && req.priority !== priorityFilter) {
            return false;
        }
        if (typeFilter !== 'all' && req.type !== typeFilter) {
            return false;
        }
        if (startDate && req.date < startDate) {
            return false;
        }
        if (endDate && req.date > endDate) {
            return false;
        }
        return true;
    });

    // Count values
    const pendingCount = dummyRequests.filter(r => r.status === 'قيد المراجعة').length;
    const approvedCount = dummyRequests.filter(r => r.status === 'موافق عليه').length;
    const rejectedCount = dummyRequests.filter(r => r.status === 'مرفوض').length;

    // Filtered stats
    const filteredPending = filteredRequests.filter(r => r.status === 'قيد المراجعة').length;
    const filteredApproved = filteredRequests.filter(r => r.status === 'موافق عليه').length;

    // Count active filters
    const activeFiltersCount = 
        (priorityFilter !== 'all' ? 1 : 0) + 
        (typeFilter !== 'all' ? 1 : 0) + 
        (startDate || endDate ? 1 : 0);

    const getStatusBadge = (status) => {
        switch(status) {
            case 'موافق عليه': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f0f7eb] dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 border border-[#dcefd1] dark:border-primary-900/30">
                        <CheckCircle size={12}/> {status}
                    </span>
                );
            case 'قيد المراجعة': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-warning-50 dark:bg-warning-950/20 text-warning-700 dark:text-warning-400 border border-warning-100 dark:border-warning-900/20">
                        <Clock size={12} className="animate-pulse" /> {status}
                    </span>
                );
            case 'مرفوض': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 border border-accent-100 dark:border-accent-900/20">
                        <XCircle size={12}/> {status}
                    </span>
                );
            default: 
                return <span className="text-slate-650 dark:text-slate-350">{status}</span>;
        }
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setTypeFilter('all');
        setStartDate('');
        setEndDate('');
    };

    return (
        <AdminLayout activeMenu="تقديم طلب">
            <Head title="تقديم طلباتي | النظام الإداري" />

            {/* Print & Custom Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    aside, nav, header, .no-print, button, a, [type="checkbox"], select, input, .print\\:hidden {
                        display: none !important;
                    }
                    main, .print\\:w-full {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body {
                        background-color: white !important;
                        color: black !important;
                    }
                    .print\\:block { display: block !important; }

                    /* Official PDF print layout overrides */
                    body.print-official-active .screen-only-content {
                        display: none !important;
                    }
                    body.print-official-active .print-only-template {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        direction: rtl;
                    }
                }
                .progress-ring-circle {
                    animation: progress-ring-animation 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                @keyframes progress-ring-animation {
                    from {
                        stroke-dashoffset: 113.1;
                    }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
                .animate-scale-in {
                    animation: scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}} />

            <div className="screen-only-content">
                {/* Print Only Header Banner */}
            <div className="hidden print:block mb-8 text-right font-sans" dir="rtl">
                <div className="flex items-center justify-between border-b-2 border-primary-600 pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-black text-dark-900">مدارس القيم الأهلية</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-1">كشف الطلبات الإدارية للموظف</p>
                    </div>
                    <div className="text-left font-semibold">
                        <p className="text-xs text-slate-500">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                    </div>
                </div>
            </div>

            {/* Header Section with Brand Colors and Geometric Accent */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none no-print">
                {/* Brand Line Accent */}
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                
                {/* Fine abstract geometric background lines */}
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                        <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                        <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                        <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                    </svg>
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">طلباتي الإدارية</h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تقديم ومتابعة طلبات الإجازات، المغادرات، والطلبات الإدارية الأخرى</p>
                    </div>
                    
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <Link href="#" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all shrink-0 active:scale-95">
                            <Send size={18} />
                            <span>تقديم طلب جديد</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
                {/* 1. Pending Requests Card */}
                <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 p-5 rounded-3xl shadow-sm hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group cursor-default">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-dark-400 to-dark-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 pointer-events-none" />
                    <div className="absolute -left-6 -top-6 w-24 h-24 bg-dark-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                    <div className="relative z-10 min-w-0">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">طلبات قيد المراجعة</p>
                        <h3 className="text-2xl font-black text-dark-900 dark:text-white leading-none font-mono tracking-tight">{filteredPending}</h3>
                    </div>
                    <div className="relative z-10 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 bg-dark-100 dark:bg-dark-900/40 text-dark-700 dark:text-dark-300 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                        <Clock size={20} strokeWidth={2.5} />
                    </div>
                </div>

                {/* 2. Approved Requests Card */}
                <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 p-5 rounded-3xl shadow-sm hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group cursor-default">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 pointer-events-none" />
                    <div className="absolute -left-6 -top-6 w-24 h-24 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                    <div className="relative z-10 min-w-0">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">الطلبات المعتمدة</p>
                        <h3 className="text-2xl font-black text-dark-900 dark:text-white leading-none font-mono tracking-tight">{filteredApproved}</h3>
                    </div>
                    <div className="relative z-10 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                        <CheckCircle size={20} strokeWidth={2.5} />
                    </div>
                </div>

                {/* 3. Leave Balance Circular SVG Card */}
                <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 p-5 rounded-3xl shadow-sm hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group cursor-default">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 pointer-events-none" />
                    <div className="absolute -left-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                    <div className="relative z-10 min-w-0">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">رصيد الإجازات المتبقي</p>
                        <h3 className="text-2xl font-black text-dark-900 dark:text-white leading-none font-mono tracking-tight">12 <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1">يوم متبقي</span></h3>
                        <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-1">مستهلك: 18 يوم من أصل 30</p>
                    </div>
                    <div className="relative z-10 w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 44 44">
                            <defs>
                                <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                                <filter id="neonGlow" x="-15%" y="-15%" width="130%" height="130%">
                                    <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#10b981" floodOpacity="0.4" />
                                </filter>
                            </defs>
                            <circle
                                cx="22"
                                cy="22"
                                r="18"
                                className="stroke-slate-100 dark:stroke-slate-800/80"
                                strokeWidth="3"
                                fill="transparent"
                            />
                            <circle
                                cx="22"
                                cy="22"
                                r="18"
                                stroke="url(#neonGradient)"
                                filter="url(#neonGlow)"
                                strokeWidth="3"
                                fill="transparent"
                                strokeDasharray="113.1"
                                strokeDashoffset={113.1 * (1 - 12 / 30)}
                                strokeLinecap="round"
                                className="progress-ring-circle"
                            />
                        </svg>
                        <div className="absolute text-[10px] font-black text-dark-900 dark:text-white font-mono">
                            40%
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Status Presets Capsules */}
            <div className="flex flex-wrap items-center gap-2 mb-4 no-print">
                {[
                    { val: 'all', label: 'الكل', count: dummyRequests.length },
                    { val: 'قيد المراجعة', label: 'قيد المراجعة', count: pendingCount },
                    { val: 'موافق عليه', label: 'موافق عليه', count: approvedCount },
                    { val: 'مرفوض', label: 'مرفوض', count: rejectedCount }
                ].map(opt => (
                    <button
                        key={opt.val}
                        onClick={() => setStatusFilter(opt.val)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold border transition-all duration-200 ${
                            statusFilter === opt.val
                                ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/10 scale-102'
                                : 'bg-white dark:bg-[#121820] text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <span>{opt.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-lg text-[10px] ${
                            statusFilter === opt.val 
                                ? 'bg-white/20 text-white' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>{opt.count}</span>
                    </button>
                ))}
            </div>

            {/* Search and Table Card */}
            <div className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 rounded-3xl shadow-md dark:shadow-none overflow-hidden">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/30 dark:from-transparent dark:to-transparent no-print">
                    <h2 className="text-base font-bold text-dark-900 dark:text-white">سجل الطلبات السابقة</h2>
                    
                    {/* Integrated Search & Filter Action */}
                    <div className="flex items-center gap-3 w-full sm:max-w-md">
                        <div className="relative flex-1 flex items-center bg-slate-100/60 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 focus-within:bg-white dark:focus-within:bg-[#121820] border border-transparent dark:border-slate-800 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/10 rounded-2xl transition-all p-1">
                            <Search size={16} className="absolute right-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                            <input 
                                type="text" 
                                placeholder="ابحث برقم أو نوع الطلب..." 
                                className="w-full bg-transparent border-none pr-10 pl-3 py-2 text-sm outline-none text-dark-900 dark:text-slate-100 font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter Toggle Button */}
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`h-11 px-4 rounded-2xl text-sm font-bold border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                                showAdvancedFilters || activeFiltersCount > 0
                                    ? 'bg-primary-50 border-primary-200 dark:border-primary-900/30 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400'
                                    : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                            }`}
                        >
                            <SlidersHorizontal size={15} />
                            <span>تصفية</span>
                            {activeFiltersCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center font-bold">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Advanced Inline Filter Panel */}
                {showAdvancedFilters && (
                    <div className="p-6 border-b border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 relative no-print animate-scale-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Date Range Input */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">فترة الطلب</label>
                                <div className="relative date-picker-popover">
                                    <button
                                        onClick={() => setShowDatePicker(!showDatePicker)}
                                        className="w-full flex items-center gap-2 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 hover:border-primary-400 rounded-2xl px-4 py-2.5 shadow-sm text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors date-picker-btn text-right"
                                    >
                                        <Calendar size={15} className="text-slate-400 shrink-0" />
                                        <span className="truncate flex-1">{getFormattedDateRange()}</span>
                                        <ChevronDown size={14} className="text-slate-400 shrink-0" />
                                    </button>

                                    {/* Date range picker panel */}
                                    {showDatePicker && (
                                        <div ref={datePickerRef} className="absolute z-55 mt-2 right-0 left-0 bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-4 flex flex-col gap-3 min-w-[280px]">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">اختر فترة زمنية جاهزة:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {[
                                                        { label: 'اليوم', key: 'today' },
                                                        { label: 'أمس', key: 'yesterday' },
                                                        { label: 'آخر 7 أيام', key: 'last7' },
                                                        { label: 'هذا الشهر', key: 'thisMonth' },
                                                        { label: 'الشهر الماضي', key: 'lastMonth' }
                                                    ].map(p => (
                                                        <button
                                                            key={p.key}
                                                            onClick={() => {
                                                                const pr = getPresetDates()[p.key];
                                                                applyDatePreset(pr.start, pr.end);
                                                            }}
                                                            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-600 dark:text-slate-350 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl text-xs font-bold transition-all border border-slate-100 dark:border-slate-850"
                                                        >
                                                            {p.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-100 dark:border-slate-850 my-1" />

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-450 mb-1">تاريخ البدء</label>
                                                    <FlatpickrInput type="date" value={startDate} onChange={date => setStartDate(date)} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-450 mb-1">تاريخ الانتهاء</label>
                                                    <FlatpickrInput type="date" value={endDate} onChange={date => setEndDate(date)} />
                                                </div>
                                            </div>

                                            <div className="flex gap-2 justify-end pt-1">
                                                <button onClick={() => { setStartDate(''); setEndDate(''); setShowDatePicker(false); }} className="px-3 py-1.5 text-xs text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all font-bold">إلغاء</button>
                                                <button onClick={() => setShowDatePicker(false)} className="px-4 py-1.5 text-xs bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all shadow-sm">تأكيد</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Request Type Selector */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">نوع الطلب</label>
                                <select 
                                    value={typeFilter} 
                                    onChange={e => setTypeFilter(e.target.value)}
                                    className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all"
                                >
                                    <option value="all">الكل</option>
                                    <option value="إجازة اعتيادية">إجازة اعتيادية</option>
                                    <option value="طلب مغادرة مبكرة">طلب مغادرة مبكرة</option>
                                    <option value="سلفة مالية">سلفة مالية</option>
                                    <option value="إجازة مرضية">إجازة مرضية</option>
                                </select>
                            </div>

                            {/* Priority Selector */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">الأولوية</label>
                                <select 
                                    value={priorityFilter} 
                                    onChange={e => setPriorityFilter(e.target.value)}
                                    className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all"
                                >
                                    <option value="all">الكل</option>
                                    <option value="عالية">عالية</option>
                                    <option value="عادية">عادية</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Filter Badges */}
                {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' || startDate || endDate) && (
                    <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-850 flex items-center justify-between flex-wrap gap-3 no-print bg-slate-50/50 dark:bg-slate-900/5">
                        <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span>المرشحات النشطة:</span>
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-850">
                                    <span>البحث: "{searchQuery}"</span>
                                    <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setSearchQuery('')} />
                                </span>
                            )}
                            {statusFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-850">
                                    <span>الحالة: {statusFilter}</span>
                                    <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setStatusFilter('all')} />
                                </span>
                            )}
                            {typeFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-850">
                                    <span>النوع: {typeFilter}</span>
                                    <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setTypeFilter('all')} />
                                </span>
                            )}
                            {priorityFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-850">
                                    <span>الأولوية: {priorityFilter}</span>
                                    <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setPriorityFilter('all')} />
                                </span>
                            )}
                            {(startDate || endDate) && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-850">
                                    <span>الفترة: {getFormattedDateRange()}</span>
                                    <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => { setStartDate(''); setEndDate(''); }} />
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleClearFilters}
                            className="text-xs font-extrabold text-accent-500 hover:text-accent-600 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-accent-50 dark:hover:bg-accent-950/20 transition-all active:scale-95 cursor-pointer"
                        >
                            <RotateCcw size={12} />
                            <span>إعادة ضبط المرشحات</span>
                        </button>
                    </div>
                )}

                {/* Table Data View */}
                {filteredRequests.length === 0 ? (
                    <div className="p-16 text-center">
                        <FileText size={48} className="mx-auto mb-4 text-slate-350 dark:text-slate-700 opacity-80 animate-pulse" />
                        <p className="font-bold text-slate-500 text-sm">لا توجد طلبات إدارية مطابقة لمعايير البحث</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">جرّب تغيير فلاتر البحث أو نطاق التاريخ</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-primary-50 via-primary-100/50 to-primary-50 dark:from-primary-950/40 dark:via-primary-900/20 dark:to-primary-950/40 border-b border-primary-200/60 dark:border-primary-900/30">
                                    <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">رقم الطلب</th>
                                    <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">نوع الطلب</th>
                                    <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">التاريخ</th>
                                    <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">الحالة</th>
                                    <th className="px-6 py-4 text-xs font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider text-center no-print">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                                {filteredRequests.map((req, idx) => (
                                    <React.Fragment key={req.id}>
                                        <tr className={`group border-r-4 hover:border-r-primary-500 hover:bg-primary-50/20 dark:hover:bg-gradient-to-l dark:hover:from-primary-950/20 dark:hover:to-transparent transition-all duration-300 ${
                                            expandedRows.includes(req.id)
                                                ? 'border-r-primary-500 bg-primary-50/10 dark:bg-primary-950/10'
                                                : 'border-r-transparent'
                                        }`}>
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={(e) => {
                                                        e.stopPropagation();
                                                        const isExpanded = expandedRows.includes(req.id);
                                                        setExpandedRows(isExpanded ? expandedRows.filter(id => id !== req.id) : [...expandedRows, req.id]);
                                                    }} className="text-slate-400 hover:text-slate-600 transition-colors no-print">
                                                        <ChevronDown size={14} className={`transform transition-transform ${expandedRows.includes(req.id) ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <span className="font-bold text-dark-900 dark:text-white text-sm font-mono">{req.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <div className="font-bold text-dark-900 dark:text-white text-sm">{req.type}</div>
                                                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">أولوية: {req.priority}</div>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                                                {req.date}
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap text-center no-print">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {req.status === 'موافق عليه' && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePrintRequest(req);
                                                            }}
                                                            className="text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/30 inline-flex items-center justify-center border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800 cursor-pointer"
                                                            title="طباعة نموذج القرار الرسمي"
                                                        >
                                                            <Printer size={15} />
                                                        </button>
                                                    )}
                                                    <button className="text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/30 inline-flex items-center justify-center border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded Approvals Timeline Row */}
                                        {expandedRows.includes(req.id) && (
                                            <tr className="bg-slate-50/40 dark:bg-slate-900/10 text-right">
                                                <td colSpan={5} className="px-6 py-5 border-b border-slate-100 dark:border-slate-850">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-scale-in" dir="rtl">
                                                        {/* Right: Approval Timeline */}
                                                        <div className="flex flex-col gap-4">
                                                            <span className="text-xs font-black text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
                                                                <Clock size={13} className="text-primary-500" />
                                                                <span>مسار الاعتمادات ومراجعة الطلب</span>
                                                            </span>
                                                            
                                                            <div className="relative flex flex-col gap-6 pl-4 pr-6 py-2 border-r-2 border-slate-200/60 dark:border-slate-800 mr-3">
                                                                {req.approvals?.map((app, appIdx) => {
                                                                    // Determine status icon and colors
                                                                    let statusColor = 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800';
                                                                    let statusIcon = <Clock size={10} />;
                                                                    let textClass = 'text-slate-450 dark:text-slate-550';
                                                                    
                                                                    if (app.status === 'approved') {
                                                                        statusColor = 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20';
                                                                        statusIcon = <CheckCircle size={10} />;
                                                                        textClass = 'text-primary-700 dark:text-primary-400';
                                                                    } else if (app.status === 'pending') {
                                                                        statusColor = 'bg-warning-500 border-warning-500 text-white shadow-lg shadow-warning-500/20 animate-pulse';
                                                                        statusIcon = <Clock size={10} />;
                                                                        textClass = 'text-warning-700 dark:text-warning-400';
                                                                    } else if (app.status === 'rejected') {
                                                                        statusColor = 'bg-accent-500 border-accent-500 text-white shadow-lg shadow-accent-500/20';
                                                                        statusIcon = <XCircle size={10} />;
                                                                        textClass = 'text-accent-700 dark:text-accent-400';
                                                                    } else if (app.status === 'cancelled') {
                                                                        statusColor = 'bg-slate-200 border-slate-350 text-slate-400 dark:bg-slate-850 dark:border-slate-800';
                                                                        statusIcon = <XCircle size={10} />;
                                                                    }

                                                                    return (
                                                                        <div key={appIdx} className="relative flex items-start gap-4">
                                                                            {/* Node Indicator circle */}
                                                                            <div className={`absolute -right-[32px] top-1 w-5.5 h-5.5 rounded-full flex items-center justify-center border z-10 transition-all ${statusColor}`}>
                                                                                {statusIcon}
                                                                            </div>
                                                                            
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <span className={`font-bold text-xs ${textClass}`}>{app.role}</span>
                                                                                    {app.name && (
                                                                                        <span className="text-xs text-dark-900 dark:text-white font-extrabold">— {app.name}</span>
                                                                                    )}
                                                                                </div>
                                                                                
                                                                                <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-semibold font-sans">
                                                                                    <span>
                                                                                        {app.status === 'approved' && 'تمت الموافقة'}
                                                                                        {app.status === 'pending' && 'قيد المراجعة حالياً'}
                                                                                        {app.status === 'rejected' && 'تم الرفض'}
                                                                                        {app.status === 'waiting' && 'في انتظار مراجعة الخطوات السابقة'}
                                                                                        {app.status === 'cancelled' && 'ملغي لعدم اعتماد الخطوة السابقة'}
                                                                                    </span>
                                                                                    {app.date && (
                                                                                        <span className="font-mono">{app.date} {app.time}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Left: Notes & Attachments */}
                                                        <div className="flex flex-col gap-5 border-t lg:border-t-0 lg:border-r border-slate-100 dark:border-slate-850 pt-5 lg:pt-0 lg:pr-8">
                                                            {/* Employee Notes Card */}
                                                            <div className="flex flex-col gap-2.5">
                                                                <span className="text-xs font-black text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
                                                                    <FileText size={13} className="text-primary-500" />
                                                                    <span>ملاحظات ومبررات مقدم الطلب</span>
                                                                </span>
                                                                
                                                                <div className="bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 text-xs font-semibold text-slate-650 dark:text-slate-350 leading-relaxed shadow-inner">
                                                                    {req.notes || "لا توجد ملاحظات إضافية مرفقة مع الطلب."}
                                                                </div>
                                                            </div>

                                                            {/* Attachment Card */}
                                                            {req.attachment && (
                                                                <div className="flex flex-col gap-2.5 no-print">
                                                                    <span className="text-xs font-black text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
                                                                        <FileText size={13} className="text-primary-500" />
                                                                        <span>المستند المرفق بالطلب</span>
                                                                    </span>
                                                                    
                                                                    <div className="bg-white dark:bg-[#151d29] border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4 group">
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            {/* Thumbnail Container */}
                                                                            <div 
                                                                                onClick={() => setActiveAttachment(req.attachment)}
                                                                                className="relative w-12 h-12 rounded-xl border border-slate-200/85 dark:border-slate-800/80 overflow-hidden cursor-zoom-in shrink-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:border-primary-400 transition-colors"
                                                                            >
                                                                                <img 
                                                                                    src={req.attachment.url} 
                                                                                    alt={req.attachment.name} 
                                                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                                                />
                                                                                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                    <Search size={14} className="text-white" />
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="min-w-0">
                                                                                <p className="text-xs font-black text-dark-900 dark:text-white truncate max-w-[200px]">{req.attachment.name}</p>
                                                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{req.attachment.size} • صورة</p>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="flex items-center gap-2">
                                                                            <button 
                                                                                onClick={() => setActiveAttachment(req.attachment)}
                                                                                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-primary-400 hover:text-primary-500 dark:hover:text-primary-400 text-slate-650 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl text-[10px] font-extrabold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                                                                            >
                                                                                <Search size={11} />
                                                                                <span>معاينة</span>
                                                                            </button>
                                                                            <a 
                                                                                href={req.attachment.url} 
                                                                                download={req.attachment.name}
                                                                                className="p-2 border border-slate-200 dark:border-slate-800 hover:border-primary-400 hover:text-primary-500 dark:hover:text-primary-400 text-slate-650 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl transition-all active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                                            >
                                                                                <FileText size={11} />
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            </div>

            {/* Print Only Official PDF Template */}
            {printActiveRequest && (
                <div className="hidden print:block print-only-template text-black font-sans p-8 bg-white" dir="rtl">
                    {/* Header Border and Logo Row */}
                    <div className="flex items-center justify-between border-b-4 border-emerald-800 pb-5 mb-8">
                        <div className="text-right">
                            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">مدارس القيم الأهلية</h2>
                            <p className="text-xs text-slate-500 font-bold mt-1">المملكة العربية السعودية</p>
                            <p className="text-[10px] text-slate-400 font-semibold">وزارة التعليم — إدارة التعليم الأهلي</p>
                        </div>
                        <div className="flex flex-col items-center">
                            {/* Visual representation of a school logo */}
                            <div className="w-16 h-16 rounded-full border-2 border-emerald-800 bg-emerald-50 flex items-center justify-center font-black text-emerald-850 text-xl font-serif">
                                ق
                            </div>
                            <span className="text-[10px] text-slate-400 font-extrabold mt-1">تأسست ١٤٢٠ هـ</span>
                        </div>
                        <div className="text-left font-semibold text-xs text-slate-600">
                            <p>تاريخ المستند: {new Date().toLocaleDateString('ar-EG')}</p>
                            <p className="mt-1">رقم المعاملة: {printActiveRequest.id}</p>
                            <p className="mt-1">حالة المعاملة: معتمد وموثق</p>
                        </div>
                    </div>

                    {/* Document Title */}
                    <div className="text-center my-6">
                        <h1 className="text-2xl font-black text-slate-900 border-b-2 border-slate-900 inline-block pb-1">
                            {printActiveRequest.type === 'طلب مغادرة مبكرة' ? 'تصريح مغادرة إلكتروني رسمي' : 'قرار موافقة على إجازة رسمية'}
                        </h1>
                        <p className="text-xs text-slate-500 font-extrabold mt-2">مستند رسمي صادر عن نظام الخدمة الذاتية للموارد البشرية</p>
                    </div>

                    {/* Request Details Grid */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden mb-8">
                        <table className="w-full text-right border-collapse">
                            <tbody>
                                <tr className="border-b border-slate-200">
                                    <td className="w-1/4 px-4 py-3 bg-slate-50 font-bold text-xs text-slate-600 border-l border-slate-200">صاحب الطلب</td>
                                    <td className="w-3/4 px-4 py-3 text-xs font-black text-slate-900">أ. أسامة خالد (معلم علوم الحاسب)</td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                    <td className="w-1/4 px-4 py-3 bg-slate-50 font-bold text-xs text-slate-600 border-l border-slate-200">الرقم الوظيفي</td>
                                    <td className="w-3/4 px-4 py-3 text-xs font-mono font-bold text-slate-900">EMP-3045</td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                    <td className="w-1/4 px-4 py-3 bg-slate-50 font-bold text-xs text-slate-600 border-l border-slate-200">نوع الطلب</td>
                                    <td className="w-3/4 px-4 py-3 text-xs font-black text-slate-900">{printActiveRequest.type}</td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                    <td className="w-1/4 px-4 py-3 bg-slate-50 font-bold text-xs text-slate-600 border-l border-slate-200">تاريخ التقديم والاستحقاق</td>
                                    <td className="w-3/4 px-4 py-3 text-xs font-mono font-bold text-slate-900">{printActiveRequest.date}</td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                    <td className="w-1/4 px-4 py-3 bg-slate-50 font-bold text-xs text-slate-600 border-l border-slate-200">مستوى الأولوية</td>
                                    <td className="w-3/4 px-4 py-3 text-xs font-bold text-slate-900">{printActiveRequest.priority}</td>
                                </tr>
                                <tr>
                                    <td className="w-1/4 px-4 py-3 bg-slate-50 font-bold text-xs text-slate-600 border-l border-slate-200">السبب والشرح المرفق</td>
                                    <td className="w-3/4 px-4 py-3 text-xs text-slate-800 leading-relaxed font-semibold">
                                        {printActiveRequest.notes || "لا توجد ملاحظات إضافية."}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Approvals and Signatures Section */}
                    <div className="mb-10">
                        <h3 className="text-sm font-black text-slate-900 mb-4 border-r-4 border-emerald-800 pr-2 pb-0.5">اعتمادات وتواقيع الإدارة المختصة</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {printActiveRequest.approvals?.map((app, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between h-40 bg-slate-50/50">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-450">{app.role}</p>
                                        <p className="text-xs font-extrabold text-slate-900 mt-1">{app.name}</p>
                                    </div>
                                    <div className="text-center my-2">
                                        {app.status === 'approved' ? (
                                            <div className="inline-block border border-dashed border-emerald-600 text-emerald-700 text-[10px] font-black tracking-wider px-3 py-1 rounded bg-emerald-50 transform -rotate-3 uppercase font-serif">
                                                معتمد إلكترونياً
                                            </div>
                                        ) : (
                                            <p className="text-[10px] font-semibold text-slate-400">لم يُطلب اعتماده</p>
                                        )}
                                    </div>
                                    <div className="text-left text-[9px] text-slate-400 font-mono font-semibold">
                                        {app.date ? `${app.date} ${app.time}` : '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Verification Area & QR Code */}
                    <div className="border-t-2 border-slate-200 pt-6 mt-12 flex items-start justify-between gap-6">
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-900">التحقق والأرشفة الرقمية</h4>
                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1.5">
                                تم توليد هذا المستند إلكترونياً وصرف الصلاحيات الخاصة به عبر نظام إدارة شؤون الموظفين بمدارس القيم.
                                يرجى مسح الرمز المرفق في الجانب الأيسر بالهاتف المحمول للتثبت الفوري من صحة المستند وتاريخ اعتماده بشكل رقمي ومطابقته للبيانات المسجلة.
                            </p>
                            <p className="text-[9px] text-slate-450 font-mono mt-3">رابط التحقق: https://smart-school.edu/verify/request/{printActiveRequest.id}</p>
                        </div>
                        <div className="flex flex-col items-center shrink-0">
                            {/* QR Code integration via API */}
                            <div className="w-28 h-28 border border-slate-300 p-1.5 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(`https://smart-school.edu/verify/request/${printActiveRequest.id}`)}`}
                                    alt="Verification QR Code" 
                                    className="w-full h-full"
                                />
                            </div>
                            <span className="text-[8px] font-mono text-slate-450 mt-1 font-bold">{printActiveRequest.id}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Preview Modal */}
            {activeAttachment && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md no-print animate-fade-in"
                    onClick={() => setActiveAttachment(null)}
                >
                    <div className="absolute top-4 left-4 flex items-center gap-3">
                        {/* Download button */}
                        <a 
                            href={activeAttachment.url} 
                            download={activeAttachment.name}
                            onClick={(e) => e.stopPropagation()}
                            className="w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-white/10 hover:border-white/20 transition-all active:scale-95 cursor-pointer shadow-lg"
                            title="تحميل الملف"
                        >
                            <FileText size={18} />
                        </a>
                        {/* Close button */}
                        <button 
                            onClick={() => setActiveAttachment(null)}
                            className="w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-white/10 hover:border-white/20 transition-all active:scale-95 cursor-pointer shadow-lg"
                            title="إغلاق"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div 
                        className="relative max-w-[90vw] max-h-[85vh] p-2 flex flex-col items-center gap-3 animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={activeAttachment.url} 
                            alt={activeAttachment.name} 
                            className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-white/10 object-contain"
                        />
                        <div className="text-white/90 text-xs font-bold bg-slate-900/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/5 flex items-center gap-2">
                            <span>{activeAttachment.name}</span>
                            <span className="text-white/40">•</span>
                            <span className="text-white/60 font-mono">{activeAttachment.size}</span>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
