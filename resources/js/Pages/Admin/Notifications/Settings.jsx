import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Bell, 
    Smartphone, 
    Mail, 
    CheckCircle2, 
    Save, 
    GraduationCap, 
    Briefcase, 
    ShieldAlert, 
    Sparkles, 
    Clock, 
    BookOpen, 
    Users, 
    Settings as SettingsIcon,
    AlertCircle,
    Send,
    Activity
} from 'lucide-react';

export default function NotificationSettings({ notificationTypes = [], currentSettings = {} }) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        settings: currentSettings || {},
    });

    const [activeTab, setActiveTab] = useState('students'); // 'students' | 'employees'

    const handleToggleEnabled = (key) => {
        setData('settings', {
            ...data.settings,
            [key]: {
                ...data.settings[key],
                enabled: !data.settings[key]?.enabled,
            },
        });
    };

    const handleToggleChannel = (key, channel) => {
        const currentChannels = data.settings[key]?.channels || [];
        let newChannels;
        if (currentChannels.includes(channel)) {
            newChannels = currentChannels.filter(c => c !== channel);
        } else {
            newChannels = [...currentChannels, channel];
        }

        setData('settings', {
            ...data.settings,
            [key]: {
                ...data.settings[key],
                channels: newChannels,
            },
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.notifications.settings.update'), {
            preserveScroll: true,
        });
    };

    const studentTypes = notificationTypes.filter(t => t.category === 'students');
    const employeeTypes = notificationTypes.filter(t => t.category === 'employees');

    const getIconForType = (key) => {
        switch (key) {
            case 'homework': return <BookOpen className="w-5 h-5 text-indigo-500" />;
            case 'attendance': return <Clock className="w-5 h-5 text-amber-500" />;
            case 'student_pledge': return <ShieldAlert className="w-5 h-5 text-rose-500" />;
            case 'grades': return <GraduationCap className="w-5 h-5 text-emerald-500" />;
            case 'employee_request_new':
            case 'employee_request_decision': return <Briefcase className="w-5 h-5 text-blue-500" />;
            case 'employee_achievement': return <Sparkles className="w-5 h-5 text-purple-500" />;
            case 'employee_violation': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'meeting': return <Users className="w-5 h-5 text-cyan-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <AdminLayout>
            <Head title="إعدادات الإشعارات التلقائية" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Header & Quick Navigation */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                                <SettingsIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    إعدادات الإشعارات التلقائية
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    التحكم في تشغيل وإيقاف قنوات الإشعارات التلقائية لجميع أقسام المنصة
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link
                            href={route('admin.notifications.send')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 transition"
                        >
                            <Send className="w-4 h-4 text-gray-500" />
                            <span>إرسال إشعار يدوي</span>
                        </Link>
                        <Link
                            href={route('admin.notifications.global-monitor')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 transition"
                        >
                            <Activity className="w-4 h-4 text-gray-500" />
                            <span>السجل الشامل للإشعارات</span>
                        </Link>
                    </div>
                </div>

                {/* Success Banner */}
                {recentlySuccessful && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm font-medium">تم حفظ وتحديث إعدادات الإشعارات التلقائية بنجاح وتطبيقها في النظام فورياً.</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-2 rtl:space-x-reverse">
                        <button
                            type="button"
                            onClick={() => setActiveTab('students')}
                            className={`pb-3 px-4 font-semibold text-sm inline-flex items-center gap-2 border-b-2 transition ${
                                activeTab === 'students'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:border-gray-300'
                            }`}
                        >
                            <GraduationCap className="w-4 h-4" />
                            <span>شؤون الطلاب وأولياء الأمور</span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                {studentTypes.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('employees')}
                            className={`pb-3 px-4 font-semibold text-sm inline-flex items-center gap-2 border-b-2 transition ${
                                activeTab === 'employees'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:border-gray-300'
                            }`}
                        >
                            <Briefcase className="w-4 h-4" />
                            <span>شؤون الموظفين والمعلمين</span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                {employeeTypes.length}
                            </span>
                        </button>
                    </div>

                    {/* Notification Cards List */}
                    <div className="grid grid-cols-1 gap-4">
                        {(activeTab === 'students' ? studentTypes : employeeTypes).map((type) => {
                            const setting = data.settings[type.key] || { enabled: true, channels: type.default_channels };
                            const isEnabled = setting.enabled !== false;
                            const channels = setting.channels || [];

                            return (
                                <div
                                    key={type.key}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border transition-all ${
                                        isEnabled
                                            ? 'border-gray-200 dark:border-gray-700 shadow-sm'
                                            : 'border-gray-200/60 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 opacity-75'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        {/* Details & Switch */}
                                        <div className="flex items-start gap-4">
                                            <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700/60 flex-shrink-0 mt-0.5">
                                                {getIconForType(type.key)}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                                        {type.name}
                                                    </h3>
                                                    <span
                                                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                                            isEnabled
                                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {isEnabled ? 'مفعل تلقائياً' : 'متوقف'}
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
                                                    {type.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Master Toggle */}
                                        <div className="flex items-center justify-end">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isEnabled}
                                                    onChange={() => handleToggleEnabled(type.key)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Channels Selection Row (Only active when enabled) */}
                                    {isEnabled && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center gap-3 text-xs">
                                            <span className="font-semibold text-gray-600 dark:text-gray-300 ms-1">
                                                قنوات الإرسال المفعلة لهذا الحدث:
                                            </span>

                                            {/* Firebase Channel */}
                                            {type.supported_channels.includes('firebase') && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleChannel(type.key, 'firebase')}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition ${
                                                        channels.includes('firebase')
                                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700'
                                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-gray-600'
                                                    }`}
                                                >
                                                    <Smartphone className="w-3.5 h-3.5" />
                                                    <span>تطبيق الجوال (Firebase Push)</span>
                                                    {channels.includes('firebase') && <CheckCircle2 className="w-3.5 h-3.5 ms-1" />}
                                                </button>
                                            )}

                                            {/* In-App Channel */}
                                            {type.supported_channels.includes('in_app') && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleChannel(type.key, 'in_app')}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition ${
                                                        channels.includes('in_app')
                                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-gray-600'
                                                    }`}
                                                >
                                                    <Bell className="w-3.5 h-3.5" />
                                                    <span>إشعار داخلي (بالمنصة والتطبيق)</span>
                                                    {channels.includes('in_app') && <CheckCircle2 className="w-3.5 h-3.5 ms-1" />}
                                                </button>
                                            )}

                                            {/* Email Channel */}
                                            {type.supported_channels.includes('email') && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleChannel(type.key, 'email')}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition ${
                                                        channels.includes('email')
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-gray-600'
                                                    }`}
                                                >
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <span>بريد إلكتروني (Email)</span>
                                                    {channels.includes('email') && <CheckCircle2 className="w-3.5 h-3.5 ms-1" />}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Floating Save Button */}
                    <div className="sticky bottom-6 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            تذكر حفظ التغييرات بعد تعديل أي مفتاح ليتم تطبيقها فوراً على النظام.
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-60 transition"
                        >
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

