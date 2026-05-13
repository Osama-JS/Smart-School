import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    Home, Users, BookOpen, Shield, Newspaper, Bell, Smartphone, 
    AlertTriangle, Calendar, FileText, CheckSquare, Star, Eye, 
    ClipboardList, Map, Book, Library, BarChart, UserPlus, Settings,
    Menu, ChevronDown, LogOut, User, Search, X,
    PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

export default function AdminLayout({ children, activeMenu = 'المستخدمون' }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [profileDropdown, setProfileDropdown] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClick = () => setProfileDropdown(false);
        if (profileDropdown) document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [profileDropdown]);

    const menuGroups = [
        {
            title: 'القائمة الرئيسية',
            items: [
                { name: 'الرئيسية', icon: Home, url: route('dashboard') },
                { name: 'المستخدمون', icon: Users, url: route('users.index') },
            ]
        },
        {
            title: 'الشؤون الأكاديمية',
            items: [
                { name: 'الفصول والمواد', icon: BookOpen },
                { name: 'جدول الحصص', icon: Calendar },
                { name: 'جداول الاختبارات', icon: FileText },
                { name: 'النتائج الشهرية', icon: BarChart },
                { name: 'الطلاب المسجلين', icon: UserPlus },
            ]
        },
        {
            title: 'الإشراف والمتابعة',
            items: [
                { name: 'الحضور', icon: CheckSquare },
                { name: 'التقييم', icon: Star },
                { name: 'الزيارات الصفية', icon: Eye },
                { name: 'دفاتر المتابعة', icon: ClipboardList },
                { name: 'الخطط الدراسية', icon: Map },
                { name: 'دفاتر تحضير المعلمين', icon: Book },
            ]
        },
        {
            title: 'المحتوى والتواصل',
            items: [
                { name: 'الأخبار', icon: Newspaper },
                { name: 'المكتبة', icon: Library },
                { name: 'الإشعارات', icon: Bell },
                { name: 'المخالفات والإبداع', icon: AlertTriangle },
            ]
        },
        {
            title: 'الإدارة',
            items: [
                { name: 'إدارة الصلاحيات', icon: Shield },
                { name: 'إعدادات النظام', icon: Settings },
            ]
        },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Brand Line */}
            <div className="brand-line"></div>
            
            {/* Logo */}
            <div className="p-5 flex items-center gap-3 border-b border-white/10">
                <img src="/alqiam_school/public/images/logo.png" alt="مدارس القيم" className="h-11 w-11 rounded-xl object-contain bg-white/10 p-1 shrink-0" />
                <div className="leading-tight overflow-hidden">
                    <h1 className="font-bold text-white text-[15px] truncate">مدارس القيم</h1>
                    <p className="text-[11px] text-gray-500 truncate">نظام القيم ERP</p>
                </div>
            </div>

            {/* Menu Groups */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
                {menuGroups.map((group, gIdx) => (
                    <div key={gIdx}>
                        <p className="erp-sidebar-section">{group.title}</p>
                        <ul className="space-y-0.5">
                            {group.items.map((menu, index) => {
                                const isActive = menu.name === activeMenu;
                                return (
                                    <li key={index}>
                                        <Link
                                            href={menu.url || '#'}
                                            className={`erp-sidebar-item ${isActive ? 'active' : ''}`}
                                            onClick={() => setMobileSidebarOpen(false)}
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
                            {auth?.user?.name || 'مدير النظام'}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                            {auth?.user?.username || 'admin'}
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

            {/* Mobile Sidebar */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" 
                        onClick={() => setMobileSidebarOpen(false)} 
                    />
                    <aside className="erp-sidebar absolute right-0 top-0 h-full w-[280px] z-50 animate-slide-right flex flex-col">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Topbar */}
                <header className={`erp-topbar flex items-center justify-between px-4 lg:px-6 ${scrolled ? 'scrolled' : ''}`}>
                    <div className="flex items-center gap-3">
                        <button className="erp-btn-ghost lg:hidden" onClick={() => setMobileSidebarOpen(true)}>
                            <Menu size={22} />
                        </button>
                        <button className="erp-btn-ghost hidden lg:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                        </button>
                        <div className="hidden md:flex items-center relative">
                            <Search size={16} className="absolute right-3 text-slate-400 pointer-events-none" />
                            <input 
                                type="text" 
                                placeholder="بحث سريع..." 
                                className="erp-input w-64 pr-9 text-sm !py-2 !border-slate-200 bg-slate-50/80 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="erp-btn-ghost relative">
                            <Bell size={20} />
                            <span className="notification-dot"></span>
                        </button>

                        <div className="relative">
                            <button 
                                className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                                onClick={(e) => { e.stopPropagation(); setProfileDropdown(!profileDropdown); }}
                            >
                                <div className="text-left hidden sm:block">
                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                        {auth?.user?.name || 'مدير النظام'}
                                    </p>
                                    <p className="text-[11px] text-slate-500">مدير النظام</p>
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
                                    <Link href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
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

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--surface-bg)]">
                    <div className="max-w-7xl mx-auto page-enter">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
