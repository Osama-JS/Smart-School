import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Bell, Check, Filter, Calendar, Star, AlertTriangle, Info, Search, Trash2, Mail } from 'lucide-react';
import Select from 'react-select';

export default function MyNotifications({ auth, notifications, stats, filters }) {
    const [currentFilter, setCurrentFilter] = useState(
        filters.type ? { value: filters.type, label: filters.type === 'general' ? 'عام' : filters.type === 'important' ? 'هام' : 'تحذير' } : { value: 'all', label: 'جميع الأنواع' }
    );
    const [statusFilter, setStatusFilter] = useState(
        filters.status ? { value: filters.status, label: filters.status === 'unread' ? 'غير مقروءة' : 'مقروءة' } : { value: 'all', label: 'جميع الحالات' }
    );

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
        <AdminLayout activeMenu="إشعاراتي">
            <Head title="إشعاراتي وتنبيهاتي" />

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mt-6 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
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
                            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight flex items-center gap-3">
                                <Mail className="text-primary-600" size={32} />
                                إشعاراتي وتنبيهاتي
                            </h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                استعرض وتتبع جميع الإشعارات والتنبيهات الخاصة بك في مكان واحد.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                                <Bell size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500">إجمالي الإشعارات</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                                <Star size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500">الإشعارات غير المقروءة</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.unread}</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500">الإشعارات الهامة والتحذيرية</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.important}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="w-48">
                                    <Select 
                                        options={typeOptions}
                                        value={currentFilter}
                                        onChange={(selected) => {
                                            setCurrentFilter(selected);
                                            handleFilterChange(selected.value, statusFilter.value);
                                        }}
                                        classNamePrefix="react-select"
                                        placeholder="نوع الإشعار"
                                    />
                                </div>
                                <div className="w-48">
                                    <Select 
                                        options={statusOptions}
                                        value={statusFilter}
                                        onChange={(selected) => {
                                            setStatusFilter(selected);
                                            handleFilterChange(currentFilter.value, selected.value);
                                        }}
                                        classNamePrefix="react-select"
                                        placeholder="حالة الإشعار"
                                    />
                                </div>
                            </div>

                            {stats.unread > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl font-bold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors flex items-center gap-2"
                                >
                                    <Check size={18} /> تعيين الكل كمقروء
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {notifications.data.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                        <Bell size={32} className="text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">لا توجد إشعارات لعرضها</h3>
                                    <p className="text-slate-500 mt-2">لم نجد أي إشعارات تتطابق مع بحثك أو الفلتر المستخدم.</p>
                                </div>
                            ) : (
                                notifications.data.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        className={`p-6 sm:p-8 flex flex-col sm:flex-row gap-6 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20 ${!notification.is_read ? 'bg-primary-50/20 dark:bg-primary-900/5' : ''}`}
                                    >
                                        <div className="shrink-0 flex items-start gap-4">
                                            {!notification.is_read && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] mt-4" />
                                            )}
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                                                notification.type === 'warning' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                                                notification.type === 'important' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' :
                                                'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400'
                                            }`}>
                                                {notification.type === 'warning' ? <AlertTriangle size={24} /> :
                                                 notification.type === 'important' ? <Star size={24} /> :
                                                 <Info size={24} />}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <h3 className={`text-lg ${!notification.is_read ? 'font-black text-slate-800 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                                                    {notification.title}
                                                </h3>
                                                <span className="text-sm font-semibold text-slate-400 flex items-center gap-1.5">
                                                    <Calendar size={14} />
                                                    {new Date(notification.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                            </div>
                                            
                                            <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                                                    {notification.message}
                                                </p>
                                            </div>

                                            <div className="mt-4 flex items-center gap-4 text-sm font-semibold text-slate-500">
                                                {notification.sender && (
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="text-slate-400">بواسطة:</span>
                                                        <span className="text-slate-700 dark:text-slate-300">{notification.sender.name}</span>
                                                    </span>
                                                )}
                                                
                                                {!notification.is_read && (
                                                    <button 
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1.5 mr-auto"
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
