import React, { useState, useEffect, useCallback } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutDashboard, Users, Calendar, Settings, Search, Bell,
    Menu, X, BookOpen, Clock, ShieldCheck, Map, Activity, 
    Home, LogOut, ChevronDown, CheckSquare, Plus, CheckCircle, Store, Sun, Moon, PanelLeftClose, PanelLeftOpen, User,
    FileText, Sliders, Layers, BarChart, UserPlus, FileSignature, ShieldAlert,
    ListTodo, AlertTriangle, Eye, Shield, Key, HeartPulse, GraduationCap, ArrowUp, ClipboardList, Book, Newspaper, Library, Briefcase, Mail, Star, AlertCircle, Megaphone
} from 'lucide-react';
import NotificationDropdown from '@/Components/NotificationDropdown';
import ToastNotification from '@/Components/ToastNotification';

export default function AdminLayout({ children, activeMenu = 'المستخدمون' }) {
    const { auth, logo_url, isAdmin, isSystemAdmin } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [sidebarClosing, setSidebarClosing] = useState(false);
    const [profileDropdown, setProfileDropdown] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    
    // Get current URL path from Inertia
    const { url } = usePage();

    // Helper to determine if a menu item is active
    const isMenuActive = (menuUrl, menuName, menuKey = null) => {
        if (menuName === activeMenu || menuKey === activeMenu) return true;
        if (!menuUrl || menuUrl === '#') return false;
        try {
            const path = new URL(menuUrl, window.location.origin).pathname;
            // Exact match for root
            if (path === '/') return url === '/' || url === '';
            // Match sub-paths
            return url.startsWith(path);
        } catch (e) {
            return false;
        }
    };
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll active sidebar item into view
    useEffect(() => {
        // small timeout to ensure DOM is updated and rendered
        const timer = setTimeout(() => {
            const activeItem = document.querySelector('.erp-sidebar-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [url]); // Re-run when URL changes if needed, or rely on scroll-region

    // Profile & Search dropdown close on outside click
    useEffect(() => {
        const handleClick = () => {
            setProfileDropdown(false);
            setShowSearchDropdown(false);
        };
        if (profileDropdown || showSearchDropdown) document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [profileDropdown, showSearchDropdown]);

    // Escape key to close sidebar & search
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') {
                if (mobileSearchOpen) setMobileSearchOpen(false);
                if (mobileSidebarOpen) closeMobileSidebar();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [mobileSidebarOpen, mobileSearchOpen]);

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        if (mobileSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileSidebarOpen]);

    // Animated close for mobile sidebar
    const closeMobileSidebar = useCallback(() => {
        setSidebarClosing(true);
        setTimeout(() => {
            setMobileSidebarOpen(false);
            setSidebarClosing(false);
        }, 250);
    }, []);

    // Check if user is system admin - reading from global prop

    const hasPermission = (permissionName) => {
        if (isAdmin) return true;
        if (!permissionName) return true;
        return auth?.permissions?.includes(permissionName);
    };

    const menuGroups = isSystemAdmin ? [
        {
            title: 'إدارة النظام العام',
            items: [
                { name: 'الرئيسية', icon: Home, url: route('dashboard') },
                { name: 'إدارة الفروع', icon: Store, url: route('hr.branches') },
                { name: 'إدارة الصلاحيات', icon: Shield, url: route('admin.permissions') },
                { name: 'إعدادات النظام', icon: Settings, url: route('admin.settings') },
            ]
        },
        {
            title: 'التقارير والإحصائيات',
            items: [
                { name: 'تقارير الأداء', icon: BarChart, url: '#' },
                { name: 'سجلات النظام', icon: Activity, url: route('admin.activity-logs.index') },
            ]
        }
    ] : [
        {
            title: 'القائمة الرئيسية',
            items: [
                { name: 'الرئيسية', icon: Home, url: route('dashboard') },
                { name: 'المستخدمون', icon: Users, url: route('users.index'), permission: 'إدارة المستخدمين' },
            ]
        },
        {
            title: 'النظام الإداري (HR)',
            items: [
                { name: 'الأقسام والإدارات', icon: BookOpen, url: route('hr.departments'), permission: 'إدارة الأقسام' },
                { name: 'الدرجات الوظيفية', icon: ShieldCheck, url: route('hr.job-grades'), permission: 'إدارة الدرجات الوظيفية' },
                { name: 'الشفتات', icon: Clock, url: route('hr.shifts'), permission: 'إدارة الشفتات' },
                { name: 'دليل الموظفين', icon: UserPlus, url: route('hr.employees'), permission: 'إدارة الموظفين' },
                { name: 'أنواع المخالفات', icon: ShieldAlert, url: route('hr.violation-types'), permission: 'إدارة أنواع المخالفات' },
                { name: 'مخالفات الموظفين', icon: AlertTriangle, url: route('hr.employee-violations'), permission: 'إدارة المخالفات' },
                { name: 'أنواع الإنجازات', icon: Star, url: route('hr.achievement-types'), permission: 'عرض أنواع الإنجازات' },
                { name: 'سجل الإنجازات', icon: CheckCircle, url: route('hr.employee-achievements'), permission: 'عرض الإنجازات' },
            ]
        },
        {
            title: 'الحضور والانصراف',
            items: [
                { name: 'سجل الحضور', icon: CheckSquare, url: route('hr.attendance'), permission: 'إدارة الحضور والانصراف' },
                { name: 'كشف الحضور الشهري', icon: FileText, url: route('hr.attendance.report'), permission: 'إدارة الحضور والانصراف' },
                { name: 'الإجازات الرسمية', icon: Calendar, url: route('hr.holidays'), permission: 'إدارة الموظفين' },
                { name: 'أنواع الإجازات', icon: Sliders, url: route('hr.leave-types'), permission: 'إدارة الموظفين' },
                { name: 'أرصدة الإجازات', icon: Activity, url: route('hr.leave-balances'), permission: 'إدارة الموظفين' },
                { name: 'إجازات الموظفين', icon: Clock, url: route('hr.leaves'), permission: 'إدارة الموظفين' },
            ]
        },
        {
            title: 'سير العمل والطلبات',
            items: [
                { name: 'طلبات الموظفين', icon: Layers, url: route('hr.requests.index'), permission: 'إدارة طلبات الموظفين' },
                { name: 'طلباتي', icon: FileText, url: route('hr.my-requests.index'), permission: null },
                { name: 'التقارير', icon: FileText, url: route('reports.index'), permission: 'إدارة التقارير' },
                { name: 'إدارة القوالب', icon: Settings, url: route('reports.templates'), permission: 'إدارة قوالب التقارير' },
                { name: 'تقاريري', icon: FileText, url: route('hr.reports.my-reports.index'), permission: null },
                { name: 'مخالفاتي', icon: AlertCircle, url: route('hr.my-violations'), permission: 'عرض مخالفاتي' },
                { name: 'إنجازاتي', icon: Star, url: route('hr.my-achievements'), permission: null },
                { name: 'الإجتماعات', icon: Users, url: route('meetings.index'), permission: 'إدارة الاجتماعات' },
            ]
        },
        {
            title: 'الشؤون الأكاديمية',
            items: [
                { name: 'السنوات الدراسية', icon: Calendar, url: route('academic.years'), permission: 'إدارة السنوات الدراسية' },
                { name: 'الصفوف والشعب', icon: Layers, url: route('academic.structure'), permission: 'إدارة الفصول الدراسية' },
                { name: 'المواد الدراسية', icon: BookOpen, url: route('academic.subjects.index'), permission: 'إدارة المواد الدراسية' },
                { name: 'إعداد الحصص اليومية', icon: Clock, url: route('academic.periods'), permission: 'إدارة الجداول الدراسية' },
                { name: 'جدول الحصص العام', icon: Calendar, url: route('academic.timetable'), permission: 'إدارة الجداول الدراسية' },
                { name: 'جدولي الدراسي', icon: Calendar, url: route('academic.my-timetable') },
                { name: 'جدول اختباراتي', icon: Calendar, url: route('student.exam-schedule') },
                { name: 'التغطية والاحتياط', icon: ShieldCheck, url: route('academic.coverage.index'), permission: 'إدارة الجداول الدراسية' },
                { name: 'جداول الاختبارات', icon: FileText, url: route('academic.exam-schedules.index'), permission: 'إدارة الجداول الدراسية' },
                { name: 'فترات الرصد', icon: Calendar, url: route('academic.result-periods.index'), permission: 'إدارة الدرجات' },
                { name: 'توزيع الدرجات', icon: Settings, url: route('academic.subject-grade-settings.index'), permission: 'إدارة المواد الدراسية' },
                { name: 'سجل الدرجات', icon: BarChart, url: route('academic.monthly-grades.index'), permission: 'عرض درجات الطلاب' },
                {
                    name: 'الطلاب', icon: GraduationCap, subItems: [
                        { name: 'الطلاب المسجلين', icon: UserPlus, url: route('academic.students'), permission: 'إدارة الطلاب' },
                        { name: 'الترفيع الجماعي', icon: ArrowUp, url: route('academic.promotions'), permission: 'إدارة الطلاب' },
                        { name: 'أولياء الأمور', icon: Users, url: route('academic.parents'), permission: 'إدارة أولياء الأمور' },
                    ]
                },
                { name: 'الغياب المدرسي', icon: AlertTriangle, url: route('academic.attendances.index'), permission: 'إدارة الطلاب' },
                { name: 'غياب الحصص', icon: Clock, url: route('academic.attendances.classes'), permission: 'إدارة الطلاب' },
            ]
        },
        {
            title: 'الإشراف والمتابعة',
            items: [
                { name: 'الحضور', icon: CheckSquare },
                { name: 'التقييم', icon: Star },
                { name: 'إدارة دفاتر المتابعة', icon: BookOpen, url: route('admin.followup-books.index') },
                { name: 'الزيارات الصفية', icon: Eye, url: route('academic.classroom-visits'), permission: 'إدارة الزيارات الصفية' },
                { name: 'زياراتي الصفية', icon: Eye, url: route('teacher.my-classroom-visits'), permission: 'عرض زياراتي الصفية' },
                { name: 'دفاتري للتحضير', icon: BookOpen, url: route('teacher.lesson-preparations.index') },
                { name: 'دفاتري للمتابعة', icon: BookOpen, url: route('teacher.followup-books.index') },
                { name: 'خططي الدراسية', icon: Map, url: route('teacher.study-plans.index') },
                { name: 'جدول المراقبة والاختبارات', icon: Calendar, url: route('teacher.my-exam-schedules') },
                { name: 'متابعة الخطط الدراسية', icon: BookOpen, url: route('academic.study-plans.index'), permission: 'إدارة الخطط الدراسية' },
                { name: 'دفاتر تحضير المعلمين', icon: Book, url: route('academic.lesson-preparations'), permission: 'عرض دفاتر التحضير' },
            ]
        },
        {
            title: 'المحتوى والتواصل',
            items: [
                { name: 'الأخبار والإعلانات', icon: Megaphone, url: route('news.index') },
                { name: 'المكتبة الرقمية', icon: Library, url: route('academic.library.digital.index'), permission: 'عرض المكتبة الرقمية' },
                { name: 'الكتب الورقية', icon: Book, url: route('academic.library.books.index'), permission: 'عرض الكتب الورقية' },
                { name: 'استعارة الكتب', icon: BookOpen, url: route('academic.library.borrowings.index'), permission: 'عرض الاستعارات' },
                { name: 'إرسال إشعارات', icon: Bell, url: route('admin.notifications.send'), permission: 'إدارة النظام' },
            ]
        },
        ...((isAdmin || isSystemAdmin) ? [{
            title: 'الإدارة',
            items: [
                ...(isSystemAdmin ? [
                    { name: 'الفروع', icon: Store, url: route('hr.branches') },
                    { name: 'إدارة الصلاحيات', icon: Shield, url: route('admin.permissions') },
                    { name: 'إعدادات النظام', icon: Settings, url: route('admin.settings') },
                ] : []),
                { name: 'سجل النشاطات', icon: Activity, url: route('admin.activity-logs.index') },
            ]
        }] : []),
    ];

    const filteredMenuGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => !item.permission || hasPermission(item.permission))
    })).filter(group => group.items.length > 0);

    // Compute Search Results
    const allNavItems = filteredMenuGroups.flatMap(group => group.items);
    const searchResults = searchQuery.trim() 
        ? allNavItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) && item.url)
        : [];

    // Bottom navigation items
    const bottomNavItems = [
        { name: 'الرئيسية', icon: Home, url: route('dashboard'), key: 'الرئيسية' },
        { name: 'الموظفين', icon: Users, url: route('hr.employees'), key: 'دليل الموظفين', permission: 'إدارة الموظفين' },
        { name: 'الحضور', icon: CheckSquare, url: route('hr.attendance'), key: 'سجل الحضور', permission: 'إدارة الحضور والانصراف' },
        { name: 'المزيد', icon: Menu, action: 'sidebar', key: '__more' },
    ];

    const filteredBottomNavItems = bottomNavItems.filter(item => !item.permission || hasPermission(item.permission));

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Brand Line */}
            <div className="brand-line"></div>
            
            {/* Logo & Close button for mobile */}
            <div className="p-5 flex items-center gap-3 border-b border-white/10">
                <img src={logo_url || '/images/school_logo.png'} alt="مدارس القيم" className="h-11 w-11 rounded-xl object-contain bg-white/10 p-1 shrink-0" />
                <div className="leading-tight overflow-hidden flex-1 min-w-0">
                    <h1 className="font-bold text-white text-[15px] truncate">مدارس القيم</h1>
                    <p className="text-[11px] text-gray-500 truncate">نظام القيم ERP</p>
                </div>
                {/* Close button — mobile only */}
                <button 
                    className="lg:hidden erp-btn-ghost text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-2"
                    onClick={closeMobileSidebar}
                    aria-label="إغلاق القائمة"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Menu Groups */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5" scroll-region="true">
                {filteredMenuGroups.map((group, gIdx) => (
                    <div key={gIdx}>
                        <p className="erp-sidebar-section">{group.title}</p>
                        <ul className="space-y-0.5">
                            {group.items.map((menu, index) => {
                                const isActive = isMenuActive(menu.url, menu.name);
                                return (
                                    <li key={index}>
                                        <Link
                                            href={menu.url || '#'}
                                            className={`erp-sidebar-item ${isActive ? 'active' : ''}`}
                                            onClick={() => {
                                                if (mobileSidebarOpen) closeMobileSidebar();
                                            }}
                                        >
                                            <menu.icon size={18} className="sidebar-icon" />
                                            <span>{menu.name}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-green-700/50 to-green-900/50 flex items-center justify-center shrink-0 ring-1 ring-green-600/30">
                        <User size={16} className="text-green-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                            {auth?.user?.name || 'مستخدم'}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                            {auth?.user?.role?.name || auth?.user?.username || 'admin'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex font-sans" dir="rtl">
            {/* Desktop Sidebar */}
            <aside className={`erp-sidebar hidden lg:flex flex-col shrink-0 sticky top-0 h-screen transition-all duration-300 ${
                sidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
            }`}>
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar with animated backdrop */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div 
                        className={`sidebar-backdrop ${sidebarClosing ? 'closing' : ''}`}
                        onClick={closeMobileSidebar} 
                    />
                    <aside className={`sidebar-mobile-panel erp-sidebar flex flex-col ${sidebarClosing ? 'closing' : ''}`}>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Topbar */}
                <header className={`erp-topbar flex items-center justify-between px-3 sm:px-4 lg:px-6 ${scrolled ? 'scrolled' : ''}`}>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button className="erp-btn-ghost lg:hidden" onClick={() => setMobileSidebarOpen(true)} aria-label="فتح القائمة">
                            <Menu size={22} />
                        </button>
                        <button className="erp-btn-ghost hidden lg:flex" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="تبديل القائمة">
                            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                        </button>

                        {/* Branch Badge */}
                        {auth?.user?.branch && (
                            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 rounded-xl text-primary-700 dark:text-primary-400 mr-2">
                                <Store size={16} />
                                <span className="text-sm font-bold">{auth.user.branch.name}</span>
                            </div>
                        )}

                        {/* Desktop Search */}
                        <div className="hidden md:flex items-center relative" onClick={(e) => e.stopPropagation()}>
                            <Search size={16} className={`absolute right-3 pointer-events-none transition-colors ${showSearchDropdown && searchQuery ? 'text-primary-500' : 'text-slate-400'}`} />
                            <input 
                                type="text" 
                                placeholder="بحث في النظام..." 
                                className="erp-input w-56 lg:w-72 pr-9 text-sm !py-2 !border-slate-200 dark:!border-slate-700 bg-slate-50/80 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSearchDropdown(true);
                                }}
                                onFocus={() => setShowSearchDropdown(true)}
                            />
                            
                            {/* Search Results Dropdown */}
                            {showSearchDropdown && searchQuery.trim() !== '' && (
                                <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 animate-scale-in z-50 overflow-hidden">
                                    {searchResults.length > 0 ? (
                                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">نتائج البحث</div>
                                            {searchResults.map((item, idx) => (
                                                <Link 
                                                    key={idx} 
                                                    href={item.url}
                                                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                                    onClick={() => {
                                                        setShowSearchDropdown(false);
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary-500">
                                                        <item.icon size={16} />
                                                    </div>
                                                    <span>{item.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-4 py-6 text-center text-sm text-slate-500 font-medium">
                                            لم يتم العثور على نتائج لـ <span className="font-bold text-slate-700 dark:text-slate-300">"{searchQuery}"</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mobile Search Button */}
                        <button 
                            className="erp-btn-ghost md:hidden" 
                            onClick={() => setMobileSearchOpen(true)}
                            aria-label="بحث"
                        >
                            <Search size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Theme Toggle Button */}
                        <button 
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
                            className="erp-btn-ghost text-slate-500 hover:text-primary-600 transition-colors"
                            aria-label="تبديل المظهر"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        <NotificationDropdown />

                        <div className="relative">
                            <button 
                                className="flex items-center gap-2 sm:gap-3 py-1.5 px-2 sm:px-3 rounded-lg hover:bg-slate-50 transition-colors"
                                onClick={(e) => { e.stopPropagation(); setProfileDropdown(!profileDropdown); }}
                                aria-label="الملف الشخصي"
                            >
                                <div className="text-left hidden sm:block">
                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                        {auth?.user?.name || 'مستخدم'}
                                    </p>
                                    <p className="text-[11px] text-slate-500">{auth?.user?.role?.name || 'بدون دور'}</p>
                                </div>
                                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#6b9b37] to-[#437020] flex items-center justify-center ring-2 ring-white shadow-sm">
                                    <User size={16} className="text-white" />
                                </div>
                            </button>

                            {profileDropdown && (
                                <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-scale-in z-50">
                                    <Link href={route('profile.edit')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                        <User size={16} /> <span>الملف الشخصي</span>
                                    </Link>
                                    <Link href={route('admin.settings')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                        <Settings size={16} /> <span>الإعدادات</span>
                                    </Link>
                                    <hr className="my-1 border-slate-100" />
                                    <Link href={route('logout')} method="post" as="button" className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full">
                                        <LogOut size={16} /> <span>تسجيل الخروج</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile Search Overlay */}
                {mobileSearchOpen && (
                    <div className="search-overlay md:hidden z-[100] fixed inset-0 bg-slate-50 dark:bg-[#0B1120] flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#121820] border-b border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex-1 relative flex items-center group">
                                <Search size={18} className="absolute right-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="ابحث في النظام..."
                                    className="w-full bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 pl-4 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none font-bold text-slate-800 dark:text-slate-100 transition-all shadow-inner"
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button 
                                        className="absolute left-4 p-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <X size={12} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                            <button 
                                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 dark:hover:border-rose-500/30 transition-all shadow-sm shrink-0 active:scale-95" 
                                onClick={() => {
                                    setMobileSearchOpen(false);
                                    setSearchQuery('');
                                }}
                                aria-label="إغلاق البحث"
                            >
                                <span className="text-sm font-bold px-1">إلغاء</span>
                            </button>
                        </div>
                        
                        {/* Search Results Mobile */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {searchQuery.trim() !== '' ? (
                                searchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="px-2 pb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2">
                                            <span>نتائج البحث</span>
                                            <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-400">{searchResults.length}</span>
                                        </div>
                                        {searchResults.map((item, idx) => (
                                            <Link 
                                                key={idx} 
                                                href={item.url}
                                                className="flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-[#121820] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.98] group"
                                                onClick={() => {
                                                    setMobileSearchOpen(false);
                                                    setSearchQuery('');
                                                }}
                                            >
                                                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-100/50 dark:border-primary-500/20 group-hover:scale-110 transition-transform">
                                                    <item.icon size={20} />
                                                </div>
                                                <span className="flex-1 text-base">{item.name}</span>
                                                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                                                    <ChevronDown size={16} className="transform -rotate-90" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center pb-20 animate-in fade-in duration-300">
                                        <div className="w-20 h-20 bg-white dark:bg-[#121820] shadow-sm border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center mb-5">
                                            <Search size={32} className="text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">لم يتم العثور على نتائج</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">حاول استخدام كلمات مفتاحية أخرى للبحث عن <span className="font-bold text-slate-700 dark:text-slate-300">"{searchQuery}"</span></p>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center pb-20 opacity-60">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-700">
                                        <Search size={32} className="text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">بحث سريع الملاحة</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">ابدأ بالكتابة للبحث عن أي صفحة في النظام...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-[var(--surface-bg)]">
                    <div className="max-w-7xl mx-auto page-enter">
                        {children}
                    </div>
                </main>
            </div>

            {/* Bottom Navigation — Mobile Only */}
            <nav className="bottom-nav" aria-label="التنقل السريع">
                <div className="bottom-nav-inner">
                    {filteredBottomNavItems.map((item, idx) => {
                        const isActive = isMenuActive(item.url, item.name, item.key);
                        const isMore = item.action === 'sidebar';
                        
                        if (isMore) {
                            return (
                                <button
                                    key={idx}
                                    className={`bottom-nav-item ${mobileSidebarOpen ? 'active' : ''}`}
                                    onClick={() => setMobileSidebarOpen(true)}
                                    aria-label={item.name}
                                >
                                    <item.icon size={22} className="nav-icon" />
                                    <span>{item.name}</span>
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={idx}
                                href={item.url}
                                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={22} className="nav-icon" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Global Toast Notifications */}
            <ToastNotification />
        </div>
    );
}
