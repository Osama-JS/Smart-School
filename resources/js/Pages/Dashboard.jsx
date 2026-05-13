import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { 
    Users, GraduationCap, BookOpen, CheckSquare, 
    TrendingUp, ArrowUpRight, ArrowDownRight, Calendar,
    Clock, AlertCircle, Activity
} from 'lucide-react';

export default function Dashboard() {
    const { auth } = usePage().props;

    const stats = [
        { 
            title: 'إجمالي الطلاب', value: '1,247', change: '+12%', up: true,
            icon: GraduationCap, color: 'primary',
            iconBg: 'bg-[#f0f7eb] text-[#558a2a]'
        },
        { 
            title: 'المعلمين', value: '86', change: '+3%', up: true,
            icon: Users, color: 'success',
            iconBg: 'bg-emerald-50 text-emerald-600'
        },
        { 
            title: 'المواد الدراسية', value: '24', change: '0%', up: true,
            icon: BookOpen, color: 'accent',
            iconBg: 'bg-blue-50 text-blue-600'
        },
        { 
            title: 'نسبة الحضور اليوم', value: '94.2%', change: '-1.3%', up: false,
            icon: CheckSquare, color: 'warning',
            iconBg: 'bg-amber-50 text-amber-600'
        },
    ];

    const recentActivities = [
        { text: 'تم تسجيل 15 طالب جديد في الفصل الدراسي', time: 'منذ 5 دقائق', type: 'success' },
        { text: 'تم تحديث جدول الحصص للصف الثاني المتوسط', time: 'منذ 30 دقيقة', type: 'info' },
        { text: 'تنبيه: 3 معلمين لم يرفعوا دفاتر التحضير', time: 'منذ ساعة', type: 'warning' },
        { text: 'تم رصد درجات الشهر الأول لمادة الرياضيات', time: 'منذ ساعتين', type: 'success' },
        { text: 'طلب إجازة من المعلم أحمد محمد', time: 'منذ 3 ساعات', type: 'info' },
    ];

    const getActivityColor = (type) => {
        switch (type) {
            case 'success': return 'bg-[#6b9b37]';
            case 'warning': return 'bg-amber-500';
            case 'info': return 'bg-blue-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <AdminLayout activeMenu="الرئيسية">
            <Head title="لوحة التحكم" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            مرحباً، {auth?.user?.name || 'مدير النظام'} 👋
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            إليك ملخص ما يحدث في مدرستك اليوم
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <Calendar size={16} className="text-[#6b9b37]" />
                        <span>{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                    {stats.map((stat, index) => (
                        <div key={index} className={`stat-card ${stat.color}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                                    <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${stat.up ? 'text-[#558a2a]' : 'text-[#cc2b2b]'}`}>
                                        {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        <span>{stat.change} من الشهر الماضي</span>
                                    </div>
                                </div>
                                <div className={`h-11 w-11 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                                    <stat.icon size={22} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Activity Feed */}
                    <div className="lg:col-span-2 erp-card">
                        <div className="erp-card-header">
                            <div className="flex items-center gap-2">
                                <Activity size={18} className="text-[#6b9b37]" />
                                <h3 className="font-bold text-slate-800">آخر النشاطات</h3>
                            </div>
                            <button className="text-sm text-[#6b9b37] hover:text-[#558a2a] font-medium transition-colors">
                                عرض الكل
                            </button>
                        </div>
                        <div className="erp-card-body p-0">
                            <div className="divide-y divide-slate-50">
                                {recentActivities.map((activity, index) => (
                                    <div key={index} className="flex items-start gap-3 px-6 py-4 hover:bg-[#f8faf6] transition-colors">
                                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${getActivityColor(activity.type)}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-700">{activity.text}</p>
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <Clock size={12} /> {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Alerts */}
                        <div className="erp-card">
                            <div className="erp-card-header">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={18} className="text-[#cc2b2b]" />
                                    <h3 className="font-bold text-slate-800">تنبيهات</h3>
                                </div>
                                <span className="erp-badge erp-badge-danger">3</span>
                            </div>
                            <div className="erp-card-body space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                    <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800">فترة رصد الدرجات</p>
                                        <p className="text-xs text-amber-600 mt-0.5">تنتهي بعد 3 أيام</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <AlertCircle size={16} className="text-[#cc2b2b] mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800">5 طلاب محظورون مالياً</p>
                                        <p className="text-xs text-red-600 mt-0.5">يجب مراجعة الحسابات</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-[#f0f7eb] rounded-lg border border-[#dcefd1]">
                                    <AlertCircle size={16} className="text-[#6b9b37] mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-[#325518]">تحديث النظام متاح</p>
                                        <p className="text-xs text-[#558a2a] mt-0.5">الإصدار 2.1.0</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attendance */}
                        <div className="erp-card">
                            <div className="erp-card-body space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">الحاضرون اليوم</span>
                                    <span className="text-sm font-bold text-[#558a2a]">1,174</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-[#7cbf4f] to-[#558a2a] h-2.5 rounded-full transition-all duration-700" style={{ width: '94%' }}></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">الغائبون</span>
                                    <span className="text-sm font-bold text-[#cc2b2b]">73</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-[#e74c4c] to-[#cc2b2b] h-2.5 rounded-full transition-all duration-700" style={{ width: '6%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
