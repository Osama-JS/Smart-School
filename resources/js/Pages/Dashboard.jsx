import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { 
    Users, GraduationCap, BookOpen, CheckSquare, 
    TrendingUp, ArrowUpRight, ArrowDownRight, Calendar,
    Clock, AlertCircle, Activity, Sparkles, BookCheck, ShieldAlert
} from 'lucide-react';

export default function Dashboard() {
    const { auth, logo_url } = usePage().props;

    const stats = [
        { 
            title: 'إجمالي الطلاب', value: '1,247', change: '+12%', up: true,
            icon: GraduationCap, color: 'primary',
            iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400',
            progress: 'w-[84%] bg-gradient-to-r from-primary-400 to-primary-600',
            glowBg: 'bg-primary-500/5'
        },
        { 
            title: 'المعلمين', value: '86', change: '+3%', up: true,
            icon: Users, color: 'primary',
            iconBg: 'bg-primary-50/70 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300',
            progress: 'w-[91%] bg-gradient-to-r from-primary-500 to-primary-700',
            glowBg: 'bg-primary-500/5'
        },
        { 
            title: 'المواد الدراسية', value: '24', change: '0%', up: true,
            icon: BookOpen, color: 'primary',
            iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400',
            progress: 'w-[100%] bg-gradient-to-r from-primary-300 to-primary-500',
            glowBg: 'bg-primary-500/5'
        },
        { 
            title: 'نسبة الحضور اليوم', value: '94.2%', change: '-1.3%', up: false,
            icon: CheckSquare, color: 'accent',
            iconBg: 'bg-accent-50 text-accent-600 dark:bg-accent-950/20 dark:text-accent-400',
            progress: 'w-[94.2%] bg-gradient-to-r from-accent-400 to-accent-600',
            glowBg: 'bg-accent-500/5'
        },
    ];

    const recentActivities = [
        { text: 'تم تسجيل 15 طالب جديد في الفصل الدراسي الثالث', time: 'منذ 5 دقائق', type: 'success' },
        { text: 'تم تحديث جدول الحصص للمرحلة المتوسطة', time: 'منذ 30 دقيقة', type: 'info' },
        { text: 'تنبيه: 3 معلمين لم يرفعوا دفاتر التحضير للأسبوع الحالي', time: 'منذ ساعة', type: 'warning' },
        { text: 'تم رصد درجات الشهر الأول لمادة الرياضيات', time: 'منذ ساعتين', type: 'success' },
        { text: 'تم تقديم طلب إجازة اضطرارية من المعلم أحمد محمد', time: 'منذ 3 ساعات', type: 'info' },
    ];

    const getActivityColor = (type) => {
        switch (type) {
            case 'success': return 'bg-primary-500';
            case 'warning': return 'bg-amber-500';
            case 'info': return 'bg-blue-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <AdminLayout activeMenu="الرئيسية">
            <Head title="لوحة التحكم | نظام القيم ERP" />

            <div className="space-y-6">
                
                {/* Premium Dark Welcome Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#5b8a2d] via-primary-800 to-dark-900 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100/40 dark:shadow-none">
                    {/* Subtle brand color glow */}
                    <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <img src={logo_url || '/images/logo.png'} alt="شعار المدرسة" 
                                className="h-14 w-14 rounded-2xl object-contain bg-white p-1.5 shadow-md shrink-0" />
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                                    <span>مرحباً، {auth?.user?.name || 'مدير النظام'}</span>
                                    <span className="animate-bounce">👋</span>
                                </h1>
                                <p className="text-slate-200 text-xs sm:text-sm mt-1 font-medium">نظام القيم ERP — إليك نظرة شاملة على مؤشرات الأداء والنشاطات اليومية</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-white bg-white/10 border border-white/20 px-4 py-2.5 rounded-2xl shadow-sm self-start sm:self-auto backdrop-blur">
                            <Calendar size={14} className="text-primary-200 shrink-0" />
                            <span className="font-bold">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                {/* Refined Stats Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white dark:bg-[#121820] border border-slate-100 dark:border-primary-500/10 p-5 rounded-3xl shadow-sm hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden group">
                            {/* Glowing ambient light matching stat color on hover */}
                            <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                            
                            <div className="relative z-10 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 truncate">{stat.title}</p>
                                    <h3 className="text-2xl font-black text-dark-900 dark:text-white mt-1 leading-none font-mono tracking-tight">{stat.value}</h3>
                                </div>
                                <div className={`h-11 w-11 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}>
                                    <stat.icon size={20} />
                                </div>
                            </div>
                            
                            {/* Visual Progress Bar inside Stats card */}
                            <div className="relative z-10 space-y-2 mt-1">
                                <div className="w-full bg-slate-100 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${stat.progress}`} />
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                    {/* Pill trend badge */}
                                    <div className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border ${
                                        stat.up 
                                            ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-450 border-primary-100/30' 
                                            : 'bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 border-accent-100/20'
                                    }`}>
                                        {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                        <span>{stat.change}</span>
                                    </div>
                                    <span className="text-slate-400 dark:text-slate-500">من الشهر الماضي</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dashboard Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Alerts panel - Stacked on right (RTL left) */}
                    <div className="space-y-5 lg:col-span-1">
                        
                        {/* Alerts Card in Brand Colors */}
                        <div className="erp-premium-card !p-0 overflow-hidden">
                            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={18} className="text-accent-500" />
                                    <h3 className="font-bold text-dark-900 text-sm sm:text-base">تنبيهات النظام</h3>
                                </div>
                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-accent-50 text-accent-700 text-xs font-bold border border-accent-100">3</span>
                            </div>
                            <div className="p-5 space-y-3">
                                {/* Alert item 1 */}
                                <div className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                                    <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-amber-800">فترة رصد الدرجات</p>
                                        <p className="text-[11px] text-amber-600 mt-0.5 font-medium">تنتهي المهلة بعد 3 أيام عمل</p>
                                    </div>
                                </div>
                                {/* Alert item 2 */}
                                <div className="flex items-start gap-3 p-3 bg-accent-50/30 rounded-2xl border border-accent-100/40">
                                    <AlertCircle size={16} className="text-accent-500 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-accent-900">حسابات تحتاج مراجعة</p>
                                        <p className="text-[11px] text-accent-700 mt-0.5 font-medium">يوجد 5 طلاب معطلون مالياً</p>
                                    </div>
                                </div>
                                {/* Alert item 3 */}
                                <div className="flex items-start gap-3 p-3 bg-primary-50/40 rounded-2xl border border-primary-100/40">
                                    <AlertCircle size={16} className="text-primary-600 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-primary-800">تحديث النظام متوفر</p>
                                        <p className="text-[11px] text-primary-600 mt-0.5 font-medium">الإصدار 2.1.0 جاهز للتطبيق</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Beautiful Circular Progress Summary for Attendance */}
                        <div className="erp-premium-card space-y-4">
                            <h4 className="text-sm font-bold text-dark-900 flex items-center gap-2">
                                <BookCheck size={16} className="text-primary-500" />
                                <span>الحضور والانصراف اليوم</span>
                            </h4>
                            <div className="space-y-3.5">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5 text-xs sm:text-sm">
                                        <span className="text-slate-500 font-medium">الطلاب الحاضرون</span>
                                        <span className="font-bold text-primary-700">1,174 (94%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-gradient-to-r from-primary-400 to-primary-600 h-full rounded-full transition-all duration-700" style={{ width: '94%' }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5 text-xs sm:text-sm">
                                        <span className="text-slate-500 font-medium">الطلاب الغائبون</span>
                                        <span className="font-bold text-accent-700">73 (6%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-gradient-to-r from-accent-400 to-accent-600 h-full rounded-full transition-all duration-700" style={{ width: '6%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Activity Feed - 2 Columns Width */}
                    <div className="lg:col-span-2 erp-premium-card !p-0 overflow-hidden flex flex-col justify-between">
                        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity size={18} className="text-primary-500" />
                                <h3 className="font-bold text-dark-900 text-sm sm:text-base">آخر النشاطات الحالية</h3>
                            </div>
                            <button className="text-xs text-primary-600 hover:text-primary-700 font-bold transition-colors">
                                عرض كل السجلات
                            </button>
                        </div>
                        
                        {/* High-end Vertical Timeline Component */}
                        <div className="p-6 relative">
                            <div className="absolute right-9 top-8 bottom-8 w-0.5 bg-slate-100" />
                            <div className="space-y-6">
                                {recentActivities.map((activity, index) => (
                                    <div key={index} className="relative pl-2 pr-10 group">
                                        {/* Circle dot indicator */}
                                        <div className={`absolute right-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${getActivityColor(activity.type)} ring-4 ring-slate-50 z-10 transition-transform duration-300 group-hover:scale-110`} />
                                        
                                        {/* Content Box */}
                                        <div className="bg-slate-50/40 hover:bg-slate-50 border border-slate-100/50 p-4 rounded-2xl transition-all duration-200 hover:shadow-sm">
                                            <p className="text-xs sm:text-sm text-slate-700 font-bold leading-relaxed">{activity.text}</p>
                                            <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5 font-bold">
                                                <Clock size={11} /> {activity.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
