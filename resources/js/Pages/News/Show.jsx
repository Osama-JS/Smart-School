import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    ChevronLeft, ChevronRight, Calendar, Eye, Heart, MessageSquare, 
    User, Share2, CornerUpLeft, Send, Trash2, ArrowRight, Clock, Bookmark, MoreHorizontal
} from 'lucide-react';

export default function Show({ newsItem }) {
    const { auth } = usePage().props;
    const [commentText, setCommentText] = useState('');
    const [isLiking, setIsLiking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const hasLiked = newsItem.likes?.some(like => like.user_id === auth.user.id);
    
    const hasAttachments = newsItem.attachments && newsItem.attachments.length > 0;
    const imagesList = hasAttachments ? newsItem.attachments.map(a => a.file_url) : [newsItem.image_url || '/images/default-news.jpg'];
    const activeImage = imagesList[currentImageIndex];

    // Auto-play carousel
    useEffect(() => {
        if (imagesList.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % imagesList.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [imagesList.length]);

    // Parallax effect
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLike = () => {
        setIsLiking(true);
        router.post(route('news.like', newsItem.id), {}, {
            preserveScroll: true,
            onFinish: () => setIsLiking(false)
        });
    };

    const submitComment = (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        
        setIsSubmitting(true);
        router.post(route('news.comment.store', newsItem.id), { content: commentText }, {
            preserveScroll: true,
            onSuccess: () => setCommentText(''),
            onFinish: () => setIsSubmitting(false)
        });
    };

    const deleteComment = (commentId) => {
        if (confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
            router.delete(route('news.comment.destroy', commentId), {
                preserveScroll: true
            });
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: newsItem.title,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('تم نسخ رابط الخبر!');
        }
    };

    const timeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'الآن';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `منذ ${hours} ساعة`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `منذ ${days} يوم`;
        const months = Math.floor(days / 30);
        if (months < 12) return `منذ ${months} شهر`;
        return `منذ ${Math.floor(months / 12)} سنة`;
    };

    const formattedDate = new Date(newsItem.published_at || newsItem.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <AdminLayout activeMenu="الأخبار والإعلانات">
            <Head title={newsItem.title} />

            <div className="min-h-screen pb-20">
                {/* 1. Cinematic Hero Section */}
                <div className="relative w-full h-[60vh] sm:h-[70vh] min-h-[400px] overflow-hidden rounded-b-[3rem] shadow-2xl group/hero">
                    {/* Background Image with Parallax */}
                    {imagesList.map((img, idx) => (
                        <div 
                            key={idx}
                            className={`absolute inset-0 w-full h-[120%] bg-cover bg-center transition-opacity duration-1000 ease-in-out ${currentImageIndex === idx ? 'opacity-100' : 'opacity-0'}`}
                            style={{ 
                                backgroundImage: `url(${img})`,
                                transform: `translateY(${scrollY * 0.4}px)`
                            }}
                        />
                    ))}
                    
                    {/* Elegant Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent dark:from-[#0f172a] dark:via-[#0f172a]/80 z-10" />

                    {/* Carousel Controls */}
                    {imagesList.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? imagesList.length - 1 : prev - 1); }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/20 opacity-0 group-hover/hero:opacity-100"
                            >
                                <ChevronRight size={28} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % imagesList.length); }}
                                className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/20 opacity-0 group-hover/hero:opacity-100"
                            >
                                <ChevronLeft size={28} />
                            </button>
                            <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 z-30 flex gap-2">
                                {imagesList.map((_, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`transition-all duration-300 rounded-full shadow-sm ${currentImageIndex === idx ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Navbar / Back Button over hero */}
                    <div className="absolute top-6 right-6 sm:top-10 sm:right-10 z-20">
                        <Link href={route('news.index')} className="group flex items-center justify-center w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 transition-all text-white">
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Hero Content */}
                    <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 sm:p-12 lg:p-20 max-w-[100rem] mx-auto">
                        <div className="max-w-4xl animate-in slide-in-from-bottom-8 fade-in duration-1000">
                            {/* Category & Status */}
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-black shadow-lg backdrop-blur-md border border-white/20
                                    ${newsItem.category === 'عاجل' ? 'bg-red-500/80 text-white' : 
                                      newsItem.category === 'تطوير' ? 'bg-blue-500/80 text-white' : 
                                      'bg-emerald-500/80 text-white'}`}>
                                    {newsItem.category}
                                </span>
                                <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-white/10 text-white backdrop-blur-md border border-white/10">
                                    <Clock size={14} />
                                    {timeAgo(newsItem.published_at || newsItem.created_at)}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.2] mb-6 drop-shadow-lg">
                                {newsItem.title}
                            </h1>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-6 text-white/80 font-medium text-sm sm:text-base">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-black border-2 border-white/20 shadow-lg">
                                        {newsItem.author?.name?.charAt(0) || 'م'}
                                    </div>
                                    <span className="font-bold text-white">{newsItem.author?.name || 'مدير النظام'}</span>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-white/60" />
                                    <span>{formattedDate}</span>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                <div className="flex items-center gap-2">
                                    <Eye size={18} className="text-white/60" />
                                    <span>{newsItem.views_count} قراءة</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Main Content & Sidebar Layout */}
                <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        
                        {/* Article Reading Column (Left / Center) */}
                        <div className="lg:col-span-8 xl:col-span-8 space-y-12">
                            
                            {/* Rich Text Article Body */}
                            {/* Rich Text Article Body */}
                            <article 
                                className="prose prose-lg sm:prose-xl prose-slate dark:prose-invert max-w-none 
                                    prose-headings:font-black prose-headings:text-slate-800 dark:prose-headings:text-white prose-headings:leading-tight prose-headings:tracking-tight
                                    prose-p:leading-[2.2] prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:mb-8 prose-p:text-[1.1rem]
                                    prose-a:text-primary-600 hover:prose-a:text-primary-700 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                                    prose-img:rounded-3xl prose-img:shadow-2xl prose-img:w-full prose-img:object-cover prose-img:my-10 prose-img:border prose-img:border-slate-100 dark:prose-img:border-slate-800
                                    prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-black
                                    prose-blockquote:border-r-4 prose-blockquote:border-l-0 prose-blockquote:border-primary-500 prose-blockquote:bg-gradient-to-l prose-blockquote:from-slate-50 prose-blockquote:to-white dark:prose-blockquote:from-slate-800/50 dark:prose-blockquote:to-[#121820] prose-blockquote:p-8 prose-blockquote:rounded-[2rem] prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300 prose-blockquote:italic prose-blockquote:shadow-sm
                                    prose-ul:list-inside prose-ul:space-y-3 prose-li:text-slate-600 dark:prose-li:text-slate-300
                                    bg-white dark:bg-[#121820] p-8 sm:p-12 lg:p-16 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-slate-800/80
                                    bg-[radial-gradient(#f8fafc_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]"
                                dangerouslySetInnerHTML={{ __html: newsItem.content || '' }}
                            />

                            {/* Author Bio Block */}
                            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/40 dark:to-[#121820] p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-primary-500/20 shrink-0 ring-4 ring-white dark:ring-[#121820]">
                                    {newsItem.author?.name?.charAt(0) || 'م'}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-primary-600 dark:text-primary-400 mb-1">كاتب المقال</h4>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{newsItem.author?.name || 'إدارة المدرسة'}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xl">
                                        يحرص هذا الحساب على تقديم أحدث الأخبار والتغطيات الخاصة بفعاليات المدرسة وإعلاناتها الهامة، لضمان تواصل فعال مع الطلاب وأولياء الأمور.
                                    </p>
                                </div>
                            </div>

                            {/* Floating Action Bar (Inline for Article end) */}
                            <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/10 dark:to-indigo-900/10 p-4 sm:p-6 rounded-[2rem] shadow-inner border border-primary-100/50 dark:border-primary-500/10">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 hidden sm:block">ما رأيك بهذا الخبر؟</span>
                                    <button 
                                        onClick={handleLike}
                                        disabled={isLiking}
                                        className={`group flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold transition-all text-base shadow-sm
                                            ${hasLiked 
                                                ? 'bg-rose-500 text-white shadow-rose-500/30 ring-2 ring-rose-500/50 ring-offset-2 dark:ring-offset-[#121820]' 
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30'}
                                            disabled:opacity-50`}
                                    >
                                        <Heart size={20} className={`${hasLiked ? "fill-white animate-pulse" : "group-hover:scale-110 transition-transform"}`} /> 
                                        <span>{newsItem.likes_count} إعجاب</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md tooltip" title="حفظ للرجوع إليه لاحقاً">
                                        <Bookmark size={20} />
                                    </button>
                                    <button onClick={handleShare} className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                        <Share2 size={20} /> <span>مشاركة</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar / Discussions */}
                        <div className="lg:col-span-4 xl:col-span-4 space-y-8">
                            
                            {/* Sticky Comments Panel */}
                            <div className="sticky top-24 bg-white dark:bg-[#121820] rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
                                {/* Header */}
                                <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/40 dark:to-[#121820]">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                                                <MessageSquare size={22} className="fill-white/20" />
                                            </div>
                                            النقاشات
                                        </div>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                                            {newsItem.comments_count} تعليق
                                        </span>
                                    </h3>
                                </div>

                                {/* Comments List */}
                                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:16px_16px]">
                                    {newsItem.comments?.length > 0 ? (
                                        newsItem.comments.map(comment => (
                                            <div key={comment.id} className="group flex gap-4">
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    {comment.user?.name?.charAt(0)}
                                                </div>
                                                
                                                {/* Comment Bubble */}
                                                <div className="flex-1 relative">
                                                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl rounded-tr-sm p-4 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h5 className="text-sm font-bold text-slate-800 dark:text-white">{comment.user?.name}</h5>
                                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                                                                {timeAgo(comment.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                            {comment.content}
                                                        </p>
                                                    </div>

                                                    {/* Delete Action */}
                                                    {(auth.user.id === comment.user_id || auth.user.role?.name === 'مدير النظام') && (
                                                        <button 
                                                            onClick={() => deleteComment(comment.id)}
                                                            className="absolute -right-2 -bottom-2 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 shadow-sm transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                                <MessageSquare size={24} className="text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 font-bold">لا توجد تعليقات بعد</p>
                                            <p className="text-xs text-slate-400 mt-1">كن أول من يشارك برأيه حول هذا الخبر!</p>
                                        </div>
                                    )}
                                </div>

                                {/* Add Comment Box */}
                                <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#121820]">
                                    <form onSubmit={submitComment}>
                                        <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="اكتب تعليقاً..."
                                                className="w-full bg-transparent border-none p-2 text-sm focus:ring-0 dark:text-white resize-none max-h-32 min-h-[44px] custom-scrollbar"
                                                rows="1"
                                                onInput={(e) => {
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                }}
                                            />
                                            <button 
                                                type="submit"
                                                disabled={isSubmitting || !commentText.trim()}
                                                className="shrink-0 flex items-center justify-center w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-primary-600"
                                            >
                                                <Send size={16} className="rotate-180 -ml-1" />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
            `}</style>
        </AdminLayout>
    );
}
