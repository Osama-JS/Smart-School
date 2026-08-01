import React from 'react';
import { router } from '@inertiajs/react';
import { Users, User } from 'lucide-react';

export default function ChildSelector({ children, activeChildId }) {
    if (!children || children.length === 0) return null;

    const handleChildSelect = (childId) => {
        router.get(window.location.pathname, { child_id: childId }, { preserveState: true, replace: true, preserveScroll: true });
    };

    return (
        <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Users className="text-primary-500" size={20} /> عرض البيانات للابن:
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {children.map((child) => {
                    const isActive = activeChildId === child.id;
                    return (
                        <button 
                            key={child.id}
                            onClick={() => handleChildSelect(child.id)}
                            className={`snap-center shrink-0 flex items-center gap-4 p-4 rounded-3xl border transition-all min-w-[280px] ${
                                isActive 
                                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/30 ring-4 ring-primary-500/20 transform -translate-y-1' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-300 hover:shadow-md'
                            }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                                isActive ? 'bg-primary-500 border-white/20' : 'bg-slate-100 dark:bg-slate-700 border-transparent text-slate-400'
                            }`}>
                                {child.user?.avatar ? (
                                    <img src={child.user.avatar} alt={child.user?.name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <User size={24} className={isActive ? 'text-white' : 'text-slate-400'} />
                                )}
                            </div>
                            <div className="text-right">
                                <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                    {child.user?.name || 'طالب'}
                                </h3>
                                <p className={`text-xs mt-1 ${isActive ? 'text-primary-100' : 'text-slate-500'}`}>
                                    {child.current_enrollment?.division?.grade?.name || ''} 
                                    {child.current_enrollment?.division?.name ? ` - ${child.current_enrollment.division.name}` : ''}
                                </p>
                            </div>
                            {isActive && (
                                <div className="absolute top-4 left-4 w-3 h-3 bg-white rounded-full shadow-sm animate-pulse"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
