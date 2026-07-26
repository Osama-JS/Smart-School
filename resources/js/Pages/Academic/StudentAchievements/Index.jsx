import React, { useState, useMemo } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import { Plus, Edit2, Trash2, CheckCircle, AlertTriangle, Search, X, Award, Medal, Star, Trophy, Target, ChevronDown, RotateCcw, Calendar, Filter, SlidersHorizontal, Brain, Heart, User, AlignLeft, Shield, Printer } from 'lucide-react';

export default function StudentAchievements({ achievements = [], students = [], grades = [], leaderboard = [], achievementTypes = [], activeYearId }) {
    const { logo_url } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingAchievement, setEditingAchievement] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    
    // Filters
    const [dateRange, setDateRange] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    const { data, setData, post, put, delete: destroy, reset, processing, errors, clearErrors } = useForm({
        student_id: '',
        student_achievement_type_id: '',
        description: '',
        points: 0,
        date_awarded: new Date().toISOString().split('T')[0],
    });

    const openModal = (achievement = null) => {
        clearErrors();
        if (achievement) {
            setEditingAchievement(achievement);
            setData({
                student_id: achievement.student_id,
                student_achievement_type_id: achievement.student_achievement_type_id,
                description: achievement.description || '',
                points: achievement.points,
                date_awarded: achievement.date_awarded,
            });
        } else {
            setEditingAchievement(null);
            reset();
            setData('date_awarded', new Date().toISOString().split('T')[0]);
        }
        setIsModalOpen(true);
    };

    const handleTypeChange = (e) => {
        const typeId = e.target.value;
        setData('student_achievement_type_id', typeId);
        
        if (typeId) {
            const selectedType = achievementTypes.find(t => t.id == typeId);
            if (selectedType) {
                setData(data => ({ ...data, points: selectedType.default_points }));
            }
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingAchievement) {
            put(route('academic.achievements.update', editingAchievement.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('academic.achievements.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const confirmDelete = (achievement) => {
        setEditingAchievement(achievement);
        setIsDeleteModalOpen(true);
    };

    const deleteAchievement = () => {
        destroy(route('academic.achievements.destroy', editingAchievement.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'أكاديمي': return <Target className="text-blue-500" size={20} />;
            case 'رياضي': return <Trophy className="text-orange-500" size={20} />;
            case 'ديني': return <Star className="text-green-500" size={20} />;
            case 'سلوكي': return <Award className="text-purple-500" size={20} />;
            default: return <Medal className="text-slate-500" size={20} />;
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'أكاديمي': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'رياضي': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'ديني': return 'bg-green-50 text-green-700 border-green-200';
            case 'سلوكي': return 'bg-purple-50 text-purple-700 border-purple-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    // Filter Logic
    const filteredAchievements = useMemo(() => {
        return achievements.filter(ach => {
            const title = ach.type?.name || '';
            const category = ach.type?.category || '';
            
            const matchesSearch = ach.student?.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  title.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = selectedCategory ? category === selectedCategory : true;

            let matchesDate = true;
            if (dateRange.length === 2) {
                const start = dateRange[0].getTime();
                const end = dateRange[1].getTime();
                const achDate = new Date(ach.date_awarded).getTime();
                matchesDate = achDate >= start && achDate <= end;
            }

            return matchesSearch && matchesCategory && matchesDate;
        });
    }, [achievements, searchQuery, selectedCategory, dateRange]);

    const getBadgeIcon = (iconName) => {
        switch (iconName) {
            case 'Brain': return <Brain size={14} />;
            case 'Star': return <Star size={14} />;
            case 'Trophy': return <Trophy size={14} />;
            case 'Heart': return <Heart size={14} />;
            default: return <Award size={14} />;
        }
    };

    return (
        <AdminLayout>
            <Head title="إنجازات الطلاب" />

            {/* Premium Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                        <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                        <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                    </svg>
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            <Trophy size={28} className="text-primary-600" />
                            إنجازات الطلاب
                        </h1>
                        <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                            تحفيز وتوثيق التفوق والإبداع لطلاب المدرسة
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                        >
                            <Plus size={18} />
                            <span>تسجيل إنجاز جديد</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Leaderboard Podium (Top 3) */}
            {leaderboard && leaderboard.length > 0 && (
                <div className="mb-8 bg-gradient-to-br from-slate-900 to-[#121820] rounded-[2.5rem] p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/img/grid.svg')] opacity-10"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <h2 className="text-2xl font-black text-white mb-10 flex items-center gap-3">
                            <Star className="text-primary-400 fill-primary-400" size={28} />
                            لوحة الشرف لأفضل الطلاب (فرسان الميدان)
                            <Star className="text-primary-400 fill-primary-400" size={28} />
                        </h2>

                        <div className="flex flex-row items-end justify-center gap-4 sm:gap-8 h-48 w-full max-w-2xl mx-auto">
                            {/* Second Place (Index 1) */}
                            {leaderboard[1] && (
                                <div className="flex flex-col items-center justify-end h-40 animate-fade-in-up" style={{animationDelay: '100ms'}}>
                                    <div className="text-center mb-2">
                                        <div className="text-white font-bold text-sm sm:text-base max-w-[100px] truncate">{leaderboard[1].student_name}</div>
                                        {leaderboard[1].tier && (
                                            <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${leaderboard[1].tier.color_class}`}>
                                                <span className="text-xs">{leaderboard[1].tier.icon}</span>
                                                {leaderboard[1].tier.name}
                                            </div>
                                        )}
                                        <div className="text-slate-400 text-xs mt-1">{leaderboard[1].total_points} نقطة</div>
                                        
                                        {/* Badges Display for 2nd */}
                                        {leaderboard[1].badges && leaderboard[1].badges.length > 0 && (
                                            <div className="flex justify-center gap-1 mt-2 flex-wrap max-w-[120px]">
                                                {leaderboard[1].badges.map((badge, bIndex) => (
                                                    <div key={bIndex} className={`w-5 h-5 rounded-full flex items-center justify-center ${badge.bg} ${badge.color} shadow-sm`} title={badge.description}>
                                                        {getBadgeIcon(badge.icon)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-2 flex justify-center">
                                            <a href={route('academic.achievements.certificate', leaderboard[1].student_id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors border border-white/10 shadow-sm" title="طباعة شهادة التميز">
                                                <Printer size={12} />
                                                <span className="text-[10px] font-bold">الشهادة</span>
                                            </a>
                                        </div>
                                    </div>
                                    <div className="w-20 sm:w-28 bg-slate-300 rounded-t-lg h-32 relative flex justify-center shadow-[0_0_30px_rgba(203,213,225,0.2)]">
                                        <div className="absolute -top-6 bg-slate-300 text-slate-800 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-lg border-2 border-white">2</div>
                                    </div>
                                </div>
                            )}

                            {/* First Place (Index 0) */}
                            {leaderboard[0] && (
                                <div className="flex flex-col items-center justify-end h-48 animate-fade-in-up z-10" style={{animationDelay: '0ms'}}>
                                    <div className="text-center mb-3">
                                        <div className="text-primary-400 mb-1 animate-bounce flex justify-center"><Trophy size={24} className="fill-primary-400" /></div>
                                        <div className="text-white font-black text-sm sm:text-lg max-w-[120px] truncate">{leaderboard[0].student_name}</div>
                                        {leaderboard[0].tier && (
                                            <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${leaderboard[0].tier.color_class}`}>
                                                <span className="text-xs">{leaderboard[0].tier.icon}</span>
                                                {leaderboard[0].tier.name}
                                            </div>
                                        )}
                                        <div className="text-primary-300 text-xs font-bold mt-1 bg-primary-500/20 px-2 py-0.5 rounded-full">{leaderboard[0].total_points} نقطة</div>

                                        {/* Badges Display for 1st */}
                                        {leaderboard[0].badges && leaderboard[0].badges.length > 0 && (
                                            <div className="flex justify-center gap-1 mt-2 flex-wrap max-w-[120px]">
                                                {leaderboard[0].badges.map((badge, bIndex) => (
                                                    <div key={bIndex} className={`w-6 h-6 rounded-full flex items-center justify-center ${badge.bg} ${badge.color} shadow-sm border border-white/20`} title={badge.description}>
                                                        {getBadgeIcon(badge.icon)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-2 flex justify-center">
                                            <a href={route('academic.achievements.certificate', leaderboard[0].student_id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-yellow-50 rounded-xl text-primary-700 transition-colors shadow-md border-b-2 border-primary-200" title="طباعة شهادة التميز">
                                                <Printer size={14} />
                                                <span className="text-xs font-black">الشهادة</span>
                                            </a>
                                        </div>
                                    </div>
                                    <div className="w-24 sm:w-32 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg h-40 relative flex justify-center shadow-[0_0_40px_rgba(251,191,36,0.4)]">
                                        <div className="absolute -top-6 bg-primary-400 text-primary-900 w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl shadow-xl border-4 border-slate-900">1</div>
                                    </div>
                                </div>
                            )}

                            {/* Third Place (Index 2) */}
                            {leaderboard[2] && (
                                <div className="flex flex-col items-center justify-end h-36 animate-fade-in-up" style={{animationDelay: '200ms'}}>
                                    <div className="text-center mb-2">
                                        <div className="text-white font-bold text-sm sm:text-base max-w-[100px] truncate">{leaderboard[2].student_name}</div>
                                        {leaderboard[2].tier && (
                                            <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${leaderboard[2].tier.color_class}`}>
                                                <span className="text-xs">{leaderboard[2].tier.icon}</span>
                                                {leaderboard[2].tier.name}
                                            </div>
                                        )}
                                        <div className="text-slate-400 text-xs mt-1">{leaderboard[2].total_points} نقطة</div>

                                        {/* Badges Display for 3rd */}
                                        {leaderboard[2].badges && leaderboard[2].badges.length > 0 && (
                                            <div className="flex justify-center gap-1 mt-2 flex-wrap max-w-[120px]">
                                                {leaderboard[2].badges.map((badge, bIndex) => (
                                                    <div key={bIndex} className={`w-5 h-5 rounded-full flex items-center justify-center ${badge.bg} ${badge.color} shadow-sm`} title={badge.description}>
                                                        {getBadgeIcon(badge.icon)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-2 flex justify-center">
                                            <a href={route('academic.achievements.certificate', leaderboard[2].student_id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors border border-white/10 shadow-sm" title="طباعة شهادة التميز">
                                                <Printer size={12} />
                                                <span className="text-[10px] font-bold">الشهادة</span>
                                            </a>
                                        </div>
                                    </div>
                                    <div className="w-20 sm:w-28 bg-primary-700/80 rounded-t-lg h-28 relative flex justify-center shadow-[0_0_30px_rgba(180,83,9,0.3)]">
                                        <div className="absolute -top-5 bg-primary-700 text-primary-100 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-lg border-2 border-slate-900">3</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar & Filters */}
            <div className="bg-white dark:bg-[#121820]/60 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="ابحث باسم الطالب أو الإنجاز..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-11 pl-4 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-white transition-all outline-none"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>

                    <button
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                            (dateRange.length > 0 || selectedCategory)
                                ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/30 text-primary-600 dark:text-primary-400'
                                : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                        <SlidersHorizontal size={18} />
                        تصفية متقدمة
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Inline Filters Panel */}
            {isFiltersOpen && (
                <div className="bg-white dark:bg-[#121820]/80 p-6 rounded-3xl border border-primary-100 dark:border-primary-500/20 shadow-md shadow-primary-500/5 animate-slide-down mb-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Filter className="text-primary-500" size={20} />
                            تخصيص بحث الإنجازات
                        </h3>
                        <button
                            onClick={() => {
                                setDateRange([]);
                                setSelectedCategory('');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                        >
                            <RotateCcw size={14} /> إعادة ضبط
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Date Range */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">النطاق الزمني</label>
                            <div className="relative">
                                <Flatpickr
                                    options={{ mode: "range", dateFormat: "Y-m-d", locale: "ar" }}
                                    value={dateRange}
                                    onChange={(date) => setDateRange(date)}
                                    placeholder="من تاريخ - إلى تاريخ"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-white transition-all outline-none"
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">فئة الإنجاز</label>
                            <div className="relative">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 pl-8 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-white transition-all outline-none appearance-none"
                                >
                                    <option value="">جميع الفئات</option>
                                    <option value="أكاديمي">أكاديمي 📚</option>
                                    <option value="رياضي">رياضي ⚽</option>
                                    <option value="ديني">ديني 🕌</option>
                                    <option value="سلوكي">سلوكي 🌟</option>
                                    <option value="أخرى">أخرى ✨</option>
                                </select>
                                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الطالب</th>
                                <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">تفاصيل الإنجاز</th>
                                <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">النقاط المكتسبة</th>
                                <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">تاريخ الإنجاز</th>
                                <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 text-left w-24">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredAchievements.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-500 font-bold">
                                        لا توجد إنجازات مسجلة للطلاب
                                    </td>
                                </tr>
                            ) : (
                                filteredAchievements.map(achievement => (
                                    <tr key={achievement.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold">
                                                    {achievement.student?.user?.name?.charAt(0) || '-'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white">{achievement.student?.user?.name}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">بواسطة: {achievement.awarded_by?.name || 'الإدارة'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${getCategoryColor(achievement.type?.category)}`}>
                                                    {getCategoryIcon(achievement.type?.category)} {achievement.type?.category}
                                                </span>
                                                <span className="font-bold text-slate-800 dark:text-white">{achievement.type?.name}</span>
                                            </div>
                                            {achievement.description && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{achievement.description}</p>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-black border border-primary-200 dark:border-primary-500/20">
                                                <Star size={16} className="fill-primary-500 text-primary-500" />
                                                +{achievement.points}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                            {achievement.date_awarded}
                                        </td>
                                        <td className="py-4 px-6 text-left">
                                            <div className="flex items-center justify-end gap-2">
                                                <a href={route('academic.achievements.certificate', achievement.student_id)} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="طباعة شهادة التميز">
                                                    <Printer size={18} />
                                                </a>
                                                <button onClick={() => openModal(achievement)} className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => confirmDelete(achievement)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col my-auto transform transition-all">
                        
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        {editingAchievement ? 'تعديل الإنجاز' : 'تسجيل إنجاز جديد'}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">تعبئة نموذج الإنجاز للطالب</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 rounded-2xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto max-h-[70vh]">
                            <form id="achievementForm" onSubmit={submit} className="space-y-6">
                                
                                {!editingAchievement && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الطالب المتميز <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                value={data.student_id}
                                                onChange={e => setData('student_id', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pr-12 pl-5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white outline-none appearance-none transition-all"
                                                required
                                            >
                                                <option value="">-- اختر الطالب --</option>
                                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                                <User size={16} />
                                            </div>
                                        </div>
                                        {errors.student_id && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.student_id}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع الإنجاز <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={data.student_achievement_type_id}
                                            onChange={handleTypeChange}
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pr-12 pl-5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white outline-none appearance-none transition-all"
                                            required
                                        >
                                            <option value="">-- اختر الإنجاز --</option>
                                            {achievementTypes.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    [{t.category}] {t.name} (النقاط: {t.default_points})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                            <Target size={16} />
                                        </div>
                                    </div>
                                    {errors.student_achievement_type_id && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.student_achievement_type_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تفاصيل الإنجاز (اختياري)</label>
                                    <div className="relative">
                                        <textarea
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            rows="3"
                                            placeholder="اكتب وصفاً مختصراً للإنجاز ليوثق في سجل الطالب..."
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pr-12 pl-5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white outline-none transition-all"
                                        ></textarea>
                                        <div className="pointer-events-none absolute top-4 right-0 flex items-center pr-4 text-slate-400">
                                            <AlignLeft size={16} />
                                        </div>
                                    </div>
                                    {errors.description && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.description}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">النقاط المستحقة <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                value={data.points}
                                                onChange={e => setData('points', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-primary-200 dark:border-primary-700/50 rounded-2xl py-3.5 pr-12 pl-5 text-lg font-black focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-primary-600 dark:text-primary-400 outline-none transition-all"
                                                required
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-primary-500">
                                                <Star className="fill-primary-500" size={18} />
                                            </div>
                                        </div>
                                        {errors.points && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.points}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ الحصول على الإنجاز <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={data.date_awarded}
                                                onChange={e => setData('date_awarded', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pr-12 pl-5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white outline-none transition-all"
                                                required
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                                <Calendar size={16} />
                                            </div>
                                        </div>
                                        {errors.date_awarded && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.date_awarded}</p>}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                            <button onClick={() => setIsModalOpen(false)} type="button" className="px-6 py-3.5 font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                إلغاء
                            </button>
                            <button form="achievementForm" disabled={processing} type="submit" className="px-8 py-3.5 font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl shadow-lg shadow-primary-500/25 transition-transform active:scale-95 disabled:opacity-70 flex items-center gap-2">
                                <CheckCircle size={18} /> {editingAchievement ? 'حفظ التعديلات' : 'اعتماد الإنجاز'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800 my-auto transform transition-all">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 relative">
                            <Trash2 size={32} className="relative z-10" />
                            <div className="absolute inset-0 bg-rose-500 opacity-20 rounded-[1.5rem] blur-xl animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">حذف الإنجاز</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 font-semibold text-sm">
                            هل أنت متأكد من حذف هذا الإنجاز؟ سيتم سحب النقاط من رصيد الطالب ولن يظهر في لوحة الشرف.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                تراجع
                            </button>
                            <button onClick={deleteAchievement} disabled={processing} className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/25 transition-transform active:scale-95">
                                نعم، احذف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
