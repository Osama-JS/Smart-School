import React from 'react';
import { Link } from '@inertiajs/react';
import { Megaphone, Calendar, ArrowLeft, Newspaper } from 'lucide-react';

export default function NewsWidget({ news = [] }) {
    if (!news || news.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-l from-primary-50/50 to-transparent dark:from-primary-900/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <Newspaper size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white">أحدث الأخبار والإعلانات</h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ابقَ على اطلاع دائم بما يجري</p>
                    </div>
                </div>
                <Link href={route('news.index')} className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors group">
                    عرض الكل
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                </Link>
            </div>
            
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {news.map((item, index) => (
                        <Link 
                            key={item.id} 
                            href={route('news.show', item.id)}
                            className="group block bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700/50 hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Image Header */}
                            <div className="h-32 w-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                                {item.image_url ? (
                                    <img 
                                        src={item.image_url} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
                                        <Megaphone size={32} className="text-primary-300 dark:text-primary-600/50" />
                                    </div>
                                )}
                                
                                {/* Category Badge */}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md ${
                                        item.category === 'عاجل' ? 'bg-rose-500/90 text-white' : 
                                        item.category === 'إعلان' ? 'bg-amber-500/90 text-white' : 
                                        'bg-white/90 text-slate-700 dark:bg-slate-800/90 dark:text-white'
                                    }`}>
                                        {item.category}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                                    {item.title}
                                </h3>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                                    {item.excerpt}
                                </div>
                                
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                        <Calendar size={14} />
                                        <span>{item.published_at}</span>
                                    </div>
                                    <span className="text-primary-600 dark:text-primary-400 font-black text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                                        اقرأ المزيد
                                        <span className="text-[10px]">←</span>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 sm:hidden">
                 <Link href={route('news.index')} className="flex items-center justify-center gap-2 text-sm font-bold text-primary-600 dark:text-primary-400 w-full">
                    عرض جميع الأخبار
                    <ArrowLeft size={16} />
                </Link>
            </div>
        </div>
    );
}
