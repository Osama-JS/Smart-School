import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    FileText, Users, BookOpen, Map, Star, AlertTriangle, 
    CheckSquare, Clock, GraduationCap, Award, Eye, Calendar,
    BarChart3, Search, Settings, CalendarDays, ClipboardList, AlertOctagon, Trophy,
    Megaphone, UserCheck, ShieldAlert, Scale, Table, RefreshCcw, Pin, Sparkles, ChevronLeft, ChevronRight,
    Check, X, FileSpreadsheet, File, Loader2, PlayCircle, Lightbulb, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsCenter({ auth, stats, chartData }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [pinnedReports, setPinnedReports] = useState([]);
    const [recentReports, setRecentReports] = useState([]);
    const [currentInsightIdx, setCurrentInsightIdx] = useState(0);
    const [selectedReports, setSelectedReports] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(null);
    const [chartFilter, setChartFilter] = useState('5days');
    
    // Interactive Tour State
    const [showTour, setShowTour] = useState(false);
    const [tourStep, setTourStep] = useState(0);

    const tourSteps = [
        {
            title: 'مرحباً بك في مركز التقارير المتقدم 👋',
            desc: 'لقد قمنا بتصميم هذا المركز ليكون غرفة العمليات الخاصة بك. من هنا يمكنك مراقبة كل تفاصيل المدرسة واتخاذ قرارات مبنية على بيانات دقيقة بشكل احترافي.',
            icon: Sparkles,
            color: 'text-primary-500 dark:text-primary-400',
            bg: 'bg-primary-50 dark:bg-primary-500/10'
        },
        {
            title: 'الرؤى الذكية (Smart Insights) 🧠',
            desc: 'لا حاجة للبحث المعقد في الأرقام، نظامنا الذكي يحلل البيانات يومياً ويعطيك تنبيهات نصية سريعة حول أهم التغيرات في مدرستك.',
            icon: Lightbulb,
            color: 'text-yellow-500 dark:text-yellow-400',
            bg: 'bg-yellow-50 dark:bg-yellow-500/10'
        },
        {
            title: 'الوصول السريع والتصدير المجمع ⚡',
            desc: 'ثبّت تقاريرك المفضلة للوصول لها فوراً. كما يمكنك تحديد أكثر من تقرير بتحديد المربع بجانب كل تقرير، وتصديرها معاً بصيغة PDF أو Excel.',
            icon: Zap,
            color: 'text-emerald-500 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10'
        },
        {
            title: 'مُنشئ التقارير المخصص 🛠️',
            desc: 'لم تجد التقرير الذي تريده؟ استخدم "مُنشئ التقارير" لبناء تقريرك الخاص بالكامل، اختر الأعمدة والفلاتر وقم بحفظ القوالب لاستخدامها لاحقاً.',
            icon: Settings,
            color: 'text-blue-500 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-500/10'
        }
    ];

    const nextTourStep = () => {
        if (tourStep < tourSteps.length - 1) {
            setTourStep(prev => prev + 1);
        } else {
            setShowTour(false);
            setTourStep(0);
        }
    };

    const toggleSelection = (e, report) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedReports.find(r => r.name === report.name)) {
            setSelectedReports(selectedReports.filter(r => r.name !== report.name));
        } else {
            setSelectedReports([...selectedReports, report]);
        }
    };

    const handleBulkExport = (format) => {
        setIsExporting(true);
        setExportSuccess(null);
        // Simulate API compilation time for bulk export
        setTimeout(() => {
            setIsExporting(false);
            setExportSuccess(`تم تجميع ${selectedReports.length} تقارير وتصديرها بصيغة ${format.toUpperCase()} بنجاح!`);
            
            // Generate dummy file to trigger browser download
            const content = `تم إنشاء هذا الملف التجريبي (${format}) لتمثيل عملية التصدير المجمع لـ ${selectedReports.length} تقارير.\nملاحظة: في بيئة الإنتاج الفعلية، سيقوم نظام Laravel بتوليد هذا الملف باستخدام مكتبات مثل DomPDF أو Laravel Excel ودمج البيانات الحقيقية.`;
            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reports_bulk_export_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Clear selection and success message after delay
            setTimeout(() => {
                setSelectedReports([]);
                setExportSuccess(null);
            }, 4000);
        }, 2500);
    };

    // Generate dynamic insights based on data
    const generateInsights = () => {
        let insights = [];
        
        if (chartData && chartData.length >= 2) {
            const today = chartData[chartData.length - 1];
            const yesterday = chartData[chartData.length - 2];
            
            if (today.student_absences > yesterday.student_absences) {
                const diff = today.student_absences - yesterday.student_absences;
                const percent = Math.round((diff / (yesterday.student_absences || 1)) * 100);
                insights.push({
                    type: 'warning',
                    icon: AlertTriangle,
                    text: `لوحظت زيادة بنسبة ${percent}% في غياب الطلاب اليوم مقارنة بالأمس (${diff} طالب إضافي).`,
                    color: 'text-orange-600 dark:text-orange-400',
                    bg: 'bg-orange-50 dark:bg-orange-900/20',
                    border: 'border-orange-200 dark:border-orange-800/50',
                    glow: 'shadow-orange-500/20'
                });
            } else if (today.student_absences < yesterday.student_absences) {
                insights.push({
                    type: 'success',
                    icon: Trophy,
                    text: `مؤشر إيجابي: انخفاض ملحوظ في غياب الطلاب اليوم مقارنة بالأمس!`,
                    color: 'text-emerald-600 dark:text-emerald-400',
                    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                    border: 'border-emerald-200 dark:border-emerald-800/50',
                    glow: 'shadow-emerald-500/20'
                });
            }
        }
        
        if (stats?.followup_books_today > 0) {
            insights.push({
                type: 'info',
                icon: BookOpen,
                text: `تم رفع ${stats.followup_books_today} دفتر متابعة اليوم، معدل التزام المعلمين ممتاز ويساهم في استقرار العملية التعليمية.`,
                color: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                border: 'border-blue-200 dark:border-blue-800/50',
                glow: 'shadow-blue-500/20'
            });
        }
        
        if (stats?.classroom_visits_this_week > 0) {
            insights.push({
                type: 'info',
                icon: Eye,
                text: `نشاط إشرافي جيد: تم تنفيذ ${stats.classroom_visits_this_week} زيارات صفية هذا الأسبوع.`,
                color: 'text-primary-600 dark:text-primary-400',
                bg: 'bg-primary-50 dark:bg-primary-900/20',
                border: 'border-primary-200 dark:border-primary-800/50',
                glow: 'shadow-primary-500/20'
            });
        }

        if (insights.length === 0) {
            insights.push({
                type: 'info',
                icon: Sparkles,
                text: `جميع مؤشرات الأداء المدرسية ضمن المعدلات الطبيعية والمستقرة لهذا اليوم.`,
                color: 'text-primary-600 dark:text-primary-400',
                bg: 'bg-primary-50 dark:bg-primary-900/20',
                border: 'border-primary-200 dark:border-primary-800/50',
                glow: 'shadow-primary-500/20'
            });
        }

        return insights;
    };

    const insights = generateInsights();

    // Auto-rotate insights
    useEffect(() => {
        if (insights.length > 1) {
            const timer = setInterval(() => {
                setCurrentInsightIdx(prev => (prev + 1) % insights.length);
            }, 6000);
            return () => clearInterval(timer);
        }
    }, [insights.length]);

    useEffect(() => {
        const savedPinned = JSON.parse(localStorage.getItem('smart_school_pinned_reports') || '[]');
        const savedRecent = JSON.parse(localStorage.getItem('smart_school_recent_reports') || '[]');
        setPinnedReports(savedPinned);
        setRecentReports(savedRecent);
    }, []);

    const togglePin = (e, report, category) => {
        e.preventDefault();
        e.stopPropagation();
        
        let newPinned;
        if (pinnedReports.find(r => r.name === report.name)) {
            newPinned = pinnedReports.filter(r => r.name !== report.name);
        } else {
            // Save report along with some category context for styling
            newPinned = [...pinnedReports, { ...report, categoryColor: category.color }];
        }
        setPinnedReports(newPinned);
        localStorage.setItem('smart_school_pinned_reports', JSON.stringify(newPinned));
    };

    const handleReportClick = (report, category) => {
        const filtered = recentReports.filter(r => r.name !== report.name);
        const newRecent = [{ ...report, categoryColor: category.color }, ...filtered].slice(0, 3);
        setRecentReports(newRecent);
        localStorage.setItem('smart_school_recent_reports', JSON.stringify(newRecent));
    };

    const reportCategories = [
        {
            title: 'تقارير المعلمين والموظفين',
            icon: Users,
            color: 'from-primary-500 to-primary-700',
            bgGlow: 'bg-primary-500/10',
            reports: [
                {
                    name: 'تقرير غياب المعلمين',
                    description: 'متابعة سجلات الحضور والانصراف والغياب للمعلمين',
                    icon: Clock,
                    url: route('hr.reports.teacher-absences'),
                    permission: 'إدارة الحضور والانصراف',
                },
                {
                    name: 'تقارير رفع دفتر المتابعة',
                    description: 'متابعة انضباط المعلمين في رفع دفاتر التحضير والمتابعة',
                    icon: BookOpen,
                    url: route('hr.reports.followup-books'),
                    permission: 'إدارة دفاتر المتابعة',
                },
                {
                    name: 'تقارير الخطط الدراسية',
                    description: 'متابعة الخطط الدراسية المرفوعة من قبل المعلمين',
                    icon: Map,
                    url: route('hr.reports.study-plans'),
                    permission: 'إدارة الخطط الدراسية',
                },
                {
                    name: 'الزيارات الصفية (المشرف)',
                    description: 'تقارير وسجلات الزيارات الصفية للمشرفين الأكاديميين',
                    icon: Eye,
                    url: route('hr.reports.classroom-visits'),
                    permission: 'إدارة الزيارات الصفية',
                },
                {
                    name: 'كشف تقييمات الموظفين',
                    description: 'استعراض تفصيلي لدرجات التقييم لجميع الموظفين بشكل جدولي',
                    icon: FileText,
                    url: route('hr.appraisals.report'),
                    permission: 'عرض التقييمات الإدارية',
                },
                {
                    name: 'تقارير إجازات الموظفين',
                    description: 'تقارير الإجازات (مرضي، اعتيادي) والرصيد المتبقي للموظفين',
                    icon: CalendarDays,
                    url: route('hr.reports.employee-leaves'),
                    permission: null,
                },
                {
                    name: 'الطلبات الإدارية',
                    description: 'طلبات الاستئذان، خطابات التعريف، وحالتها',
                    icon: ClipboardList,
                    url: route('hr.reports.administrative-requests'),
                    permission: null,
                },
                {
                    name: 'مخالفات الموظفين',
                    description: 'حالات لفت النظر والإنذارات الموجهة للكادر',
                    icon: AlertOctagon,
                    url: route('hr.reports.employee-violations'),
                    permission: null,
                },
                {
                    name: 'إنجازات الموظفين',
                    description: 'سجلات الدورات التدريبية والتميز في الأداء',
                    icon: Trophy,
                    url: route('hr.reports.employee-achievements'),
                    permission: null,
                }
            ]
        },
        {
            title: 'تقارير الطلاب والأكاديمية',
            icon: GraduationCap,
            color: 'from-primary-600 to-primary-800',
            bgGlow: 'bg-primary-600/10',
            reports: [
                {
                    name: 'تقرير غياب الطلاب',
                    description: 'سجلات الغياب اليومي وحسب الحصص للطلاب',
                    icon: AlertTriangle,
                    url: route('academic.attendances.report'),
                    permission: 'إدارة الطلاب',
                },
                {
                    name: 'تقرير الغياب بالحصص',
                    description: 'تقرير تفصيلي لغياب الطلاب بالحصص مخصص للطباعة',
                    icon: FileText,
                    url: route('academic.attendances.class-report'),
                    permission: 'إدارة الطلاب',
                },
                {
                    name: 'كشف الغياب الأسبوعي للطلاب',
                    description: 'كشف تفصيلي لحضور الطلاب يطبع نهاية كل أسبوع',
                    icon: FileText,
                    url: route('academic.attendances.weekly-report'),
                    permission: 'إدارة الطلاب',
                }
            ]
        },
        {
            title: 'تقارير الشؤون الطبية والعيادة',
            icon: Settings, 
            color: 'from-accent-500 to-accent-700',
            bgGlow: 'bg-accent-500/10',
            reports: [
                {
                    name: 'السجل الطبي ومتابعة الزيارات اليومية',
                    description: 'كشف مخصص لإدارة السجلات الطبية للطلاب ومتابعة الزيارات والحالات الطارئة للعيادة',
                    icon: Calendar,
                    url: route('clinic.report'),
                    permission: null,
                }
            ]
        },
        {
            title: 'تقارير التوجيه والإرشاد',
            icon: Scale,
            color: 'from-slate-700 to-slate-900',
            bgGlow: 'bg-slate-700/10',
            reports: [
                {
                    name: 'استدعاء أولياء الأمور',
                    description: 'كشف مخصص لطباعة ومتابعة الاستدعاءات التي تمت لأولياء الأمور',
                    icon: Megaphone,
                    url: route('academic.parent-summons.report'),
                    permission: null,
                },
                {
                    name: 'زيارات أولياء الأمور',
                    description: 'سجل توثيق الآباء الذين حضروا للمدرسة لمتابعة أبنائهم',
                    icon: UserCheck,
                    url: route('academic.parent-visits.report'),
                    permission: null,
                },
                {
                    name: 'كشف تعهدات الطلاب',
                    description: 'كشف موحد لتوثيق التعهدات السلوكية وحالة توقيع الطلاب وأولياء الأمور',
                    icon: ShieldAlert,
                    url: route('academic.student-pledges.report'),
                    permission: null,
                }
            ]
        },
        {
            title: 'تقارير الاختبارات والدرجات 💯',
            icon: Award,
            color: 'from-primary-400 to-primary-600',
            bgGlow: 'bg-primary-500/10',
            reports: [
                {
                    name: 'الدرجات الشهرية',
                    description: 'تقارير تفصيلية لمستوى الطلاب خلال الفترات',
                    icon: BarChart3,
                    url: route('academic.monthly-grades.report.index'),
                    permission: 'إدارة الدرجات',
                },
                {
                    name: 'نتائج نهاية الفصل',
                    description: 'الشهادات والنتائج النهائية والمعدل التراكمي',
                    icon: Award,
                    url: route('academic.semester-results.index'),
                    permission: 'إدارة الدرجات',
                },
                {
                    name: 'كشف العلامات المجمع',
                    description: 'كشف درجات ونتائج الطلاب في جميع المواد',
                    icon: FileText,
                    url: route('academic.semester-results.report'),
                    permission: 'إدارة الدرجات',
                },
            ]
        },
        {
            title: 'تقارير الجدول المدرسي وحصص الاحتياط 🗓️',
            icon: Table,
            color: 'from-slate-800 to-slate-950',
            bgGlow: 'bg-slate-800/10',
            reports: [
                {
                    name: 'الجدول المدرسي العام',
                    description: 'تقرير شامل يعرض نصاب كل معلم من الحصص',
                    icon: Table,
                    url: route('academic.timetable.report'),
                    permission: null,
                },
                {
                    name: 'حصص الانتظار والاحتياط',
                    description: 'تقرير يوضح المعلمين الذين غطوا الحصص الاحتياطية',
                    icon: RefreshCcw,
                    url: route('academic.coverage.report'),
                    permission: null,
                },
            ]

        },
        {
            title: 'تقارير الاجتماعات والمجالس 🤝',
            icon: Users,
            color: 'from-accent-600 to-accent-800',
            bgGlow: 'bg-accent-600/10',
            reports: [
                {
                    name: 'محاضر الاجتماعات',
                    description: 'تقرير يوثق المجالس المدرسية، حضورها وغيابها ومقرراتها',
                    icon: Users,
                    url: route('meetings.report'),
                    permission: null,
                }
            ]
        }
    ];

    const hasPermission = (permissionName) => {
        if (!permissionName) return true;
        if (auth?.user?.is_admin || auth?.user?.is_system_admin) return true;
        return auth?.permissions?.includes(permissionName);
    };

    return (
        <AdminLayout activeMenu="التقارير">
            <Head title="مركز التقارير" />
            
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* 1. Stunning Hero Banner */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-primary-900 via-primary-800 to-primary-600 p-8 sm:p-14 shadow-2xl shadow-primary-900/20 text-white border border-primary-500/30">
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-accent-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right w-full lg:w-auto">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-inner transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                                <FileText size={40} className="text-white drop-shadow-md" />
                            </div>
                            <div>
                                <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight text-white drop-shadow-sm">مركز التقارير المتقدم</h1>
                                <p className="text-primary-100 font-medium text-lg max-w-xl leading-relaxed">
                                    منصة تحليلية شاملة لاستعراض وتقييم الأداء المدرسي. استخرج التقارير بدقة وسرعة لاتخاذ قرارات مدعومة بالبيانات.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                            <button
                                onClick={() => { setShowTour(true); setTourStep(0); }}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-md"
                            >
                                <PlayCircle size={20} />
                                <span>كيف أستفيد من المركز؟</span>
                            </button>
                            
                            <div className="relative w-full sm:w-72 group">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-white/60 group-focus-within:text-white transition-colors">
                                    <Search size={22} />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-5 pr-14 py-4 rounded-2xl bg-black/10 backdrop-blur-xl border border-white/10 text-white placeholder-white/60 focus:bg-black/20 focus:border-white/30 focus:ring-4 focus:ring-white/10 transition-all font-medium text-lg shadow-inner"
                                    placeholder="ابحث عن تقرير..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <Link
                                href={route('reports.custom')}
                                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-primary-900 hover:bg-slate-50 px-8 py-4 rounded-2xl font-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 border border-white/50"
                            >
                                <Settings size={22} className="animate-spin-slow text-primary-600" />
                                <span className="text-lg">مُنشئ التقارير</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* AI Smart Insights Banner */}
                {insights.length > 0 && (
                    <div className={`relative overflow-hidden rounded-2xl border ${insights[currentInsightIdx % insights.length].border} ${insights[currentInsightIdx % insights.length].bg} transition-all duration-500 shadow-lg ${insights[currentInsightIdx % insights.length].glow} flex items-center justify-between p-4 sm:p-5 group`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 dark:bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        
                        <div className="flex items-center gap-4 relative z-10 w-full">
                            <div className={`w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center ${insights[currentInsightIdx % insights.length].color} shadow-sm flex-shrink-0 animate-pulse-slow`}>
                                {React.createElement(insights[currentInsightIdx % insights.length].icon, { size: 24, strokeWidth: 2.5 })}
                            </div>
                            
                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={14} className={insights[currentInsightIdx % insights.length].color} />
                                    <span className={`text-xs font-bold uppercase tracking-wider ${insights[currentInsightIdx % insights.length].color}`}>رؤى ذكية (Smart Insights)</span>
                                </div>
                                <p className={`text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 leading-snug transition-all duration-300 transform`}>
                                    {insights[currentInsightIdx % insights.length].text}
                                </p>
                            </div>
                            
                            {/* Controls */}
                            {insights.length > 1 && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-lg p-1 border border-white/20">
                                    <button 
                                        onClick={() => setCurrentInsightIdx(prev => prev === 0 ? insights.length - 1 : prev - 1)}
                                        className={`w-8 h-8 rounded-md flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors ${insights[currentInsightIdx % insights.length].color}`}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                    <div className="text-xs font-bold text-slate-500 px-1 w-8 text-center" dir="ltr">
                                        {(currentInsightIdx % insights.length) + 1}/{insights.length}
                                    </div>
                                    <button 
                                        onClick={() => setCurrentInsightIdx(prev => (prev + 1) % insights.length)}
                                        className={`w-8 h-8 rounded-md flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors ${insights[currentInsightIdx % insights.length].color}`}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Bento Grid Summary */}
                {(stats || (chartData && chartData.length > 0)) && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* KPIs Bento (5 Columns) */}
                        <div className="lg:col-span-5 grid grid-cols-2 gap-4 sm:gap-6">
                            {/* Student Absences */}
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(239,68,68,0.12)] hover:border-red-200 dark:hover:border-red-900/50 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                <div className="flex justify-between items-start relative z-10 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform duration-500">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">اليوم</span>
                                </div>
                                <div className="relative z-10 mt-auto">
                                    <div className="flex items-end gap-3 mb-2">
                                        <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats?.student_absences_today || 0}</div>
                                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">الهدف: &lt; 20</div>
                                    </div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <div className="text-sm text-slate-600 dark:text-slate-400 font-bold">غياب الطلاب</div>
                                        <div className={`text-xs font-black ${((stats?.student_absences_today || 0) > 20) ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {Math.round(((stats?.student_absences_today || 0) / 20) * 100)}%
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${((stats?.student_absences_today || 0) > 20) ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min(((stats?.student_absences_today || 0) / 20) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Teacher Absences */}
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(249,115,22,0.12)] hover:border-orange-200 dark:hover:border-orange-900/50 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                <div className="flex justify-between items-start relative z-10 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-500">
                                        <Clock size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">اليوم</span>
                                </div>
                                <div className="relative z-10 mt-auto">
                                    <div className="flex items-end gap-3 mb-2">
                                        <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats?.teacher_absences_today || 0}</div>
                                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">الهدف: 0</div>
                                    </div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <div className="text-sm text-slate-600 dark:text-slate-400 font-bold">غياب المعلمين</div>
                                        <div className={`text-xs font-black ${((stats?.teacher_absences_today || 0) > 3) ? 'text-red-500' : 'text-orange-500'}`}>
                                            {Math.round(((stats?.teacher_absences_today || 0) / 10) * 100)}%
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${((stats?.teacher_absences_today || 0) > 3) ? 'bg-red-500' : 'bg-orange-500'}`}
                                            style={{ width: `${Math.min(((stats?.teacher_absences_today || 0) / 10) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Follow-up Books */}
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(107,155,55,0.12)] hover:border-primary-200 dark:hover:border-primary-900/50 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                <div className="flex justify-between items-start relative z-10 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-500">
                                        <BookOpen size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">مرفوعة اليوم</span>
                                </div>
                                <div className="relative z-10 mt-auto">
                                    <div className="flex items-end gap-3 mb-2">
                                        <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats?.followup_books_today || 0}</div>
                                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">الهدف: 40 دفتر</div>
                                    </div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <div className="text-sm text-slate-600 dark:text-slate-400 font-bold">دفاتر المتابعة</div>
                                        <div className={`text-xs font-black ${((stats?.followup_books_today || 0) >= 35) ? 'text-emerald-500' : 'text-primary-500'}`}>
                                            {Math.round(((stats?.followup_books_today || 0) / 40) * 100)}%
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${((stats?.followup_books_today || 0) >= 35) ? 'bg-emerald-500' : 'bg-primary-500'}`}
                                            style={{ width: `${Math.min(((stats?.followup_books_today || 0) / 40) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Classroom Visits */}
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                <div className="flex justify-between items-start relative z-10 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-500">
                                        <Eye size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">هذا الأسبوع</span>
                                </div>
                                <div className="relative z-10 mt-auto">
                                    <div className="flex items-end gap-3 mb-2">
                                        <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats?.classroom_visits_this_week || 0}</div>
                                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">الهدف: 15 زيارة</div>
                                    </div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <div className="text-sm text-slate-600 dark:text-slate-400 font-bold">الزيارات الصفية</div>
                                        <div className={`text-xs font-black text-emerald-500`}>
                                            {Math.round(((stats?.classroom_visits_this_week || 0) / 15) * 100)}%
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full rounded-full bg-emerald-500 transition-all duration-1000`}
                                            style={{ width: `${Math.min(((stats?.classroom_visits_this_week || 0) / 15) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart (7 Columns) */}
                        {chartData && chartData.length > 0 && (
                            <div className="lg:col-span-7 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 flex flex-col shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700/50 shadow-inner">
                                            <BarChart3 size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">مقارنة الحضور والغياب</h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">انقر على الأعمدة للتعمق في التفاصيل (Drill-down)</p>
                                        </div>
                                    </div>
                                    
                                    {/* Time Filters */}
                                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                                        <button onClick={() => setChartFilter('5days')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${chartFilter === '5days' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>آخر 5 أيام</button>
                                        <button onClick={() => setChartFilter('week')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${chartFilter === 'week' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>الأسبوع</button>
                                        <button onClick={() => setChartFilter('month')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${chartFilter === 'month' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>الشهر</button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 w-full min-h-[250px]" dir="ltr">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} dx={-10} />
                                            <Tooltip 
                                                contentStyle={{borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                                                cursor={{fill: '#f1f5f9'}}
                                            />
                                            <Legend wrapperStyle={{paddingTop: '10px', fontWeight: 'bold', fontSize: '13px'}} iconType="circle" />
                                            <Bar 
                                                dataKey="student_absences" 
                                                name="غياب الطلاب" 
                                                fill="#ef4444" 
                                                radius={[6, 6, 0, 0]} 
                                                barSize={20} 
                                                onClick={() => window.location.href = route('academic.attendances.index')}
                                                cursor="pointer"
                                                className="hover:opacity-80 transition-opacity"
                                            />
                                            <Bar 
                                                dataKey="teacher_absences" 
                                                name="غياب المعلمين" 
                                                fill="#f97316" 
                                                radius={[6, 6, 0, 0]} 
                                                barSize={20} 
                                                onClick={() => window.location.href = route('hr.reports.teacher-absences')}
                                                cursor="pointer"
                                                className="hover:opacity-80 transition-opacity"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Quick Access Section (Pinned & Recent) */}
                {(pinnedReports.length > 0 || recentReports.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        {/* Pinned Reports */}
                        {pinnedReports.length > 0 && (
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                        <Pin size={20} className="fill-current" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">التقارير المثبتة</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {pinnedReports.map((report, idx) => {
                                        // Lookup original report to get the valid React component icon
                                        const originalCategory = reportCategories.find(c => c.reports.some(r => r.name === report.name));
                                        const originalReport = originalCategory?.reports.find(r => r.name === report.name);
                                        const ReportIcon = originalReport?.icon || FileText;
                                        return (
                                        <Link
                                            key={idx}
                                            href={report.url}
                                            onClick={() => handleReportClick(report, { color: report.categoryColor })}
                                            className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                                        >
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${report.categoryColor || 'from-slate-500 to-slate-700'} flex items-center justify-center text-white flex-shrink-0`}>
                                                <ReportIcon size={20} />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="font-bold text-slate-800 dark:text-white truncate group-hover:text-primary-600 transition-colors text-sm">{report.name}</h4>
                                            </div>
                                            <button 
                                                onClick={(e) => togglePin(e, report, { color: report.categoryColor })}
                                                className="w-8 h-8 flex items-center justify-center text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 rounded-lg transition-colors"
                                            >
                                                <Pin size={16} className="fill-current" />
                                            </button>
                                        </Link>
                                    )})}
                                </div>
                            </div>
                        )}

                        {/* Recent Reports */}
                        {recentReports.length > 0 && (
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Clock size={20} />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">تم استعراضها مؤخراً</h2>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {recentReports.map((report, idx) => {
                                        // Lookup original report to get the valid React component icon
                                        const originalCategory = reportCategories.find(c => c.reports.some(r => r.name === report.name));
                                        const originalReport = originalCategory?.reports.find(r => r.name === report.name);
                                        const ReportIcon = originalReport?.icon || FileText;
                                        return (
                                        <Link
                                            key={idx}
                                            href={report.url}
                                            className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                                        >
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${report.categoryColor || 'from-slate-500 to-slate-700'} flex items-center justify-center text-white flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity`}>
                                                <ReportIcon size={18} />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="font-bold text-slate-800 dark:text-white truncate group-hover:text-primary-600 transition-colors text-sm">{report.name}</h4>
                                                <p className="text-xs text-slate-500 truncate">{report.description}</p>
                                            </div>
                                            <div className="w-8 h-8 flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                                                <span className="rtl:-scale-x-100 inline-block font-black">&rarr;</span>
                                            </div>
                                        </Link>
                                    )})}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Asymmetrical Magazine-style Categories Layout */}
                <div className="space-y-12 mt-8">
                    {reportCategories.map((category, catIdx) => {
                        const filteredReports = category.reports.filter(report => {
                            const matchesPermission = hasPermission(report.permission);
                            const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                  report.description.toLowerCase().includes(searchQuery.toLowerCase());
                            return matchesPermission && matchesSearch;
                        });
                        
                        if (filteredReports.length === 0) return null;

                        return (
                            <div key={catIdx} className="flex flex-col gap-6 relative pt-10 border-t border-slate-200/60 dark:border-slate-800/60 first:border-0 first:pt-0">
                                {/* Category Header */}
                                <div className="flex items-center gap-5 mb-2">
                                    <div className={`flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} text-white shadow-lg shadow-${category.color.split('-')[1]}-500/20 border border-white/10`}>
                                        <category.icon size={28} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                            {category.title}
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                                            التقارير الخاصة بهذا القسم لتحليل الأداء بدقة
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Category Reports Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {filteredReports.map((report, idx) => {
                                        const isPinned = pinnedReports.some(r => r.name === report.name);
                                        const isSelected = selectedReports.some(r => r.name === report.name);
                                        return (
                                        <Link
                                            key={idx}
                                            href={report.url}
                                            onClick={() => handleReportClick(report, category)}
                                            className={`group relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border ${isSelected ? 'border-primary-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-slate-200/80 dark:border-slate-700/50 hover:border-primary-200 dark:hover:border-primary-800/50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]'} rounded-[1.5rem] p-6 transition-all duration-500 hover:-translate-y-1.5 overflow-hidden flex flex-col h-full`}
                                        >
                                            {/* Selection Checkbox */}
                                            <button
                                                onClick={(e) => toggleSelection(e, report)}
                                                className={`absolute top-5 left-5 z-20 w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/30' : 'border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100 bg-white/50 dark:bg-slate-800/50 hover:border-primary-400'}`}
                                            >
                                                {isSelected && <Check size={14} strokeWidth={4} />}
                                            </button>

                                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${category.color} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`}></div>
                                            
                                            <div className="relative z-10 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-14 h-14 rounded-[1.1rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors duration-500 relative overflow-hidden border border-slate-100 dark:border-slate-700">
                                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${category.color} transition-opacity duration-500`}></div>
                                                        <report.icon size={26} strokeWidth={2} className="relative z-10" />
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => togglePin(e, report, category)}
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isPinned ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10'} shadow-sm border border-transparent ${isPinned ? 'border-yellow-200 dark:border-yellow-900/50' : ''}`}
                                                            title={isPinned ? 'إلغاء التثبيت' : 'تثبيت التقرير'}
                                                        >
                                                            <Pin size={18} className={isPinned ? 'fill-current' : ''} />
                                                        </button>
                                                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all duration-500 shadow-sm">
                                                            <span className="rtl:-scale-x-100 inline-block font-black">&rarr;</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                
                                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                                                    {report.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-auto">
                                                    {report.description}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bulk Export Floating Action Bar */}
            {selectedReports.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500 fade-in w-full max-w-2xl px-4">
                    <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/10 p-2 sm:pl-6 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 overflow-hidden relative">
                        {/* Success Overlay */}
                        {exportSuccess && (
                            <div className="absolute inset-0 bg-emerald-600 z-10 flex items-center justify-center gap-3 animate-in fade-in duration-300">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                                    <Check size={20} strokeWidth={3} />
                                </div>
                                <span className="text-white font-bold">{exportSuccess}</span>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto px-2 sm:px-0">
                            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-500/30">
                                {selectedReports.length}
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">تقارير محددة للتصدير</h4>
                                <p className="text-slate-400 text-xs">سيتم دمجها في ملف واحد</p>
                            </div>
                        </div>
                        
                        <div className="hidden sm:block h-8 w-px bg-white/10"></div>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button 
                                onClick={() => handleBulkExport('pdf')}
                                disabled={isExporting}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group border border-red-500/20 hover:border-red-500/50"
                            >
                                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <File size={18} className="group-hover:scale-110 transition-transform" />}
                                <span className="text-sm font-bold">PDF مجمع</span>
                            </button>
                            <button 
                                onClick={() => handleBulkExport('excel')}
                                disabled={isExporting}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group border border-emerald-500/20 hover:border-emerald-500/50"
                            >
                                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform" />}
                                <span className="text-sm font-bold">Excel (Sheets)</span>
                            </button>
                            <button 
                                onClick={() => setSelectedReports([])}
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-600 text-slate-300 ml-1 transition-colors border border-white/5"
                                title="إلغاء التحديد"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Tour Modal */}
            {showTour && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-black text-lg text-slate-800 dark:text-white">جولة تعريفية</h3>
                            <button onClick={() => setShowTour(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-8 sm:p-12 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            
                            <div className={`mx-auto w-24 h-24 rounded-[2rem] ${tourSteps[tourStep].bg} ${tourSteps[tourStep].color} flex items-center justify-center mb-8 shadow-inner transform transition-transform duration-500 hover:scale-110`}>
                                {React.createElement(tourSteps[tourStep].icon, { size: 48, strokeWidth: 1.5 })}
                            </div>
                            
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-4 leading-tight tracking-tight">
                                {tourSteps[tourStep].title}
                            </h2>
                            
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
                                {tourSteps[tourStep].desc}
                            </p>
                        </div>
                        
                        {/* Footer (Controls) */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex items-center justify-between">
                            {/* Dots */}
                            <div className="flex gap-2" dir="ltr">
                                {tourSteps.map((_, i) => (
                                    <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === tourStep ? 'w-6 bg-primary-500' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}></div>
                                ))}
                            </div>
                            
                            {/* Buttons */}
                            <div className="flex gap-3">
                                {tourStep > 0 && (
                                    <button 
                                        onClick={() => setTourStep(prev => prev - 1)}
                                        className="px-5 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors"
                                    >
                                        السابق
                                    </button>
                                )}
                                <button 
                                    onClick={nextTourStep}
                                    className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-colors shadow-md shadow-primary-500/20"
                                >
                                    {tourStep === tourSteps.length - 1 ? 'ابدأ الآن' : 'التالي'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
