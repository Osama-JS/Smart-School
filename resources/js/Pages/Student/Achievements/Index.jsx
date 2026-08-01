import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Trophy, Medal, Star, Crown, Zap, Target, 
    Flame, Award, Gift, Sparkles, ChevronLeft 
} from 'lucide-react';
import ChildSelector from '@/Components/ChildSelector';

export default function StudentAchievements({ auth, achievements, groupedAchievements, stats, children, activeChildId }) {
    
    // Category icons mapped to a specific icon
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'academic': return <Crown size={24} className="text-amber-500" />;
            case 'behavioral': return <Star size={24} className="text-primary-500" />;
            case 'activity': return <Target size={24} className="text-blue-500" />;
            case 'sports': return <Zap size={24} className="text-orange-500" />;
            default: return <Medal size={24} className="text-emerald-500" />;
        }
    };

    const getCategoryName = (category) => {
        switch (category) {
            case 'academic': return 'التميز الأكاديمي';
            case 'behavioral': return 'الانضباط والسلوك';
            case 'activity': return 'الأنشطة والمشاركات';
            case 'sports': return 'الرياضة واللياقة';
            default: return 'إنجازات أخرى';
        }
    };

    return (
        <AdminLayout user={auth.user} activeMenu="سجل الإنجازات">
            <Head title="سجل الإنجازات" />

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 animate-fade-in pb-20">
                <ChildSelector children={children} activeChildId={activeChildId} />

                {/* Header Section */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820]/95 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 mb-10 shadow-sm group">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-primary-500 to-primary-600" />
                    
                    {/* Decorative elements */}
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700/50 shadow-inner relative overflow-hidden">
                                <Sparkles className="absolute top-2 right-2 text-amber-500 opacity-50" size={16} />
                                <Trophy size={40} className="text-amber-600 dark:text-amber-400 drop-shadow-sm" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-2">سجل إنجازاتي</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 text-lg">
                                    أوسمة، نقاط، ونجاحات تميزك عن غيرك! 🚀
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                            <div className="text-center px-4 border-l border-slate-200 dark:border-slate-700">
                                <p className="text-sm font-bold text-slate-500 mb-1">النقاط الكلية</p>
                                <div className="flex items-center justify-center gap-2">
                                    <Flame size={24} className="text-amber-500" />
                                    <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalPoints}</span>
                                </div>
                            </div>
                            <div className="text-center px-4">
                                <p className="text-sm font-bold text-slate-500 mb-1">الأوسمة المكتسبة</p>
                                <div className="flex items-center justify-center gap-2">
                                    <Award size={24} className="text-primary-500" />
                                    <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Achievements List grouped by Category */}
                {achievements.length > 0 ? (
                    <div className="space-y-12">
                        {Object.entries(groupedAchievements).map(([category, items]) => (
                            <div key={category} className="animate-slide-up">
                                <div className="flex items-center gap-3 mb-6 px-2">
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                                        {getCategoryIcon(category)}
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                                        {getCategoryName(category)}
                                    </h2>
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-3 py-1 rounded-full text-sm">
                                        {items.length} إنجازات
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {items.map((achievement) => (
                                        <div key={achievement.id} className="bg-white dark:bg-[#1e293b] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
                                            
                                            {/* Decorative Background Element */}
                                            <div className="absolute -left-10 -top-10 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                                                <Trophy size={160} />
                                            </div>

                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center border border-primary-200 dark:border-primary-700/50 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                    {getCategoryIcon(category)}
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/50 font-black shadow-sm">
                                                    <Flame size={16} />
                                                    +{achievement.points} نقطة
                                                </div>
                                            </div>
                                            
                                            <div className="relative z-10">
                                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 leading-tight">
                                                    {achievement.title}
                                                </h3>
                                                {achievement.description && (
                                                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-5 h-10">
                                                        {achievement.description}
                                                    </p>
                                                )}
                                                
                                                <hr className="border-slate-100 dark:border-slate-800 mb-4" />
                                                
                                                <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500">
                                                    <span className="flex items-center gap-1.5">
                                                        <Gift size={14} />
                                                        مُنحت بواسطة: {achievement.awarded_by}
                                                    </span>
                                                    <span>{achievement.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white dark:bg-[#1e293b] rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-24 h-24 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 relative">
                            <Star size={40} className="text-slate-300 dark:text-slate-600" />
                            <Sparkles size={20} className="absolute -top-2 -right-2 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-700 dark:text-slate-300 mb-3">لا توجد إنجازات بعد!</h3>
                        <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
                            ابدأ رحلة التفوق والمشاركة في الأنشطة المدرسية لتحصل على أوسمة ونقاط تميز حسابك.
                        </p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
