import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Bell, Check, Calendar, Star, AlertTriangle, Info, Mail, Search } from 'lucide-react';

export default function MyNotifications({ auth, notifications, stats, filters }) {
    const [currentFilter, setCurrentFilter] = useState(filters.type || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    const handleFilterChange = (typeVal, statusVal) => {
        router.get(route('notifications.my-notifications'), { type: typeVal, status: statusVal }, { preserveState: true });
    };

    const typeOptions = [
        { value: 'all', label: 'جميع الأنواع' },
        { value: 'general', label: 'عام' },
        { value: 'important', label: 'هام' },
        { value: 'warning', label: 'تحذير' }
    ];

    const statusOptions = [
        { value: 'all', label: 'جميع الحالات' },
        { value: 'unread', label: 'غير مقروءة' },
        { value: 'read', label: 'مقروءة' }
    ];

    const markAllAsRead = () => {
        router.post(route('notifications.read-all'), {}, {
            preserveScroll: true,
            onSuccess: () => router.reload()
        });
    };

    const markAsRead = (id) => {
        router.post(route('notifications.read', id), {}, {
            preserveScroll: true,
            onSuccess: () => router.reload()
        });
    };

    return (
        <AdminLayout user={auth.user} activeMenu="إشعاراتي">
            <Head title="إشعاراتي وتنبيهاتي" />

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in pb-20">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820]/95 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-dark-800" />
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/30 shadow-inner">
                                <Mail size={32} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">إشعاراتي وتنبيهاتي</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
                                    استعرض وتتبع جميع الإشعارات والتنبيهات الخاصة بك في مكان واحد.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Header Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Bell size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500">إجمالي الإشعارات</p>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white">{stats.total}</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Star size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500">الإشعارات غير المقروءة</p>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white">{stats.unread}</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500">الهامة والتحذيرية</p>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white">{stats.important}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-2">
                        {/* Toolbar */}
                        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="relative w-48">
                                    <select 
                                        value={currentFilter}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCurrentFilter(val);
                                            handleFilterChange(val, statusFilter);
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-bold text-sm appearance-none outline-none shadow-sm cursor-pointer"
                                    >
                                        {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                                <div className="relative w-48">
                                    <select 
                                        value={statusFilter}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setStatusFilter(val);
                                            handleFilterChange(currentFilter, val);
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-bold text-sm appearance-none outline-none shadow-sm cursor-pointer"
                                    >
                                        {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>

                            {stats.unread > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="px-5 py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl font-bold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors flex items-center gap-2"
                                >
                                    <Check size={18} /> تعيين الكل كمقروء
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
                            {notifications.data.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5">
                                        <Bell size={36} className="text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">لا توجد إشعارات لعرضها</h3>
                                    <p className="text-slate-500">لم نجد أي إشعارات تتطابق مع بحثك أو الفلتر المستخدم.</p>
                                </div>
                            ) : (
                                notifications.data.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        className={`p-5 m-3 rounded-[1.5rem] flex flex-col sm:flex-row gap-5 transition-all duration-300 group ${!notification.is_read ? 'bg-white dark:bg-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-none border-r-4 border-primary-500 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden' : 'bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'}`}
                                    >
                                        {!notification.is_read && (
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl pointer-events-none"></div>
                                        )}
                                        <div className="shrink-0 flex items-start gap-4 relative z-10">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                                                notification.type === 'warning' ? 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 dark:from-amber-900/40 dark:to-amber-800/20 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50' :
                                                notification.type === 'important' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50' :
                                                'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 dark:from-primary-900/40 dark:to-primary-800/20 dark:text-primary-400 border border-primary-200 dark:border-primary-700/50'
                                            }`}>
                                                {notification.type === 'warning' ? <AlertTriangle size={24} /> :
                                                 notification.type === 'important' ? <Star size={24} /> :
                                                 <Info size={24} />}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 relative z-10">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                <h3 className={`text-xl ${!notification.is_read ? 'font-black text-slate-800 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400'}`}>
                                                    {notification.title}
                                                </h3>
                                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                                    <Calendar size={14} />
                                                    {new Date(notification.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                            </div>
                                            
                                            <div className={`${!notification.is_read ? 'bg-slate-50/80 dark:bg-slate-900/80' : 'bg-white dark:bg-slate-900/50'} rounded-2xl p-4 border border-slate-100/50 dark:border-slate-700/50 mb-4 shadow-sm`}>
                                                <p className={`${!notification.is_read ? 'text-slate-700 dark:text-slate-300 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'} leading-relaxed whitespace-pre-line text-sm sm:text-base`}>
                                                    {notification.message}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-4 text-sm font-semibold text-slate-500 mt-auto">
                                                {notification.sender ? (
                                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                        <span className="text-slate-400 text-xs">بواسطة:</span>
                                                        <span className="text-slate-700 dark:text-slate-300 font-bold">{notification.sender.name}</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                                        <span className="text-slate-400 text-xs">بواسطة:</span>
                                                        <span className="text-primary-600 dark:text-primary-400 font-bold">النظام الذكي</span>
                                                    </span>
                                                )}
                                                
                                                {!notification.is_read && (
                                                    <button 
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-primary-600 hover:text-white dark:text-primary-400 dark:hover:text-white flex items-center gap-1.5 bg-primary-50 hover:bg-primary-600 dark:bg-primary-900/20 dark:hover:bg-primary-600 px-4 py-2.5 rounded-xl transition-all ml-auto sm:ml-0 font-bold active:scale-95 border border-primary-100 dark:border-primary-800 shadow-sm hover:shadow-primary-500/30"
                                                    >
                                                        <Check size={16} /> تحديد كمقروء
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {notifications.last_page > 1 && (
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                                <div className="flex gap-1">
                                    {notifications.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                                                link.active 
                                                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' 
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
