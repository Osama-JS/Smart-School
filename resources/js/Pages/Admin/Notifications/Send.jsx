import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Select from 'react-select';
import { Send, Bell, Mail, Smartphone, Users, User, Shield, CheckCircle, AlertTriangle, Info, History, Eye, X } from 'lucide-react';
import axios from 'axios';
import ToastNotification from '@/Components/ToastNotification';

export default function SendNotification({ roles }) {
    const [toast, setToast] = useState(null);
    const [usersOptions, setUsersOptions] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [activeTab, setActiveTab] = useState('send'); // send, logs
    const [logs, setLogs] = useState({});
    const [stats, setStats] = useState({ total: 0, general: 0, important: 0, warning: 0 });
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logFilter, setLogFilter] = useState('all');
    const [logTargetFilter, setLogTargetFilter] = useState('all_types');
    const [logSearch, setLogSearch] = useState('');
    const [viewedLog, setViewedLog] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        message: '',
        type: 'general', // general, important, warning
        target_type: 'all', // all, role, users
        target_users: [],
        target_role: '',
        channels: {
            in_app: true,
            email: false,
            firebase: false
        }
    });

    const fetchUsers = async (search = '') => {
        try {
            setLoadingUsers(true);
            const res = await axios.get(route('admin.notifications.users'), { params: { search } });
            setUsersOptions(res.data.map(u => ({ value: u.id, label: `${u.name} (${u.role?.name || 'بدون دور'})` })));
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (data.target_type === 'users' && usersOptions.length === 0) {
            fetchUsers();
        }
    }, [data.target_type]);

    const fetchLogs = async (page = 1) => {
        try {
            setLoadingLogs(true);
            const res = await axios.get(route('admin.notifications.logs'), { 
                params: { page, type: logFilter, target_type: logTargetFilter, search: logSearch } 
            });
            setLogs(res.data.logs);
            setStats(res.data.stats);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs();
        }
    }, [activeTab, logFilter, logTargetFilter]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.notifications.store'), {
            onSuccess: () => {
                reset();
                setToast({ type: 'success', message: 'تم إرسال الإشعار بنجاح!' });
            },
            onError: () => {
                setToast({ type: 'error', message: 'حدث خطأ، يرجى التحقق من المدخلات.' });
            }
        });
    };

    return (
        <AdminLayout activeMenu="إرسال الإشعارات">
            <Head title="إرسال إشعارات" />
            
            {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <div className="max-w-7xl mx-auto space-y-6">
                
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
                            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight">إرسال إشعارات وتنبيهات</h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                مركز التواصل: يمكنك إرسال الإشعارات فوراً للمستخدمين المتواجدين في فرعك عبر قنوات متعددة.
                            </p>
                        </div>

                        <div className="flex gap-2 p-1 bg-white/50 dark:bg-black/20 rounded-2xl border border-white dark:border-slate-800">
                            <button onClick={() => setActiveTab('send')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'send' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Send size={18} /> إرسال جديد
                            </button>
                            <button onClick={() => setActiveTab('logs')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'logs' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <History size={18} /> السجل
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'send' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        {/* Form Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-[#121820]/60 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">تفاصيل الإشعار</h2>
                                
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان الإشعار</label>
                                        <input 
                                            type="text" 
                                            className="erp-input w-full"
                                            placeholder="مثال: تحديث هام في النظام"
                                            value={data.title}
                                            onChange={e => setData('title', e.target.value)}
                                        />
                                        {errors.title && <p className="text-rose-500 text-sm mt-1">{errors.title}</p>}
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نص الإشعار</label>
                                        <textarea 
                                            className="erp-input w-full min-h-[120px] resize-y"
                                            placeholder="اكتب تفاصيل الرسالة هنا..."
                                            value={data.message}
                                            onChange={e => setData('message', e.target.value)}
                                        ></textarea>
                                        {errors.message && <p className="text-rose-500 text-sm mt-1">{errors.message}</p>}
                                    </div>

                                    {/* Target Selection */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">المستهدفون</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <label className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${data.target_type === 'all' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                                                <input type="radio" className="sr-only" checked={data.target_type === 'all'} onChange={() => setData('target_type', 'all')} />
                                                <div className="flex flex-col items-center text-center gap-2">
                                                    <Users size={24} className={data.target_type === 'all' ? 'text-primary-600' : 'text-slate-400'} />
                                                    <span className="font-bold text-sm">جميع المستخدمين في الفرع</span>
                                                </div>
                                            </label>
                                            <label className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${data.target_type === 'role' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                                                <input type="radio" className="sr-only" checked={data.target_type === 'role'} onChange={() => setData('target_type', 'role')} />
                                                <div className="flex flex-col items-center text-center gap-2">
                                                    <Shield size={24} className={data.target_type === 'role' ? 'text-primary-600' : 'text-slate-400'} />
                                                    <span className="font-bold text-sm">دور وظيفي محدد</span>
                                                </div>
                                            </label>
                                            <label className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${data.target_type === 'users' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                                                <input type="radio" className="sr-only" checked={data.target_type === 'users'} onChange={() => setData('target_type', 'users')} />
                                                <div className="flex flex-col items-center text-center gap-2">
                                                    <User size={24} className={data.target_type === 'users' ? 'text-primary-600' : 'text-slate-400'} />
                                                    <span className="font-bold text-sm">مستخدمين محددين</span>
                                                </div>
                                            </label>
                                        </div>
                                        
                                        {/* Role Selector */}
                                        {data.target_type === 'role' && (
                                            <div className="animate-fade-in mt-4">
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اختر الدور</label>
                                                <select 
                                                    className="erp-input w-full"
                                                    value={data.target_role}
                                                    onChange={e => setData('target_role', e.target.value)}
                                                >
                                                    <option value="">-- اختر الدور --</option>
                                                    <option value="معلم">معلم</option>
                                                    <option value="طالب">طالب</option>
                                                    <option value="ولي أمر">ولي أمر</option>
                                                    <option value="شؤون موظفين">شؤون موظفين</option>
                                                </select>
                                                {errors.target_role && <p className="text-rose-500 text-sm mt-1">{errors.target_role}</p>}
                                            </div>
                                        )}

                                        {/* User Selector */}
                                        {data.target_type === 'users' && (
                                            <div className="animate-fade-in mt-4">
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اختر المستخدمين</label>
                                                <Select
                                                    isMulti
                                                    options={usersOptions}
                                                    isLoading={loadingUsers}
                                                    onInputChange={(val) => val.length > 2 && fetchUsers(val)}
                                                    onChange={(selected) => setData('target_users', selected.map(s => s.value))}
                                                    placeholder="ابحث عن مستخدم بالاسم..."
                                                    noOptionsMessage={() => "لم يتم العثور على مستخدمين"}
                                                    classNamePrefix="react-select"
                                                />
                                                {errors.target_users && <p className="text-rose-500 text-sm mt-1">{errors.target_users}</p>}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-8 mt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button 
                                            type="submit" 
                                            disabled={processing}
                                            className="relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 text-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.3)] text-lg font-black transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                                            <Send size={24} className="rtl:-scale-x-100 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                                            <span>إرسال الإشعار الآن</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Options Section */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Channels */}
                            <div className="bg-white dark:bg-[#121820]/60 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">قنوات الإرسال</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                                            checked={data.channels.in_app}
                                            onChange={e => setData('channels', {...data.channels, in_app: e.target.checked})}
                                        />
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <Bell size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-white">إشعار داخلي</p>
                                                <p className="text-xs text-slate-500">يظهر في لوحة التحكم (مع تنبيه صوتي)</p>
                                            </div>
                                        </div>
                                    </label>
                                    
                                    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                                            checked={data.channels.firebase}
                                            onChange={e => setData('channels', {...data.channels, firebase: e.target.checked})}
                                        />
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                                <Smartphone size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-white">تطبيق / ويب (Push)</p>
                                                <p className="text-xs text-slate-500">عبر Firebase Cloud Messaging</p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                                            checked={data.channels.email}
                                            onChange={e => setData('channels', {...data.channels, email: e.target.checked})}
                                        />
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <Mail size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-white">بريد إلكتروني</p>
                                                <p className="text-xs text-slate-500">يصل لصندوق الوارد الرسمي</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                                {errors.channels && <p className="text-rose-500 text-sm mt-2">يرجى اختيار قناة واحدة على الأقل.</p>}
                            </div>

                            {/* Notification Type */}
                            <div className="bg-white dark:bg-[#121820]/60 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">نوع الإشعار</h3>
                                <div className="space-y-3">
                                    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${data.type === 'general' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                                        <input type="radio" className="sr-only" checked={data.type === 'general'} onChange={() => setData('type', 'general')} />
                                        <Info size={20} className={data.type === 'general' ? 'text-primary-600' : 'text-slate-400'} />
                                        <span className={`font-bold text-sm ${data.type === 'general' ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600'}`}>إشعار عام</span>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${data.type === 'important' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                                        <input type="radio" className="sr-only" checked={data.type === 'important'} onChange={() => setData('type', 'important')} />
                                        <CheckCircle size={20} className={data.type === 'important' ? 'text-purple-600' : 'text-slate-400'} />
                                        <span className={`font-bold text-sm ${data.type === 'important' ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600'}`}>تنبيه هام</span>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${data.type === 'warning' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                                        <input type="radio" className="sr-only" checked={data.type === 'warning'} onChange={() => setData('type', 'warning')} />
                                        <AlertTriangle size={20} className={data.type === 'warning' ? 'text-rose-600' : 'text-slate-400'} />
                                        <span className={`font-bold text-sm ${data.type === 'warning' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-600'}`}>تحذير / عاجل</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        {/* Stats Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500">إجمالي المُرسل</p>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">{stats.total}</h3>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500">التحذيرات</p>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">{stats.warning}</h3>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500">التنبيهات الهامة</p>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">{stats.important}</h3>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#121820]/60 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                    <Info size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500">إشعارات عامة</p>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">{stats.general}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#121820]/60 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">سجل الإشعارات المُرسلة</h2>
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-48">
                                        <input
                                            type="text"
                                            placeholder="ابحث..."
                                            className="erp-input w-full"
                                            value={logSearch}
                                            onChange={e => setLogSearch(e.target.value)}
                                            onBlur={() => fetchLogs()}
                                            onKeyDown={e => e.key === 'Enter' && fetchLogs()}
                                        />
                                    </div>
                                    <div className="w-48">
                                        <Select
                                            options={[
                                                { value: 'all_types', label: 'الكل (حسب المستهدف)' },
                                                { value: 'all', label: 'جميع الموظفين' },
                                                { value: 'role', label: 'دور محدد' },
                                                { value: 'users', label: 'مستخدمين محددين' }
                                            ]}
                                            value={{ 
                                                value: logTargetFilter, 
                                                label: logTargetFilter === 'all' ? 'جميع الموظفين' : 
                                                       logTargetFilter === 'role' ? 'دور محدد' : 
                                                       logTargetFilter === 'users' ? 'مستخدمين محددين' : 'الكل (حسب المستهدف)' 
                                            }}
                                            onChange={(selected) => setLogTargetFilter(selected.value)}
                                            classNamePrefix="react-select"
                                            placeholder="تصفية بالمستهدف"
                                        />
                                    </div>
                                    <div className="w-48">
                                        <Select
                                            options={[
                                                { value: 'all', label: 'الكل' },
                                                { value: 'general', label: 'عام' },
                                                { value: 'important', label: 'هام' },
                                                { value: 'warning', label: 'تحذير' }
                                            ]}
                                            value={{ value: logFilter, label: logFilter === 'general' ? 'عام' : logFilter === 'important' ? 'هام' : logFilter === 'warning' ? 'تحذير' : 'الكل' }}
                                            onChange={(selected) => setLogFilter(selected.value)}
                                            classNamePrefix="react-select"
                                            placeholder="تصفية بالنوع"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                        {loadingLogs ? (
                            <div className="py-12 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                            </div>
                        ) : logs.data && logs.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold">
                                            <th className="pb-4 px-4">عنوان الإشعار</th>
                                            <th className="pb-4 px-4">المستلم</th>
                                            <th className="pb-4 px-4">النوع</th>
                                            <th className="pb-4 px-4">التاريخ</th>
                                            <th className="pb-4 px-4">محتوى الإشعار</th>
                                            <th className="pb-4 px-4">إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {logs.data.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">
                                                    {log.title}
                                                </td>
                                                <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                                                    {log.user_id ? (
                                                        log.user?.name || 'مستخدم'
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            {log.target_type === 'all' && <><Users size={14} className="text-primary-500" /> جميع الموظفين</>}
                                                            {log.target_type === 'role' && <><Shield size={14} className="text-amber-500" /> {log.target_role}</>}
                                                            {log.target_type === 'users' && <><User size={14} className="text-blue-500" /> مجموعة موظفين ({log.target_users?.length || 0})</>}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        log.type === 'warning' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300' :
                                                        log.type === 'important' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                                                        'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                                                    }`}>
                                                        {log.type === 'warning' ? 'تحذير' : log.type === 'important' ? 'هام' : 'عام'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td className="py-4 px-4 text-slate-500 max-w-xs truncate">
                                                    {log.message}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <button
                                                        onClick={() => setViewedLog(log)}
                                                        className="p-2 bg-slate-100 hover:bg-primary-50 text-slate-600 hover:text-primary-600 dark:bg-slate-800 dark:hover:bg-primary-900/30 dark:text-slate-400 dark:hover:text-primary-400 rounded-xl transition-colors"
                                                        title="عرض التفاصيل"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                {/* Pagination Controls */}
                                {logs.last_page > 1 && (
                                    <div className="mt-6 flex justify-center gap-2">
                                        {logs.links.map((link, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    if (link.url) {
                                                        const url = new URL(link.url);
                                                        fetchLogs(url.searchParams.get('page'));
                                                    }
                                                }}
                                                disabled={!link.url}
                                                className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${
                                                    link.active 
                                                        ? 'bg-primary-500 text-white' 
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-500">
                                لا يوجد سجل إشعارات بعد.
                            </div>
                        )}
                    </div>
                    </div>
                )}
            </div>

            {/* View Log Details Modal */}
            {viewedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewedLog(null)}></div>
                    <div className="relative bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-700">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Bell className="text-primary-500" size={24} />
                                    تفاصيل الإشعار
                                </h3>
                                <button onClick={() => setViewedLog(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-sm font-bold text-slate-500 mb-1">المرسل</p>
                                    <p className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2">
                                        <User size={16} className="text-primary-500" />
                                        {viewedLog.sender?.name || 'مجهول'}
                                    </p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-sm font-bold text-slate-500 mb-1">المستلم</p>
                                    <div className="text-slate-800 dark:text-slate-200 font-medium">
                                        {viewedLog.user_id ? (
                                            <span className="flex items-center gap-2"><User size={16} className="text-blue-500" /> موجه إلى: {viewedLog.user?.name || 'مستخدم'}</span>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {viewedLog.target_type === 'all' && <span className="flex items-center gap-2"><Users size={16} className="text-primary-500" /> جميع الموظفين</span>}
                                                {viewedLog.target_type === 'role' && <span className="flex items-center gap-2"><Shield size={16} className="text-amber-500" /> أصحاب دور: {viewedLog.target_role}</span>}
                                                {viewedLog.target_type === 'users' && (
                                                    <div>
                                                        <span className="flex items-center gap-2 mb-2"><Users size={16} className="text-blue-500" /> مجموعة محددة:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {viewedLog.target_users_names?.map((name, i) => (
                                                                <span key={i} className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs">
                                                                    {name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-bold text-slate-500">محتوى الإشعار</p>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                            viewedLog.type === 'warning' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' :
                                            viewedLog.type === 'important' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                                            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                        }`}>
                                            {viewedLog.type === 'warning' ? 'تحذير' : viewedLog.type === 'important' ? 'هام' : 'عام'}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{viewedLog.title}</h4>
                                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{viewedLog.message}</p>
                                    <p className="text-xs text-slate-400 mt-4 text-left" dir="ltr">
                                        {new Date(viewedLog.created_at).toLocaleString('ar-EG')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
