import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    FileText, Users, BookOpen, Map, Star, AlertTriangle, 
    CheckSquare, Clock, GraduationCap, Award, Eye, Calendar,
    BarChart3, Search, Settings, CalendarDays, ClipboardList, AlertOctagon, Trophy,
    Megaphone, UserCheck, ShieldAlert, Scale, Table, RefreshCcw, Pin, Sparkles, ChevronLeft, ChevronRight,
    Check, X, PlayCircle, Lightbulb, ChevronDown, ChevronUp, Building2, Stethoscope, Activity, Sparkle, Palette
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsCenter({ 
    auth, 
    stats, 
    chartData: initialChartData = [], 
    filters = {}, 
    academicYears = [], 
    semesters = [], 
    userBranch 
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [pinnedReports, setPinnedReports] = useState([]);
    const [recentReports, setRecentReports] = useState([]);
    const [currentInsightIdx, setCurrentInsightIdx] = useState(0);
    const [chartFilter, setChartFilter] = useState(filters.chart_period || '5days');
    const [chartData, setChartData] = useState(initialChartData);
    const [loadingChart, setLoadingChart] = useState(false);
    
    // Toggle Section for School KPIs & Analytics (Hidden by default as requested)
    const [showKPIsSection, setShowKPIsSection] = useState(false);

    // Academic Year & Semester filter states
    const [selectedYear, setSelectedYear] = useState(filters.academic_year_id || '');
    const [selectedSemester, setSelectedSemester] = useState(filters.semester_id || '');
    
    // Interactive Tour State
    const [showTour, setShowTour] = useState(false);
    const [tourStep, setTourStep] = useState(0);

    const tourSteps = [
        {
            title: 'مرحباً بك في مركز التقارير المتقدم 👋',
            desc: 'لقد قمنا بتصميم هذا المركز ليكون غرفة العمليات الخاصة بك في إطار فرعك. يمكنك مراقبة كل تفاصيل المدرسة واستخراج التقارير المعتمدة بدقة وسرعة.',
            icon: Sparkles,
            color: 'text-primary-500 dark:text-primary-400',
            bg: 'bg-primary-50 dark:bg-primary-500/10'
        },
        {
            title: 'مؤشرات الأداء المدرسية والرسوم البيانية 📊',
            desc: 'يمكنك إظهار أو إخفاء قسم مؤشرات الأداء بنقرة زر واحدة لتصفح مريح والتركيز على ما يهمك، مع رسوم بيانية تفاعلية تدعم فترات زمنية متعددة.',
            icon: BarChart3,
            color: 'text-emerald-500 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10'
        },
        {
            title: 'عزل البيانات وفقاً للفرع والفصل الدراسي 🏫',
            desc: 'بيانات المركز معزولة ومحمية بالكامل في إطار فرع مدرستك فقط. كما يمكنك تصفية المؤشرات بناءً على العام الدراسي والفصل المختار.',
            icon: Building2,
            color: 'text-blue-500 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-500/10'
        },
        {
            title: 'مُنشئ التقارير المخصص 🛠️',
            desc: 'لم تجد التقرير الذي تريده؟ استخدم "مُنشئ التقارير" لبناء تقريرك الخاص بالكامل، اختر الحقول والشروط والفلاتر وصدر النتائج مباشرة.',
            icon: Settings,
            color: 'text-purple-500 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-500/10'
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

    // Filter by Academic Year or Semester
    const handleYearChange = (yearId) => {
        setSelectedYear(yearId);
        router.get(route('reports.center'), {
            academic_year_id: yearId,
            chart_period: chartFilter
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleSemesterChange = (semesterId) => {
        setSelectedSemester(semesterId);
        router.get(route('reports.center'), {
            academic_year_id: selectedYear,
            semester_id: semesterId,
            chart_period: chartFilter
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Handle Timeframe changes for Chart with Real Server Queries
    const handleChartFilterChange = async (period) => {
        setChartFilter(period);
        setLoadingChart(true);
        try {
            const url = new URL(route('reports.center'), window.location.origin);
            url.searchParams.set('chart_period', period);
            if (selectedYear) url.searchParams.set('academic_year_id', selectedYear);
            if (selectedSemester) url.searchParams.set('semester_id', selectedSemester);

            const res = await fetch(url.toString(), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.chartData) {
                    setChartData(data.chartData);
                }
            }
        } catch (err) {
            console.error('Error fetching chart data:', err);
        } finally {
            setLoadingChart(false);
        }
    };

    // Generate dynamic insights based on real server data
    const generateInsights = () => {
        let insights = [];
        
        if (chartData && chartData.length >= 2) {
            const today = chartData[chartData.length - 1];
            const yesterday = chartData[chartData.length - 2];
            
            if (today && yesterday && today.student_absences > yesterday.student_absences) {
                const diff = today.student_absences - yesterday.student_absences;
                const percent = Math.round((diff / (yesterday.student_absences || 1)) * 100);
                insights.push({
                    type: 'warning',
                    icon: AlertTriangle,
                    text: `لوحظت زيادة بنسبة ${percent}% في غياب الطلاب اليوم مقارنة بالأمس (${diff} طالب إضافي في الفرع).`,
                    color: 'text-orange-600 dark:text-orange-400',
                    bg: 'bg-orange-50 dark:bg-orange-900/20',
                    border: 'border-orange-200 dark:border-orange-800/50',
                    glow: 'shadow-orange-500/20'
                });
            } else if (today && yesterday && today.student_absences < yesterday.student_absences) {
                insights.push({
                    type: 'success',
                    icon: Trophy,
                    text: `مؤشر إيجابي: انخفاض ملحوظ في غياب الطلاب اليوم في الفرع مقارنة بالأمس!`,
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
                text: `تم رفع ${stats.followup_books_today} دفتر متابعة اليوم من أصل ${stats?.expected_followups || 0} متوقع، معدل التزام المعلمين يساهم في ضبط جودة الحصص.`,
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
                text: `نشاط إشرافي نشط: تم إنجاز ${stats.classroom_visits_this_week} زيارة صفية هذا الأسبوع في الفرع.`,
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
                text: `جميع مؤشرات الأداء لفرعك (${userBranch?.name || 'الفرع الحالي'}) ضمن المعدلات الطبيعية والمستقرة لهذا اليوم.`,
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

    // Calculate real dynamic rates based on actual database totals
    const studentAbsenceCount = stats?.student_absences_today || 0;
    const totalStudents = stats?.total_students || 0;
    const studentAttendanceRate = totalStudents > 0 
        ? Math.max(0, Math.round(((totalStudents - studentAbsenceCount) / totalStudents) * 100))
        : 100;
    const studentAbsenceRate = totalStudents > 0 
        ? Math.round((studentAbsenceCount / totalStudents) * 100)
        : 0;

    const teacherAbsenceCount = stats?.teacher_absences_today || 0;
    const totalTeachers = stats?.total_teachers || 0;
    const teacherAttendanceRate = totalTeachers > 0
        ? Math.max(0, Math.round(((totalTeachers - teacherAbsenceCount) / totalTeachers) * 100))
        : 100;

    const followupBooksCount = stats?.followup_books_today || 0;
    const expectedFollowups = stats?.expected_followups || 1;
    const followupRate = Math.min(100, Math.round((followupBooksCount / expectedFollowups) * 100));

    const classroomVisitsCount = stats?.classroom_visits_this_week || 0;
    const expectedVisits = stats?.expected_visits_per_week || 1;
    const visitRate = Math.min(100, Math.round((classroomVisitsCount / expectedVisits) * 100));

    // Full Complete Categorized Report Registry (including newly added reports)
    const reportCategories = [
        {
            title: 'تقارير المعلمين والموظفين',
            icon: Users,
            color: 'from-primary-500 to-primary-700',
            reports: [
                {
                    name: 'تقرير غياب المعلمين',
                    description: 'متابعة سجلات الحضور والانصراف والغياب اليومي والتراكمي للمعلمين',
                    icon: Clock,
                    url: route('hr.reports.teacher-absences'),
                    permission: 'إدارة الحضور والانصراف',
                },
                {
                    name: 'تقارير رفع دفتر المتابعة',
                    description: 'متابعة انضباط المعلمين في رفع دفاتر التحضير والمتابعة والواجبات',
                    icon: BookOpen,
                    url: route('hr.reports.followup-books'),
                    permission: 'إدارة دفاتر المتابعة',
                },
                {
                    name: 'تقارير الخطط الدراسية',
                    description: 'متابعة الخطط الفصلية والأسبوعية المرفوعة من قبل المعلمين واعتمادها',
                    icon: Map,
                    url: route('hr.reports.study-plans'),
                    permission: 'إدارة الخطط الدراسية',
                },
                {
                    name: 'الزيارات الصفية الأكاديمية',
                    description: 'تقارير وسجلات الزيارات الصفية للمشرفين التربويين وتقييم الأداء',
                    icon: Eye,
                    url: route('hr.reports.classroom-visits'),
                    permission: 'إدارة الزيارات الصفية',
                },
                {
                    name: 'كشف تقييمات الموظفين (Appraisals)',
                    description: 'استعراض تفصيلي لدرجات التقييم لجميع الموظفين بشكل جدولي ورسومي',
                    icon: FileText,
                    url: route('hr.appraisals.report'),
                    permission: 'عرض التقييمات الإدارية',
                },
                {
                    name: 'تقارير إجازات الموظفين',
                    description: 'تقارير الإجازات المعتمدة (مرضي، اعتيادي، اضطراري) والرصيد المتبقي',
                    icon: CalendarDays,
                    url: route('hr.reports.employee-leaves'),
                    permission: null,
                },
                {
                    name: 'تقرير الطلبات الإدارية',
                    description: 'سجل طلبات الاستئذان، السلف، وشهادات التعريف وحالات الموافقة',
                    icon: ClipboardList,
                    url: route('hr.reports.administrative-requests'),
                    permission: null,
                },
                {
                    name: 'سجل مخالفات الموظفين',
                    description: 'حالات لفت النظر، التنبيهات، والإنذارات الموجهة للكادر الوظيفي',
                    icon: AlertOctagon,
                    url: route('hr.reports.employee-violations'),
                    permission: null,
                },
                {
                    name: 'سجل إنجازات وتكريم الموظفين',
                    description: 'سجلات الدورات التدريبية، شهادات الشكر والتميز في الأداء المهني',
                    icon: Trophy,
                    url: route('hr.reports.employee-achievements'),
                    permission: null,
                }
            ]
        },
        {
            title: 'تقارير الطلاب والحضور المدرسي',
            icon: GraduationCap,
            color: 'from-emerald-600 to-teal-800',
            reports: [
                {
                    name: 'تقرير غياب الطلاب اليومي',
                    description: 'سجلات الحضور والغياب اليومي للطلاب حسب الشعب والصفوف',
                    icon: AlertTriangle,
                    url: route('academic.attendances.report'),
                    permission: 'إدارة الطلاب',
                },
                {
                    name: 'تقرير الغياب بالحصص (Class Attendance)',
                    description: 'تقرير تفصيلي لغياب الطلاب لكل حصة دراسية مع اسم المعلم المسجل',
                    icon: FileText,
                    url: route('academic.attendances.class-report'),
                    permission: 'إدارة الطلاب',
                },
                {
                    name: 'كشف الغياب الأسبوعي للطلاب',
                    description: 'كشف تفصيلي لحضور الطلاب يطبع نهاية كل أسبوع للمتابعة الدورية',
                    icon: Calendar,
                    url: route('academic.attendances.weekly-report'),
                    permission: 'إدارة الطلاب',
                }
            ]
        },
        {
            title: 'تقارير الشؤون الطبية والعيادة المدرسية 🩺',
            icon: Stethoscope, 
            color: 'from-rose-500 to-rose-700',
            reports: [
                {
                    name: 'تقرير سجلات وزيارات العيادة المدرسية',
                    description: 'كشف شامل للحالات المرضية، الإسعافات الأولية، ومتابعة الأمراض المزمنة للطلاب',
                    icon: Activity,
                    url: route('clinic.report'),
                    permission: null,
                }
            ]
        },
        {
            title: 'تقارير التوجيه والإرشاد الطلابي والانتظام',
            icon: Scale,
            color: 'from-amber-600 to-orange-800',
            reports: [
                {
                    name: 'كشف استدعاء أولياء الأمور',
                    description: 'كشف مخصص لطباعة ومتابعة الاستدعاءات الرسمية لأولياء الأمور مع أسبابها',
                    icon: Megaphone,
                    url: route('academic.parent-summons.report'),
                    permission: null,
                },
                {
                    name: 'سجل زيارات أولياء الأمور',
                    description: 'سجل توثيق أولياء الأمور الذين حضروا للمدرسة لمتابعة أبنائهم وتوصيات اللقاء',
                    icon: UserCheck,
                    url: route('academic.parent-visits.report'),
                    permission: null,
                },
                {
                    name: 'كشف تعهدات الطلاب السلوكية',
                    description: 'كشف موحد لتوثيق التعهدات السلوكية وحالة توقيع الطلاب وأولياء الأمور إلكترونياً',
                    icon: ShieldAlert,
                    url: route('academic.student-pledges.report'),
                    permission: null,
                }
            ]
        },
        {
            title: 'تقارير الاختبارات والنتائج والدرجات 💯',
            icon: Award,
            color: 'from-indigo-600 to-blue-800',
            reports: [
                {
                    name: 'تقرير الدرجات الشهرية',
                    description: 'تقارير تفصيلية لدرجات الطلاب خلال الفترات والشهور الدراسية',
                    icon: BarChart3,
                    url: route('academic.monthly-grades.report.index'),
                    permission: 'إدارة الدرجات',
                },
                {
                    name: 'كشف العلامات المجمع الفصلي',
                    description: 'كشف درجات ونتائج الطلاب الشامل لكافة المواد والنسب المئوية والترتيب',
                    icon: FileText,
                    url: route('academic.semester-results.report'),
                    permission: 'إدارة الدرجات',
                }
            ]
        },
        {
            title: 'تقارير الجدول المدرسي وحصص الاحتياط 🗓️',
            icon: Table,
            color: 'from-slate-700 to-slate-900',
            reports: [
                {
                    name: 'الجدول المدرسي العام',
                    description: 'تقرير شامل يعرض نصاب كل معلم من الحصص وجداول الفصول الدراسية',
                    icon: Table,
                    url: route('academic.timetable.report'),
                    permission: null,
                },
                {
                    name: 'حصص الانتظار والاحتياط (Coverage)',
                    description: 'تقرير يوضح المعلمين الذين غطوا الحصص الاحتياطية ونصاب التغطية الإضافي',
                    icon: RefreshCcw,
                    url: route('academic.coverage.report'),
                    permission: null,
                }
            ]
        },
        {
            title: 'تقارير الاجتماعات والمجالس المدرسية 🤝',
            icon: Users,
            color: 'from-cyan-600 to-blue-800',
            reports: [
                {
                    name: 'محاضر الاجتماعات والمجالس',
                    description: 'تقرير يوثق المجالس المدرسية، حضورها وغيابها، والقرارات والتوصيات المعتمدة',
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
            
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* 1. Header Banner with Branch Isolation Badge & Year/Semester Selectors */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">مركز التقارير الموحد</h1>
                                {userBranch && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 border border-primary-200 dark:border-primary-700/50">
                                        <Building2 size={13} />
                                        <span>فرع: {userBranch.name}</span>
                                    </span>
                                )}
                            </div>
                            <p className="text-primary-700/80 dark:text-primary-300/80 text-sm font-semibold max-w-2xl">
                                منصة تحليلية موحدة لاستعراض ومتابعة تقارير المدرسة وإدارتها بدقة وسرعة في إطار فرعك
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Academic Year Selector */}
                            {academicYears.length > 0 && (
                                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-2xl shadow-sm">
                                    <Calendar size={15} className="text-primary-600 dark:text-primary-400" />
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => handleYearChange(e.target.value)}
                                        className="bg-transparent border-0 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer p-0"
                                    >
                                        {academicYears.map(year => (
                                            <option key={year.id} value={year.id} className="dark:bg-slate-800">
                                                العام: {year.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Semester Selector */}
                            {semesters.length > 0 && (
                                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-2xl shadow-sm">
                                    <CalendarDays size={15} className="text-primary-600 dark:text-primary-400" />
                                    <select
                                        value={selectedSemester}
                                        onChange={(e) => handleSemesterChange(e.target.value)}
                                        className="bg-transparent border-0 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer p-0"
                                    >
                                        {semesters.map(sem => (
                                            <option key={sem.id} value={sem.id} className="dark:bg-slate-800">
                                                {sem.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Search Input */}
                            <div className="relative w-full sm:w-56 group">
                                <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl pr-10 pl-4 py-2.5 text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold placeholder:text-slate-400"
                                    placeholder="ابحث عن تقرير..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button 
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Report Design Settings Link */}
                            <Link
                                href={route('reports.design-settings')}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs text-xs font-bold transition-all shrink-0"
                                title="تخصيص هوية وترويسة وتواقيع ملفات الـ PDF"
                            >
                                <Palette size={16} className="text-primary-600 dark:text-primary-400" />
                                <span className="hidden md:inline">هوية وتصميم التقارير</span>
                            </Link>

                            {/* Report Builder Link */}
                            <Link
                                href={route('reports.custom')}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl shadow-md shadow-primary-500/20 text-xs font-bold transition-all shrink-0 active:scale-95"
                            >
                                <Settings size={16} />
                                <span>مُنشئ التقارير</span>
                            </Link>

                            {/* Guide Tour Button */}
                            <button
                                onClick={() => { setShowTour(true); setTourStep(0); }}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700/60"
                                title="دليل استخدام مركز التقارير"
                            >
                                <PlayCircle size={16} className="text-primary-500" />
                                <span className="hidden sm:inline">دليل المركز</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Smart Insights Banner */}
                {insights.length > 0 && (
                    <div className={`relative overflow-hidden rounded-2xl border ${insights[currentInsightIdx % insights.length].border} ${insights[currentInsightIdx % insights.length].bg} transition-all duration-500 shadow-sm flex items-center justify-between p-4 group`}>
                        <div className="flex items-center gap-3.5 relative z-10 w-full">
                            <div className={`w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center ${insights[currentInsightIdx % insights.length].color} shadow-sm flex-shrink-0`}>
                                {React.createElement(insights[currentInsightIdx % insights.length].icon, { size: 20, strokeWidth: 2.5 })}
                            </div>
                            
                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <Sparkles size={13} className={insights[currentInsightIdx % insights.length].color} />
                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${insights[currentInsightIdx % insights.length].color}`}>تحليلات ذكية (Insights)</span>
                                </div>
                                <p className={`text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug`}>
                                    {insights[currentInsightIdx % insights.length].text}
                                </p>
                            </div>
                            
                            {/* Carousel Controls */}
                            {insights.length > 1 && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-lg p-1 border border-white/20">
                                    <button 
                                        onClick={() => setCurrentInsightIdx(prev => prev === 0 ? insights.length - 1 : prev - 1)}
                                        className={`w-7 h-7 rounded-md flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors ${insights[currentInsightIdx % insights.length].color}`}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                    <div className="text-[11px] font-bold text-slate-500 px-1 w-7 text-center" dir="ltr">
                                        {(currentInsightIdx % insights.length) + 1}/{insights.length}
                                    </div>
                                    <button 
                                        onClick={() => setCurrentInsightIdx(prev => (prev + 1) % insights.length)}
                                        className={`w-7 h-7 rounded-md flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors ${insights[currentInsightIdx % insights.length].color}`}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Collapsible KPIs & Analytics Section (Hidden by default as requested by user) */}
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
                    {/* Toggle Header Button */}
                    <button
                        onClick={() => setShowKPIsSection(prev => !prev)}
                        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <BarChart3 size={20} />
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-black text-slate-800 dark:text-white">مؤشرات الأداء المدرسية والرسوم البيانية</h2>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                        {showKPIsSection ? 'انقر للإخفاء' : 'انقر للعرض'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                    متابعة نسبة حضور الطلاب والمعلمين، دفاتر التحضير والزيارات الصفية الحقيقية لفرعك
                                </p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500">
                            {showKPIsSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                    </button>

                    {/* Collapsible Content */}
                    {showKPIsSection && (
                        <div className="p-6 border-t border-slate-200/60 dark:border-slate-800/60 space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                
                                {/* Real Dynamic KPIs Bento (5 Columns) */}
                                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                                    
                                    {/* 1. Student Absences Card */}
                                    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-red-300 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">اليوم</span>
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{studentAbsenceCount}</div>
                                                <div className="text-[11px] font-bold text-slate-400">من أصل {totalStudents} طالب</div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="font-bold text-slate-600 dark:text-slate-400">غياب الطلاب</span>
                                                <span className={`font-black ${studentAbsenceRate > 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    نسبة الحضور {studentAttendanceRate}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-700 ${studentAbsenceRate > 10 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${studentAttendanceRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Teacher Absences Card */}
                                    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-orange-300 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                <Clock size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">اليوم</span>
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{teacherAbsenceCount}</div>
                                                <div className="text-[11px] font-bold text-slate-400">من أصل {totalTeachers} معلم</div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="font-bold text-slate-600 dark:text-slate-400">غياب المعلمين</span>
                                                <span className={`font-black ${teacherAbsenceCount > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                                    نسبة الحضور {teacherAttendanceRate}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-700 ${teacherAbsenceCount > 0 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${teacherAttendanceRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Followup Books Card */}
                                    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-primary-300 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600">
                                                <BookOpen size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">مرفوعة اليوم</span>
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{followupBooksCount}</div>
                                                <div className="text-[11px] font-bold text-slate-400">الهدف: {expectedFollowups} دفتر</div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="font-bold text-slate-600 dark:text-slate-400">دفاتر المتابعة</span>
                                                <span className="font-black text-primary-600 dark:text-primary-400">
                                                    إنجاز {followupRate}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full bg-primary-500 transition-all duration-700"
                                                    style={{ width: `${followupRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Classroom Visits Card */}
                                    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                <Eye size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">هذا الأسبوع</span>
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{classroomVisitsCount}</div>
                                                <div className="text-[11px] font-bold text-slate-400">المستهدف: {expectedVisits} زيارة</div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="font-bold text-slate-600 dark:text-slate-400">الزيارات الصفية</span>
                                                <span className="font-black text-emerald-600 dark:text-emerald-400">
                                                    إنجاز {visitRate}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                                                    style={{ width: `${visitRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Dynamic Attendance Chart with Server-Side Time Filters (7 Columns) */}
                                <div className="lg:col-span-7 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 flex flex-col justify-between">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div>
                                            <h3 className="text-base font-black text-slate-800 dark:text-white">منحنى الحضور والغياب للفرع</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">استعراض حركة غياب الطلاب والمعلمين حسب الفترة الزمنية المحددة</p>
                                        </div>
                                        
                                        {/* Accurate Time Period Buttons connected to Server */}
                                        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                                            <button 
                                                onClick={() => handleChartFilterChange('5days')} 
                                                disabled={loadingChart}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartFilter === '5days' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-primary-600'}`}
                                            >
                                                آخر 5 أيام
                                            </button>
                                            <button 
                                                onClick={() => handleChartFilterChange('week')} 
                                                disabled={loadingChart}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartFilter === 'week' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-primary-600'}`}
                                            >
                                                أسبوع (7 أيام)
                                            </button>
                                            <button 
                                                onClick={() => handleChartFilterChange('month')} 
                                                disabled={loadingChart}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartFilter === 'month' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-primary-600'}`}
                                            >
                                                شهر (30 يوماً)
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="relative w-full h-60" dir="ltr">
                                        {loadingChart && (
                                            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-10 rounded-xl">
                                                <span className="text-xs font-bold text-primary-600">جارٍ تحديث البيانات...</span>
                                            </div>
                                        )}
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} />
                                                <YAxis tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} allowDecimals={false} />
                                                <Tooltip 
                                                    contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '12px'}}
                                                    cursor={{fill: '#f1f5f9'}}
                                                />
                                                <Legend wrapperStyle={{paddingTop: '8px', fontWeight: 'bold', fontSize: '12px'}} iconType="circle" />
                                                <Bar 
                                                    dataKey="student_absences" 
                                                    name="غياب الطلاب" 
                                                    fill="#ef4444" 
                                                    radius={[4, 4, 0, 0]} 
                                                    barSize={chartFilter === 'month' ? 8 : 18} 
                                                />
                                                <Bar 
                                                    dataKey="teacher_absences" 
                                                    name="غياب المعلمين" 
                                                    fill="#f97316" 
                                                    radius={[4, 4, 0, 0]} 
                                                    barSize={chartFilter === 'month' ? 8 : 18} 
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Access Section (Pinned & Recent Reports) */}
                {(pinnedReports.length > 0 || recentReports.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pinned Reports */}
                        {pinnedReports.length > 0 && (
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                        <Pin size={16} className="fill-current" />
                                    </div>
                                    <h2 className="text-base font-black text-slate-800 dark:text-white">التقارير المثبتة المفضلة</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {pinnedReports.map((report, idx) => {
                                        const originalCategory = reportCategories.find(c => c.reports.some(r => r.name === report.name));
                                        const originalReport = originalCategory?.reports.find(r => r.name === report.name);
                                        const ReportIcon = originalReport?.icon || FileText;
                                        return (
                                        <Link
                                            key={idx}
                                            href={report.url}
                                            onClick={() => handleReportClick(report, { color: report.categoryColor })}
                                            className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 transition-all group"
                                        >
                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${report.categoryColor || 'from-slate-500 to-slate-700'} flex items-center justify-center text-white shrink-0`}>
                                                <ReportIcon size={16} />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="font-bold text-slate-800 dark:text-white truncate group-hover:text-primary-600 transition-colors text-xs">{report.name}</h4>
                                            </div>
                                            <button 
                                                onClick={(e) => togglePin(e, report, { color: report.categoryColor })}
                                                className="w-7 h-7 flex items-center justify-center text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 rounded-lg transition-colors"
                                                title="إلغاء التثبيت"
                                            >
                                                <Pin size={14} className="fill-current" />
                                            </button>
                                        </Link>
                                    )})}
                                </div>
                            </div>
                        )}

                        {/* Recent Reports */}
                        {recentReports.length > 0 && (
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Clock size={16} />
                                    </div>
                                    <h2 className="text-base font-black text-slate-800 dark:text-white">تم استعراضها مؤخراً</h2>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    {recentReports.map((report, idx) => {
                                        const originalCategory = reportCategories.find(c => c.reports.some(r => r.name === report.name));
                                        const originalReport = originalCategory?.reports.find(r => r.name === report.name);
                                        const ReportIcon = originalReport?.icon || FileText;
                                        return (
                                        <Link
                                            key={idx}
                                            href={report.url}
                                            className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 transition-all group"
                                        >
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${report.categoryColor || 'from-slate-500 to-slate-700'} flex items-center justify-center text-white shrink-0`}>
                                                <ReportIcon size={15} />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="font-bold text-slate-800 dark:text-white truncate group-hover:text-primary-600 transition-colors text-xs">{report.name}</h4>
                                                <p className="text-[11px] text-slate-500 truncate">{report.description}</p>
                                            </div>
                                            <div className="w-6 h-6 flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                                                <span className="rtl:-scale-x-100 inline-block font-black">&rarr;</span>
                                            </div>
                                        </Link>
                                    )})}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Comprehensive Categorized Reports Grid */}
                <div className="space-y-10 mt-6">
                    {reportCategories.map((category, catIdx) => {
                        const filteredReports = category.reports.filter(report => {
                            const matchesPermission = hasPermission(report.permission);
                            const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                  report.description.toLowerCase().includes(searchQuery.toLowerCase());
                            return matchesPermission && matchesSearch;
                        });
                        
                        if (filteredReports.length === 0) return null;

                        return (
                            <div key={catIdx} className="flex flex-col gap-4 relative pt-8 border-t border-slate-200/60 dark:border-slate-800/60 first:border-0 first:pt-0">
                                {/* Category Header */}
                                <div className="flex items-center gap-3.5 mb-1">
                                    <div className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br ${category.color} text-white shadow-md border border-white/10`}>
                                        <category.icon size={22} strokeWidth={2.2} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                                            {category.title}
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            تقارير معتمدة لتحليل وضبط مخرجات هذا القسم
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Category Reports Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredReports.map((report, idx) => {
                                        const isPinned = pinnedReports.some(r => r.name === report.name);
                                        return (
                                        <Link
                                            key={idx}
                                            href={report.url}
                                            onClick={() => handleReportClick(report, category)}
                                            className="group relative bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700/60 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors duration-300 relative overflow-hidden border border-slate-200/50 dark:border-slate-700">
                                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${category.color} transition-opacity duration-300`}></div>
                                                        <report.icon size={20} strokeWidth={2} className="relative z-10" />
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={(e) => togglePin(e, report, category)}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isPinned ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10'}`}
                                                            title={isPinned ? 'إلغاء التثبيت' : 'تثبيت التقرير'}
                                                        >
                                                            <Pin size={15} className={isPinned ? 'fill-current' : ''} />
                                                        </button>
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                                                            <span className="rtl:-scale-x-100 inline-block font-black text-xs">&rarr;</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    {report.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                                    {report.description}
                                                </p>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-primary-600 dark:text-primary-400">
                                                <span>فتح التقرير</span>
                                                <span className="rtl:-scale-x-100">&larr;</span>
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

            {/* Product Tour Modal */}
            {showTour && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                        {/* Header */}
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-black text-base text-slate-800 dark:text-white">دليل مركز التقارير</h3>
                            <button onClick={() => setShowTour(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-8 text-center relative overflow-hidden">
                            <div className={`mx-auto w-20 h-20 rounded-2xl ${tourSteps[tourStep].bg} ${tourSteps[tourStep].color} flex items-center justify-center mb-6 shadow-inner`}>
                                {React.createElement(tourSteps[tourStep].icon, { size: 40, strokeWidth: 1.8 })}
                            </div>
                            
                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">
                                {tourSteps[tourStep].title}
                            </h2>
                            
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                                {tourSteps[tourStep].desc}
                            </p>
                        </div>
                        
                        {/* Footer */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 flex items-center justify-between">
                            <div className="flex gap-1.5" dir="ltr">
                                {tourSteps.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all ${i === tourStep ? 'w-5 bg-primary-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700'}`}></div>
                                ))}
                            </div>
                            
                            <div className="flex gap-2">
                                {tourStep > 0 && (
                                    <button 
                                        onClick={() => setTourStep(prev => prev - 1)}
                                        className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
                                    >
                                        السابق
                                    </button>
                                )}
                                <button 
                                    onClick={nextTourStep}
                                    className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition-colors shadow-sm"
                                >
                                    {tourStep === tourSteps.length - 1 ? 'فهمت ذلك' : 'التالي'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
