import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, Trash2, Settings, Circle, AlertTriangle, Star, Info, Clock } from 'lucide-react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import { requestFirebaseNotificationPermission, onForegroundMessage } from '@/firebase';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const [activePopupNotification, setActivePopupNotification] = useState(null);

    // إغلاق القائمة عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // جلب الإشعارات
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await axios.get(route('notifications.index'));
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unread_count);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const playNotificationSound = () => {
        try {
            // استخدام مسار صوتي عام أو ملف بداخل public/sounds
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play();
        } catch (error) {
            console.error('Audio play failed', error);
        }
    };

    // تسجيل الدخول والإعداد الأولي والـ Polling
    useEffect(() => {
        let lastNotificationId = null;

        const checkNewNotifications = async () => {
            try {
                const res = await axios.get(route('notifications.index'));
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.unread_count);

                // إذا كان هناك إشعارات جديدة (مقارنة بآخر ID)
                if (res.data.notifications.length > 0) {
                    const topId = res.data.notifications[0].id;
                    if (lastNotificationId !== null && topId > lastNotificationId) {
                        playNotificationSound();
                        setActivePopupNotification(res.data.notifications[0]);
                    }
                    lastNotificationId = topId;
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };

        // المرة الأولى
        checkNewNotifications();
        
        // جلب الإشعارات كل 10 ثوانٍ (كبديل للـ WebSockets)
        const interval = setInterval(checkNewNotifications, 10000);

        // إعداد Firebase وتحديث التوكن
        requestFirebaseNotificationPermission();

        // استقبال إشعارات Foreground
        const unsubscribe = onForegroundMessage((payload) => {
            playNotificationSound();
            const newNotif = {
                id: 'fcm_' + Date.now(),
                title: payload.notification?.title || 'إشعار جديد',
                message: payload.notification?.body || '',
                is_read: false,
                created_at_human: 'الآن',
                type: payload.data?.type || 'general'
            };
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            setActivePopupNotification(newNotif);
        });

        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, []);

    const markAsRead = async (id, e) => {
        if(e) e.stopPropagation();
        
        try {
            await axios.post(route('notifications.read', id));
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error(error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(route('notifications.read-all'));
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleDropdown = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState && notifications.length === 0) {
            fetchNotifications();
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={toggleDropdown}
                className="relative p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700/50 transition-all focus:outline-none"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-white dark:border-slate-800 text-[8px] font-bold text-white items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 sm:left-0 sm:right-auto mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-slate-800 overflow-hidden z-50 transform origin-top-left transition-all">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                            الإشعارات
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">{unreadCount} جديد</span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                                تعيين الكل كمقروء
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        {loading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-10 text-slate-400">
                                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                    <Bell size={24} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">لا توجد إشعارات جديدة</p>
                                <p className="text-xs text-slate-400 mt-1">أنت على اطلاع بكل جديد.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {notifications.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex gap-4 ${!notification.is_read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                                    >
                                        <div className="mt-1 shrink-0">
                                            {notification.is_read ? (
                                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                                            ) : (
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm ${!notification.is_read ? 'font-black text-slate-800 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-300'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                                                <Circle size={4} className="fill-current" /> 
                                                {notification.created_at_human || 'الآن'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <Link href={route('notifications.my-notifications')} className="block w-full text-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors py-1.5">
                            عرض جميع الإشعارات
                        </Link>
                    </div>
                </div>
            )}
            {/* Popup Modal Notification via Portal */}
            {activePopupNotification && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                        // تم إزالة الإغلاق عند النقر بالخارج
                    ></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                        {/* Header Banner */}
                        <div className={`p-6 border-b border-white/10 relative overflow-hidden ${
                            activePopupNotification.type === 'warning' ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white' :
                            activePopupNotification.type === 'important' ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white' :
                            'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                        }`}>
                            {/* Decorative background circle */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                            
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
                                    {activePopupNotification.type === 'warning' ? <AlertTriangle size={24} className="animate-bounce" /> :
                                     activePopupNotification.type === 'important' ? <Star size={24} className="animate-bounce" /> :
                                     <Info size={24} className="animate-bounce" />}
                                </div>
                                <div>
                                    <h3 className="font-black text-lg opacity-90">لديك إشعار جديد</h3>
                                    <div className="flex items-center gap-1.5 text-xs opacity-75 mt-1 font-medium">
                                        <Clock size={12} />
                                        <span>{activePopupNotification.created_at_human || 'الآن'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 sm:p-8 flex flex-col">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-4 leading-tight">
                                {activePopupNotification.title}
                            </h2>
                            <div className="max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 pr-2">
                                <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed whitespace-pre-line">
                                    {activePopupNotification.message}
                                </p>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                <button 
                                    onClick={() => setActivePopupNotification(null)}
                                    className={`w-full sm:w-auto px-8 py-3 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                        activePopupNotification.type === 'warning' ? 'bg-rose-500 hover:bg-rose-600 text-white' :
                                        activePopupNotification.type === 'important' ? 'bg-purple-500 hover:bg-purple-600 text-white' :
                                        'bg-primary-500 hover:bg-primary-600 text-white'
                                    }`}
                                >
                                    <span>حسناً، فهمت</span>
                                    <Check size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
