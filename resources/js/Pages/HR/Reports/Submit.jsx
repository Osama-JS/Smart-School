import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Send, ArrowRight } from 'lucide-react';

export default function SubmitReport({ auth, template }) {
    // Dynamically generate initial state for the form
    const initialData = {};
    template.fields.forEach(field => {
        initialData[`field_${field.id}`] = field.type === 'checkbox' ? false : '';
    });

    const { data, setData, post, processing, errors } = useForm(initialData);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('reports.store', template.id));
    };

    const handleFileChange = (e, fieldId) => {
        setData(`field_${fieldId}`, e.target.files[0]);
    };

    const renderField = (field) => {
        const key = `field_${field.id}`;
        const error = errors[key];

        let inputElement = null;

        switch (field.type) {
            case 'text':
                inputElement = (
                    <textarea 
                        value={data[key]}
                        onChange={e => setData(key, e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        rows="3"
                        required={field.is_required}
                    ></textarea>
                );
                break;
            case 'number':
                inputElement = (
                    <input 
                        type="number"
                        value={data[key]}
                        onChange={e => setData(key, e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        required={field.is_required}
                    />
                );
                break;
            case 'select':
                inputElement = (
                    <select 
                        value={data[key]}
                        onChange={e => setData(key, e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        required={field.is_required}
                    >
                        <option value="">اختر...</option>
                        {field.options && field.options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
                break;
            case 'checkbox':
                inputElement = (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                        <input 
                            type="checkbox"
                            id={key}
                            checked={data[key]}
                            onChange={e => setData(key, e.target.checked)}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-5 h-5 cursor-pointer"
                        />
                        <label htmlFor={key} className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            نعم / أوافق
                        </label>
                    </div>
                );
                break;
            case 'image':
                inputElement = (
                    <input 
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileChange(e, field.id)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        required={field.is_required}
                    />
                );
                break;
            default:
                inputElement = <input type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3" />;
        }

        return (
            <div key={field.id} className="mb-6">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {field.name}
                    {field.is_required && <span className="text-red-500 mr-1">*</span>}
                </label>
                {inputElement}
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
        );
    };

    return (
        <AdminLayout activeMenu="التقارير">
            <Head title={`تقديم تقرير: ${template.name}`} />

            <div className="py-12" style={{ direction: 'rtl' }}>
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="mb-6 flex items-center gap-4">
                        <Link href={route('reports.index')} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowRight size={24} />
                        </Link>
                        <h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 leading-tight">
                            تقديم تقرير: {template.name}
                        </h2>
                    </div>
                    
                    <div className="bg-white dark:bg-[#121820] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8">
                            {template.description && (
                                <div className="mb-8 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/50 text-primary-700 dark:text-primary-300 text-sm leading-relaxed">
                                    {template.description}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {template.fields.map(field => renderField(field))}

                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Send size={20} />
                                        إرسال التقرير
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
