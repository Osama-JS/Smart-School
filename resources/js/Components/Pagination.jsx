import React from 'react';
import { router } from '@inertiajs/react';

export default function Pagination({ data, links }) {
    // Determine the source of links. Inertia paginators pass links array inside data.links usually, 
    // but sometimes it's passed as a separate prop.
    const paginationLinks = links || data?.links;
    if (!paginationLinks) return null;

    // Use data.last_page if available to hide pagination if there's only 1 page
    if (data && data.last_page <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 w-full">
            {data && (data.from !== undefined) && (
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">
                    عرض {data.from ?? 0} إلى {data.to ?? 0} من أصل {data.total}
                </p>
            )}
            
            <div className="flex items-center gap-1.5 flex-wrap">
                {paginationLinks.map((link, i) => (
                    <button 
                        key={i} 
                        disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true, preserveState: true })}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            link.active
                                ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                : link.url
                                    ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    : 'bg-white dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800/50 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}
