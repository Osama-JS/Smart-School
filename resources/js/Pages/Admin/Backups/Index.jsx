import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Database, Download, Trash2, PlusCircle, Clock, FileText,
    CheckCircle2, AlertTriangle, Shield, HardDrive, Calendar,
    RotateCcw, Archive, Layers, Info, Search, ChevronDown,
    ChevronUp, X, RefreshCw, ServerCrash
} from 'lucide-react';
import Swal from 'sweetalert2';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';

export default function BackupsIndex({ backups = [], stats = {} }) {
    const { post, processing } = useForm();

    const [isGenerating, setIsGenerating]     = useState(false);
    const [deletingFile, setDeletingFile]      = useState(null);
    const [showDeleteAll, setShowDeleteAll]    = useState(false);
    const [isDeletingAll, setIsDeletingAll]    = useState(false);
    const [searchQuery, setSearchQuery]        = useState('');
    const [sortBy, setSortBy]                  = useState('date_desc');
    const [selectedBackups, setSelectedBackups]= useState(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // ─── Computed list ───────────────────────────────────────────
    const displayedBackups = useMemo(() => {
        let list = [...backups];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(b => b.name.toLowerCase().includes(q));
        }

        switch (sortBy) {
            case 'date_asc':  list.sort((a,b) => a.timestamp - b.timestamp); break;
            case 'date_desc': list.sort((a,b) => b.timestamp - a.timestamp); break;
            case 'size_asc':  list.sort((a,b) => a.size_bytes - b.size_bytes); break;
            case 'size_desc': list.sort((a,b) => b.size_bytes - a.size_bytes); break;
            case 'name_asc':  list.sort((a,b) => a.name.localeCompare(b.name));  break;
            default: break;
        }

        return list;
    }, [backups, searchQuery, sortBy]);

    const allSelected = displayedBackups.length > 0 &&
        displayedBackups.every(b => selectedBackups.has(b.name));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedBackups(new Set());
        } else {
            setSelectedBackups(new Set(displayedBackups.map(b => b.name)));
        }
    };

    const toggleSelect = (name) => {
        const next = new Set(selectedBackups);
        next.has(name) ? next.delete(name) : next.add(name);
        setSelectedBackups(next);
    };

    // ─── Actions ─────────────────────────────────────────────────
    const handleCreateBackup = () => {
        setIsGenerating(true);
        post(route('admin.backups.store'), {
            preserveScroll: true,
            onSuccess: (page) => {
                setIsGenerating(false);
                const flash = page.props.flash || {};
                if (flash.error) {
                    Swal.fire({ icon:'error', title:'تعذر إنشاء النسخة', text: flash.error,
                        confirmButtonText:'حسناً', confirmButtonColor:'#ef4444' });
                } else {
                    Swal.fire({ icon:'success', title: flash.success || 'تم إنشاء النسخة بنجاح!',
                        toast:true, position:'top-end', showConfirmButton:false, timer:4000,
                        timerProgressBar:true });
                }
            },
            onError: () => {
                setIsGenerating(false);
                Swal.fire({ icon:'error', title:'خطأ في الاتصال', text:'فشل الاتصال بالخادم، حاول مجدداً.',
                    confirmButtonText:'حسناً', confirmButtonColor:'#ef4444' });
            }
        });
    };

    const handleDelete = (filename) => {
        setDeletingFile(filename);
        Swal.fire({
            title: 'تأكيد الحذف',
            html: `<p class="text-sm text-slate-600">هل أنت متأكد من حذف النسخة الاحتياطية؟</p>
                   <code class="mt-2 block text-xs font-mono bg-slate-100 rounded-lg p-2 text-slate-700">${filename}</code>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذف!',
            cancelButtonText: 'إلغاء',
            customClass: { popup: 'font-[inherit]' }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.backups.destroy', filename), {
                    preserveScroll: true,
                    onSuccess: () => {
                        setDeletingFile(null);
                        setSelectedBackups(prev => { const n = new Set(prev); n.delete(filename); return n; });
                        Swal.fire({ icon:'success', title:'تم الحذف', toast:true,
                            position:'top-end', showConfirmButton:false, timer:3000, timerProgressBar:true });
                    },
                    onError: () => setDeletingFile(null)
                });
            } else {
                setDeletingFile(null);
            }
        });
    };

    const handleDeleteAll = () => {
        setIsDeletingAll(true);
        router.delete(route('admin.backups.destroy-all'), {
            preserveScroll: true,
            onSuccess: (page) => {
                setIsDeletingAll(false);
                setShowDeleteAll(false);
                setSelectedBackups(new Set());
                const flash = page.props.flash || {};
                Swal.fire({ icon:'success', title: flash.success || 'تم حذف الكل',
                    toast:true, position:'top-end', showConfirmButton:false, timer:3000, timerProgressBar:true });
            },
            onError: () => { setIsDeletingAll(false); setShowDeleteAll(false); }
        });
    };

    const handleBulkDelete = () => {
        if (selectedBackups.size === 0) return;
        Swal.fire({
            title: `حذف ${selectedBackups.size} نسخة`,
            text: 'هل أنت متأكد من حذف النسخ المحددة؟ لا يمكن التراجع.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذف المحدد',
            cancelButtonText: 'إلغاء'
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            setIsBulkDeleting(true);
            const names = [...selectedBackups];
            let deleted = 0;
            for (const name of names) {
                await new Promise(resolve => {
                    router.delete(route('admin.backups.destroy', name), {
                        preserveScroll: true,
                        onSuccess: () => { deleted++; resolve(); },
                        onError: () => resolve()
                    });
                });
            }
            setSelectedBackups(new Set());
            setIsBulkDeleting(false);
            Swal.fire({ icon:'success', title:`تم حذف ${deleted} من ${names.length} نسخة`,
                toast:true, position:'top-end', showConfirmButton:false, timer:3000, timerProgressBar:true });
        });
    };

    // ─── Stats bar config ─────────────────────────────────────────
    const statCards = [
        { icon: Layers,       label: 'إجمالي النسخ',     value: stats.total_count ?? 0,         color: 'primary' },
        { icon: HardDrive,    label: 'إجمالي الحجم',     value: stats.total_size ?? '0 KB',     color: 'primary' },
        { icon: Clock,        label: 'آخر نسخة',         value: stats.latest_backup_age ?? '—', color: stats.latest_backup_age ? 'emerald' : 'amber' },
    ];

    return (
        <AdminLayout activeMenu="النسخ الاحتياطي">
            <Head title="إدارة النسخ الاحتياطي | لوحة تحكم النظام" />

            <div className="max-w-[100rem] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                {/* ══════════ HEADER ══════════ */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="40" className="fill-primary-500 opacity-30" />
                            <circle cx="600" cy="140" r="60" className="fill-primary-300 opacity-20" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0 shadow-sm border border-primary-50 dark:border-primary-500/20">
                                <Shield size={26} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    إدارة النسخ الاحتياطية
                                </h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 mt-1 text-sm font-semibold">
                                    نسخ احتياطية احترافية لقاعدة البيانات مع تتبع كامل وإدارة متقدمة
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {backups.length > 0 && (
                                <button
                                    onClick={() => setShowDeleteAll(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                >
                                    <Trash2 size={16} />
                                    <span>حذف الكل</span>
                                </button>
                            )}
                            <button
                                onClick={handleCreateBackup}
                                disabled={isGenerating}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 shadow-md hover:shadow-lg text-white
                                    ${isGenerating ? 'bg-primary-400 cursor-not-allowed' : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 hover:-translate-y-0.5'}`}
                            >
                                {isGenerating ? (
                                    <>
                                        <RotateCcw size={16} className="animate-spin" />
                                        <span>جاري الإنشاء...</span>
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle size={16} />
                                        <span>إنشاء نسخة الآن</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ══════════ STATS CARDS ══════════ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {statCards.map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0
                                ${color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                                  color === 'amber'   ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
                                                        'bg-primary-50 dark:bg-primary-500/10 text-primary-500'}`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
                                <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ══════════ INFO BANNER (no backups) ══════════ */}
                {backups.length === 0 && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
                        <AlertTriangle size={22} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">لا توجد نسخ احتياطية</p>
                            <p className="text-amber-700/80 dark:text-amber-400/80 text-xs mt-1">
                                لم يتم إنشاء أي نسخ احتياطية بعد. يُنصح بأخذ نسخة احتياطية بشكل منتظم لحماية بيانات النظام.
                            </p>
                        </div>
                    </div>
                )}

                {/* ══════════ TABLE SECTION ══════════ */}
                {backups.length > 0 && (
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">

                        {/* Table Toolbar */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl">
                                    <Archive size={18} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm">
                                        سجل النسخ الاحتياطية
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {displayedBackups.length} نسخة {searchQuery ? `(نتيجة البحث)` : ''}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Search */}
                                <div className="relative">
                                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="بحث عن نسخة..."
                                        className="pr-9 pl-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 w-52 transition-all"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>

                                {/* Sort */}
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                                >
                                    <option value="date_desc">الأحدث أولاً</option>
                                    <option value="date_asc">الأقدم أولاً</option>
                                    <option value="size_desc">الأكبر حجماً</option>
                                    <option value="size_asc">الأصغر حجماً</option>
                                    <option value="name_asc">أبجدياً</option>
                                </select>
                            </div>
                        </div>

                        {/* Bulk Actions Bar */}
                        {selectedBackups.size > 0 && (
                            <div className="px-5 py-3 bg-primary-50 dark:bg-primary-500/10 border-b border-primary-100 dark:border-primary-500/20 flex items-center justify-between gap-4">
                                <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                                    تم تحديد {selectedBackups.size} نسخة
                                </span>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isBulkDeleting}
                                    className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                                >
                                    {isBulkDeleting ? <RotateCcw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    <span>حذف المحدد</span>
                                </button>
                            </div>
                        )}

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 font-bold">
                                    <tr>
                                        <th className="px-5 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={toggleSelectAll}
                                                className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                                            />
                                        </th>
                                        <th className="px-5 py-4 text-right">اسم الملف</th>
                                        <th className="px-5 py-4">الحجم</th>
                                        <th className="px-5 py-4">تاريخ الإنشاء</th>
                                        <th className="px-5 py-4">المدة المنقضية</th>
                                        <th className="px-5 py-4 text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {displayedBackups.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-5 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                                    <ServerCrash size={40} className="opacity-30" />
                                                    <p className="font-bold text-sm">لا توجد نتائج للبحث</p>
                                                    <button onClick={() => setSearchQuery('')} className="text-xs text-primary-500 hover:underline">
                                                        مسح البحث
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        displayedBackups.map((backup, index) => {
                                            const isSelected  = selectedBackups.has(backup.name);
                                            const isDeleting  = deletingFile === backup.name;
                                            const isLatest    = index === 0 && sortBy === 'date_desc';

                                            return (
                                                <tr
                                                    key={backup.name}
                                                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group ${isSelected ? 'bg-primary-50/50 dark:bg-primary-500/5' : ''}`}
                                                >
                                                    <td className="px-5 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelect(backup.name)}
                                                            className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                                                        />
                                                    </td>

                                                    {/* File Name */}
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                                                                <Database size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs dir-ltr text-left">
                                                                    {backup.name}
                                                                </p>
                                                                {isLatest && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1">
                                                                        <CheckCircle2 size={9} />
                                                                        الأحدث
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Size */}
                                                    <td className="px-5 py-4">
                                                        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg dir-ltr inline-block">
                                                            {backup.size}
                                                        </span>
                                                    </td>

                                                    {/* Date */}
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                            <Calendar size={13} className="text-slate-400" />
                                                            <span className="dir-ltr">{backup.date}</span>
                                                        </div>
                                                    </td>

                                                    {/* Age */}
                                                    <td className="px-5 py-4">
                                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                            {backup.age}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-5 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <a
                                                                href={route('admin.backups.download', backup.name)}
                                                                title="تحميل النسخة"
                                                                className="h-8 w-8 flex items-center justify-center rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors ring-1 ring-emerald-500/20"
                                                            >
                                                                <Download size={15} />
                                                            </a>
                                                            <button
                                                                onClick={() => handleDelete(backup.name)}
                                                                disabled={isDeleting}
                                                                title="حذف النسخة"
                                                                className="h-8 w-8 flex items-center justify-center rounded-xl text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors ring-1 ring-red-500/20 disabled:opacity-50"
                                                            >
                                                                {isDeleting
                                                                    ? <RotateCcw size={13} className="animate-spin" />
                                                                    : <Trash2 size={15} />
                                                                }
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
                            <span>
                                عرض {displayedBackups.length} من {backups.length} نسخة
                            </span>
                            {stats.backup_directory && (
                                <span className="font-mono text-[11px] opacity-60 dir-ltr">
                                    {stats.backup_directory}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════ TIPS SECTION ══════════ */}
                <div className="bg-primary-50/50 dark:bg-primary-500/5 border border-primary-100 dark:border-primary-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Info size={16} className="text-primary-500" />
                        <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">نصائح لإدارة النسخ الاحتياطية</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: RefreshCw,     title: 'أخذ نسخة يومية',    desc: 'يُنصح بأخذ نسخة احتياطية يومياً على الأقل لضمان سلامة البيانات.' },
                            { icon: HardDrive,     title: 'حفظ خارجي',         desc: 'قم بتحميل النسخ وحفظها في مكان خارجي (سحابي أو USB) بشكل منتظم.' },
                            { icon: CheckCircle2,  title: 'تنظيف دوري',        desc: 'احتفظ بآخر 7-10 نسخ فقط وقم بحذف القديمة لتوفير مساحة التخزين.' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0 mt-0.5">
                                    <Icon size={15} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-700 dark:text-slate-300">{title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════════ DELETE ALL MODAL ══════════ */}
            <Modal show={showDeleteAll} onClose={() => !isDeletingAll && setShowDeleteAll(false)} maxWidth="sm">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-white">حذف جميع النسخ</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">إجراء لا يمكن التراجع عنه</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        هل أنت متأكد من حذف جميع النسخ الاحتياطية ({backups.length} نسخة)؟
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-xl mb-5">
                        ⚠️ تحذير: لن تتمكن من استعادة هذه النسخ بعد الحذف.
                    </p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowDeleteAll(false)} disabled={isDeletingAll}>
                            إلغاء
                        </SecondaryButton>
                        <DangerButton onClick={handleDeleteAll} disabled={isDeletingAll}>
                            {isDeletingAll ? (
                                <span className="flex items-center gap-2"><RotateCcw size={14} className="animate-spin" /> جاري الحذف...</span>
                            ) : (
                                'نعم، احذف الكل'
                            )}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
