import React, { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, Link } from '@inertiajs/react';
import { Activity, Users, MapPin, Clock, Search, X, Monitor, Smartphone, UserX, Shield, Zap, BarChart3, TrendingUp, Wifi, Filter, ChevronRight, Globe } from 'lucide-react';

export default function TrafficIndex({ 
    activeUsers = [], 
    totalActiveUsers = 0, 
    trafficData = [], 
    todayTraffic = [], 
    yesterdayTraffic = [], 
    branchTraffic = [], 
    currentRange = '15m', 
    searchResults = [] 
}) {
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [selectedOs, setSelectedOs] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showGhostComparison, setShowGhostComparison] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                router.get(route('admin.traffic.index'), { range: currentRange, search: searchQuery }, { 
                    preserveState: true, 
                    preserveScroll: true, 
                    only: ['searchResults'],
                    onFinish: () => setIsSearching(false)
                });
            } else if (searchQuery.length === 0 && searchResults.length > 0) {
                router.get(route('admin.traffic.index'), { range: currentRange }, { 
                    preserveState: true, 
                    preserveScroll: true, 
                    only: ['searchResults']
                });
            }
        }, 400);
        return () => clearTimeout(handler);
    }, [searchQuery, currentRange]);

    const filteredTrafficData = useMemo(() => {
        let data = trafficData;
        if (selectedRole) data = data.filter(d => d.role_name === selectedRole);
        if (selectedBranch) data = data.filter(d => d.branch_name === selectedBranch);
        if (selectedDevice) data = data.filter(d => d.device_type === selectedDevice);
        if (selectedOs) data = data.filter(d => d.os_name === selectedOs);

        const aggregated = {};
        data.forEach(d => {
            const key = `${d.day_of_week}-${d.hour}`;
            if (!aggregated[key]) {
                aggregated[key] = { day_of_week: d.day_of_week, hour: d.hour, request_count: 0 };
            }
            aggregated[key].request_count += d.request_count;
        });
        return Object.values(aggregated);
    }, [trafficData, selectedRole, selectedBranch, selectedDevice, selectedOs]);

    const filteredTodayTraffic = useMemo(() => {
        let data = todayTraffic || [];
        if (selectedRole) data = data.filter(d => d.role_name === selectedRole);
        if (selectedBranch) data = data.filter(d => d.branch_name === selectedBranch);
        if (selectedDevice) data = data.filter(d => d.device_type === selectedDevice);
        if (selectedOs) data = data.filter(d => d.os_name === selectedOs);
        
        const aggregated = Array(24).fill(0);
        data.forEach(d => { aggregated[d.hour] += d.request_count; });
        return aggregated;
    }, [todayTraffic, selectedRole, selectedBranch, selectedDevice, selectedOs]);

    const filteredYesterdayTraffic = useMemo(() => {
        let data = yesterdayTraffic || [];
        if (selectedRole) data = data.filter(d => d.role_name === selectedRole);
        if (selectedBranch) data = data.filter(d => d.branch_name === selectedBranch);
        if (selectedDevice) data = data.filter(d => d.device_type === selectedDevice);
        if (selectedOs) data = data.filter(d => d.os_name === selectedOs);
        
        const aggregated = Array(24).fill(0);
        data.forEach(d => { aggregated[d.hour] += d.request_count; });
        return aggregated;
    }, [yesterdayTraffic, selectedRole, selectedBranch, selectedDevice, selectedOs]);

    const filteredBranchTraffic = useMemo(() => {
        let data = branchTraffic;
        if (selectedRole) data = data.filter(b => b.role_name === selectedRole);
        if (selectedDevice) data = data.filter(b => b.device_type === selectedDevice);
        if (selectedOs) data = data.filter(b => b.os_name === selectedOs);

        const aggregated = {};
        data.forEach(b => {
            if (!aggregated[b.branch_name]) {
                aggregated[b.branch_name] = { branch_name: b.branch_name, count: 0 };
            }
            aggregated[b.branch_name].count += b.count;
        });
        return Object.values(aggregated);
    }, [branchTraffic, selectedRole, selectedDevice, selectedOs]);

    const displayActiveUsers = useMemo(() => {
        let data = activeUsers;
        if (selectedBranch) data = data.filter(u => u.branch_name === selectedBranch);
        if (selectedDevice) data = data.filter(u => u.device_type === selectedDevice);
        if (selectedOs) data = data.filter(u => u.os_name === selectedOs);
        
        const aggregated = {};
        data.forEach(u => {
            if (!aggregated[u.role_name]) {
                aggregated[u.role_name] = { role_name: u.role_name, count: 0 };
            }
            aggregated[u.role_name].count += u.count;
        });
        return Object.values(aggregated);
    }, [activeUsers, selectedBranch, selectedDevice, selectedOs]);

    const displayTotalUsers = displayActiveUsers.reduce((sum, role) => sum + role.count, 0);

    // Computed helpers
    const totalTodayRequests = filteredTodayTraffic.reduce((sum, v) => sum + v, 0);
    const peakHour = filteredTodayTraffic.indexOf(Math.max(...filteredTodayTraffic));
    const hasActiveFilters = selectedRole || selectedBranch || selectedDevice || selectedOs;

    const clearAllFilters = () => {
        setSelectedRole(null);
        setSelectedBranch(null);
        setSelectedDevice(null);
        setSelectedOs(null);
    };

    const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    return (
        <AdminLayout activeMenu="إحصائيات المرور">
            <Head title="إحصائيات المرور الحية" />

            <div className="max-w-[100rem] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

                {/* ═══════════════════════════════════════════════════════════
                    HEADER — Brand hero with controls
                   ═══════════════════════════════════════════════════════════ */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
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
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0 shadow-sm border border-primary-50 dark:border-primary-500/20">
                                <Activity size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">إحصائيات المرور الحية</h1>
                                    <Link 
                                        href={route('admin.engagement.index')} 
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 dark:bg-dark-700 dark:hover:bg-dark-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                    >
                                        <Users size={14} />
                                        سجل تفاعل المستخدمين
                                        <ChevronRight size={12} className="opacity-60" />
                                    </Link>
                                </div>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">مراقبة تفاعل المستخدمين والضغط على النظام في الوقت الفعلي</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 z-50">
                            {/* Device & OS Filter */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-primary-100 dark:border-primary-500/20 shadow-sm w-fit">
                                    <button 
                                        onClick={() => { setSelectedDevice(selectedDevice === 'desktop' ? null : 'desktop'); setSelectedOs(null); }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                            selectedDevice === 'desktop' 
                                            ? 'bg-primary-500 text-white shadow-sm' 
                                            : 'text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10'
                                        }`}
                                    >
                                        <Monitor size={16} />
                                        <span className="hidden sm:inline">كمبيوتر</span>
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedDevice(selectedDevice === 'mobile' ? null : 'mobile'); setSelectedOs(null); }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                            selectedDevice === 'mobile' 
                                            ? 'bg-primary-500 text-white shadow-sm' 
                                            : 'text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10'
                                        }`}
                                    >
                                        <Smartphone size={16} />
                                        <span className="hidden sm:inline">جوال</span>
                                    </button>
                                </div>
                                
                                {selectedDevice && (
                                    <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-primary-100 dark:border-primary-500/20 shadow-sm w-fit animate-fade-in-down">
                                        {selectedDevice === 'mobile' ? (
                                            <>
                                                <button onClick={() => setSelectedOs(selectedOs === 'ios' ? null : 'ios')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedOs === 'ios' ? 'bg-dark-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                                    <span>🍏</span> iOS
                                                </button>
                                                <button onClick={() => setSelectedOs(selectedOs === 'android' ? null : 'android')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedOs === 'android' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-500 hover:bg-primary-50 dark:hover:bg-primary-500/10'}`}>
                                                    <span>🤖</span> Android
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setSelectedOs(selectedOs === 'windows' ? null : 'windows')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedOs === 'windows' ? 'bg-dark-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                                    <span>🪟</span> Windows
                                                </button>
                                                <button onClick={() => setSelectedOs(selectedOs === 'mac' ? null : 'mac')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedOs === 'mac' ? 'bg-dark-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                                    <span>🍏</span> Mac
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Live Spotlight Search */}
                            <div className="relative w-full md:w-64 lg:w-80 group">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-primary-400">
                                    <Search size={18} />
                                </div>
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="بحث الكشّاف عن مستخدم..."
                                    className="bg-white/80 dark:bg-slate-900/80 border border-primary-100 dark:border-primary-500/20 text-slate-800 dark:text-white text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block w-full pr-10 p-2.5 placeholder-slate-400 font-semibold shadow-sm transition-all focus:bg-white"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 hover:text-accent-500 transition-colors">
                                        <X size={16} />
                                    </button>
                                )}
                                
                                {(searchQuery.length >= 2 || searchResults.length > 0) && (
                                    <div className="absolute top-full mt-2 w-full max-h-80 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50">
                                        {isSearching ? (
                                            <div className="p-6 text-center text-primary-500 text-sm font-semibold animate-pulse flex items-center justify-center gap-2"><Wifi size={16} /> جاري البحث...</div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="flex flex-col py-1">
                                                {searchResults.map((user) => (
                                                    <div key={user.id} className="px-4 py-3 hover:bg-primary-50/50 dark:hover:bg-primary-500/5 transition-colors flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 last:border-0 group/item">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ring-1 ${user.is_online ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 ring-primary-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 ring-slate-200 dark:ring-slate-700'}`}>
                                                                {user.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                                                    {user.name}
                                                                    {user.is_online && (
                                                                        <span className="flex h-2 w-2 relative">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-500 mt-0.5 flex gap-1.5">
                                                                    <span className="bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 px-1.5 py-0.5 rounded">{user.role_name}</span>
                                                                    <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{user.branch_name}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-left text-[10px] font-bold text-slate-400">
                                                            {user.is_online ? <span className="text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-md">متصل الآن</span> : user.last_activity}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-6 text-center text-slate-400 text-sm font-semibold flex flex-col items-center gap-2">
                                                <Search size={20} className="text-slate-300" />
                                                لا توجد نتائج مطابقة
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    ACTIVE FILTERS BAR — shows when filters are active
                   ═══════════════════════════════════════════════════════════ */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-3 flex-wrap px-1 animate-fade-in-down">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <Filter size={14} />
                            الفلاتر النشطة:
                        </div>
                        {selectedRole && (
                            <button onClick={() => setSelectedRole(null)} className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg text-[11px] font-bold ring-1 ring-primary-500/20 hover:bg-primary-100 transition-colors">
                                <Shield size={11} /> {selectedRole} <X size={11} />
                            </button>
                        )}
                        {selectedBranch && (
                            <button onClick={() => setSelectedBranch(null)} className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg text-[11px] font-bold ring-1 ring-primary-500/20 hover:bg-primary-100 transition-colors">
                                <MapPin size={11} /> {selectedBranch} <X size={11} />
                            </button>
                        )}
                        {selectedDevice && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-50 dark:bg-dark-700 text-dark-600 dark:text-dark-300 rounded-lg text-[11px] font-bold ring-1 ring-dark-200 dark:ring-dark-600">
                                {selectedDevice === 'desktop' ? <Monitor size={11} /> : <Smartphone size={11} />} {selectedDevice === 'desktop' ? 'كمبيوتر' : 'جوال'}
                                {selectedOs && <span className="mr-1 text-slate-400">/ {selectedOs}</span>}
                            </span>
                        )}
                        <button onClick={clearAllFilters} className="flex items-center gap-1 px-2.5 py-1 bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 rounded-lg text-[11px] font-bold ring-1 ring-accent-500/20 hover:bg-accent-100 transition-colors">
                            <X size={11} /> مسح الكل
                        </button>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    KPI CARDS ROW — Live stats overview
                   ═══════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Active Users */}
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute -left-4 -top-4 w-20 h-20 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">المتصلون الآن</p>
                                <div className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-black text-slate-800 dark:text-white font-mono">{displayTotalUsers}</h3>
                                <span className="text-sm font-bold text-slate-400 mb-1">مستخدم</span>
                            </div>
                        </div>
                    </div>

                    {/* Today Total Requests */}
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute -left-4 -top-4 w-20 h-20 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي طلبات اليوم</p>
                                <div className="p-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-500 rounded-lg ring-1 ring-primary-500/20">
                                    <TrendingUp size={14} />
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-black text-slate-800 dark:text-white font-mono">{totalTodayRequests.toLocaleString('ar-SA')}</h3>
                                <span className="text-sm font-bold text-slate-400 mb-1">طلب</span>
                            </div>
                        </div>
                    </div>

                    {/* Peak Hour */}
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute -left-4 -top-4 w-20 h-20 bg-amber-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">ساعة الذروة اليوم</p>
                                <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-lg ring-1 ring-amber-500/20">
                                    <Zap size={14} />
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-black text-slate-800 dark:text-white font-mono">{peakHour}:00</h3>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold">{filteredTodayTraffic[peakHour]?.toLocaleString('ar-SA') || 0} طلب في هذه الساعة</p>
                        </div>
                    </div>

                    {/* Active Branches */}
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute -left-4 -top-4 w-20 h-20 bg-primary-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">الفروع النشطة</p>
                                <div className="p-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-500 rounded-lg ring-1 ring-primary-500/20">
                                    <Globe size={14} />
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-black text-slate-800 dark:text-white font-mono">{filteredBranchTraffic.length}</h3>
                                <span className="text-sm font-bold text-slate-400 mb-1">فرع</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    ROLES BREAKDOWN + TIME RANGE — Side-by-side
                   ═══════════════════════════════════════════════════════════ */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl ring-1 ring-primary-500/20">
                                <Users size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">توزيع المتصلين حسب الدور</h3>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                    {currentRange === '5m' ? 'آخر 5 دقائق' : currentRange === '15m' ? 'آخر 15 دقيقة' : currentRange === 'today' ? 'اليوم' : 'هذا الأسبوع'}
                                </p>
                            </div>
                        </div>

                        {/* Time Range Selector */}
                        <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            {[
                                { key: '5m', label: '⚡ الآن (5د)' },
                                { key: '15m', label: '15 دقيقة' },
                                { key: 'today', label: '🕒 اليوم' },
                                { key: 'week', label: '📅 الأسبوع' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => router.get(route('admin.traffic.index'), { range: key }, { preserveState: true, preserveScroll: true, only: ['activeUsers', 'totalActiveUsers', 'branchTraffic', 'currentRange'] })}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${currentRange === key ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm ring-1 ring-primary-500/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Role Tags */}
                    <div className="flex flex-wrap gap-2">
                        {displayActiveUsers.map((role, idx) => {
                            const isSelected = selectedRole === role.role_name;
                            const percentage = displayTotalUsers > 0 ? Math.round((role.count / displayTotalUsers) * 100) : 0;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedRole(isSelected ? null : role.role_name)}
                                    className={`relative px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all duration-300 overflow-hidden ${
                                        isSelected
                                        ? 'bg-primary-600 text-white border-primary-600 shadow-md scale-105'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-500/30'
                                    } ${selectedRole && !isSelected ? 'opacity-40 grayscale' : ''}`}
                                >
                                    {/* Mini progress bg */}
                                    {!isSelected && (
                                        <div className="absolute bottom-0 right-0 left-0 h-1 bg-slate-100 dark:bg-slate-700">
                                            <div className="h-full bg-primary-400/40 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                                        </div>
                                    )}
                                    <Shield size={13} />
                                    <span>{role.role_name}</span>
                                    <span className={`font-black ${isSelected ? 'text-primary-100' : 'text-primary-600 dark:text-primary-400'}`}>{role.count}</span>
                                    <span className={`text-[9px] ${isSelected ? 'text-primary-200' : 'text-slate-400'}`}>({percentage}%)</span>
                                </button>
                            );
                        })}
                        {displayActiveUsers.length === 0 && (
                            <div className="text-sm text-slate-400 font-semibold flex items-center gap-2 py-2">
                                <UserX size={16} />
                                لا يوجد مستخدمين نشطين حالياً
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    HEATMAP — Peak hours visualization
                   ═══════════════════════════════════════════════════════════ */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary-50/20 dark:bg-primary-500/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl ring-1 ring-primary-500/20">
                                <BarChart3 size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">الخريطة الحرارية لأوقات الذروة</h3>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">كثافة استخدام النظام حسب الساعة واليوم</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setShowGhostComparison(!showGhostComparison)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                showGhostComparison 
                                ? 'bg-dark-800 text-white border-dark-800 dark:bg-white dark:text-dark-900 dark:border-white shadow-lg' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span>👻</span>
                            {showGhostComparison ? 'إخفاء مقارنة الأمس' : 'مقارنة بأمس'}
                        </button>
                    </div>

                    <div className="p-6 overflow-x-auto dir-ltr">
                        <div className="min-w-[800px]">
                            {/* Header (Hours) */}
                            <div className="flex mb-2">
                                <div className="w-20 shrink-0"></div>
                                <div className="flex-1 grid grid-cols-24 gap-1">
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div key={i} className={`text-[10px] font-bold text-center ${i === peakHour ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>{i}</div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Grid (Days) */}
                            <div className="space-y-1">
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, dayIndex) => {
                                    const maxRequestCount = Math.max(...filteredTrafficData.map(d => d.request_count), 1);
                                    const dayTotal = filteredTrafficData.filter(d => d.day_of_week === dayIndex).reduce((s, d) => s + d.request_count, 0);
                                    return (
                                        <div key={dayIndex} className="flex items-center group/row">
                                            <div className="w-20 shrink-0 text-xs font-bold text-slate-500 group-hover/row:text-primary-600 transition-colors flex items-center justify-between pr-2">
                                                <span>{arabicDays[dayIndex]}</span>
                                                {dayTotal > 0 && <span className="text-[8px] text-slate-400 font-mono">{dayTotal}</span>}
                                            </div>
                                            <div className="flex-1 grid grid-cols-24 gap-1">
                                                {Array.from({ length: 24 }).map((_, hourIndex) => {
                                                    const cellData = filteredTrafficData.find(d => d.day_of_week === dayIndex && d.hour === hourIndex);
                                                    const count = cellData ? cellData.request_count : 0;
                                                    const intensity = count > 0 ? Math.max(0.1, count / maxRequestCount) : 0;
                                                    const bgOpacity = count === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : '';
                                                    const bgColor = count > 0 ? `rgba(107, 155, 55, ${intensity})` : undefined;
                                                    
                                                    return (
                                                        <div 
                                                            key={hourIndex} 
                                                            className={`h-7 rounded-[4px] relative group/cell cursor-pointer transition-all hover:scale-110 hover:z-10 ${bgOpacity}`}
                                                            style={{ backgroundColor: bgColor }}
                                                        >
                                                            <div className="absolute opacity-0 group-hover/cell:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-dark-800 text-white text-[10px] py-1.5 px-3 rounded-xl whitespace-nowrap z-50 pointer-events-none transition-all shadow-lg ring-1 ring-white/10">
                                                                <div className="font-black text-primary-300">{count} طلب</div>
                                                                <div className="text-slate-400 mt-0.5">{arabicDays[dayIndex]} — {hourIndex}:00</div>
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-dark-800 rotate-45 -mt-1"></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Legend */}
                            <div className="flex items-center justify-end gap-2 mt-5 text-[10px] font-bold text-slate-500">
                                <span>أقل ضغط</span>
                                <div className="flex gap-0.5">
                                    <div className="w-5 h-3 rounded-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"></div>
                                    <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: 'rgba(107, 155, 55, 0.2)' }}></div>
                                    <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: 'rgba(107, 155, 55, 0.4)' }}></div>
                                    <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: 'rgba(107, 155, 55, 0.6)' }}></div>
                                    <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: 'rgba(107, 155, 55, 0.8)' }}></div>
                                    <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: 'rgba(107, 155, 55, 1)' }}></div>
                                </div>
                                <span>أعلى ضغط</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* ═══════════════════════════════════════════════════════════
                    GHOST COMPARISON CHART — Today vs Yesterday
                   ═══════════════════════════════════════════════════════════ */}
                {showGhostComparison && (
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm animate-fade-in-down">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary-50/20 dark:bg-primary-500/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl ring-1 ring-primary-500/20">
                                    <Activity size={18} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">مقارنة الذروة — اليوم مقابل أمس</h3>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold">
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary-500 ring-2 ring-primary-500/20"></span> اليوم</div>
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-dashed border-slate-400"></span> أمس</div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="h-52 relative w-full">
                                <svg viewBox="0 0 240 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                    {[0, 25, 50, 75, 100].map((y) => (
                                        <line key={y} x1="0" y1={y} x2="240" y2={y} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.3" />
                                    ))}
                                    
                                    {(() => {
                                        const maxVal = Math.max(...filteredTodayTraffic, ...filteredYesterdayTraffic, 10);
                                        
                                        const makePath = (data) => {
                                            if (data.length === 0) return '';
                                            const points = data.map((val, i) => {
                                                const x = i * (240 / 23);
                                                const y = 100 - (val / maxVal) * 88;
                                                return `${x},${y}`;
                                            });
                                            return `M 0,100 L 0,${100 - (data[0] / maxVal) * 88} L ${points.join(' L ')} L 240,100 Z`;
                                        };
                                        const makeStroke = (data) => {
                                            if (data.length === 0) return '';
                                            const points = data.map((val, i) => {
                                                const x = i * (240 / 23);
                                                const y = 100 - (val / maxVal) * 88;
                                                return `${x},${y}`;
                                            });
                                            return `M ${points.join(' L ')}`;
                                        };

                                        return (
                                            <>
                                                <path d={makePath(filteredYesterdayTraffic)} fill="currentColor" className="text-slate-200/50 dark:text-slate-700/30" />
                                                <path d={makeStroke(filteredYesterdayTraffic)} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400/50 dark:text-slate-500/50" strokeDasharray="4 4" />
                                                
                                                <path d={makePath(filteredTodayTraffic)} fill="url(#gradientToday)" />
                                                <path d={makeStroke(filteredTodayTraffic)} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-500" strokeLinecap="round" strokeLinejoin="round" />
                                                
                                                {/* Data dots on today's line */}
                                                {filteredTodayTraffic.map((val, i) => {
                                                    if (val === 0) return null;
                                                    const x = i * (240 / 23);
                                                    const y = 100 - (val / maxVal) * 88;
                                                    return <circle key={i} cx={x} cy={y} r="1.5" fill="currentColor" className="text-primary-600" />;
                                                })}

                                                <defs>
                                                    <linearGradient id="gradientToday" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" className="text-primary-500" />
                                                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" className="text-primary-500" />
                                                    </linearGradient>
                                                </defs>
                                            </>
                                        );
                                    })()}
                                </svg>
                                <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] font-bold text-slate-400 px-1">
                                    <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    BRANCHES RADAR — Network map
                   ═══════════════════════════════════════════════════════════ */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-primary-50/20 dark:bg-primary-500/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl ring-1 ring-primary-500/20">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">التوزيع الجغرافي ونشاط الفروع</h3>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">رادار مباشر يوضح مراكز الضغط حسب فرع كل مستخدم</p>
                            </div>
                        </div>
                        {filteredBranchTraffic.length > 0 && (
                            <div className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
                                {filteredBranchTraffic.reduce((s, b) => s + b.count, 0)} مستخدم نشط
                            </div>
                        )}
                    </div>

                    <div className="p-6">
                        {filteredBranchTraffic.length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center gap-3">
                                <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 ring-1 ring-primary-500/20">
                                    <MapPin size={28} />
                                </div>
                                <p className="text-slate-500 font-bold text-sm">لا يوجد مستخدمون نشطون مقترنون بفروع حالياً.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 relative">
                                <div className="absolute inset-0 pointer-events-none opacity-15 dark:opacity-10 z-0 hidden lg:block">
                                    <svg width="100%" height="100%" style={{ minHeight: '200px' }}>
                                        <path d="M100 100 Q 300 50, 500 150 T 900 100" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary-400" strokeDasharray="4 4" />
                                        <path d="M150 150 Q 400 250, 700 50" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary-400" strokeDasharray="4 4" />
                                    </svg>
                                </div>

                                {filteredBranchTraffic.map((branch, idx) => {
                                    const maxBranchCount = Math.max(...filteredBranchTraffic.map(b => b.count), 1);
                                    const percentage = Math.round((branch.count / maxBranchCount) * 100);

                                    let statusColor = 'bg-primary-500';
                                    let statusBg = 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/30';
                                    let textColor = 'text-primary-700 dark:text-primary-400';
                                    let barColor = 'from-primary-400 to-primary-600';
                                    let pulseClass = '';

                                    if (branch.count > 50) {
                                        statusColor = 'bg-accent-500';
                                        statusBg = 'bg-accent-50 dark:bg-accent-500/10 border-accent-200 dark:border-accent-500/30';
                                        textColor = 'text-accent-700 dark:text-accent-400';
                                        barColor = 'from-accent-400 to-accent-600';
                                        pulseClass = 'animate-pulse';
                                    } else if (branch.count > 10) {
                                        statusColor = 'bg-amber-500';
                                        statusBg = 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30';
                                        textColor = 'text-amber-700 dark:text-amber-400';
                                        barColor = 'from-amber-400 to-amber-600';
                                    }

                                    const isBranchSelected = selectedBranch === branch.branch_name;
                                    const opacityClass = selectedBranch && !isBranchSelected ? 'opacity-30 grayscale' : '';
                                    const shadowClass = isBranchSelected ? 'shadow-xl ring-2 ring-primary-500 scale-105' : 'hover:-translate-y-1.5 hover:shadow-lg';

                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => setSelectedBranch(isBranchSelected ? null : branch.branch_name)}
                                            className={`relative z-10 flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 w-full bg-white dark:bg-slate-800 ${statusBg} ${opacityClass} ${shadowClass}`}
                                        >
                                            <div className="relative mb-3">
                                                {branch.count > 10 && (
                                                    <div className={`absolute -inset-3 rounded-full opacity-20 ${pulseClass} ${statusColor} blur-md`}></div>
                                                )}
                                                <div className={`absolute -inset-1 rounded-full opacity-30 ${pulseClass} ${statusColor} blur-sm`}></div>
                                                <div className={`relative h-11 w-11 rounded-full border-[3px] border-white dark:border-slate-800 shadow-md flex items-center justify-center ${statusColor} text-white`}>
                                                    <MapPin size={18} strokeWidth={2.5} />
                                                </div>
                                            </div>
                                            
                                            <h4 className="font-black text-xs text-center text-slate-800 dark:text-white mb-1.5 line-clamp-1">{branch.branch_name}</h4>
                                            <div className={`text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-slate-900/50 ${textColor} mb-2`}>
                                                {branch.count} نشط
                                            </div>
                                            {/* Activity bar */}
                                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                                                <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
