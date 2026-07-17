import React from 'react';
import { usePage, Link } from '@inertiajs/react';
import { Megaphone } from 'lucide-react';

export default function NewsTicker() {
    const { urgent_news } = usePage().props;

    if (!urgent_news || urgent_news.length === 0) return null;

    return (
        <div className="bg-rose-50 dark:bg-rose-500/10 border-b border-rose-100 dark:border-rose-500/20 px-4 py-2 flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold shrink-0 z-10 bg-rose-50 dark:bg-slate-900 pr-2 pl-4 border-l border-rose-200 dark:border-rose-500/20">
                <Megaphone size={16} className="animate-pulse" />
                <span className="text-sm">أخبار عاجلة</span>
            </div>
            
            <div className="flex-1 overflow-hidden relative h-6">
                <div className="absolute whitespace-nowrap animate-[marquee_25s_linear_infinite] flex items-center h-full">
                    {urgent_news.map((news, index) => (
                        <React.Fragment key={news.id}>
                            <Link 
                                href={route('news.index')} 
                                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors mx-8 inline-flex items-center"
                            >
                                <span className="w-2 h-2 rounded-full bg-rose-500 ml-2"></span>
                                {news.title}
                            </Link>
                        </React.Fragment>
                    ))}
                    {/* Duplicate for seamless infinite loop */}
                    {urgent_news.map((news, index) => (
                        <React.Fragment key={`dup-${news.id}`}>
                            <Link 
                                href={route('news.index')} 
                                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors mx-8 inline-flex items-center"
                            >
                                <span className="w-2 h-2 rounded-full bg-rose-500 ml-2"></span>
                                {news.title}
                            </Link>
                        </React.Fragment>
                    ))}
                </div>
            </div>
            
        </div>
    );
}
