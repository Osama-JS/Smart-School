import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, GraduationCap, Building2, BookOpen } from 'lucide-react';
import Swal from 'sweetalert2';
import SelectInput from '@/Components/SelectInput';

export default function StudentsIndex({ students, academicYears, sections }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    // Filters
    const urlParams = new URLSearchParams(window.location.search);
    const [selectedYear, setSelectedYear] = useState(urlParams.get('academic_year_id') || '');
    const [selectedSection, setSelectedSection] = useState(urlParams.get('section_id') || '');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const query = {};
        if (debouncedSearch) query.search = debouncedSearch;
        if (selectedYear) query.academic_year_id = selectedYear;
        if (selectedSection) query.section_id = selectedSection;

        if (Object.keys(query).length > 0) {
            router.get(route('academic.students'), query, { preserveState: true, replace: true });
        } else if (window.location.search) {
            router.get(route('academic.students'), {}, { preserveState: true, replace: true });
        }
    }, [debouncedSearch, selectedYear, selectedSection]);

    const handleDelete = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "سيتم حذف الطالب وجميع سجلاته وحسابه نهائياً!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('academic.students.destroy', id), {
                    preserveScroll: true,
                });
            }
        });
    };

    return (
        <AdminLayout activeMenu="الطلاب">
            <Head title="الطلاب | النظام الأكاديمي" />

            <div className="space-y-8 animate-fade-in">
                {/* Header & Filters */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Fine abstract geometric background lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                            <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <GraduationCap size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">سجل الطلاب</h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 text-sm mt-1 font-semibold">إدارة ملفات الطلاب وسجلاتهم الأكاديمية</p>
                            </div>
                        </div>

                        <Link
                            href={route('academic.students.create')}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/30 transition-all shrink-0"
                        >
                            <Plus size={18} />
                            <span>تسجيل طالب جديد</span>
                        </Link>
                    </div>

                    {/* Filter Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                        <div className="relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="بحث باسم الطالب أو الهوية..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-10 py-2.5 text-sm outline-none transition-all dark:text-white"
                            />
                        </div>
                        
                        <div>
                            <SelectInput
                                options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                                value={selectedYear}
                                onChange={setSelectedYear}
                                placeholder="كل السنوات الدراسية"
                            />
                        </div>

                        <div>
                            <SelectInput
                                options={sections.map(s => ({ value: s.id, label: s.name }))}
                                value={selectedSection}
                                onChange={setSelectedSection}
                                placeholder="كل الأقسام والمراحل"
                            />
                        </div>
                    </div>
                </div>

                {/* Students List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.data.length > 0 ? (
                        students.data.map((student) => {
                            const enroll = student.current_enrollment;
                            
                            return (
                                <div key={student.id} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                                        <Link href={route('academic.students.edit', student.id)} className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                            <Edit size={16} />
                                        </Link>
                                        <button onClick={() => handleDelete(student.id)} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl border border-indigo-200/50 dark:border-indigo-500/20 shrink-0 shadow-inner">
                                            {student.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1 pr-12 group-hover:pr-0 transition-all">{student.user.name}</h3>
                                            <span className="text-xs text-slate-500 font-mono mt-1 block">@{student.user.username}</span>
                                        </div>
                                    </div>

                                    {/* Academic Status Widget */}
                                    <div className="mb-5 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10 flex-grow">
                                        {enroll ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                                        enroll.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                        enroll.status === 'transferred' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                                        'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                                    }`}>
                                                        {enroll.status === 'active' ? 'نشط' : enroll.status === 'transferred' ? 'منقول' : 'مسحوب/خريج'}
                                                    </span>
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{enroll.academic_year?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                    <Building2 size={16} className="text-indigo-400" />
                                                    <span className="font-medium">{enroll.division?.grade?.section?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                    <BookOpen size={16} className="text-indigo-400" />
                                                    <span>{enroll.division?.grade?.name} - {enroll.division?.name}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center">
                                                <ShieldAlert size={24} className="text-amber-400 mb-2" />
                                                <p className="text-sm font-bold text-slate-700 dark:text-white">غير مسجل حالياً</p>
                                                <p className="text-xs text-slate-500">الطالب غير مسجل في أي شعبة للسنة الحالية</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4 flex items-center justify-between mt-auto">
                                        <div className="flex gap-2">
                                            {student.user.phone && (
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 tooltip" title={student.user.phone}>
                                                    <Phone size={14} />
                                                </div>
                                            )}
                                        </div>
                                        <Link href={route('academic.students.edit', student.id)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
                                            الملف الكامل &larr;
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl">
                            <GraduationCap size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-1">لا يوجد طلاب</h3>
                            <p className="text-sm text-slate-500">لم يتم العثور على أي طلاب مطابقين لبحثك.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {students.links && students.links.length > 3 && (
                    <div className="flex justify-center mt-8">
                        <div className="flex flex-wrap gap-1 bg-white dark:bg-slate-800/50 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            {students.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        link.active 
                                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' 
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
