import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import SelectInput from '@/Components/SelectInput';
import { 
    Search, FileText, Download, Filter, 
    BookOpen, Layers, Sparkles, FolderOpen, 
    ChevronDown, RotateCcw, LayoutGrid, 
    Table2, User, Clock, Eye, Video, 
    Presentation, MousePointerClick, Headphones, 
    Bookmark, Star, CheckCircle2
} from 'lucide-react';
import ChildSelector from '@/Components/ChildSelector';

export default function StudentLibrary({ auth, items, subjects, stats, filters, children, activeChildId }) {
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
    const [filterSubject, setFilterSubject] = useState(filters?.subject_id || 'all');
    const [filterType, setFilterType] = useState(filters?.type || 'all');
    const [searchValue, setSearchValue] = useState(filters?.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);

    const hasActiveFilters = filterSubject !== 'all' || filterType !== 'all' || searchValue !== '';

    const applyFilters = (overrides = {}) => {
        router.get(route('student.library'), {
            search: overrides.search !== undefined ? overrides.search : searchValue,
            subject_id: overrides.subject_id !== undefined ? overrides.subject_id : filterSubject === 'all' ? '' : filterSubject,
            type: overrides.type !== undefined ? overrides.type : filterType === 'all' ? '' : filterType,
        }, { preserveState: true, replace: true });
    };

    const resetAllFilters = () => {
        setSearchValue('');
        setFilterSubject('all');
        setFilterType('all');
        router.get(route('student.library'), {}, { preserveState: true, replace: true });
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFilters();
        }
    };

    const handleBookmark = (item) => {
        router.post(route('digital.bookmark', item.id), {}, { preserveScroll: true });
    };

    const itemsData = items?.data || [];

    const getItemIcon = (type) => {
        switch (type) {
            case 'video': return <Video size={24} strokeWidth={2} className="text-rose-500" />;
            case 'audio': return <Headphones size={24} strokeWidth={2} className="text-purple-500" />;
            case 'presentation': return <Presentation size={24} strokeWidth={2} className="text-amber-500" />;
            case 'interactive': return <MousePointerClick size={24} strokeWidth={2} className="text-emerald-500" />;
            case 'pdf':
            default: return <FileText size={24} strokeWidth={2} className="text-primary-500" />;
        }
    };

    const getCategoryLabel = (cat) => {
        switch(cat) {
            case 'review': return 'مراجعة نهائية';
            case 'worksheet': return 'ورقة عمل';
            case 'explanation': return 'شرح وملخص';
            case 'enrichment': return 'إثراء';
            default: return 'عام';
        }
    };

    return (
        <AdminLayout user={auth.user} activeMenu="المكتبة الرقمية">
            <Head title="مكتبتي الرقمية" />

            <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 pb-24 animate-fade-in">
                <ChildSelector children={children} activeChildId={activeChildId} />

                {/* Modern Header Section */}
                <div className="relative overflow-hidden bg-white dark:bg-[#121820]/95 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-800" />
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-700/50 shadow-inner">
                                <BookOpen size={32} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">مكتبتي الرقمية</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
                                    ملفاتك، مراجعاتك، وشروحات دروسك جاهزة للتحميل! 🚀
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                            <div className="text-center px-4 border-l border-slate-200 dark:border-slate-700">
                                <p className="text-sm font-bold text-slate-500 mb-1">إجمالي المراجع</p>
                                <div className="flex items-center justify-center gap-2">
                                    <FolderOpen size={24} className="text-primary-500" />
                                    <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.total}</span>
                                </div>
                            </div>
                            <div className="text-center px-4">
                                <p className="text-sm font-bold text-slate-500 mb-1">المحفوظات (المفضلة)</p>
                                <div className="flex items-center justify-center gap-2">
                                    <Bookmark size={24} className="text-amber-500" />
                                    <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.bookmarked}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-5 sm:p-6 mb-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-xl group">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                <Search size={22} strokeWidth={2.5} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="ابحث بعنوان المورد أو الدرس..."
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pr-14 py-4 text-base focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white font-bold"
                                value={searchValue} 
                                onChange={e => setSearchValue(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold transition-all border ${
                                    showFilters || hasActiveFilters
                                        ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/30'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Filter size={20} />
                                <span>تصفية</span>
                                <ChevronDown size={18} className={`transform transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                            </button>

                            {hasActiveFilters && (
                                <button 
                                    onClick={resetAllFilters}
                                    className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-100 dark:border-rose-500/10"
                                >
                                    <RotateCcw size={18} />
                                    <span className="hidden sm:inline">إلغاء الفلتر</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? 'mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 opacity-100 max-h-[500px]' : 'max-h-0 opacity-0 m-0 p-0 border-none'}`}>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">تصفية حسب المادة</label>
                            <SelectInput 
                                value={filterSubject} 
                                onChange={val => { setFilterSubject(val); applyFilters({ subject_id: val }); }}
                                options={[
                                    { value: 'all', label: 'كل المواد الدراسية' },
                                    ...(subjects?.map(s => ({ value: s.id, label: s.name })) || [])
                                ]}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">نوع المحتوى</label>
                            <SelectInput 
                                value={filterType} 
                                onChange={val => { setFilterType(val); applyFilters({ type: val }); }}
                                options={[
                                    { value: 'all', label: 'الكل' },
                                    { value: 'pdf', label: 'ملف PDF / ملزمة' },
                                    { value: 'video', label: 'فيديو شرح' },
                                    { value: 'presentation', label: 'عرض تقديمي' },
                                    { value: 'interactive', label: 'تفاعلي' },
                                    { value: 'audio', label: 'صوتي' },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center justify-end gap-2 mb-6">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                            viewMode === 'cards'
                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-500/30'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <LayoutGrid size={16} />
                        <span>بطاقات</span>
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                            viewMode === 'table'
                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-500/30'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Table2 size={16} />
                        <span>جدول</span>
                    </button>
                </div>

                {/* Content */}
                {itemsData.length === 0 ? (
                    <div className="bg-white dark:bg-[#1e293b] border border-dashed border-slate-200 dark:border-slate-700 rounded-[3rem] p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Sparkles className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">لا توجد موارد حالياً</h3>
                        <p className="text-slate-500 max-w-sm mb-8 leading-relaxed font-medium">
                            لم يتم رفع مراجع أو ملفات خاصة بصفك الدراسي حتى الآن، أو لا توجد نتائج مطابقة لبحثك.
                        </p>
                        {hasActiveFilters && (
                            <button onClick={resetAllFilters} className="px-8 py-3 bg-primary-50 text-primary-700 font-bold rounded-2xl hover:bg-primary-100 transition-colors">
                                عرض الكل
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === 'cards' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {itemsData.map(item => (
                                    <div key={item.id} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                                        
                                        {/* Thumbnail Cover */}
                                        <div className="relative w-full h-40 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4 border border-slate-200/50 dark:border-slate-700/50 group-hover:border-primary-500/30 transition-colors">
                                            {item.thumbnail_path ? (
                                                <img src={`/storage/${item.thumbnail_path}`} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                                                    {React.cloneElement(getItemIcon(item.item_type), { size: 40, className: "opacity-30 mb-2" })}
                                                </div>
                                            )}
                                            
                                            {/* Action Badges over Thumbnail */}
                                            <div className="absolute top-3 left-3 z-10">
                                                <button 
                                                    onClick={() => handleBookmark(item)}
                                                    className={`p-2 rounded-xl backdrop-blur-md transition-all shadow-sm ${item.is_bookmarked_by_user ? 'bg-amber-500/90 text-white' : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-amber-500'}`}
                                                >
                                                    <Bookmark size={18} fill={item.is_bookmarked_by_user ? "currentColor" : "none"} />
                                                </button>
                                            </div>
                                            <div className="absolute top-3 right-3 z-10">
                                                <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center shadow-sm">
                                                    {React.cloneElement(getItemIcon(item.item_type), { size: 16 })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-3 flex gap-2 px-2 relative z-10">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-[11px] font-bold border border-primary-100/50">
                                                {item.subject?.name}
                                            </span>
                                            {item.category && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold border border-slate-200/50">
                                                    {getCategoryLabel(item.category)}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 px-2 leading-tight relative z-10 line-clamp-2 min-h-[3rem]">
                                            {item.title}
                                        </h3>

                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold px-2 mb-4 relative z-10">
                                            <User size={14} />
                                            <span className="truncate">{item.uploader?.name || 'المدرسة'}</span>
                                        </div>

                                        <div className="relative z-10 mt-auto px-2 pb-2">
                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                                <a 
                                                    href={item.file_path ? `/storage/${item.file_path}` : item.external_url} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    {...(item.file_path ? { download: true } : {})}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 text-sm font-bold transition-all shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 active:scale-95"
                                                >
                                                    <Download size={16} /> تحميل
                                                </a>
                                                {item.file_path && (item.item_type === 'video' || item.item_type === 'audio' || item.file_path.toLowerCase().endsWith('.pdf')) && (
                                                    <button 
                                                        onClick={() => setPreviewItem(item)}
                                                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                        title="عرض مباشر"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                                <th className="px-6 py-5 text-sm font-black text-slate-500">العنوان والتصنيف</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500">المادة</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500">بواسطة</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 text-left">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {itemsData.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 overflow-hidden">
                                                                {item.thumbnail_path ? (
                                                                    <img src={`/storage/${item.thumbnail_path}`} alt={item.title} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    React.cloneElement(getItemIcon(item.item_type), { size: 24 })
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 dark:text-white text-base">{item.title}</span>
                                                                <span className="text-xs font-bold text-slate-500 mt-1">{getCategoryLabel(item.category)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-sm font-bold border border-primary-100 dark:border-primary-800/50">
                                                            {item.subject?.name}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                            <User size={16} className="text-slate-400" /> {item.uploader?.name || 'المدرسة'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-left">
                                                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => handleBookmark(item)}
                                                                className={`p-2.5 rounded-xl transition-all shadow-sm ${item.is_bookmarked_by_user ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' : 'bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50 border border-slate-100'}`}
                                                            >
                                                                <Bookmark size={20} fill={item.is_bookmarked_by_user ? "currentColor" : "none"} />
                                                            </button>
                                                            <a 
                                                                href={item.file_path ? `/storage/${item.file_path}` : item.external_url} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                {...(item.file_path ? { download: true } : {})}
                                                                className="px-4 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-bold transition-all shadow-sm flex items-center gap-2"
                                                            >
                                                                <Download size={18} /> تحميل
                                                            </a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        {items?.links && (
                            <div className="mt-8 flex justify-center">
                                <Pagination links={items.links} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
