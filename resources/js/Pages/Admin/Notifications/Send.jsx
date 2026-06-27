import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Select from 'react-select';
import { Send, Bell, Mail, Smartphone, Users, User, Shield, CheckCircle, AlertTriangle, Info, History, Eye, X, Wifi, Radio, Zap, Clock, Search } from 'lucide-react';
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
            <Head title="مركز الإشعارات الذكي" />
            
            {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-white/60 dark:bg-[#121820]/60 backdrop-blur-3xl border border-white/40 dark:border-slate-800/60 rounded-[2.5rem] p-6 md:p-10 mb-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-indigo-500" />
                    
                    {/* Visual geometric lines */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary-500/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
                        <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <Radio size={36} className="text-primary-500" />
                                مركز الإشعارات والتنبيهات
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm font-bold max-w-xl leading-relaxed">
                                تواصل مع فريقك وطلابك بلمسة زر. صمم رسالتك، شاهد العرض المباشر، وأرسلها عبر القنوات المتعددة فوراً.
                            </p>
                        </div>

                        <div className="flex gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl shrink-0">
                            <button onClick={() => setActiveTab('send')} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black transition-all duration-300 ${activeTab === 'send' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                                <Send size={18} /> إرسال جديد
                            </button>
                            <button onClick={() => setActiveTab('logs')} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black transition-all duration-300 ${activeTab === 'logs' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                                <History size={18} /> السجل
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'send' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in items-start">
                        {/* Form Section */}
                        <div className="lg:col-span-8 space-y-6">
                            
                            {/* Target Selection */}
                            <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/40 dark:border-slate-800/60 p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center shadow-inner">
                                        <Users size={20} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white">من المستهدف؟</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <label className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center gap-3 group overflow-hidden ${data.target_type === 'all' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-[0_0_20px_rgba(59,130,246,0.1)] scale-[1.02] z-10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:-translate-y-1'}`}>
                                        {data.target_type === 'all' && <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />}
                                        <input type="radio" className="sr-only" checked={data.target_type === 'all'} onChange={() => setData('target_type', 'all')} />
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${data.target_type === 'all' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                            <Users size={24} />
                                        </div>
                                        <span className={`font-black ${data.target_type === 'all' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>الجميع</span>
                                    </label>
                                    <label className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center gap-3 group overflow-hidden ${data.target_type === 'role' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 shadow-[0_0_20px_rgba(245,158,11,0.1)] scale-[1.02] z-10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:-translate-y-1'}`}>
                                        {data.target_type === 'role' && <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />}
                                        <input type="radio" className="sr-only" checked={data.target_type === 'role'} onChange={() => setData('target_type', 'role')} />
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${data.target_type === 'role' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                            <Shield size={24} />
                                        </div>
                                        <span className={`font-black ${data.target_type === 'role' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>دور محدد</span>
                                    </label>
                                    <label className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center gap-3 group overflow-hidden ${data.target_type === 'users' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-[0_0_20px_rgba(16,185,129,0.1)] scale-[1.02] z-10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:-translate-y-1'}`}>
                                        {data.target_type === 'users' && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />}
                                        <input type="radio" className="sr-only" checked={data.target_type === 'users'} onChange={() => setData('target_type', 'users')} />
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${data.target_type === 'users' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                            <User size={24} />
                                        </div>
                                        <span className={`font-black ${data.target_type === 'users' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>مستخدمين محددين</span>
                                    </label>
                                </div>
                                
                                {/* Role Selector */}
                                {data.target_type === 'role' && (
                                    <div className="animate-fade-in-down mt-6 p-5 bg-amber-50/30 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                                        <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2">اختر الدور الوظيفي</label>
                                        <select 
                                            className="w-full bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm font-bold shadow-inner"
                                            value={data.target_role}
                                            onChange={e => setData('target_role', e.target.value)}
                                        >
                                            <option value="">-- اضغط للاختيار --</option>
                                            <option value="معلم">معلم</option>
                                            <option value="طالب">طالب</option>
                                            <option value="ولي أمر">ولي أمر</option>
                                            <option value="شؤون موظفين">شؤون موظفين</option>
                                        </select>
                                        {errors.target_role && <p className="text-rose-500 text-xs font-bold mt-2">{errors.target_role}</p>}
                                    </div>
                                )}

                                {/* User Selector */}
                                {data.target_type === 'users' && (
                                    <div className="animate-fade-in-down mt-6 p-5 bg-emerald-50/30 dark:bg-emerald-900/5 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                                        <label className="block text-sm font-black text-emerald-900 dark:text-emerald-300 mb-2">ابحث واختر المستخدمين</label>
                                        <Select
                                            isMulti
                                            options={usersOptions}
                                            isLoading={loadingUsers}
                                            onInputChange={(val) => val.length > 2 && fetchUsers(val)}
                                            onChange={(selected) => setData('target_users', selected.map(s => s.value))}
                                            placeholder="اكتب اسم المستخدم هنا..."
                                            noOptionsMessage={() => "لم يتم العثور على مستخدمين"}
                                            classNamePrefix="react-select"
                                            styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#34d399', borderWidth: '2px', padding: '4px' }) }}
                                        />
                                        {errors.target_users && <p className="text-rose-500 text-xs font-bold mt-2">{errors.target_users}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/40 dark:border-slate-800/60 p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center shadow-inner">
                                        <Mail size={20} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white">محتوى الإشعار</h2>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Type Selection */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">أهمية الإشعار (تنعكس على شكل ولون الإشعار)</label>
                                        <div className="flex flex-wrap gap-3">
                                            <label className={`flex-1 relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 ${data.type === 'general' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.02]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                <input type="radio" className="sr-only" checked={data.type === 'general'} onChange={() => setData('type', 'general')} />
                                                <Info size={18} className={data.type === 'general' ? 'text-blue-500' : 'text-slate-400'} />
                                                <span className={`font-bold text-sm ${data.type === 'general' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600'}`}>عام</span>
                                            </label>
                                            <label className={`flex-1 relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 ${data.type === 'important' ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)] scale-[1.02]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                <input type="radio" className="sr-only" checked={data.type === 'important'} onChange={() => setData('type', 'important')} />
                                                <CheckCircle size={18} className={data.type === 'important' ? 'text-purple-500' : 'text-slate-400'} />
                                                <span className={`font-bold text-sm ${data.type === 'important' ? 'text-purple-700 dark:text-purple-400' : 'text-slate-600'}`}>هام</span>
                                            </label>
                                            <label className={`flex-1 relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 ${data.type === 'warning' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.15)] scale-[1.02]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                <input type="radio" className="sr-only" checked={data.type === 'warning'} onChange={() => setData('type', 'warning')} />
                                                <AlertTriangle size={18} className={data.type === 'warning' ? 'text-rose-500' : 'text-slate-400'} />
                                                <span className={`font-bold text-sm ${data.type === 'warning' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-600'}`}>تحذير / عاجل</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">العنوان</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl px-4 py-3 text-sm font-bold transition-all shadow-inner"
                                            placeholder="اكتب عنواناً جذاباً وقصيراً..."
                                            value={data.title}
                                            onChange={e => setData('title', e.target.value)}
                                        />
                                        {errors.title && <p className="text-rose-500 text-xs font-bold mt-1">{errors.title}</p>}
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">النص</label>
                                        <textarea 
                                            className="w-full bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl px-4 py-3 text-sm font-bold transition-all shadow-inner min-h-[140px] resize-y"
                                            placeholder="اكتب التفاصيل هنا بوضوح..."
                                            value={data.message}
                                            onChange={e => setData('message', e.target.value)}
                                        ></textarea>
                                        {errors.message && <p className="text-rose-500 text-xs font-bold mt-1">{errors.message}</p>}
                                    </div>

                                    {/* Channels */}
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">قنوات الإرسال (كيف سيصلهم؟)</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <label className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-3 overflow-hidden group ${data.channels.in_app ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10 shadow-[0_4px_15px_rgba(59,130,246,0.1)]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                {data.channels.in_app && <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent pointer-events-none" />}
                                                <input type="checkbox" className="sr-only" checked={data.channels.in_app} onChange={e => setData('channels', {...data.channels, in_app: e.target.checked})} />
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-inner ${data.channels.in_app ? 'bg-primary-500 text-white shadow-primary-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                                    <Bell size={20} />
                                                </div>
                                                <div>
                                                    <p className={`font-black text-sm ${data.channels.in_app ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>النظام الداخلي</p>
                                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">لوحة التحكم</p>
                                                </div>
                                            </label>
                                            
                                            <label className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-3 overflow-hidden group ${data.channels.firebase ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-900/10 shadow-[0_4px_15px_rgba(249,115,22,0.1)]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                {data.channels.firebase && <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none" />}
                                                <input type="checkbox" className="sr-only" checked={data.channels.firebase} onChange={e => setData('channels', {...data.channels, firebase: e.target.checked})} />
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-inner ${data.channels.firebase ? 'bg-orange-500 text-white shadow-orange-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                                    <Smartphone size={20} />
                                                </div>
                                                <div>
                                                    <p className={`font-black text-sm ${data.channels.firebase ? 'text-orange-700 dark:text-orange-300' : 'text-slate-700 dark:text-slate-300'}`}>تطبيق الجوال</p>
                                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">Push Notification</p>
                                                </div>
                                            </label>

                                            <label className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-3 overflow-hidden group ${data.channels.email ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-[0_4px_15px_rgba(16,185,129,0.1)]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                {data.channels.email && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />}
                                                <input type="checkbox" className="sr-only" checked={data.channels.email} onChange={e => setData('channels', {...data.channels, email: e.target.checked})} />
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-inner ${data.channels.email ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                                    <Mail size={20} />
                                                </div>
                                                <div>
                                                    <p className={`font-black text-sm ${data.channels.email ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>البريد</p>
                                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">رسالة إلكترونية</p>
                                                </div>
                                            </label>
                                        </div>
                                        {errors.channels && <p className="text-rose-500 text-xs font-bold mt-2">يرجى اختيار قناة واحدة على الأقل.</p>}
                                    </div>

                                    <div className="pt-8">
                                        <button 
                                            type="submit" 
                                            disabled={processing}
                                            className="relative w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 hover:from-primary-500 hover:via-indigo-500 hover:to-indigo-500 text-white rounded-2xl shadow-xl shadow-primary-500/30 text-lg font-black transition-all duration-300 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 w-[200%] -translate-x-[150%] bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-[50%] transition-transform duration-1000 ease-in-out" />
                                            <Zap size={24} className="transition-transform group-hover:scale-125" />
                                            <span>إطلاق الإشعار الآن</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Live Preview Section */}
                        <div className="lg:col-span-4 sticky top-6 hidden lg:block">
                            <div className="bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-800 p-2 shadow-2xl relative overflow-hidden h-[600px] flex flex-col mx-auto max-w-sm ring-4 ring-slate-200/50 dark:ring-black/50 transition-all duration-500 group">
                                {/* Notch */}
                                <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-3xl w-40 mx-auto z-20 flex justify-center items-center">
                                    <div className="w-12 h-1.5 bg-slate-950 rounded-full"></div>
                                </div>
                                
                                {/* Screen bg */}
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-300 dark:from-slate-800 dark:to-slate-900 z-0">
                                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-400 via-transparent to-transparent blur-xl transition-all duration-1000 group-hover:scale-150"></div>
                                </div>

                                {/* Status bar */}
                                <div className="relative z-10 flex justify-between items-center px-6 pt-3 text-xs font-bold text-slate-800 dark:text-slate-300">
                                    <span dir="ltr">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                    <div className="flex gap-1.5 items-center">
                                        <Wifi size={14} />
                                        <div className="w-5 h-2.5 border border-current rounded-sm relative">
                                            <div className="absolute inset-[1px] bg-current rounded-sm w-3/4"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notifications Area */}
                                <div className="relative z-10 mt-20 px-4 flex flex-col gap-4">
                                    {/* The Dynamic Toast */}
                                    <div className="animate-fade-in-down bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-4 shadow-lg shadow-black/5 border border-white/60 dark:border-slate-700/60 transform transition-all duration-500 hover:scale-[1.02]">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors duration-500 ${
                                                data.type === 'warning' ? 'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-rose-500/20' :
                                                data.type === 'important' ? 'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-purple-500/20' :
                                                'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-primary-500/20'
                                            }`}>
                                                {data.type === 'warning' ? <AlertTriangle size={20} /> : data.type === 'important' ? <CheckCircle size={20} /> : <Bell size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-black text-slate-900 dark:text-white text-sm truncate pr-2">
                                                        {data.title || 'عنوان الإشعار سيظهر هنا'}
                                                    </h4>
                                                    <span className="text-[10px] text-slate-500 font-bold shrink-0">الآن</span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold break-words line-clamp-4">
{data.message || 'اكتب محتوى رسالتك في الحقل المخصص لتظهر هنا كمعاينة حية...'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating text */}
                                <div className="absolute bottom-8 inset-x-0 text-center z-10">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div> Live Preview
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in">
                        {/* Stats Section with Glassmorphism */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'إجمالي المُرسل', value: stats.total, icon: <Bell size={24} />, color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' },
                                { label: 'التحذيرات', value: stats.warning, icon: <AlertTriangle size={24} />, color: 'from-rose-400 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' },
                                { label: 'تنبيهات هامة', value: stats.important, icon: <CheckCircle size={24} />, color: 'from-purple-400 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' },
                                { label: 'إشعارات عامة', value: stats.general, icon: <Info size={24} />, color: 'from-primary-400 to-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20 text-primary-500' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-xl p-5 rounded-[2rem] shadow-sm hover:shadow-lg transition-all border border-white/40 dark:border-slate-800/60 flex items-center gap-4 group">
                                    <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-500 mb-1">{stat.label}</p>
                                        <h3 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>{stat.value}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/40 dark:border-slate-800/60 p-6 sm:p-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <History className="text-primary-500" size={28} /> سجل الإرسال
                                </h2>
                                
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="w-full sm:w-56">
                                        <div className="relative group">
                                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                placeholder="ابحث في السجل..."
                                                className="w-full pr-11 pl-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-primary-500 rounded-xl text-sm font-bold shadow-sm outline-none transition-all"
                                                value={logSearch}
                                                onChange={e => setLogSearch(e.target.value)}
                                                onBlur={() => fetchLogs()}
                                                onKeyDown={e => e.key === 'Enter' && fetchLogs()}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-48">
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
                                            styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0', borderWidth: '2px', padding: '2px', minHeight: '46px' }) }}
                                        />
                                    </div>
                                    <div className="w-full sm:w-40">
                                        <Select
                                            options={[
                                                { value: 'all', label: 'كل الأنواع' },
                                                { value: 'general', label: 'عام' },
                                                { value: 'important', label: 'هام' },
                                                { value: 'warning', label: 'تحذير' }
                                            ]}
                                            value={{ value: logFilter, label: logFilter === 'general' ? 'عام' : logFilter === 'important' ? 'هام' : logFilter === 'warning' ? 'تحذير' : 'كل الأنواع' }}
                                            onChange={(selected) => setLogFilter(selected.value)}
                                            classNamePrefix="react-select"
                                            styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0', borderWidth: '2px', padding: '2px', minHeight: '46px' }) }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {loadingLogs ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary-500"></div>
                                    <p className="font-bold text-slate-500">جاري تحميل السجل...</p>
                                </div>
                            ) : logs.data && logs.data.length > 0 ? (
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute right-[27px] top-4 bottom-4 w-1 bg-slate-100 dark:bg-slate-800 rounded-full z-0 hidden sm:block"></div>
                                    
                                    <div className="space-y-6 relative z-10">
                                        {logs.data.map(log => (
                                            <div key={log.id} className="relative sm:pr-16 group">
                                                {/* Dot */}
                                                <div className={`hidden sm:flex absolute right-3 top-6 w-9 h-9 rounded-full border-4 border-white dark:border-slate-900 items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-125 ${
                                                    log.type === 'warning' ? 'bg-rose-500' :
                                                    log.type === 'important' ? 'bg-purple-500' :
                                                    'bg-blue-500'
                                                }`}>
                                                    {log.type === 'warning' ? <AlertTriangle size={14} className="text-white" /> : log.type === 'important' ? <CheckCircle size={14} className="text-white" /> : <Info size={14} className="text-white" />}
                                                </div>

                                                {/* Card */}
                                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary-500/30">
                                                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <span className={`px-3 py-1 rounded-lg text-xs font-black shadow-inner ${
                                                                    log.type === 'warning' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                                                                    log.type === 'important' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                                                                    'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                                                }`}>
                                                                    {log.type === 'warning' ? 'تحذير عاجل' : log.type === 'important' ? 'تنبيه هام' : 'إشعار عام'}
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                                                    <Clock size={14} className="text-primary-500" />
                                                                    <span dir="ltr">{new Date(log.created_at).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                                                </span>
                                                            </div>
                                                            
                                                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-snug">{log.title}</h3>
                                                            <p className="text-slate-600 dark:text-slate-300 text-sm font-semibold line-clamp-2 leading-relaxed opacity-80">{log.message}</p>
                                                            
                                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs font-bold">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-slate-400">المرسل:</span>
                                                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                                        <User size={14} className="text-primary-500" /> {log.sender?.name || 'مجهول'}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-slate-400">المستلم:</span>
                                                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 px-2 py-1 rounded-md">
                                                                        {log.user_id ? (
                                                                            <><User size={14} /> {log.user?.name || 'مستخدم'}</>
                                                                        ) : (
                                                                            <>
                                                                                {log.target_type === 'all' && <><Users size={14} /> جميع الموظفين</>}
                                                                                {log.target_type === 'role' && <><Shield size={14} /> دور: {log.target_role}</>}
                                                                                {log.target_type === 'users' && <><User size={14} /> مستخدمين محددين ({log.target_users?.length || 0})</>}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 flex items-center justify-end">
                                                            <button
                                                                onClick={() => setViewedLog(log)}
                                                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-primary-50 dark:bg-slate-800 dark:hover:bg-primary-500/20 text-slate-700 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 rounded-xl font-black text-sm transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                                                            >
                                                                <Eye size={18} /> عرض التفاصيل الكاملة
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Pagination Controls */}
                                    {logs.last_page > 1 && (
                                        <div className="mt-12 flex justify-center gap-2">
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
                                                    className={`px-4 py-2 rounded-xl text-sm font-black transition-all shadow-sm ${
                                                        link.active 
                                                            ? 'bg-primary-500 text-white shadow-primary-500/30' 
                                                            : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                    } ${!link.url ? 'opacity-50 cursor-not-allowed shadow-none' : 'hover:-translate-y-0.5'}`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
                                    <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-2 border border-slate-100 dark:border-slate-700">
                                        <History size={40} className="text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-xl font-black text-slate-800 dark:text-white">لا يوجد سجل إشعارات بعد</p>
                                    <p className="font-semibold text-sm">ابدأ بإرسال إشعارات لتظهر هنا في السجل الزمني.</p>
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
