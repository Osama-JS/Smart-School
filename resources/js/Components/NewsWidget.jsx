import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { Megaphone, ArrowLeft, Newspaper, Zap, Info, BellRing, Clock, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function NewsWidget({ news = [] }) {
    if (!news || news.length === 0) return null;

    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const autoPlayRef = useRef(null);
    const containerRef = useRef(null);

    // Auto-play carousel for featured news
    useEffect(() => {
        if (!isAutoPlaying || news.length <= 1) return;
        autoPlayRef.current = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % Math.min(news.length, 5));
        }, 5000);
        return () => clearInterval(autoPlayRef.current);
    }, [isAutoPlaying, news.length]);

    const pauseAutoPlay = () => {
        setIsAutoPlaying(false);
        clearInterval(autoPlayRef.current);
    };

    const resumeAutoPlay = () => {
        setIsAutoPlaying(true);
    };

    const goTo = (index) => {
        pauseAutoPlay();
        setActiveIndex(index);
        setTimeout(resumeAutoPlay, 8000);
    };

    const goNext = () => goTo((activeIndex + 1) % Math.min(news.length, 5));
    const goPrev = () => goTo((activeIndex - 1 + Math.min(news.length, 5)) % Math.min(news.length, 5));

    const getCategoryStyles = (category) => {
        switch (category) {
            case 'عاجل': return { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', lightBg: 'bg-red-50 dark:bg-red-500/10', icon: Zap, dotColor: 'bg-red-500', ringColor: 'ring-red-500/30' };
            case 'إعلان': return { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', lightBg: 'bg-amber-50 dark:bg-amber-500/10', icon: Megaphone, dotColor: 'bg-amber-500', ringColor: 'ring-amber-500/30' };
            case 'تذكير': return { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', lightBg: 'bg-blue-50 dark:bg-blue-500/10', icon: BellRing, dotColor: 'bg-blue-500', ringColor: 'ring-blue-500/30' };
            default: return { bg: 'bg-primary-500', text: 'text-primary-600 dark:text-primary-400', lightBg: 'bg-primary-50 dark:bg-primary-500/10', icon: Info, dotColor: 'bg-primary-500', ringColor: 'ring-primary-500/30' };
        }
    };

    const featured = news[activeIndex] || news[0];
    const featuredStyle = getCategoryStyles(featured?.category);
    const FeaturedIcon = featuredStyle.icon;
    const sideNews = news.slice(0, 5).filter((_, i) => i !== activeIndex);

    return (
        <div className="dash-animate-in" style={{ animationDelay: '0.08s' }}>
            <div className="relative overflow-hidden bg-white/70 dark:bg-[#121820]/70 backdrop-blur-2xl border border-slate-100/80 dark:border-slate-800/80 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500">
                {/* Top accent bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 z-30" />

                {/* Background glow */}
                <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary-400/5 dark:bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-amber-400/5 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-5 sm:px-6 pt-5 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 border border-primary-100/50 dark:border-primary-800/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <Newspaper size={20} strokeWidth={1.8} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                أحدث الأخبار والتعاميم
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            </h2>
                        </div>
                    </div>
                    <Link href={route('news.index')} className="group flex items-center gap-1.5 px-4 py-2 bg-primary-50/80 dark:bg-primary-900/15 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 dark:hover:text-white rounded-xl font-bold text-xs transition-all duration-300 border border-primary-100/50 dark:border-primary-800/30 hover:border-primary-500">
                        عرض الأرشيف
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Content: Horizontal Layout */}
                <div className="relative z-10 p-5 sm:p-6 pt-4 sm:pt-4">
                    <div className="flex flex-col lg:flex-row gap-4">

                        {/* ── Featured / Active News (Left - Large) ── */}
                        <div
                            ref={containerRef}
                            onMouseEnter={pauseAutoPlay}
                            onMouseLeave={resumeAutoPlay}
                            className="relative flex-1 lg:flex-[2] min-h-[220px] lg:min-h-[240px] rounded-2xl overflow-hidden group/featured cursor-pointer"
                        >
                            <Link href={route('news.show', featured.id)} className="absolute inset-0 z-20" />

                            {/* Featured Image / Gradient Background */}
                            {featured.image_url ? (
                                <div className="absolute inset-0">
                                    <img
                                        src={featured.image_url}
                                        alt={featured.title}
                                        className="w-full h-full object-cover group-hover/featured:scale-105 transition-transform duration-[1200ms] ease-out"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/60 to-transparent" />
                                    <div className="absolute inset-0 bg-primary-900/15 mix-blend-multiply group-hover/featured:bg-primary-900/5 transition-colors duration-700" />
                                </div>
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-[#0a0f1a]">
                                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_rgba(107,155,55,0.3)_0%,_transparent_60%)]" />
                                    {/* Decorative pattern */}
                                    <div className="absolute inset-0 opacity-[0.04]" style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23fff'/%3E%3C/svg%3E")`,
                                    }} />
                                </div>
                            )}

                            {/* Featured Content Overlay */}
                            <div className="relative z-10 flex flex-col justify-end h-full p-5 sm:p-6 text-white">
                                {/* Category Badge */}
                                <div className="flex items-center gap-2 mb-2.5">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide bg-white/15 text-white backdrop-blur-md border border-white/15 shadow-sm">
                                        <FeaturedIcon size={12} />
                                        {featured.category}
                                    </span>
                                    {featured.category === 'عاجل' && (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/90 text-white animate-pulse tracking-wider">عاجل</span>
                                    )}
                                </div>

                                {/* Title */}
                                <h3 className="text-lg sm:text-xl lg:text-[1.35rem] font-black leading-snug mb-2 line-clamp-2 drop-shadow-lg group-hover/featured:text-primary-300 transition-colors duration-300">
                                    {featured.title}
                                </h3>

                                {/* Excerpt */}
                                <p className="text-slate-300/90 text-xs font-semibold line-clamp-1 leading-relaxed mb-4 max-w-xl drop-shadow-md">
                                    {featured.excerpt}
                                </p>

                                {/* Footer */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300/80">
                                            <Clock size={13} />
                                            <span>{featured.published_at}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-white/70 group-hover/featured:text-primary-300 transition-colors">
                                        <span>اقرأ المزيد</span>
                                        <ArrowLeft size={14} className="group-hover/featured:-translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Arrows */}
                            {news.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); goNext(); }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white flex items-center justify-center opacity-0 group-hover/featured:opacity-100 transition-all duration-300 hover:bg-white/25 hover:scale-110"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); goPrev(); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white flex items-center justify-center opacity-0 group-hover/featured:opacity-100 transition-all duration-300 hover:bg-white/25 hover:scale-110"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </>
                            )}

                            {/* Dots Indicator */}
                            {news.length > 1 && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
                                    {news.slice(0, 5).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(i); }}
                                            className={`rounded-full transition-all duration-500 ${i === activeIndex
                                                ? 'w-6 h-2 bg-white shadow-sm'
                                                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Auto-play progress bar */}
                            {isAutoPlaying && news.length > 1 && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 z-30">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-400 to-primary-500"
                                        style={{
                                            animation: 'dash-progress 5s linear infinite',
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* ── Side News List (Right - Compact) ── */}
                        {sideNews.length > 0 && (
                            <div className="flex-1 lg:flex-[1] flex flex-col gap-2 min-w-0 lg:max-w-[320px]">
                                {sideNews.slice(0, 4).map((item, idx) => {
                                    const catStyle = getCategoryStyles(item.category);
                                    const CatIcon = catStyle.icon;
                                    const originalIndex = news.findIndex(n => n.id === item.id);

                                    return (
                                        <Link
                                            key={item.id}
                                            href={route('news.show', item.id)}
                                            onMouseEnter={() => { pauseAutoPlay(); setActiveIndex(originalIndex); }}
                                            onMouseLeave={resumeAutoPlay}
                                            className={`group/side relative flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${
                                                originalIndex === activeIndex
                                                    ? 'bg-primary-50/60 dark:bg-primary-900/15 border-primary-200/60 dark:border-primary-800/40 shadow-sm'
                                                    : 'bg-white/50 dark:bg-[#161f2e]/50 border-slate-100/60 dark:border-slate-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 hover:border-primary-200/40 dark:hover:border-primary-800/30'
                                            }`}
                                        >
                                            {/* Thumbnail / Icon */}
                                            {item.image_url ? (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-700/50">
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover/side:scale-110 transition-transform duration-500"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className={`w-12 h-12 rounded-lg shrink-0 ${catStyle.lightBg} border border-slate-100/30 dark:border-slate-700/30 flex items-center justify-center`}>
                                                    <CatIcon size={18} className={catStyle.text} />
                                                </div>
                                            )}

                                            {/* Text Content */}
                                            <div className="flex-1 min-w-0 py-0.5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black ${catStyle.lightBg} ${catStyle.text}`}>
                                                        <CatIcon size={9} />
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1 leading-snug group-hover/side:text-primary-600 dark:group-hover/side:text-primary-400 transition-colors mb-1">
                                                    {item.title}
                                                </h4>
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                    <Clock size={11} />
                                                    <span>{item.published_at}</span>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div className="shrink-0 self-center opacity-0 group-hover/side:opacity-100 transition-all duration-300">
                                                <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center">
                                                    <ArrowLeft size={14} className="group-hover/side:-translate-x-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress animation keyframe (injected) */}
                <style>{`
                    @keyframes dash-progress {
                        from { width: 0%; }
                        to { width: 100%; }
                    }
                `}</style>
            </div>
        </div>
    );
}
