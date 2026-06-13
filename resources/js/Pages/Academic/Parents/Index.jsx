import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, MapPin, UserCheck, Shield } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ParentsIndex({ parents }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (debouncedSearch !== '') {
            router.get(route('academic.parents'), { search: debouncedSearch }, { preserveState: true, replace: true });
        } else if (debouncedSearch === '' && window.location.search.includes('search')) {
            router.get(route('academic.parents'), {}, { preserveState: true, replace: true });
        }
    }, [debouncedSearch]);

    const handleDelete = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من التراجع عن هذا الإجراء! سيتم حذف حساب ولي الأمر نهائياً.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('academic.parents.destroy', id), {
                    preserveScroll: true,
                });
            }
        });
    };

    return (
        <AdminLayout activeMenu="أولياء الأمور">
            <Head title="أولياء الأمور | النظام الأكاديمي" />

            <div className="space-y-8 animate-fade-in">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-inner">
                                <Users size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">أولياء الأمور</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">إدارة حسابات وبيانات أولياء أمور الطلاب</p>
                            </div>
                        </div>

                        <div className="flex w-full md:w-auto items-center gap-3">
                            <div className="relative flex-1 md:w-64 group">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="بحث بالاسم، الهوية، الجوال..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl px-10 py-2.5 text-sm outline-none transition-all dark:text-white"
                                />
                            </div>
                            <Link
                                href={route('academic.parents.create')}
                                className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 shrink-0"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:block">إضافة ولي أمر</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Parents List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {parents.data.length > 0 ? (
                        parents.data.map((parent) => (
                            <div key={parent.id} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <Link href={route('academic.parents.edit', parent.id)} className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                        <Edit size={16} />
                                    </Link>
                                    <button onClick={() => handleDelete(parent.id)} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/40 dark:to-indigo-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl border border-primary-200/50 dark:border-primary-500/20 shrink-0 shadow-inner">
                                        {parent.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1 pr-12 group-hover:pr-0 transition-all">{parent.name}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                            <Shield size={12} className={parent.is_active ? 'text-emerald-500' : 'text-rose-500'} />
                                            <span className={parent.is_active ? 'text-emerald-600' : 'text-rose-600'}>
                                                {parent.is_active ? 'حساب نشط' : 'حساب معطل'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-5 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-6 flex justify-center text-slate-400"><Phone size={16} /></div>
                                        <span className="text-slate-700 dark:text-slate-300" dir="ltr">{parent.phone || 'غير مسجل'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-6 flex justify-center text-slate-400"><UserCheck size={16} /></div>
                                        <span className="text-slate-700 dark:text-slate-300">{parent.username}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-6 flex justify-center text-slate-400"><MapPin size={16} /></div>
                                        <span className="text-slate-700 dark:text-slate-300 truncate">{parent.address || 'غير مسجل'}</span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4">
                                    <p className="text-xs font-bold text-slate-400 mb-2">الأبناء المسجلين ({parent.children?.length || 0})</p>
                                    {parent.children && parent.children.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {parent.children.map(child => (
                                                <span key={child.id} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20">
                                                    {child.user?.name.split(' ')[0]} ({child.pivot.relationship_type})
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 italic">لا يوجد أبناء مسجلين باسمه</p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl">
                            <Users size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-1">لا يوجد أولياء أمور</h3>
                            <p className="text-sm text-slate-500">لم يتم العثور على نتائج تطابق بحثك.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {parents.links && parents.links.length > 3 && (
                    <div className="flex justify-center mt-8">
                        <div className="flex flex-wrap gap-1 bg-white dark:bg-slate-800/50 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            {parents.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        link.active 
                                            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30' 
                                            : !link.url 
                                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
