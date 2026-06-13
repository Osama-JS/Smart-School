import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle, AlertTriangle, Info, X, XCircle } from 'lucide-react';

export default function ToastNotification() {
    const { flash, errors } = usePage().props;
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        // Handle Flash Success
        if (flash?.success) {
            addToast('success', flash.success);
        }
        
        // Handle Flash Error
        if (flash?.error) {
            addToast('error', flash.error);
        }

        // Handle Validation Errors
        if (errors && Object.keys(errors).length > 0) {
            const firstError = Object.values(errors)[0];
            addToast('error', firstError);
        }
    }, [flash, errors]);

    const addToast = (type, message) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { id, type, message };
        
        // Avoid duplicate messages
        setToasts(prev => {
            if (prev.some(t => t.message === message && t.type === type)) {
                return prev;
            }
            return [...prev, newToast];
        });

        // Auto remove success messages after 8 seconds
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                removeToast(id);
            }, 8000);
        }
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 items-center pointer-events-none w-full max-w-sm px-4">
            {toasts.map((toast) => (
                <div 
                    key={toast.id}
                    className={`
                        pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md animate-slide-up transition-all
                        ${toast.type === 'success' 
                            ? 'bg-emerald-50/95 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-100' 
                            : toast.type === 'error'
                            ? 'bg-rose-50/95 dark:bg-rose-900/90 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-100'
                            : 'bg-blue-50/95 dark:bg-blue-900/90 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-100'
                        }
                    `}
                    role="alert"
                >
                    <div className="shrink-0 mt-0.5">
                        {toast.type === 'success' && <CheckCircle size={22} className="text-emerald-500 dark:text-emerald-400" />}
                        {toast.type === 'error' && <XCircle size={22} className="text-rose-500 dark:text-rose-400" />}
                        {toast.type === 'info' && <Info size={22} className="text-blue-500 dark:text-blue-400" />}
                    </div>
                    
                    <div className="flex-1 font-bold text-[15px] leading-tight pt-0.5">
                        {toast.message}
                    </div>

                    <button 
                        onClick={() => removeToast(toast.id)}
                        className={`
                            shrink-0 p-1.5 rounded-xl transition-colors
                            ${toast.type === 'success' ? 'hover:bg-emerald-100 dark:hover:bg-emerald-800 text-emerald-600 dark:text-emerald-400' : ''}
                            ${toast.type === 'error' ? 'hover:bg-rose-100 dark:hover:bg-rose-800 text-rose-600 dark:text-rose-400' : ''}
                            ${toast.type === 'info' ? 'hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400' : ''}
                        `}
                    >
                        <X size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
}
